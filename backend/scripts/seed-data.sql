-- Seed data for testing and development
-- Run this file to create test users with different roles

-- Note: Passwords are hashed with bcrypt (cost 10)
-- All test users have password: "password123"

-- Admin user (admin@example.com / password123)
INSERT INTO users (email, password_hash, name, role)
VALUES (
    'admin@example.com',
    '$2a$10$YQ7qvPvLX7xRHvKj/EhA4OXWJvhRvE5a2qH/zKGN3xPZPnWRxPKZS',
    'Admin User',
    'admin'
) ON CONFLICT (email) DO NOTHING;

-- Pro user (pro@example.com / password123)
INSERT INTO users (email, password_hash, name, role)
VALUES (
    'pro@example.com',
    '$2a$10$YQ7qvPvLX7xRHvKj/EhA4OXWJvhRvE5a2qH/zKGN3xPZPnWRxPKZS',
    'Pro User',
    'pro'
) ON CONFLICT (email) DO NOTHING;

-- Basic user (user@example.com / password123)
INSERT INTO users (email, password_hash, name, role)
VALUES (
    'user@example.com',
    '$2a$10$YQ7qvPvLX7xRHvKj/EhA4OXWJvhRvE5a2qH/zKGN3xPZPnWRxPKZS',
    'Basic User',
    'basic'
) ON CONFLICT (email) DO NOTHING;

-- Create progress records for test users
INSERT INTO progress (user_id, completed_scenarios_count, total_scenarios_available, streak_days, best_score)
SELECT 
    u.id,
    CASE 
        WHEN u.role = 'admin' THEN 10
        WHEN u.role = 'pro' THEN 7
        ELSE 3
    END as completed,
    10 as total,
    CASE 
        WHEN u.role = 'admin' THEN 15
        WHEN u.role = 'pro' THEN 10
        ELSE 5
    END as streak,
    CASE 
        WHEN u.role = 'admin' THEN 95
        WHEN u.role = 'pro' THEN 85
        ELSE 75
    END as score
FROM users u
WHERE u.email IN ('admin@example.com', 'pro@example.com', 'user@example.com')
ON CONFLICT (user_id) DO NOTHING;

-- Display created users
SELECT 
    email,
    name,
    role,
    created_at
FROM users
WHERE email IN ('admin@example.com', 'pro@example.com', 'user@example.com')
ORDER BY role DESC;
