import { useState } from "react";
import type { Scenario } from "../../types/scenario.types";

interface ScenarioInfoPanelProps {
  scenario: Scenario | null;
  isOpen: boolean;
  onToggle: () => void;
}

export const ScenarioInfoPanel = ({
  scenario,
  isOpen,
  onToggle,
}: ScenarioInfoPanelProps) => {
  const [activeTab, setActiveTab] = useState<
    "requirements" | "hints" | "goals"
  >("requirements");

  if (!scenario) return null;

  return (
    <>
      {/* Toggle Button (always visible) */}

      {/* Sliding Panel */}
      <div
        className={`fixed top-0 right-0 h-full bg-white dark:bg-[#252526] shadow-2xl border-l border-gray-200 dark:border-[#3e3e3e] transform transition-transform duration-300 ease-in-out z-40 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ width: "500px" }}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">{scenario.title}</h2>
                <p className="text-primary-100 text-sm">
                  {scenario.description}
                </p>
              </div>
              <button
                onClick={onToggle}
                className="text-white hover:text-gray-200 text-2xl ml-4"
              >
                ×
              </button>
            </div>

            {/* Metadata */}
            <div className="flex items-center space-x-4 mt-4 text-sm">
              <span className="bg-white dark:bg-white/20 px-3 py-1 rounded-full">
                {scenario.category}
              </span>
              <span
                className={`px-3 py-1 rounded-full ${
                  scenario.difficulty === "Beginner"
                    ? "bg-green-500/20"
                    : scenario.difficulty === "Intermediate"
                      ? "bg-yellow-500/20"
                      : "bg-red-500/20"
                }`}
              >
                {scenario.difficulty}
              </span>

            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-[#3e3e3e] bg-gray-50 dark:bg-[#1e1e1e]">
            <button
              onClick={() => setActiveTab("requirements")}
              className={`flex-1 px-4 py-3 font-medium transition-colors ${
                activeTab === "requirements"
                  ? "bg-white dark:bg-[#252526] text-primary-600 border-b-2 border-primary-600"
                  : "text-gray-600 dark:text-[#9ca3af] hover:text-gray-900 dark:hover:text-[#cccccc]"
              }`}
            >
              📝 Requirements
            </button>
            <button
              onClick={() => setActiveTab("hints")}
              className={`flex-1 px-4 py-3 font-medium transition-colors ${
                activeTab === "hints"
                  ? "bg-white dark:bg-[#252526] text-primary-600 border-b-2 border-primary-600"
                  : "text-gray-600 dark:text-[#9ca3af] hover:text-gray-900 dark:hover:text-[#cccccc]"
              }`}
            >
              💡 Hints
            </button>
            <button
              onClick={() => setActiveTab("goals")}
              className={`flex-1 px-4 py-3 font-medium transition-colors ${
                activeTab === "goals"
                  ? "bg-white dark:bg-[#252526] text-primary-600 border-b-2 border-primary-600"
                  : "text-gray-600 dark:text-[#9ca3af] hover:text-gray-900 dark:hover:text-[#cccccc]"
              }`}
            >
              🎯 Goals
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === "requirements" && (
              <div className="space-y-4">
                {/* Requirements Overview */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                  <h3 className="font-semibold text-gray-900 dark:text-[#cccccc] mb-3 flex items-center">
                    <span className="text-blue-600 mr-2">📊</span>
                    System Requirements
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-[#9ca3af] font-medium">
                        User Base:
                      </span>
                      <p className="text-gray-900 dark:text-[#cccccc] mt-1">
                        {scenario.requirements.user_base}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-[#9ca3af] font-medium">
                        Traffic Load:
                      </span>
                      <p className="text-gray-900 dark:text-[#cccccc] mt-1">
                        {scenario.requirements.traffic_load}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-[#9ca3af] font-medium">
                        SLA:
                      </span>
                      <p className="text-gray-900 dark:text-[#cccccc] mt-1">
                        {scenario.requirements.sla}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-[#9ca3af] font-medium">
                        Consistency:
                      </span>
                      <p className="text-gray-900 dark:text-[#cccccc] mt-1">
                        {scenario.requirements.consistency}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Constraints */}
                {scenario.requirements.constraints &&
                  scenario.requirements.constraints.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-[#cccccc] mb-3 flex items-center">
                        <span className="text-orange-600 mr-2">⚠️</span>
                        Constraints
                      </h3>
                      <ul className="space-y-2">
                        {scenario.requirements.constraints.map(
                          (constraint: string, index: number) => (
                            <li key={index} className="flex items-start">
                              <span className="text-orange-600 mr-2 mt-1">
                                •
                              </span>
                              <span className="text-gray-700 dark:text-[#d4d4d4]">
                                {constraint}
                              </span>
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  )}
              </div>
            )}

            {activeTab === "hints" && (
              <div className="space-y-3">
                {scenario.hints && scenario.hints.length > 0 ? (
                  scenario.hints.map((hint, index) => (
                    <div
                      key={index}
                      className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-700"
                    >
                      <div className="flex items-start">
                        <span className="text-yellow-600 mr-3 text-lg">💡</span>
                        <p className="text-gray-700 dark:text-[#d4d4d4] flex-1">
                          {hint}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    No hints available
                  </p>
                )}
              </div>
            )}

            {activeTab === "goals" && (
              <div className="space-y-4">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-700">
                  <h3 className="font-semibold text-gray-900 dark:text-[#cccccc] mb-3 flex items-center">
                    <span className="text-green-600 mr-2">🎯</span>
                    Performance Targets
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center py-2 border-b border-green-200 dark:border-green-800/30">
                      <span className="text-gray-700 dark:text-[#d4d4d4]">
                        Max Latency
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-[#cccccc]">
                        {scenario.goals.max_latency_ms}ms
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-green-200 dark:border-green-800/30">
                      <span className="text-gray-700 dark:text-[#d4d4d4]">
                        Max Error Rate
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-[#cccccc]">
                        {scenario.goals.max_error_rate_percent}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-green-200 dark:border-green-800/30">
                      <span className="text-gray-700 dark:text-[#d4d4d4]">
                        Min Throughput
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-[#cccccc]">
                        {scenario.goals.min_throughput_rps} RPS
                      </span>
                    </div>
                    {scenario.goals.must_support_regions &&
                      scenario.goals.must_support_regions.length > 0 && (
                        <div className="py-2">
                          <span className="text-gray-700 dark:text-[#d4d4d4] mb-2 block">
                            Required Regions:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {scenario.goals.must_support_regions.map(
                              (region: string, index: number) => (
                                <span
                                  key={index}
                                  className="bg-white dark:bg-[#252526] px-3 py-1 rounded-full text-xs font-medium text-gray-700 dark:text-[#d4d4d4] border border-green-300 dark:border-green-700"
                                >
                                  {region}
                                </span>
                              ),
                            )}
                          </div>
                        </div>
                      )}
                    {scenario.goals.data_durability && (
                      <div className="py-2">
                        <span className="text-gray-700 dark:text-[#d4d4d4]">
                          Data Durability:
                        </span>
                        <p className="text-gray-900 dark:text-[#cccccc] font-medium mt-1">
                          {scenario.goals.data_durability}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overlay (when panel is open) */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/20 z-30" onClick={onToggle} />
      )}
    </>
  );
};
