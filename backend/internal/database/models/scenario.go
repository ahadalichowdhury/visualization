package models

import (
	"database/sql/driver"
	"encoding/json"
	"time"
)

// Scenario represents a system design scenario
type Scenario struct {
	ID          string `json:"id" db:"id"`
	Title       string `json:"title" db:"title"`
	Description string `json:"description" db:"description"`
	Category    string `json:"category" db:"category"`
	Difficulty  string `json:"difficulty" db:"difficulty"`

	ThumbnailURL *string      `json:"thumbnail_url" db:"thumbnail_url"`
	Requirements Requirements `json:"requirements" db:"requirements"`
	Hints        Hints        `json:"hints" db:"hints"`
	Goals        Goals        `json:"goals" db:"goals"`
	Tier         string       `json:"tier" db:"tier"` // 'free' or 'premium'
	IsActive     bool         `json:"is_active" db:"is_active"`
	CreatedAt    time.Time    `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time    `json:"updated_at" db:"updated_at"`
}

// Requirements represents scenario requirements
type Requirements struct {
	TrafficLoad string   `json:"traffic_load"`
	SLA         string   `json:"sla"`
	UserBase    string   `json:"user_base"`
	Consistency string   `json:"consistency"`
	Constraints []string `json:"constraints"`
}

// Hints is a list of hints for a scenario
type Hints []string

// Goals represents success criteria for a scenario
type Goals struct {
	MaxLatencyMS        int      `json:"max_latency_ms"`
	MaxErrorRatePercent float64  `json:"max_error_rate_percent"`
	MinThroughputRPS    int      `json:"min_throughput_rps"`
	MustSupportRegions  []string `json:"must_support_regions"`
	DataDurability      *string  `json:"data_durability,omitempty"`
}

// UserScenarioProgress tracks a user's progress on a scenario
type UserScenarioProgress struct {
	ID             string         `json:"id" db:"id"`
	UserID         string         `json:"user_id" db:"user_id"`
	ScenarioID     string         `json:"scenario_id" db:"scenario_id"`
	Status         string         `json:"status" db:"status"`
	StepsCompleted int            `json:"steps_completed" db:"steps_completed"`
	TotalSteps     int            `json:"total_steps" db:"total_steps"`
	Score          *int           `json:"score" db:"score"`
	ScoreBreakdown ScoreBreakdown `json:"score_breakdown" db:"score_breakdown"`
	CompletedAt    *time.Time     `json:"completed_at" db:"completed_at"`
	CreatedAt      time.Time      `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at" db:"updated_at"`
}

// ScoreBreakdown represents score components
type ScoreBreakdown struct {
	Latency      int `json:"latency"`
	Throughput   int `json:"throughput"`
	Errors       int `json:"errors"`
	HintsPenalty int `json:"hints_penalty"`
}

// ScenarioWithProgress combines scenario with user progress
type ScenarioWithProgress struct {
	Scenario
	Status         string `json:"status"`
	StepsCompleted int    `json:"steps_completed"`
	Score          *int   `json:"score,omitempty"`
}

// Value implements driver.Valuer for Requirements
func (r Requirements) Value() (driver.Value, error) {
	return json.Marshal(r)
}

// Scan implements sql.Scanner for Requirements
func (r *Requirements) Scan(value interface{}) error {
	if value == nil {
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, r)
}

// Value implements driver.Valuer for Hints
func (h Hints) Value() (driver.Value, error) {
	return json.Marshal(h)
}

// Scan implements sql.Scanner for Hints
func (h *Hints) Scan(value interface{}) error {
	if value == nil {
		*h = []string{}
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, h)
}

// Value implements driver.Valuer for Goals
func (g Goals) Value() (driver.Value, error) {
	return json.Marshal(g)
}

// Scan implements sql.Scanner for Goals
func (g *Goals) Scan(value interface{}) error {
	if value == nil {
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, g)
}

// Value implements driver.Valuer for ScoreBreakdown
func (s ScoreBreakdown) Value() (driver.Value, error) {
	return json.Marshal(s)
}

// Scan implements sql.Scanner for ScoreBreakdown
func (s *ScoreBreakdown) Scan(value interface{}) error {
	if value == nil {
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, s)
}
