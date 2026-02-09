package gallery

import (
	"database/sql"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
	"github.com/yourusername/visualization-backend/internal/database/models"
)

var (
	ErrArchitectureNotFound      = errors.New("architecture not found")
	ErrAlreadyPublished          = errors.New("architecture already published")
	ErrNotAuthorized             = errors.New("not authorized")
	ErrPublicArchitectureNotFound = errors.New("public architecture not found")
	ErrAlreadyLiked              = errors.New("already liked")
	ErrNotLiked                  = errors.New("not liked")
)

type Service struct {
	db *sqlx.DB
}

func NewService(db *sql.DB) *Service {
	return &Service{db: sqlx.NewDb(db, "postgres")}
}

// PublishArchitecture publishes an architecture to the gallery
func (s *Service) PublishArchitecture(userID uuid.UUID, req models.PublishArchitectureRequest) (*models.PublicArchitecture, error) {
	// 1. Verify architecture exists and belongs to user
	var arch models.Architecture
	err := s.db.Get(&arch, "SELECT id, user_id, canvas_data FROM architectures WHERE id = $1 AND user_id = $2", req.ArchitectureID, userID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrArchitectureNotFound
		}
		return nil, fmt.Errorf("failed to get architecture: %w", err)
	}

	// 2. Count nodes and edges
	nodeCount := len(arch.CanvasData.Nodes)
	edgeCount := len(arch.CanvasData.Edges)

	// 3. Insert into public_architectures
	pubArch := &models.PublicArchitecture{
		ID:             uuid.New(),
		ArchitectureID: req.ArchitectureID,
		UserID:         userID,
		Title:          req.Title,
		Description:    req.Description,
		Tags:           req.Tags,
		Category:       req.Category,
		Complexity:     req.Complexity,
		NodeCount:      nodeCount,
		EdgeCount:      edgeCount,
	}

	query := `
		INSERT INTO public_architectures (
			id, architecture_id, user_id, title, description, tags, category, complexity, node_count, edge_count
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10
		) RETURNING published_at, updated_at, view_count, clone_count, like_count, comment_count, is_featured
	`

	err = s.db.QueryRow(
		query,
		pubArch.ID, pubArch.ArchitectureID, pubArch.UserID, pubArch.Title, pubArch.Description,
		pq.Array(pubArch.Tags), pubArch.Category, pubArch.Complexity, pubArch.NodeCount, pubArch.EdgeCount,
	).Scan(&pubArch.PublishedAt, &pubArch.UpdatedAt, &pubArch.ViewCount, &pubArch.CloneCount, &pubArch.LikeCount, &pubArch.CommentCount, &pubArch.IsFeatured)

	if err != nil {
		if pqErr, ok := err.(*pq.Error); ok && pqErr.Code == "23505" { // unique violation
			return nil, ErrAlreadyPublished
		}
		return nil, fmt.Errorf("failed to publish architecture: %w", err)
	}

	return pubArch, nil
}

