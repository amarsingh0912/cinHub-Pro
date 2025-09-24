import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import { cacheQueueService, type CacheJobStatus } from './cacheQueue.js';

export interface WebSocketMessage {
  type: 'cache-status' | 'cache-completed' | 'cache-failed' | 'ping' | 'pong';
  data?: any;
}

export interface CacheStatusMessage {
  type: 'cache-status';
  data: {
    jobId: string;
    status: CacheJobStatus['status'];
    mediaType: 'movie' | 'tv';
    mediaId: number;
    progress?: string;
    error?: string;
    completedAt?: Date;
  };
}

export class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();
  private pingInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    this.setupCacheQueueListeners();
  }

  /**
   * Initialize WebSocket server
   */
  initialize(server: Server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws/cache-status'
    });

    console.log('WebSocket server initialized on /ws/cache-status');

    this.wss.on('connection', (ws, request) => {
      console.log(`New WebSocket connection from ${request.socket.remoteAddress}`);
      this.handleConnection(ws);
    });

    this.wss.on('error', (error) => {
      console.error('WebSocket server error:', error);
    });

    // Setup ping/pong to keep connections alive
    this.setupPingPong();
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(ws: WebSocket) {
    this.clients.add(ws);
    
    // Send current queue stats on connection
    const stats = cacheQueueService.getQueueStats();
    this.sendToClient(ws, {
      type: 'cache-status',
      data: {
        type: 'queue-stats',
        stats
      }
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString()) as WebSocketMessage;
        this.handleMessage(ws, message);
      } catch (error) {
        console.error('Invalid WebSocket message:', error);
      }
    });

    ws.on('close', (code, reason) => {
      console.log(`WebSocket connection closed: ${code} ${reason}`);
      this.clients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket connection error:', error);
      this.clients.delete(ws);
    });

    ws.on('pong', () => {
      // Client is alive, mark it
      (ws as any).isAlive = true;
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(ws: WebSocket, message: WebSocketMessage) {
    switch (message.type) {
      case 'ping':
        this.sendToClient(ws, { type: 'pong' });
        break;
      
      default:
        console.warn('Unknown WebSocket message type:', message.type);
    }
  }

  /**
   * Send message to a specific client
   */
  private sendToClient(ws: WebSocket, message: WebSocketMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        this.clients.delete(ws);
      }
    }
  }

  /**
   * Broadcast message to all connected clients
   */
  private broadcast(message: WebSocketMessage) {
    const deadClients: WebSocket[] = [];
    
    this.clients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify(message));
        } catch (error) {
          console.error('Error broadcasting WebSocket message:', error);
          deadClients.push(ws);
        }
      } else {
        deadClients.push(ws);
      }
    });

    // Remove dead connections
    deadClients.forEach(ws => this.clients.delete(ws));
  }

  /**
   * Setup listeners for cache queue events
   */
  private setupCacheQueueListeners() {
    // Listen for job status changes
    cacheQueueService.on('job-status-changed', (status: CacheJobStatus) => {
      const message: CacheStatusMessage = {
        type: 'cache-status',
        data: {
          jobId: status.id,
          status: status.status,
          mediaType: status.mediaType,
          mediaId: status.mediaId,
          progress: status.progress,
          error: status.error,
          completedAt: status.completedAt
        }
      };
      
      this.broadcast(message);
    });

    // Listen for job completion
    cacheQueueService.on('job-completed', (data: { jobId: string; mediaType: 'movie' | 'tv'; mediaId: number }) => {
      this.broadcast({
        type: 'cache-completed',
        data: {
          jobId: data.jobId,
          mediaType: data.mediaType,
          mediaId: data.mediaId
        }
      });
    });

    // Listen for job failures
    cacheQueueService.on('job-failed', (data: { jobId: string; mediaType: 'movie' | 'tv'; mediaId: number; error: string }) => {
      this.broadcast({
        type: 'cache-failed',
        data: {
          jobId: data.jobId,
          mediaType: data.mediaType,
          mediaId: data.mediaId,
          error: data.error
        }
      });
    });

    // Listen for job enqueued
    cacheQueueService.on('job-enqueued', (data: { jobId: string; mediaType: 'movie' | 'tv'; mediaId: number }) => {
      const stats = cacheQueueService.getQueueStats();
      this.broadcast({
        type: 'cache-status',
        data: {
          type: 'job-enqueued',
          jobId: data.jobId,
          mediaType: data.mediaType,
          mediaId: data.mediaId,
          stats
        }
      });
    });
  }

  /**
   * Setup ping/pong to keep connections alive
   */
  private setupPingPong() {
    this.pingInterval = setInterval(() => {
      const deadClients: WebSocket[] = [];
      
      this.clients.forEach(ws => {
        if ((ws as any).isAlive === false) {
          deadClients.push(ws);
          return;
        }
        
        (ws as any).isAlive = false;
        
        if (ws.readyState === WebSocket.OPEN) {
          try {
            ws.ping();
          } catch (error) {
            deadClients.push(ws);
          }
        } else {
          deadClients.push(ws);
        }
      });

      // Remove dead connections
      deadClients.forEach(ws => {
        this.clients.delete(ws);
        try {
          ws.terminate();
        } catch (error) {
          // Ignore termination errors
        }
      });

      if (deadClients.length > 0) {
        console.log(`Cleaned up ${deadClients.length} dead WebSocket connections`);
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Get connection statistics
   */
  getStats() {
    return {
      connectedClients: this.clients.size,
      serverInitialized: this.wss !== null
    };
  }

  /**
   * Shutdown WebSocket service
   */
  shutdown() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    this.clients.forEach(ws => {
      try {
        ws.close(1001, 'Server shutting down');
      } catch (error) {
        // Ignore close errors during shutdown
      }
    });
    
    this.clients.clear();

    if (this.wss) {
      this.wss.close(() => {
        console.log('WebSocket server closed');
      });
    }
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();