package database

import (
	"database/sql"
	"fmt"
	"strings"

	"github.com/yourusername/visualization-backend/internal/database/models"
)

// GetAllScenarios retrieves all active scenarios
func (r *Repository) GetAllScenarios() ([]*models.Scenario, error) {
	query := `
		SELECT id, title, description, category, difficulty, thumbnail_url,
		       requirements, hints, goals, tier, is_active, created_at, updated_at
		FROM scenarios
		WHERE is_active = true
		ORDER BY difficulty, category, title
	`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to get scenarios: %w", err)
	}
	defer rows.Close()

	scenarios := []*models.Scenario{}
	for rows.Next() {
		scenario := &models.Scenario{}
		err := rows.Scan(
			&scenario.ID,
			&scenario.Title,
			&scenario.Description,
			&scenario.Category,
			&scenario.Difficulty,
			&scenario.ThumbnailURL,
			&scenario.Requirements,
			&scenario.Hints,
			&scenario.Goals,
			&scenario.Tier,
			&scenario.IsActive,
			&scenario.CreatedAt,
			&scenario.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan scenario: %w", err)
		}
		scenarios = append(scenarios, scenario)
	}

	return scenarios, nil
}

// GetScenariosPaginated retrieves scenarios with cursor-based pagination
func (r *Repository) GetScenariosPaginated(userRole, cursor string, limit int, category, difficulty, tier, search string) ([]*models.Scenario, string, bool, error) {
	var conditions []string
	var args []interface{}
	argCount := 1

	conditions = append(conditions, "is_active = true")

	// Add cursor condition (created_at, id combination for stable pagination)
	if cursor != "" {
		conditions = append(conditions, fmt.Sprintf("(created_at, id) < (SELECT created_at, id FROM scenarios WHERE id = $%d)", argCount))
		args = append(args, cursor)
		argCount++
	}

	// Add filters
	if category != "" {
		conditions = append(conditions, fmt.Sprintf("category = $%d", argCount))
		args = append(args, category)
		argCount++
	}

	if difficulty != "" {
		conditions = append(conditions, fmt.Sprintf("difficulty = $%d", argCount))
		args = append(args, difficulty)
		argCount++
	}

	// User subscription tier filtering logic
	switch userRole {
	case "free":
		conditions = append(conditions, "tier = 'free'")
	case "premium":
		// Premium can see all, but if they filter by tier, apply it
		if tier != "" {
			conditions = append(conditions, fmt.Sprintf("tier = $%d", argCount))
			args = append(args, tier)
			argCount++
		}
	default:
		// Admin/Other: Standard filtering
		if tier != "" {
			conditions = append(conditions, fmt.Sprintf("tier = $%d", argCount))
			args = append(args, tier)
			argCount++
		}
	}

	if search != "" {
		conditions = append(conditions, fmt.Sprintf("(title ILIKE $%d OR description ILIKE $%d)", argCount, argCount))
		args = append(args, "%"+search+"%")
		argCount++
	}

	// Fetch limit + 1 to check if there are more results
	query := fmt.Sprintf(`
		SELECT id, title, description, category, difficulty, thumbnail_url,
		       requirements, hints, goals, tier, is_active, created_at, updated_at
		FROM scenarios
		WHERE %s
		ORDER BY created_at DESC, id DESC
		LIMIT $%d
	`, strings.Join(conditions, " AND "), argCount)

	args = append(args, limit+1)

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, "", false, fmt.Errorf("failed to get paginated scenarios: %w", err)
	}
	defer rows.Close()

	scenarios := []*models.Scenario{}
	for rows.Next() {
		scenario := &models.Scenario{}
		err := rows.Scan(
			&scenario.ID,
			&scenario.Title,
			&scenario.Description,
			&scenario.Category,
			&scenario.Difficulty,
			&scenario.ThumbnailURL,
			&scenario.Requirements,
			&scenario.Hints,
			&scenario.Goals,
			&scenario.Tier,
			&scenario.IsActive,
			&scenario.CreatedAt,
			&scenario.UpdatedAt,
		)
		if err != nil {
			return nil, "", false, fmt.Errorf("failed to scan scenario: %w", err)
		}
		scenarios = append(scenarios, scenario)
	}

	// Check if there are more results
	hasMore := len(scenarios) > limit
	if hasMore {
		scenarios = scenarios[:limit]
	}

	// Get next cursor (last item's ID)
	var nextCursor string
	if len(scenarios) > 0 {
		nextCursor = scenarios[len(scenarios)-1].ID
	}

	return scenarios, nextCursor, hasMore, nil
}

