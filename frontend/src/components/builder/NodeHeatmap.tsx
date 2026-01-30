import { NodeMetrics } from '../../types/simulation.types';

interface NodeHeatmapProps {
  nodeMetrics: Record<string, NodeMetrics>;
}

export const NodeHeatmap = ({ nodeMetrics }: NodeHeatmapProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'warning':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'danger':
        return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'failed':
        return 'bg-red-100 border-red-300 text-red-800';
      default:
        return 'bg-gray-100 dark:bg-[#2d2d2d] border-gray-300 dark:border-[#3e3e3e] text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'normal':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'danger':
        return '🔥';
      case 'failed':
        return '❌';
      default:
        return '❓';
    }
  };

  const nodes = Object.values(nodeMetrics);

  if (nodes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No node metrics available</p>
      </div>
    );
  }

  return (
    <div>
      <div className="text-lg font-semibold text-gray-900 dark:text-[#cccccc] mb-3">🗺️ Node Health Heatmap</div>
      <div className="grid grid-cols-3 gap-3">
        {nodes.map((node) => (
          <div
            key={node.nodeId}
            className={`p-3 rounded-lg border-2 ${getStatusColor(node.status)} transition-all hover:shadow-md`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-sm truncate">{node.nodeId}</div>
              <div className="text-xl">{getStatusIcon(node.status)}</div>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>CPU:</span>
                <span className="font-bold">{node.cpuPercent.toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Memory:</span>
                <span className="font-bold">{node.memPercent.toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span>RPS In:</span>
                <span className="font-bold">{node.rpsIn.toFixed(0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Latency:</span>
                <span className="font-bold">{node.latencyMs.toFixed(1)}ms</span>
              </div>
              {node.errors > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Errors:</span>
                  <span className="font-bold">{node.errors}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex items-center justify-center space-x-4 text-xs">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded bg-green-100 border border-green-300"></div>
          <span>Normal</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-300"></div>
          <span>Warning</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded bg-orange-100 border border-orange-300"></div>
          <span>Danger</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded bg-red-100 border border-red-300"></div>
          <span>Failed</span>
        </div>
      </div>
    </div>
  );
};
