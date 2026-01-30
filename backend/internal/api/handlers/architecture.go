package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/yourusername/visualization-backend/internal/database"
	"github.com/yourusername/visualization-backend/internal/database/models"
)

type ArchitectureHandler struct {
	repo *database.Repository
}

func NewArchitectureHandler(repo *database.Repository) *ArchitectureHandler {
	return &ArchitectureHandler{repo: repo}
}

// SaveArchitecture handles POST /api/architectures (create new) and PUT /api/architectures/:id (update)
func (h *ArchitectureHandler) SaveArchitecture(c *fiber.Ctx) error {
	userIDStr := c.Locals("userID").(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid user ID",
		})
	}
	
	// Get user to check subscription tier
	user, err := h.repo.GetUserByID(userIDStr)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get user info",
		})
	}
	
	var req struct {
		ID          *string                `json:"id,omitempty"`
		ScenarioID  *string                `json:"scenario_id,omitempty"`
		Title       string                 `json:"title"`
		Description *string                `json:"description,omitempty"`
		CanvasData  models.CanvasData      `json:"canvas_data"`
		IsSubmitted bool                   `json:"is_submitted"`
	}
	
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}
	
	// Validate required fields
	if req.Title == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Title is required",
		})
	}
	
	// Check limits for new architectures only
	if req.ID == nil || *req.ID == "" {
		if req.ScenarioID == nil {
			// Standalone canvas limit check
			maxStandalone := user.MaxStandaloneCanvases()
			if maxStandalone > 0 { // Only check if there's a limit
				count, err := h.repo.CountStandaloneArchitectures(c.Context(), userID)
				if err != nil {
					return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
						"error": "Failed to check quota",
					})
				}
				
				if count >= maxStandalone {
					return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
						"error":   "You have reached the maximum number of standalone canvases. Upgrade to Premium for unlimited canvases.",
						"premium": true,
						"tier": user.SubscriptionTier,
						"quota": fiber.Map{
							"used":  count,
							"limit": maxStandalone,
						},
					})
				}
			}
		} else {
			// Scenario architecture limit check
			maxPerScenario := user.MaxArchitecturesPerScenario()
			if maxPerScenario > 0 { // Only check if there's a limit
				count, err := h.repo.CountArchitecturesByScenario(c.Context(), userID, *req.ScenarioID)
				if err != nil {
					return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
						"error": "Failed to check quota",
					})
				}
				
				if count >= maxPerScenario {
					return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
						"error":   "You have reached the maximum number of architectures for this scenario. Upgrade to Premium for unlimited architectures per scenario.",
						"premium": true,
						"tier": user.SubscriptionTier,
						"quota": fiber.Map{
							"used":  count,
							"limit": maxPerScenario,
						},
					})
				}
			}
		}
	}
	
	// Check if update or create
	if req.ID != nil && *req.ID != "" {
		// Update existing architecture
		archID, err := uuid.Parse(*req.ID)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid architecture ID",
			})
		}
		
		arch := &models.Architecture{
			ID:          archID,
			UserID:      userID,
			ScenarioID:  req.ScenarioID,
			Title:       req.Title,
			Description: req.Description,
			CanvasData:  req.CanvasData,
			IsSubmitted: req.IsSubmitted,
		}
		
		if err := h.repo.UpdateArchitecture(c.Context(), arch); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to update architecture",
			})
		}
		
		return c.JSON(fiber.Map{
			"message":      "Architecture updated successfully",
			"architecture": arch,
		})
	} else {
		// Create new architecture
		arch := &models.Architecture{
			UserID:      userID,
			ScenarioID:  req.ScenarioID,
			Title:       req.Title,
			Description: req.Description,
			CanvasData:  req.CanvasData,
			IsSubmitted: req.IsSubmitted,
		}
		
		if err := h.repo.CreateArchitecture(c.Context(), arch); err != nil{
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to save architecture",
			})
		}
		
		return c.Status(fiber.StatusCreated).JSON(fiber.Map{
			"message":      "Architecture saved successfully",
			"architecture": arch,
		})
	}
}

// GetArchitecture handles GET /api/architectures/:id
func (h *ArchitectureHandler) GetArchitecture(c *fiber.Ctx) error {
	userIDStr := c.Locals("userID").(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid user ID",
		})
	}
	
	archID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid architecture ID",
		})
	}
	
	arch, err := h.repo.GetArchitectureByID(c.Context(), archID, userID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Architecture not found",
		})
	}
	
	return c.JSON(arch)
}

