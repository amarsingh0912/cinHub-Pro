import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express, { type Express } from 'express';
import { registerRoutes } from '../../server/routes';
import { storage } from '../../server/storage';

describe('Reviews API Integration Tests', () => {
  let app: Express;
  let server: any;
  let authToken: string;
  let userId: string;
  let reviewId: string;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    server = await registerRoutes(app);

    // Create test user and get auth token
    const signupResponse = await request(app)
      .post('/api/auth/signup')
      .send({
        email: `reviewer-${Date.now()}@test.com`,
        username: `reviewer${Date.now()}`,
        password: 'TestPass123!',
        firstName: 'Test',
        lastName: 'Reviewer',
      });

    userId = signupResponse.body.user?.id || signupResponse.body.userId;
    
    // Mark user as verified
    await storage.updateUser(userId, { isVerified: true });

    const signinResponse = await request(app)
      .post('/api/auth/signin-jwt')
      .send({
        identifier: signupResponse.body.user?.email || `reviewer-${Date.now()}@test.com`,
        password: 'TestPass123!',
      });

    authToken = signinResponse.body.accessToken;
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  describe('POST /api/reviews', () => {
    it('should create a review when authenticated', async () => {
      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          mediaType: 'movie',
          mediaId: 550,
          rating: 9,
          content: 'Amazing movie with great plot twist!',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('rating', 9);
      expect(response.body).toHaveProperty('content');
      reviewId = response.body.id;
    });

    it('should reject unauthenticated requests', async () => {
      await request(app)
        .post('/api/reviews')
        .send({
          mediaType: 'movie',
          mediaId: 550,
          rating: 8,
          content: 'Test review',
        })
        .expect(401);
    });

    it('should validate rating range', async () => {
      await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          mediaType: 'movie',
          mediaId: 551,
          rating: 11, // Invalid
          content: 'Test',
        })
        .expect(400);
    });

    it('should require content', async () => {
      await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          mediaType: 'movie',
          mediaId: 552,
          rating: 8,
        })
        .expect(400);
    });
  });

  describe('GET /api/reviews/:type/:id', () => {
    it('should get reviews for a movie', async () => {
      const response = await request(app)
        .get('/api/reviews/movie/550')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return empty array for media with no reviews', async () => {
      const response = await request(app)
        .get('/api/reviews/movie/999999')
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('PUT /api/reviews/:id', () => {
    it('should update own review', async () => {
      if (!reviewId) {
        // Create a review first
        const createResponse = await request(app)
          .post('/api/reviews')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            mediaType: 'movie',
            mediaId: 600,
            rating: 8,
            content: 'Original content',
          });
        reviewId = createResponse.body.id;
      }

      const response = await request(app)
        .put(`/api/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rating: 9,
          content: 'Updated content',
        })
        .expect(200);

      expect(response.body.rating).toBe(9);
      expect(response.body.content).toBe('Updated content');
    });
  });

  describe('DELETE /api/reviews/:id', () => {
    it('should delete own review', async () => {
      // Create a review to delete
      const createResponse = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          mediaType: 'movie',
          mediaId: 700,
          rating: 7,
          content: 'To be deleted',
        });

      const deleteReviewId = createResponse.body.id;

      await request(app)
        .delete(`/api/reviews/${deleteReviewId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);
    });
  });
});
