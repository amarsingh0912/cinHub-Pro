import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import { registerRoutes } from '../../server/routes';

describe('User Collections API', () => {
  let app: Express;
  let server: any;
  let accessToken: string;
  let userId: string;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    server = await registerRoutes(app);

    // Create test user and get token
    const signupResponse = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'collections@example.com',
        username: 'collectionsuser',
        password: 'TestPassword123!',
        firstName: 'Collections',
        lastName: 'User'
      });

    userId = signupResponse.body.userId;

    const signinResponse = await request(app)
      .post('/api/auth/signin')
      .send({
        identifier: 'collectionsuser',
        password: 'TestPassword123!'
      });

    accessToken = signinResponse.body.accessToken;
  });

  afterAll(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  describe('Favorites API', () => {
    const testMovie = {
      mediaType: 'movie',
      mediaId: 550,
      mediaTitle: 'Fight Club',
      mediaPosterPath: '/path.jpg',
      mediaReleaseDate: '1999-10-15'
    };

    describe('POST /api/favorites', () => {
      it('should add movie to favorites', async () => {
        const response = await request(app)
          .post('/api/favorites')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(testMovie)
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.mediaId).toBe(testMovie.mediaId);
      });

      it('should require authentication', async () => {
        await request(app)
          .post('/api/favorites')
          .send(testMovie)
          .expect(401);
      });

      it('should reject duplicate favorites', async () => {
        await request(app)
          .post('/api/favorites')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(testMovie)
          .expect(409);
      });
    });

    describe('GET /api/favorites', () => {
      it('should return user favorites', async () => {
        const response = await request(app)
          .get('/api/favorites')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
      });

      it('should require authentication', async () => {
        await request(app)
          .get('/api/favorites')
          .expect(401);
      });
    });

    describe('GET /api/favorites/:type/:id/check', () => {
      it('should check if movie is favorited', async () => {
        const response = await request(app)
          .get('/api/favorites/movie/550/check')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('isFavorite');
        expect(response.body.isFavorite).toBe(true);
      });

      it('should return false for non-favorited item', async () => {
        const response = await request(app)
          .get('/api/favorites/movie/999999/check')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(response.body.isFavorite).toBe(false);
      });
    });

    describe('DELETE /api/favorites/:type/:id', () => {
      it('should remove from favorites', async () => {
        await request(app)
          .delete('/api/favorites/movie/550')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        // Verify it's removed
        const checkResponse = await request(app)
          .get('/api/favorites/movie/550/check')
          .set('Authorization', `Bearer ${accessToken}`);

        expect(checkResponse.body.isFavorite).toBe(false);
      });

      it('should require authentication', async () => {
        await request(app)
          .delete('/api/favorites/movie/550')
          .expect(401);
      });
    });
  });

  describe('Watchlists API', () => {
    let watchlistId: string;

    describe('POST /api/watchlists', () => {
      it('should create a watchlist', async () => {
        const response = await request(app)
          .post('/api/watchlists')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            name: 'Watch Later',
            description: 'Movies to watch this weekend',
            isPublic: false
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.name).toBe('Watch Later');
        watchlistId = response.body.id;
      });

      it('should require authentication', async () => {
        await request(app)
          .post('/api/watchlists')
          .send({ name: 'Test' })
          .expect(401);
      });

      it('should reject invalid data', async () => {
        await request(app)
          .post('/api/watchlists')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({}) // Missing required field
          .expect(400);
      });
    });

    describe('GET /api/watchlists', () => {
      it('should return user watchlists', async () => {
        const response = await request(app)
          .get('/api/watchlists')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
      });

      it('should require authentication', async () => {
        await request(app)
          .get('/api/watchlists')
          .expect(401);
      });
    });

    describe('GET /api/watchlists/:id', () => {
      it('should return watchlist details', async () => {
        const response = await request(app)
          .get(`/api/watchlists/${watchlistId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('id', watchlistId);
        expect(response.body).toHaveProperty('name');
        expect(response.body).toHaveProperty('items');
      });

      it('should return 404 for non-existent watchlist', async () => {
        await request(app)
          .get('/api/watchlists/non-existent-id')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(404);
      });
    });

    describe('POST /api/watchlists/:id/items', () => {
      it('should add item to watchlist', async () => {
        const response = await request(app)
          .post(`/api/watchlists/${watchlistId}/items`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            mediaType: 'movie',
            mediaId: 550,
            mediaTitle: 'Fight Club',
            mediaPosterPath: '/path.jpg',
            mediaReleaseDate: '1999-10-15'
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.mediaId).toBe(550);
      });

      it('should reject duplicate items', async () => {
        await request(app)
          .post(`/api/watchlists/${watchlistId}/items`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            mediaType: 'movie',
            mediaId: 550,
            mediaTitle: 'Fight Club',
            mediaPosterPath: '/path.jpg',
            mediaReleaseDate: '1999-10-15'
          })
          .expect(409);
      });
    });

    describe('DELETE /api/watchlists/:watchlistId/items/:itemId', () => {
      it('should remove item from watchlist', async () => {
        // Get watchlist to find item ID
        const watchlist = await request(app)
          .get(`/api/watchlists/${watchlistId}`)
          .set('Authorization', `Bearer ${accessToken}`);

        const itemId = watchlist.body.items[0].id;

        await request(app)
          .delete(`/api/watchlists/${watchlistId}/items/${itemId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);
      });
    });

    describe('PUT /api/watchlists/:id', () => {
      it('should update watchlist', async () => {
        const response = await request(app)
          .put(`/api/watchlists/${watchlistId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            name: 'Updated Name',
            description: 'Updated description'
          })
          .expect(200);

        expect(response.body.name).toBe('Updated Name');
      });
    });

    describe('DELETE /api/watchlists/:id', () => {
      it('should delete watchlist', async () => {
        await request(app)
          .delete(`/api/watchlists/${watchlistId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        // Verify deletion
        await request(app)
          .get(`/api/watchlists/${watchlistId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(404);
      });
    });
  });

  describe('Reviews API', () => {
    const testReview = {
      mediaType: 'movie',
      mediaId: 550,
      rating: 9,
      review: 'Excellent movie with great plot twists!',
      isPublic: true
    };

    describe('POST /api/reviews', () => {
      it('should create a review', async () => {
        const response = await request(app)
          .post('/api/reviews')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(testReview)
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.rating).toBe(testReview.rating);
      });

      it('should require authentication', async () => {
        await request(app)
          .post('/api/reviews')
          .send(testReview)
          .expect(401);
      });

      it('should validate rating range', async () => {
        await request(app)
          .post('/api/reviews')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ ...testReview, rating: 11, mediaId: 551 })
          .expect(400);
      });
    });

    describe('GET /api/reviews/:type/:id', () => {
      it('should return reviews for media', async () => {
        const response = await request(app)
          .get('/api/reviews/movie/550')
          .expect(200);

        expect(Array.isArray(response.body) || typeof response.body === 'object').toBe(true);
      });

      it('should not require authentication for public reviews', async () => {
        const response = await request(app)
          .get('/api/reviews/movie/550')
          .expect(200);

        expect(response.body).toBeDefined();
      });
    });

    describe('PUT /api/reviews/:id', () => {
      let reviewId: string;

      beforeEach(async () => {
        const response = await request(app)
          .post('/api/reviews')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ ...testReview, mediaId: 552 });

        reviewId = response.body.id;
      });

      it('should update review', async () => {
        const response = await request(app)
          .put(`/api/reviews/${reviewId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            rating: 10,
            review: 'Updated review text'
          })
          .expect(200);

        expect(response.body.rating).toBe(10);
        expect(response.body.review).toBe('Updated review text');
      });

      it('should require authentication', async () => {
        await request(app)
          .put(`/api/reviews/${reviewId}`)
          .send({ rating: 10 })
          .expect(401);
      });
    });

    describe('DELETE /api/reviews/:id', () => {
      let reviewId: string;

      beforeEach(async () => {
        const response = await request(app)
          .post('/api/reviews')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ ...testReview, mediaId: 553 });

        reviewId = response.body.id;
      });

      it('should delete review', async () => {
        await request(app)
          .delete(`/api/reviews/${reviewId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);
      });

      it('should require authentication', async () => {
        await request(app)
          .delete(`/api/reviews/${reviewId}`)
          .expect(401);
      });
    });
  });
});
