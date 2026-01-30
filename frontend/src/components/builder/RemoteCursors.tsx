import React from 'react';
import { CollaborationUser } from '../../services/collaboration.service';

interface RemoteCursorsProps {
  users: CollaborationUser[];
  cursorPositions: Record<string, { x: number; y: number }>;
  currentUserId: string;
}

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
                  d="M5.65376 12.3673L11.5001 6.52095L12.2882 14.3839L8.87695 11.9906L5.65376 12.3673Z"
                  fill={user.color}
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              {/* User Name Label */}
              <div
                className="absolute left-5 top-2 px-2 py-1 rounded text-white text-xs font-medium whitespace-nowrap shadow-lg"
                style={{ backgroundColor: user.color }}
              >
                {user.name}
              </div>
            </div>
          );
        })}
    </>
  );
};
