import { useEffect, useState } from "react";
import { Edge, Node } from "reactflow";
import { simulationService } from "../../services/simulation.service";
import type {
    SimulationOutput,
    SimulationPreset,
    WorkloadConfig,
} from "../../types/simulation.types";
import {
    exportSummaryReport,
    exportToCSV,
    exportToJSON,
} from "../../utils/exportUtils";
import { showError, showWarning } from "../../utils/toast";
import { NumericInput } from "../common/NumericInput";
import { AlertsPanel } from "./AlertsPanel";
import { NodeHeatmap } from "./NodeHeatmap";
import { RegionalMetrics } from "./RegionalMetrics";
import { SimulationChart } from "./SimulationChart";

interface PlaybackControl {
  isPlaying: boolean;
  currentTick: number;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (tick: number) => void;
  onReset: () => void;
}

import type { Scenario } from "../../types/scenario.types";

interface SimulationPanelProps {
  nodes: Node[];
  edges: Edge[];
  isOpen: boolean;
  onToggle: () => void;
  onSimulationComplete?: (results: SimulationOutput) => void;
  onPlaybackControl?: PlaybackControl;
  onShowLatencyHeatmap?: () => void;
  scenario?: Scenario | null; // Add scenario prop
}

export const SimulationPanel = ({
  nodes,
  edges,
  isOpen,
  onToggle,
  onSimulationComplete,
  onPlaybackControl,
  onShowLatencyHeatmap,
  scenario,
}: SimulationPanelProps) => {
  const [workload, setWorkload] = useState<WorkloadConfig>({
    rps: 10000,
    readWriteRatio: { read: 80, write: 20 },
    mode: "constant",
    regions: ["us-east"],
    durationSeconds: 30,
  });

  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<SimulationOutput | null>(null);
  const [presets, setPresets] = useState<SimulationPreset[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [costEstimate, setCostEstimate] = useState<{ 
    totalCost: number; 
    totalMonthlyCost?: number;
    breakdown: Record<string, number>;
    nodeCount?: number;
    edgeCount?: number;
  } | null>(null);
  const [isEstimatingCost, setIsEstimatingCost] = useState(false);

  // Load presets
  useEffect(() => {
    const loadPresets = async () => {
      try {
        const data = await simulationService.getPresets();
        setPresets(data);
      } catch (error) {
        console.error("Failed to load presets:", error);
      }
    };
    loadPresets();
  }, []);

  // Auto-estimate cost when nodes/edges change
  useEffect(() => {
    const estimateCost = async () => {
      if (nodes.length === 0) {
        setCostEstimate(null);
        return;
      }

      setIsEstimatingCost(true);
      try {
        // Filter out replica clones
        const mainNodes = nodes.filter((n) => {
          return !n.data?.replicaGroup || n.data.replicaGroup === n.id;
        });

        const mainNodeIds = new Set(mainNodes.map((n) => n.id));
        const mainEdges = edges.filter(
          (e) => mainNodeIds.has(e.source) && mainNodeIds.has(e.target),
        );

        const estimate = await simulationService.estimateCost({
          nodes: mainNodes,
          edges: mainEdges,
          workload,
        });

        setCostEstimate(estimate);
      } catch (error) {
        console.error("Failed to estimate cost:", error);
      } finally {
        setIsEstimatingCost(false);
      }
    };

    // Debounce cost estimation
    const timer = setTimeout(estimateCost, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges]);

  const runSimulation = async () => {
    if (nodes.length === 0) {
      showWarning("Please add components to your architecture first");
      return;
    }

    setIsRunning(true);
    setResults(null);

    try {
      // Filter out replica clones before sending to simulation
      // Backend only needs main nodes (replicas are handled via config.replicas count)
      const mainNodes = nodes.filter((n) => {
        // Keep nodes that are NOT replica clones (either no replicaGroup, or replicaGroup === own id)
        return !n.data?.replicaGroup || n.data.replicaGroup === n.id;
      });

      // Filter edges to only include those connected to main nodes
      const mainNodeIds = new Set(mainNodes.map((n) => n.id));
      const mainEdges = edges.filter(
        (e) => mainNodeIds.has(e.source) && mainNodeIds.has(e.target),
      );

      // Generate failures from node chaos state (Bridge the Gap)
      const chaosFailures: any[] = [];
      mainNodes.forEach(node => {
         if (node.data.chaosFailure) {
            let type = 'nodeFail';
            let delayMs = 0;

            // Map frontend chaos types to backend failure types
            switch (node.data.chaosFailure) {
                case 'crash':
                case 'partition':
                case 'throttle': 
                    type = 'nodeFail';
                    break;
                case 'latency':
                    type = 'networkDelay'; // Maps to Region Delay in backend
                    delayMs = (node.data.chaosSeverity || 50) * 20; // Severity 50 -> 1000ms delay
                    break;
            }

            chaosFailures.push({
                type,
                nodeId: node.id,
                region: node.data.config?.region || 'us-east',
                delayMs,
                startTick: 1, 
                endTick: node.data.chaosDuration || workload.durationSeconds
            });
         }
      });

      const output = await simulationService.runSimulation({
        nodes: mainNodes,
        edges: mainEdges,
        workload: {
            ...workload,
            failures: [...(workload.failures || []), ...chaosFailures]
        },
      });

      setResults(output);

      // Notify parent about simulation completion (for traffic visualization)
      if (onSimulationComplete) {
        onSimulationComplete(output);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showError(`Simulation failed: ${errorMessage}`);
    } finally {
      setIsRunning(false);
    }
  };

  const applyPreset = (preset: SimulationPreset) => {
    setWorkload(preset.workload);
  };

  return (
    <>
      {/* Toggle Button */}

      {/* Panel */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-white dark:bg-[#252526] shadow-2xl border-t border-gray-200 dark:border-[#3e3e3e] transform transition-transform duration-300 ease-in-out z-40 ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ height: "60vh", maxHeight: "600px" }}
      >
        <div className="h-full flex">
          {/* Configuration Side */}
          <div className="w-1/3 border-r border-gray-200 dark:border-[#3e3e3e] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-[#cccccc]">
                Workload Configuration
              </h3>
              <button
                onClick={onToggle}
                className="text-gray-500 hover:text-gray-700 dark:text-[#d4d4d4] bg-gray-100 dark:bg-[#2d2d2d] px-3 py-1 rounded-full text-sm font-medium hover:bg-gray-200 dark:hover:bg-[#3e3e3e]"
              >
                ✕ Close
              </button>
            </div>
            {/* Presets */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-[#d4d4d4] mb-2">
                Quick Presets
              </label>
              <select
                onChange={(e) => {
                  const preset = presets.find((p) => p.id === e.target.value);
                  if (preset) applyPreset(preset);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#3e3e3e] rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select a preset...</option>
                {presets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name} - {preset.description}
                  </option>
                ))}
              </select>
            </div>

            {/* RPS */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 dark:text-[#d4d4d4] mb-1">
                Traffic Load (RPS)
              </label>
              <NumericInput
                value={workload.rps}
                onChange={(val) =>
                  setWorkload({
                    ...workload,
                    rps: val ?? 0,
                  })
                }
                min={1}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Total incoming requests per second
              </p>
            </div>

            {/* Mode */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 dark:text-[#d4d4d4] mb-1">
                Traffic Pattern
              </label>
              <select
                value={workload.mode}
                onChange={(e) =>
                  setWorkload({ ...workload, mode: e.target.value as WorkloadConfig['mode'] })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#3e3e3e] rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="constant">Constant - Steady load</option>
                <option value="burst">Burst - Random spikes</option>
                <option value="spike">Spike - Sudden peak</option>
              </select>
            </div>

            {/* Duration */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 dark:text-[#d4d4d4] mb-1">
                Duration (seconds)
              </label>
              <NumericInput
                value={workload.durationSeconds}
                onChange={(val) =>
                  setWorkload({
                    ...workload,
                    durationSeconds: val ?? 30,
                  })
                }
                min={10}
                max={300}
                className="w-full"
              />
            </div>

            {/* Read/Write Ratio */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 dark:text-[#d4d4d4] mb-2">
                Read/Write Ratio
              </label>
              <div className="flex space-x-2">
                <div className="flex-1">
                  <label className="text-xs text-gray-600 dark:text-[#9ca3af]">
                    Read %
                  </label>
                  <NumericInput
                    value={workload.readWriteRatio.read}
                    onChange={(val) => {
                      const read = val ?? 0;
                      setWorkload({
                        ...workload,
                        readWriteRatio: { read, write: 100 - read },
                      });
                    }}
                    min={0}
                    max={100}
                    className="w-full text-sm"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-600 dark:text-[#9ca3af]">
                    Write %
                  </label>
                  <NumericInput
                    value={workload.readWriteRatio.write}
                    onChange={() => {}}
                    readOnly
                    className="w-full text-sm bg-gray-50"
                  />
                </div>
              </div>
            </div>

            {/* Regions Configuration */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 dark:text-[#d4d4d4] mb-2">
                🌍 Regions ({workload.regions.length})
              </label>
              <div className="space-y-2">
                {/* Available regions to add */}
                <select
                  onChange={(e) => {
                    if (
                      e.target.value &&
                      !workload.regions.includes(e.target.value)
                    ) {
                      setWorkload({
                        ...workload,
                        regions: [...workload.regions, e.target.value],
                      });
                      e.target.value = "";
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#3e3e3e] rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
                >
                  <option value="">+ Add Region...</option>
                  <option value="us-east">US East (N. Virginia)</option>
                  <option value="us-west">US West (Oregon)</option>
                  <option value="eu-central">EU Central (Frankfurt)</option>
                  <option value="eu-west">EU West (Ireland)</option>
                  <option value="ap-south">Asia Pacific (Mumbai)</option>
                  <option value="ap-southeast">Asia Pacific (Singapore)</option>
                  <option value="ap-northeast">Asia Pacific (Tokyo)</option>
                  <option value="sa-east">South America (São Paulo)</option>
                  <option value="ca-central">Canada (Central)</option>
                  <option value="me-south">Middle East (Bahrain)</option>
                  <option value="af-south">Africa (Cape Town)</option>
                  <option value="au-east">Australia (Sydney)</option>
                </select>

                {/* Selected regions */}
                <div className="flex flex-wrap gap-2">
                  {workload.regions.map((region) => (
                    <div
                      key={region}
                      className="flex items-center space-x-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium"
                    >
                      <span>{region}</span>
                      <button
                        onClick={() => {
                          if (workload.regions.length > 1) {
                            setWorkload({
                              ...workload,
                              regions: workload.regions.filter(
                                (r) => r !== region,
                              ),
                            });
                          } else {
                            showWarning("At least one region is required");
                          }
                        }}
                        className="text-blue-600 hover:text-blue-900 font-bold"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  💡 Add multiple regions to test geo-distributed architectures
                </p>
              </div>
            </div>

            {/* Advanced Options Toggle */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-primary-600 hover:text-primary-700 mb-4"
            >
              {showAdvanced ? "▼" : "▶"} Advanced Options
            </button>

            {showAdvanced && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200 dark:border-[#3e3e3e]">
                {/* Auto-Scaling Toggle */}
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-[#d4d4d4]">
                    <input
                      type="checkbox"
                      checked={workload.autoScaling?.enabled || false}
                      onChange={(e) =>
                        setWorkload({
                          ...workload,
                          autoScaling: e.target.checked
                            ? {
                                enabled: true,
                                upThreshold: 0.75,
                                downThreshold: 0.2,
                                cooldownSeconds: 10,
                                minReplicas: 1,
                                maxReplicas: 10,
                              }
                            : undefined,
                        })
                      }
                      className="rounded border-gray-300 dark:border-[#3e3e3e]"
                    />
                    <span>🔼 Enable Auto-Scaling</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1 ml-6">
                    Automatically scale replicas based on load
                  </p>
                </div>

                {/* Auto-Scaling Config (when enabled) */}
                {workload.autoScaling?.enabled && (
                  <div className="pl-6 space-y-3 border-l-2 border-blue-200">
                    {/* Scale Up Threshold */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-[#d4d4d4] mb-1">
                        Scale Up Threshold (CPU %)
                      </label>
                      <input
                        type="number"
                        value={workload.autoScaling.upThreshold * 100}
                        onChange={(e) =>
                          setWorkload({
                            ...workload,
                            autoScaling: {
                              ...workload.autoScaling!,
                              upThreshold: parseInt(e.target.value) / 100,
                            },
                          })
                        }
                        min="50"
                        max="95"
                        className="w-full px-2 py-1 border border-gray-300 dark:border-[#3e3e3e] rounded text-sm"
                      />
                      <p className="text-xs text-gray-400 mt-0.5">
                        Add replica when CPU exceeds this %
                      </p>
                    </div>

                    {/* Scale Down Threshold */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-[#d4d4d4] mb-1">
                        Scale Down Threshold (CPU %)
                      </label>
                      <input
                        type="number"
                        value={workload.autoScaling.downThreshold * 100}
                        onChange={(e) =>
                          setWorkload({
                            ...workload,
                            autoScaling: {
                              ...workload.autoScaling!,
                              downThreshold: parseInt(e.target.value) / 100,
                            },
                          })
                        }
                        min="10"
                        max="50"
                        className="w-full px-2 py-1 border border-gray-300 dark:border-[#3e3e3e] rounded text-sm"
                      />
                      <p className="text-xs text-gray-400 mt-0.5">
                        Remove replica when CPU falls below this %
                      </p>
                    </div>

                    {/* Min/Max Replicas */}
                    <div className="flex space-x-2">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-700 dark:text-[#d4d4d4] mb-1">
                          Min Replicas
                        </label>
                        <input
                          type="number"
                          value={workload.autoScaling.minReplicas}
                          onChange={(e) =>
                            setWorkload({
                              ...workload,
                              autoScaling: {
                                ...workload.autoScaling!,
                                minReplicas: parseInt(e.target.value) || 1,
                              },
                            })
                          }
                          min="1"
                          max="5"
                          className="w-full px-2 py-1 border border-gray-300 dark:border-[#3e3e3e] rounded text-sm"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-700 dark:text-[#d4d4d4] mb-1">
                          Max Replicas
                        </label>
                        <input
                          type="number"
                          value={workload.autoScaling.maxReplicas}
                          onChange={(e) =>
                            setWorkload({
                              ...workload,
                              autoScaling: {
                                ...workload.autoScaling!,
                                maxReplicas: parseInt(e.target.value) || 10,
                              },
                            })
                          }
                          min="2"
                          max="20"
                          className="w-full px-2 py-1 border border-gray-300 dark:border-[#3e3e3e] rounded text-sm"
                        />
                      </div>
                    </div>

                    {/* Cooldown */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-[#d4d4d4] mb-1">
                        Cooldown (seconds)
                      </label>
                      <input
                        type="number"
                        value={workload.autoScaling.cooldownSeconds}
                        onChange={(e) =>
                          setWorkload({
                            ...workload,
                            autoScaling: {
                              ...workload.autoScaling!,
                              cooldownSeconds: parseInt(e.target.value) || 10,
                            },
                          })
                        }
                        min="5"
                        max="60"
                        className="w-full px-2 py-1 border border-gray-300 dark:border-[#3e3e3e] rounded text-sm"
                      />
                      <p className="text-xs text-gray-400 mt-0.5">
                        Wait time between scaling actions
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Cost Estimate Banner */}
            {costEstimate && (
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-2xl">💰</span>
                      <h4 className="font-bold text-gray-900 dark:text-[#cccccc]">
                        Estimated Monthly Cost
                      </h4>
                    </div>
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-3">
                      ${costEstimate.totalMonthlyCost?.toFixed(2) || "0.00"}
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-normal">/month</span>
                    </div>
                    
                    {/* Cost Breakdown */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">💻 Compute:</span>
                        <span className="font-semibold">${costEstimate.breakdown?.compute?.toFixed(2) || "0.00"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">💾 Storage:</span>
                        <span className="font-semibold">${costEstimate.breakdown?.storage?.toFixed(2) || "0.00"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">🌐 Network:</span>
                        <span className="font-semibold">${costEstimate.breakdown?.network?.toFixed(2) || "0.00"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">⚙️ Other:</span>
                        <span className="font-semibold">${costEstimate.breakdown?.other?.toFixed(2) || "0.00"}</span>
                      </div>
                    </div>

                    <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                      💡 Estimated based on AWS pricing. Actual costs may vary.
                      <br/>
                      📊 {costEstimate.nodeCount} components, {costEstimate.edgeCount} connections
                    </div>
                  </div>

                  {isEstimatingCost && (
                    <div className="ml-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Run Button */}
            <button
              onClick={runSimulation}
              disabled={isRunning || nodes.length === 0}
              className="w-full mt-6 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isRunning ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Running...</span>
                </>
              ) : (
                <>
                  <span>▶️</span>
                  <span>Run Simulation</span>
                </>
              )}
            </button>
          </div>

          {/* Results Side */}
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-[#cccccc]">
                Results
              </h3>

              {/* Playback Controls */}
              {onPlaybackControl && results && (
                <div className="flex items-center space-x-2 bg-white dark:bg-[#252526] px-4 py-2 rounded-lg border border-gray-200 dark:border-[#3e3e3e] shadow-sm">
                  <span className="text-xs text-gray-600 dark:text-[#9ca3af]">
                    Tick: {onPlaybackControl.currentTick + 1}/
                    {results.timeSeries.length}
                  </span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={
                        onPlaybackControl.isPlaying
                          ? onPlaybackControl.onPause
                          : onPlaybackControl.onPlay
                      }
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                      title={onPlaybackControl.isPlaying ? "Pause" : "Play"}
                    >
                      {onPlaybackControl.isPlaying ? "⏸️" : "▶️"}
                    </button>
                    <button
                      onClick={onPlaybackControl.onReset}
                      className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm font-medium"
                      title="Reset"
                    >
                      ⏹️
                    </button>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={results.timeSeries.length - 1}
                    value={onPlaybackControl.currentTick}
                    onChange={(e) =>
                      onPlaybackControl.onSeek(parseInt(e.target.value))
                    }
                    className="w-32"
                    title="Seek"
                  />
                </div>
              )}
            </div>

            {!results && !isRunning && (
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">📊</div>
                <p className="text-lg">
                  Configure workload and click "Run Simulation"
                </p>
                <p className="text-sm mt-2">
                  Add components to your canvas to get started
                </p>
              </div>
            )}

            {results && (
              <div className="space-y-4">
                {/* Action Buttons Row */}
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-bold text-gray-900 dark:text-[#cccccc]">
                    Performance Summary
                  </h4>
                  {onShowLatencyHeatmap && (
                    <button
                      onClick={onShowLatencyHeatmap}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center space-x-2"
                    >
                      <span>🌍</span>
                      <span>Latency Heatmap</span>
                    </button>
                  )}
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Latency */}
                  <div className={`bg-white dark:bg-[#252526] p-4 rounded-lg border shadow-sm ${
                    scenario && results.metrics.latency.p95 <= scenario.goals.max_latency_ms
                      ? "border-green-200 dark:border-green-900/30 ring-1 ring-green-500/20"
                      : scenario ? "border-red-200 dark:border-red-900/30 ring-1 ring-red-500/20" : "border-gray-200 dark:border-[#3e3e3e]"
                  }`}>
                    <div className="text-sm font-semibold text-gray-600 dark:text-[#9ca3af] mb-2 flex justify-between">
                      <span>⏱️ Latency</span>
                      {scenario && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          results.metrics.latency.p95 <= scenario.goals.max_latency_ms
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        }`}>
                          Goal: &lt;{scenario.goals.max_latency_ms}ms
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600 dark:text-[#9ca3af]">
                          P50:
                        </span>
                        <span className="font-bold text-gray-900 dark:text-[#cccccc]">
                          {results.metrics.latency.p50?.toFixed(1) || 0}ms
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600 dark:text-[#9ca3af]">
                          P95:
                        </span>
                        <span className={`font-bold ${
                           scenario && results.metrics.latency.p95 > scenario.goals.max_latency_ms ? "text-red-600" : "text-gray-900 dark:text-[#cccccc]"
                        }`}>
                          {results.metrics.latency.p95?.toFixed(1) || 0}ms
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600 dark:text-[#9ca3af]">
                          P99:
                        </span>
                        <span className="font-bold text-gray-900 dark:text-[#cccccc]">
                          {results.metrics.latency.p99?.toFixed(1) || 0}ms
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Throughput */}
                  <div className={`bg-white dark:bg-[#252526] p-4 rounded-lg border shadow-sm ${
                     scenario && results.metrics.throughput >= scenario.goals.min_throughput_rps
                     ? "border-green-200 dark:border-green-900/30 ring-1 ring-green-500/20"
                     : scenario ? "border-red-200 dark:border-red-900/30 ring-1 ring-red-500/20" : "border-gray-200 dark:border-[#3e3e3e]"
                  }`}>
                    <div className="text-sm font-semibold text-gray-600 dark:text-[#9ca3af] mb-2 flex justify-between">
                      <span>🚀 Success RPS</span>
                      {scenario && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          results.metrics.throughput >= scenario.goals.min_throughput_rps
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        }`}>
                           Goal: &gt;{scenario.goals.min_throughput_rps}
                        </span>
                      )}
                    </div>
                    <div className={`text-3xl font-bold ${
                         scenario && results.metrics.throughput < scenario.goals.min_throughput_rps ? "text-red-600" : "text-green-600"
                    }`}>
                      {(results.metrics.throughput / 1000).toFixed(1)}K
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Requests Per Second</div>
                  </div>

                  {/* Error Rate */}
                  <div
                    className={`bg-white dark:bg-[#252526] p-4 rounded-lg border shadow-sm ${
                      (scenario && (results.metrics.errorRate * 100) > scenario.goals.max_error_rate_percent) || results.metrics.errorRate > 0.05
                        ? "border-red-300 bg-red-50 dark:bg-red-900/10"
                        : (scenario && (results.metrics.errorRate * 100) <= scenario.goals.max_error_rate_percent)
                        ? "border-green-200 dark:border-green-900/30 ring-1 ring-green-500/20"
                        : "border-gray-200 dark:border-[#3e3e3e]"
                    }`}
                  >
                    <div className="text-sm font-semibold text-gray-600 dark:text-[#9ca3af] mb-2 flex justify-between">
                      <span>❌ Error Rate</span>
                       {scenario && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          (results.metrics.errorRate * 100) <= scenario.goals.max_error_rate_percent
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        }`}>
                           Goal: &lt;{scenario.goals.max_error_rate_percent}%
                        </span>
                      )}
                    </div>
                    <div
                      className={`text-3xl font-bold ${
                        results.metrics.errorRate > 0.05 || (scenario && (results.metrics.errorRate * 100) > scenario.goals.max_error_rate_percent)
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {(results.metrics.errorRate * 100).toFixed(2)}%
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {results.metrics.failedRequests} /{" "}
                      {results.metrics.totalRequests} failed
                    </div>
                  </div>

                  {/* Cache Hit Rate */}
                  <div className="bg-white dark:bg-[#252526] p-4 rounded-lg border border-gray-200 dark:border-[#3e3e3e] shadow-sm">
                    <div className="text-sm font-semibold text-gray-600 dark:text-[#9ca3af] mb-2">
                      ⚡ Cache Hit Rate
                    </div>
                    <div className="text-3xl font-bold text-blue-600">
                      {(results.metrics.cacheHitRate * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Queue Depth */}
                {results.metrics.queueDepth > 0 && (
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <div className="text-sm font-semibold text-gray-900 dark:text-[#cccccc] mb-1">
                      📮 Queue Backlog
                    </div>
                    <div className="text-2xl font-bold text-yellow-700">
                      {results.metrics.queueDepth.toLocaleString()} messages
                    </div>
                  </div>
                )}

                {/* Auto-scaling Events */}
                {results.metrics.autoscalingEvents &&
                  results.metrics.autoscalingEvents.length > 0 && (
                    <div className="bg-white dark:bg-[#252526] p-4 rounded-lg border border-gray-200 dark:border-[#3e3e3e]">
                      <div className="text-sm font-semibold text-gray-900 dark:text-[#cccccc] mb-3">
                        📈 Auto-Scaling Events (
                        {results.metrics.autoscalingEvents.length})
                      </div>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {results.metrics.autoscalingEvents.map((event, idx) => (
                          <div
                            key={idx}
                            className="text-xs bg-blue-50 p-2 rounded"
                          >
                            <span className="font-medium">
                              Tick {event.tick}:
                            </span>{" "}
                            {event.oldValue} → {event.newValue} replicas
                            <div className="text-gray-600 dark:text-[#9ca3af]">
                              {event.reason}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Bottlenecks */}
                {results.bottlenecks && results.bottlenecks.length > 0 && (
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <div className="text-sm font-semibold text-gray-900 dark:text-[#cccccc] mb-3 flex items-center">
                      <span className="mr-2">🚨</span>
                      <span>
                        Bottlenecks Detected ({results.bottlenecks.length})
                      </span>
                    </div>
                    <div className="space-y-3">
                      {results.bottlenecks.map((bottleneck, idx) => (
                        <div
                          key={idx}
                          className="bg-white dark:bg-[#252526] p-3 rounded border border-red-300"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="font-semibold text-gray-900 dark:text-[#cccccc] text-sm">
                              {bottleneck.nodeId}: {bottleneck.issue}
                            </div>
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                bottleneck.severity === "critical"
                                  ? "bg-red-600 text-white"
                                  : bottleneck.severity === "high"
                                    ? "bg-orange-500 text-white"
                                    : bottleneck.severity === "medium"
                                      ? "bg-yellow-500 text-white"
                                      : "bg-blue-500 text-white"
                              }`}
                            >
                              {bottleneck.severity.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-xs text-gray-700 dark:text-[#d4d4d4] mb-2">
                            <strong>Root Cause:</strong> {bottleneck.rootCause}
                          </div>
                          <div className="text-xs text-gray-700 dark:text-[#d4d4d4] mb-2">
                            <strong>Impact:</strong> {bottleneck.impact}
                          </div>
                          <div className="text-xs">
                            <strong className="text-gray-700 dark:text-[#d4d4d4]">
                              Suggestions:
                            </strong>
                            <ul className="list-disc list-inside mt-1 text-gray-600 dark:text-[#9ca3af]">
                              {bottleneck.suggestions.map(
                                (suggestion, sidx) => (
                                  <li key={sidx}>{suggestion}</li>
                                ),
                              )}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SLA Violations */}
                {results.slaViolations && results.slaViolations.length > 0 && (
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <div className="text-sm font-semibold text-gray-900 dark:text-[#cccccc] mb-3">
                      ⚠️ SLA Violations ({results.slaViolations.length})
                    </div>
                    <ul className="space-y-2">
                      {results.slaViolations.map((violation, idx) => (
                        <li
                          key={idx}
                          className="text-xs bg-white dark:bg-[#252526] p-2 rounded border border-orange-300 text-gray-700 dark:text-[#d4d4d4]"
                        >
                          {violation}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Cost Metrics */}
                {results.costMetrics && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="text-sm font-semibold text-gray-900 dark:text-[#cccccc] mb-3">
                      💰 Cost Estimation
                    </div>
                    <div className="bg-white dark:bg-[#252526] p-3 rounded border border-green-300">
                      <div className="text-sm text-gray-600 dark:text-[#9ca3af] mb-1">
                        30-second simulation
                      </div>
                      <div className="text-2xl font-bold text-green-600 mb-1">
                        ${results.costMetrics.totalCostUSD.toFixed(4)} USD
                      </div>
                      <div className="text-xs text-gray-500 space-y-1 mb-3">
                        <div>
                          Hourly: $
                          {(results.costMetrics.totalCostUSD * 120).toFixed(2)}
                          /hr
                        </div>
                        <div>
                          Monthly: $
                          {(
                            results.costMetrics.totalCostUSD *
                            120 *
                            24 *
                            30
                          ).toFixed(2)}
                          /mo
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        {Object.entries(results.costMetrics.compute).map(
                          ([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-gray-600 dark:text-[#9ca3af] capitalize">
                                {key.replace(/_/g, " ")}:
                              </span>
                              <span className="font-semibold">
                                ${(value as number).toFixed(2)}
                              </span>
                            </div>
                          ),
                        )}
                        {Object.entries(results.costMetrics.storage).map(
                          ([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-gray-600 dark:text-[#9ca3af] capitalize">
                                {key.replace(/_/g, " ")}:
                              </span>
                              <span className="font-semibold">
                                ${(value as number).toFixed(2)}
                              </span>
                            </div>
                          ),
                        )}
                        {Object.entries(results.costMetrics.network).map(
                          ([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-gray-600 dark:text-[#9ca3af] capitalize">
                                {key.replace(/_/g, " ")}:
                              </span>
                              <span className="font-semibold">
                                ${(value as number).toFixed(2)}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Time Series Charts */}
                <div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-[#cccccc] mb-3">
                    📈 Performance Over Time
                  </div>
                  <SimulationChart data={results.timeSeries} />
                </div>

                {/* Node Heatmap */}
                {results.timeSeries.length > 0 &&
                  results.timeSeries[results.timeSeries.length - 1]
                    .nodeMetrics && (
                    <NodeHeatmap
                      nodeMetrics={
                        results.timeSeries[results.timeSeries.length - 1]
                          .nodeMetrics
                      }
                    />
                  )}

                {/* Regional Metrics */}
                {results.timeSeries.length > 0 &&
                  results.timeSeries[results.timeSeries.length - 1]
                    .regionLatencyMap && (
                    <RegionalMetrics
                      regionLatencyMap={
                        results.timeSeries[results.timeSeries.length - 1]
                          .regionLatencyMap
                      }
                      regionTrafficMap={
                        results.timeSeries[results.timeSeries.length - 1]
                          .regionTrafficMap
                      }
                      regionErrorRateMap={
                        results.timeSeries[results.timeSeries.length - 1]
                          .regionErrorRateMap
                      }
                    />
                  )}

                {/* Export Actions */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 dark:border-[#3e3e3e]">
                  <div className="text-sm font-semibold text-gray-900 dark:text-[#cccccc] mb-3">
                    📥 Export Results
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => exportToJSON(results)}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                    >
                      📄 Export JSON
                    </button>
                    <button
                      onClick={() => exportToCSV(results)}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
                    >
                      📊 Export CSV
                    </button>
                    <button
                      onClick={() => exportSummaryReport(results)}
                      className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm font-medium"
                    >
                      📋 Export Report
                    </button>
                    <button
                      onClick={() => setShowAlerts(true)}
                      className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm font-medium"
                    >
                      🔔 View Alerts (
                      {results.bottlenecks.length +
                        results.slaViolations.length}
                      )
                    </button>
                  </div>
                </div>

                {/* Summary Stats */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                  <div className="text-sm font-semibold text-gray-900 dark:text-[#cccccc] mb-2">
                    📊 Summary
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-gray-600 dark:text-[#9ca3af]">
                        Total Requests:
                      </span>
                      <span className="font-bold text-gray-900 dark:text-[#cccccc] ml-2">
                        {results.metrics.totalRequests.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-[#9ca3af]">
                        Successful:
                      </span>
                      <span className="font-bold text-green-600 ml-2">
                        {results.metrics.successfulRequests.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-[#9ca3af]">
                        Avg Latency:
                      </span>
                      <span className="font-bold text-gray-900 dark:text-[#cccccc] ml-2">
                        {results.metrics.latency.avg.toFixed(1)}ms
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-[#9ca3af]">
                        Max Latency:
                      </span>
                      <span className="font-bold text-red-600 ml-2">
                        {results.metrics.latency.max.toFixed(1)}ms
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alerts Panel */}
      {results && (
        <AlertsPanel
          bottlenecks={results.bottlenecks || []}
          slaViolations={results.slaViolations || []}
          isOpen={showAlerts}
          onClose={() => setShowAlerts(false)}
        />
      )}
    </>
  );
};
