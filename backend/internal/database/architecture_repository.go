package database

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/google/uuid"
	"github.com/yourusername/visualization-backend/internal/database/models"
)

// CreateArchitecture saves a new architecture design
func (r *Repository) CreateArchitecture(ctx context.Context, arch *models.Architecture) error {
	query := `
		INSERT INTO architectures (user_id, scenario_id, title, description, canvas_data, is_submitted, score, feedback)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, created_at, updated_at
	`
	
	return r.db.QueryRowContext(
		ctx,
		query,
		arch.UserID,
		arch.ScenarioID,
		arch.Title,
		arch.Description,
		arch.CanvasData,
		arch.IsSubmitted,
		arch.Score,
		arch.Feedback,
	).Scan(&arch.ID, &arch.CreatedAt, &arch.UpdatedAt)
}

// UpdateArchitecture updates an existing architecture
func (r *Repository) UpdateArchitecture(ctx context.Context, arch *models.Architecture) error {
	query := `
		UPDATE architectures
		SET title = $1, description = $2, canvas_data = $3, is_submitted = $4, score = $5, feedback = $6
		WHERE id = $7 AND user_id = $8
		RETURNING updated_at
	`
	
	return r.db.QueryRowContext(
		ctx,
		query,
		arch.Title,
		arch.Description,
		arch.CanvasData,
		arch.IsSubmitted,
		arch.Score,
		arch.Feedback,
		arch.ID,
		arch.UserID,
	).Scan(&arch.UpdatedAt)
}

// GetArchitectureByID retrieves an architecture by ID
func (r *Repository) GetArchitectureByID(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*models.Architecture, error) {
	var arch models.Architecture
	
	query := `
		SELECT id, user_id, scenario_id, title, description, canvas_data, is_submitted, score, feedback, created_at, updated_at
		FROM architectures
		WHERE id = $1 AND user_id = $2
	`
	
	err := r.db.QueryRowContext(ctx, query, id, userID).Scan(
		&arch.ID,
		&arch.UserID,
		&arch.ScenarioID,
		&arch.Title,
		&arch.Description,
		&arch.CanvasData,
		&arch.IsSubmitted,
		&arch.Score,
		&arch.Feedback,
		&arch.CreatedAt,
		&arch.UpdatedAt,
	)
	
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("architecture not found")
	}
	
	return &arch, err
}

// GetUserArchitectures retrieves all architectures for a user
func (r *Repository) GetUserArchitectures(ctx context.Context, userID uuid.UUID, limit, offset int) ([]models.ArchitectureListItem, error) {
	query := `
		SELECT 
			id, 
			title, 
			description, 
			scenario_id,
			jsonb_array_length(canvas_data->'nodes') as node_count,
			jsonb_array_length(canvas_data->'edges') as edge_count,
			is_submitted, 
			score, 
			created_at, 
			updated_at
		FROM architectures
		WHERE user_id = $1
		ORDER BY updated_at DESC
		LIMIT $2 OFFSET $3
	`
	
	rows, err := r.db.QueryContext(ctx, query, userID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	
	var architectures []models.ArchitectureListItem
	for rows.Next() {
		var arch models.ArchitectureListItem
		err := rows.Scan(
			&arch.ID,
			&arch.Title,
			&arch.Description,
			&arch.ScenarioID,
			&arch.NodeCount,
			&arch.EdgeCount,
			&arch.IsSubmitted,
			&arch.Score,
			&arch.CreatedAt,
			&arch.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		architectures = append(architectures, arch)
	}
	
	return architectures, rows.Err()
}

// GetStandaloneArchitectures retrieves only standalone architectures (without scenario_id)
func (r *Repository) GetStandaloneArchitectures(ctx context.Context, userID uuid.UUID, limit, offset int) ([]models.ArchitectureListItem, error) {
	query := `
		SELECT 
			id, 
			title, 
			description, 
			scenario_id,
			jsonb_array_length(canvas_data->'nodes') as node_count,
			jsonb_array_length(canvas_data->'edges') as edge_count,
			is_submitted, 
			score, 
			created_at, 
			updated_at
		FROM architectures
		WHERE user_id = $1 AND scenario_id IS NULL
		ORDER BY updated_at DESC
		LIMIT $2 OFFSET $3
	`
	
	rows, err := r.db.QueryContext(ctx, query, userID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	
	var architectures []models.ArchitectureListItem
	for rows.Next() {
		var arch models.ArchitectureListItem
		err := rows.Scan(
			&arch.ID,
			&arch.Title,
			&arch.Description,
			&arch.ScenarioID,
			&arch.NodeCount,
			&arch.EdgeCount,
			&arch.IsSubmitted,
			&arch.Score,
			&arch.CreatedAt,
			&arch.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		architectures = append(architectures, arch)
	}
	
	return architectures, rows.Err()
}

// GetArchitecturesByScenario retrieves all architectures for a specific scenario
func (r *Repository) GetArchitecturesByScenario(ctx context.Context, userID uuid.UUID, scenarioID string) ([]models.ArchitectureListItem, error) {
	query := `
		SELECT 
			id, 
			title, 
			description, 
			scenario_id,
			jsonb_array_length(canvas_data->'nodes') as node_count,
			jsonb_array_length(canvas_data->'edges') as edge_count,
			is_submitted, 
			score, 
			created_at, 
			updated_at
		FROM architectures
		WHERE user_id = $1 AND scenario_id = $2
		ORDER BY updated_at DESC
	`
	
	rows, err := r.db.QueryContext(ctx, query, userID, scenarioID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	
	var architectures []models.ArchitectureListItem
	for rows.Next() {
		var arch models.ArchitectureListItem
		err := rows.Scan(
			&arch.ID,
			&arch.Title,
			&arch.Description,
			&arch.ScenarioID,
			&arch.NodeCount,
			&arch.EdgeCount,
			&arch.IsSubmitted,
			&arch.Score,
			&arch.CreatedAt,
			&arch.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		architectures = append(architectures, arch)
	}
	
	return architectures, rows.Err()
}

// DeleteArchitecture deletes an architecture
func (r *Repository) DeleteArchitecture(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	query := `DELETE FROM architectures WHERE id = $1 AND user_id = $2`
	
	result, err := r.db.ExecContext(ctx, query, id, userID)
	if err != nil {
		return err
	}
	
	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	
	if rows == 0 {
		return fmt.Errorf("architecture not found")
	}
	
	return nil
}

// CountStandaloneArchitectures counts standalone architectures (no scenario_id) for a user
func (r *Repository) CountStandaloneArchitectures(ctx context.Context, userID uuid.UUID) (int, error) {
	var count int
	query := `SELECT COUNT(*) FROM architectures WHERE user_id = $1 AND scenario_id IS NULL`
	
	err := r.db.QueryRowContext(ctx, query, userID).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to count standalone architectures: %w", err)
	}
	
	return count, nil
}

// CountArchitecturesByScenario counts architectures for a specific scenario and user
func (r *Repository) CountArchitecturesByScenario(ctx context.Context, userID uuid.UUID, scenarioID string) (int, error) {
	var count int
	query := `SELECT COUNT(*) FROM architectures WHERE user_id = $1 AND scenario_id = $2`
	
	err := r.db.QueryRowContext(ctx, query, userID, scenarioID).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to count architectures by scenario: %w", err)
	}
	
	return count, nil
}
