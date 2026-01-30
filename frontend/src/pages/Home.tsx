import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/common/Button";
import { useAuthStore } from "../store/authStore";

export const Home: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-[#1a1a2e] dark:via-[#16213e] dark:to-[#0f1419]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
            Visualization Platform
          </h1>
          <p className="text-xl text-gray-700 dark:text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            Build, visualize, and simulate complex systems with our powerful
            real-time visualization tools.
          </p>

          {isAuthenticated ? (
            <div className="space-x-4">
              <Link to="/dashboard">
                <Button variant="primary" className="text-lg px-8 py-3">
                  Go to Dashboard
                </Button>
              </Link>
              <Link to="/canvas">
                <Button variant="outline" className="text-lg px-8 py-3">
                  Open Canvas
                </Button>
              </Link>
              {user && (
                <p className="mt-6 text-lg text-gray-700 dark:text-gray-300 font-medium">
                  Welcome back, {user.name || user.email}! 👋
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-x-4">
                <Link to="/canvas">
                  <Button variant="primary" className="text-lg px-8 py-3">
                    Try Canvas (No Login Required)
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button variant="outline" className="text-lg px-8 py-3">
                    Sign Up
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Start designing immediately • Login only needed to save
              </p>
            </div>
          )}
        </div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="card text-center hover:shadow-xl transition-all duration-300 hover:scale-105 border-t-4 border-blue-500 dark:border-blue-400">
            <div className="text-5xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              Real-time Graphs
            </h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Visualize data with interactive charts powered by Recharts
            </p>
          </div>

          <div className="card text-center hover:shadow-xl transition-all duration-300 hover:scale-105 border-t-4 border-purple-500 dark:border-purple-400">
            <div className="text-5xl mb-4">🎨</div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              Interactive Canvas
            </h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Build node-based diagrams with React Flow
            </p>
          </div>

          <div className="card text-center hover:shadow-xl transition-all duration-300 hover:scale-105 border-t-4 border-indigo-500 dark:border-indigo-400">
            <div className="text-5xl mb-4">⚡</div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              Real-time Updates
            </h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              WebSocket-powered live data streaming
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
