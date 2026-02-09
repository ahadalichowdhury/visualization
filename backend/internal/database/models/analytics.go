package models

import (
	"time"

	"github.com/google/uuid"
)

// SimulationRun represents a historical simulation execution
type SimulationRun struct {
	ID              uuid.UUID   `json:"id" db:"id"`
	ArchitectureID  uuid.UUID   `json:"architecture_id" db:"architecture_id"`
	UserID          uuid.UUID   `json:"user_id" db:"user_id"`
	WorkloadConfig  interface{} `json:"workload_config" db:"workload_config"`
	Results         interface{} `json:"results" db:"results"`
	MetricsSummary  interface{} `json:"metrics_summary" db:"metrics_summary"`
	RunAt           time.Time   `json:"run_at" db:"run_at"`
	DurationMs      int         `json:"duration_ms" db:"duration_ms"`
	
	// Quick-access metrics
	AvgLatencyMs     *float64 `json:"avg_latency_ms,omitempty" db:"avg_latency_ms"`
	P95LatencyMs     *float64 `json:"p95_latency_ms,omitempty" db:"p95_latency_ms"`
	ThroughputRPS    *float64 `json:"throughput_rps,omitempty" db:"throughput_rps"`
	ErrorRatePercent *float64 `json:"error_rate_percent,omitempty" db:"error_rate_percent"`
	TotalCostUSD     *float64 `json:"total_cost_usd,omitempty" db:"total_cost_usd"`
}

// ArchitectureSnapshot represents a point-in-time snapshot of an architecture
type ArchitectureSnapshot struct {
	ID                uuid.UUID   `json:"id" db:"id"`
	ArchitectureID    uuid.UUID   `json:"architecture_id" db:"architecture_id"`
	CanvasData        interface{} `json:"canvas_data" db:"canvas_data"`
	NodeCount         int         `json:"node_count" db:"node_count"`
	EdgeCount         int         `json:"edge_count" db:"edge_count"`
	SnapshotAt        time.Time   `json:"snapshot_at" db:"snapshot_at"`
	ChangeDescription *string     `json:"change_description,omitempty" db:"change_description"`
	CreatedBy         *uuid.UUID  `json:"created_by,omitempty" db:"created_by"`
}

// CostHistory represents historical cost data
type CostHistory struct {
	ID              uuid.UUID   `json:"id" db:"id"`
	ArchitectureID  uuid.UUID   `json:"architecture_id" db:"architecture_id"`
	MonthlyCostUSD  float64     `json:"monthly_cost_usd" db:"monthly_cost_usd"`
	CostBreakdown   interface{} `json:"cost_breakdown" db:"cost_breakdown"`
	NodeCount       int         `json:"node_count" db:"node_count"`
	EdgeCount       int         `json:"edge_count" db:"edge_count"`
	CalculatedAt    time.Time   `json:"calculated_at" db:"calculated_at"`
}

// ArchitectureInsight represents an AI-generated insight
type ArchitectureInsight struct {
	ID             uuid.UUID `json:"id" db:"id"`
	ArchitectureID uuid.UUID `json:"architecture_id" db:"architecture_id"`
	InsightType    string    `json:"insight_type" db:"insight_type"`
	Severity       string    `json:"severity" db:"severity"`
	Title          string    `json:"title" db:"title"`
	Description    string    `json:"description" db:"description"`
	Suggestions    []string  `json:"suggestions" db:"suggestions"`
	DetectedAt     time.Time `json:"detected_at" db:"detected_at"`
	IsResolved     bool      `json:"is_resolved" db:"is_resolved"`
}

// PerformanceTrend represents performance metrics over time
type PerformanceTrend struct {
	Timestamp      time.Time `json:"timestamp"`
	AvgLatencyMs   float64   `json:"avg_latency_ms"`
	P95LatencyMs   float64   `json:"p95_latency_ms"`
	ThroughputRPS  float64   `json:"throughput_rps"`
	ErrorRate      float64   `json:"error_rate"`
	TotalCostUSD   float64   `json:"total_cost_usd"`
}

// CostTrend represents cost changes over time
type CostTrend struct {
	Timestamp      time.Time `json:"timestamp"`
	MonthlyCostUSD float64   `json:"monthly_cost_usd"`
	NodeCount      int       `json:"node_count"`
	EdgeCount      int       `json:"edge_count"`
}

// AnalyticsSummary provides overview of architecture performance
type AnalyticsSummary struct {
	TotalSimulations  int       `json:"total_simulations"`
	LastSimulation    time.Time `json:"last_simulation"`
	AvgLatencyMs      float64   `json:"avg_latency_ms"`
	AvgThroughputRPS  float64   `json:"avg_throughput_rps"`
	AvgErrorRate      float64   `json:"avg_error_rate"`
	CurrentCostUSD    float64   `json:"current_cost_usd"`
	CostTrend         string    `json:"cost_trend"` // "increasing", "decreasing", "stable"
	PerformanceTrend  string    `json:"performance_trend"` // "improving", "degrading", "stable"
}
