-- Remove Stripe IDs from subscription_plans
DROP INDEX IF EXISTS idx_subscription_plans_stripe_price_id;
ALTER TABLE subscription_plans DROP COLUMN IF EXISTS stripe_product_id;
ALTER TABLE subscription_plans DROP COLUMN IF EXISTS stripe_price_id;
