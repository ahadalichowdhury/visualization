import { api } from './api';

export interface SimulationRun {
  id: string;
  architecture_id: string;
  user_id: string;
  workload_config: Record<string, unknown>;
  results: Record<string, unknown>;
  metrics_summary: Record<string, unknown>;
  run_at: string;
  duration_ms: number;
  avg_latency_ms?: number;
  p95_latency_ms?: number;
  throughput_rps?: number;
  error_rate_percent?: number;
  total_cost_usd?: number;
}

export interface PerformanceTrend {
  timestamp: string;
  avg_latency_ms: number;
  p95_latency_ms: number;
  throughput_rps: number;
  error_rate: number;
  total_cost_usd: number;
}

export interface CostTrend {
  timestamp: string;
  monthly_cost_usd: number;
  node_count: number;
  edge_count: number;
}

export interface ArchitectureSnapshot {
  id: string;
  architecture_id: string;
  canvas_data: Record<string, unknown>;
  node_count: number;
  edge_count: number;
  snapshot_at: string;
  change_description?: string;
  created_by?: string;
}

export interface AnalyticsSummary {
  total_simulations: number;
  last_simulation: string;
  avg_latency_ms: number;
  avg_throughput_rps: number;
  avg_error_rate: number;
  current_cost_usd: number;
  cost_trend: 'increasing' | 'decreasing' | 'stable';
  performance_trend: 'improving' | 'degrading' | 'stable';
}

export interface ArchitectureInsight {
  id: string;
  architecture_id: string;
  insight_type: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  suggestions: string[];
  detected_at: string;
  is_resolved: boolean;
}

class AnalyticsService {
  // Get simulation history
  async getSimulationHistory(architectureId: string, limit = 50): Promise<{ simulations: SimulationRun[] }> {
    const response = await api.get(`/analytics/${architectureId}/simulations?limit=${limit}`);
    return response.data;
  }

  // Get performance trends over time
  async getPerformanceTrends(architectureId: string, days = 30): Promise<{ trends: PerformanceTrend[] }> {
    const response = await api.get(`/analytics/${architectureId}/trends?days=${days}`);
    return response.data;
  }

  // Get cost trends over time
  async getCostTrends(architectureId: string, days = 30): Promise<{ trends: CostTrend[] }> {
    const response = await api.get(`/analytics/${architectureId}/costs?days=${days}`);
    return response.data;
  }

  // Get architecture snapshots
  async getSnapshots(architectureId: string, limit = 20): Promise<{ snapshots: ArchitectureSnapshot[] }> {
    const response = await api.get(`/analytics/${architectureId}/snapshots?limit=${limit}`);
    return response.data;
  }

  // Get analytics summary
  async getSummary(architectureId: string): Promise<AnalyticsSummary> {
    const response = await api.get(`/analytics/${architectureId}/summary`);
    return response.data;
  }

  // Get insights
  async getInsights(architectureId: string, includeResolved = false): Promise<{ insights: ArchitectureInsight[] }> {
    const response = await api.get(`/analytics/${architectureId}/insights?include_resolved=${includeResolved}`);
    return response.data;
  }

  // Create manual snapshot
  async createSnapshot(
    architectureId: string,
    canvasData: Record<string, unknown>,
    nodeCount: number,
    edgeCount: number,
    changeDescription: string
  ): Promise<void> {
    await api.post(`/analytics/${architectureId}/snapshots`, {
      canvas_data: canvasData,
      node_count: nodeCount,
      edge_count: edgeCount,
      change_description: changeDescription,
    });
  }
}

export const analyticsService = new AnalyticsService();
