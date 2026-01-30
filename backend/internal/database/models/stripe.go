package models

import (
	"time"
)

// StripeCustomer represents a Stripe customer record
type StripeCustomer struct {
	ID                   string     `json:"id" db:"id"`
	UserID               string     `json:"user_id" db:"user_id"`
	StripeCustomerID     string     `json:"stripe_customer_id" db:"stripe_customer_id"`
	StripeSubscriptionID *string    `json:"stripe_subscription_id,omitempty" db:"stripe_subscription_id"`
	SubscriptionStatus   *string    `json:"subscription_status,omitempty" db:"subscription_status"`
	CurrentPeriodStart   *time.Time `json:"current_period_start,omitempty" db:"current_period_start"`
	CurrentPeriodEnd     *time.Time `json:"current_period_end,omitempty" db:"current_period_end"`
	CancelAtPeriodEnd    bool       `json:"cancel_at_period_end" db:"cancel_at_period_end"`
	CreatedAt            time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt            time.Time  `json:"updated_at" db:"updated_at"`
}

// PaymentHistory represents a payment transaction
type PaymentHistory struct {
	ID                    string     `json:"id" db:"id"`
	UserID                string     `json:"user_id" db:"user_id"`
	StripeCustomerID      string     `json:"stripe_customer_id" db:"stripe_customer_id"`
	StripePaymentIntentID *string    `json:"stripe_payment_intent_id,omitempty" db:"stripe_payment_intent_id"`
	StripeInvoiceID       *string    `json:"stripe_invoice_id,omitempty" db:"stripe_invoice_id"`
	Amount                float64    `json:"amount" db:"amount"`
	Currency              string     `json:"currency" db:"currency"`
	Status                string     `json:"status" db:"status"`
	SubscriptionPlanID    *string    `json:"subscription_plan_id,omitempty" db:"subscription_plan_id"`
	Description           *string    `json:"description,omitempty" db:"description"`
	PaymentMethodType     *string    `json:"payment_method_type,omitempty" db:"payment_method_type"`
	ReceiptURL            *string    `json:"receipt_url,omitempty" db:"receipt_url"`
	CreatedAt             time.Time  `json:"created_at" db:"created_at"`
}

// SubscriptionStatus constants
const (
	SubscriptionStatusActive     = "active"
	SubscriptionStatusCanceled   = "canceled"
	SubscriptionStatusPastDue    = "past_due"
	SubscriptionStatusIncomplete = "incomplete"
	SubscriptionStatusTrialing   = "trialing"
)

// PaymentStatus constants
const (
	PaymentStatusSucceeded = "succeeded"
	PaymentStatusPending   = "pending"
	PaymentStatusFailed    = "failed"
	PaymentStatusRefunded  = "refunded"
)