// BrowseGallery returns paginated list of public architectures
func (s *Service) BrowseGallery(filters models.GalleryFilters, userID *uuid.UUID) (*models.GalleryListResponse, error) {
	// Set defaults
	if filters.Limit == 0 {
		filters.Limit = 20
	}
	if filters.Page < 1 {
		filters.Page = 1
	}
	if filters.SortBy == nil {
		defaultSort := "recent"
		filters.SortBy = &defaultSort
	}

	offset := (filters.Page - 1) * filters.Limit

	// Build WHERE clause
	whereClauses := []string{}
	args := []interface{}{}
	argIndex := 1

	if filters.Category != nil && *filters.Category != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("pa.category = $%d", argIndex))
		args = append(args, *filters.Category)
		argIndex++
	}

	if filters.Complexity != nil && *filters.Complexity != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("pa.complexity = $%d", argIndex))
		args = append(args, *filters.Complexity)
		argIndex++
	}

	if len(filters.Tags) > 0 {
		whereClauses = append(whereClauses, fmt.Sprintf("pa.tags && $%d", argIndex))
		args = append(args, pq.Array(filters.Tags))
		argIndex++
	}

	if filters.Search != nil && *filters.Search != "" {
		searchTerm := "%" + *filters.Search + "%"
		whereClauses = append(whereClauses, fmt.Sprintf("(pa.title ILIKE $%d OR pa.description ILIKE $%d)", argIndex, argIndex))
		args = append(args, searchTerm)
		argIndex++
	}

	whereClause := ""
	if len(whereClauses) > 0 {
		whereClause = "WHERE " + strings.Join(whereClauses, " AND ")
	}

	// Build ORDER BY clause
	orderBy := "pa.published_at DESC"
	switch *filters.SortBy {
	case "popular":
		orderBy = "pa.clone_count DESC, pa.view_count DESC"
	case "liked":
		orderBy = "pa.like_count DESC"
	case "viewed":
		orderBy = "pa.view_count DESC"
	}

	// Count total
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM public_architectures pa %s", whereClause)
	var total int
	err := s.db.Get(&total, countQuery, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to count architectures: %w", err)
	}

	// Fetch architectures with author info
	args = append(args, filters.Limit, offset)
	
	selectQuery := fmt.Sprintf(`
		SELECT 
			pa.*,
			u.id as "author.id",
			u.name as "author.name",
			u.email as "author.email",
			u.avatar_url as "author.avatar_url"
		FROM public_architectures pa
		JOIN users u ON pa.user_id = u.id
		%s
		ORDER BY %s
		LIMIT $%d OFFSET $%d
	`, whereClause, orderBy, argIndex, argIndex+1)

	rows, err := s.db.Queryx(selectQuery, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query architectures: %w", err)
	}
	defer rows.Close()

	architectures := []models.PublicArchitecture{}
	for rows.Next() {
		var pa models.PublicArchitecture
		var author models.UserPublic
		
		err := rows.Scan(
			&pa.ID, &pa.ArchitectureID, &pa.UserID, &pa.Title, &pa.Description, &pa.ThumbnailURL,
			pq.Array(&pa.Tags), &pa.Category, &pa.Complexity, &pa.NodeCount, &pa.EdgeCount,
			&pa.IsFeatured, &pa.ViewCount, &pa.CloneCount, &pa.LikeCount, &pa.CommentCount,
			&pa.PublishedAt, &pa.UpdatedAt,
			&author.ID, &author.Name, &author.Email, &author.AvatarURL,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan architecture: %w", err)
		}

		pa.Author = &author

		// Check if current user liked this
		if userID != nil {
			var liked bool
			err := s.db.Get(&liked, "SELECT EXISTS(SELECT 1 FROM gallery_likes WHERE user_id = $1 AND public_architecture_id = $2)", userID, pa.ID)
			if err == nil {
				pa.IsLikedByUser = liked
			}
		}

		architectures = append(architectures, pa)
	}

	totalPages := (total + filters.Limit - 1) / filters.Limit

	return &models.GalleryListResponse{
		Architectures: architectures,
		Total:         total,
		Page:          filters.Page,
		Limit:         filters.Limit,
		TotalPages:    totalPages,
	}, nil
}

