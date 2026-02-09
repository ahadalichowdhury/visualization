import { Clock, Users, Wifi, WifiOff } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { CollaborationUser } from "../../services/collaboration.service";
import { ThemeToggle } from "../common/ThemeToggle";

interface BuilderHeaderProps {
  projectName: string;
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onShowRequirements?: () => void;
  onManageArchitectures: () => void;
  onViewAnalytics?: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isSaving?: boolean;
  lastSavedAt?: Date | null;
  hasUnsavedChanges?: boolean;
  autoSaveEnabled?: boolean;
  isCollaborationEnabled?: boolean;
  isCollaborationConnected?: boolean;
  onToggleCollaboration?: () => void;
  onShowShareDialog?: () => void;
  users?: CollaborationUser[];
  currentUserId?: string;
  isHost?: boolean;
}

export const BuilderHeader = ({
  projectName,
  onSave,
  onUndo,
  onRedo,
  onClear,
  onShowRequirements,
  onManageArchitectures,
  onViewAnalytics,
  canUndo,
  canRedo,
  isSaving = false,
  lastSavedAt = null,
  hasUnsavedChanges = false,
  autoSaveEnabled = false,
  isCollaborationEnabled = false,
  isCollaborationConnected = false,
  onToggleCollaboration,
  onShowShareDialog,
  users = [],
  currentUserId,
  isHost = false,
}: BuilderHeaderProps) => {
  const [showSettings, setShowSettings] = useState(false);

  // Helper functions for user list
  const getUserColor = (userId: string): string => {
    const colors = [
      "bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-red-500",
      "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-teal-500",
    ];
    const index = userId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatLastSeen = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() / 1000) - timestamp);
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  // Get current user and others
  const currentUser = currentUserId ? users.find(u => u.id === currentUserId) : null;
  const otherUsers = currentUserId ? users.filter(u => u.id !== currentUserId) : users;

  // Format last saved time
  const getLastSavedText = () => {
    if (!lastSavedAt) return null;

    const now = new Date();
    const diffMs = now.getTime() - lastSavedAt.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);

    if (diffSecs < 10) return "Just now";
    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    return lastSavedAt.toLocaleTimeString();
  };

  return (
    <header className="bg-white dark:bg-[#252526] border-b border-gray-200 dark:border-[#3e3e3e] px-6 py-3 flex items-center justify-between shadow-sm">
      {/* Left: Project Name */}
      <div className="flex items-center space-x-3">
        <Link
          to="/scenarios"
          className="p-2 text-gray-500 hover:text-gray-900 dark:text-[#cccccc] hover:bg-gray-100 dark:hover:bg-[#2d2d2d] rounded-lg transition-colors"
          title="Back to Dashboard"
        >
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
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        </Link>
        <div className="w-px h-6 bg-slate-600"></div>
        <div className="flex items-center space-x-2">
          <span className="text-2xl">📐</span>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-[#cccccc]">
            {projectName}
          </h1>
        </div>
      </div>
      {/* Right: Actions */}
      <div className="flex items-center space-x-2">
        {/* Auto-save Status Indicator */}
        {autoSaveEnabled && (
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 dark:bg-[#2d2d2d] rounded-lg text-sm">
            {isSaving ? (
              <>
                <svg
                  className="animate-spin h-3 w-3 text-blue-600 dark:text-blue-400"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span className="text-gray-600 dark:text-gray-400">
                  Saving...
                </span>
              </>
            ) : hasUnsavedChanges ? (
              <>
                <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
                <span className="text-gray-600 dark:text-gray-400">
                  Unsaved changes
                </span>
              </>
            ) : (
              <>
                <svg
                  className="w-3 h-3 text-green-600 dark:text-green-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-gray-600 dark:text-gray-400">
                  Saved {getLastSavedText()}
                </span>
              </>
            )}
          </div>
        )}

        <ThemeToggle />



        {/* My Architectures Button */}
        <button
          onClick={onManageArchitectures}
          className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors font-medium text-sm flex items-center space-x-2"
          title="Manage saved architectures"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span>My Architectures</span>
        </button>

        {/* Analytics Button */}
        {onViewAnalytics && (
          <button
            onClick={onViewAnalytics}
            className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors font-medium text-sm flex items-center space-x-2"
            title="View Analytics"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <span>Analytics</span>
          </button>
        )}

        {/* My Architectures Button */}
        <button
          onClick={onManageArchitectures}
          className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors font-medium text-sm flex items-center space-x-2"
          title="Manage saved architectures"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <span>My Architectures</span>
        </button>

        {/* Save Button - Now shows "Save As" if already saved */}
        <button
          onClick={onSave}
          disabled={isSaving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm flex items-center space-x-2"
          title={
            autoSaveEnabled
              ? "Save a copy with new name"
              : "Save your architecture"
          }
        >
          {isSaving ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                />
              </svg>
              <span>{autoSaveEnabled ? "Save As..." : "Save"}</span>
            </>
          )}
        </button>

        {/* Undo Button */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="px-3 py-2 bg-gray-100 dark:bg-[#2d2d2d] text-gray-700 dark:text-[#d4d4d4] rounded-lg hover:bg-gray-200 dark:hover:bg-[#3e3e3e] disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium text-sm"
          title="Undo (Ctrl+Z)"
        >
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
              d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
            />
          </svg>
        </button>

        {/* Redo Button */}
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="px-3 py-2 bg-gray-100 dark:bg-[#2d2d2d] text-gray-700 dark:text-[#d4d4d4] rounded-lg hover:bg-gray-200 dark:hover:bg-[#3e3e3e] disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium text-sm"
          title="Redo (Ctrl+Y)"
        >
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
              d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6-6m6 6l-6 6"
            />
          </svg>
        </button>

        {/* Settings Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-3 py-2 bg-gray-100 dark:bg-[#2d2d2d] text-gray-700 dark:text-[#d4d4d4] rounded-lg hover:bg-gray-200 dark:hover:bg-[#3e3e3e] transition-colors font-medium text-sm flex items-center space-x-2"
          >
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
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span>Settings</span>
          </button>

          {/* Dropdown Menu */}
          {showSettings && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowSettings(false)}
              />

              {/* Menu */}
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#252526] rounded-lg shadow-lg border border-gray-200 dark:border-[#3e3e3e] py-1 z-20">
                  {/* Show Requirements - Only for scenarios */}
                  {onShowRequirements && (
                    <button
                      onClick={() => {
                        onShowRequirements();
                        setShowSettings(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-[#d4d4d4] hover:bg-gray-100 dark:hover:bg-[#2d2d2d] flex items-center space-x-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <span>Show Requirements</span>
                    </button>
                  )}

                <div className="border-t border-gray-200 dark:border-[#3e3e3e] my-1" />

                {/* Collaboration Section */}
                {isCollaborationEnabled ? (
                  <div className="px-4 py-2 bg-gray-50 dark:bg-[#1e1e1e] border-y border-gray-200 dark:border-[#3e3e3e]">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-gray-600 dark:text-[#d4d4d4]" />
                        <span className="text-sm font-semibold text-gray-900 dark:text-[#d4d4d4]">
                          Collaboration
                        </span>
                      </div>
                      {isCollaborationConnected ? (
                        <div className="flex items-center space-x-1">
                          <Wifi className="w-3 h-3 text-green-500" />
                          <span className="text-xs text-green-600 dark:text-green-400">Connected</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1">
                          <WifiOff className="w-3 h-3 text-red-500" />
                          <span className="text-xs text-red-600 dark:text-red-400">Disconnected</span>
                        </div>
                      )}
                    </div>

                    {/* User List */}
                    <div className="space-y-2 max-h-48 overflow-y-auto mb-3 custom-scrollbar">
                      {/* Current User */}
                      {currentUser && (
                        <div className="flex items-center space-x-2 p-1.5 bg-white dark:bg-[#252526] rounded border border-blue-100 dark:border-blue-900/30">
                          <div className={`w-6 h-6 rounded-full ${getUserColor(currentUser.id)} flex items-center justify-center text-white text-xs font-semibold`}>
                            {getInitials(currentUser.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 dark:text-[#d4d4d4] truncate">
                              {currentUser.name} (You)
                            </div>
                            {isHost && (
                              <div className="text-[10px] text-blue-600 dark:text-blue-400 uppercase tracking-wider font-bold">
                                Host
                              </div>
                            )}
                          </div>
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                        </div>
                      )}

                      {/* Other Users */}
                      {otherUsers.map((user) => (
                        <div key={user.id} className="flex items-center space-x-2 p-1.5">
                          <div className={`w-6 h-6 rounded-full ${getUserColor(user.id)} flex items-center justify-center text-white text-xs font-semibold`}>
                            {getInitials(user.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 dark:text-[#d4d4d4] truncate">
                              {user.name}
                            </div>
                            <div className="flex items-center space-x-1 text-[10px] text-gray-500 dark:text-[#9ca3af]">
                              <Clock className="w-3 h-3" />
                              <span>{formatLastSeen(user.lastSeen)}</span>
                            </div>
                          </div>
                          <div className={`w-1.5 h-1.5 rounded-full ${user.isIdle ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                        </div>
                      ))}
                      
                      {otherUsers.length === 0 && !currentUser && (
                         <div className="text-center py-2 text-xs text-gray-500">No active users</div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="space-y-1">
                      {onShowShareDialog && (
                        <button
                          onClick={() => {
                            onShowShareDialog();
                            setShowSettings(false);
                          }}
                          className="w-full px-3 py-1.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors flex items-center justify-center space-x-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                          </svg>
                          <span>Share Link</span>
                        </button>
                      )}
                      
                      {onToggleCollaboration && (
                        <button
                          onClick={() => {
                           onToggleCollaboration();
                           setShowSettings(false);
                          }}
                          className="w-full px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded transition-colors text-center"
                        >
                          {isHost ? "Disable Collaboration" : "Leave Session"}
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Enable Button */
                  onToggleCollaboration && (
                    <button
                      onClick={() => {
                        onToggleCollaboration();
                        setShowSettings(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-[#d4d4d4] hover:bg-gray-100 dark:hover:bg-[#2d2d2d] flex items-center space-x-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>Enable Collaboration</span>
                    </button>
                  )
                )}

                <div className="border-t border-gray-200 dark:border-[#3e3e3e] my-1" />

                <button
                  onClick={() => {
                    if (
                      confirm(
                        "Are you sure you want to clear the entire canvas?",
                      )
                    ) {
                      onClear();
                      setShowSettings(false);
                    }
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  <span>Clear Canvas</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
