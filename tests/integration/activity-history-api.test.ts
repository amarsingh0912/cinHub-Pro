import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
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

describe('Activity & History API', () => {
  let app: Express;
  let server: any;
  let authToken: string;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    server = await registerRoutes(app);

    // Create and sign in user
    await request(app)
      .post('/api/auth/signup')
      .set('X-CSRF-Token', 'test')
      .send({
        email: 'activity@test.com',
        username: 'activityuser',
        password: 'TestPassword123!',
        firstName: 'Activity',
        lastName: 'User'
      });

    const signinResponse = await request(app)
      .post('/api/auth/signin-jwt')
      .set('X-CSRF-Token', 'test')
      .send({
        identifier: 'activity@test.com',
        password: 'TestPassword123!'
      });

    authToken = signinResponse.body.accessToken;
  });

  afterAll(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  describe('Viewing History API', () => {
    describe('GET /api/viewing-history', () => {
      it('should return viewing history for authenticated user', async () => {
        const response = await request(app)
          .get('/api/viewing-history')
          .set('Authorization', `Bearer ${authToken}`)
          .set('X-CSRF-Token', 'test')
          .expect(200);

        expect(response.body).toHaveProperty('history');
        expect(Array.isArray(response.body.history)).toBe(true);
      });

      it('should reject unauthenticated requests', async () => {
        await request(app)
          .get('/api/viewing-history')
          .set('X-CSRF-Token', 'test')
          .expect(401);
      });

      it('should support pagination', async () => {
        const response = await request(app)
          .get('/api/viewing-history?page=1&limit=10')
          .set('Authorization', `Bearer ${authToken}`)
          .set('X-CSRF-Token', 'test')
          .expect(200);

        expect(response.body.history.length).toBeLessThanOrEqual(10);
      });

      it('should support filtering by media type', async () => {
        const response = await request(app)
          .get('/api/viewing-history?mediaType=movie')
          .set('Authorization', `Bearer ${authToken}`)
          .set('X-CSRF-Token', 'test')
          .expect(200);

        expect(response.body).toHaveProperty('history');
        expect(Array.isArray(response.body.history)).toBe(true);
      });
    });

    describe('POST /api/viewing-history', () => {
      it('should add item to viewing history', async () => {
        const historyItem = {
          mediaType: 'movie',
          mediaId: 550,
          title: 'Fight Club',
          watchedAt: new Date().toISOString()
        };

        const response = await request(app)
          .post('/api/viewing-history')
          .set('Authorization', `Bearer ${authToken}`)
          .set('X-CSRF-Token', 'test')
          .send(historyItem)
          .expect(201);

        expect(response.body).toHaveProperty('message');
        expect(response.body).toHaveProperty('history');
      });

      it('should validate history data', async () => {
        const invalidHistory = {
          mediaType: 'invalid',
          mediaId: 'not-a-number'
        };

        await request(app)
          .post('/api/viewing-history')
          .set('Authorization', `Bearer ${authToken}`)
          .set('X-CSRF-Token', 'test')
          .send(invalidHistory)
          .expect(400);
      });

      it('should reject unauthenticated requests', async () => {
        await request(app)
          .post('/api/viewing-history')
          .set('X-CSRF-Token', 'test')
          .send({ mediaType: 'movie', mediaId: 550 })
          .expect(401);
      });

      it('should handle duplicate entries', async () => {
        const historyItem = {
          mediaType: 'movie',
          mediaId: 551,
          title: 'The Matrix'
        };

        // Add first time
        await request(app)
          .post('/api/viewing-history')
          .set('Authorization', `Bearer ${authToken}`)
          .set('X-CSRF-Token', 'test')
          .send(historyItem)
          .expect(201);

        // Add again - should update timestamp
        const response = await request(app)
          .post('/api/viewing-history')
          .set('Authorization', `Bearer ${authToken}`)
          .set('X-CSRF-Token', 'test')
          .send(historyItem);

        expect([200, 201]).toContain(response.status);
      });
    });

    describe('DELETE /api/viewing-history/:mediaType/:mediaId', () => {
      it('should remove item from viewing history', async () => {
        // First add an item
        await request(app)
          .post('/api/viewing-history')
          .set('Authorization', `Bearer ${authToken}`)
          .set('X-CSRF-Token', 'test')
          .send({ mediaType: 'movie', mediaId: 552, title: 'Inception' });

        // Then remove it
        const response = await request(app)
          .delete('/api/viewing-history/movie/552')
          .set('Authorization', `Bearer ${authToken}`)
          .set('X-CSRF-Token', 'test')
          .expect(200);

        expect(response.body).toHaveProperty('message');
      });

      it('should return 404 for non-existent item', async () => {
        await request(app)
          .delete('/api/viewing-history/movie/99999')
          .set('Authorization', `Bearer ${authToken}`)
          .set('X-CSRF-Token', 'test')
          .expect(404);
      });
    });

    describe('DELETE /api/viewing-history', () => {
      it('should clear all viewing history', async () => {
        const response = await request(app)
          .delete('/api/viewing-history')
          .set('Authorization', `Bearer ${authToken}`)
          .set('X-CSRF-Token', 'test')
          .expect(200);

        expect(response.body).toHaveProperty('message');
      });
    });
  });

  describe('Activity History API', () => {
    describe('GET /api/activity-history', () => {
      it('should return activity history', async () => {
        const response = await request(app)
          .get('/api/activity-history')
          .set('Authorization', `Bearer ${authToken}`)
          .set('X-CSRF-Token', 'test')
          .expect(200);

        expect(response.body).toHaveProperty('activities');
        expect(Array.isArray(response.body.activities)).toBe(true);
      });

      it('should support pagination', async () => {
        const response = await request(app)
          .get('/api/activity-history?page=1&limit=20')
          .set('Authorization', `Bearer ${authToken}`)
          .set('X-CSRF-Token', 'test')
          .expect(200);

        expect(response.body.activities.length).toBeLessThanOrEqual(20);
      });

      it('should support filtering by activity type', async () => {
        const response = await request(app)
          .get('/api/activity-history?activityType=favorite')
          .set('Authorization', `Bearer ${authToken}`)
          .set('X-CSRF-Token', 'test')
          .expect(200);

        expect(response.body).toHaveProperty('activities');
      });
    });

    describe('POST /api/activity-history', () => {
      it('should add activity entry', async () => {
        const activity = {
          activityType: 'favorite',
          mediaType: 'movie',
          mediaId: 550,
          title: 'Fight Club',
          description: 'Added to favorites'
        };

        const response = await request(app)
          .post('/api/activity-history')
          .set('Authorization', `Bearer ${authToken}`)
          .set('X-CSRF-Token', 'test')
          .send(activity)
          .expect(201);

        expect(response.body).toHaveProperty('message');
        expect(response.body).toHaveProperty('activity');
      });

      it('should validate activity data', async () => {
        const invalidActivity = {
          activityType: 'invalid-type',
          mediaId: 'not-a-number'
        };

        await request(app)
          .post('/api/activity-history')
          .set('Authorization', `Bearer ${authToken}`)
          .set('X-CSRF-Token', 'test')
          .send(invalidActivity)
          .expect(400);
      });
    });

    describe('DELETE /api/activity-history', () => {
      it('should clear activity history', async () => {
        const response = await request(app)
          .delete('/api/activity-history')
          .set('Authorization', `Bearer ${authToken}`)
          .set('X-CSRF-Token', 'test')
          .expect(200);

        expect(response.body).toHaveProperty('message');
      });
    });
  });

  describe('Search History API', () => {
    describe('GET /api/search-history', () => {
      it('should return search history', async () => {
        const response = await request(app)
          .get('/api/search-history')
          .set('Authorization', `Bearer ${authToken}`)
          .set('X-CSRF-Token', 'test')
          .expect(200);

        expect(response.body).toHaveProperty('searches');
        expect(Array.isArray(response.body.searches)).toBe(true);
      });

      it('should support limit parameter', async () => {
        const response = await request(app)
          .get('/api/search-history?limit=5')
          .set('Authorization', `Bearer ${authToken}`)
          .set('X-CSRF-Token', 'test')
          .expect(200);

        expect(response.body.searches.length).toBeLessThanOrEqual(5);
      });
    });

    describe('POST /api/search-history', () => {
      it('should add search query to history', async () => {
        const searchData = {
          query: 'fight club',
          filters: {
            type: 'movie',
            year: 1999
          }
        };

        const response = await request(app)
          .post('/api/search-history')
          .set('Authorization', `Bearer ${authToken}`)
          .set('X-CSRF-Token', 'test')
          .send(searchData)
          .expect(201);

        expect(response.body).toHaveProperty('message');
        expect(response.body).toHaveProperty('search');
      });

      it('should validate search data', async () => {
        const invalidSearch = {
          query: '' // Empty query
        };

        await request(app)
          .post('/api/search-history')
          .set('Authorization', `Bearer ${authToken}`)
          .set('X-CSRF-Token', 'test')
          .send(invalidSearch)
          .expect(400);
      });

      it('should store complex search filters', async () => {
        const searchData = {
          query: 'action movies',
          filters: {
            type: 'movie',
            genres: [28, 12],
            yearFrom: 2010,
            yearTo: 2020,
            rating: 7.5
          }
        };

        const response = await request(app)
          .post('/api/search-history')
          .set('Authorization', `Bearer ${authToken}`)
          .set('X-CSRF-Token', 'test')
          .send(searchData)
          .expect(201);

        expect(response.body.search).toHaveProperty('query', 'action movies');
        expect(response.body.search).toHaveProperty('filters');
      });
    });

    describe('DELETE /api/search-history', () => {
      it('should clear search history', async () => {
        const response = await request(app)
          .delete('/api/search-history')
          .set('Authorization', `Bearer ${authToken}`)
          .set('X-CSRF-Token', 'test')
          .expect(200);

        expect(response.body).toHaveProperty('message');
      });

      it('should verify history is cleared', async () => {
        // Clear history
        await request(app)
          .delete('/api/search-history')
          .set('Authorization', `Bearer ${authToken}`)
          .set('X-CSRF-Token', 'test');

        // Verify it's empty
        const response = await request(app)
          .get('/api/search-history')
          .set('Authorization', `Bearer ${authToken}`)
          .set('X-CSRF-Token', 'test')
          .expect(200);

        expect(response.body.searches.length).toBe(0);
      });
    });
  });
});
