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
			"id":            user.ID,
			"email":         user.Email,
			"name":          user.Name,
			"avatar_url":    user.AvatarURL,
			"role":          user.Role,
			"provider":      user.Provider,
			"last_login_at": user.LastLoginAt,
			"created_at":    user.CreatedAt,
		}
	}

	return c.JSON(fiber.Map{
		"users": profiles,
		"total": len(profiles),
	})
}

// UpdateUserRole updates a user's role (admin only)
// PUT /admin/users/:id/role
func (h *AdminHandler) UpdateUserRole(c *fiber.Ctx) error {
	userID := c.Params("id")
	
	var req struct {
		Role string `json:"role"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Validate role
	if req.Role != "basic" && req.Role != "pro" && req.Role != "admin" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid role. Must be basic, pro, or admin",
		})
	}

	// Update role
	if err := h.repo.UpdateUserRole(userID, req.Role); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update role",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Role updated successfully",
	})
}
