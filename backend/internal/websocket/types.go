package websocket

import "github.com/gofiber/contrib/websocket"

// WebSocketConn is a wrapper for the Fiber WebSocket connection
type WebSocketConn struct {
	*websocket.Conn
}

// WriteMessage writes a message to the WebSocket connection
func (c *WebSocketConn) WriteMessage(messageType int, data []byte) error {
	return c.Conn.WriteMessage(messageType, data)
}

// ReadMessage reads a message from the WebSocket connection
func (c *WebSocketConn) ReadMessage() (int, []byte, error) {
	return c.Conn.ReadMessage()
}

// Close closes the WebSocket connection
func (c *WebSocketConn) Close() error {
	return c.Conn.Close()
}
