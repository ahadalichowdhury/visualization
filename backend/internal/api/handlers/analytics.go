package handlers

import (
	"net/http"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/yourusername/visualization-backend/internal/analytics"
)

type AnalyticsHandler struct {
	analyticsService *analytics.Service
}

func NewAnalyticsHandler(analyticsService *analytics.Service) *AnalyticsHandler {
	return &AnalyticsHandler{
		analyticsService: analyticsService,
	}
}

// GetSimulationHistory returns simulation runs for an architecture
// GET /api/analytics/:architectureId/simulations
func (h *AnalyticsHandler) GetSimulationHistory(c *fiber.Ctx) error {
	architectureIDParam := c.Params("architectureId")
	architectureID, err := uuid.Parse(architectureIDParam)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid architecture ID",
		})
	}

	limit := c.QueryInt("limit", 50)

	runs, err := h.analyticsService.GetSimulationHistory(architectureID, limit)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get simulation history",
		})
	}

	return c.JSON(fiber.Map{
		"simulations": runs,
	})
}

// GetPerformanceTrends returns performance metrics over time
// GET /api/analytics/:architectureId/trends
func (h *AnalyticsHandler) GetPerformanceTrends(c *fiber.Ctx) error {
	architectureIDParam := c.Params("architectureId")
	architectureID, err := uuid.Parse(architectureIDParam)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid architecture ID",
		})
	}

	days := c.QueryInt("days", 30)

	trends, err := h.analyticsService.GetPerformanceTrends(architectureID, days)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get performance trends",
		})
	}

	return c.JSON(fiber.Map{
		"trends": trends,
	})
}

// GetCostTrends returns cost history over time
// GET /api/analytics/:architectureId/costs
func (h *AnalyticsHandler) GetCostTrends(c *fiber.Ctx) error {
	architectureIDParam := c.Params("architectureId")
	architectureID, err := uuid.Parse(architectureIDParam)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid architecture ID",
		})
	}

	days := c.QueryInt("days", 30)

	trends, err := h.analyticsService.GetCostTrends(architectureID, days)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get cost trends",
		})
	}

	return c.JSON(fiber.Map{
		"trends": trends,
	})
}

// GetSnapshots returns architecture snapshots
// GET /api/analytics/:architectureId/snapshots
func (h *AnalyticsHandler) GetSnapshots(c *fiber.Ctx) error {
	architectureIDParam := c.Params("architectureId")
	architectureID, err := uuid.Parse(architectureIDParam)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid architecture ID",
		})
	}

	limit := c.QueryInt("limit", 20)

	snapshots, err := h.analyticsService.GetSnapshots(architectureID, limit)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get snapshots",
		})
	}

	return c.JSON(fiber.Map{
		"snapshots": snapshots,
	})
}

// GetSummary returns analytics summary for an architecture
// GET /api/analytics/:architectureId/summary
func (h *AnalyticsHandler) GetSummary(c *fiber.Ctx) error {
	architectureIDParam := c.Params("architectureId")
	architectureID, err := uuid.Parse(architectureIDParam)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid architecture ID",
		})
	}

	summary, err := h.analyticsService.GetAnalyticsSummary(architectureID)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get analytics summary",
		})
	}

	return c.JSON(summary)
}

// GetInsights returns AI-generated insights for an architecture
// GET /api/analytics/:architectureId/insights
func (h *AnalyticsHandler) GetInsights(c *fiber.Ctx) error {
	architectureIDParam := c.Params("architectureId")
	architectureID, err := uuid.Parse(architectureIDParam)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid architecture ID",
		})
	}

	includeResolved := c.QueryBool("include_resolved", false)

	insights, err := h.analyticsService.GetInsights(architectureID, includeResolved)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get insights",
		})
	}

	return c.JSON(fiber.Map{
		"insights": insights,
	})
}

// CreateSnapshot creates a manual snapshot
// POST /api/analytics/:architectureId/snapshots
func (h *AnalyticsHandler) CreateSnapshot(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uuid.UUID)

	architectureIDParam := c.Params("architectureId")
	architectureID, err := uuid.Parse(architectureIDParam)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid architecture ID",
		})
	}

	var req struct {
		CanvasData        interface{} `json:"canvas_data"`
		NodeCount         int         `json:"node_count"`
		EdgeCount         int         `json:"edge_count"`
		ChangeDescription string      `json:"change_description"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	err = h.analyticsService.CreateSnapshot(architectureID, userID, req.CanvasData, req.NodeCount, req.EdgeCount, req.ChangeDescription)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create snapshot",
		})
	}

	return c.Status(http.StatusCreated).JSON(fiber.Map{
		"message": "Snapshot created successfully",
	})
}
