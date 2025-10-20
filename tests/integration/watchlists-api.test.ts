import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express, { type Express } from 'express';
import { registerRoutes } from '../../server/routes';
import { storage } from '../../server/storage';

describe('Watchlists API Integration Tests', () => {
  let app: Express;
  let server: any;
  let authToken: string;
  let userId: string;
  let watchlistId: string;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    server = await registerRoutes(app);

    // Create test user and get auth token
    const signupResponse = await request(app)
      .post('/api/auth/signup')
      .send({
        email: `watchlist-${Date.now()}@test.com`,
        username: `watchlist${Date.now()}`,
        password: 'TestPass123!',
        firstName: 'Watch',
        lastName: 'List',
      });

    userId = signupResponse.body.user?.id || signupResponse.body.userId;

    // Mark user as verified
    await storage.updateUser(userId, { isVerified: true });

    const signinResponse = await request(app)
      .post('/api/auth/signin-jwt')
      .send({
        identifier: signupResponse.body.user?.email || `watchlist-${Date.now()}@test.com`,
        password: 'TestPass123!',
      });

    authToken = signinResponse.body.accessToken;
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  describe('POST /api/watchlists', () => {
    it('should create a watchlist when authenticated', async () => {
      const response = await request(app)
        .post('/api/watchlists')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Summer Movies',
          description: 'Movies to watch this summer',
          isPublic: true,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', 'Summer Movies');
      expect(response.body).toHaveProperty('isPublic', true);
      watchlistId = response.body.id;
    });

    it('should reject unauthenticated requests', async () => {
      await request(app)
        .post('/api/watchlists')
        .send({
          name: 'Test Watchlist',
        })
        .expect(401);
    });

    it('should validate required fields', async () => {
      await request(app)
        .post('/api/watchlists')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Missing name',
        })
        .expect(400);
    });
  });

  describe('GET /api/watchlists', () => {
    it('should get user watchlists when authenticated', async () => {
      const response = await request(app)
        .get('/api/watchlists')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should reject unauthenticated requests', async () => {
      await request(app)
        .get('/api/watchlists')
        .expect(401);
    });
  });

  describe('GET /api/watchlists/:id', () => {
    it('should get watchlist by ID', async () => {
      if (!watchlistId) {
        const createResponse = await request(app)
          .post('/api/watchlists')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'Test Watchlist',
          });
        watchlistId = createResponse.body.id;
      }

      const response = await request(app)
        .get(`/api/watchlists/${watchlistId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', watchlistId);
    });

    it('should return 404 for non-existent watchlist', async () => {
      await request(app)
        .get('/api/watchlists/nonexistent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('POST /api/watchlists/:id/items', () => {
    it('should add movie to watchlist', async () => {
      if (!watchlistId) {
        const createResponse = await request(app)
          .post('/api/watchlists')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'Test Watchlist',
          });
        watchlistId = createResponse.body.id;
      }

      const response = await request(app)
        .post(`/api/watchlists/${watchlistId}/items`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          mediaType: 'movie',
          mediaId: 550,
          notes: 'Must watch this classic!',
        })
        .expect(201);

      expect(response.body).toHaveProperty('mediaType', 'movie');
      expect(response.body).toHaveProperty('mediaId', 550);
    });

    it('should add TV show to watchlist', async () => {
      const response = await request(app)
        .post(`/api/watchlists/${watchlistId}/items`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          mediaType: 'tv',
          mediaId: 1396,
        })
        .expect(201);

      expect(response.body.mediaType).toBe('tv');
    });

    it('should validate media type', async () => {
      await request(app)
        .post(`/api/watchlists/${watchlistId}/items`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          mediaType: 'invalid',
          mediaId: 550,
        })
        .expect(400);
    });
  });

  describe('DELETE /api/watchlists/:id/items', () => {
    it('should remove item from watchlist', async () => {
      // First add an item
      await request(app)
        .post(`/api/watchlists/${watchlistId}/items`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          mediaType: 'movie',
          mediaId: 600,
        });

      // Then remove it
      await request(app)
        .delete(`/api/watchlists/${watchlistId}/items`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ mediaType: 'movie', mediaId: 600 })
        .expect(204);
    });
  });

  describe('DELETE /api/watchlists/:id', () => {
    it('should delete watchlist', async () => {
      // Create a new watchlist to delete
      const createResponse = await request(app)
        .post('/api/watchlists')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Watchlist to Delete',
        });

      const deleteId = createResponse.body.id;

      await request(app)
        .delete(`/api/watchlists/${deleteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);
    });
  });
});
