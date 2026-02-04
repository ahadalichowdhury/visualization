import React from 'react';
import { CollaborationUser } from '../../services/collaboration.service';

interface RemoteCursorsProps {
  users: CollaborationUser[];
  cursorPositions: Record<string, { x: number; y: number }>;
  currentUserId: string;
}

// Generate consistent color for each user
const getUserColor = (userId: string): string => {
  const colors = [
    "#3b82f6", // blue
    "#10b981", // green
    "#eab308", // yellow
    "#ef4444", // red
    "#a855f7", // purple
    "#ec4899", // pink
    "#6366f1", // indigo
    "#14b8a6", // teal
  ];
  const index = userId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[index % colors.length];
};

export const RemoteCursors: React.FC<RemoteCursorsProps> = ({
  users,
  cursorPositions,
  currentUserId,
}) => {
  return (
    <>
      {users
        .filter((user) => user.id !== currentUserId)
        .map((user) => {
          const position = cursorPositions[user.id];
          if (!position) return null;

          const color = getUserColor(user.id);

          return (
            <div
              key={user.id}
              className="absolute pointer-events-none z-50 transition-all duration-100 ease-out"
              style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                transform: 'translate(-2px, -2px)',
              }}
            >
              {/* Cursor Icon */}
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
              >
                <path
                  d="M5.65376 12.3673L17.6538 5.86734C19.4614 4.90607 21.5922 6.32315 21.3677 8.38113L19.3644 23.3811C19.1627 25.2463 16.8618 25.9625 15.5093 24.7039L11.4559 21.0163C11.1313 20.7227 10.6888 20.5789 10.2427 20.6221L4.69867 21.1877C2.68239 21.378 1.33088 19.1939 2.31346 17.4652L5.65376 12.3673Z"
                  fill={color}
                  stroke="white"
                  strokeWidth="2"
                />
              </svg>

              {/* User Name Label */}
              <div
                className="absolute left-5 top-2 px-2 py-1 rounded text-white text-xs font-medium whitespace-nowrap shadow-lg"
                style={{ backgroundColor: color }}
              >
                {user.name}
              </div>
            </div>
          );
        })}
    </>
  );
};
