package database

import (
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/yourusername/visualization-backend/internal/database/models"
)

var (
	ErrUserNotFound = errors.New("user not found")
	ErrUserExists   = errors.New("user already exists")
	ErrInvalidToken = errors.New("invalid or expired token")
)

// Repository handles database operations
type Repository struct {
	db *sql.DB
}

// NewRepository creates a new repository
func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

// DB returns the underlying database connection
func (r *Repository) DB() *sql.DB {
	return r.db
}

// User operations

// CreateUser creates a new user
func (r *Repository) CreateUser(user *models.User) error {
	query := `
		INSERT INTO users (email, password_hash, name, avatar_url, subscription_tier, provider, provider_uid)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, created_at, updated_at
	`
	err := r.db.QueryRow(
		query,
		user.Email,
		user.PasswordHash,
		user.Name,
		user.AvatarURL,
		user.SubscriptionTier,
		user.Provider,
		user.ProviderUID,
	).Scan(&user.ID, &user.CreatedAt, &user.UpdatedAt)

	if err != nil {
		if err.Error() == "pq: duplicate key value violates unique constraint \"users_email_key\"" {
			return ErrUserExists
		}
		return fmt.Errorf("failed to create user: %w", err)
	}

	// Create initial progress record
	_, err = r.db.Exec(
		"INSERT INTO progress (user_id) VALUES ($1)",
		user.ID,
	)
	if err != nil {
		return fmt.Errorf("failed to create progress: %w", err)
	}

	return nil
}

