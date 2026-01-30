package models

import (
	"time"
)

// User represents a user in the system
type User struct {
	ID               string     `json:"id" db:"id"`
	Email            string     `json:"email" db:"email"`
	PasswordHash     *string    `json:"-" db:"password_hash"`
	Name             *string    `json:"name" db:"name"`
	AvatarURL        *string    `json:"avatar_url" db:"avatar_url"`
	Role             string     `json:"role" db:"role"`
	SubscriptionTier string     `json:"subscription_tier" db:"subscription_tier"` // 'free', 'premium', 'admin'
	Provider         *string    `json:"provider,omitempty" db:"provider"`
	ProviderUID      *string    `json:"provider_uid,omitempty" db:"provider_uid"`
	LastLoginAt      *time.Time `json:"last_login_at,omitempty" db:"last_login_at"`
	CreatedAt        time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at" db:"updated_at"`
}

// UserProfile represents the public user profile
type UserProfile struct {
	ID               string           `json:"id"`
	Email            string           `json:"email"`
	Name             *string          `json:"name"`
	AvatarURL        *string          `json:"avatar_url"`
	Role             string           `json:"role"`
	SubscriptionTier string           `json:"subscription_tier"` // 'free', 'premium', 'admin'
	CreatedAt        time.Time        `json:"created_at"`
	ProgressSummary  *ProgressSummary `json:"progress_summary,omitempty"`
}

// ToProfile converts User to UserProfile
func (u *User) ToProfile() *UserProfile {
	return &UserProfile{
		ID:               u.ID,
		Email:            u.Email,
		Name:             u.Name,
		AvatarURL:        u.AvatarURL,
		Role:             u.Role,
		SubscriptionTier: u.SubscriptionTier,
		CreatedAt:        u.CreatedAt,
	}
}

// PasswordReset represents a password reset request
type PasswordReset struct {
	ID         string    `json:"id" db:"id"`
	UserID     string    `json:"user_id" db:"user_id"`
	ResetToken string    `json:"reset_token" db:"reset_token"`
	ExpiresAt  time.Time `json:"expires_at" db:"expires_at"`
	Used       bool      `json:"used" db:"used"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
}

// Progress represents user progress tracking
type Progress struct {
	ID                      string    `json:"id" db:"id"`
	UserID                  string    `json:"user_id" db:"user_id"`
	CompletedScenariosCount int       `json:"completed_scenarios_count" db:"completed_scenarios_count"`
	TotalScenariosAvailable int       `json:"total_scenarios_available" db:"total_scenarios_available"`
	StreakDays              int       `json:"streak_days" db:"streak_days"`
	BestScore               int       `json:"best_score" db:"best_score"`
	CreatedAt               time.Time `json:"created_at" db:"created_at"`
	UpdatedAt               time.Time `json:"updated_at" db:"updated_at"`
}

// ProgressSummary represents a simplified progress view
type ProgressSummary struct {
	CompletedScenarios  int  `json:"completed_scenarios"`
	TotalScenarios      int  `json:"total_scenarios"`
	ProFeaturesUnlocked bool `json:"pro_features_unlocked"`
	StreakDays          int  `json:"streak_days"`
	BestScore           int  `json:"best_score"`
}

// ToSummary converts Progress to ProgressSummary
func (p *Progress) ToSummary(userRole string) *ProgressSummary {
	return &ProgressSummary{
		CompletedScenarios:  p.CompletedScenariosCount,
		TotalScenarios:      p.TotalScenariosAvailable,
		ProFeaturesUnlocked: userRole == "pro" || userRole == "admin",
		StreakDays:          p.StreakDays,
		BestScore:           p.BestScore,
	}
}

// SubscriptionTier constants
const (
	TierFree    = "free"
	TierPremium = "premium"
	TierAdmin   = "admin"
)

// IsFreeUser checks if user is on free tier
func (u *User) IsFreeUser() bool {
	return u.SubscriptionTier == TierFree
}

// IsPremiumUser checks if user is on premium tier or higher
func (u *User) IsPremiumUser() bool {
	return u.SubscriptionTier == TierPremium || u.SubscriptionTier == TierAdmin
}

// IsAdminUser checks if user is admin
func (u *User) IsAdminUser() bool {
	return u.SubscriptionTier == TierAdmin
}

// CanAccessCollaboration checks if user can use collaboration features
func (u *User) CanAccessCollaboration(isScenarioArchitecture bool) bool {
	// Free users: only on standalone canvases, NOT on scenario architectures
	if u.IsFreeUser() {
		return !isScenarioArchitecture
	}
	// Premium and admin: always
	return true
}

// MaxStandaloneCanvases returns max number of standalone canvases allowed
func (u *User) MaxStandaloneCanvases() int {
	if u.IsFreeUser() {
		return 2
	}
	// Unlimited for premium and admin
	return -1
}

// MaxArchitecturesPerScenario returns max number of architectures per scenario
func (u *User) MaxArchitecturesPerScenario() int {
	if u.IsFreeUser() {
		return 1
	}
	// Unlimited for premium and admin
	return -1
}