// GetPublicArchitecture gets a single public architecture with full details
func (s *Service) GetPublicArchitecture(id uuid.UUID, userID *uuid.UUID) (*models.PublicArchitectureWithDetails, error) {
	// Increment view count
	_, err := s.db.Exec("UPDATE public_architectures SET view_count = view_count + 1 WHERE id = $1", id)
	if err != nil {
		// Non-critical, log but continue
		fmt.Printf("Failed to increment view count: %v\n", err)
	}

	// Get public architecture with author
	var result models.PublicArchitectureWithDetails
	query := `
		SELECT 
			pa.*,
			u.id as "author.id",
			u.name as "author.name",
			u.email as "author.email",
			u.avatar_url as "author.avatar_url"
		FROM public_architectures pa
		JOIN users u ON pa.user_id = u.id
		WHERE pa.id = $1
	`

	row := s.db.QueryRowx(query, id)
	var author models.UserPublic
	
	err = row.Scan(
		&result.ID, &result.ArchitectureID, &result.UserID, &result.Title, &result.Description, &result.ThumbnailURL,
		pq.Array(&result.Tags), &result.Category, &result.Complexity, &result.NodeCount, &result.EdgeCount,
		&result.IsFeatured, &result.ViewCount, &result.CloneCount, &result.LikeCount, &result.CommentCount,
		&result.PublishedAt, &result.UpdatedAt,
		&author.ID, &author.Name, &author.Email, &author.AvatarURL,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrPublicArchitectureNotFound
		}
		return nil, fmt.Errorf("failed to get public architecture: %w", err)
	}

	result.Author = &author

	// Check if user liked this
	if userID != nil {
		var liked bool
		err := s.db.Get(&liked, "SELECT EXISTS(SELECT 1 FROM gallery_likes WHERE user_id = $1 AND public_architecture_id = $2)", userID, id)
		if err == nil {
			result.IsLikedByUser = liked
		}
	}

	// Get full architecture data
	var arch models.Architecture
	err = s.db.Get(&arch, "SELECT * FROM architectures WHERE id = $1", result.ArchitectureID)
	if err != nil {
		return nil, fmt.Errorf("failed to get architecture data: %w", err)
	}

	result.Architecture = &arch
	result.CanvasData = arch.CanvasData

	return &result, nil
}

// CloneArchitecture clones a public architecture to user's workspace
func (s *Service) CloneArchitecture(publicArchID, userID uuid.UUID) (*models.Architecture, error) {
	// Get public architecture - use QueryRowx and Scan with pq.Array for tags
	var pubArch models.PublicArchitecture
	query := "SELECT * FROM public_architectures WHERE id = $1"
	row := s.db.QueryRowx(query, publicArchID)
	
	err := row.Scan(
		&pubArch.ID, &pubArch.ArchitectureID, &pubArch.UserID, &pubArch.Title, &pubArch.Description, &pubArch.ThumbnailURL,
		pq.Array(&pubArch.Tags), &pubArch.Category, &pubArch.Complexity, &pubArch.NodeCount, &pubArch.EdgeCount,
		&pubArch.IsFeatured, &pubArch.ViewCount, &pubArch.CloneCount, &pubArch.LikeCount, &pubArch.CommentCount,
		&pubArch.PublishedAt, &pubArch.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrPublicArchitectureNotFound
		}
		return nil, fmt.Errorf("failed to get public architecture: %w", err)
	}

	// Get original architecture data
	var originalArch models.Architecture
	err = s.db.Get(&originalArch, "SELECT * FROM architectures WHERE id = $1", pubArch.ArchitectureID)
	if err != nil {
		return nil, fmt.Errorf("failed to get architecture data: %w", err)
	}

	// Create new architecture for user
	newArch := &models.Architecture{
		ID:          uuid.New(),
		UserID:      userID,
		ScenarioID:  originalArch.ScenarioID, // Can be NULL
		Title:       fmt.Sprintf("%s (Clone)", pubArch.Title),
		Description: originalArch.Description, // Use original's description
		CanvasData:  originalArch.CanvasData,
		IsSubmitted: false,
	}

	// Build INSERT query with proper NULL handling
	insertQuery := `
		INSERT INTO architectures (id, user_id, scenario_id, title, description, canvas_data, is_submitted)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING created_at, updated_at
	`

	// Use sql.NullString for scenario_id if it's NULL or empty
	var scenarioID sql.NullString
	if originalArch.ScenarioID == nil || *originalArch.ScenarioID == "" {
		scenarioID = sql.NullString{Valid: false}
	} else {
		scenarioID = sql.NullString{String: *originalArch.ScenarioID, Valid: true}
	}

	// Use sql.NullString for description if it's NULL or empty
	var description sql.NullString
	if originalArch.Description == nil || *originalArch.Description == "" {
		description = sql.NullString{Valid: false}
	} else {
		description = sql.NullString{String: *originalArch.Description, Valid: true}
	}

	err = s.db.QueryRow(insertQuery, newArch.ID, newArch.UserID, scenarioID, newArch.Title, description, newArch.CanvasData, newArch.IsSubmitted).
		Scan(&newArch.CreatedAt, &newArch.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to create cloned architecture: %w", err)
	}

	// Increment clone count
	_, err = s.db.Exec("UPDATE public_architectures SET clone_count = clone_count + 1 WHERE id = $1", publicArchID)
	if err != nil {
		fmt.Printf("Failed to increment clone count: %v\n", err)
	}

	return newArch, nil
}

