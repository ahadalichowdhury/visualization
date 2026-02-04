package websocket

import (
	"encoding/json"
	"log"
	"sync"
	"time"
)

// Client represents a connected user in a collaboration session
type Client struct {
	ID        string         `json:"id"`
	UserName  string         `json:"name"`
	Conn      *WebSocketConn `json:"-"`
	SessionID string         `json:"-"`
	LastSeen  time.Time      `json:"lastSeen"`
	IsIdle    bool           `json:"isIdle"`
}

// Message types for collaboration
type Message struct {
	Type      string                 `json:"type"`
	SessionID string                 `json:"sessionId,omitempty"`
	UserID    string                 `json:"userId"`
	UserName  string                 `json:"userName"`
	Data      map[string]interface{} `json:"data"`
	Timestamp int64                  `json:"timestamp"`
}

// Session represents a collaboration room
type Session struct {
	ID           string
	Clients      map[string]*Client
	HostID       string        // The user ID of the session creator (Host)
	Nodes        []interface{} // Store the current canvas state
	Edges        []interface{}
	Locks        map[string]string // nodeId -> userId (who locked it)
	CreatedAt    time.Time
	LastActivity time.Time
	mutex        sync.RWMutex
}

// Hub maintains active sessions and manages collaboration
type Hub struct {
	// Sessions maps sessionId -> Session
	sessions map[string]*Session

	// endedSessions tracks IDs of sessions that have been explicitly ended by the host
	// This prevents them from being immediately recreated/reused
	endedSessions map[string]time.Time

	// Register requests from clients
	register chan *Client

	// Unregister requests from clients
	unregister chan *Client

	// Broadcast messages to all clients in a session
	broadcast chan *Message

	mutex sync.RWMutex
}

// NewHub creates a new Hub instance
func NewHub() *Hub {
	return &Hub{
		sessions:      make(map[string]*Session),
		endedSessions: make(map[string]time.Time),
		register:      make(chan *Client),
		unregister:    make(chan *Client),
		broadcast:     make(chan *Message, 256),
	}
}

// Run starts the hub's main loop
func (h *Hub) Run() {
	log.Println("🚀 WebSocket Hub started and listening for events...")

	// Cleanup inactive sessions every 5 minutes
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	for {
		select {
		case client := <-h.register:
			log.Printf("📨 Hub received register request for client %s", client.ID)
			h.handleRegister(client)
		case client := <-h.unregister:
			log.Printf("📨 Hub received unregister request for client %s", client.ID)
			h.handleUnregister(client)
		case message := <-h.broadcast:
			log.Printf("📨 Hub received broadcast message type: %s", message.Type)
			h.handleBroadcast(message)
		case <-ticker.C:
			h.cleanupInactiveSessions()
		}
	}
}

// handleRegister registers a new client to a session
func (h *Hub) handleRegister(client *Client) {
	h.mutex.Lock()

	sessionID := client.SessionID

	// Check if session ended explicitly
	if _, ended := h.endedSessions[sessionID]; ended {
		log.Printf("⛔ Client %s tried to join ended session %s", client.ID, sessionID)
		// Send error message and close connection
		errMsg := &Message{
			Type:      "error",
			SessionID: sessionID,
			UserID:    "system",
			Data: map[string]interface{}{
				"code":    "SESSION_ENDED",
				"message": "Room not found or session ended.",
			},
			Timestamp: time.Now().UnixMilli(),
		}
		data, _ := json.Marshal(errMsg)
		client.Conn.WriteMessage(1, data)
		time.Sleep(100 * time.Millisecond) // Ensure message is sent before closing
		client.Conn.Close()
		h.mutex.Unlock() // Unlock before return
		return
	}

	// Create session if it doesn't exist
	if _, exists := h.sessions[sessionID]; !exists {
		h.sessions[sessionID] = &Session{
			ID:           sessionID,
			Clients:      make(map[string]*Client),
			HostID:       client.ID, // First user to join becomes the Host
			Nodes:        []interface{}{},
			Edges:        []interface{}{},
			Locks:        make(map[string]string),
			CreatedAt:    time.Now(),
			LastActivity: time.Now(),
		}
		log.Printf("📦 Created new collaboration session: %s (Host: %s)", sessionID, client.ID)
	}

	session := h.sessions[sessionID]
	session.mutex.Lock()
	session.Clients[client.ID] = client
	session.LastActivity = time.Now()
	session.mutex.Unlock()

	// Unlock Hub mutex BEFORE broadcasting to avoid deadlock
	// (broadcastToSession acquires RLock on h.mutex)
	h.mutex.Unlock()

	log.Printf("✅ Client %s (%s) joined session %s. Total clients: %d",
		client.ID, client.UserName, sessionID, len(session.Clients))

	// Send full state to the new client
	h.sendFullState(client, session)

	// Notify other clients about the new user
	h.broadcastToSession(sessionID, &Message{
		Type:      "user_presence",
		SessionID: sessionID,
		UserID:    client.ID,
		UserName:  client.UserName,
		Data: map[string]interface{}{
			"action": "joined",
			"user": map[string]interface{}{
				"id":       client.ID,
				"name":     client.UserName,
				"lastSeen": client.LastSeen.Unix(),
				"isIdle":   client.IsIdle,
			},
		},
		Timestamp: time.Now().UnixMilli(),
	}, client.ID)
}

