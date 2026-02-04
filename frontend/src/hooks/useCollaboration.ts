// useCollaboration Hook - Real-time collaboration for canvas
import { useCallback, useEffect, useRef, useState } from 'react';
import { Edge, Node } from 'reactflow';
import { CollaborationMessage, collaborationService, CollaborationUser } from '../services/collaboration.service';
import { showWarning } from '../utils/toast';

interface UseCollaborationOptions {
  sessionId: string;
  userId: string;
  userName: string;
  enabled?: boolean;
  onNodesChange?: (nodes: Node[]) => void;
  onEdgesChange?: (edges: Edge[]) => void;
  shouldLoadInitialState?: boolean;
  onSessionEnded?: (reason?: string) => void;
}

interface CollaborationState {
  isConnected: boolean;
  users: CollaborationUser[];
  locks: Record<string, string>; // nodeId -> userId
}

export function useCollaboration(options: UseCollaborationOptions) {
  const {
    sessionId,
    userId,
    userName,
    enabled = false,
    onNodesChange,
    onEdgesChange,
    shouldLoadInitialState = true
  } = options;

  const [state, setState] = useState<CollaborationState>({
    isConnected: false,
    users: [],
    locks: {},
  });

  const [cursorPositions, setCursorPositions] = useState<Record<string, { x: number; y: number }>>({});
  const lastUpdateRef = useRef<number>(0);
  const updateThrottleMs = 100;
  const idleTimeoutMs = 30000;
  const handleMessageRef = useRef<((msg: CollaborationMessage) => void) | null>(null);



  // Handle incoming messages
  const handleMessage = useCallback(
    (message: CollaborationMessage) => {
      console.log('🎯 Processing message:', message.type);

      switch (message.type) {
        case 'full_state':
          // FULL CANVAS STATE received - this is the SOURCE OF TRUTH!
          console.log('📦 Received FULL canvas state:', message.data);
          console.log('📦 Nodes in full_state:', message.data?.nodes?.length || 0);
          console.log('📦 Edges in full_state:', message.data?.edges?.length || 0);

          setState((prev) => ({
            ...prev,
            users: (message.data.users || []) as CollaborationUser[],
            locks: (message.data.locks || {}) as Record<string, string>,
          }));

          // Load complete canvas from server ONLY if requested (to avoid wiping host's canvas)
          if (shouldLoadInitialState) {
            if (message.data.nodes && onNodesChange) {
              console.log('🔄 Setting nodes from server:', message.data.nodes.length);
              onNodesChange(message.data.nodes as Node[]);
            }
            if (message.data.edges && onEdgesChange) {
              console.log('🔄 Setting edges from server:', message.data.edges.length);
              onEdgesChange(message.data.edges as Edge[]);
            }
          } else {
            console.log('🛑 Ignoring initial server state (Host mode)');
          }
          break;

        case 'user_presence':
          if (message.data.action === 'joined' && message.data.user) {
            console.log('👤 User joined:', message.data.user.name);
            setState((prev) => ({
              ...prev,
              users: [...prev.users, message.data.user as CollaborationUser],
            }));
          } else if (message.data.action === 'left') {
            console.log('👋 User left:', message.userId);
            setState((prev) => ({
              ...prev,
              users: prev.users.filter((u) => u.id !== message.userId),
            }));
            setCursorPositions((prev) => {
              const newPositions = { ...prev };
              delete newPositions[message.userId];
              return newPositions;
            });
          }
          break;

        case 'node_update':
          // Another user updated nodes - REPLACE COMPLETELY
          if (message.userId !== userId && onNodesChange && message.data.nodes) {
            console.log('📦 Remote node update from', message.userName, ':', message.data.nodes.length, 'nodes');
            onNodesChange(message.data.nodes as Node[]);
          }
          break;

        case 'edge_update':
          // Another user updated edges - REPLACE COMPLETELY
          if (message.userId !== userId && onEdgesChange && message.data.edges) {
            console.log('🔗 Remote edge update from', message.userName, ':', message.data.edges.length, 'edges');
            onEdgesChange(message.data.edges as Edge[]);
          }
          break;

        case 'cursor_move':
          if (message.userId !== userId && message.data.x !== undefined && message.data.y !== undefined) {
            setCursorPositions((prev) => ({
              ...prev,
              [message.userId]: { x: message.data.x!, y: message.data.y! },
            }));
          }
          break;

        case 'lock':
          if (message.data.nodeId) {
            setState((prev) => ({
              ...prev,
              locks: { ...prev.locks, [message.data.nodeId!]: message.userId },
            }));
          }
          break;

        case 'unlock':
          if (message.data.nodeId) {
            setState((prev) => {
              const newLocks = { ...prev.locks };
              delete newLocks[message.data.nodeId!];
              return { ...prev, locks: newLocks };
            });
          }
          break;

          console.warn(`❌ Node ${message.data.nodeId} is locked by ${message.data.lockedBy}`);
          showWarning(`This node is currently being edited by another user.`);
          break;

        case 'error':
          console.error('❌ Collaboration error:', message.data.message);
          if (message.data.code === 'SESSION_ENDED') {
            showWarning(message.data.message as string);
            if (options.onSessionEnded) {
              options.onSessionEnded(message.data.message as string);
            }
          }
          break;

        case 'session_ended':
          console.log('🛑 Session ended by host');
          if (options.onSessionEnded) {
            options.onSessionEnded('The host has ended the collaboration session.');
          }
          break;
      }
    },
    [userId, onNodesChange, onEdgesChange]
  );

  // Update ref when handler changes
  useEffect(() => {
    handleMessageRef.current = handleMessage;
  }, [handleMessage]);

  // Connect to collaboration session
  useEffect(() => {
    if (!enabled) {
      console.log('⏸️  Collaboration disabled, not connecting');
      return;
    }

    console.log('🚀 Connecting to collaboration session:', sessionId);
    let unsubscribe: (() => void) | null = null;

    const connect = async () => {
      try {
        await collaborationService.connect(sessionId, userId, userName);
        setState((prev) => ({ ...prev, isConnected: true }));

        // Subscribe to messages
        unsubscribe = collaborationService.onMessage((msg) => {
          handleMessageRef.current?.(msg);
        });

        // Request current state from server after connection
        // Small delay to ensure connection is fully established
        setTimeout(() => {
          collaborationService.requestState();
          console.log('📥 Requested current canvas state from server');
        }, 100);
      } catch (error) {
        console.error('❌ Failed to connect to collaboration:', error);
        setState((prev) => ({ ...prev, isConnected: false }));
      }
    };

    connect();

    return () => {
      console.log('🧹 Cleaning up collaboration connection');
      if (unsubscribe) {
        unsubscribe();
      }
      collaborationService.disconnect();
      setState((prev) => ({ ...prev, isConnected: false }));
    };
  }, [sessionId, userId, userName, enabled]);

  // Idle detection
  useEffect(() => {
    if (!state.isConnected || !enabled) {
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      setState((prev) => ({
        ...prev,
        users: prev.users.map((user) => ({
          ...user,
          isIdle: now - user.lastSeen > idleTimeoutMs,
        })),
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, [state.isConnected, enabled, idleTimeoutMs]);

  // Send COMPLETE nodes array (throttled)
  const sendNodesUpdate = useCallback(
    (nodes: Node[]) => {
      if (!enabled || !collaborationService.isConnected()) {
        return; // Don't send if not enabled or not connected
      }

      const now = Date.now();
      if (now - lastUpdateRef.current > updateThrottleMs) {
        console.log('📤 Sending complete nodes array:', nodes.length);
        collaborationService.sendNodeUpdate(nodes);
        lastUpdateRef.current = now;
      }
    },
    [updateThrottleMs, enabled]
  );

  // Send COMPLETE edges array (throttled)
  const sendEdgesUpdate = useCallback(
    (edges: Edge[]) => {
      if (!enabled || !collaborationService.isConnected()) {
        return; // Don't send if not enabled or not connected
      }

      const now = Date.now();
      if (now - lastUpdateRef.current > updateThrottleMs) {
        console.log('📤 Sending complete edges array:', edges.length);
        collaborationService.sendEdgeUpdate(edges);
        lastUpdateRef.current = now;
      }
    },
    [updateThrottleMs, enabled]
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

  // End the session (Host only)
  const endSession = useCallback(() => {
    collaborationService.endSession();
  }, []);

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
    endSession,
  };
}
