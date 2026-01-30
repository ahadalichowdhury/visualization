import React, { useState } from "react";
import { Node } from "reactflow";
import { showWarning } from "../../utils/toast";

interface ChaosPanelProps {
  nodes: Node[];
  onInjectFailure: (chaosConfig: ChaosConfig) => void;
  externalTrigger?: boolean;
  onTriggerHandled?: () => void;
  hideButton?: boolean;  // Hide the trigger button (use footer button instead)
}

export interface ChaosConfig {
  targetNodeId: string;
  failureType: "crash" | "latency" | "throttle" | "partition";
  severity: number; // 0-100
  duration: number; // seconds
  autoRecover: boolean;
}

export const ChaosPanel: React.FC<ChaosPanelProps> = ({ nodes, onInjectFailure, externalTrigger, onTriggerHandled, hideButton = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState("");
  const [failureType, setFailureType] = useState<ChaosConfig["failureType"]>("latency");
  const [severity, setSeverity] = useState(50);
  const [duration, setDuration] = useState(10);
  const [autoRecover, setAutoRecover] = useState(true);

  // Handle external trigger
  React.useEffect(() => {
    if (externalTrigger) {
      setIsOpen(true);
      if (onTriggerHandled) {
        onTriggerHandled();
      }
    }
  }, [externalTrigger, onTriggerHandled]);

  const handleInjectFailure = () => {
    if (!selectedNode) {
      showWarning("Please select a node to inject failure");
      return;
    }

    const chaosConfig: ChaosConfig = {
      targetNodeId: selectedNode,
      failureType,
      severity,
      duration,
      autoRecover,
    };

    onInjectFailure(chaosConfig);
    setIsOpen(false);
  };

  return (
    <>
      {/* Trigger Button - Hidden when using footer button */}
      {!hideButton && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
          title="Chaos Engineering - Inject Failures"
        >
          <span>⚡</span>
          <span>Chaos Engineering</span>
        </button>
      )}

      {/* Chaos Panel Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-2xl w-full max-w-2xl p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  ⚡ Chaos Engineering
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Inject controlled failures to test system resilience
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            {/* Node Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Target Node
              </label>
              <select
                value={selectedNode}
                onChange={(e) => setSelectedNode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white"
              >
                <option value="">Select a node...</option>
                {nodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.data.label} ({node.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Failure Type */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Failure Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "crash", label: "💥 Crash", desc: "Complete node failure" },
                  { value: "latency", label: "🐌 Latency Injection", desc: "Add artificial delay" },
                  { value: "throttle", label: "🚦 Throttle", desc: "Reduce throughput" },
                  { value: "partition", label: "🔌 Network Partition", desc: "Disconnect node" },
                ].map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setFailureType(type.value as ChaosConfig["failureType"])}
                    className={`p-3 rounded-lg border-2 text-left transition ${
                      failureType === type.value
                        ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                        : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
                    }`}
                  >
                    <div className="font-semibold text-gray-900 dark:text-white">{type.label}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">{type.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Severity */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Severity: {severity}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={severity}
                onChange={(e) => setSeverity(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Mild</span>
                <span>Moderate</span>
                <span>Severe</span>
              </div>
            </div>

            {/* Duration */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duration (seconds)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                min="1"
                max="60"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white"
              />
            </div>

            {/* Auto Recover */}
            <div className="mb-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRecover}
                  onChange={(e) => setAutoRecover(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Auto-recover after duration
                </span>
              </label>
            </div>

            {/* Warning */}
            <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>⚠️ Warning:</strong> This will inject a real failure into your simulation.
                Make sure you have monitoring and recovery mechanisms in place.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleInjectFailure}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
              >
                💉 Inject Failure
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
