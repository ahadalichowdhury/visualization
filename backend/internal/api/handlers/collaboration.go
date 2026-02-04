package handlers

import (
	"encoding/json"
	"log"
	"time"

	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
	"github.com/yourusername/visualization-backend/internal/database"
	ws "github.com/yourusername/visualization-backend/internal/websocket"
)

// CollaborationHandler handles real-time collaboration
type CollaborationHandler struct {
	hub  *ws.Hub
	repo *database.Repository
}

// NewCollaborationHandler creates a new CollaborationHandler
func NewCollaborationHandler(hub *ws.Hub, repo *database.Repository) *CollaborationHandler {
	return &CollaborationHandler{
		hub:  hub,
		repo: repo,
	}
}

// HandleWebSocket handles WebSocket connections for collaboration
func (h *CollaborationHandler) HandleWebSocket(c *websocket.Conn) {
	// Get connection params
	sessionID := c.Query("sessionId")
	userID := c.Query("userId")
	userName := c.Query("userName")

	if sessionID == "" || userID == "" {
		log.Printf("❌ Missing sessionId or userId in WebSocket connection")
		c.Close()
		return
	}

	if userName == "" {
		userName = "Guest"
	}

	log.Printf("🔌 WebSocket connection established: user=%s (%s), session=%s", userID, userName, sessionID)

	// Create client
	client := &ws.Client{
		ID:        userID,
		UserName:  userName,
		Conn:      &ws.WebSocketConn{Conn: c},
		SessionID: sessionID,
		LastSeen:  time.Now(),
		IsIdle:    false,
	}

	// Register client with hub
	h.hub.RegisterClient(client)
	defer h.hub.UnregisterClient(client)

	// Read messages from client
	for {
		messageType, data, err := c.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("⚠️  WebSocket error for user %s: %v", userID, err)
			} else {
				log.Printf("🔌 WebSocket closed for user %s (%s)", userID, userName)
			}
			break
		}

		// Only handle text messages
		if messageType != websocket.TextMessage {
			continue
		}

		// Parse message
		var msg ws.Message
		if err := json.Unmarshal(data, &msg); err != nil {
			log.Printf("❌ Failed to parse message from user %s: %v", userID, err)
			continue
		}

		// Add metadata
		msg.SessionID = sessionID
		msg.UserID = userID
		msg.UserName = userName
		msg.Timestamp = time.Now().UnixMilli()

		// Update client last seen
		client.LastSeen = time.Now()

		log.Printf("📨 Received %s from user %s in session %s", msg.Type, userID, sessionID)

		// Handle message based on type
		switch msg.Type {
		case "request_state":
			// Client is requesting current state
			// The hub will automatically send full_state on registration
			log.Printf("📥 Client %s requested state refresh", userID)

		case "node_update", "edge_update", "cursor_move", "lock", "unlock", "session_end":
			// Broadcast to other clients
			h.hub.BroadcastMessage(&msg)

		default:
			log.Printf("⚠️  Unknown message type: %s from user %s", msg.Type, userID)
		}
	}
}

// GetSessionInfo returns information about a collaboration session
func (h *CollaborationHandler) GetSessionInfo(c *fiber.Ctx) error {
	sessionID := c.Params("sessionId")
	if sessionID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "sessionId is required",
		})
	}

	sessionInfo := h.hub.GetSessionInfo(sessionID)
	return c.JSON(sessionInfo)
}
