package handlers

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/yourusername/visualization-backend/internal/database"
	"github.com/yourusername/visualization-backend/internal/database/models"
)

// ScenarioHandler handles scenario endpoints
type ScenarioHandler struct {
	repo *database.Repository
}

// NewScenarioHandler creates a new scenario handler
func NewScenarioHandler(repo *database.Repository) *ScenarioHandler {
	return &ScenarioHandler{
		repo: repo,
	}
}

// GetAllScenarios returns all active scenarios (filtered by user role)
// GET /scenarios
func (h *ScenarioHandler) GetAllScenarios(c *fiber.Ctx) error {
	// Get user role if authenticated, default to "free" if not
	userRole := "free"
	if c.Locals("userID") != nil {
		userRoleStr := c.Locals("userRole")
		if userRoleStr != nil {
			userRole = userRoleStr.(string)
		}
	}

	scenarios, err := h.repo.GetScenariosForUserRole(userRole)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch scenarios",
		})
	}

	return c.JSON(scenarios)
}

// GetScenariosPaginated returns scenarios with cursor-based pagination
// GET /scenarios/paginated?cursor=xyz&limit=10&category=X&difficulty=Y&tier=Z&search=W
func (h *ScenarioHandler) GetScenariosPaginated(c *fiber.Ctx) error {
	cursor := c.Query("cursor", "")
	limit := c.QueryInt("limit", 10)
	category := c.Query("category", "")
	difficulty := c.Query("difficulty", "")
	tier := c.Query("tier", "")
	search := c.Query("search", "")

	// Validate limit
	if limit < 1 || limit > 50 {
		limit = 10
	}

	scenarios, nextCursor, hasMore, err := h.repo.GetScenariosPaginated(cursor, limit, category, difficulty, tier, search)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch scenarios",
		})
	}

	return c.JSON(fiber.Map{
		"scenarios":  scenarios,
		"nextCursor": nextCursor,
		"hasMore":    hasMore,
	})
}

// GetScenarioByID returns a specific scenario by ID (with access control)
// GET /scenarios/:id
func (h *ScenarioHandler) GetScenarioByID(c *fiber.Ctx) error {
	scenarioID := c.Params("id")

	// Get user role if authenticated, default to "free" if not
	userRole := "free"
	if c.Locals("userID") != nil {
		userRoleStr := c.Locals("userRole")
		if userRoleStr != nil {
			userRole = userRoleStr.(string)
		}
	}

	// Check if user can access this scenario
	canAccess, err := h.repo.CanUserAccessScenario(userRole, scenarioID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Scenario not found",
		})
	}
	if !canAccess {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error":   "Access denied. This scenario requires a premium subscription.",
			"premium": true,
		})
	}

	scenario, err := h.repo.GetScenarioByID(scenarioID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Scenario not found",
		})
	}

	return c.JSON(scenario)
}

// SearchScenarios searches and filters scenarios
// GET /scenarios?category=X&difficulty=Y&search=Z
func (h *ScenarioHandler) SearchScenarios(c *fiber.Ctx) error {
	category := c.Query("category")
	difficulty := c.Query("difficulty")
	search := c.Query("search")

	scenarios, err := h.repo.SearchScenarios(category, difficulty, search)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to search scenarios",
		})
	}

	return c.JSON(scenarios)
}

// GetScenarioCategories returns all unique categories
// GET /scenarios/categories
func (h *ScenarioHandler) GetScenarioCategories(c *fiber.Ctx) error {
	categories, err := h.repo.GetScenarioCategories()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch categories",
		})
	}

	return c.JSON(fiber.Map{
		"categories": categories,
	})
}

// GetUserScenarios returns all scenarios with user progress (filtered by user role)
// GET /user/scenarios
func (h *ScenarioHandler) GetUserScenarios(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	
	// Get user role
	userRole := "free"
	userRoleStr := c.Locals("userRole")
	if userRoleStr != nil {
		userRole = userRoleStr.(string)
	}

	scenarios, err := h.repo.GetUserScenariosWithProgressForRole(userID, userRole)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch user scenarios",
		})
	}

	return c.JSON(scenarios)
}

// GetUserScenariosPaginated returns scenarios with user progress using cursor pagination
// GET /user/scenarios/paginated?cursor=xyz&limit=10&category=X&difficulty=Y&tier=Z&search=W
func (h *ScenarioHandler) GetUserScenariosPaginated(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	cursor := c.Query("cursor", "")
	limit := c.QueryInt("limit", 10)
	category := c.Query("category", "")
	difficulty := c.Query("difficulty", "")
	tier := c.Query("tier", "")
	search := c.Query("search", "")

	// Validate limit
	if limit < 1 || limit > 50 {
		limit = 10
	}

	scenarios, nextCursor, hasMore, err := h.repo.GetUserScenariosWithProgressPaginated(userID, cursor, limit, category, difficulty, tier, search)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch user scenarios",
		})
	}

	return c.JSON(fiber.Map{
		"scenarios":  scenarios,
		"nextCursor": nextCursor,
		"hasMore":    hasMore,
	})
}

