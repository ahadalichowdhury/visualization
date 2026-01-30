import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { Button } from "../common/Button";
import { ThemeToggle } from "../common/ThemeToggle";
export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Helper function to determine if a link is active
  const isActive = (path: string) => {
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  // Helper function to get link classes
  const getLinkClasses = (path: string) => {
    const baseClasses = "px-3 py-2 rounded-lg transition-all font-medium";
    const activeClasses =
      "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400";
    const inactiveClasses =
      "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-[#2d2d2d]";

    return `${baseClasses} ${isActive(path) ? activeClasses : inactiveClasses}`;
  };

  return (
    <header className="bg-white dark:bg-[#252526] shadow-sm border-b border-gray-200 dark:border-[#3e3e3e]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link
              to="/"
              className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
            >
              Visualization Platform
            </Link>
          </div>

          <nav className="flex items-center space-x-2">
            <Link to="/canvas" className={getLinkClasses("/canvas")}>
              Canvas
            </Link>

            <Link to="/scenarios" className={getLinkClasses("/scenarios")}>
              Scenarios
            </Link>

            {isAuthenticated && user ? (
              <>
                <Link to="/dashboard" className={getLinkClasses("/dashboard")}>
                  Dashboard
                </Link>

                {(user.role === "pro" || user.role === "admin") && (
                  <Link to="/pro" className={getLinkClasses("/pro")}>
                    Pro Features
                  </Link>
                )}

                {user.role === "admin" && (
                  <Link to="/admin" className={getLinkClasses("/admin")}>
                    Admin
                  </Link>
                )}

                <ThemeToggle />
                <div
                  className="relative"
                  onMouseEnter={() => setIsDropdownOpen(true)}
                  onMouseLeave={() => setIsDropdownOpen(false)}
                >
                  <button className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-[#2d2d2d] px-3 py-2 rounded-lg transition-all">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.name || "User"}
                        className="w-8 h-8 rounded-full border-2 border-blue-500 dark:border-blue-400"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
                        {user.name
                          ? user.name[0].toUpperCase()
                          : user.email[0].toUpperCase()}
                      </div>
                    )}
                    <span className="font-medium">
                      {user.name || user.email}
                    </span>
                    <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 px-2 py-1 rounded-full font-medium">
                      {user.role}
                    </span>
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 top-full pt-1 w-48 z-50">
                      <div className="bg-white dark:bg-[#252526] rounded-lg shadow-xl py-2 border border-gray-200 dark:border-[#3e3e3e]">
                        <Link
                          to="/profile"
                          className={`block px-4 py-2 transition-colors ${
                            isActive("/profile")
                              ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2d2d2d] hover:text-blue-600 dark:hover:text-blue-400"
                          }`}
                        >
                          👤 Profile
                        </Link>
                        <Link
                          to="/subscription"
                          className={`block px-4 py-2 transition-colors ${
                            isActive("/subscription")
                              ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2d2d2d] hover:text-blue-600 dark:hover:text-blue-400"
                          }`}
                        >
                          💎 Subscription
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2d2d2d] hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        >
                          🚪 Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <ThemeToggle />
                <Link to="/login">
                  <Button variant="outline">Sign in</Button>
                </Link>
                <Link to="/signup">
                  <Button variant="primary">Sign up</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};
