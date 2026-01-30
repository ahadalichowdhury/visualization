import React from "react";
import { useAuthStore } from "../store/authStore";

export const Dashboard: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1e1e1e] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
            Welcome back, {user?.name || user?.email}! 👋
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card hover:shadow-lg transition-shadow duration-300 border-l-4 border-blue-500">
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
              Account Status
            </h3>
            <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
              {user?.role.toUpperCase()}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Current plan
            </p>
          </div>

          {user?.progress_summary && (
            <>
              <div className="card hover:shadow-lg transition-shadow duration-300 border-l-4 border-green-500">
                <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                  Progress
                </h3>
                <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
                  {user.progress_summary.completed_scenarios} /{" "}
                  {user.progress_summary.total_scenarios}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Scenarios completed
                </p>
              </div>

              <div className="card hover:shadow-lg transition-shadow duration-300 border-l-4 border-orange-500">
                <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                  Streak
                </h3>
                <div className="text-4xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                  {user.progress_summary.streak_days || 0} 🔥
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Days in a row
                </p>
              </div>
            </>
          )}
        </div>

        <div className="card">
          <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
            Available Features
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-4 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-[#2d2d2d] transition-colors border-b border-gray-200 dark:border-[#3e3e3e] last:border-0">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Free Scenarios
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Access to basic visualization scenarios
                </p>
              </div>
              <span className="text-green-600 dark:text-green-400 font-semibold flex items-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Available
              </span>
            </div>

            <div className="flex items-center justify-between py-4 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-[#2d2d2d] transition-colors border-b border-gray-200 dark:border-[#3e3e3e]">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Sandbox Mode
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Create custom visualizations
                </p>
              </div>
              <span
                className={
                  user?.role === "pro" || user?.role === "admin"
                    ? "text-green-600 dark:text-green-400 font-semibold flex items-center gap-2"
                    : "text-gray-400 dark:text-gray-500 font-medium flex items-center gap-2"
                }
              >
                {user?.role === "pro" || user?.role === "admin" ? (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Available
                  </>
                ) : (
                  <>🔒 Pro Only</>
                )}
              </span>
            </div>

            <div className="flex items-center justify-between py-4 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-[#2d2d2d] transition-colors border-b border-gray-200 dark:border-[#3e3e3e]">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Failure Injection
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Test system resilience
                </p>
              </div>
              <span
                className={
                  user?.role === "pro" || user?.role === "admin"
                    ? "text-green-600 dark:text-green-400 font-semibold flex items-center gap-2"
                    : "text-gray-400 dark:text-gray-500 font-medium flex items-center gap-2"
                }
              >
                {user?.role === "pro" || user?.role === "admin" ? (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Available
                  </>
                ) : (
                  <>🔒 Pro Only</>
                )}
              </span>
            </div>

            <div className="flex items-center justify-between py-4 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-[#2d2d2d] transition-colors">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Admin Panel
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Manage users and system settings
                </p>
              </div>
              <span
                className={
                  user?.role === "admin"
                    ? "text-green-600 dark:text-green-400 font-semibold flex items-center gap-2"
                    : "text-gray-400 dark:text-gray-500 font-medium flex items-center gap-2"
                }
              >
                {user?.role === "admin" ? (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Available
                  </>
                ) : (
                  <>🔒 Admin Only</>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
