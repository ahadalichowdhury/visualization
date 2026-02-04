// Collaboration Service - WebSocket-based real-time collaboration for canvas
import type { Edge, Node } from 'reactflow';

export interface CollaborationUser {
  id: string;
  name: string;
  lastSeen: number;
  isIdle: boolean;
}

export interface CollaborationMessage {
  type: string;
  sessionId?: string;
  userId: string;
  userName: string;
  data: {
    nodes?: Node[];
    edges?: Edge[];
    x?: number;
    y?: number;
    nodeId?: string;
    lockedBy?: string;
    action?: string;
    user?: CollaborationUser;
    users?: CollaborationUser[];
    locks?: Record<string, string>;
    message?: string;
    code?: string;
  };
  timestamp: number;
}

type MessageCallback = (message: CollaborationMessage) => void;

class CollaborationService {
  private ws: WebSocket | null = null;
  private sessionId: string | null = null;
  private userId: string | null = null;
  private userName: string | null = null;
  private messageCallbacks: MessageCallback[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

  /**
   * Connect to a collaboration session
   */
  async connect(sessionId: string, userId: string, userName: string): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('🔌 Already connected to collaboration session');
      return;
    }

    this.sessionId = sessionId;
    this.userId = userId;
    this.userName = userName;

    return new Promise((resolve, reject) => {
      const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/collaborate?sessionId=${sessionId}&userId=${userId}&userName=${encodeURIComponent(userName)}`;

      console.log('🔌 Connecting to WebSocket:', wsUrl);

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('✅ WebSocket connected successfully');
        this.reconnectAttempts = 0;
        resolve();
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        reject(error);
      };

      this.ws.onclose = (event) => {
        console.log('🔌 WebSocket closed:', event.code, event.reason);
        this.handleDisconnect();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: CollaborationMessage = JSON.parse(event.data);
          console.log('📨 Received message:', message.type);
          this.messageCallbacks.forEach(callback => callback(message));
        } catch (error) {
          console.error('❌ Failed to parse WebSocket message:', error);
        }
      };

      // Timeout if connection takes too long
      setTimeout(() => {
        if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
          reject(new Error('WebSocket connection timeout'));
        }
      }, 5000);
    });
  }

  /**
   * Disconnect from the collaboration session
   */
  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.sessionId = null;
    this.userId = null;
    this.userName = null;
    this.reconnectAttempts = 0;
    console.log('🔌 Disconnected from collaboration');
  }

  /**
   * Handle WebSocket disconnect and attempt reconnection
   */
  private handleDisconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      return;
    }

    if (!this.sessionId || !this.userId || !this.userName) {
      return; // Don't reconnect if we don't have session info
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);

    console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms...`);

    this.reconnectTimeout = setTimeout(() => {
      this.connect(this.sessionId!, this.userId!, this.userName!).catch(error => {
        console.error('❌ Reconnection failed:', error);
      });
    }, delay);
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Subscribe to collaboration messages
   */
  onMessage(callback: MessageCallback): () => void {
    this.messageCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Request current state from server
   */
  requestState(): void {
    this.send({
      type: 'request_state',
      userId: this.userId!,
      userName: this.userName!,
      data: {},
      timestamp: Date.now(),
    });
  }

  /**
   * Send node update to other users
   */
  sendNodeUpdate(nodes: Node[]): void {
    this.send({
      type: 'node_update',
      userId: this.userId!,
      userName: this.userName!,
      data: { nodes },
      timestamp: Date.now(),
    });
  }

  /**
   * Send edge update to other users
   */
  sendEdgeUpdate(edges: Edge[]): void {
    this.send({
      type: 'edge_update',
      userId: this.userId!,
      userName: this.userName!,
      data: { edges },
      timestamp: Date.now(),
    });
  }

  /**
   * Send cursor movement to other users
   */
  sendCursorMove(x: number, y: number): void {
    this.send({
      type: 'cursor_move',
      userId: this.userId!,
      userName: this.userName!,
      data: { x, y },
      timestamp: Date.now(),
    });
  }

  /**
   * Lock a node for editing
   */
  lockNode(nodeId: string): void {
    this.send({
      type: 'lock',
      userId: this.userId!,
      userName: this.userName!,
      data: { nodeId },
      timestamp: Date.now(),
    });
  }

  /**
   * Unlock a node after editing
   */
  unlockNode(nodeId: string): void {
    this.send({
      type: 'unlock',
      userId: this.userId!,
      userName: this.userName!,
      data: { nodeId },
      timestamp: Date.now(),
    });
  }

  /**
   * End the collaboration session (Host only)
   */
  endSession(): void {
    this.send({
      type: 'session_end',
      userId: this.userId!,
      userName: this.userName!,
      data: {},
      timestamp: Date.now(),
    });
  }

  /**
   * Send a message through WebSocket
   */
  private send(message: CollaborationMessage): void {
    if (!this.isConnected()) {
      console.warn('⚠️  Cannot send message: WebSocket not connected');
      return;
    }

    try {
      this.ws!.send(JSON.stringify(message));
    } catch (error) {
      console.error('❌ Failed to send message:', error);
    }
  }
}

// Export singleton instance
export const collaborationService = new CollaborationService();
