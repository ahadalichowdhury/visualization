import React from 'react';
import { CollaborationUser } from '../../services/collaboration.service';

interface CollaborationPanelProps {
  isConnected: boolean;
  users: CollaborationUser[];
  currentUserId: string;
}

export const CollaborationPanel: React.FC<CollaborationPanelProps> = ({
  isConnected,
  users,
  currentUserId,
}) => {
  const otherUsers = users.filter((u) => u.id !== currentUserId);

  return (
    <div className="absolute top-4 left-4 z-10 bg-white dark:bg-[#1e1e1e] rounded-lg shadow-lg p-4 min-w-[250px]">
      {/* Connection Status */}
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
        <div
          className={`w-3 h-3 rounded-full ${
            isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
          }`}
        />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {/* User List */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
          Collaborators ({otherUsers.length + 1})
        </h3>

        {/* Current User */}
        <div className="flex items-center gap-2 px-2 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: users.find((u) => u.id === currentUserId)?.color || '#3B82F6' }}
          >
            {users.find((u) => u.id === currentUserId)?.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {users.find((u) => u.id === currentUserId)?.name} (You)
            </div>
          </div>
        </div>

        {/* Other Users */}
        {otherUsers.map((user) => (
          <div
            key={user.id}
            className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 rounded transition"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: user.color }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {getTimeAgo(user.lastSeen)}
              </div>
            </div>
            <div className="w-2 h-2 rounded-full bg-green-500" />
          </div>
        ))}

        {otherUsers.length === 0 && (
          <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            No other users yet
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          👁️ Real-time collaboration active
        </p>
      </div>
    </div>
  );
};

// Helper function to get time ago string
function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp * 1000) / 1000);

  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}
