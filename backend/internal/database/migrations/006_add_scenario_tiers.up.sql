-- Add tier column to scenarios table
ALTER TABLE scenarios ADD COLUMN tier VARCHAR(20) NOT NULL DEFAULT 'free';

-- Add constraint to ensure valid tier values
ALTER TABLE scenarios ADD CONSTRAINT valid_tier CHECK (tier IN ('free', 'premium'));

-- Create index for faster tier-based queries
CREATE INDEX idx_scenarios_tier ON scenarios(tier);

-- Update existing scenarios to have proper tier values
-- First 10 scenarios will be free, rest will be premium
UPDATE scenarios SET tier = 'premium' WHERE id NOT IN (
    SELECT id FROM scenarios ORDER BY created_at LIMIT 10
);
