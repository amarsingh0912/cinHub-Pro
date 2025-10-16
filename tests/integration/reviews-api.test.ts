import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import { registerRoutes } from '../../server/routes';

describe('Reviews API', () => {
  let app: Express;
  let server: any;
  let authToken: string;
  let userId: string;
  let reviewId: string;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    server = await registerRoutes(app);

    // Sign up and get auth token
    const signupResponse = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'reviewer@example.com',
        username: 'reviewer',
        password: 'ReviewPass123!',
        firstName: 'Review',
        lastName: 'User',
      });

    userId = signupResponse.body.userId;

    const signinResponse = await request(app)
      .post('/api/auth/signin')
      .send({
        identifier: 'reviewer@example.com',
        password: 'ReviewPass123!',
      });

    authToken = signinResponse.body.accessToken;
  });

  afterAll(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  describe('POST /api/reviews', () => {
    it('should create a new review (authenticated)', async () => {
      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          mediaType: 'movie',
          mediaId: 550,
          rating: 9.0,
          content: 'Amazing movie! The plot twist is incredible.',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('userId', userId);
      expect(response.body).toHaveProperty('mediaType', 'movie');
      expect(response.body).toHaveProperty('mediaId', 550);
      expect(response.body).toHaveProperty('rating', 9.0);
      expect(response.body).toHaveProperty('content');

      reviewId = response.body.id;
    });

    it('should reject unauthenticated requests', async () => {
      await request(app)
        .post('/api/reviews')
        .send({
          mediaType: 'movie',
          mediaId: 550,
          rating: 8.0,
          content: 'Great movie!',
        })
        .expect(401);
    });

    it('should validate rating range (0-10)', async () => {
      await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          mediaType: 'movie',
          mediaId: 550,
          rating: 11,
          content: 'Invalid rating',
        })
        .expect(400);

      await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          mediaType: 'movie',
          mediaId: 550,
          rating: -1,
          content: 'Invalid rating',
        })
        .expect(400);
    });

    it('should require content', async () => {
      await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          mediaType: 'movie',
          mediaId: 550,
          rating: 8.0,
        })
        .expect(400);
    });

    it('should prevent duplicate reviews for same media', async () => {
      // First review
      await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          mediaType: 'movie',
          mediaId: 551,
          rating: 8.0,
          content: 'First review',
        })
        .expect(201);

      // Duplicate review
      await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          mediaType: 'movie',
          mediaId: 551,
          rating: 9.0,
          content: 'Duplicate review',
        })
        .expect(409);
    });

    it('should support both movies and TV shows', async () => {
      const movieReview = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          mediaType: 'movie',
          mediaId: 552,
          rating: 8.5,
          content: 'Great movie!',
        })
        .expect(201);

      const tvReview = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          mediaType: 'tv',
          mediaId: 1396,
          rating: 9.5,
          content: 'Amazing TV show!',
        })
        .expect(201);

      expect(movieReview.body.mediaType).toBe('movie');
      expect(tvReview.body.mediaType).toBe('tv');
    });
  });

  describe('GET /api/reviews/:type/:id', () => {
    beforeEach(async () => {
      // Create a review for testing
      await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          mediaType: 'movie',
          mediaId: 600,
          rating: 8.0,
          content: 'Test review for retrieval',
        });
    });

    it('should get all reviews for a movie', async () => {
      const response = await request(app)
        .get('/api/reviews/movie/600')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('mediaId', 600);
      expect(response.body[0]).toHaveProperty('rating');
      expect(response.body[0]).toHaveProperty('content');
      expect(response.body[0]).toHaveProperty('user');
    });

    it('should include user information in reviews', async () => {
      const response = await request(app)
        .get('/api/reviews/movie/600')
        .expect(200);

      expect(response.body[0].user).toHaveProperty('username');
      expect(response.body[0].user).toHaveProperty('displayName');
      expect(response.body[0].user).not.toHaveProperty('password');
      expect(response.body[0].user).not.toHaveProperty('email');
    });

    it('should return empty array for media with no reviews', async () => {
      const response = await request(app)
        .get('/api/reviews/movie/999999')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/reviews/movie/600')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeLessThanOrEqual(10);
    });

    it('should support sorting by rating', async () => {
      const response = await request(app)
        .get('/api/reviews/movie/600')
        .query({ sort_by: 'rating', order: 'desc' })
        .expect(200);

      const ratings = response.body.map((r: any) => r.rating);
      const sortedRatings = [...ratings].sort((a, b) => b - a);
      expect(ratings).toEqual(sortedRatings);
    });
  });

  describe('GET /api/reviews/user/:userId', () => {
    it('should get all reviews by a user', async () => {
      const response = await request(app)
        .get(`/api/reviews/user/${userId}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((review: any) => {
        expect(review.userId).toBe(userId);
      });
    });
  });

  describe('PUT /api/reviews/:id', () => {
    it('should update own review', async () => {
      const response = await request(app)
        .put(`/api/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rating: 9.5,
          content: 'Updated review content',
        })
        .expect(200);

      expect(response.body).toHaveProperty('rating', 9.5);
      expect(response.body).toHaveProperty('content', 'Updated review content');
    });

    it('should not update another user\'s review', async () => {
      // Create another user and get their token
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

      const otherToken = otherUserResponse.body.accessToken;

      await request(app)
        .put(`/api/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          rating: 1.0,
          content: 'Trying to update someone else\'s review',
        })
        .expect(403);
    });

    it('should validate updated rating', async () => {
      await request(app)
        .put(`/api/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rating: 15,
          content: 'Invalid rating',
        })
        .expect(400);
    });
  });

  describe('DELETE /api/reviews/:id', () => {
    let deleteReviewId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          mediaType: 'movie',
          mediaId: 700,
          rating: 7.0,
          content: 'Review to be deleted',
        });

      deleteReviewId = response.body.id;
    });

    it('should delete own review', async () => {
      await request(app)
        .delete(`/api/reviews/${deleteReviewId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Verify deletion
      const getResponse = await request(app)
        .get('/api/reviews/movie/700')
        .expect(200);

      const deletedReview = getResponse.body.find((r: any) => r.id === deleteReviewId);
      expect(deletedReview).toBeUndefined();
    });

    it('should not delete another user\'s review', async () => {
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
        .delete(`/api/reviews/${deleteReviewId}`)
        .set('Authorization', `Bearer ${deleterResponse.body.accessToken}`)
        .expect(403);
    });

    it('should return 404 for non-existent review', async () => {
      await request(app)
        .delete('/api/reviews/nonexistent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('GET /api/reviews/stats/:type/:id', () => {
    beforeEach(async () => {
      // Create multiple reviews for statistics
      await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          mediaType: 'movie',
          mediaId: 800,
          rating: 8.0,
          content: 'Good movie',
        });
    });

    it('should return review statistics', async () => {
      const response = await request(app)
        .get('/api/reviews/stats/movie/800')
        .expect(200);

      expect(response.body).toHaveProperty('averageRating');
      expect(response.body).toHaveProperty('totalReviews');
      expect(response.body).toHaveProperty('ratingDistribution');
    });

    it('should calculate correct average rating', async () => {
      const response = await request(app)
        .get('/api/reviews/stats/movie/800')
        .expect(200);

      expect(response.body.averageRating).toBeGreaterThan(0);
      expect(response.body.averageRating).toBeLessThanOrEqual(10);
    });
  });

  describe('Validation & Error Handling', () => {
    it('should reject review with empty content', async () => {
      await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          mediaType: 'movie',
          mediaId: 900,
          rating: 8.0,
          content: '',
        })
        .expect(400);
    });

    it('should reject review with content too long', async () => {
      const longContent = 'a'.repeat(5001);
      
      await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          mediaType: 'movie',
          mediaId: 900,
          rating: 8.0,
          content: longContent,
        })
        .expect(400);
    });

    it('should reject invalid media type', async () => {
      await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          mediaType: 'invalid',
          mediaId: 900,
          rating: 8.0,
          content: 'Test review',
        })
        .expect(400);
    });
  });
});
