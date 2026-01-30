// Real-time Collaboration Service using WebSocket
import { Node, Edge } from 'reactflow';

export interface CollaborationUser {
  id: string;
  name: string;
  color: string;
  cursorX: number;
  cursorY: number;
  lastSeen: number;
}

export interface CollaborationMessage {
  type: string;
  userId: string;
  userName: string;
  sessionId: string;
  timestamp: number;
  data: any;
}

export interface CollaborationState {
  users: CollaborationUser[];
  locks: Record<string, string>; // nodeId -> userId
  isConnected: boolean;
}

type MessageHandler = (message: CollaborationMessage) => void;

class CollaborationService {
  private ws: WebSocket | null = null;
  private sessionId: string | null = null;
  private userId: string | null = null;
  private userName: string | null = null;
  private messageHandlers: MessageHandler[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;

  // Connect to collaboration session
  connect(sessionId: string, userId: string, userName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.sessionId = sessionId;
      this.userId = userId;
      this.userName = userName;

      const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${
        window.location.hostname
      }:${window.location.port || '9090'}/ws/collaborate?sessionId=${sessionId}&userId=${userId}&userName=${encodeURIComponent(userName)}`;

      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('🔗 Connected to collaboration session:', sessionId);
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: CollaborationMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('🔌 Disconnected from collaboration session');
          this.attemptReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  // Disconnect from session
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.sessionId = null;
    this.userId = null;
    this.userName = null;
    this.messageHandlers = [];
  }

  // Attempt to reconnect
  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Reconnecting... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      if (this.sessionId && this.userId && this.userName) {
        this.connect(this.sessionId, this.userId, this.userName).catch((error) => {
          console.error('Reconnect failed:', error);
        });
      }
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  // Send a message
  private send(message: CollaborationMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected. Message not sent:', message);
    }
  }

  // Handle incoming messages
  private handleMessage(message: CollaborationMessage) {
    this.messageHandlers.forEach((handler) => handler(message));
  }

  // Register message handler
  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.push(handler);
    // Return unsubscribe function
    return () => {
      this.messageHandlers = this.messageHandlers.filter((h) => h !== handler);
    };
  }

  // Send node update
  sendNodeUpdate(nodes: Node[]) {
    this.send({
      type: 'node_update',
      userId: this.userId!,
      userName: this.userName!,
      sessionId: this.sessionId!,
      timestamp: Date.now(),
      data: { nodes },
    });
  }

  // Send edge update
  sendEdgeUpdate(edges: Edge[]) {
    this.send({
      type: 'edge_update',
      userId: this.userId!,
      userName: this.userName!,
      sessionId: this.sessionId!,
      timestamp: Date.now(),
      data: { edges },
    });
  }

  // Send cursor movement
  sendCursorMove(x: number, y: number) {
    this.send({
      type: 'cursor_move',
      userId: this.userId!,
      userName: this.userName!,
      sessionId: this.sessionId!,
      timestamp: Date.now(),
      data: { x, y },
    });
  }

  // Lock a node for editing
  lockNode(nodeId: string) {
    this.send({
      type: 'lock',
      userId: this.userId!,
      userName: this.userName!,
      sessionId: this.sessionId!,
      timestamp: Date.now(),
      data: { nodeId },
    });
  }

  // Unlock a node
  unlockNode(nodeId: string) {
    this.send({
      type: 'unlock',
      userId: this.userId!,
      userName: this.userName!,
      sessionId: this.sessionId!,
      timestamp: Date.now(),
      data: { nodeId },
    });
  }

  // Get current user ID
  getCurrentUserId(): string | null {
    return this.userId;
  }

  // Check if connected
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
export const collaborationService = new CollaborationService();
