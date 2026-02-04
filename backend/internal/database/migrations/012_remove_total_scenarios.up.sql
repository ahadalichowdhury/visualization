-- Remove total_scenarios_available column from progress table
ALTER TABLE progress DROP COLUMN IF EXISTS total_scenarios_available;
