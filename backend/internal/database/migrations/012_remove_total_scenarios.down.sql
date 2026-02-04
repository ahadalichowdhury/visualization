-- Add total_scenarios_available column back toprogress table
ALTER TABLE progress ADD COLUMN IF NOT EXISTS total_scenarios_available INT NOT NULL DEFAULT 0;
