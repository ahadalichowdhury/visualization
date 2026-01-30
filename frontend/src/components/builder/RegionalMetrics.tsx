interface RegionalMetricsProps {
  regionLatencyMap: Record<string, number>;
  regionTrafficMap: Record<string, number>;
  regionErrorRateMap?: Record<string, number>; // Optional for backwards compatibility
}

export const RegionalMetrics = ({ regionLatencyMap, regionTrafficMap, regionErrorRateMap }: RegionalMetricsProps) => {
  // CRITICAL FIX: Prioritize error rate over latency when determining status
  const getRegionalStatus = (latency: number, errorRate: number = 0) => {
    // If error rate > 50%, region is CRITICAL regardless of latency
    if (errorRate > 50) return { status: 'Critical', color: 'bg-red-500' };
    // If error rate > 20%, region is DEGRADED
    if (errorRate > 20) return { status: 'Degraded', color: 'bg-orange-500' };
    // If error rate > 5%, region is WARNING
    if (errorRate > 5) return { status: 'Warning', color: 'bg-yellow-500' };
    
    // Only if error rate is low (<5%), use latency to determine status
    if (latency < 100) return { status: 'Excellent', color: 'bg-green-500' };
    if (latency < 200) return { status: 'Good', color: 'bg-yellow-500' };
    if (latency < 350) return { status: 'Fair', color: 'bg-orange-500' };
    return { status: 'Poor', color: 'bg-red-500' };
  };

  const regions = Object.keys(regionLatencyMap);

  if (regions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No regional data available</p>
      </div>
    );
  }

  // Sort regions by latency
  const sortedRegions = regions.sort((a, b) => regionLatencyMap[a] - regionLatencyMap[b]);

  return (
    <div>
      <div className="text-lg font-semibold text-gray-900 dark:text-[#cccccc] mb-3">🌍 Regional Performance</div>
      
      <div className="space-y-3">
        {sortedRegions.map((region) => {
          const latency = regionLatencyMap[region];
          const traffic = regionTrafficMap[region] || 0;
          const errorRate = regionErrorRateMap?.[region] || 0;
          const trafficPercent = Math.max(...Object.values(regionTrafficMap)) > 0
            ? (traffic / Math.max(...Object.values(regionTrafficMap))) * 100
            : 0;
          
          const { status, color } = getRegionalStatus(latency, errorRate);

          return (
            <div key={region} className="bg-white dark:bg-[#252526] p-4 rounded-lg border border-gray-200 dark:border-[#3e3e3e]">
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold text-gray-900 dark:text-[#cccccc] capitalize">{region}</div>
                <div className={`text-xs px-2 py-1 rounded text-white ${color}`}>
                  {status}
                </div>
              </div>

              <div className="space-y-2">
                {/* Error Rate (NEW - most important metric!) */}
                {errorRate > 0 && (
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 dark:text-[#9ca3af]">Error Rate:</span>
                      <span className={`font-bold ${errorRate > 20 ? 'text-red-600' : 'text-gray-900 dark:text-[#cccccc]'}`}>
                        {errorRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-600 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          errorRate > 50 ? 'bg-red-500' : errorRate > 20 ? 'bg-orange-500' : 'bg-yellow-500'
                        }`}
                        style={{ width: `${Math.min(100, errorRate)}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                
                {/* Latency */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600 dark:text-[#9ca3af]">Latency:</span>
                    <span className="font-bold text-gray-900 dark:text-[#cccccc]">{latency.toFixed(1)}ms</span>
                  </div>
                  <div className="w-full bg-slate-600 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        latency < 100 ? 'bg-green-500' : latency < 200 ? 'bg-yellow-500' : 'bg-orange-500'
                      }`}
                      style={{ width: `${Math.min(100, (latency / 500) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Traffic */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600 dark:text-[#9ca3af]">Traffic:</span>
                    <span className="font-bold text-gray-900 dark:text-[#cccccc]">{traffic.toFixed(0)} RPS</span>
                  </div>
                  <div className="w-full bg-slate-600 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-blue-500 transition-all"
                      style={{ width: `${trafficPercent}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 grid grid-cols-4 gap-2 text-xs">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded bg-green-500"></div>
          <span>&lt;100ms</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded bg-yellow-500"></div>
          <span>&lt;200ms</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded bg-orange-500"></div>
          <span>&lt;350ms</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded bg-red-500"></div>
          <span>&gt;350ms</span>
        </div>
      </div>
    </div>
  );
};