// GetUserByEmail retrieves a user by email
func (r *Repository) GetUserByEmail(email string) (*models.User, error) {
	user := &models.User{}
	query := `
		SELECT id, email, password_hash, name, avatar_url, subscription_tier, provider, provider_uid, last_login_at, created_at, updated_at
		FROM users
		WHERE email = $1
	`
	err := r.db.QueryRow(query, email).Scan(
		&user.ID,
		&user.Email,
		&user.PasswordHash,
		&user.Name,
		&user.AvatarURL,
		&user.SubscriptionTier,
		&user.Provider,
		&user.ProviderUID,
		&user.LastLoginAt,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, ErrUserNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	return user, nil
}

// GetUserByID retrieves a user by ID
func (r *Repository) GetUserByID(id string) (*models.User, error) {
	user := &models.User{}
	query := `
		SELECT id, email, password_hash, name, avatar_url, subscription_tier, provider, provider_uid, last_login_at, created_at, updated_at
		FROM users
		WHERE id = $1
	`
	err := r.db.QueryRow(query, id).Scan(
		&user.ID,
		&user.Email,
		&user.PasswordHash,
		&user.Name,
		&user.AvatarURL,
		&user.SubscriptionTier,
		&user.Provider,
		&user.ProviderUID,
		&user.LastLoginAt,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, ErrUserNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	return user, nil
}

// GetUserByProviderUID retrieves a user by OAuth provider UID
func (r *Repository) GetUserByProviderUID(provider, providerUID string) (*models.User, error) {
	user := &models.User{}
	query := `
		SELECT id, email, password_hash, name, avatar_url, subscription_tier, provider, provider_uid, last_login_at, created_at, updated_at
		FROM users
		WHERE provider = $1 AND provider_uid = $2
	`
	err := r.db.QueryRow(query, provider, providerUID).Scan(
		&user.ID,
		&user.Email,
		&user.PasswordHash,
		&user.Name,
		&user.AvatarURL,
		&user.SubscriptionTier,
		&user.Provider,
		&user.ProviderUID,
		&user.LastLoginAt,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, ErrUserNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	return user, nil
}

// UpdateUser updates user information
func (r *Repository) UpdateUser(user *models.User) error {
	query := `
		UPDATE users
		SET name = $1, avatar_url = $2, updated_at = CURRENT_TIMESTAMP
		WHERE id = $3
		RETURNING updated_at
	`
	err := r.db.QueryRow(query, user.Name, user.AvatarURL, user.ID).Scan(&user.UpdatedAt)
	if err != nil {
		return fmt.Errorf("failed to update user: %w", err)
	}
	return nil
}

// UpdateUserPassword updates user password
func (r *Repository) UpdateUserPassword(userID string, passwordHash string) error {
	query := `
		UPDATE users
		SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
		WHERE id = $2
	`
	_, err := r.db.Exec(query, passwordHash, userID)
	if err != nil {
		return fmt.Errorf("failed to update password: %w", err)
	}
	return nil
}

// UpdateLastLogin updates the last login timestamp
func (r *Repository) UpdateLastLogin(userID string) error {
	query := `UPDATE users SET last_login_at = $1 WHERE id = $2`
	_, err := r.db.Exec(query, time.Now(), userID)
	return err
}

// UpdateUserSubscriptionTier updates user subscription tier
func (r *Repository) UpdateUserSubscriptionTier(userID, tier string) error {
	query := `UPDATE users SET subscription_tier = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`
	_, err := r.db.Exec(query, tier, userID)
	if err != nil {
		return fmt.Errorf("failed to update subscription tier: %w", err)
	}
	return nil
}

// Password Reset operations

// CreatePasswordReset creates a password reset request
func (r *Repository) CreatePasswordReset(reset *models.PasswordReset) error {
	query := `
		INSERT INTO password_resets (user_id, reset_token, expires_at)
		VALUES ($1, $2, $3)
		RETURNING id, created_at
	`
	err := r.db.QueryRow(query, reset.UserID, reset.ResetToken, reset.ExpiresAt).
		Scan(&reset.ID, &reset.CreatedAt)
	if err != nil {
		return fmt.Errorf("failed to create password reset: %w", err)
	}
	return nil
}

// GetPasswordReset retrieves a password reset by token
func (r *Repository) GetPasswordReset(token string) (*models.PasswordReset, error) {
	reset := &models.PasswordReset{}
	query := `
		SELECT id, user_id, reset_token, expires_at, used, created_at
		FROM password_resets
		WHERE reset_token = $1 AND used = false AND expires_at > $2
	`
	err := r.db.QueryRow(query, token, time.Now()).Scan(
		&reset.ID,
		&reset.UserID,
		&reset.ResetToken,
		&reset.ExpiresAt,
		&reset.Used,
		&reset.CreatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, ErrInvalidToken
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get password reset: %w", err)
	}

	return reset, nil
}

// MarkPasswordResetUsed marks a password reset as used
func (r *Repository) MarkPasswordResetUsed(resetID string) error {
	query := `UPDATE password_resets SET used = true WHERE id = $1`
	_, err := r.db.Exec(query, resetID)
	return err
}

// UpdateUserStreak updates the user's streak based on activity
func (r *Repository) UpdateUserStreak(userID string) error {
	// Get current progress
	progress, err := r.GetProgressByUserID(userID)
	if err != nil {
		return fmt.Errorf("failed to get user progress for streak update: %w", err)
	}
	if progress == nil {
		return nil // Should not happen, but safe to ignore
	}

	now := time.Now()
	lastUpdate := progress.UpdatedAt

	// Calculate days difference
	// Truncate to start of day for accurate day comparison
	currentDay := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	lastUpdateDay := time.Date(lastUpdate.Year(), lastUpdate.Month(), lastUpdate.Day(), 0, 0, 0, 0, lastUpdate.Location())

	daysDiff := int(currentDay.Sub(lastUpdateDay).Hours() / 24)

	var newStreak int
	switch daysDiff {
	case 0:
		// Activity on the same day, streak unchanged
		return nil
	case 1:
		// Activity on the next day, increment streak
		newStreak = progress.StreakDays + 1
	default:
		// Activity after more than 1 day, reset streak
		newStreak = 1
	}

	// Update streak in database
	query := `UPDATE progress SET streak_days = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2`
	_, err = r.db.Exec(query, newStreak, userID)
	if err != nil {
		return fmt.Errorf("failed to update user streak: %w", err)
	}

	return nil
}

// Progress operations

// GetProgressByUserID retrieves user progress
func (r *Repository) GetProgressByUserID(userID string) (*models.Progress, error) {
	progress := &models.Progress{}
	query := `
		SELECT id, user_id, completed_scenarios_count, streak_days, best_score, created_at, updated_at
		FROM progress
		WHERE user_id = $1
	`
	err := r.db.QueryRow(query, userID).Scan(
		&progress.ID,
		&progress.UserID,
		&progress.CompletedScenariosCount,
		&progress.StreakDays,
		&progress.BestScore,
		&progress.CreatedAt,
		&progress.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil // Progress not found is not an error
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get progress: %w", err)
	}

	return progress, nil
}

// GetAllUsers retrieves all users (admin only)
func (r *Repository) GetAllUsers() ([]*models.User, error) {
	query := `
		SELECT id, email, password_hash, name, avatar_url, subscription_tier, provider, provider_uid, last_login_at, created_at, updated_at
		FROM users
		ORDER BY created_at DESC
	`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to get users: %w", err)
	}
	defer rows.Close()

	users := []*models.User{}
	for rows.Next() {
		user := &models.User{}
		err := rows.Scan(
			&user.ID,
			&user.Email,
			&user.PasswordHash,
			&user.Name,
			&user.AvatarURL,
			&user.SubscriptionTier,
			&user.Provider,
			&user.ProviderUID,
			&user.LastLoginAt,
			&user.CreatedAt,
			&user.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan user: %w", err)
		}
		users = append(users, user)
	}

	return users, nil
}

// Subscription Plan operations

// GetAllSubscriptionPlans retrieves all active subscription plans
func (r *Repository) GetAllSubscriptionPlans() ([]*models.SubscriptionPlan, error) {
	query := `
		SELECT id, name, display_name, price, currency, billing_period, description, 
		       features, limitations, is_highlighted, is_active, sort_order,
		       max_standalone_canvases, max_architectures_per_scenario,
		       collaboration_on_scenarios, collaboration_on_canvases,
		       stripe_price_id, stripe_product_id,
		       created_at, updated_at
		FROM subscription_plans
		WHERE is_active = true
		ORDER BY sort_order ASC
	`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to get subscription plans: %w", err)
	}
	defer rows.Close()

	plans := []*models.SubscriptionPlan{}
	for rows.Next() {
		plan := &models.SubscriptionPlan{}
		err := rows.Scan(
			&plan.ID,
			&plan.Name,
			&plan.DisplayName,
			&plan.Price,
			&plan.Currency,
			&plan.BillingPeriod,
			&plan.Description,
			&plan.Features,
			&plan.Limitations,
			&plan.IsHighlighted,
			&plan.IsActive,
			&plan.SortOrder,
			&plan.MaxStandaloneCanvases,
			&plan.MaxArchitecturesPerScenario,
			&plan.CollaborationOnScenarios,
			&plan.CollaborationOnCanvases,
			&plan.StripePriceID,
			&plan.StripeProductID,
			&plan.CreatedAt,
			&plan.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan subscription plan: %w", err)
		}
		plans = append(plans, plan)
	}

	return plans, nil
}

// GetSubscriptionPlanByName retrieves a subscription plan by name
func (r *Repository) GetSubscriptionPlanByName(name string) (*models.SubscriptionPlan, error) {
	plan := &models.SubscriptionPlan{}
	query := `
		SELECT id, name, display_name, price, currency, billing_period, description,
		       features, limitations, is_highlighted, is_active, sort_order,
		       max_standalone_canvases, max_architectures_per_scenario,
		       collaboration_on_scenarios, collaboration_on_canvases,
		       created_at, updated_at
		FROM subscription_plans
		WHERE name = $1 AND is_active = true
	`
	err := r.db.QueryRow(query, name).Scan(
		&plan.ID,
		&plan.Name,
		&plan.DisplayName,
		&plan.Price,
		&plan.Currency,
		&plan.BillingPeriod,
		&plan.Description,
		&plan.Features,
		&plan.Limitations,
		&plan.IsHighlighted,
		&plan.IsActive,
		&plan.SortOrder,
		&plan.MaxStandaloneCanvases,
		&plan.MaxArchitecturesPerScenario,
		&plan.CollaborationOnScenarios,
		&plan.CollaborationOnCanvases,
		&plan.CreatedAt,
		&plan.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, errors.New("subscription plan not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get subscription plan: %w", err)
	}

	return plan, nil
}

// Stripe Customer operations

// CreateStripeCustomer creates a new Stripe customer record
func (r *Repository) CreateStripeCustomer(stripeCustomer *models.StripeCustomer) error {
	query := `
		INSERT INTO stripe_customers (user_id, stripe_customer_id, stripe_subscription_id, 
		                               subscription_status, current_period_start, current_period_end)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at, updated_at
	`
	err := r.db.QueryRow(
		query,
		stripeCustomer.UserID,
		stripeCustomer.StripeCustomerID,
		stripeCustomer.StripeSubscriptionID,
		stripeCustomer.SubscriptionStatus,
		stripeCustomer.CurrentPeriodStart,
		stripeCustomer.CurrentPeriodEnd,
	).Scan(&stripeCustomer.ID, &stripeCustomer.CreatedAt, &stripeCustomer.UpdatedAt)

	if err != nil {
		return fmt.Errorf("failed to create stripe customer: %w", err)
	}
	return nil
}

// GetStripeCustomerByUserID retrieves Stripe customer by user ID
func (r *Repository) GetStripeCustomerByUserID(userID string) (*models.StripeCustomer, error) {
	customer := &models.StripeCustomer{}
	query := `
		SELECT id, user_id, stripe_customer_id, stripe_subscription_id, subscription_status,
		       current_period_start, current_period_end, cancel_at_period_end, created_at, updated_at
		FROM stripe_customers
		WHERE user_id = $1
	`
	err := r.db.QueryRow(query, userID).Scan(
		&customer.ID,
		&customer.UserID,
		&customer.StripeCustomerID,
		&customer.StripeSubscriptionID,
		&customer.SubscriptionStatus,
		&customer.CurrentPeriodStart,
		&customer.CurrentPeriodEnd,
		&customer.CancelAtPeriodEnd,
		&customer.CreatedAt,
		&customer.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil // No Stripe customer found
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get stripe customer: %w", err)
	}
	return customer, nil
}

// GetStripeCustomerByCustomerID retrieves Stripe customer by Stripe customer ID
func (r *Repository) GetStripeCustomerByCustomerID(stripeCustomerID string) (*models.StripeCustomer, error) {
	customer := &models.StripeCustomer{}
	query := `
		SELECT id, user_id, stripe_customer_id, stripe_subscription_id, subscription_status,
		       current_period_start, current_period_end, cancel_at_period_end, created_at, updated_at
		FROM stripe_customers
		WHERE stripe_customer_id = $1
	`
	err := r.db.QueryRow(query, stripeCustomerID).Scan(
		&customer.ID,
		&customer.UserID,
		&customer.StripeCustomerID,
		&customer.StripeSubscriptionID,
		&customer.SubscriptionStatus,
		&customer.CurrentPeriodStart,
		&customer.CurrentPeriodEnd,
		&customer.CancelAtPeriodEnd,
		&customer.CreatedAt,
		&customer.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil // No Stripe customer found
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get stripe customer by customer ID: %w", err)
	}
	return customer, nil
}

// UpdateStripeCustomer updates Stripe customer information
func (r *Repository) UpdateStripeCustomer(customer *models.StripeCustomer) error {
	query := `
		UPDATE stripe_customers
		SET stripe_subscription_id = $1, subscription_status = $2,
		    current_period_start = $3, current_period_end = $4,
		    cancel_at_period_end = $5, updated_at = CURRENT_TIMESTAMP
		WHERE user_id = $6
		RETURNING updated_at
	`
	err := r.db.QueryRow(
		query,
		customer.StripeSubscriptionID,
		customer.SubscriptionStatus,
		customer.CurrentPeriodStart,
		customer.CurrentPeriodEnd,
		customer.CancelAtPeriodEnd,
		customer.UserID,
	).Scan(&customer.UpdatedAt)

	if err != nil {
		return fmt.Errorf("failed to update stripe customer: %w", err)
	}
	return nil
}

// CreatePaymentHistory creates a payment history record
func (r *Repository) CreatePaymentHistory(payment *models.PaymentHistory) error {
	query := `
		INSERT INTO payment_history (user_id, stripe_customer_id, stripe_payment_intent_id,
		                              stripe_invoice_id, amount, currency, status,
		                              subscription_plan_id, description, payment_method_type, receipt_url)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING id, created_at
	`
	err := r.db.QueryRow(
		query,
		payment.UserID,
		payment.StripeCustomerID,
		payment.StripePaymentIntentID,
		payment.StripeInvoiceID,
		payment.Amount,
		payment.Currency,
		payment.Status,
		payment.SubscriptionPlanID,
		payment.Description,
		payment.PaymentMethodType,
		payment.ReceiptURL,
	).Scan(&payment.ID, &payment.CreatedAt)

	if err != nil {
		return fmt.Errorf("failed to create payment history: %w", err)
	}
	return nil
}

// GetPaymentHistoryByUserID retrieves payment history for a user
func (r *Repository) GetPaymentHistoryByUserID(userID string, limit int) ([]*models.PaymentHistory, error) {
	query := `
		SELECT id, user_id, stripe_customer_id, stripe_payment_intent_id, stripe_invoice_id,
		       amount, currency, status, subscription_plan_id, description,
		       payment_method_type, receipt_url, created_at
		FROM payment_history
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT $2
	`
	rows, err := r.db.Query(query, userID, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to get payment history: %w", err)
	}
	defer rows.Close()

	payments := []*models.PaymentHistory{}
	for rows.Next() {
		payment := &models.PaymentHistory{}
		err := rows.Scan(
			&payment.ID,
			&payment.UserID,
			&payment.StripeCustomerID,
			&payment.StripePaymentIntentID,
			&payment.StripeInvoiceID,
			&payment.Amount,
			&payment.Currency,
			&payment.Status,
			&payment.SubscriptionPlanID,
			&payment.Description,
			&payment.PaymentMethodType,
			&payment.ReceiptURL,
			&payment.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan payment: %w", err)
		}
		payments = append(payments, payment)
	}

	return payments, nil
}
