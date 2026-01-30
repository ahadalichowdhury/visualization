import { useEffect, useState } from "react";

import { SimulationOutput } from "../../types/simulation.types";

interface LatencyHeatmapProps {
  isOpen: boolean;
  onClose: () => void;
  simulationResults: SimulationOutput | null;
  currentTick: number;
}

// Region latency matrix (from backend regions.go)
const REGION_LATENCY: Record<string, Record<string, number>> = {
  "us-east": {
    "us-east": 1,
    "us-west": 60,
    "eu-central": 85,
    "eu-west": 75,
    "ap-south": 200,
    "ap-southeast": 180,
    "ap-northeast": 150,
  },
  "us-west": {
    "us-east": 60,
    "us-west": 1,
    "eu-central": 140,
    "eu-west": 130,
    "ap-south": 220,
    "ap-southeast": 120,
    "ap-northeast": 100,
  },
  "eu-central": {
    "us-east": 85,
    "us-west": 140,
    "eu-central": 1,
    "eu-west": 15,
    "ap-south": 120,
    "ap-southeast": 160,
    "ap-northeast": 220,
  },
  "eu-west": {
    "us-east": 75,
    "us-west": 130,
    "eu-central": 15,
    "eu-west": 1,
    "ap-south": 110,
    "ap-southeast": 170,
    "ap-northeast": 230,
  },
  "ap-south": {
    "us-east": 200,
    "us-west": 220,
    "eu-central": 120,
    "eu-west": 110,
    "ap-south": 1,
    "ap-southeast": 50,
    "ap-northeast": 80,
  },
  "ap-southeast": {
    "us-east": 180,
    "us-west": 120,
    "eu-central": 160,
    "eu-west": 170,
    "ap-south": 50,
    "ap-southeast": 1,
    "ap-northeast": 60,
  },
  "ap-northeast": {
    "us-east": 150,
    "us-west": 100,
    "eu-central": 220,
    "eu-west": 230,
    "ap-south": 80,
    "ap-southeast": 60,
    "ap-northeast": 1,
  },
};

const getLatencyColor = (latencyMs: number): string => {
  if (latencyMs < 20) return "bg-green-500";
  if (latencyMs < 50) return "bg-lime-500";
  if (latencyMs < 100) return "bg-yellow-500";
  if (latencyMs < 150) return "bg-orange-500";
  if (latencyMs < 200) return "bg-red-500";
  return "bg-rose-900";
};

const getLatencyTextColor = (latencyMs: number): string => {
  if (latencyMs < 100) return "text-gray-900";
  return "text-white";
};

