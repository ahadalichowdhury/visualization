-- Rollback analytics feature

DROP TABLE IF EXISTS architecture_insights;
DROP TABLE IF EXISTS cost_history;
DROP TABLE IF EXISTS architecture_snapshots;
DROP TABLE IF EXISTS simulation_runs;
DROP FUNCTION IF EXISTS auto_snapshot_on_update();
