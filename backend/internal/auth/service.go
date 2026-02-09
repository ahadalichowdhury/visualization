package auth

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"regexp"
	"time"

	"github.com/yourusername/visualization-backend/internal/database"
	"github.com/yourusername/visualization-backend/internal/database/models"
)

var (
	ErrInvalidEmail       = errors.New("invalid email format")
	ErrWeakPassword       = errors.New("password must be at least 6 characters")
	ErrEmailExists        = errors.New("email already in use")
	ErrInvalidCredentials = errors.New("invalid email or password")
	ErrPasswordMismatch   = errors.New("passwords do not match")
)

// Service handles authentication business logic
type Service struct {
	repo       *database.Repository
	jwtService *JWTService
}

// NewService creates a new auth service
func NewService(repo *database.Repository, jwtService *JWTService) *Service {
	return &Service{
		repo:       repo,
		jwtService: jwtService,
	}
}

// SignupRequest represents a signup request
type SignupRequest struct {
	Email    string  `json:"email"`
	Password string  `json:"password"`
	Name     *string `json:"name,omitempty"`
}

// LoginRequest represents a login request
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// AuthResponse represents an authentication response
type AuthResponse struct {
	Token string              `json:"token"`
	User  *models.UserProfile `json:"user"`
}

// Signup creates a new user account
func (s *Service) Signup(req SignupRequest) (*AuthResponse, error) {
	// Validate email
	if !isValidEmail(req.Email) {
		return nil, ErrInvalidEmail
	}

	// Validate password
	if len(req.Password) < 6 {
		return nil, ErrWeakPassword
	}

	// Check if email exists
	existingUser, err := s.repo.GetUserByEmail(req.Email)
	if err == nil && existingUser != nil {
		return nil, ErrEmailExists
	}
	if err != nil && !errors.Is(err, database.ErrUserNotFound) {
		return nil, fmt.Errorf("failed to check existing user: %w", err)
	}

	// Hash password
	hashedPassword, err := HashPassword(req.Password)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// Create user
	user := &models.User{
		Email:            req.Email,
		PasswordHash:     &hashedPassword,
		Name:             req.Name,
		SubscriptionTier: models.TierFree, // Default to free tier
	}

	if err := s.repo.CreateUser(user); err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	// Generate JWT token
	token, err := s.jwtService.GenerateToken(user.ID, user.Email, user.SubscriptionTier)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	// Get full profile with progress
	profile, err := s.GetUserProfile(user.ID)
	if err != nil {
		// Fallback to basic profile if progress fetch fails
		profile = user.ToProfile()
	}

	return &AuthResponse{
		Token: token,
		User:  profile,
	}, nil
}

