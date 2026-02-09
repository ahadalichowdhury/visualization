-- Advanced Analytics: Historical tracking and performance trends

-- Simulation runs history
CREATE TABLE IF NOT EXISTS simulation_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    architecture_id UUID NOT NULL REFERENCES architectures(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workload_config JSONB NOT NULL,
    results JSONB NOT NULL,
    metrics_summary JSONB NOT NULL, -- Extracted key metrics for quick querying
    run_at TIMESTAMP DEFAULT NOW(),
    duration_ms INT NOT NULL,
    
    -- Quick-access metrics for indexing/sorting
    avg_latency_ms DECIMAL,
    p95_latency_ms DECIMAL,
    throughput_rps DECIMAL,
    error_rate_percent DECIMAL,
    total_cost_usd DECIMAL
);

CREATE INDEX idx_simulation_runs_architecture_id ON simulation_runs(architecture_id);
CREATE INDEX idx_simulation_runs_user_id ON simulation_runs(user_id);
CREATE INDEX idx_simulation_runs_run_at ON simulation_runs(run_at DESC);
CREATE INDEX idx_simulation_runs_p95_latency ON simulation_runs(p95_latency_ms);
CREATE INDEX idx_simulation_runs_error_rate ON simulation_runs(error_rate_percent);

-- Architecture snapshots for diff/versioning
CREATE TABLE IF NOT EXISTS architecture_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    architecture_id UUID NOT NULL REFERENCES architectures(id) ON DELETE CASCADE,
    canvas_data JSONB NOT NULL,
    node_count INT NOT NULL,
    edge_count INT NOT NULL,
    snapshot_at TIMESTAMP DEFAULT NOW(),
    change_description TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_architecture_snapshots_architecture_id ON architecture_snapshots(architecture_id);
CREATE INDEX idx_architecture_snapshots_snapshot_at ON architecture_snapshots(snapshot_at DESC);

-- Cost tracking history
CREATE TABLE IF NOT EXISTS cost_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    architecture_id UUID NOT NULL REFERENCES architectures(id) ON DELETE CASCADE,
    monthly_cost_usd DECIMAL NOT NULL,
    cost_breakdown JSONB NOT NULL,
    node_count INT NOT NULL,
    edge_count INT NOT NULL,
    calculated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cost_history_architecture_id ON cost_history(architecture_id);
CREATE INDEX idx_cost_history_calculated_at ON cost_history(calculated_at DESC);

-- Performance insights cache (AI-generated suggestions)
CREATE TABLE IF NOT EXISTS architecture_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    architecture_id UUID NOT NULL REFERENCES architectures(id) ON DELETE CASCADE,
    insight_type TEXT NOT NULL, -- 'bottleneck', 'optimization', 'cost_saving', 'reliability'
    severity TEXT CHECK (severity IN ('info', 'warning', 'critical')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    suggestions TEXT[],
    detected_at TIMESTAMP DEFAULT NOW(),
    is_resolved BOOLEAN DEFAULT false
);

CREATE INDEX idx_architecture_insights_architecture_id ON architecture_insights(architecture_id);
CREATE INDEX idx_architecture_insights_severity ON architecture_insights(severity);
CREATE INDEX idx_architecture_insights_is_resolved ON architecture_insights(is_resolved);

-- Trigger to auto-create snapshot on architecture update
CREATE OR REPLACE FUNCTION auto_snapshot_on_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create snapshot if canvas_data changed significantly
    -- (We'll skip this for now and create snapshots manually via API calls)
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: Commented out auto-snapshot trigger to avoid too many snapshots
-- Can be enabled later if needed
-- CREATE TRIGGER trigger_auto_snapshot
-- AFTER UPDATE ON architectures
-- FOR EACH ROW
-- WHEN (OLD.canvas_data IS DISTINCT FROM NEW.canvas_data)
-- EXECUTE FUNCTION auto_snapshot_on_update();
