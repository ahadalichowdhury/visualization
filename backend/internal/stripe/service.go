package stripe

import (
	"fmt"

	"github.com/stripe/stripe-go/v79"
	"github.com/stripe/stripe-go/v79/checkout/session"
	"github.com/stripe/stripe-go/v79/customer"
	"github.com/stripe/stripe-go/v79/subscription"
)

// Service handles Stripe operations
type Service struct {
	apiKey string
}

// NewService creates a new Stripe service
func NewService(apiKey string) *Service {
	stripe.Key = apiKey
	return &Service{
		apiKey: apiKey,
	}
}

// CreateCheckoutSession creates a Stripe Checkout session for subscription
func (s *Service) CreateCheckoutSession(userID, userEmail, priceID, successURL, cancelURL string) (*stripe.CheckoutSession, error) {
	params := &stripe.CheckoutSessionParams{
		Mode: stripe.String(string(stripe.CheckoutSessionModeSubscription)),
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			{
				Price:    stripe.String(priceID),
				Quantity: stripe.Int64(1),
			},
		},
		SuccessURL:        stripe.String(successURL),
		CancelURL:         stripe.String(cancelURL),
		CustomerEmail:     stripe.String(userEmail),
		ClientReferenceID: stripe.String(userID),
		Metadata: map[string]string{
			"user_id": userID,
		},
		SubscriptionData: &stripe.CheckoutSessionSubscriptionDataParams{
			Metadata: map[string]string{
				"user_id": userID,
			},
		},
	}

	sess, err := session.New(params)
	if err != nil {
		return nil, fmt.Errorf("failed to create checkout session: %w", err)
	}

	return sess, nil
}

// CreateCustomer creates a Stripe customer
func (s *Service) CreateCustomer(userID, email, name string) (*stripe.Customer, error) {
	params := &stripe.CustomerParams{
		Email: stripe.String(email),
		Name:  stripe.String(name),
		Metadata: map[string]string{
			"user_id": userID,
		},
	}

	cust, err := customer.New(params)
	if err != nil {
		return nil, fmt.Errorf("failed to create customer: %w", err)
	}

	return cust, nil
}

// GetCustomer retrieves a Stripe customer by ID
func (s *Service) GetCustomer(customerID string) (*stripe.Customer, error) {
	cust, err := customer.Get(customerID, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to get customer: %w", err)
	}
	return cust, nil
}

// CancelSubscription cancels a Stripe subscription
func (s *Service) CancelSubscription(subscriptionID string, cancelAtPeriodEnd bool) (*stripe.Subscription, error) {
	var params *stripe.SubscriptionParams

	if cancelAtPeriodEnd {
		params = &stripe.SubscriptionParams{
			CancelAtPeriodEnd: stripe.Bool(true),
		}
		sub, err := subscription.Update(subscriptionID, params)
		if err != nil {
			return nil, fmt.Errorf("failed to cancel subscription: %w", err)
		}
		return sub, nil
	}

	// Cancel immediately
	sub, err := subscription.Cancel(subscriptionID, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to cancel subscription: %w", err)
	}
	return sub, nil
}

// ReactivateSubscription reactivates a canceled subscription
func (s *Service) ReactivateSubscription(subscriptionID string) (*stripe.Subscription, error) {
	params := &stripe.SubscriptionParams{
		CancelAtPeriodEnd: stripe.Bool(false),
	}

	sub, err := subscription.Update(subscriptionID, params)
	if err != nil {
		return nil, fmt.Errorf("failed to reactivate subscription: %w", err)
	}
	return sub, nil
}

// GetSubscription retrieves a Stripe subscription by ID
func (s *Service) GetSubscription(subscriptionID string) (*stripe.Subscription, error) {
	sub, err := subscription.Get(subscriptionID, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to get subscription: %w", err)
	}
	return sub, nil
}