// GetUserScenariosWithProgressPaginated gets scenarios with user progress using cursor pagination
func (r *Repository) GetUserScenariosWithProgressPaginated(userID, userRole, cursor string, limit int, category, difficulty, tier, search string) ([]*models.ScenarioWithProgress, string, bool, error) {
	var conditions []string
	var args []interface{}
	argCount := 2 // Start at 2 because $1 is userID

	args = append(args, userID)
	conditions = append(conditions, "s.is_active = true")

	// Add cursor condition
	if cursor != "" {
		conditions = append(conditions, fmt.Sprintf("(s.created_at, s.id) < (SELECT created_at, id FROM scenarios WHERE id = $%d)", argCount))
		args = append(args, cursor)
		argCount++
	}

	// Add filters
	if category != "" {
		conditions = append(conditions, fmt.Sprintf("s.category = $%d", argCount))
		args = append(args, category)
		argCount++
	}

	if difficulty != "" {
		conditions = append(conditions, fmt.Sprintf("s.difficulty = $%d", argCount))
		args = append(args, difficulty)
		argCount++
	}

	// User subscription tier filtering logic
	// If userRole (passed as tier here from handler) is "free", force filter to "free" scenarios only
	// regardless of what the user requested filter is.
	// If user is premium/admin, they can filter by tier if they want, or see all if tier is empty.

	switch tier {
	case "free":
		// Logic handles implicit request or explicit free user restriction
		conditions = append(conditions, "s.tier = 'free'")
	case "premium":
		// If user asks for premium specifically
		conditions = append(conditions, "s.tier = 'premium'")
	}

	// BUT, we must enforce subscription limits first:
	// The `tier` argument essentially comes from the query param `?tier=...`.
	// The `GetUserScenariosPaginated` handler currently doesn't pass the USER'S actual subscription tier to this function,
	// it only passes the query param. This is a problem.
	// We need to change the function signature or logic to accept userSubscriptionTier.

	// Wait, looking at the previous handlers, `GetUserScenariosWithProgressPaginated` is called from `GetUserScenariosPaginated`
	// In `GetUserScenariosPaginated` (handler), we extracted `subscriptionTier` from locals, but we didn't pass it to `GetUserScenariosWithProgressPaginated`.
	// We only passed `tier := c.Query("tier", "")`.

	// I need to:
	// 1. Update `GetUserScenariosWithProgressPaginated` signature to accept `userSubscriptionTier`.
	// 2. Update the handler to pass it.
	// 3. Implement the logic here.

	// Let's abort this specific tool call and do it properly with multiple steps or a better plan.

	if search != "" {
		conditions = append(conditions, fmt.Sprintf("(s.title ILIKE $%d OR s.description ILIKE $%d)", argCount, argCount))
		args = append(args, "%"+search+"%")
		argCount++
	}

	query := fmt.Sprintf(`
		SELECT s.id, s.title, s.description, s.category, s.difficulty, 
		       s.thumbnail_url, s.requirements, s.hints, s.goals, s.tier, s.is_active, s.created_at, s.updated_at,
		       COALESCE(p.status, 'not_started') as status,
		       COALESCE(p.steps_completed, 0) as steps_completed,
		       p.score
		FROM scenarios s
		LEFT JOIN user_scenario_progress p ON s.id = p.scenario_id AND p.user_id = $1
		WHERE %s
		ORDER BY s.created_at DESC, s.id DESC
		LIMIT $%d
	`, strings.Join(conditions, " AND "), argCount)

	args = append(args, limit+1)

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, "", false, fmt.Errorf("failed to get paginated scenarios with progress: %w", err)
	}
	defer rows.Close()

	scenarios := []*models.ScenarioWithProgress{}
	for rows.Next() {
		swp := &models.ScenarioWithProgress{}
		err := rows.Scan(
			&swp.ID,
			&swp.Title,
			&swp.Description,
			&swp.Category,
			&swp.Difficulty,
			&swp.ThumbnailURL,
			&swp.Requirements,
			&swp.Hints,
			&swp.Goals,
			&swp.Tier,
			&swp.IsActive,
			&swp.CreatedAt,
			&swp.UpdatedAt,
			&swp.Status,
			&swp.StepsCompleted,
			&swp.Score,
		)
		if err != nil {
			return nil, "", false, fmt.Errorf("failed to scan scenario with progress: %w", err)
		}
		scenarios = append(scenarios, swp)
	}

	// Check if there are more results
	hasMore := len(scenarios) > limit
	if hasMore {
		scenarios = scenarios[:limit]
	}

	// Get next cursor
	var nextCursor string
	if len(scenarios) > 0 {
		nextCursor = scenarios[len(scenarios)-1].ID
	}

	return scenarios, nextCursor, hasMore, nil
}

