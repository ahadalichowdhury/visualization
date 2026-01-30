-- Drop architectures table
DROP TRIGGER IF EXISTS update_architectures_updated_at ON architectures;
DROP INDEX IF EXISTS idx_architectures_created_at;
DROP INDEX IF EXISTS idx_architectures_scenario_id;
DROP INDEX IF EXISTS idx_architectures_user_id;
DROP TABLE IF EXISTS architectures;
