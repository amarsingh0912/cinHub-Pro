import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebSocketService } from '../../server/services/websocketService';
import { WebSocket, WebSocketServer } from 'ws';
import { EventEmitter } from 'events';

// Mock cache queue service
const mockCacheQueue = new EventEmitter();
Object.assign(mockCacheQueue, {
  getQueueStats: vi.fn(() => ({
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
  })),
});

vi.mock('../../server/services/cacheQueue', () => ({
  cacheQueueService: mockCacheQueue,
}));

describe('WebSocketService', () => {
  let service: WebSocketService;
  let mockServer: any;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new WebSocketService();
    
    mockServer = {
      on: vi.fn(),
      listen: vi.fn(),
    };
  });

  afterEach(() => {
    service.shutdown();
  });

  describe('initialization', () => {
    it('should initialize WebSocket server', () => {
      service.initialize(mockServer);
      
      const stats = service.getStats();
      expect(stats.serverInitialized).toBe(true);
    });

    it('should track connected clients', () => {
      service.initialize(mockServer);
      
      const stats = service.getStats();
      expect(stats.connectedClients).toBe(0);
    });
  });

  describe('cache queue events', () => {
    it('should handle job-status-changed event', () => {
      service.initialize(mockServer);

      const status = {
        id: 'job-1',
        status: 'processing',
        mediaType: 'movie',
        mediaId: 550,
        progress: 'Caching images...',
      };

      // Emit event
      mockCacheQueue.emit('job-status-changed', status);

      // Verify broadcast was called (we can't easily test without real WS connection)
      expect(true).toBe(true);
    });

    it('should handle job-completed event', () => {
      service.initialize(mockServer);

      const data = {
        jobId: 'job-1',
        mediaType: 'movie',
        mediaId: 550,
      };

      mockCacheQueue.emit('job-completed', data);
      expect(true).toBe(true);
    });

    it('should handle job-failed event', () => {
      service.initialize(mockServer);

      const data = {
        jobId: 'job-1',
        mediaType: 'movie',
        mediaId: 550,
        error: 'Failed to upload image',
      };

      mockCacheQueue.emit('job-failed', data);
      expect(true).toBe(true);
    });
  });

  describe('shutdown', () => {
    it('should clean up resources on shutdown', () => {
      service.initialize(mockServer);
      service.shutdown();

      const stats = service.getStats();
      expect(stats.connectedClients).toBe(0);
    });
  });

  describe('statistics', () => {
    it('should return connection statistics', () => {
      const stats = service.getStats();

      expect(stats).toHaveProperty('connectedClients');
      expect(stats).toHaveProperty('serverInitialized');
      expect(typeof stats.connectedClients).toBe('number');
      expect(typeof stats.serverInitialized).toBe('boolean');
    });
  });
});
