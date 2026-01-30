-- Create architectures table for saving user's canvas designs
CREATE TABLE IF NOT EXISTS architectures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scenario_id VARCHAR(255) REFERENCES scenarios(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    canvas_data JSONB NOT NULL, -- stores nodes and edges
    is_submitted BOOLEAN DEFAULT FALSE,
    score INTEGER,
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX idx_architectures_user_id ON architectures(user_id);
CREATE INDEX idx_architectures_scenario_id ON architectures(scenario_id);
CREATE INDEX idx_architectures_created_at ON architectures(created_at DESC);

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_architectures_updated_at
    BEFORE UPDATE ON architectures
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
