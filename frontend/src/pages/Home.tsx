import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/common/Button";
import { useAuthStore } from "../store/authStore";

export const Home: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-[#1a1a2e] dark:via-[#16213e] dark:to-[#0f1419]">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white mb-4 sm:mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 leading-tight">
            Cloud Architecture Visualization
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-8 sm:mb-10 max-w-3xl mx-auto leading-relaxed px-4">
            Design, simulate, and optimize cloud architectures with our powerful
            real-time visualization and performance simulation platform.
          </p>

          {/* Welcome Message (if authenticated) - Separate from buttons */}
          {isAuthenticated && user && (
            <div className="mb-6 sm:mb-8">
              <div className="inline-flex items-center px-4 sm:px-6 py-3 bg-white dark:bg-[#252526] rounded-full shadow-lg border-2 border-blue-500 dark:border-blue-400">
                <div className="flex items-center space-x-3">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.name || "User"}
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-blue-500"
                    />
                  ) : (
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm sm:text-base">
                      {user.name
                        ? user.name[0].toUpperCase()
                        : user.email[0].toUpperCase()}
                    </div>
                  )}
                  <div className="text-left">
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      Welcome back
                    </p>
                    <p className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">
                      {user.name || user.email}! 👋
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CTA Buttons */}
          {isAuthenticated ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4">
              <Link to="/dashboard" className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-3 shadow-lg hover:shadow-xl"
                >
                  Go to Dashboard
                </Button>
              </Link>
              <Link to="/scenarios" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-3"
                >
                  Browse Scenarios
                </Button>
              </Link>
              <Link to="/canvas" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-3"
                >
                  Open Canvas
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4 px-4">
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link to="/canvas" className="w-full sm:w-auto">
                  <Button
                    variant="primary"
                    className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-3 shadow-lg hover:shadow-xl"
                  >
                    Try Canvas Free
                  </Button>
                </Link>
                <Link to="/scenarios" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-3"
                  >
                    View Scenarios
                  </Button>
                </Link>
                <Link to="/signup" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-3"
                  >
                    Sign Up
                  </Button>
                </Link>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Start designing immediately • No credit card required • Login
                only needed to save
              </p>
            </div>
          )}
        </div>

        {/* Key Features Grid */}
        <div className="mt-16 sm:mt-20 lg:mt-24 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 px-4">
          <div className="card text-center hover:shadow-xl transition-all duration-300 hover:scale-105 border-t-4 border-blue-500 dark:border-blue-400">
            <div className="text-4xl sm:text-5xl mb-4">🎨</div>
            <h3 className="text-lg sm:text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              Visual Architecture Builder
            </h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
              Drag-and-drop 40+ cloud components to design complex architectures
              with React Flow
            </p>
          </div>

          <div className="card text-center hover:shadow-xl transition-all duration-300 hover:scale-105 border-t-4 border-purple-500 dark:border-purple-400">
            <div className="text-4xl sm:text-5xl mb-4">⚡</div>
            <h3 className="text-lg sm:text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              Performance Simulation
            </h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
              Go-powered engine simulates traffic, resource usage, and identifies
              bottlenecks
            </p>
          </div>

          <div className="card text-center hover:shadow-xl transition-all duration-300 hover:scale-105 border-t-4 border-indigo-500 dark:border-indigo-400">
            <div className="text-4xl sm:text-5xl mb-4">📊</div>
            <h3 className="text-lg sm:text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              Real-time Analytics
            </h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
              Interactive charts showing RPS, latency, CPU, memory, and costs in
              real-time
            </p>
          </div>

          <div className="card text-center hover:shadow-xl transition-all duration-300 hover:scale-105 border-t-4 border-green-500 dark:border-green-400">
            <div className="text-4xl sm:text-5xl mb-4">💰</div>
            <h3 className="text-lg sm:text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              Cost Estimation
            </h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
              Calculate infrastructure costs based on AWS pricing before deployment
            </p>
          </div>

          <div className="card text-center hover:shadow-xl transition-all duration-300 hover:scale-105 border-t-4 border-orange-500 dark:border-orange-400">
            <div className="text-4xl sm:text-5xl mb-4">🌍</div>
            <h3 className="text-lg sm:text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              Multi-Region Support
            </h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
              Design cross-region architectures with realistic latency modeling
            </p>
          </div>

          <div className="card text-center hover:shadow-xl transition-all duration-300 hover:scale-105 border-t-4 border-red-500 dark:border-red-400">
            <div className="text-4xl sm:text-5xl mb-4">🔥</div>
            <h3 className="text-lg sm:text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              Chaos Engineering
            </h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
              Test resilience with failure injection and validate recovery strategies
            </p>
          </div>
        </div>

        {/* Use Cases Section */}
        <div className="mt-16 sm:mt-20 lg:mt-24 px-4">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center text-gray-900 dark:text-white mb-8 sm:mb-12">
            Perfect For
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-[#252526] rounded-xl p-6 shadow-lg border border-gray-200 dark:border-[#3e3e3e] hover:shadow-xl transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🎓</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    System Design Interviews
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Visualize and explain complex architectures with confidence
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#252526] rounded-xl p-6 shadow-lg border border-gray-200 dark:border-[#3e3e3e] hover:shadow-xl transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📈</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Capacity Planning
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Estimate infrastructure needs before building
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#252526] rounded-xl p-6 shadow-lg border border-gray-200 dark:border-[#3e3e3e] hover:shadow-xl transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">💡</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Learning Tool
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Understand cloud architecture patterns hands-on
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#252526] rounded-xl p-6 shadow-lg border border-gray-200 dark:border-[#3e3e3e] hover:shadow-xl transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🔧</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Cost Optimization
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Compare different architecture options and reduce costs
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#252526] rounded-xl p-6 shadow-lg border border-gray-200 dark:border-[#3e3e3e] hover:shadow-xl transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🚀</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Performance Testing
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Model load scenarios before deploying to production
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#252526] rounded-xl p-6 shadow-lg border border-gray-200 dark:border-[#3e3e3e] hover:shadow-xl transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📝</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Documentation
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Generate professional architecture diagrams instantly
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-16 sm:mt-20 lg:mt-24 bg-white dark:bg-[#252526] rounded-2xl shadow-xl p-8 sm:p-12 border border-gray-200 dark:border-[#3e3e3e]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
                40+
              </div>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Cloud Components
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
                6
              </div>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                AWS Regions
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
                50+
              </div>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Instance Types
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
                Real-time
              </div>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Simulation
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        {!isAuthenticated && (
          <div className="mt-16 sm:mt-20 text-center px-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              Join thousands of architects and engineers designing better systems
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup" className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  className="w-full sm:w-auto text-lg px-8 py-3 shadow-lg hover:shadow-xl"
                >
                  Sign Up Free
                </Button>
              </Link>
              <Link to="/canvas" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto text-lg px-8 py-3"
                >
                  Try Without Account
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
