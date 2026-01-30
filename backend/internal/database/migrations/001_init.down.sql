-- Drop triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_progress_updated_at ON progress;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop tables in reverse order (respecting foreign keys)
DROP TABLE IF EXISTS progress;
DROP TABLE IF EXISTS password_resets;
DROP TABLE IF EXISTS users;
