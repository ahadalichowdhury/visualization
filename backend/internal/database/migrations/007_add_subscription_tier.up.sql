-- Add subscription_tier column to users table
-- Values: 'free', 'premium', 'admin'
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(50) NOT NULL DEFAULT 'free';

-- Update constraint to include subscription_tier validation
ALTER TABLE users DROP CONSTRAINT IF EXISTS valid_role;
ALTER TABLE users ADD CONSTRAINT valid_role CHECK (role IN ('basic', 'pro', 'admin'));
ALTER TABLE users ADD CONSTRAINT valid_subscription_tier CHECK (subscription_tier IN ('free', 'premium', 'admin'));

-- Set subscription_tier based on existing role for migration
UPDATE users SET subscription_tier = 'admin' WHERE role = 'admin';
UPDATE users SET subscription_tier = 'premium' WHERE role = 'pro';
UPDATE users SET subscription_tier = 'free' WHERE role = 'basic';

-- Create index for faster tier lookups
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON users(subscription_tier);

-- Add comments
COMMENT ON COLUMN users.subscription_tier IS 'User subscription tier: free, premium, or admin';