// handleUnregister removes a client from a session
func (h *Hub) handleUnregister(client *Client) {
	h.mutex.Lock()

	sessionID := client.SessionID
	session, exists := h.sessions[sessionID]
	if !exists {
		h.mutex.Unlock()
		return
	}

	session.mutex.Lock()
	delete(session.Clients, client.ID)

	// Release all locks held by this client
	for nodeID, lockedBy := range session.Locks {
		if lockedBy == client.ID {
			delete(session.Locks, nodeID)
			log.Printf("🔓 Released lock on node %s (user %s left)", nodeID, client.ID)
		}
	}
	session.mutex.Unlock()

	// Capture client count for logging before unlocking if needed,
	// but strictly we can access session outside (pointer is valid).
	clientCount := len(session.Clients)

	// Unlock Hub mutex BEFORE broadcasting to avoid deadlock
	h.mutex.Unlock()

	log.Printf("👋 Client %s (%s) left session %s. Remaining clients: %d",
		client.ID, client.UserName, sessionID, clientCount)

	// Notify other clients about user leaving
	h.broadcastToSession(sessionID, &Message{
		Type:      "user_presence",
		SessionID: sessionID,
		UserID:    client.ID,
		UserName:  client.UserName,
		Data: map[string]interface{}{
			"action": "left",
		},
		Timestamp: time.Now().UnixMilli(),
	}, "")

	// Do NOT delete empty sessions immediately.
	// Let them persist so others can join later (e.g., async collaboration).
	// They will be cleaned up by cleanupInactiveSessions after 30 minutes of inactivity.
	if clientCount == 0 {
		log.Printf("ℹ️ Session %s is now empty (will be kept active for retries)", sessionID)
	}
}

// handleBroadcast broadcasts a message to all clients in a session
func (h *Hub) handleBroadcast(message *Message) {
	h.mutex.RLock()
	session, exists := h.sessions[message.SessionID]
	h.mutex.RUnlock()

	if !exists {
		log.Printf("⚠️  Session %s not found for broadcast", message.SessionID)
		return
	}

	// Handle session_end separately to avoid deadlock (lock ordering issues)
	if message.Type == "session_end" {
		session.mutex.Lock()
		isHost := message.UserID == session.HostID
		session.mutex.Unlock() // Release lock immediately

		if isHost {
			log.Printf("🛑 Session %s ended by host %s", message.SessionID, message.UserID)

			// Broadcast session_ended to ALL clients (including host)
			// This might acquire RLock on h.mutex and session.mutex internally, which is safe now
			h.broadcastToSession(message.SessionID, &Message{
				Type:      "session_ended",
				SessionID: message.SessionID,
				UserID:    "system",
				UserName:  "System",
				Data:      map[string]interface{}{},
				Timestamp: time.Now().UnixMilli(),
			}, "")

			// Mark session as ended in tombstone map
			// This acquires Lock on h.mutex. Safe because we don't hold session.mutex.
			h.mutex.Lock()
			delete(h.sessions, message.SessionID)
			h.endedSessions[message.SessionID] = time.Now()
			h.mutex.Unlock()

			log.Printf("🗑️ Session %s destroyed and tombstoned", message.SessionID)
			return
		} else {
			log.Printf("⚠️ User %s tried to end session %s but is not host (%s)", message.UserID, message.SessionID, session.HostID)
			return
		}
	}

	session.mutex.Lock()

	// Update session state based on message type
	switch message.Type {
	case "node_update":
		if nodes, ok := message.Data["nodes"].([]interface{}); ok {
			session.Nodes = nodes
			log.Printf("📦 Updated session %s nodes: %d items", message.SessionID, len(nodes))
		} else {
			log.Printf("❌ Failed to update nodes: %T", message.Data["nodes"])
		}
	case "edge_update":
		if edges, ok := message.Data["edges"].([]interface{}); ok {
			session.Edges = edges
			log.Printf("🔗 Updated session %s edges: %d items", message.SessionID, len(edges))
		} else {
			log.Printf("❌ Failed to update edges: %T", message.Data["edges"])
		}
	case "lock":
		if nodeID, ok := message.Data["nodeId"].(string); ok {
			session.Locks[nodeID] = message.UserID
			log.Printf("🔒 Node %s locked by %s", nodeID, message.UserID)
		}
	case "unlock":
		if nodeID, ok := message.Data["nodeId"].(string); ok {
			delete(session.Locks, nodeID)
			log.Printf("🔓 Node %s unlocked by %s", nodeID, message.UserID)
		}
	}

	session.LastActivity = time.Now()
	session.mutex.Unlock()

	// Broadcast to all clients in the session
	h.broadcastToSession(message.SessionID, message, "")
}

