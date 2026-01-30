-- Remove tier-related changes
DROP INDEX IF EXISTS idx_scenarios_tier;
ALTER TABLE scenarios DROP CONSTRAINT IF EXISTS valid_tier;
ALTER TABLE scenarios DROP COLUMN IF EXISTS tier;
