package models

import (
	"time"

	"github.com/google/uuid"
)

// PublicArchitecture represents a publicly shared architecture
type PublicArchitecture struct {
	ID             uuid.UUID  `json:"id" db:"id"`
	ArchitectureID uuid.UUID  `json:"architecture_id" db:"architecture_id"`
	UserID         uuid.UUID  `json:"user_id" db:"user_id"`
	Title          string     `json:"title" db:"title"`
	Description    *string    `json:"description" db:"description"`
	ThumbnailURL   *string    `json:"thumbnail_url" db:"thumbnail_url"`
	Tags           []string   `json:"tags" db:"tags"`
	Category       *string    `json:"category" db:"category"`
	Complexity     *string    `json:"complexity" db:"complexity"`
	NodeCount      int        `json:"node_count" db:"node_count"`
	EdgeCount      int        `json:"edge_count" db:"edge_count"`
	IsFeatured     bool       `json:"is_featured" db:"is_featured"`
	ViewCount      int        `json:"view_count" db:"view_count"`
	CloneCount     int        `json:"clone_count" db:"clone_count"`
	LikeCount      int        `json:"like_count" db:"like_count"`
	CommentCount   int        `json:"comment_count" db:"comment_count"`
	PublishedAt    time.Time  `json:"published_at" db:"published_at"`
	UpdatedAt      time.Time  `json:"updated_at" db:"updated_at"`

	// Relationships (not in DB, populated via joins)
	Author         *UserPublic `json:"author,omitempty" db:"-"`
	IsLikedByUser  bool        `json:"is_liked_by_user" db:"-"`
	CanvasData     interface{} `json:"canvas_data,omitempty" db:"-"`
}

// PublicArchitectureWithDetails includes full architecture data
type PublicArchitectureWithDetails struct {
	PublicArchitecture
	Architecture *Architecture `json:"architecture,omitempty"`
}

// GalleryLike represents a user's like on a public architecture
type GalleryLike struct {
	ID                    uuid.UUID `json:"id" db:"id"`
	UserID                uuid.UUID `json:"user_id" db:"user_id"`
	PublicArchitectureID  uuid.UUID `json:"public_architecture_id" db:"public_architecture_id"`
	CreatedAt             time.Time `json:"created_at" db:"created_at"`
}

// GalleryComment represents a comment on a public architecture
type GalleryComment struct {
	ID                   uuid.UUID   `json:"id" db:"id"`
	PublicArchitectureID uuid.UUID   `json:"public_architecture_id" db:"public_architecture_id"`
	UserID               uuid.UUID   `json:"user_id" db:"user_id"`
	Comment              string      `json:"comment" db:"comment"`
	CreatedAt            time.Time   `json:"created_at" db:"created_at"`
	UpdatedAt            time.Time   `json:"updated_at" db:"updated_at"`

	// Relationships
	Author *UserPublic `json:"author,omitempty" db:"-"`
}

// UserPublic contains safe-to-expose user data
type UserPublic struct {
	ID        uuid.UUID `json:"id" db:"id"`
	Name      string    `json:"name" db:"name"`
	Email     string    `json:"email" db:"email"`
	AvatarURL *string   `json:"avatar_url" db:"avatar_url"`
}

// PublishArchitectureRequest is the request to publish an architecture
type PublishArchitectureRequest struct {
	ArchitectureID uuid.UUID `json:"architecture_id" validate:"required"`
	Title          string    `json:"title" validate:"required"`
	Description    *string   `json:"description"`
	Tags           []string  `json:"tags"`
	Category       *string   `json:"category"`
	Complexity     *string   `json:"complexity" validate:"omitempty,oneof=beginner intermediate advanced"`
}

// GalleryFilters for browsing the gallery
type GalleryFilters struct {
	Category   *string  `query:"category"`
	Complexity *string  `query:"complexity"`
	Tags       []string `query:"tags"`
	Search     *string  `query:"search"`
	SortBy     *string  `query:"sort_by"` // "recent", "popular", "liked", "viewed"
	Page       int      `query:"page"`
	Limit      int      `query:"limit"`
}

// GalleryListResponse is the paginated gallery response
type GalleryListResponse struct {
	Architectures []PublicArchitecture `json:"architectures"`
	Total         int                  `json:"total"`
	Page          int                  `json:"page"`
	Limit         int                  `json:"limit"`
	TotalPages    int                  `json:"total_pages"`
}

// CommentRequest is the request to add a comment
type CommentRequest struct {
	Comment string `json:"comment" validate:"required,min=1,max=1000"`
}