// GetUserArchitectures handles GET /api/architectures
func (h *ArchitectureHandler) GetUserArchitectures(c *fiber.Ctx) error {
	userIDStr := c.Locals("userID").(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid user ID",
		})
	}
	
	limit := c.QueryInt("limit", 20)
	offset := c.QueryInt("offset", 0)
	scenarioID := c.Query("scenario_id")
	standaloneOnly := c.Query("standalone") == "true" // New parameter
	
	var architectures []models.ArchitectureListItem
	
	if scenarioID != "" {
		// Get architectures for a specific scenario
		architectures, err = h.repo.GetArchitecturesByScenario(c.Context(), userID, scenarioID)
	} else if standaloneOnly {
		// Get only standalone architectures (no scenario_id)
		architectures, err = h.repo.GetStandaloneArchitectures(c.Context(), userID, limit, offset)
	} else {
		// Get all architectures
		architectures, err = h.repo.GetUserArchitectures(c.Context(), userID, limit, offset)
	}
	
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to retrieve architectures",
		})
	}
	
	if architectures == nil {
		architectures = []models.ArchitectureListItem{}
	}
	
	return c.JSON(fiber.Map{
		"architectures": architectures,
		"total":         len(architectures),
	})
}

// DeleteArchitecture handles DELETE /api/architectures/:id
func (h *ArchitectureHandler) DeleteArchitecture(c *fiber.Ctx) error {
	userIDStr := c.Locals("userID").(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid user ID",
		})
	}
	
	archID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid architecture ID",
		})
	}
	
	if err := h.repo.DeleteArchitecture(c.Context(), archID, userID); err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Architecture not found",
		})
	}
	
	return c.JSON(fiber.Map{
		"message": "Architecture deleted successfully",
	})
}

// GetFeatureLimits returns the user's feature limits based on subscription tier
func (h *ArchitectureHandler) GetFeatureLimits(c *fiber.Ctx) error {
	userIDStr := c.Locals("userID").(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid user ID",
		})
	}
	
	// Get user to check subscription tier
	user, err := h.repo.GetUserByID(userIDStr)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get user info",
		})
	}
	
	// Get current usage
	standaloneCount, _ := h.repo.CountStandaloneArchitectures(c.Context(), userID)
	
	// Build limits response
	maxStandalone := user.MaxStandaloneCanvases()
	maxPerScenario := user.MaxArchitecturesPerScenario()
	
	limits := fiber.Map{
		"subscription_tier": user.SubscriptionTier,
		"standalone_canvases": fiber.Map{
			"limit":     maxStandalone,
			"used":      standaloneCount,
			"unlimited": maxStandalone == -1,
		},
		"architectures_per_scenario": fiber.Map{
			"limit":     maxPerScenario,
			"unlimited": maxPerScenario == -1,
		},
		"collaboration": fiber.Map{
			"enabled_on_scenarios":   !user.IsFreeUser(),
			"enabled_on_canvases":    true,
		},
	}
	
	return c.JSON(limits)
}

// CheckCollaborationAccess checks if user can access collaboration for a specific architecture
func (h *ArchitectureHandler) CheckCollaborationAccess(c *fiber.Ctx) error {
	userIDStr := c.Locals("userID").(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid user ID",
		})
	}
	
	archID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid architecture ID",
		})
	}
	
	// Get architecture
	arch, err := h.repo.GetArchitectureByID(c.Context(), archID, userID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Architecture not found",
		})
	}
	
	// Get user to check subscription tier
	user, err := h.repo.GetUserByID(userIDStr)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get user info",
		})
	}
	
	isScenarioArchitecture := arch.ScenarioID != nil
	canCollaborate := user.CanAccessCollaboration(isScenarioArchitecture)
	
	return c.JSON(fiber.Map{
		"can_collaborate": canCollaborate,
		"is_scenario_architecture": isScenarioArchitecture,
		"subscription_tier": user.SubscriptionTier,
		"reason": func() string {
			if canCollaborate {
				return "allowed"
			}
			if isScenarioArchitecture {
				return "free_users_cannot_collaborate_on_scenario_architectures"
			}
			return "unknown"
		}(),
	})
}
