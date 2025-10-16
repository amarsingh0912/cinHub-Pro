import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Server as HTTPServer } from 'http';
import { WebSocket } from 'ws';

// Mock WebSocket Server
const mockWSSend = vi.fn();
const mockWSClose = vi.fn();
const mockWSOn = vi.fn();

const mockWSInstance = {
  send: mockWSSend,
  close: mockWSClose,
  on: mockWSOn,
  readyState: WebSocket.OPEN,
  OPEN: WebSocket.OPEN,
  CLOSED: WebSocket.CLOSED,
};

const mockWSServer = {
  on: vi.fn(),
  clients: new Set([mockWSInstance]),
  close: vi.fn(),
  handleUpgrade: vi.fn(),
};

vi.mock('ws', () => ({
  WebSocket: {
    OPEN: 1,
    CLOSED: 3,
  },
  WebSocketServer: vi.fn(() => mockWSServer),
}));

describe('WebSocket Service', () => {
  let httpServer: HTTPServer;

  beforeEach(() => {
    vi.clearAllMocks();
    httpServer = new HTTPServer();
    mockWSServer.clients.clear();
    mockWSServer.clients.add(mockWSInstance as any);
  });

  describe('Initialization', () => {
    it('should initialize WebSocket server', async () => {
      const { websocketService } = await import('../../server/services/websocketService');
      
      websocketService.initialize(httpServer);

      expect(mockWSServer.on).toHaveBeenCalledWith('connection', expect.any(Function));
    });

    it('should handle WebSocket connection', async () => {
      const { websocketService } = await import('../../server/services/websocketService');
      
      websocketService.initialize(httpServer);

      const connectionHandler = mockWSServer.on.mock.calls.find(
        call => call[0] === 'connection'
      )?.[1];

      connectionHandler?.(mockWSInstance);

      expect(mockWSOn).toHaveBeenCalledWith('message', expect.any(Function));
      expect(mockWSOn).toHaveBeenCalledWith('close', expect.any(Function));
      expect(mockWSOn).toHaveBeenCalledWith('error', expect.any(Function));
    });
  });

  describe('Broadcasting Messages', () => {
    it('should broadcast message to all connected clients', async () => {
      const client1 = { ...mockWSInstance, readyState: WebSocket.OPEN };
      const client2 = { ...mockWSInstance, readyState: WebSocket.OPEN };
      
      mockWSServer.clients.clear();
      mockWSServer.clients.add(client1 as any);
      mockWSServer.clients.add(client2 as any);

      const { websocketService } = await import('../../server/services/websocketService');
      websocketService.initialize(httpServer);

      const message = {
        type: 'CACHE_UPDATE',
        payload: { mediaId: 550, status: 'completed' },
      };

      websocketService.broadcast(message);

      expect(client1.send).toHaveBeenCalledWith(JSON.stringify(message));
      expect(client2.send).toHaveBeenCalledWith(JSON.stringify(message));
    });

    it('should only send to clients with OPEN state', async () => {
      const openClient = { ...mockWSInstance, readyState: WebSocket.OPEN };
      const closedClient = { ...mockWSInstance, readyState: WebSocket.CLOSED };
      
      mockWSServer.clients.clear();
      mockWSServer.clients.add(openClient as any);
      mockWSServer.clients.add(closedClient as any);

      const { websocketService } = await import('../../server/services/websocketService');
      websocketService.initialize(httpServer);

      const message = { type: 'TEST', payload: {} };
      websocketService.broadcast(message);

      expect(openClient.send).toHaveBeenCalled();
      expect(closedClient.send).not.toHaveBeenCalled();
    });

    it('should handle send errors gracefully', async () => {
      const errorClient = {
        ...mockWSInstance,
        readyState: WebSocket.OPEN,
        send: vi.fn(() => { throw new Error('Send failed'); }),
      };

      mockWSServer.clients.clear();
      mockWSServer.clients.add(errorClient as any);

      const { websocketService } = await import('../../server/services/websocketService');
      websocketService.initialize(httpServer);

      const message = { type: 'TEST', payload: {} };
      
      expect(() => websocketService.broadcast(message)).not.toThrow();
    });
  });

  describe('Message Types', () => {
    it('should send CACHE_UPDATE message', async () => {
      const { websocketService } = await import('../../server/services/websocketService');
      websocketService.initialize(httpServer);

      websocketService.sendCacheUpdate('movie', 550, 'completed');

      expect(mockWSSend).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'CACHE_UPDATE',
          payload: {
            mediaType: 'movie',
            mediaId: 550,
            status: 'completed',
          },
        })
      );
    });

    it('should send CACHE_PROGRESS message', async () => {
      const { websocketService } = await import('../../server/services/websocketService');
      websocketService.initialize(httpServer);

      websocketService.sendCacheProgress('movie', 550, 50, 100);

      expect(mockWSSend).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'CACHE_PROGRESS',
          payload: {
            mediaType: 'movie',
            mediaId: 550,
            current: 50,
            total: 100,
            percentage: 50,
          },
        })
      );
    });

    it('should send ERROR message', async () => {
      const { websocketService } = await import('../../server/services/websocketService');
      websocketService.initialize(httpServer);

      websocketService.sendError('movie', 550, 'Upload failed');

      expect(mockWSSend).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'ERROR',
          payload: {
            mediaType: 'movie',
            mediaId: 550,
            error: 'Upload failed',
          },
        })
      );
    });
  });

  describe('Client Management', () => {
    it('should track connected clients', async () => {
      const { websocketService } = await import('../../server/services/websocketService');
      websocketService.initialize(httpServer);

      const connectionHandler = mockWSServer.on.mock.calls.find(
        call => call[0] === 'connection'
      )?.[1];

      const newClient = { ...mockWSInstance };
      connectionHandler?.(newClient);

      const count = websocketService.getConnectedClientsCount();
      expect(count).toBeGreaterThan(0);
    });

    it('should remove clients on disconnect', async () => {
      const { websocketService } = await import('../../server/services/websocketService');
      websocketService.initialize(httpServer);

      const connectionHandler = mockWSServer.on.mock.calls.find(
        call => call[0] === 'connection'
      )?.[1];

      const client = { ...mockWSInstance };
      connectionHandler?.(client);

      const closeHandler = mockWSOn.mock.calls.find(
        call => call[0] === 'close'
      )?.[1];

      closeHandler?.();

      // Client should be removed from tracking
      const message = { type: 'TEST', payload: {} };
      client.send = vi.fn();
      websocketService.broadcast(message);
      
      expect(client.send).not.toHaveBeenCalled();
    });
  });

  describe('Message Handling', () => {
    it('should handle incoming messages', async () => {
      const { websocketService } = await import('../../server/services/websocketService');
      websocketService.initialize(httpServer);

      const connectionHandler = mockWSServer.on.mock.calls.find(
        call => call[0] === 'connection'
      )?.[1];

      connectionHandler?.(mockWSInstance);

      const messageHandler = mockWSOn.mock.calls.find(
        call => call[0] === 'message'
      )?.[1];

      const incomingMessage = JSON.stringify({
        type: 'PING',
      });

      messageHandler?.(incomingMessage);

      // Should respond to ping with pong
      expect(mockWSSend).toHaveBeenCalledWith(
        JSON.stringify({ type: 'PONG' })
      );
    });

    it('should handle malformed messages', async () => {
      const { websocketService } = await import('../../server/services/websocketService');
      websocketService.initialize(httpServer);

      const connectionHandler = mockWSServer.on.mock.calls.find(
        call => call[0] === 'connection'
      )?.[1];

      connectionHandler?.(mockWSInstance);

      const messageHandler = mockWSOn.mock.calls.find(
        call => call[0] === 'message'
      )?.[1];

      messageHandler?.('invalid json');

      // Should not crash
      expect(mockWSInstance.readyState).toBe(WebSocket.OPEN);
    });
  });

  describe('Error Handling', () => {
    it('should handle client errors', async () => {
      const { websocketService } = await import('../../server/services/websocketService');
      websocketService.initialize(httpServer);

      const connectionHandler = mockWSServer.on.mock.calls.find(
        call => call[0] === 'connection'
      )?.[1];

      connectionHandler?.(mockWSInstance);

      const errorHandler = mockWSOn.mock.calls.find(
        call => call[0] === 'error'
      )?.[1];

      const error = new Error('WebSocket error');
      
      expect(() => errorHandler?.(error)).not.toThrow();
    });

    it('should handle server errors', async () => {
      const { websocketService } = await import('../../server/services/websocketService');
      
      const serverErrorHandler = mockWSServer.on.mock.calls.find(
        call => call[0] === 'error'
      )?.[1];

      const error = new Error('Server error');
      
      expect(() => serverErrorHandler?.(error)).not.toThrow();
    });
  });

  describe('Heartbeat/Ping-Pong', () => {
    it('should respond to ping messages', async () => {
      const { websocketService } = await import('../../server/services/websocketService');
      websocketService.initialize(httpServer);

      const connectionHandler = mockWSServer.on.mock.calls.find(
        call => call[0] === 'connection'
      )?.[1];

      connectionHandler?.(mockWSInstance);

      const messageHandler = mockWSOn.mock.calls.find(
        call => call[0] === 'message'
      )?.[1];

      messageHandler?.(JSON.stringify({ type: 'PING' }));

      expect(mockWSSend).toHaveBeenCalledWith(
        JSON.stringify({ type: 'PONG' })
      );
    });

    it('should detect and remove dead connections', async () => {
      const { websocketService } = await import('../../server/services/websocketService');
      websocketService.initialize(httpServer);

      const deadClient = {
        ...mockWSInstance,
        readyState: WebSocket.CLOSED,
      };

      mockWSServer.clients.clear();
      mockWSServer.clients.add(deadClient as any);

      websocketService.cleanupDeadConnections();

      const message = { type: 'TEST', payload: {} };
      websocketService.broadcast(message);

      expect(deadClient.send).not.toHaveBeenCalled();
    });
  });

  describe('Shutdown', () => {
    it('should close all connections on shutdown', async () => {
      const { websocketService } = await import('../../server/services/websocketService');
      websocketService.initialize(httpServer);

      const client1 = { ...mockWSInstance };
      const client2 = { ...mockWSInstance };

      mockWSServer.clients.clear();
      mockWSServer.clients.add(client1 as any);
      mockWSServer.clients.add(client2 as any);

      websocketService.shutdown();

      expect(client1.close).toHaveBeenCalled();
      expect(client2.close).toHaveBeenCalled();
      expect(mockWSServer.close).toHaveBeenCalled();
    });
  });
});
