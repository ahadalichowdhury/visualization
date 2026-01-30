-- Add Stripe price IDs to subscription_plans table
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS stripe_price_id VARCHAR(255);
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS stripe_product_id VARCHAR(255);

-- Add unique constraint to stripe_price_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscription_plans_stripe_price_id ON subscription_plans(stripe_price_id) WHERE stripe_price_id IS NOT NULL;

-- Add comments
COMMENT ON COLUMN subscription_plans.stripe_price_id IS 'Stripe Price ID for this plan';
COMMENT ON COLUMN subscription_plans.stripe_product_id IS 'Stripe Product ID for this plan';