// sendFullState sends the complete session state to a client
func (h *Hub) sendFullState(client *Client, session *Session) {
	session.mutex.RLock()
	defer session.mutex.RUnlock()

	// Get list of all users in session
	users := make([]map[string]interface{}, 0)
	for _, c := range session.Clients {
		users = append(users, map[string]interface{}{
			"id":       c.ID,
			"name":     c.UserName,
			"lastSeen": c.LastSeen.Unix(),
			"isIdle":   c.IsIdle,
		})
	}

	fullStateMsg := &Message{
		Type:      "full_state",
		SessionID: session.ID,
		UserID:    "system",
		UserName:  "System",
		Data: map[string]interface{}{
			"nodes": session.Nodes,
			"edges": session.Edges,
			"locks": session.Locks,
			"users": users,
		},
		Timestamp: time.Now().UnixMilli(),
	}

	data, err := json.Marshal(fullStateMsg)
	if err != nil {
		log.Printf("❌ Failed to marshal full state: %v", err)
		return
	}

	if err := client.Conn.WriteMessage(1, data); err != nil {
		log.Printf("❌ Failed to send full state to client %s: %v", client.ID, err)
	} else {
		log.Printf("📤 Sent full state to client %s (nodes: %d, edges: %d)",
			client.ID, len(session.Nodes), len(session.Edges))
	}
}

// broadcastToSession broadcasts a message to all clients except the excluded one
func (h *Hub) broadcastToSession(sessionID string, message *Message, excludeClientID string) {
	h.mutex.RLock()
	session, exists := h.sessions[sessionID]
	h.mutex.RUnlock()

	if !exists {
		return
	}

	data, err := json.Marshal(message)
	if err != nil {
		log.Printf("❌ Failed to marshal message: %v", err)
		return
	}

	session.mutex.RLock()
	defer session.mutex.RUnlock()

	sentCount := 0
	for _, client := range session.Clients {
		if client.ID == excludeClientID {
			continue
		}

		if err := client.Conn.WriteMessage(1, data); err != nil {
			log.Printf("❌ Failed to send message to client %s: %v", client.ID, err)
		} else {
			sentCount++
		}
	}

	if sentCount > 0 {
		log.Printf("📡 Broadcast %s to %d clients in session %s", message.Type, sentCount, sessionID)
	}
}

// GetSessionInfo returns information about a session
func (h *Hub) GetSessionInfo(sessionID string) map[string]interface{} {
	h.mutex.RLock()
	defer h.mutex.RUnlock()

	session, exists := h.sessions[sessionID]
	if !exists {
		return map[string]interface{}{
			"exists": false,
		}
	}

	session.mutex.RLock()
	defer session.mutex.RUnlock()

	users := make([]map[string]interface{}, 0)
	for _, client := range session.Clients {
		users = append(users, map[string]interface{}{
			"id":       client.ID,
			"name":     client.UserName,
			"lastSeen": client.LastSeen.Unix(),
		})
	}

	return map[string]interface{}{
		"exists":       true,
		"sessionId":    session.ID,
		"clientCount":  len(session.Clients),
		"users":        users,
		"createdAt":    session.CreatedAt.Unix(),
		"lastActivity": session.LastActivity.Unix(),
	}
}

// cleanupInactiveSessions removes sessions with no activity for 30 minutes
func (h *Hub) cleanupInactiveSessions() {
	h.mutex.Lock()
	defer h.mutex.Unlock()

	cutoff := time.Now().Add(-30 * time.Minute)
	removed := 0

	for sessionID, session := range h.sessions {
		if session.LastActivity.Before(cutoff) && len(session.Clients) == 0 {
			delete(h.sessions, sessionID)
			removed++
			log.Printf("🧹 Cleaned up inactive session: %s", sessionID)
		}
	}

	if removed > 0 {
		log.Printf("🧹 Cleaned up %d inactive sessions", removed)
	}
}

// RegisterClient adds a client to a session
func (h *Hub) RegisterClient(client *Client) {
	h.register <- client
}

// UnregisterClient removes a client from a session
func (h *Hub) UnregisterClient(client *Client) {
	h.unregister <- client
}

// BroadcastMessage broadcasts a message to a session
func (h *Hub) BroadcastMessage(message *Message) {
	h.broadcast <- message
}
