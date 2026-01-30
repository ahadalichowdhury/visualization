package handlers

import (
	"context"

	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/yourusername/visualization-backend/internal/database"
	ws "github.com/yourusername/visualization-backend/internal/websocket"
)

// CollaborationHandler handles real-time collaboration endpoints
type CollaborationHandler struct {
	hub  *ws.Hub
	repo *database.Repository
}

// NewCollaborationHandler creates a new collaboration handler
func NewCollaborationHandler(hub *ws.Hub, repo *database.Repository) *CollaborationHandler {
	return &CollaborationHandler{
		hub:  hub,
		repo: repo,
	}
}

// HandleWebSocket upgrades HTTP connection to WebSocket for collaboration
func (h *CollaborationHandler) HandleWebSocket(c *websocket.Conn) {
	// Get session ID, user ID, user name, and architecture ID from query params
	sessionID := c.Query("sessionId")
	userID := c.Query("userId")
	userName := c.Query("userName")
	architectureID := c.Query("architectureId") // Architecture ID for permission check

	if sessionID == "" || userID == "" || userName == "" {
		c.WriteMessage(websocket.CloseMessage, []byte("Missing required parameters"))
		c.Close()
		return
	}

	// If architecture ID is provided, check collaboration access
	if architectureID != "" {
		userUUID, err := uuid.Parse(userID)
		if err != nil {
			c.WriteMessage(websocket.CloseMessage, []byte("Invalid user ID"))
			c.Close()
			return
		}

		archUUID, err := uuid.Parse(architectureID)
		if err != nil {
			c.WriteMessage(websocket.CloseMessage, []byte("Invalid architecture ID"))
			c.Close()
			return
		}

		// Get architecture to check if it's a scenario architecture
		ctx := context.Background()
		arch, err := h.repo.GetArchitectureByID(ctx, archUUID, userUUID)
		if err != nil {
			c.WriteMessage(websocket.CloseMessage, []byte("Architecture not found or access denied"))
			c.Close()
			return
		}

		// Get user to check subscription tier
		user, err := h.repo.GetUserByID(userID)
		if err != nil {
			c.WriteMessage(websocket.CloseMessage, []byte("Failed to verify user permissions"))
			c.Close()
			return
		}

		// Check if user can access collaboration for this architecture
		isScenarioArchitecture := arch.ScenarioID != nil
		if !user.CanAccessCollaboration(isScenarioArchitecture) {
			c.WriteMessage(websocket.CloseMessage, []byte("Collaboration not available. Free users cannot collaborate on scenario architectures. Upgrade to Premium."))
			c.Close()
			return
		}
	}

	// Serve WebSocket connection
	ws.ServeWS(h.hub, c, sessionID, userID, userName)
}

// GetSessionInfo returns information about active sessions
func (h *CollaborationHandler) GetSessionInfo(c *fiber.Ctx) error {
	sessionID := c.Params("sessionId")

	// TODO: Implement session info retrieval
	return c.JSON(fiber.Map{
		"sessionId": sessionID,
		"message":   "Session info endpoint",
	})
}
