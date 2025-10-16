import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import { registerRoutes } from '../../server/routes';

describe('Watchlists API', () => {
  let app: Express;
  let server: any;
  let authToken: string;
  let userId: string;
  let watchlistId: string;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    server = await registerRoutes(app);

    // Sign up and get auth token
    const signupResponse = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'watchlist@example.com',
        username: 'watchlist_user',
        password: 'WatchPass123!',
        firstName: 'Watch',
        lastName: 'List',
      });

    userId = signupResponse.body.userId;

    const signinResponse = await request(app)
      .post('/api/auth/signin')
      .send({
        identifier: 'watchlist@example.com',
        password: 'WatchPass123!',
      });

    authToken = signinResponse.body.accessToken;
  });

  afterAll(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  describe('POST /api/watchlists', () => {
    it('should create a new watchlist (authenticated)', async () => {
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
      expect(response.body).toHaveProperty('userId', userId);
      expect(response.body).toHaveProperty('name', 'Summer Movies');
      expect(response.body).toHaveProperty('description');
      expect(response.body).toHaveProperty('isPublic', true);

      watchlistId = response.body.id;
    });

    it('should reject unauthenticated requests', async () => {
      await request(app)
        .post('/api/watchlists')
        .send({
          name: 'Test Watchlist',
          description: 'Test',
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

    it('should create private watchlist by default', async () => {
      const response = await request(app)
        .post('/api/watchlists')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Private Watchlist',
          description: 'This is private',
        })
        .expect(201);

      expect(response.body.isPublic).toBe(false);
    });
  });

  describe('GET /api/watchlists', () => {
    it('should get all watchlists for authenticated user', async () => {
      const response = await request(app)
        .get('/api/watchlists')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      response.body.forEach((watchlist: any) => {
        expect(watchlist.userId).toBe(userId);
      });
    });

    it('should include item count in watchlists', async () => {
      const response = await request(app)
        .get('/api/watchlists')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      response.body.forEach((watchlist: any) => {
        expect(watchlist).toHaveProperty('itemCount');
      });
    });

    it('should reject unauthenticated requests', async () => {
      await request(app)
        .get('/api/watchlists')
        .expect(401);
    });
  });

  describe('GET /api/watchlists/:id', () => {
    it('should get watchlist by ID', async () => {
      const response = await request(app)
        .get(`/api/watchlists/${watchlistId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', watchlistId);
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('items');
    });

    it('should include watchlist items', async () => {
      const response = await request(app)
        .get(`/api/watchlists/${watchlistId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body.items)).toBe(true);
    });

    it('should return 404 for non-existent watchlist', async () => {
      await request(app)
        .get('/api/watchlists/nonexistent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should not access other user\'s private watchlist', async () => {
      // Create another user
      await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'other@example.com',
          username: 'otheruser',
          password: 'OtherPass123!',
        });

      const otherUserResponse = await request(app)
        .post('/api/auth/signin')
        .send({
          identifier: 'other@example.com',
          password: 'OtherPass123!',
        });

      await request(app)
        .get(`/api/watchlists/${watchlistId}`)
        .set('Authorization', `Bearer ${otherUserResponse.body.accessToken}`)
        .expect(403);
    });
  });

  describe('PUT /api/watchlists/:id', () => {
    it('should update watchlist', async () => {
      const response = await request(app)
        .put(`/api/watchlists/${watchlistId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Summer Movies',
          description: 'Updated description',
          isPublic: false,
        })
        .expect(200);

      expect(response.body.name).toBe('Updated Summer Movies');
      expect(response.body.description).toBe('Updated description');
      expect(response.body.isPublic).toBe(false);
    });

    it('should not update other user\'s watchlist', async () => {
      // Create and login as another user
      await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'updater@example.com',
          username: 'updater',
          password: 'UpdaterPass123!',
        });

      const updaterResponse = await request(app)
        .post('/api/auth/signin')
        .send({
          identifier: 'updater@example.com',
          password: 'UpdaterPass123!',
        });

      await request(app)
        .put(`/api/watchlists/${watchlistId}`)
        .set('Authorization', `Bearer ${updaterResponse.body.accessToken}`)
        .send({
          name: 'Hacked Watchlist',
        })
        .expect(403);
    });
  });

  describe('POST /api/watchlists/:id/items', () => {
    it('should add movie to watchlist', async () => {
      const response = await request(app)
        .post(`/api/watchlists/${watchlistId}/items`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          mediaType: 'movie',
          mediaId: 550,
          notes: 'Must watch this classic!',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('watchlistId', watchlistId);
      expect(response.body).toHaveProperty('mediaType', 'movie');
      expect(response.body).toHaveProperty('mediaId', 550);
      expect(response.body).toHaveProperty('notes');
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
      expect(response.body.mediaId).toBe(1396);
    });

    it('should prevent duplicate items', async () => {
      // Add item first time
      await request(app)
        .post(`/api/watchlists/${watchlistId}/items`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          mediaType: 'movie',
          mediaId: 551,
        })
        .expect(201);

      // Try to add same item again
      await request(app)
        .post(`/api/watchlists/${watchlistId}/items`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          mediaType: 'movie',
          mediaId: 551,
        })
        .expect(409);
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

  describe('GET /api/watchlists/:id/items', () => {
    it('should get all items in watchlist', async () => {
      const response = await request(app)
        .get(`/api/watchlists/${watchlistId}/items`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should include media details with items', async () => {
      const response = await request(app)
        .get(`/api/watchlists/${watchlistId}/items`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      response.body.forEach((item: any) => {
        expect(item).toHaveProperty('mediaType');
        expect(item).toHaveProperty('mediaId');
        if (item.mediaDetails) {
          expect(item.mediaDetails).toHaveProperty('title');
        }
      });
    });
  });

  describe('DELETE /api/watchlists/:id/items/:itemId', () => {
    let itemId: string;

    beforeAll(async () => {
      const response = await request(app)
        .post(`/api/watchlists/${watchlistId}/items`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          mediaType: 'movie',
          mediaId: 600,
        });

      itemId = response.body.id;
    });

    it('should remove item from watchlist', async () => {
      await request(app)
        .delete(`/api/watchlists/${watchlistId}/items/${itemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Verify removal
      const response = await request(app)
        .get(`/api/watchlists/${watchlistId}/items`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const removedItem = response.body.find((item: any) => item.id === itemId);
      expect(removedItem).toBeUndefined();
    });

    it('should return 404 for non-existent item', async () => {
      await request(app)
        .delete(`/api/watchlists/${watchlistId}/items/nonexistent`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('DELETE /api/watchlists/:id', () => {
    it('should delete watchlist and all items', async () => {
      // Create a new watchlist to delete
      const createResponse = await request(app)
        .post('/api/watchlists')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Watchlist to Delete',
          description: 'Will be deleted',
        });

      const deleteId = createResponse.body.id;

      // Add an item
      await request(app)
        .post(`/api/watchlists/${deleteId}/items`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          mediaType: 'movie',
          mediaId: 700,
        });

      // Delete watchlist
      await request(app)
        .delete(`/api/watchlists/${deleteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Verify deletion
      await request(app)
        .get(`/api/watchlists/${deleteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should not delete other user\'s watchlist', async () => {
      // Create another user
      await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'deleter@example.com',
          username: 'deleter',
          password: 'DeleterPass123!',
        });

      const deleterResponse = await request(app)
        .post('/api/auth/signin')
        .send({
          identifier: 'deleter@example.com',
          password: 'DeleterPass123!',
        });

      await request(app)
        .delete(`/api/watchlists/${watchlistId}`)
        .set('Authorization', `Bearer ${deleterResponse.body.accessToken}`)
        .expect(403);
    });
  });

  describe('Public Watchlists', () => {
    let publicWatchlistId: string;

    beforeAll(async () => {
      const response = await request(app)
        .post('/api/watchlists')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Public Movie Collection',
          description: 'Everyone can see this',
          isPublic: true,
        });

      publicWatchlistId = response.body.id;
    });

    it('should allow anyone to view public watchlist', async () => {
      const response = await request(app)
        .get(`/api/watchlists/public/${publicWatchlistId}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', publicWatchlistId);
      expect(response.body.isPublic).toBe(true);
    });

    it('should not allow modification of public watchlist by others', async () => {
      // Create another user
      await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'viewer@example.com',
          username: 'viewer',
          password: 'ViewerPass123!',
        });

      const viewerResponse = await request(app)
        .post('/api/auth/signin')
        .send({
          identifier: 'viewer@example.com',
          password: 'ViewerPass123!',
        });

      await request(app)
        .put(`/api/watchlists/${publicWatchlistId}`)
        .set('Authorization', `Bearer ${viewerResponse.body.accessToken}`)
        .send({
          name: 'Hacked Public Watchlist',
        })
        .expect(403);
    });
  });
});