// GetUserScenarioProgress returns user's progress for a specific scenario (with access control)
// GET /user/scenarios/:id/progress
func (h *ScenarioHandler) GetUserScenarioProgress(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	scenarioID := c.Params("id")

	// Get user role
	userRole := "free"
	userRoleStr := c.Locals("userRole")
	if userRoleStr != nil {
		userRole = userRoleStr.(string)
	}

	// Check if user can access this scenario
	canAccess, err := h.repo.CanUserAccessScenario(userRole, scenarioID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Scenario not found",
		})
	}
	if !canAccess {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error":   "Access denied. This scenario requires a premium subscription.",
			"premium": true,
		})
	}

	// Check if scenario exists
	scenario, err := h.repo.GetScenarioByID(scenarioID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Scenario not found",
		})
	}

	// Get user progress
	progress, err := h.repo.GetUserScenarioProgress(userID, scenarioID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch progress",
		})
	}

	// Include scenario details with progress (or null if no progress)
	response := fiber.Map{
		"scenario": scenario,
		"progress": progress,
	}

	return c.JSON(response)
}

// UpdateUserScenarioProgress updates user's progress for a scenario (with access control)
// POST /user/scenarios/:id/progress
func (h *ScenarioHandler) UpdateUserScenarioProgress(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	scenarioID := c.Params("id")

	// Get user role
	userRole := "free"
	userRoleStr := c.Locals("userRole")
	if userRoleStr != nil {
		userRole = userRoleStr.(string)
	}

	// Check if user can access this scenario
	canAccess, err := h.repo.CanUserAccessScenario(userRole, scenarioID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Scenario not found",
		})
	}
	if !canAccess {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error":   "Access denied. This scenario requires a premium subscription.",
			"premium": true,
		})
	}

	var req struct {
		Status         string                 `json:"status"`
		StepsCompleted int                    `json:"steps_completed"`
		TotalSteps     int                    `json:"total_steps"`
		Score          *int                   `json:"score"`
		ScoreBreakdown *models.ScoreBreakdown `json:"score_breakdown"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Validate status
	validStatuses := map[string]bool{
		"not_started":           true,
		"in_progress":           true,
		"completed":             true,
		"completed_with_errors": true,
	}
	if !validStatuses[req.Status] {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid status value",
		})
	}

	// Check if scenario exists
	_, err = h.repo.GetScenarioByID(scenarioID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Scenario not found",
		})
	}

	// Prepare progress object
	progress := &models.UserScenarioProgress{
		UserID:         userID,
		ScenarioID:     scenarioID,
		Status:         req.Status,
		StepsCompleted: req.StepsCompleted,
		TotalSteps:     req.TotalSteps,
		Score:          req.Score,
	}

	if req.ScoreBreakdown != nil {
		progress.ScoreBreakdown = *req.ScoreBreakdown
	}

	// Set completed_at if status is completed
	if req.Status == "completed" || req.Status == "completed_with_errors" {
		now := time.Now()
		progress.CompletedAt = &now
	}

	// Create or update progress
	if err := h.repo.CreateOrUpdateUserScenarioProgress(progress); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update progress",
		})
	}

	// Update user's global progress (completed_scenarios_count)
	if req.Status == "completed" || req.Status == "completed_with_errors" {
		h.updateUserGlobalProgress(userID)
	}

	return c.JSON(progress)
}

// Helper function to update user's global progress
func (h *ScenarioHandler) updateUserGlobalProgress(userID string) {
	// Get user's current global progress
	globalProgress, err := h.repo.GetProgressByUserID(userID)
	if err != nil || globalProgress == nil {
		return
	}

	// Count completed scenarios
	userProgress, err := h.repo.GetUserAllProgress(userID)
	if err != nil {
		return
	}

	completedCount := 0
	for _, p := range userProgress {
		if p.Status == "completed" || p.Status == "completed_with_errors" {
			completedCount++
		}
	}

	// Update the progress table with new completed count
	_ = h.repo.UpdateUserCompletedScenariosCount(userID, completedCount)
}

// CreateScenario creates a new scenario (admin only)
// POST /admin/scenarios
func (h *ScenarioHandler) CreateScenario(c *fiber.Ctx) error {
	var scenario models.Scenario

	if err := c.BodyParser(&scenario); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Validate required fields
	if scenario.ID == "" || scenario.Title == "" || scenario.Description == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Missing required fields",
		})
	}

	// Set defaults
	scenario.IsActive = true

	if err := h.repo.CreateScenario(&scenario); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create scenario",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(scenario)
}
