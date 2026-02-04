import { Users, Wifi, WifiOff, Clock } from "lucide-react";
import type { CollaborationUser } from "../../services/collaboration.service";

interface CollaborationPanelProps {
  isConnected: boolean;
  users: CollaborationUser[];
  currentUserId: string;
}

export const CollaborationPanel = ({
  isConnected,
  users,
  currentUserId,
}: CollaborationPanelProps) => {
  // Get current user
  const currentUser = users.find(u => u.id === currentUserId);
  
  // Get other users
  const otherUsers = users.filter(u => u.id !== currentUserId);

  // Generate color for user avatar
  const getUserColor = (userId: string): string => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-red-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-teal-500",
    ];
    const index = userId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  // Get initials from name
  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Format last seen time
  const formatLastSeen = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() / 1000) - timestamp);
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  return (
    <div className="fixed top-16 right-4 w-72 bg-white dark:bg-[#252526] border border-gray-200 dark:border-[#3e3e3e] rounded-lg shadow-lg z-30">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#3e3e3e]">
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-gray-600 dark:text-[#d4d4d4]" />
          <h3 className="font-semibold text-gray-900 dark:text-[#d4d4d4]">
            Collaboration
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <>
              <Wifi className="w-4 h-4 text-green-500" />
              <span className="text-xs text-green-600 dark:text-green-400">Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-red-500" />
              <span className="text-xs text-red-600 dark:text-red-400">Disconnected</span>
            </>
          )}
        </div>
      </div>

      {/* Current User */}
      {currentUser && (
        <div className="p-4 border-b border-gray-200 dark:border-[#3e3e3e] bg-blue-50 dark:bg-blue-900/10">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full ${getUserColor(currentUser.id)} flex items-center justify-center text-white font-semibold`}>
              {getInitials(currentUser.name)}
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900 dark:text-[#d4d4d4]">
                {currentUser.name} (You)
              </div>
              <div className="text-xs text-gray-500 dark:text-[#9ca3af]">
                Host
              </div>
            </div>
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
          </div>
        </div>
      )}

      {/* Other Users */}
      <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
        {otherUsers.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-[#9ca3af]">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No other users yet</p>
            <p className="text-xs mt-1">Share the link to collaborate!</p>
          </div>
        ) : (
          otherUsers.map((user) => (
            <div key={user.id} className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full ${getUserColor(user.id)} flex items-center justify-center text-white font-semibold`}>
                {getInitials(user.name)}
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-[#d4d4d4]">
                  {user.name}
                </div>
                <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-[#9ca3af]">
                  <Clock className="w-3 h-3" />
                  <span>{formatLastSeen(user.lastSeen)}</span>
                </div>
              </div>
              <div className={`w-2 h-2 rounded-full ${user.isIdle ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 dark:border-[#3e3e3e] bg-gray-50 dark:bg-[#1e1e1e] text-center">
        <p className="text-xs text-gray-500 dark:text-[#9ca3af]">
          {users.length} {users.length === 1 ? 'user' : 'users'} active
        </p>
      </div>
    </div>
  );
};
