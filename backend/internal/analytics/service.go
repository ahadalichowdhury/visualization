package analytics

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/yourusername/visualization-backend/internal/database/models"
)

type Service struct {
	db *sqlx.DB
}

func NewService(db *sql.DB) *Service {
	return &Service{db: sqlx.NewDb(db, "postgres")}
}

// SaveSimulationRun saves a simulation run to history
func (s *Service) SaveSimulationRun(architectureID, userID uuid.UUID, workload, results interface{}, durationMs int) error {
	// Extract key metrics for quick access
	metrics := extractMetrics(results)

	query := `
		INSERT INTO simulation_runs (
			id, architecture_id, user_id, workload_config, results, metrics_summary,
			duration_ms, avg_latency_ms, p95_latency_ms, throughput_rps, error_rate_percent, total_cost_usd
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
	`

	_, err := s.db.Exec(query,
		uuid.New(), architectureID, userID, workload, results, metrics,
		durationMs, metrics["avg_latency_ms"], metrics["p95_latency_ms"],
		metrics["throughput_rps"], metrics["error_rate_percent"], metrics["total_cost_usd"],
	)

	return err
}

// GetSimulationHistory returns simulation runs for an architecture
func (s *Service) GetSimulationHistory(architectureID uuid.UUID, limit int) ([]models.SimulationRun, error) {
	if limit == 0 {
		limit = 50
	}

	query := `
		SELECT * FROM simulation_runs
		WHERE architecture_id = $1
		ORDER BY run_at DESC
		LIMIT $2
	`

	runs := []models.SimulationRun{}
	err := s.db.Select(&runs, query, architectureID, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to get simulation history: %w", err)
	}

	return runs, nil
}

// GetPerformanceTrends returns performance metrics over time
func (s *Service) GetPerformanceTrends(architectureID uuid.UUID, days int) ([]models.PerformanceTrend, error) {
	if days == 0 {
		days = 30
	}

	cutoff := time.Now().AddDate(0, 0, -days)

	query := `
		SELECT 
			run_at as timestamp,
			COALESCE(avg_latency_ms, 0) as avg_latency_ms,
			COALESCE(p95_latency_ms, 0) as p95_latency_ms,
			COALESCE(throughput_rps, 0) as throughput_rps,
			COALESCE(error_rate_percent, 0) as error_rate,
			COALESCE(total_cost_usd, 0) as total_cost_usd
		FROM simulation_runs
		WHERE architecture_id = $1 AND run_at >= $2
		ORDER BY run_at ASC
	`

	trends := []models.PerformanceTrend{}
	err := s.db.Select(&trends, query, architectureID, cutoff)
	if err != nil {
		return nil, fmt.Errorf("failed to get performance trends: %w", err)
	}

	return trends, nil
}

// GetCostTrends returns cost history over time
func (s *Service) GetCostTrends(architectureID uuid.UUID, days int) ([]models.CostTrend, error) {
	if days == 0 {
		days = 30
	}

	cutoff := time.Now().AddDate(0, 0, -days)

	query := `
		SELECT 
			calculated_at as timestamp,
			monthly_cost_usd,
			node_count,
			edge_count
		FROM cost_history
		WHERE architecture_id = $1 AND calculated_at >= $2
		ORDER BY calculated_at ASC
	`

	trends := []models.CostTrend{}
	err := s.db.Select(&trends, query, architectureID, cutoff)
	if err != nil {
		return nil, fmt.Errorf("failed to get cost trends: %w", err)
	}

	return trends, nil
}

// CreateSnapshot creates a point-in-time snapshot
func (s *Service) CreateSnapshot(architectureID, userID uuid.UUID, canvasData interface{}, nodeCount, edgeCount int, description string) error {
	query := `
		INSERT INTO architecture_snapshots (
			id, architecture_id, canvas_data, node_count, edge_count, change_description, created_by
		) VALUES ($1, $2, $3, $4, $5, $6, $7)
	`

	_, err := s.db.Exec(query,
		uuid.New(), architectureID, canvasData, nodeCount, edgeCount, description, userID,
	)

	return err
}

// GetSnapshots returns snapshots for an architecture
func (s *Service) GetSnapshots(architectureID uuid.UUID, limit int) ([]models.ArchitectureSnapshot, error) {
	if limit == 0 {
		limit = 20
	}

	query := `
		SELECT * FROM architecture_snapshots
		WHERE architecture_id = $1
		ORDER BY snapshot_at DESC
		LIMIT $2
	`

	snapshots := []models.ArchitectureSnapshot{}
	err := s.db.Select(&snapshots, query, architectureID, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to get snapshots: %w", err)
	}

	return snapshots, nil
}

