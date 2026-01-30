import { useEffect, useState, useCallback, useRef } from 'react';
import { Node, Edge } from 'reactflow';
import {
  collaborationService,
  CollaborationUser,
  CollaborationMessage,
  CollaborationState,
} from '../services/collaboration.service';
import { showWarning } from '../utils/toast';

interface UseCollaborationOptions {
  sessionId: string;
  userId: string;
  userName: string;
  onNodesChange?: (nodes: Node[]) => void;
  onEdgesChange?: (edges: Edge[]) => void;
}

export function useCollaboration(options: UseCollaborationOptions) {
  const { sessionId, userId, userName, onNodesChange, onEdgesChange } = options;

  const [state, setState] = useState<CollaborationState>({
    users: [],
    locks: {},
    isConnected: false,
  });

  const [cursorPositions, setCursorPositions] = useState<Record<string, { x: number; y: number }>>({});
  const lastUpdateRef = useRef<number>(0);
  const updateThrottleMs = 100; // Throttle updates to avoid overwhelming the server

  // Connect to collaboration session
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const connect = async () => {
      try {
        await collaborationService.connect(sessionId, userId, userName);
        setState((prev) => ({ ...prev, isConnected: true }));

        // Subscribe to messages
        unsubscribe = collaborationService.onMessage(handleMessage);
      } catch (error) {
        console.error('Failed to connect to collaboration:', error);
        setState((prev) => ({ ...prev, isConnected: false }));
      }
    };

    connect();

    // Cleanup on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      collaborationService.disconnect();
    };
  }, [sessionId, userId, userName]);

  // Handle incoming messages
  const handleMessage = useCallback(
    (message: CollaborationMessage) => {
      switch (message.type) {
        case 'sync':
          // Initial sync - receive current state
          setState((prev) => ({
            ...prev,
            users: message.data.users || [],
            locks: message.data.locks || {},
          }));
          break;

        case 'user_presence':
          // User joined or left
          if (message.data.action === 'joined') {
            setState((prev) => ({
              ...prev,
              users: [...prev.users, message.data.user],
            }));
          } else if (message.data.action === 'left') {
            setState((prev) => ({
              ...prev,
              users: prev.users.filter((u) => u.id !== message.userId),
            }));
            // Remove cursor
            setCursorPositions((prev) => {
              const newPositions = { ...prev };
              delete newPositions[message.userId];
              return newPositions;
            });
          }
          break;

        case 'node_update':
          // Another user updated nodes
          if (message.userId !== userId && onNodesChange) {
            onNodesChange(message.data.nodes);
          }
          break;

        case 'edge_update':
          // Another user updated edges
          if (message.userId !== userId && onEdgesChange) {
            onEdgesChange(message.data.edges);
          }
          break;

        case 'cursor_move':
          // Another user moved their cursor
          if (message.userId !== userId) {
            setCursorPositions((prev) => ({
              ...prev,
              [message.userId]: { x: message.data.x, y: message.data.y },
            }));
          }
          break;

        case 'lock':
          // Node was locked
          setState((prev) => ({
            ...prev,
            locks: { ...prev.locks, [message.data.nodeId]: message.userId },
          }));
          break;

        case 'unlock':
          // Node was unlocked
          setState((prev) => {
            const newLocks = { ...prev.locks };
            delete newLocks[message.data.nodeId];
            return { ...prev, locks: newLocks };
          });
          break;

        case 'lock_failed':
          // Failed to lock node (already locked by someone else)
          console.warn(`Node ${message.data.nodeId} is locked by ${message.data.lockedBy}`);
          showWarning(`This node is currently being edited by another user.`);
          break;
      }
    },
    [userId, onNodesChange, onEdgesChange]
  );

  // Send node updates (throttled)
  const sendNodesUpdate = useCallback(
    (nodes: Node[]) => {
      const now = Date.now();
      if (now - lastUpdateRef.current > updateThrottleMs) {
        collaborationService.sendNodeUpdate(nodes);
        lastUpdateRef.current = now;
      }
    },
    [updateThrottleMs]
  );

  // Send edge updates (throttled)
  const sendEdgesUpdate = useCallback(
    (edges: Edge[]) => {
      const now = Date.now();
      if (now - lastUpdateRef.current > updateThrottleMs) {
        collaborationService.sendEdgeUpdate(edges);
        lastUpdateRef.current = now;
      }
    },
    [updateThrottleMs]
  );

  // Send cursor movement (throttled)
  const sendCursorMove = useCallback(
    (x: number, y: number) => {
      const now = Date.now();
      if (now - lastUpdateRef.current > updateThrottleMs) {
        collaborationService.sendCursorMove(x, y);
        lastUpdateRef.current = now;
      }
    },
    [updateThrottleMs]
  );

  // Lock a node
  const lockNode = useCallback((nodeId: string) => {
    collaborationService.lockNode(nodeId);
  }, []);

  // Unlock a node
  const unlockNode = useCallback((nodeId: string) => {
    collaborationService.unlockNode(nodeId);
  }, []);

  // Check if a node is locked by another user
  const isNodeLockedByOther = useCallback(
    (nodeId: string): boolean => {
      const lockedBy = state.locks[nodeId];
      return lockedBy !== undefined && lockedBy !== userId;
    },
    [state.locks, userId]
  );

  // Get user who locked a node
  const getNodeLocker = useCallback(
    (nodeId: string): CollaborationUser | undefined => {
      const lockedBy = state.locks[nodeId];
      return state.users.find((u) => u.id === lockedBy);
    },
    [state.locks, state.users]
  );

  return {
    // State
    isConnected: state.isConnected,
    users: state.users,
    locks: state.locks,
    cursorPositions,

    // Actions
    sendNodesUpdate,
    sendEdgesUpdate,
    sendCursorMove,
    lockNode,
    unlockNode,
    isNodeLockedByOther,
    getNodeLocker,
  };
}
