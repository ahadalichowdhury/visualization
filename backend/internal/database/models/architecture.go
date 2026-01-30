package models

import (
	"database/sql/driver"
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// Architecture represents a user's saved canvas design
type Architecture struct {
	ID          uuid.UUID  `json:"id" db:"id"`
	UserID      uuid.UUID  `json:"user_id" db:"user_id"`
	ScenarioID  *string    `json:"scenario_id,omitempty" db:"scenario_id"`
	Title       string     `json:"title" db:"title"`
	Description *string    `json:"description,omitempty" db:"description"`
	CanvasData  CanvasData `json:"canvas_data" db:"canvas_data"`
	IsSubmitted bool       `json:"is_submitted" db:"is_submitted"`
	Score       *int       `json:"score,omitempty" db:"score"`
	Feedback    *string    `json:"feedback,omitempty" db:"feedback"`
	CreatedAt   time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at" db:"updated_at"`
}

// CanvasData represents the complete canvas state
type CanvasData struct {
	Nodes []Node `json:"nodes"`
	Edges []Edge `json:"edges"`
}

// Node represents a single node in the canvas
type Node struct {
	ID       string       `json:"id"`
	Type     string       `json:"type"`
	Position NodePosition `json:"position"`
	Data     NodeData     `json:"data"`
}

// NodePosition represents x,y coordinates
type NodePosition struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
}

// NodeData represents node configuration
type NodeData struct {
	Label    string                 `json:"label"`
	Config   map[string]interface{} `json:"config"`
	NodeType string                 `json:"nodeType,omitempty"`
}

// Edge represents a connection between nodes
type Edge struct {
	ID       string                 `json:"id"`
	Source   string                 `json:"source"`
	Target   string                 `json:"target"`
	Type     string                 `json:"type,omitempty"`
	Animated bool                   `json:"animated,omitempty"`
	Label    string                 `json:"label,omitempty"`
	MarkerEnd map[string]interface{} `json:"markerEnd,omitempty"`
}

// Value implements the driver.Valuer interface for CanvasData
func (c CanvasData) Value() (driver.Value, error) {
	return json.Marshal(c)
}

// Scan implements the sql.Scanner interface for CanvasData
func (c *CanvasData) Scan(value interface{}) error {
	if value == nil {
		return nil
	}
	
	bytes, ok := value.([]byte)
	if !ok {
		return json.Unmarshal([]byte(value.(string)), c)
	}
	return json.Unmarshal(bytes, c)
}

// ArchitectureListItem represents a simplified architecture for list views
type ArchitectureListItem struct {
	ID          uuid.UUID  `json:"id"`
	Title       string     `json:"title"`
	Description *string    `json:"description,omitempty"`
	ScenarioID  *string    `json:"scenario_id,omitempty"`
	NodeCount   int        `json:"node_count"`
	EdgeCount   int        `json:"edge_count"`
	IsSubmitted bool       `json:"is_submitted"`
	Score       *int       `json:"score,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}
