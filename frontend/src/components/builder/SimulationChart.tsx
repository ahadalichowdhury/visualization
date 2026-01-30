import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { TimeSeriesPoint } from '../../types/simulation.types';

interface SimulationChartProps {
  data: TimeSeriesPoint[];
}

export const SimulationChart = ({ data }: SimulationChartProps) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <p>No data to display</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Latency Chart */}
      <div className="bg-white dark:bg-[#252526] p-4 rounded-lg border border-gray-200 dark:border-[#3e3e3e]">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-[#cccccc] mb-3">Latency Over Time</h4>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="tick"
              label={{ value: 'Time (seconds)', position: 'insideBottom', offset: -5 }}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft' }}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
              formatter={(value: number) => `${value.toFixed(1)}ms`}
            />
            <Line
              type="monotone"
              dataKey="latency.p50"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              name="P50"
            />
            <Line
              type="monotone"
              dataKey="latency.p95"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
              name="P95"
            />
            <Line
              type="monotone"
              dataKey="latency.p99"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
              name="P99"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Throughput Chart */}
      <div className="bg-white dark:bg-[#252526] p-4 rounded-lg border border-gray-200 dark:border-[#3e3e3e]">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-[#cccccc] mb-3">Throughput Over Time</h4>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="tick"
              label={{ value: 'Time (seconds)', position: 'insideBottom', offset: -5 }}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              label={{ value: 'RPS', angle: -90, position: 'insideLeft' }}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
              formatter={(value: number) => `${value.toFixed(0)} RPS`}
            />
            <Line
              type="monotone"
              dataKey="incomingRPS"
              stroke="#6366f1"
              strokeWidth={2}
              dot={false}
              name="Incoming"
            />
            <Line
              type="monotone"
              dataKey="throughputRPS"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              name="Throughput"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Error Rate Chart */}
      <div className="bg-white dark:bg-[#252526] p-4 rounded-lg border border-gray-200 dark:border-[#3e3e3e]">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-[#cccccc] mb-3">Error Rate Over Time</h4>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="tick"
              label={{ value: 'Time (seconds)', position: 'insideBottom', offset: -5 }}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              label={{ value: 'Error %', angle: -90, position: 'insideLeft' }}
              tick={{ fontSize: 12 }}
              domain={[0, 'auto']}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
              formatter={(value: number) => `${value.toFixed(2)}%`}
            />
            <Line
              type="monotone"
              dataKey="errorRatePercent"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
              name="Error Rate"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* CPU & Memory Chart */}
      <div className="bg-white dark:bg-[#252526] p-4 rounded-lg border border-gray-200 dark:border-[#3e3e3e]">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-[#cccccc] mb-3">Resource Usage Over Time</h4>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="tick"
              label={{ value: 'Time (seconds)', position: 'insideBottom', offset: -5 }}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              label={{ value: 'Usage %', angle: -90, position: 'insideLeft' }}
              tick={{ fontSize: 12 }}
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
              formatter={(value: number) => `${value.toFixed(1)}%`}
            />
            <Line
              type="monotone"
              dataKey="cpuUsagePercent"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={false}
              name="CPU"
            />
            <Line
              type="monotone"
              dataKey="memoryUsagePercent"
              stroke="#06b6d4"
              strokeWidth={2}
              dot={false}
              name="Memory"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Queue Depth Chart */}
      {data.some((d) => d.queueDepth > 0) && (
        <div className="bg-white dark:bg-[#252526] p-4 rounded-lg border border-gray-200 dark:border-[#3e3e3e]">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-[#cccccc] mb-3">Queue Depth Over Time</h4>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="tick"
                label={{ value: 'Time (seconds)', position: 'insideBottom', offset: -5 }}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                label={{ value: 'Messages', angle: -90, position: 'insideLeft' }}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
                formatter={(value: number) => `${value.toLocaleString()} msgs`}
              />
              <Line
                type="monotone"
                dataKey="queueDepth"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={false}
                name="Queue Depth"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