// GetScenarioByID retrieves a scenario by ID
func (r *Repository) GetScenarioByID(id string) (*models.Scenario, error) {
	scenario := &models.Scenario{}
	query := `
		SELECT id, title, description, category, difficulty, thumbnail_url,
		       requirements, hints, goals, tier, is_active, created_at, updated_at
		FROM scenarios
		WHERE id = $1 AND is_active = true
	`
	err := r.db.QueryRow(query, id).Scan(
		&scenario.ID,
		&scenario.Title,
		&scenario.Description,
		&scenario.Category,
		&scenario.Difficulty,
		&scenario.ThumbnailURL,
		&scenario.Requirements,
		&scenario.Hints,
		&scenario.Goals,
		&scenario.Tier,
		&scenario.IsActive,
		&scenario.CreatedAt,
		&scenario.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("scenario not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get scenario: %w", err)
	}

	return scenario, nil
}

// SearchScenarios searches and filters scenarios
func (r *Repository) SearchScenarios(category, difficulty, search string) ([]*models.Scenario, error) {
	var conditions []string
	var args []interface{}
	argCount := 1

	conditions = append(conditions, "is_active = true")

	if category != "" {
		conditions = append(conditions, fmt.Sprintf("category = $%d", argCount))
		args = append(args, category)
		argCount++
	}

	if difficulty != "" {
		conditions = append(conditions, fmt.Sprintf("difficulty = $%d", argCount))
		args = append(args, difficulty)
		argCount++
	}

	if search != "" {
		conditions = append(conditions, fmt.Sprintf("(title ILIKE $%d OR description ILIKE $%d)", argCount, argCount))
		args = append(args, "%"+search+"%")
		argCount++
	}

	query := fmt.Sprintf(`
		SELECT id, title, description, category, difficulty, thumbnail_url,
		       requirements, hints, goals, tier, is_active, created_at, updated_at
		FROM scenarios
		WHERE %s
		ORDER BY difficulty, category, title
	`, strings.Join(conditions, " AND "))

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to search scenarios: %w", err)
	}
	defer rows.Close()

	scenarios := []*models.Scenario{}
	for rows.Next() {
		scenario := &models.Scenario{}
		err := rows.Scan(
			&scenario.ID,
			&scenario.Title,
			&scenario.Description,
			&scenario.Category,
			&scenario.Difficulty,
			&scenario.ThumbnailURL,
			&scenario.Requirements,
			&scenario.Hints,
			&scenario.Goals,
			&scenario.Tier,
			&scenario.IsActive,
			&scenario.CreatedAt,
			&scenario.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan scenario: %w", err)
		}
		scenarios = append(scenarios, scenario)
	}

	return scenarios, nil
}

