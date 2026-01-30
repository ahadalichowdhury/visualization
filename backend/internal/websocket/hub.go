package websocket

import (
	"encoding/json"
	"log"
	"sync"
	"time"

	"github.com/gofiber/contrib/websocket"
)

// Message types for WebSocket communication
const (
	MessageTypeJoin          = "join"
	MessageTypeLeave         = "leave"
	MessageTypeNodeUpdate    = "node_update"
	MessageTypeEdgeUpdate    = "edge_update"
	MessageTypeCursorMove    = "cursor_move"
	MessageTypeUserPresence  = "user_presence"
	MessageTypeSync          = "sync"
	MessageTypeLock          = "lock"
	MessageTypeUnlock        = "unlock"
)

// WSMessage represents a WebSocket message
type WSMessage struct {
	Type      string                 `json:"type"`
	UserID    string                 `json:"userId"`
	UserName  string                 `json:"userName"`
	SessionID string                 `json:"sessionId"`
	Timestamp int64                  `json:"timestamp"`
	Data      map[string]interface{} `json:"data"`
}

// User represents a connected user
type User struct {
	ID        string                `json:"id"`
	Name      string                `json:"name"`
	Color     string                `json:"color"` // For cursor/presence display
	CursorX   float64               `json:"cursorX"`
	CursorY   float64               `json:"cursorY"`
	LastSeen  int64                 `json:"lastSeen"`
	Conn      *websocket.Conn       `json:"-"`
}

// Session represents a collaborative editing session
type Session struct {
	ID        string                 `json:"id"`
	Users     map[string]*User       `json:"users"`
	Locks     map[string]string      `json:"locks"` // nodeId -> userId (who has the lock)
	State     map[string]interface{} `json:"state"` // Current canvas state
	CreatedAt int64                  `json:"createdAt"`
	mu        sync.RWMutex
}

// Hub maintains active sessions and coordinates messages
type Hub struct {
	sessions   map[string]*Session
	register   chan *Client
	unregister chan *Client
	broadcast  chan *BroadcastMessage
	mu         sync.RWMutex
}

// Client represents a connected WebSocket client
type Client struct {
	hub       *Hub
	conn      *websocket.Conn
	send      chan []byte
	sessionID string
	userID    string
	userName  string
}

// BroadcastMessage represents a message to broadcast
type BroadcastMessage struct {
	sessionID string
	message   []byte
	excludeID string // Optional: don't send to this user
}

// NewHub creates a new WebSocket hub
func NewHub() *Hub {
	return &Hub{
		sessions:   make(map[string]*Session),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan *BroadcastMessage),
	}
}

// Run starts the hub's main loop
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.handleRegister(client)
		case client := <-h.unregister:
			h.handleUnregister(client)
		case message := <-h.broadcast:
			h.handleBroadcast(message)
		}
	}
}

// handleRegister registers a new client
func (h *Hub) handleRegister(client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()

	session, exists := h.sessions[client.sessionID]
	if !exists {
		// Create new session
		session = &Session{
			ID:        client.sessionID,
			Users:     make(map[string]*User),
			Locks:     make(map[string]string),
			State:     make(map[string]interface{}),
			CreatedAt: time.Now().Unix(),
		}
		h.sessions[client.sessionID] = session
		log.Printf("Created new session: %s", client.sessionID)
	}

	// Add user to session
	user := &User{
		ID:       client.userID,
		Name:     client.userName,
		Color:    generateUserColor(client.userID),
		CursorX:  0,
		CursorY:  0,
		LastSeen: time.Now().Unix(),
		Conn:     client.conn,
	}
	session.Users[client.userID] = user

	log.Printf("User %s (%s) joined session %s", client.userName, client.userID, client.sessionID)

	// Send current state to new user
	h.sendStateToUser(client, session)

	// Broadcast user join to others
	h.broadcastUserPresence(client.sessionID, client.userID, "joined")
}

// handleUnregister unregisters a client
func (h *Hub) handleUnregister(client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()

	session, exists := h.sessions[client.sessionID]
	if !exists {
		return
	}

	// Remove user from session
	delete(session.Users, client.userID)
	close(client.send)

	// Release any locks held by this user
	for nodeID, userID := range session.Locks {
		if userID == client.userID {
			delete(session.Locks, nodeID)
		}
	}

	log.Printf("User %s left session %s", client.userID, client.sessionID)

	// Broadcast user leave to others
	h.broadcastUserPresence(client.sessionID, client.userID, "left")

	// Clean up empty sessions (after 5 minutes)
	if len(session.Users) == 0 {
		go func() {
			time.Sleep(5 * time.Minute)
			h.mu.Lock()
			defer h.mu.Unlock()
			if len(session.Users) == 0 {
				delete(h.sessions, client.sessionID)
				log.Printf("Cleaned up empty session: %s", client.sessionID)
			}
		}()
	}
}

// handleBroadcast broadcasts a message to all clients in a session
func (h *Hub) handleBroadcast(msg *BroadcastMessage) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	session, exists := h.sessions[msg.sessionID]
	if !exists {
		return
	}

	for _, user := range session.Users {
		if user.ID == msg.excludeID {
			continue // Don't send to the sender
		}

		err := user.Conn.WriteMessage(websocket.TextMessage, msg.message)
		if err != nil {
			log.Printf("Failed to send message to user %s: %v", user.ID, err)
		}
	}
}

