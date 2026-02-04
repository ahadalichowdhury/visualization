import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { scenarioService } from "../services/scenario.service";
import { useAuthStore } from "../store/authStore";
import type { Scenario, ScenarioProgress } from "../types/scenario.types";

export const ScenarioDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [progress, setProgress] = useState<ScenarioProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revealedHints, setRevealedHints] = useState(0);

  const fetchScenario = async () => {
    try {
      setLoading(true);
      setError(null);

      if (isAuthenticated && id) {
        console.log("Fetching scenario with progress for:", id);
        const data = await scenarioService.getUserScenarioProgress(id);
        console.log("Received data:", data);
        setScenario(data.scenario);
        setProgress(data.progress);
      } else if (id) {
        console.log("Fetching public scenario for:", id);
        const data = await scenarioService.getScenarioById(id);
        console.log("Received data:", data);
        setScenario(data);
      }
    } catch (err) {
      console.error("Error fetching scenario:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load scenario";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchScenario();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isAuthenticated]);

  const handleStartScenario = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    try {
      await scenarioService.updateProgress(id!, {
        status: "in_progress",
        steps_completed: 0,
        total_steps: 5, // You can make this dynamic
      });
      await fetchScenario();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to start scenario";
      setError(errorMessage);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-green-100 text-green-800";
      case "Intermediate":
        return "bg-yellow-100 text-yellow-800";
      case "Advanced":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 dark:bg-[#2d2d2d] text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#1e1e1e]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading scenario...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#1e1e1e]">
        <div className="text-center max-w-lg">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Error
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">
            Failed to load scenario
          </p>
          <p className="text-sm text-red-600 dark:text-red-400 mb-4 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
            {error}
          </p>
          <button
            onClick={() => navigate("/scenarios")}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >
            ← Back to Scenarios
          </button>
        </div>
      </div>
    );
  }

  if (!scenario) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#1e1e1e]">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            404
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">
            Scenario not found
          </p>
          <button
            onClick={() => navigate("/scenarios")}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >
            ← Back to Scenarios
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1e1e1e] py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate("/scenarios")}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-6 flex items-center gap-2 font-medium"
        >
          ← Back to Scenarios
        </button>

        {/* Header */}
        <div className="bg-white dark:bg-[#252526] rounded-lg shadow-lg p-8 mb-6 border border-gray-200 dark:border-[#3e3e3e]">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
                {scenario.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
                {scenario.description}
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-3 mb-6">
            <span
              className={`px-3 py-1 rounded-lg text-sm font-medium ${getDifficultyColor(
                scenario.difficulty,
              )}`}
            >
              {scenario.difficulty}
            </span>
            <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
              {scenario.category}
            </span>

          </div>

          {/* Progress */}
          {progress && (
            <div className="mb-6 p-5 bg-gray-50 dark:bg-[#2d2d2d] rounded-lg border border-gray-200 dark:border-[#3e3e3e]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Progress: {progress.steps_completed}/{progress.total_steps}{" "}
                  steps
                </span>
                <span
                  className={`text-sm px-3 py-1 rounded-full font-medium ${
                    progress.status === "completed"
                      ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"
                      : progress.status === "in_progress"
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400"
                        : "bg-gray-100 dark:bg-[#2d2d2d] text-gray-800 dark:text-gray-400"
                  }`}
                >
                  {progress.status.replace("_", " ").toUpperCase()}
                </span>
              </div>
              <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      (progress.steps_completed / progress.total_steps) * 100
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          )}

          {/* Action Button */}
          {!progress || progress.status === "not_started" ? (
            <button
              onClick={handleStartScenario}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-4 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {isAuthenticated ? "🚀 Start Scenario" : "🔐 Login to Start"}
            </button>
          ) : progress.status === "completed" ? (
            <button
              onClick={() => navigate("/scenarios")}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              ✓ Completed - View Other Scenarios
            </button>
          ) : (
            <div className="space-y-3">
              <button
                onClick={() => navigate(`/builder/${scenario.id}`)}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-4 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                🏗️ Build Architecture
              </button>
              <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                Design your system architecture to meet the goals
              </p>
            </div>
          )}
        </div>

        {/* Requirements */}
        <div className="bg-white dark:bg-[#252526] rounded-lg shadow-lg p-8 mb-6 border border-gray-200 dark:border-[#3e3e3e]">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            Requirements
          </h2>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-[#2d2d2d] rounded-lg border border-gray-200 dark:border-[#3e3e3e]">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Traffic Load
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {scenario.requirements.traffic_load}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-[#2d2d2d] rounded-lg border border-gray-200 dark:border-[#3e3e3e]">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                SLA
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {scenario.requirements.sla}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-[#2d2d2d] rounded-lg border border-gray-200 dark:border-[#3e3e3e]">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                User Base
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {scenario.requirements.user_base}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-[#2d2d2d] rounded-lg border border-gray-200 dark:border-[#3e3e3e]">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Consistency
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {scenario.requirements.consistency}
              </p>
            </div>
            {scenario.requirements.constraints.length > 0 && (
              <div className="p-4 bg-gray-50 dark:bg-[#2d2d2d] rounded-lg border border-gray-200 dark:border-[#3e3e3e]">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Constraints
                </h3>
                <ul className="list-disc list-inside space-y-2">
                  {scenario.requirements.constraints.map(
                    (constraint, index) => (
                      <li
                        key={index}
                        className="text-gray-600 dark:text-gray-400"
                      >
                        {constraint}
                      </li>
                    ),
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Goals */}
        <div className="bg-white dark:bg-[#252526] rounded-lg shadow-lg p-8 mb-6 border border-gray-200 dark:border-[#3e3e3e]">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
              />
            </svg>
            Success Goals
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-200 dark:border-green-800">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Max Latency
              </h3>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {scenario.goals.max_latency_ms}ms
              </p>
            </div>
            <div className="p-5 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                Max Error Rate
              </h3>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {scenario.goals.max_error_rate_percent}%
              </p>
            </div>
            <div className="p-5 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-2 border-purple-200 dark:border-purple-800">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-purple-600 dark:text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                  />
                </svg>
                Min Throughput
              </h3>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {scenario.goals.min_throughput_rps} RPS
              </p>
            </div>
            <div className="p-5 bg-orange-50 dark:bg-orange-900/20 rounded-lg border-2 border-orange-200 dark:border-orange-800">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-orange-600 dark:text-orange-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Regions
              </h3>
              <p className="text-sm font-bold text-orange-600 dark:text-orange-400">
                {scenario.goals.must_support_regions.join(", ")}
              </p>
            </div>
          </div>
        </div>

        {/* Hints */}
        {scenario.hints.length > 0 && (
          <div className="bg-white dark:bg-[#252526] rounded-lg shadow-lg p-8 border border-gray-200 dark:border-[#3e3e3e]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                💡 Hints
              </h2>
              <span className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-[#2d2d2d] px-3 py-1 rounded-full font-medium">
                {revealedHints} / {scenario.hints.length} revealed
              </span>
            </div>

            {revealedHints > 0 && (
              <div className="space-y-3 mb-4">
                {scenario.hints.slice(0, revealedHints).map((hint, index) => (
                  <div
                    key={index}
                    className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 dark:border-yellow-600 rounded-lg animate-fade-in"
                  >
                    <p className="text-gray-800 dark:text-gray-200">
                      <span className="font-semibold text-yellow-700 dark:text-yellow-400">
                        Hint {index + 1}:
                      </span>{" "}
                      {hint}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {revealedHints < scenario.hints.length ? (
              <div className="space-y-3">
                <button
                  onClick={() => setRevealedHints(revealedHints + 1)}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-lg hover:shadow-xl"
                >
                  💡 Reveal Next Hint ({revealedHints + 1} of{" "}
                  {scenario.hints.length})
                </button>
              </div>
            ) : (
              <div className="text-center p-4 bg-gray-50 dark:bg-[#2d2d2d] rounded-lg border border-gray-200 dark:border-[#3e3e3e]">
                <p className="text-gray-600 dark:text-gray-400">
                  ✓ All hints revealed ({scenario.hints.length} hints)
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