// GetScenarioCategories retrieves all unique categories
func (r *Repository) GetScenarioCategories() ([]string, error) {
	query := `
		SELECT DISTINCT category
		FROM scenarios
		WHERE is_active = true
		ORDER BY category
	`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to get categories: %w", err)
	}
	defer rows.Close()

	categories := []string{}
	for rows.Next() {
		var category string
		if err := rows.Scan(&category); err != nil {
			return nil, fmt.Errorf("failed to scan category: %w", err)
		}
		categories = append(categories, category)
	}

	return categories, nil
}

// CreateScenario creates a new scenario (admin only)
func (r *Repository) CreateScenario(scenario *models.Scenario) error {
	query := `
		INSERT INTO scenarios (id, title, description, category, difficulty, 
		                       thumbnail_url, requirements, hints, goals, tier, is_active)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING created_at, updated_at
	`
	err := r.db.QueryRow(
		query,
		scenario.ID,
		scenario.Title,
		scenario.Description,
		scenario.Category,
		scenario.Difficulty,
		scenario.ThumbnailURL,
		scenario.Requirements,
		scenario.Hints,
		scenario.Goals,
		scenario.Tier,
		scenario.IsActive,
	).Scan(&scenario.CreatedAt, &scenario.UpdatedAt)

	if err != nil {
		return fmt.Errorf("failed to create scenario: %w", err)
	}

	return nil
}

// User Scenario Progress Operations

// GetUserScenarioProgress gets user's progress for a specific scenario
func (r *Repository) GetUserScenarioProgress(userID, scenarioID string) (*models.UserScenarioProgress, error) {
	progress := &models.UserScenarioProgress{}
	query := `
		SELECT id, user_id, scenario_id, status, steps_completed, total_steps, 
		       score, score_breakdown, completed_at, created_at, updated_at
		FROM user_scenario_progress
		WHERE user_id = $1 AND scenario_id = $2
	`
	err := r.db.QueryRow(query, userID, scenarioID).Scan(
		&progress.ID,
		&progress.UserID,
		&progress.ScenarioID,
		&progress.Status,
		&progress.StepsCompleted,
		&progress.TotalSteps,
		&progress.Score,
		&progress.ScoreBreakdown,
		&progress.CompletedAt,
		&progress.CreatedAt,
		&progress.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil // No progress yet
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get user scenario progress: %w", err)
	}

	return progress, nil
}

// GetUserAllProgress gets all progress records for a user
func (r *Repository) GetUserAllProgress(userID string) ([]*models.UserScenarioProgress, error) {
	query := `
		SELECT id, user_id, scenario_id, status, steps_completed, total_steps,
		       score, score_breakdown, completed_at, created_at, updated_at
		FROM user_scenario_progress
		WHERE user_id = $1
		ORDER BY updated_at DESC
	`
	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user progress: %w", err)
	}
	defer rows.Close()

	progressList := []*models.UserScenarioProgress{}
	for rows.Next() {
		progress := &models.UserScenarioProgress{}
		err := rows.Scan(
			&progress.ID,
			&progress.UserID,
			&progress.ScenarioID,
			&progress.Status,
			&progress.StepsCompleted,
			&progress.TotalSteps,
			&progress.Score,
			&progress.ScoreBreakdown,
			&progress.CompletedAt,
			&progress.CreatedAt,
			&progress.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan progress: %w", err)
		}
		progressList = append(progressList, progress)
	}

	return progressList, nil
}

