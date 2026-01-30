-- Drop triggers
DROP TRIGGER IF EXISTS update_user_scenario_progress_updated_at ON user_scenario_progress;
DROP TRIGGER IF EXISTS update_scenarios_updated_at ON scenarios;

-- Drop tables
DROP TABLE IF EXISTS user_scenario_progress;
DROP TABLE IF EXISTS scenarios;
