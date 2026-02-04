package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/yourusername/visualization-backend/internal/database"
)

// AdminHandler handles admin endpoints
type AdminHandler struct {
	repo *database.Repository
}

// NewAdminHandler creates a new admin handler
func NewAdminHandler(repo *database.Repository) *AdminHandler {
	return &AdminHandler{
		repo: repo,
	}
}

// GetAllUsers returns all users (admin only)
// GET /admin/users
func (h *AdminHandler) GetAllUsers(c *fiber.Ctx) error {
	users, err := h.repo.GetAllUsers()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get users",
		})
	}

	// Convert to profiles (hide sensitive data)
	profiles := make([]fiber.Map, len(users))
	for i, user := range users {
		profiles[i] = fiber.Map{
			"id":                user.ID,
			"email":             user.Email,
			"name":              user.Name,
			"avatar_url":        user.AvatarURL,
			"subscription_tier": user.SubscriptionTier,
			"provider":          user.Provider,
			"last_login_at":     user.LastLoginAt,
			"created_at":        user.CreatedAt,
		}
	}

	return c.JSON(fiber.Map{
		"users": profiles,
		"total": len(profiles),
	})
}

// UpdateUserSubscriptionTier updates a user's subscription tier (admin only)
// PUT /admin/users/:id/subscription
func (h *AdminHandler) UpdateUserSubscriptionTier(c *fiber.Ctx) error {
	userID := c.Params("id")

	var req struct {
		SubscriptionTier string `json:"subscription_tier"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Validate tier
	if req.SubscriptionTier != "free" && req.SubscriptionTier != "premium" && req.SubscriptionTier != "admin" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid subscription tier. Must be free, premium, or admin",
		})
	}

	// Update tier
	if err := h.repo.UpdateUserSubscriptionTier(userID, req.SubscriptionTier); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update subscription tier",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Subscription tier updated successfully",
	})
}