// GetAnalyticsSummary returns summary statistics for an architecture
func (s *Service) GetAnalyticsSummary(architectureID uuid.UUID) (*models.AnalyticsSummary, error) {
	summary := &models.AnalyticsSummary{}

	// Get total simulations
	err := s.db.Get(&summary.TotalSimulations,
		"SELECT COUNT(*) FROM simulation_runs WHERE architecture_id = $1", architectureID)
	if err != nil {
		return nil, err
	}

	// Get last simulation time
	err = s.db.Get(&summary.LastSimulation,
		"SELECT COALESCE(MAX(run_at), NOW()) FROM simulation_runs WHERE architecture_id = $1", architectureID)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}

	// Get average metrics from recent simulations (last 10)
	query := `
		SELECT 
			COALESCE(AVG(avg_latency_ms), 0) as avg_latency_ms,
			COALESCE(AVG(throughput_rps), 0) as avg_throughput_rps,
			COALESCE(AVG(error_rate_percent), 0) as avg_error_rate
		FROM (
			SELECT avg_latency_ms, throughput_rps, error_rate_percent
			FROM simulation_runs
			WHERE architecture_id = $1
			ORDER BY run_at DESC
			LIMIT 10
		) recent
	`

	err = s.db.QueryRow(query, architectureID).Scan(
		&summary.AvgLatencyMs,
		&summary.AvgThroughputRPS,
		&summary.AvgErrorRate,
	)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}

	// Get current cost from latest cost_history entry
	err = s.db.Get(&summary.CurrentCostUSD,
		"SELECT COALESCE(monthly_cost_usd, 0) FROM cost_history WHERE architecture_id = $1 ORDER BY calculated_at DESC LIMIT 1",
		architectureID)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}

	// Calculate cost trend (compare last 2 cost entries)
	var costTrend []float64
	err = s.db.Select(&costTrend,
		"SELECT monthly_cost_usd FROM cost_history WHERE architecture_id = $1 ORDER BY calculated_at DESC LIMIT 2",
		architectureID)
	if err == nil && len(costTrend) == 2 {
		if costTrend[0] > costTrend[1]*1.1 {
			summary.CostTrend = "increasing"
		} else if costTrend[0] < costTrend[1]*0.9 {
			summary.CostTrend = "decreasing"
		} else {
			summary.CostTrend = "stable"
		}
	} else {
		summary.CostTrend = "stable"
	}

	// Calculate performance trend (compare last 2 simulation P95 latencies)
	var latencyTrend []float64
	err = s.db.Select(&latencyTrend,
		"SELECT p95_latency_ms FROM simulation_runs WHERE architecture_id = $1 AND p95_latency_ms IS NOT NULL ORDER BY run_at DESC LIMIT 2",
		architectureID)
	if err == nil && len(latencyTrend) == 2 {
		if latencyTrend[0] < latencyTrend[1]*0.9 {
			summary.PerformanceTrend = "improving"
		} else if latencyTrend[0] > latencyTrend[1]*1.1 {
			summary.PerformanceTrend = "degrading"
		} else {
			summary.PerformanceTrend = "stable"
		}
	} else {
		summary.PerformanceTrend = "stable"
	}

	return summary, nil
}

// SaveCostHistory saves cost estimation to history
func (s *Service) SaveCostHistory(architectureID uuid.UUID, monthlyCost float64, breakdown interface{}, nodeCount, edgeCount int) error {
	query := `
		INSERT INTO cost_history (
			id, architecture_id, monthly_cost_usd, cost_breakdown, node_count, edge_count
		) VALUES ($1, $2, $3, $4, $5, $6)
	`

	_, err := s.db.Exec(query,
		uuid.New(), architectureID, monthlyCost, breakdown, nodeCount, edgeCount,
	)

	return err
}

// GetInsights returns insights for an architecture
func (s *Service) GetInsights(architectureID uuid.UUID, includeResolved bool) ([]models.ArchitectureInsight, error) {
	query := `
		SELECT * FROM architecture_insights
		WHERE architecture_id = $1
	`

	if !includeResolved {
		query += " AND is_resolved = false"
	}

	query += " ORDER BY detected_at DESC LIMIT 20"

	insights := []models.ArchitectureInsight{}
	err := s.db.Select(&insights, query, architectureID)
	if err != nil {
		return nil, fmt.Errorf("failed to get insights: %w", err)
	}

	return insights, nil
}

// Helper to extract key metrics from simulation results
func extractMetrics(results interface{}) map[string]interface{} {
	metrics := make(map[string]interface{})

	// Type assertion to extract metrics from results
	if resultsMap, ok := results.(map[string]interface{}); ok {
		if metricsData, ok := resultsMap["metrics"].(map[string]interface{}); ok {
			if latency, ok := metricsData["latency"].(map[string]interface{}); ok {
				metrics["avg_latency_ms"] = latency["avg"]
				metrics["p95_latency_ms"] = latency["p95"]
			}
			metrics["throughput_rps"] = metricsData["throughput"]
			metrics["error_rate_percent"] = metricsData["errorRate"]
		}

		if costMetrics, ok := resultsMap["costMetrics"].(map[string]interface{}); ok {
			metrics["total_cost_usd"] = costMetrics["totalCostUSD"]
		}
	}

	return metrics
}
