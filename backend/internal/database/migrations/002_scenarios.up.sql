-- Create scenarios table
CREATE TABLE IF NOT EXISTS scenarios (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    difficulty VARCHAR(50) NOT NULL,
    estimated_time INT NOT NULL, -- in minutes
    thumbnail_url TEXT,
    requirements JSONB NOT NULL DEFAULT '{}',
    hints JSONB NOT NULL DEFAULT '[]',
    goals JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_difficulty CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced'))
);

-- Create index on category for filtering
CREATE INDEX idx_scenarios_category ON scenarios(category);
CREATE INDEX idx_scenarios_difficulty ON scenarios(difficulty);
CREATE INDEX idx_scenarios_is_active ON scenarios(is_active);

-- Create user_scenario_progress table
CREATE TABLE IF NOT EXISTS user_scenario_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scenario_id VARCHAR(100) NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'not_started',
    steps_completed INT NOT NULL DEFAULT 0,
    total_steps INT NOT NULL DEFAULT 0,
    score INT DEFAULT 0,
    score_breakdown JSONB DEFAULT '{}',
    completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_status CHECK (status IN ('not_started', 'in_progress', 'completed', 'completed_with_errors')),
    CONSTRAINT unique_user_scenario UNIQUE (user_id, scenario_id),
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_scenario FOREIGN KEY (scenario_id) REFERENCES scenarios(id) ON DELETE CASCADE
);

-- Create indexes for user_scenario_progress
CREATE INDEX idx_user_scenario_progress_user_id ON user_scenario_progress(user_id);
CREATE INDEX idx_user_scenario_progress_scenario_id ON user_scenario_progress(scenario_id);
CREATE INDEX idx_user_scenario_progress_status ON user_scenario_progress(status);

-- Create trigger for updated_at on scenarios
CREATE TRIGGER update_scenarios_updated_at BEFORE UPDATE ON scenarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for updated_at on user_scenario_progress
CREATE TRIGGER update_user_scenario_progress_updated_at BEFORE UPDATE ON user_scenario_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
