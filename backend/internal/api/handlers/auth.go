package handlers

import (
	"errors"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/yourusername/visualization-backend/internal/auth"
	"github.com/yourusername/visualization-backend/internal/database"
)

// AuthHandler handles authentication endpoints
type AuthHandler struct {
	authService *auth.Service
}

// NewAuthHandler creates a new auth handler
func NewAuthHandler(authService *auth.Service) *AuthHandler {
	return &AuthHandler{
		authService: authService,
	}
}

// Signup handles user registration
// POST /auth/signup
func (h *AuthHandler) Signup(c *fiber.Ctx) error {
	var req auth.SignupRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Trim whitespace
	req.Email = strings.TrimSpace(req.Email)
	if req.Name != nil {
		trimmed := strings.TrimSpace(*req.Name)
		req.Name = &trimmed
	}

	response, err := h.authService.Signup(req)
	if err != nil {
		switch {
		case errors.Is(err, auth.ErrInvalidEmail):
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid email format",
			})
		case errors.Is(err, auth.ErrWeakPassword):
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Password must be at least 6 characters",
			})
		case errors.Is(err, auth.ErrEmailExists):
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "Email already in use",
			})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to create account",
			})
		}
	}

	return c.Status(fiber.StatusCreated).JSON(response)
}

// Login handles user authentication
// POST /auth/login
func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req auth.LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	req.Email = strings.TrimSpace(req.Email)

	response, err := h.authService.Login(req)
	if err != nil {
		if errors.Is(err, auth.ErrInvalidCredentials) {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid email or password",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to login",
		})
	}

	return c.JSON(response)
}

// RequestPasswordReset handles password reset request
// POST /auth/password/forgot
func (h *AuthHandler) RequestPasswordReset(c *fiber.Ctx) error {
	var req struct {
		Email string `json:"email"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	req.Email = strings.TrimSpace(req.Email)

	token, err := h.authService.RequestPasswordReset(req.Email)
	if err != nil {
		// Log error but don't reveal to user
		return c.JSON(fiber.Map{
			"message": "If the email exists, a reset link has been sent",
		})
	}

	// In production, send email with token
	// For now, return token in response (ONLY FOR DEVELOPMENT)
	return c.JSON(fiber.Map{
		"message": "Password reset initiated",
		"token":   token, // Remove this in production
	})
}

// ResetPassword handles password reset with token
// POST /auth/password/reset
func (h *AuthHandler) ResetPassword(c *fiber.Ctx) error {
	var req struct {
		Token       string `json:"token"`
		NewPassword string `json:"new_password"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	err := h.authService.ResetPassword(req.Token, req.NewPassword)
	if err != nil {
		switch {
		case errors.Is(err, database.ErrInvalidToken):
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid or expired reset token",
			})
		case errors.Is(err, auth.ErrWeakPassword):
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Password must be at least 6 characters",
			})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to reset password",
			})
		}
	}

	return c.JSON(fiber.Map{
		"message": "Password reset successfully",
	})
}

// GetProfile returns current user profile
// GET /user/profile
func (h *AuthHandler) GetProfile(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)

	profile, err := h.authService.GetUserProfile(userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get profile",
		})
	}

	return c.JSON(profile)
}

// UpdateProfile updates user profile
// PUT /user/profile
func (h *AuthHandler) UpdateProfile(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)

	var req struct {
		Name      *string `json:"name"`
		AvatarURL *string `json:"avatar_url"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Trim whitespace
	if req.Name != nil {
		trimmed := strings.TrimSpace(*req.Name)
		req.Name = &trimmed
	}

	profile, err := h.authService.UpdateProfile(userID, req.Name, req.AvatarURL)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update profile",
		})
	}

	return c.JSON(profile)
}

// UpdateSubscriptionTier updates user subscription tier
// PUT /user/subscription
func (h *AuthHandler) UpdateSubscriptionTier(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)

	var req struct {
		SubscriptionTier string `json:"subscription_tier"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Validate tier
	req.SubscriptionTier = strings.ToLower(strings.TrimSpace(req.SubscriptionTier))
	if req.SubscriptionTier != "free" && req.SubscriptionTier != "premium" && req.SubscriptionTier != "admin" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid subscription tier. Must be 'free', 'premium', or 'admin'",
		})
	}

	profile, err := h.authService.UpdateSubscriptionTier(userID, req.SubscriptionTier)
	if err != nil {
		if err.Error() == "invalid subscription tier" || err.Error() == "unauthorized to set admin tier" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": err.Error(),
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update subscription",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Subscription updated successfully",
		"user":    profile,
	})
}

// OAuthGoogleCallback handles Google OAuth callback
// GET /auth/oauth/google/callback
func (h *AuthHandler) OAuthGoogleCallback(c *fiber.Ctx) error {
	// TODO: Implement Google OAuth flow
	// 1. Exchange code for access token
	// 2. Get user info from Google
	// 3. Call h.authService.OAuthSignup()
	return c.JSON(fiber.Map{
		"message": "Google OAuth not yet implemented",
	})
}

// OAuthGitHubCallback handles GitHub OAuth callback
// GET /auth/oauth/github/callback
func (h *AuthHandler) OAuthGitHubCallback(c *fiber.Ctx) error {
	// TODO: Implement GitHub OAuth flow
	// 1. Exchange code for access token
	// 2. Get user info from GitHub
	// 3. Call h.authService.OAuthSignup()
	return c.JSON(fiber.Map{
		"message": "GitHub OAuth not yet implemented",
	})
}
