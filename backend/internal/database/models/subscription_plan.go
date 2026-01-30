package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"fmt"
	"time"
)

// SubscriptionPlan represents a subscription plan
type SubscriptionPlan struct {
	ID                           string         `json:"id" db:"id"`
	Name                         string         `json:"name" db:"name"`
	DisplayName                  string         `json:"display_name" db:"display_name"`
	Price                        float64        `json:"price" db:"price"`
	Currency                     string         `json:"currency" db:"currency"`
	BillingPeriod                string         `json:"billing_period" db:"billing_period"`
	Description                  string         `json:"description" db:"description"`
	Features                     StringArray    `json:"features" db:"features"`
	Limitations                  StringArray    `json:"limitations" db:"limitations"`
	IsHighlighted                bool           `json:"is_highlighted" db:"is_highlighted"`
	IsActive                     bool           `json:"is_active" db:"is_active"`
	SortOrder                    int            `json:"sort_order" db:"sort_order"`
	MaxStandaloneCanvases        int            `json:"max_standalone_canvases" db:"max_standalone_canvases"`
	MaxArchitecturesPerScenario  int            `json:"max_architectures_per_scenario" db:"max_architectures_per_scenario"`
	CollaborationOnScenarios     bool           `json:"collaboration_on_scenarios" db:"collaboration_on_scenarios"`
	CollaborationOnCanvases      bool           `json:"collaboration_on_canvases" db:"collaboration_on_canvases"`
	StripePriceID                *string        `json:"stripe_price_id,omitempty" db:"stripe_price_id"`
	StripeProductID              *string        `json:"stripe_product_id,omitempty" db:"stripe_product_id"`
	CreatedAt                    time.Time      `json:"created_at" db:"created_at"`
	UpdatedAt                    time.Time      `json:"updated_at" db:"updated_at"`
}

// StringArray is a custom type for handling PostgreSQL JSONB arrays
type StringArray []string

// Value implements the driver.Valuer interface
func (sa StringArray) Value() (driver.Value, error) {
	if sa == nil {
		return json.Marshal([]string{})
	}
	return json.Marshal(sa)
}

// Scan implements the sql.Scanner interface
func (sa *StringArray) Scan(value interface{}) error {
	if value == nil {
		*sa = []string{}
		return nil
	}

	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("failed to scan StringArray: value is not []byte")
	}

	return json.Unmarshal(bytes, sa)
}

// SubscriptionPlanResponse is the API response format
type SubscriptionPlanResponse struct {
	ID                          string   `json:"id"`
	Name                        string   `json:"name"`
	DisplayName                 string   `json:"display_name"`
	Price                       float64  `json:"price"`
	Currency                    string   `json:"currency"`
	PriceFormatted              string   `json:"price_formatted"`
	BillingPeriod               string   `json:"billing_period"`
	Description                 string   `json:"description"`
	Features                    []string `json:"features"`
	Limitations                 []string `json:"limitations"`
	IsHighlighted               bool     `json:"is_highlighted"`
	ButtonText                  string   `json:"button_text"`
	ButtonVariant               string   `json:"button_variant"`
	MaxStandaloneCanvases       int      `json:"max_standalone_canvases"`
	MaxArchitecturesPerScenario int      `json:"max_architectures_per_scenario"`
	CollaborationOnScenarios    bool     `json:"collaboration_on_scenarios"`
	CollaborationOnCanvases     bool     `json:"collaboration_on_canvases"`
	StripePriceID               string   `json:"stripe_price_id,omitempty"`
	StripeProductID             string   `json:"stripe_product_id,omitempty"`
}

// ToResponse converts SubscriptionPlan to API response format
func (sp *SubscriptionPlan) ToResponse(currentUserTier string) *SubscriptionPlanResponse {
	// Format price
	priceFormatted := "$0"
	if sp.Price > 0 {
		priceFormatted = formatPrice(sp.Price, sp.Currency)
	}

	// Determine button text and variant
	buttonText := "Select Plan"
	buttonVariant := "secondary"
	
	if sp.Name == currentUserTier {
		buttonText = "Current Plan"
	} else if currentUserTier == "admin" && sp.Name != "admin" {
		buttonText = "Downgrade"
	} else if sp.Name == "premium" || sp.Name == "admin" {
		if currentUserTier == "free" {
			buttonText = "Upgrade Now"
			buttonVariant = "primary"
		}
	} else if sp.Name == "free" && currentUserTier != "free" {
		buttonText = "Downgrade"
	}

	if sp.IsHighlighted {
		buttonVariant = "primary"
	}

	stripePriceID := ""
	stripeProductID := ""
	if sp.StripePriceID != nil {
		stripePriceID = *sp.StripePriceID
	}
	if sp.StripeProductID != nil {
		stripeProductID = *sp.StripeProductID
	}

	return &SubscriptionPlanResponse{
		ID:                          sp.ID,
		Name:                        sp.Name,
		DisplayName:                 sp.DisplayName,
		Price:                       sp.Price,
		Currency:                    sp.Currency,
		PriceFormatted:              priceFormatted,
		BillingPeriod:               sp.BillingPeriod,
		Description:                 sp.Description,
		Features:                    sp.Features,
		Limitations:                 sp.Limitations,
		IsHighlighted:               sp.IsHighlighted,
		ButtonText:                  buttonText,
		ButtonVariant:               buttonVariant,
		MaxStandaloneCanvases:       sp.MaxStandaloneCanvases,
		MaxArchitecturesPerScenario: sp.MaxArchitecturesPerScenario,
		CollaborationOnScenarios:    sp.CollaborationOnScenarios,
		CollaborationOnCanvases:     sp.CollaborationOnCanvases,
		StripePriceID:               stripePriceID,
		StripeProductID:             stripeProductID,
	}
}

// Helper function to format price
func formatPrice(price float64, currency string) string {
	symbol := "$"
	switch currency {
	case "EUR":
		symbol = "€"
	case "GBP":
		symbol = "£"
	}
	
	if price == float64(int(price)) {
		// Integer price
		return fmt.Sprintf("%s%d", symbol, int(price))
	}
	// Float price with 2 decimals
	return fmt.Sprintf("%s%.2f", symbol, price)
}