// CreateOrUpdateUserScenarioProgress creates or updates user progress
func (r *Repository) CreateOrUpdateUserScenarioProgress(progress *models.UserScenarioProgress) error {
	query := `
		INSERT INTO user_scenario_progress 
		    (user_id, scenario_id, status, steps_completed, total_steps, score, score_breakdown, completed_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		ON CONFLICT (user_id, scenario_id) 
		DO UPDATE SET
		    status = EXCLUDED.status,
		    steps_completed = EXCLUDED.steps_completed,
		    total_steps = EXCLUDED.total_steps,
		    score = EXCLUDED.score,
		    score_breakdown = EXCLUDED.score_breakdown,
		    completed_at = EXCLUDED.completed_at,
		    updated_at = CURRENT_TIMESTAMP
		RETURNING id, created_at, updated_at
	`
	err := r.db.QueryRow(
		query,
		progress.UserID,
		progress.ScenarioID,
		progress.Status,
		progress.StepsCompleted,
		progress.TotalSteps,
		progress.Score,
		progress.ScoreBreakdown,
		progress.CompletedAt,
	).Scan(&progress.ID, &progress.CreatedAt, &progress.UpdatedAt)

	if err != nil {
		return fmt.Errorf("failed to create/update progress: %w", err)
	}

	return nil
}

// GetUserScenariosWithProgress gets all scenarios with user progress
func (r *Repository) GetUserScenariosWithProgress(userID string) ([]*models.ScenarioWithProgress, error) {
	query := `
		SELECT s.id, s.title, s.description, s.category, s.difficulty, 
		       s.thumbnail_url, s.requirements, s.hints, s.goals, s.tier, s.is_active, s.created_at, s.updated_at,
		       COALESCE(p.status, 'not_started') as status,
		       COALESCE(p.steps_completed, 0) as steps_completed,
		       p.score
		FROM scenarios s
		LEFT JOIN user_scenario_progress p ON s.id = p.scenario_id AND p.user_id = $1
		WHERE s.is_active = true
		ORDER BY s.difficulty, s.category, s.title
	`
	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get scenarios with progress: %w", err)
	}
	defer rows.Close()

	scenarios := []*models.ScenarioWithProgress{}
	for rows.Next() {
		swp := &models.ScenarioWithProgress{}
		err := rows.Scan(
			&swp.ID,
			&swp.Title,
			&swp.Description,
			&swp.Category,
			&swp.Difficulty,
			&swp.ThumbnailURL,
			&swp.Requirements,
			&swp.Hints,
			&swp.Goals,
			&swp.Tier,
			&swp.IsActive,
			&swp.CreatedAt,
			&swp.UpdatedAt,
			&swp.Status,
			&swp.StepsCompleted,
			&swp.Score,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan scenario with progress: %w", err)
		}
		scenarios = append(scenarios, swp)
	}

	return scenarios, nil
}

// UpdateUserCompletedScenariosCount updates the count of completed scenarios for a user
func (r *Repository) UpdateUserCompletedScenariosCount(userID string, count int) error {
	query := `UPDATE progress SET completed_scenarios_count = $1 WHERE user_id = $2`
	_, err := r.db.Exec(query, count, userID)
	return err
}

