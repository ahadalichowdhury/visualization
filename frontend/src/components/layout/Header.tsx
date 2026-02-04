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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
    setIsMobileMenuOpen(false);
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

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <header className="bg-white dark:bg-[#252526] shadow-sm border-b border-gray-200 dark:border-[#3e3e3e] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link
              to="/"
              className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
              onClick={closeMobileMenu}
            >
              <span className="hidden sm:inline">Visualization Platform</span>
              <span className="sm:hidden">VizPlatform</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-2">
            <Link to="/canvas" className={getLinkClasses("/canvas")}>
              Canvas
            </Link>

            <Link to="/scenarios" className={getLinkClasses("/scenarios")}>
              Scenarios
            </Link>

            {isAuthenticated && user ? (
              <>




                {user.subscription_tier === "admin" && (
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
                    <span className="font-medium hidden lg:inline">
                      {user.name || user.email}
                    </span>
                    <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 px-2 py-1 rounded-full font-medium">
                      {user.subscription_tier}
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
                  <Button variant="outline" className="text-sm px-3 py-2">
                    Sign in
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button variant="primary" className="text-sm px-3 py-2">
                    Sign up
                  </Button>
                </Link>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            <ThemeToggle />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2d2d2d] transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
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
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Menu Sidebar */}
        <div
          className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white dark:bg-[#252526] shadow-2xl z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
            isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#3e3e3e]">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Viz
            </h2>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2d2d2d] transition-colors"
              aria-label="Close menu"
            >
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Mobile Menu Content */}
          <div className="overflow-y-auto h-[calc(100%-4rem)] p-4">
            <nav className="flex flex-col space-y-2">
              <Link
                to="/canvas"
                className={getLinkClasses("/canvas")}
                onClick={closeMobileMenu}
              >
                Canvas
              </Link>

              <Link
                to="/scenarios"
                className={getLinkClasses("/scenarios")}
                onClick={closeMobileMenu}
              >
                Scenarios
              </Link>

              {isAuthenticated && user ? (
                <>




                  {user.subscription_tier === "admin" && (
                    <Link
                      to="/admin"
                      className={getLinkClasses("/admin")}
                      onClick={closeMobileMenu}
                    >
                      Admin
                    </Link>
                  )}

                  {/* User Profile Section */}
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-[#3e3e3e]">
                    {/* User Info Card */}
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 mb-4 border border-blue-100 dark:border-blue-800/30">
                      <div className="flex items-center space-x-3 mb-3">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user.name || "User"}
                            className="w-14 h-14 rounded-full border-3 border-white dark:border-gray-700 shadow-lg"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                            {user.name
                              ? user.name[0].toUpperCase()
                              : user.email[0].toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white text-base truncate">
                            {user.name || "User"}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-center">
                        <span className="inline-flex items-center px-3 py-1.5 bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold shadow-sm border border-blue-200 dark:border-blue-700">
                          <svg
                            className="w-3.5 h-3.5 mr-1.5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="uppercase tracking-wide">
                            {user.subscription_tier}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="space-y-1">
                      <Link
                        to="/profile"
                        className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                          isActive("/profile")
                            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2d2d2d]"
                        }`}
                        onClick={closeMobileMenu}
                      >
                        <svg
                          className="w-5 h-5 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        <span className="font-medium">Profile</span>
                      </Link>

                      <Link
                        to="/subscription"
                        className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                          isActive("/subscription")
                            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2d2d2d]"
                        }`}
                        onClick={closeMobileMenu}
                      >
                        <svg
                          className="w-5 h-5 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                          />
                        </svg>
                        <span className="font-medium">Subscription</span>
                      </Link>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all font-medium"
                      >
                        <svg
                          className="w-5 h-5 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="mt-4 pt-4 space-y-2 border-t border-gray-200 dark:border-[#3e3e3e]">
                  <Link to="/login" onClick={closeMobileMenu}>
                    <Button variant="outline" className="w-full">
                      Sign in
                    </Button>
                  </Link>
                  <Link to="/signup" onClick={closeMobileMenu}>
                    <Button variant="primary" className="w-full">
                      Sign up
                    </Button>
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};
