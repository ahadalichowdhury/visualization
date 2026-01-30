-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    billing_period VARCHAR(50) NOT NULL, -- 'monthly', 'yearly', 'lifetime'
    description TEXT,
    features JSONB NOT NULL DEFAULT '[]',
    limitations JSONB DEFAULT '[]',
    is_highlighted BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    max_standalone_canvases INTEGER DEFAULT -1, -- -1 means unlimited
    max_architectures_per_scenario INTEGER DEFAULT -1, -- -1 means unlimited
    collaboration_on_scenarios BOOLEAN DEFAULT TRUE,
    collaboration_on_canvases BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index for active plans
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active, sort_order);

-- Create trigger for updated_at
CREATE TRIGGER update_subscription_plans_updated_at
    BEFORE UPDATE ON subscription_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default plans
INSERT INTO subscription_plans (name, display_name, price, billing_period, description, features, limitations, is_highlighted, sort_order, max_standalone_canvases, max_architectures_per_scenario, collaboration_on_scenarios, collaboration_on_canvases)
VALUES 
(
    'free',
    'Free',
    0.00,
    'forever',
    'Perfect for getting started and learning',
    '["2 Standalone Canvases", "1 Architecture per Scenario", "Collaboration on Standalone Canvases", "Basic Simulation Tools", "Cost Estimation", "Community Support", "Access to All Scenarios"]'::jsonb,
    '["Limited to 2 standalone canvases", "Only 1 architecture per scenario", "No collaboration on scenario architectures"]'::jsonb,
    FALSE,
    1,
    2,
    1,
    FALSE,
    TRUE
),
(
    'premium',
    'Premium',
    19.00,
    'monthly',
    'For professionals who need unlimited access',
    '["Unlimited Standalone Canvases", "Unlimited Architectures per Scenario", "Full Collaboration Features", "Collaborate on All Architectures", "Advanced Simulation Tools", "Priority Support", "Early Access to New Features", "Export & Import Architectures", "Team Workspace (Coming Soon)", "Custom Branding (Coming Soon)"]'::jsonb,
    '[]'::jsonb,
    TRUE,
    2,
    -1,
    -1,
    TRUE,
    TRUE
);

-- Add comments
COMMENT ON TABLE subscription_plans IS 'Subscription plans configuration';
COMMENT ON COLUMN subscription_plans.name IS 'Internal name for the plan (free, premium, etc)';
COMMENT ON COLUMN subscription_plans.display_name IS 'Display name shown to users';
COMMENT ON COLUMN subscription_plans.features IS 'JSON array of feature strings';
COMMENT ON COLUMN subscription_plans.limitations IS 'JSON array of limitation strings';
COMMENT ON COLUMN subscription_plans.max_standalone_canvases IS '-1 means unlimited';
COMMENT ON COLUMN subscription_plans.max_architectures_per_scenario IS '-1 means unlimited';