// sendStateToUser sends the current session state to a specific user
func (h *Hub) sendStateToUser(client *Client, session *Session) {
	session.mu.RLock()
	defer session.mu.RUnlock()

	// Get list of active users
	users := make([]map[string]interface{}, 0, len(session.Users))
	for _, user := range session.Users {
		users = append(users, map[string]interface{}{
			"id":       user.ID,
			"name":     user.Name,
			"color":    user.Color,
			"cursorX":  user.CursorX,
			"cursorY":  user.CursorY,
			"lastSeen": user.LastSeen,
		})
	}

	syncMsg := WSMessage{
		Type:      MessageTypeSync,
		UserID:    "system",
		SessionID: client.sessionID,
		Timestamp: time.Now().Unix(),
		Data: map[string]interface{}{
			"state": session.State,
			"users": users,
			"locks": session.Locks,
		},
	}

	data, err := json.Marshal(syncMsg)
	if err != nil {
		log.Printf("Error marshaling sync message: %v", err)
		return
	}

	client.conn.WriteMessage(websocket.TextMessage, data)
}

// broadcastUserPresence broadcasts user presence updates
func (h *Hub) broadcastUserPresence(sessionID, userID, action string) {
	session := h.sessions[sessionID]
	if session == nil {
		return
	}

	user := session.Users[userID]
	presenceMsg := WSMessage{
		Type:      MessageTypeUserPresence,
		UserID:    userID,
		SessionID: sessionID,
		Timestamp: time.Now().Unix(),
		Data: map[string]interface{}{
			"action": action,
			"user": map[string]interface{}{
				"id":    userID,
				"name":  user.Name,
				"color": user.Color,
			},
		},
	}

	data, _ := json.Marshal(presenceMsg)
	h.broadcast <- &BroadcastMessage{
		sessionID: sessionID,
		message:   data,
		excludeID: "",
	}
}

// HandleMessage processes incoming WebSocket messages
func (h *Hub) HandleMessage(client *Client, message []byte) {
	var msg WSMessage
	if err := json.Unmarshal(message, &msg); err != nil {
		log.Printf("Error unmarshaling message: %v", err)
		return
	}

	h.mu.Lock()
	session := h.sessions[client.sessionID]
	h.mu.Unlock()

	if session == nil {
		return
	}

	// Update user's last seen timestamp
	if user, exists := session.Users[client.userID]; exists {
		user.LastSeen = time.Now().Unix()
	}

	switch msg.Type {
	case MessageTypeNodeUpdate, MessageTypeEdgeUpdate:
		// Update session state
		session.mu.Lock()
		session.State[msg.Type] = msg.Data
		session.mu.Unlock()

		// Broadcast to other users
		h.broadcast <- &BroadcastMessage{
			sessionID: client.sessionID,
			message:   message,
			excludeID: client.userID,
		}

	case MessageTypeCursorMove:
		// Update cursor position
		if user, exists := session.Users[client.userID]; exists {
			if x, ok := msg.Data["x"].(float64); ok {
				user.CursorX = x
			}
			if y, ok := msg.Data["y"].(float64); ok {
				user.CursorY = y
			}
		}

		// Broadcast cursor update
		h.broadcast <- &BroadcastMessage{
			sessionID: client.sessionID,
			message:   message,
			excludeID: client.userID,
		}

	case MessageTypeLock:
		// Lock a node for editing
		nodeID := msg.Data["nodeId"].(string)
		session.mu.Lock()
		if _, locked := session.Locks[nodeID]; !locked {
			session.Locks[nodeID] = client.userID
			session.mu.Unlock()

			// Broadcast lock success
			h.broadcast <- &BroadcastMessage{
				sessionID: client.sessionID,
				message:   message,
				excludeID: "",
			}
		} else {
			session.mu.Unlock()
			// Send lock failure to requester
			failMsg := WSMessage{
				Type:      "lock_failed",
				UserID:    "system",
				SessionID: client.sessionID,
				Timestamp: time.Now().Unix(),
				Data: map[string]interface{}{
					"nodeId":   nodeID,
					"lockedBy": session.Locks[nodeID],
				},
			}
			data, _ := json.Marshal(failMsg)
			client.conn.WriteMessage(websocket.TextMessage, data)
		}

	case MessageTypeUnlock:
		// Unlock a node
		nodeID := msg.Data["nodeId"].(string)
		session.mu.Lock()
		if session.Locks[nodeID] == client.userID {
			delete(session.Locks, nodeID)
		}
		session.mu.Unlock()

		// Broadcast unlock
		h.broadcast <- &BroadcastMessage{
			sessionID: client.sessionID,
			message:   message,
			excludeID: "",
		}
	}
}

// generateUserColor generates a unique color for a user based on their ID
func generateUserColor(userID string) string {
	colors := []string{
		"#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8",
		"#F7DC6F", "#BB8FCE", "#85C1E2", "#F8B739", "#52B788",
	}
	// Simple hash to pick a color
	hash := 0
	for _, char := range userID {
		hash += int(char)
	}
	return colors[hash%len(colors)]
}

// ReadPump handles reading messages from the WebSocket
func (c *Client) ReadPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}
		c.hub.HandleMessage(c, message)
	}
}

// WritePump handles writing messages to the WebSocket
func (c *Client) WritePump() {
	defer func() {
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			c.conn.WriteMessage(websocket.TextMessage, message)
		}
	}
}

// ServeWS handles WebSocket requests
func ServeWS(hub *Hub, conn *websocket.Conn, sessionID, userID, userName string) {
	client := &Client{
		hub:       hub,
		conn:      conn,
		send:      make(chan []byte, 256),
		sessionID: sessionID,
		userID:    userID,
		userName:  userName,
	}

	hub.register <- client

	// Start read and write pumps
	go client.WritePump()
	client.ReadPump()
}
