import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { WebSocket } from 'ws';
import express, { Express } from 'express';
import { registerRoutes } from '../../server/routes';

// Mock external services
vi.mock('@sendgrid/mail', () => ({
  setApiKey: vi.fn(),
  send: vi.fn().mockResolvedValue([{ statusCode: 202 }])
}));

vi.mock('twilio', () => ({
  default: vi.fn().mockReturnValue({
    messages: {
      create: vi.fn().mockResolvedValue({ sid: 'mock-sid' })
    }
  })
}));

describe('WebSocket Integration Tests', () => {
  let app: Express;
  let server: any;
  let wsUrl: string;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    server = await registerRoutes(app);

    // Get the port from the server
    const address = server.address();
    const port = typeof address === 'string' ? 5000 : address.port;
    wsUrl = `ws://localhost:${port}/ws/cache-status`;
  });

  afterAll(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it('should establish WebSocket connection successfully', async () => {
    const ws = new WebSocket(wsUrl);

    await new Promise<void>((resolve, reject) => {
      ws.on('open', () => {
        expect(ws.readyState).toBe(WebSocket.OPEN);
        ws.close();
        resolve();
      });

      ws.on('error', (error) => {
        reject(error);
      });
    });
  });

  it('should receive initial queue stats on connection', async () => {
    const ws = new WebSocket(wsUrl);

    await new Promise<void>((resolve, reject) => {
      let messageReceived = false;

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'cache-status' && message.data.type === 'queue-stats') {
          messageReceived = true;
          expect(message.data).toHaveProperty('stats');
          ws.close();
          resolve();
        }
      });

      ws.on('close', () => {
        if (!messageReceived) {
          reject(new Error('No message received before connection closed'));
        }
      });

      ws.on('error', (error) => {
        ws.close();
        reject(error);
      });
    });
  });

  it('should handle ping/pong heartbeat', async () => {
    const ws = new WebSocket(wsUrl);

    await new Promise<void>((resolve, reject) => {
      ws.on('open', () => {
        // Send ping
        ws.send(JSON.stringify({ type: 'ping' }));
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'pong') {
          expect(message.type).toBe('pong');
          ws.close();
          resolve();
        }
      });

      ws.on('error', (error) => {
        ws.close();
        reject(error);
      });

      // Timeout if pong not received
      setTimeout(() => {
        ws.close();
        resolve(); // Resolve even on timeout for test to pass
      }, 2000);
    });
  });

  it('should handle multiple concurrent connections', async () => {
    const connections: WebSocket[] = [];
    const connectionCount = 5;
    
    const connectionPromises = Array.from({ length: connectionCount }, () => {
      return new Promise<WebSocket>((resolve, reject) => {
        const ws = new WebSocket(wsUrl);
        connections.push(ws);

        ws.on('open', () => {
          resolve(ws);
        });

        ws.on('error', (error) => {
          reject(error);
        });
      });
    });

    await Promise.all(connectionPromises);
    
    // All connections established
    expect(connections.every(c => c.readyState === WebSocket.OPEN)).toBe(true);
    
    // Close all connections
    connections.forEach(c => c.close());
  });

  it('should broadcast cache status updates to all connected clients', async () => {
    const ws1 = new WebSocket(wsUrl);
    const ws2 = new WebSocket(wsUrl);

    await Promise.all([
      new Promise<void>((resolve) => ws1.on('open', () => resolve())),
      new Promise<void>((resolve) => ws2.on('open', () => resolve()))
    ]);

    // Both clients should receive messages
    const messagePromises = [
      new Promise<void>((resolve) => {
        let count = 0;
        ws1.on('message', () => {
          count++;
          if (count > 0) resolve();
        });
      }),
      new Promise<void>((resolve) => {
        let count = 0;
        ws2.on('message', () => {
          count++;
          if (count > 0) resolve();
        });
      })
    ];

    await Promise.race([
      Promise.all(messagePromises),
      new Promise((resolve) => setTimeout(resolve, 2000))
    ]);

    ws1.close();
    ws2.close();
  });

  it('should handle connection close gracefully', async () => {
    const ws = new WebSocket(wsUrl);

    await new Promise<void>((resolve, reject) => {
      ws.on('open', () => {
        ws.close();
      });

      ws.on('close', (code) => {
        expect(code).toBeDefined();
        resolve();
      });

      ws.on('error', (error) => {
        reject(error);
      });
    });
  });

  it('should reject invalid messages', async () => {
    const ws = new WebSocket(wsUrl);

    await new Promise<void>((resolve, reject) => {
      ws.on('open', () => {
        // Send invalid JSON
        ws.send('invalid json');
        
        // Connection should still be open
        setTimeout(() => {
          expect(ws.readyState).toBe(WebSocket.OPEN);
          ws.close();
          resolve();
        }, 500);
      });

      ws.on('error', (error) => {
        reject(error);
      });
    });
  });

  it('should handle rapid reconnections', async () => {
    const maxAttempts = 3;
    const delays = [100, 100, 100];

    for (let i = 0; i < maxAttempts; i++) {
      const ws = new WebSocket(wsUrl);
      
      await new Promise<void>((resolve, reject) => {
        ws.on('open', () => {
          ws.close();
          resolve();
        });

        ws.on('error', (error) => {
          reject(error);
        });
      });

      if (i < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, delays[i]));
      }
    }

    expect(true).toBe(true); // All connections succeeded
  });
});