// Login authenticates a user
func (s *Service) Login(req LoginRequest) (*AuthResponse, error) {
	// Get user by email
	user, err := s.repo.GetUserByEmail(req.Email)
	if err != nil {
		if errors.Is(err, database.ErrUserNotFound) {
			return nil, ErrInvalidCredentials
		}
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	// Check if user has a password (OAuth users don't)
	if user.PasswordHash == nil {
		return nil, ErrInvalidCredentials
	}

	// Verify password
	if !CheckPassword(*user.PasswordHash, req.Password) {
		return nil, ErrInvalidCredentials
	}

	// Update last login
	_ = s.repo.UpdateLastLogin(user.ID)

	// Generate JWT token
	token, err := s.jwtService.GenerateToken(user.ID, user.Email, user.SubscriptionTier)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	// Get full profile with progress
	profile, err := s.GetUserProfile(user.ID)
	if err != nil {
		// Fallback to basic profile if progress fetch fails
		profile = user.ToProfile()
	}

	return &AuthResponse{
		Token: token,
		User:  profile,
	}, nil
}

// OAuthSignup creates a new user from OAuth data
func (s *Service) OAuthSignup(provider, providerUID, email string, name, avatarURL *string) (*AuthResponse, error) {
	// Check if user already exists with this provider
	existingUser, err := s.repo.GetUserByProviderUID(provider, providerUID)
	if err == nil && existingUser != nil {
		// User exists, log them in
		return s.loginExistingUser(existingUser)
	}

	// Check if email exists with different provider
	existingUser, err = s.repo.GetUserByEmail(email)
	if err == nil && existingUser != nil {
		// Email exists but with different provider or local auth
		return nil, errors.New("email already registered with different method")
	}

	// Create new user
	user := &models.User{
		Email:            email,
		Name:             name,
		AvatarURL:        avatarURL,
		SubscriptionTier: models.TierFree, // Default to free tier
		Provider:         &provider,
		ProviderUID:      &providerUID,
	}

	if err := s.repo.CreateUser(user); err != nil {
		return nil, fmt.Errorf("failed to create OAuth user: %w", err)
	}

	// Generate JWT token
	token, err := s.jwtService.GenerateToken(user.ID, user.Email, user.SubscriptionTier)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	return &AuthResponse{
		Token: token,
		User:  user.ToProfile(),
	}, nil
}

// RequestPasswordReset initiates password reset process
func (s *Service) RequestPasswordReset(email string) (string, error) {
	// Get user by email
	user, err := s.repo.GetUserByEmail(email)
	if err != nil {
		if errors.Is(err, database.ErrUserNotFound) {
			// Don't reveal if email exists or not
			return "", nil
		}
		return "", fmt.Errorf("failed to get user: %w", err)
	}

	// Generate reset token
	token, err := generateSecureToken(32)
	if err != nil {
		return "", fmt.Errorf("failed to generate token: %w", err)
	}

	// Create password reset record
	reset := &models.PasswordReset{
		UserID:     user.ID,
		ResetToken: token,
		ExpiresAt:  time.Now().Add(30 * time.Minute),
	}

	if err := s.repo.CreatePasswordReset(reset); err != nil {
		return "", fmt.Errorf("failed to create reset: %w", err)
	}

	return token, nil
}

// ResetPassword resets user password using token
func (s *Service) ResetPassword(token, newPassword string) error {
	// Validate new password
	if len(newPassword) < 6 {
		return ErrWeakPassword
	}

	// Get password reset
	reset, err := s.repo.GetPasswordReset(token)
	if err != nil {
		return err
	}

	// Hash new password
	hashedPassword, err := HashPassword(newPassword)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	// Update user password
	if err := s.repo.UpdateUserPassword(reset.UserID, hashedPassword); err != nil {
		return fmt.Errorf("failed to update password: %w", err)
	}

	// Mark reset as used
	if err := s.repo.MarkPasswordResetUsed(reset.ID); err != nil {
		return fmt.Errorf("failed to mark reset as used: %w", err)
	}

	return nil
}

// GetUserProfile retrieves user profile with progress
func (s *Service) GetUserProfile(userID string) (*models.UserProfile, error) {
	user, err := s.repo.GetUserByID(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	profile := user.ToProfile()

	// Get progress
	progress, err := s.repo.GetProgressByUserID(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get progress: %w", err)
	}

	if progress != nil {
		profile.ProgressSummary = progress.ToSummary(user.SubscriptionTier)
	}

	return profile, nil
}

// UpdateProfile updates user profile
func (s *Service) UpdateProfile(userID string, name *string, avatarURL *string) (*models.UserProfile, error) {
	user, err := s.repo.GetUserByID(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	if name != nil {
		user.Name = name
	}
	if avatarURL != nil {
		user.AvatarURL = avatarURL
	}

	if err := s.repo.UpdateUser(user); err != nil {
		return nil, fmt.Errorf("failed to update user: %w", err)
	}

	return s.GetUserProfile(userID)
}

// UpdateSubscriptionTier updates user's subscription tier
func (s *Service) UpdateSubscriptionTier(userID string, newTier string) (*models.UserProfile, error) {
	// Validate tier
	if newTier != models.TierFree && newTier != models.TierPremium && newTier != models.TierAdmin {
		return nil, errors.New("invalid subscription tier")
	}

	user, err := s.repo.GetUserByID(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	// Prevent non-admins from setting admin tier
	// In production, you'd also check if the user has valid payment
	if newTier == models.TierAdmin && user.SubscriptionTier != models.TierAdmin {
		return nil, errors.New("unauthorized to set admin tier")
	}

	if err := s.repo.UpdateUserSubscriptionTier(userID, newTier); err != nil {
		return nil, fmt.Errorf("failed to update subscription tier: %w", err)
	}

	return s.GetUserProfile(userID)
}

// GetUserByEmail retrieves a user by email address
func (s *Service) GetUserByEmail(email string) (*models.User, error) {
	return s.repo.GetUserByEmail(email)
}

// Helper functions

func (s *Service) loginExistingUser(user *models.User) (*AuthResponse, error) {
	_ = s.repo.UpdateLastLogin(user.ID)

	token, err := s.jwtService.GenerateToken(user.ID, user.Email, user.SubscriptionTier)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	return &AuthResponse{
		Token: token,
		User:  user.ToProfile(),
	}, nil
}

func isValidEmail(email string) bool {
	pattern := `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`
	re := regexp.MustCompile(pattern)
	return re.MatchString(email)
}

func generateSecureToken(length int) (string, error) {
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}
