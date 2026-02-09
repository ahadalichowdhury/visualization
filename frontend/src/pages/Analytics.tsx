import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  analyticsService,
  type AnalyticsSummary,
  type CostTrend,
  type PerformanceTrend,
  type SimulationRun,
} from '../services/analytics.service';
import { showError } from '../utils/toast';

export const Analytics = () => {
  const { architectureId } = useParams<{ architectureId: string }>();
  const navigate = useNavigate();

  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [performanceTrends, setPerformanceTrends] = useState<PerformanceTrend[]>([]);
  const [costTrends, setCostTrends] = useState<CostTrend[]>([]);
  const [simulationRuns, setSimulationRuns] = useState<SimulationRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30); // days

  const loadAnalytics = useCallback(async () => {
    if (!architectureId) return;

    setLoading(true);
    try {
      const [summaryData, performanceData, costData, simulationsData] = await Promise.all([
        analyticsService.getSummary(architectureId),
        analyticsService.getPerformanceTrends(architectureId, timeRange),
        analyticsService.getCostTrends(architectureId, timeRange),
        analyticsService.getSimulationHistory(architectureId, 10),
      ]);

      setSummary(summaryData);
      setPerformanceTrends(performanceData.trends);
      setCostTrends(costData.trends);
      setSimulationRuns(simulationsData.simulations);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      showError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [architectureId, timeRange]);

  useEffect(() => {
    if (architectureId) {
      loadAnalytics();
    }
  }, [architectureId, loadAnalytics]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
      case 'decreasing':
        return '📈';
      case 'degrading':
      case 'increasing':
        return '📉';
      default:
        return '➡️';
    }
  };

  const getTrendColor = (trend: string, isPerformance: boolean) => {
    if (trend === 'stable') return 'text-gray-600 dark:text-gray-400';
    if (isPerformance) {
      return trend === 'improving' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
    } else {
      return trend === 'decreasing' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#1e1e1e] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-[#9ca3af]">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#1e1e1e] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-[#cccccc] mb-2">
            No Analytics Data Yet
          </h2>
          <p className="text-gray-600 dark:text-[#9ca3af] mb-4">
            Run some simulations to start tracking performance metrics
          </p>
          <button
            onClick={() => navigate('/canvas')}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Go to Builder
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1e1e1e]">
      {/* Header */}
      <div className="bg-white dark:bg-[#252526] border-b border-gray-200 dark:border-[#3e3e3e]">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-[#cccccc]">
                📊 Performance Analytics
              </h1>
              <p className="text-gray-600 dark:text-[#9ca3af] mt-1">
                Track performance trends and historical metrics
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(Number(e.target.value))}
                className="px-4 py-2 border border-gray-300 dark:border-[#3e3e3e] rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-[#1e1e1e] dark:text-[#d4d4d4]"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
              <button
                onClick={() => navigate('/canvas')}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Back to Builder
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white dark:bg-[#252526] rounded-lg border border-gray-200 dark:border-[#3e3e3e] p-6">
            <div className="text-sm text-gray-600 dark:text-[#9ca3af] mb-1">
              Total Simulations
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-[#cccccc]">
              {summary.total_simulations}
            </div>
          </div>

          <div className="bg-white dark:bg-[#252526] rounded-lg border border-gray-200 dark:border-[#3e3e3e] p-6">
            <div className="text-sm text-gray-600 dark:text-[#9ca3af] mb-1">
              Avg P95 Latency
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-[#cccccc]">
              {summary.avg_latency_ms.toFixed(0)}ms
            </div>
            <div className={`text-sm mt-2 ${getTrendColor(summary.performance_trend, true)}`}>
              {getTrendIcon(summary.performance_trend)} {summary.performance_trend}
            </div>
          </div>

          <div className="bg-white dark:bg-[#252526] rounded-lg border border-gray-200 dark:border-[#3e3e3e] p-6">
            <div className="text-sm text-gray-600 dark:text-[#9ca3af] mb-1">
              Avg Throughput
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-[#cccccc]">
              {(summary.avg_throughput_rps / 1000).toFixed(1)}k
            </div>
            <div className="text-sm text-gray-500 dark:text-[#9ca3af] mt-2">
              RPS
            </div>
          </div>

          <div className="bg-white dark:bg-[#252526] rounded-lg border border-gray-200 dark:border-[#3e3e3e] p-6">
            <div className="text-sm text-gray-600 dark:text-[#9ca3af] mb-1">
              Current Cost
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-[#cccccc]">
              ${summary.current_cost_usd.toFixed(0)}
            </div>
            <div className={`text-sm mt-2 ${getTrendColor(summary.cost_trend, false)}`}>
              {getTrendIcon(summary.cost_trend)} {summary.cost_trend}
            </div>
          </div>
        </div>

        {/* Performance Trends Chart */}
        <div className="bg-white dark:bg-[#252526] rounded-lg border border-gray-200 dark:border-[#3e3e3e] p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-[#cccccc] mb-4">
            Performance Over Time
          </h2>
          {performanceTrends.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(17, 24, 39, 0.95)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                  labelFormatter={(value) => new Date(value).toLocaleString()}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="p95_latency_ms"
                  stroke="#3b82f6"
                  name="P95 Latency (ms)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="avg_latency_ms"
                  stroke="#10b981"
                  name="Avg Latency (ms)"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-[#9ca3af]">
              No performance data available for this time range
            </div>
          )}
        </div>

        {/* Cost Trends Chart */}
        <div className="bg-white dark:bg-[#252526] rounded-lg border border-gray-200 dark:border-[#3e3e3e] p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-[#cccccc] mb-4">
            Cost Trends
          </h2>
          {costTrends.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={costTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(17, 24, 39, 0.95)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                  labelFormatter={(value) => new Date(value).toLocaleString()}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="monthly_cost_usd"
                  stroke="#f59e0b"
                  name="Monthly Cost (USD)"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-[#9ca3af]">
              No cost data available for this time range
            </div>
          )}
        </div>

        {/* Recent Simulations */}
        <div className="bg-white dark:bg-[#252526] rounded-lg border border-gray-200 dark:border-[#3e3e3e] p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-[#cccccc] mb-4">
            Recent Simulations
          </h2>
          {simulationRuns.length > 0 ? (
            <div className="space-y-3">
              {simulationRuns.map((run) => (
                <div
                  key={run.id}
                  className="border border-gray-200 dark:border-[#3e3e3e] rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-[#2d2d2d] transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500 dark:text-[#9ca3af]">
                      {new Date(run.run_at).toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-[#9ca3af]">
                      {run.duration_ms}ms duration
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600 dark:text-[#9ca3af]">Avg Latency</div>
                      <div className="font-semibold text-gray-900 dark:text-[#cccccc]">
                        {run.avg_latency_ms?.toFixed(2) || 'N/A'} ms
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600 dark:text-[#9ca3af]">P95 Latency</div>
                      <div className="font-semibold text-gray-900 dark:text-[#cccccc]">
                        {run.p95_latency_ms?.toFixed(2) || 'N/A'} ms
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600 dark:text-[#9ca3af]">Throughput</div>
                      <div className="font-semibold text-gray-900 dark:text-[#cccccc]">
                        {run.throughput_rps?.toFixed(0) || 'N/A'} RPS
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600 dark:text-[#9ca3af]">Error Rate</div>
                      <div className="font-semibold text-gray-900 dark:text-[#cccccc]">
                        {run.error_rate_percent?.toFixed(2) || '0.00'}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-[#9ca3af]">
              No simulation runs yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
