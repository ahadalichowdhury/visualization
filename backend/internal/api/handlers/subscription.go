package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/yourusername/visualization-backend/internal/database"
)

// SubscriptionHandler handles subscription plan endpoints
type SubscriptionHandler struct {
	repo *database.Repository
}

// NewSubscriptionHandler creates a new subscription handler
func NewSubscriptionHandler(repo *database.Repository) *SubscriptionHandler {
	return &SubscriptionHandler{repo: repo}
}

// GetAllPlans returns all active subscription plans
// GET /api/subscription/plans
func (h *SubscriptionHandler) GetAllPlans(c *fiber.Ctx) error {
	plans, err := h.repo.GetAllSubscriptionPlans()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch subscription plans",
		})
	}

	// Get current user's tier if authenticated
	currentTier := "free" // default
	if userID := c.Locals("userID"); userID != nil {
		if userIDStr, ok := userID.(string); ok {
			user, err := h.repo.GetUserByID(userIDStr)
			if err == nil && user != nil {
				currentTier = user.SubscriptionTier
			}
		}
	}

	// Convert to response format
	responses := make([]interface{}, len(plans))
	for i, plan := range plans {
		responses[i] = plan.ToResponse(currentTier)
	}

	return c.JSON(fiber.Map{
		"plans":        responses,
		"current_tier": currentTier,
	})
}

// GetPlanByName returns a specific subscription plan
// GET /api/subscription/plans/:name
func (h *SubscriptionHandler) GetPlanByName(c *fiber.Ctx) error {
	planName := c.Params("name")
	if planName == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Plan name is required",
		})
	}

	plan, err := h.repo.GetSubscriptionPlanByName(planName)
	if err != nil {
		if err.Error() == "subscription plan not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Subscription plan not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch subscription plan",
		})
	}

	// Get current user's tier if authenticated
	currentTier := "free"
	if userID := c.Locals("userID"); userID != nil {
		if userIDStr, ok := userID.(string); ok {
			user, err := h.repo.GetUserByID(userIDStr)
			if err == nil && user != nil {
				currentTier = user.SubscriptionTier
			}
		}
	}

	return c.JSON(plan.ToResponse(currentTier))
}
