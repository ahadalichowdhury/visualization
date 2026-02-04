package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/stripe/stripe-go/v79"
	"github.com/stripe/stripe-go/v79/webhook"
	"github.com/yourusername/visualization-backend/internal/database"
	"github.com/yourusername/visualization-backend/internal/database/models"
	stripeService "github.com/yourusername/visualization-backend/internal/stripe"
)

// StripeHandler handles Stripe payment operations
type StripeHandler struct {
	repo          *database.Repository
	stripeService *stripeService.Service
	webhookSecret string
	frontendURL   string
}

// NewStripeHandler creates a new Stripe handler
func NewStripeHandler(repo *database.Repository, stripeService *stripeService.Service, webhookSecret, frontendURL string) *StripeHandler {
	return &StripeHandler{
		repo:          repo,
		stripeService: stripeService,
		webhookSecret: webhookSecret,
		frontendURL:   frontendURL,
	}
}

// CreateCheckoutSession creates a Stripe checkout session
// POST /api/stripe/create-checkout-session
func (h *StripeHandler) CreateCheckoutSession(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)

	var req struct {
		PriceID string `json:"price_id"`
		PlanID  string `json:"plan_id"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Get user info
	user, err := h.repo.GetUserByID(userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get user info",
		})
	}

	// Create success and cancel URLs
	successURL := fmt.Sprintf("%s/subscription/success?session_id={CHECKOUT_SESSION_ID}", h.frontendURL)
	cancelURL := fmt.Sprintf("%s/subscription/cancel", h.frontendURL)

	// Create checkout session
	session, err := h.stripeService.CreateCheckoutSession(
		userID,
		user.Email,
		req.PriceID,
		successURL,
		cancelURL,
	)
	if err != nil {
		log.Printf("Error creating checkout session: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create checkout session",
		})
	}

	return c.JSON(fiber.Map{
		"checkout_url": session.URL,
		"session_id":   session.ID,
	})
}

// HandleWebhook handles Stripe webhook events
// POST /api/stripe/webhook
func (h *StripeHandler) HandleWebhook(c *fiber.Ctx) error {
	// Catch panics and log them
	defer func() {
		if r := recover(); r != nil {
			log.Printf("PANIC in HandleWebhook: %v", r)
		}
	}()

	log.Printf("DEBUG: Received webhook request")

	// Use Fiber's BodyRaw() method instead of RequestBodyStream
	payload := c.Body()
	log.Printf("DEBUG: Webhook payload size: %d bytes", len(payload))

	signatureHeader := c.Get("Stripe-Signature")
	log.Printf("DEBUG: Stripe-Signature header: %s", signatureHeader)

	// Verify webhook signature
	// Use ConstructEventWithOptions to ignore API version mismatch
	event, err := webhook.ConstructEventWithOptions(
		payload,
		signatureHeader,
		h.webhookSecret,
		webhook.ConstructEventOptions{
			IgnoreAPIVersionMismatch: true,
		},
	)
	if err != nil {
		log.Printf("ERROR: Error verifying webhook signature: %v", err)
		log.Printf("ERROR: Webhook secret being used: %s...", h.webhookSecret[:10])
		return c.SendStatus(fiber.StatusBadRequest)
	}

	log.Printf("INFO: Webhook event type: %s, ID: %s", event.Type, event.ID)

	// Handle the event
	switch event.Type {
	case "checkout.session.completed":
		log.Printf("DEBUG: Handling checkout.session.completed")
		var session stripe.CheckoutSession
		if err := json.Unmarshal(event.Data.Raw, &session); err != nil {
			log.Printf("ERROR: Error parsing webhook JSON: %v", err)
			return c.SendStatus(fiber.StatusBadRequest)
		}
		h.handleCheckoutSessionCompleted(&session)

	case "customer.subscription.created":
		log.Printf("DEBUG: Handling customer.subscription.created")
		var subscription stripe.Subscription
		if err := json.Unmarshal(event.Data.Raw, &subscription); err != nil {
			log.Printf("ERROR: Error parsing webhook JSON: %v", err)
			return c.SendStatus(fiber.StatusBadRequest)
		}
		h.handleSubscriptionCreated(&subscription)

	case "customer.subscription.updated":
		log.Printf("DEBUG: Handling customer.subscription.updated")
		var subscription stripe.Subscription
		if err := json.Unmarshal(event.Data.Raw, &subscription); err != nil {
			log.Printf("ERROR: Error parsing webhook JSON: %v", err)
			return c.SendStatus(fiber.StatusBadRequest)
		}
		h.handleSubscriptionUpdated(&subscription)

	case "customer.subscription.deleted":
		log.Printf("DEBUG: Handling customer.subscription.deleted")
		var subscription stripe.Subscription
		if err := json.Unmarshal(event.Data.Raw, &subscription); err != nil {
			log.Printf("ERROR: Error parsing webhook JSON: %v", err)
			return c.SendStatus(fiber.StatusBadRequest)
		}
		h.handleSubscriptionDeleted(&subscription)

	case "invoice.payment_succeeded":
		log.Printf("DEBUG: Handling invoice.payment_succeeded")
		var invoice stripe.Invoice
		if err := json.Unmarshal(event.Data.Raw, &invoice); err != nil {
			log.Printf("ERROR: Error parsing webhook JSON: %v", err)
			return c.SendStatus(fiber.StatusBadRequest)
		}
		h.handleInvoicePaymentSucceeded(&invoice)

	case "invoice.payment_failed":
		log.Printf("DEBUG: Handling invoice.payment_failed")
		var invoice stripe.Invoice
		if err := json.Unmarshal(event.Data.Raw, &invoice); err != nil {
			log.Printf("ERROR: Error parsing webhook JSON: %v", err)
			return c.SendStatus(fiber.StatusBadRequest)
		}
		h.handleInvoicePaymentFailed(&invoice)

	default:
		log.Printf("INFO: Unhandled event type: %s", event.Type)
	}

	log.Printf("SUCCESS: Webhook processed successfully")
	return c.SendStatus(fiber.StatusOK)
}

// handleCheckoutSessionCompleted processes completed checkout sessions
func (h *StripeHandler) handleCheckoutSessionCompleted(session *stripe.CheckoutSession) {
	log.Printf("DEBUG: Processing checkout.session.completed event")
	log.Printf("DEBUG: ClientReferenceID: %s", session.ClientReferenceID)
	log.Printf("DEBUG: Metadata: %+v", session.Metadata)
	log.Printf("DEBUG: Customer: %+v", session.Customer)

	userID := session.ClientReferenceID
	if userID == "" {
		userID = session.Metadata["user_id"]
	}

	if userID == "" {
		log.Printf("ERROR: No user ID found in checkout session")
		return
	}

	// Get customer ID - In Stripe Go SDK, Customer is a *stripe.Customer
	// When unexpanded (webhook data), Customer.ID contains the customer ID string
	customerID := ""
	if session.Customer != nil {
		customerID = session.Customer.ID
		log.Printf("DEBUG: Customer ID from session.Customer.ID: %s", customerID)
	}

	if customerID == "" {
		log.Printf("ERROR: No customer ID found in checkout session")
		return
	}

	// Create or update Stripe customer record
	stripeCustomer := &models.StripeCustomer{
		UserID:           userID,
		StripeCustomerID: customerID,
	}

	existingCustomer, _ := h.repo.GetStripeCustomerByUserID(userID)
	if existingCustomer == nil {
		if err := h.repo.CreateStripeCustomer(stripeCustomer); err != nil {
			log.Printf("ERROR: Error creating stripe customer: %v", err)
		} else {
			log.Printf("SUCCESS: Created stripe customer record for user %s", userID)
		}
	} else {
		log.Printf("INFO: Stripe customer already exists for user %s", userID)
	}

	log.Printf("SUCCESS: Checkout session completed for user %s, customer %s", userID, customerID)
}

// handleSubscriptionCreated processes new subscriptions
func (h *StripeHandler) handleSubscriptionCreated(sub *stripe.Subscription) {
	userID := sub.Metadata["user_id"]
	if userID == "" {
		log.Printf("No user ID found in subscription metadata")
		return
	}

	// Update user's subscription tier to premium
	if err := h.repo.UpdateUserSubscriptionTier(userID, models.TierPremium); err != nil {
		log.Printf("Error updating user subscription tier: %v", err)
		return
	}

	// Update Stripe customer record
	periodStart := time.Unix(sub.CurrentPeriodStart, 0)
	periodEnd := time.Unix(sub.CurrentPeriodEnd, 0)
	status := string(sub.Status)

	customer := &models.StripeCustomer{
		UserID:               userID,
		StripeSubscriptionID: &sub.ID,
		SubscriptionStatus:   &status,
		CurrentPeriodStart:   &periodStart,
		CurrentPeriodEnd:     &periodEnd,
		CancelAtPeriodEnd:    sub.CancelAtPeriodEnd,
	}

	if err := h.repo.UpdateStripeCustomer(customer); err != nil {
		log.Printf("Error updating stripe customer: %v", err)
	}

	log.Printf("Subscription created for user %s", userID)
}

// handleSubscriptionUpdated processes subscription updates
func (h *StripeHandler) handleSubscriptionUpdated(sub *stripe.Subscription) {
	userID := sub.Metadata["user_id"]
	if userID == "" {
		log.Printf("No user ID found in subscription metadata")
		return
	}

	periodStart := time.Unix(sub.CurrentPeriodStart, 0)
	periodEnd := time.Unix(sub.CurrentPeriodEnd, 0)
	status := string(sub.Status)

	customer := &models.StripeCustomer{
		UserID:               userID,
		StripeSubscriptionID: &sub.ID,
		SubscriptionStatus:   &status,
		CurrentPeriodStart:   &periodStart,
		CurrentPeriodEnd:     &periodEnd,
		CancelAtPeriodEnd:    sub.CancelAtPeriodEnd,
	}

	if err := h.repo.UpdateStripeCustomer(customer); err != nil {
		log.Printf("Error updating stripe customer: %v", err)
	}

	log.Printf("Subscription updated for user %s", userID)
}

// handleSubscriptionDeleted processes subscription cancellations
func (h *StripeHandler) handleSubscriptionDeleted(sub *stripe.Subscription) {
	userID := sub.Metadata["user_id"]
	if userID == "" {
		log.Printf("No user ID found in subscription metadata")
		return
	}

	// Downgrade user to free tier
	if err := h.repo.UpdateUserSubscriptionTier(userID, models.TierFree); err != nil {
		log.Printf("Error updating user subscription tier: %v", err)
		return
	}

	status := string(sub.Status)
	customer := &models.StripeCustomer{
		UserID:             userID,
		SubscriptionStatus: &status,
	}

	if err := h.repo.UpdateStripeCustomer(customer); err != nil {
		log.Printf("Error updating stripe customer: %v", err)
	}

	log.Printf("Subscription deleted for user %s", userID)
}

// handleInvoicePaymentSucceeded records successful payments
func (h *StripeHandler) handleInvoicePaymentSucceeded(invoice *stripe.Invoice) {
	// Get user ID from subscription metadata
	var userID string
	if invoice.Subscription != nil {
		userID = invoice.Subscription.Metadata["user_id"]
	}

	if userID == "" {
		// Fallback: Look up user by Stripe customer ID
		if invoice.Customer != nil {
			customerID := invoice.Customer.ID
			if customerID != "" {
				stripeCustomer, err := h.repo.GetStripeCustomerByCustomerID(customerID)
				if err == nil && stripeCustomer != nil {
					userID = stripeCustomer.UserID
					log.Printf("DEBUG: Found user ID via customer lookup: %s", userID)
				}
			}
		}
	}

	if userID == "" {
		log.Printf("ERROR: No user ID found in invoice (customer: %v, subscription: %v)", invoice.Customer, invoice.Subscription)
		return
	}

	// Get customer ID
	customerID := ""
	if invoice.Customer != nil {
		customerID = invoice.Customer.ID
	}

	// Create payment history record
	amount := float64(invoice.AmountPaid) / 100.0 // Convert from cents
	status := models.PaymentStatusSucceeded
	invoiceID := invoice.ID
	receiptURL := invoice.HostedInvoiceURL

	payment := &models.PaymentHistory{
		ID:               uuid.New().String(),
		UserID:           userID,
		StripeCustomerID: customerID,
		StripeInvoiceID:  &invoiceID,
		Amount:           amount,
		Currency:         string(invoice.Currency),
		Status:           status,
		ReceiptURL:       &receiptURL,
	}

	// Add payment intent ID if available
	if invoice.PaymentIntent != nil {
		paymentIntentID := invoice.PaymentIntent.ID
		payment.StripePaymentIntentID = &paymentIntentID
	}

	if err := h.repo.CreatePaymentHistory(payment); err != nil {
		log.Printf("Error creating payment history: %v", err)
	} else {
		log.Printf("SUCCESS: Payment recorded for user %s: $%.2f", userID, amount)
	}
}

// handleInvoicePaymentFailed records failed payments
func (h *StripeHandler) handleInvoicePaymentFailed(invoice *stripe.Invoice) {
	// Get user ID from subscription metadata
	var userID string
	if invoice.Subscription != nil {
		userID = invoice.Subscription.Metadata["user_id"]
	}

	if userID == "" {
		log.Printf("No user ID found in invoice")
		return
	}

	// Get customer ID
	customerID := ""
	if invoice.Customer != nil {
		customerID = invoice.Customer.ID
	}

	// Create payment history record
	amount := float64(invoice.AmountDue) / 100.0
	status := models.PaymentStatusFailed
	invoiceID := invoice.ID

	payment := &models.PaymentHistory{
		ID:               uuid.New().String(),
		UserID:           userID,
		StripeCustomerID: customerID,
		StripeInvoiceID:  &invoiceID,
		Amount:           amount,
		Currency:         string(invoice.Currency),
		Status:           status,
	}

	// Add payment intent ID if available
	if invoice.PaymentIntent != nil {
		paymentIntentID := invoice.PaymentIntent.ID
		payment.StripePaymentIntentID = &paymentIntentID
	}

	if err := h.repo.CreatePaymentHistory(payment); err != nil {
		log.Printf("Error creating payment history: %v", err)
	}

	log.Printf("Payment failed for user %s: $%.2f", userID, amount)
}

// GetPaymentHistory returns user's payment history
// GET /api/stripe/payment-history
func (h *StripeHandler) GetPaymentHistory(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)

	payments, err := h.repo.GetPaymentHistoryByUserID(userID, 50)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get payment history",
		})
	}

	return c.JSON(fiber.Map{
		"payments": payments,
	})
}

// GetSubscriptionDetails returns user's subscription details
// GET /api/stripe/subscription-details
func (h *StripeHandler) GetSubscriptionDetails(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)

	stripeCustomer, err := h.repo.GetStripeCustomerByUserID(userID)
	if err != nil || stripeCustomer == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "No subscription found",
		})
	}

	return c.JSON(fiber.Map{
		"cancel_at_period_end": stripeCustomer.CancelAtPeriodEnd,
		"current_period_end":   stripeCustomer.CurrentPeriodEnd,
		"subscription_status":  stripeCustomer.SubscriptionStatus,
	})
}

// CancelSubscription cancels a user's subscription
// POST /api/stripe/cancel-subscription
func (h *StripeHandler) CancelSubscription(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)

	var req struct {
		CancelAtPeriodEnd bool `json:"cancel_at_period_end"`
	}

	if err := c.BodyParser(&req); err != nil {
		req.CancelAtPeriodEnd = true // Default to cancel at period end
	}

	// Get Stripe customer
	stripeCustomer, err := h.repo.GetStripeCustomerByUserID(userID)
	if err != nil || stripeCustomer == nil || stripeCustomer.StripeSubscriptionID == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "No active subscription found",
		})
	}

	// Cancel subscription in Stripe
	_, err = h.stripeService.CancelSubscription(*stripeCustomer.StripeSubscriptionID, req.CancelAtPeriodEnd)
	if err != nil {
		log.Printf("Error canceling subscription: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to cancel subscription",
		})
	}

	return c.JSON(fiber.Map{
		"message":              "Subscription canceled successfully",
		"cancel_at_period_end": req.CancelAtPeriodEnd,
	})
}

// ReactivateSubscription reactivates a cancelled subscription
// POST /api/stripe/reactivate-subscription
func (h *StripeHandler) ReactivateSubscription(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)

	// Get Stripe customer
	stripeCustomer, err := h.repo.GetStripeCustomerByUserID(userID)
	if err != nil || stripeCustomer == nil || stripeCustomer.StripeSubscriptionID == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "No active subscription found",
		})
	}

	// Reactivate subscription in Stripe by setting cancel_at_period_end to false
	_, err = h.stripeService.ReactivateSubscription(*stripeCustomer.StripeSubscriptionID)
	if err != nil {
		log.Printf("Error reactivating subscription: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to reactivate subscription",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Subscription reactivated successfully",
	})
}