// GetScenariosForUserRole retrieves scenarios based on user role (free/pro/admin)
// Free users only see 'free' tier scenarios, premium users see all scenarios
func (r *Repository) GetScenariosForUserRole(userRole string) ([]*models.Scenario, error) {
	var query string

	if userRole == "free" {
		// Free users only see free tier scenarios
		query = `
			SELECT id, title, description, category, difficulty, thumbnail_url,
			       requirements, hints, goals, tier, is_active, created_at, updated_at
			FROM scenarios
			WHERE is_active = true AND tier = 'free'
			ORDER BY difficulty, category, title
		`
	} else {
		// Premium and admin users see all scenarios
		query = `
			SELECT id, title, description, category, difficulty, thumbnail_url,
			       requirements, hints, goals, tier, is_active, created_at, updated_at
			FROM scenarios
			WHERE is_active = true
			ORDER BY difficulty, category, title
		`
	}

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to get scenarios for user role: %w", err)
	}
	defer rows.Close()

	scenarios := []*models.Scenario{}
	for rows.Next() {
		scenario := &models.Scenario{}
		err := rows.Scan(
			&scenario.ID,
			&scenario.Title,
			&scenario.Description,
			&scenario.Category,
			&scenario.Difficulty,
			&scenario.ThumbnailURL,
			&scenario.Requirements,
			&scenario.Hints,
			&scenario.Goals,
			&scenario.Tier,
			&scenario.IsActive,
			&scenario.CreatedAt,
			&scenario.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan scenario: %w", err)
		}
		scenarios = append(scenarios, scenario)
	}

	return scenarios, nil
}

// GetUserScenariosWithProgressForRole gets scenarios with user progress filtered by user role
func (r *Repository) GetUserScenariosWithProgressForRole(userID, userRole string) ([]*models.ScenarioWithProgress, error) {
	var query string

	if userRole == "free" {
		// Free users only see free tier scenarios
		query = `
			SELECT s.id, s.title, s.description, s.category, s.difficulty, 
			       s.thumbnail_url, s.requirements, s.hints, s.goals, s.tier, s.is_active, s.created_at, s.updated_at,
			       COALESCE(p.status, 'not_started') as status,
			       COALESCE(p.steps_completed, 0) as steps_completed,
			       p.score
			FROM scenarios s
			LEFT JOIN user_scenario_progress p ON s.id = p.scenario_id AND p.user_id = $1
			WHERE s.is_active = true AND s.tier = 'free'
			ORDER BY s.difficulty, s.category, s.title
		`
	} else {
		// Premium and admin users see all scenarios
		query = `
			SELECT s.id, s.title, s.description, s.category, s.difficulty, 
			       s.thumbnail_url, s.requirements, s.hints, s.goals, s.tier, s.is_active, s.created_at, s.updated_at,
			       COALESCE(p.status, 'not_started') as status,
			       COALESCE(p.steps_completed, 0) as steps_completed,
			       p.score
			FROM scenarios s
			LEFT JOIN user_scenario_progress p ON s.id = p.scenario_id AND p.user_id = $1
			WHERE s.is_active = true
			ORDER BY s.difficulty, s.category, s.title
		`
	}

	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get scenarios with progress for role: %w", err)
	}
	defer rows.Close()

	scenarios := []*models.ScenarioWithProgress{}
	for rows.Next() {
		swp := &models.ScenarioWithProgress{}
		err := rows.Scan(
			&swp.ID,
			&swp.Title,
			&swp.Description,
			&swp.Category,
			&swp.Difficulty,
			&swp.ThumbnailURL,
			&swp.Requirements,
			&swp.Hints,
			&swp.Goals,
			&swp.Tier,
			&swp.IsActive,
			&swp.CreatedAt,
			&swp.UpdatedAt,
			&swp.Status,
			&swp.StepsCompleted,
			&swp.Score,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan scenario with progress: %w", err)
		}
		scenarios = append(scenarios, swp)
	}

	return scenarios, nil
}

// CanUserAccessScenario checks if a user can access a specific scenario based on their role
func (r *Repository) CanUserAccessScenario(userRole, scenarioID string) (bool, error) {
	var tier string
	query := `SELECT tier FROM scenarios WHERE id = $1 AND is_active = true`
	err := r.db.QueryRow(query, scenarioID).Scan(&tier)

	if err == sql.ErrNoRows {
		return false, fmt.Errorf("scenario not found")
	}
	if err != nil {
		return false, fmt.Errorf("failed to check scenario access: %w", err)
	}

	// Free users can only access free tier scenarios
	if userRole == "free" && tier != "free" {
		return false, nil
	}

	// Premium and admin users can access all scenarios
	return true, nil
}