// LikeArchitecture likes/unlikes a public architecture
func (s *Service) LikeArchitecture(publicArchID, userID uuid.UUID) (bool, error) {
	// Check if already liked
	var exists bool
	err := s.db.Get(&exists, "SELECT EXISTS(SELECT 1 FROM gallery_likes WHERE user_id = $1 AND public_architecture_id = $2)", userID, publicArchID)
	if err != nil {
		return false, fmt.Errorf("failed to check like status: %w", err)
	}

	if exists {
		// Unlike
		_, err = s.db.Exec("DELETE FROM gallery_likes WHERE user_id = $1 AND public_architecture_id = $2", userID, publicArchID)
		if err != nil {
			return false, fmt.Errorf("failed to unlike: %w", err)
		}
		return false, nil
	} else {
		// Like
		_, err = s.db.Exec("INSERT INTO gallery_likes (id, user_id, public_architecture_id) VALUES ($1, $2, $3)", uuid.New(), userID, publicArchID)
		if err != nil {
			return false, fmt.Errorf("failed to like: %w", err)
		}
		return true, nil
	}
}

// AddComment adds a comment to a public architecture
func (s *Service) AddComment(publicArchID, userID uuid.UUID, commentText string) (*models.GalleryComment, error) {
	comment := &models.GalleryComment{
		ID:                   uuid.New(),
		PublicArchitectureID: publicArchID,
		UserID:               userID,
		Comment:              commentText,
	}

	query := `
		INSERT INTO gallery_comments (id, public_architecture_id, user_id, comment)
		VALUES ($1, $2, $3, $4)
		RETURNING created_at, updated_at
	`

	err := s.db.QueryRow(query, comment.ID, comment.PublicArchitectureID, comment.UserID, comment.Comment).
		Scan(&comment.CreatedAt, &comment.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to add comment: %w", err)
	}

	// Get author info
	var author models.UserPublic
	err = s.db.Get(&author, "SELECT id, name, email, avatar_url FROM users WHERE id = $1", userID)
	if err == nil {
		comment.Author = &author
	}

	return comment, nil
}

// GetComments gets comments for a public architecture
func (s *Service) GetComments(publicArchID uuid.UUID, limit, offset int) ([]models.GalleryComment, error) {
	if limit == 0 {
		limit = 50
	}

	query := `
		SELECT 
			gc.*,
			u.id as "author.id",
			u.name as "author.name",
			u.email as "author.email",
			u.avatar_url as "author.avatar_url"
		FROM gallery_comments gc
		JOIN users u ON gc.user_id = u.id
		WHERE gc.public_architecture_id = $1
		ORDER BY gc.created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := s.db.Queryx(query, publicArchID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get comments: %w", err)
	}
	defer rows.Close()

	comments := []models.GalleryComment{}
	for rows.Next() {
		var comment models.GalleryComment
		var author models.UserPublic

		err := rows.Scan(
			&comment.ID, &comment.PublicArchitectureID, &comment.UserID, &comment.Comment,
			&comment.CreatedAt, &comment.UpdatedAt,
			&author.ID, &author.Name, &author.Email, &author.AvatarURL,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan comment: %w", err)
		}

		comment.Author = &author
		comments = append(comments, comment)
	}

	return comments, nil
}

// UnpublishArchitecture removes an architecture from the gallery
func (s *Service) UnpublishArchitecture(publicArchID, userID uuid.UUID) error {
	result, err := s.db.Exec("DELETE FROM public_architectures WHERE id = $1 AND user_id = $2", publicArchID, userID)
	if err != nil {
		return fmt.Errorf("failed to unpublish: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return ErrNotAuthorized
	}

	return nil
}
