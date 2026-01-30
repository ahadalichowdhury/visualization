-- Create stripe_customers table to store Stripe customer IDs
CREATE TABLE IF NOT EXISTS stripe_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    stripe_customer_id VARCHAR(255) NOT NULL UNIQUE,
    stripe_subscription_id VARCHAR(255),
    subscription_status VARCHAR(50), -- 'active', 'canceled', 'past_due', 'incomplete', 'trialing'
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create payment_history table to track all payments
CREATE TABLE IF NOT EXISTS payment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stripe_customer_id VARCHAR(255) NOT NULL,
    stripe_payment_intent_id VARCHAR(255),
    stripe_invoice_id VARCHAR(255),
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    status VARCHAR(50) NOT NULL, -- 'succeeded', 'pending', 'failed', 'refunded'
    subscription_plan_id UUID REFERENCES subscription_plans(id),
    description TEXT,
    payment_method_type VARCHAR(50), -- 'card', 'bank_account', etc.
    receipt_url TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_stripe_customers_user_id ON stripe_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_stripe_id ON stripe_customers(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_status ON payment_history(status);
CREATE INDEX IF NOT EXISTS idx_payment_history_created_at ON payment_history(created_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_stripe_customers_updated_at
    BEFORE UPDATE ON stripe_customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE stripe_customers IS 'Stores Stripe customer and subscription information';
COMMENT ON TABLE payment_history IS 'Tracks all payment transactions';
COMMENT ON COLUMN stripe_customers.subscription_status IS 'Stripe subscription status: active, canceled, past_due, incomplete, trialing';
COMMENT ON COLUMN payment_history.status IS 'Payment status: succeeded, pending, failed, refunded';