export const LatencyHeatmap = ({
  isOpen,
  onClose,
  simulationResults,
  currentTick,
}: LatencyHeatmapProps) => {
  const [regions, setRegions] = useState<string[]>([]);

  useEffect(() => {
    if (simulationResults) {
      const currentData = simulationResults.timeSeries[currentTick];
      if (currentData?.regionLatencyMap) {
        setRegions(Object.keys(currentData.regionLatencyMap));
      }
    }
  }, [simulationResults, currentTick]);

  if (!isOpen) return null;

  const currentData = simulationResults?.timeSeries[currentTick];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-[#3e3e3e]">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-[#cccccc]">
              🌍 Cross-Region Latency Heatmap
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Real-world network latency between AWS regions (milliseconds)
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-[#2d2d2d]"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {regions.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <div className="text-6xl mb-4">🌐</div>
              <p>No multi-region architecture detected</p>
              <p className="text-sm mt-2">
                Add components in different regions to see cross-region latency
              </p>
            </div>
          ) : regions.length === 1 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <div className="text-6xl mb-4">📍</div>
              <p>Single Region Architecture ({regions[0]})</p>
              <p className="text-sm mt-2">
                Add components in multiple regions to see cross-region latency
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Latency Matrix */}
              <div>
                <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-[#cccccc]">
                  Region-to-Region Latency Matrix
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="border border-gray-300 dark:border-[#3e3e3e] bg-gray-100 dark:bg-[#252526] p-2 text-xs font-bold text-gray-700 dark:text-[#d4d4d4]">
                          From \ To
                        </th>
                        {regions.map((region) => (
                          <th
                            key={region}
                            className="border border-gray-300 dark:border-[#3e3e3e] bg-gray-100 dark:bg-[#252526] p-2 text-xs font-bold text-gray-700 dark:text-[#d4d4d4]"
                          >
                            {region}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {regions.map((sourceRegion) => (
                        <tr key={sourceRegion}>
                          <td className="border border-gray-300 dark:border-[#3e3e3e] bg-gray-100 dark:bg-[#252526] p-2 text-xs font-bold text-gray-700 dark:text-[#d4d4d4]">
                            {sourceRegion}
                          </td>
                          {regions.map((targetRegion) => {
                            const latency =
                              REGION_LATENCY[sourceRegion]?.[targetRegion] || 100;
                            const isSameRegion = sourceRegion === targetRegion;

                            return (
                              <td
                                key={targetRegion}
                                className={`border border-gray-300 dark:border-[#3e3e3e] p-2 text-center ${
                                  isSameRegion
                                    ? "bg-gray-200 dark:bg-[#2d2d2d]"
                                    : getLatencyColor(latency)
                                }`}
                              >
                                <div
                                  className={`text-sm font-bold ${
                                    isSameRegion
                                      ? "text-gray-500"
                                      : getLatencyTextColor(latency)
                                  }`}
                                >
                                  {isSameRegion ? "—" : `${latency}ms`}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Legend */}
              <div>
                <h3 className="text-sm font-bold mb-2 text-gray-700 dark:text-[#d4d4d4]">
                  Latency Scale
                </h3>
                <div className="flex items-center space-x-2 flex-wrap">
                  <div className="flex items-center space-x-1">
                    <div className="w-6 h-6 bg-green-500 rounded"></div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {"<20ms"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-6 h-6 bg-lime-500 rounded"></div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      20-50ms
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-6 h-6 bg-yellow-500 rounded"></div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      50-100ms
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-6 h-6 bg-orange-500 rounded"></div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      100-150ms
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-6 h-6 bg-red-500 rounded"></div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      150-200ms
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-6 h-6 bg-rose-900 rounded"></div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {">200ms"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Current Simulation Stats */}
              {currentData && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <h3 className="text-sm font-bold mb-3 text-gray-900 dark:text-[#cccccc]">
                    📊 Current Simulation Stats (Tick {currentTick + 1})
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(currentData.regionLatencyMap || {}).map(
                      ([region, avgLatency]: [string, number]) => (
                        <div
                          key={region}
                          className="bg-white dark:bg-[#252526] rounded p-3 border border-gray-200 dark:border-[#3e3e3e]"
                        >
                          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                            {region}
                          </div>
                          <div className="text-lg font-bold text-gray-900 dark:text-[#cccccc]">
                            {avgLatency?.toFixed(1)}ms
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {currentData.regionTrafficMap?.[region]?.toFixed(0) || 0} RPS
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Info Box */}
              <div className="bg-gray-50 dark:bg-[#2d2d2d] rounded-lg p-4 border border-gray-200 dark:border-[#3e3e3e]">
                <h3 className="text-sm font-bold mb-2 text-gray-700 dark:text-[#d4d4d4]">
                  💡 Real-World Latency Data
                </h3>
                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <li>✅ Based on AWS CloudPing measurements</li>
                  <li>✅ Same-region: ~1ms (intra-AZ)</li>
                  <li>✅ Cross-US: ~60ms</li>
                  <li>✅ US-Europe: ~75-85ms</li>
                  <li>✅ US-Asia: ~150-200ms (intercontinental)</li>
                  <li>⚠️ Add CDN to reduce cross-region latency by 40-60%</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-[#3e3e3e] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
