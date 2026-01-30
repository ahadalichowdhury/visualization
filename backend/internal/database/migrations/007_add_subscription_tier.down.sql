-- Remove subscription_tier column from users table
DROP INDEX IF EXISTS idx_users_subscription_tier;
ALTER TABLE users DROP CONSTRAINT IF EXISTS valid_subscription_tier;
ALTER TABLE users DROP COLUMN IF EXISTS subscription_tier;
