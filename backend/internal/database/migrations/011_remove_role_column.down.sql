-- Add role column back to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) NOT NULL DEFAULT 'basic';
ALTER TABLE users ADD CONSTRAINT valid_role CHECK (role IN ('basic', 'pro', 'admin'));
