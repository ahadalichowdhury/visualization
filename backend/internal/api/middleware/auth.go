package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/yourusername/visualization-backend/internal/auth"
)

// AuthMiddleware validates JWT tokens
func AuthMiddleware(jwtService *auth.JWTService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Get Authorization header
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Missing authorization token",
			})
		}

		// Extract token from "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid authorization format",
			})
		}

		token := parts[1]

		// Validate token
		claims, err := jwtService.ValidateToken(token)
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid or expired token",
			})
		}

		// Store user info in context
		c.Locals("userID", claims.UserID)
		c.Locals("userEmail", claims.Email)
		c.Locals("subscriptionTier", claims.SubscriptionTier)

		return c.Next()
	}
}

// RequireSubscriptionTier middleware checks if user has required subscription tier
func RequireSubscriptionTier(allowedTiers ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userTier, ok := c.Locals("subscriptionTier").(string)
		if !ok {
			userTier = "free" // Default to free if not set
		}

		// Check if user tier is in allowed tiers
		for _, tier := range allowedTiers {
			if userTier == tier {
				return c.Next()
			}
		}

		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error":        "This feature requires a premium subscription",
			"premium":      true,
			"current_tier": userTier,
		})
	}
}

// RequireFeatureAccess middleware checks specific feature access
type FeatureCheck func(c *fiber.Ctx) (bool, string)

func RequireFeatureAccess(check FeatureCheck) fiber.Handler {
	return func(c *fiber.Ctx) error {
		allowed, errorMsg := check(c)
		if !allowed {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error":   errorMsg,
				"premium": true,
			})
		}
		return c.Next()
	}
}
