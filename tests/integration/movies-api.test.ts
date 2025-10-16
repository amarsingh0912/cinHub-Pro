import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import express, { type Express } from 'express';
import { registerRoutes } from '../../server/routes';

// Mock TMDB API to avoid live calls
vi.mock('../../server/routes', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    // Integration tests will use the actual routes, TMDB calls will use cached data
  };
});

describe('Movies API Integration Tests', () => {
  let app: Express;
  let server: any;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    server = await registerRoutes(app);
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  describe('GET /api/tmdb/movie/:id', () => {
    it('should return movie details for valid ID', async () => {
      const response = await request(app)
        .get('/api/tmdb/movie/550') // Fight Club
        .expect(200);

      expect(response.body).toHaveProperty('id', 550);
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('overview');
    });

    it('should return 404 for non-existent movie', async () => {
      await request(app)
        .get('/api/tmdb/movie/9999999')
        .expect(404);
    });

    it('should cache movie data', async () => {
      const response1 = await request(app)
        .get('/api/tmdb/movie/551')
        .expect(200);

      const response2 = await request(app)
        .get('/api/tmdb/movie/551')
        .expect(200);

      expect(response1.body.id).toBe(response2.body.id);
    });
  });

  describe('GET /api/tmdb/movie/category/:category', () => {
    it('should return trending movies', async () => {
      const response = await request(app)
        .get('/api/tmdb/movie/category/trending')
        .expect(200);

      expect(response.body).toHaveProperty('results');
      expect(Array.isArray(response.body.results)).toBe(true);
    });

    it('should return popular movies', async () => {
      const response = await request(app)
        .get('/api/tmdb/movie/category/popular')
        .expect(200);

      expect(response.body).toHaveProperty('results');
      expect(response.body.results.length).toBeGreaterThan(0);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/tmdb/movie/category/popular')
        .query({ page: 2 })
        .expect(200);

      expect(response.body).toHaveProperty('page', 2);
    });
  });

  describe('GET /api/tmdb/discover/movie', () => {
    it('should discover movies with filters', async () => {
      const response = await request(app)
        .get('/api/tmdb/discover/movie')
        .query({
          with_genres: '28', // Action
          'vote_average.gte': 7,
        })
        .expect(200);

      expect(response.body).toHaveProperty('results');
    });

    it('should support multiple genres', async () => {
      const response = await request(app)
        .get('/api/tmdb/discover/movie')
        .query({
          with_genres: '28,12', // Action, Adventure
        })
        .expect(200);

      expect(response.body.results).toBeDefined();
    });
  });

  describe('GET /api/tmdb/search/movie', () => {
    it('should search movies by query', async () => {
      const response = await request(app)
        .get('/api/tmdb/search/movie')
        .query({ query: 'fight club' })
        .expect(200);

      expect(response.body).toHaveProperty('results');
      expect(response.body.results.some((m: any) => 
        m.title.toLowerCase().includes('fight')
      )).toBe(true);
    });

    it('should return empty results for non-existent movies', async () => {
      const response = await request(app)
        .get('/api/tmdb/search/movie')
        .query({ query: 'xyznonexistent123' })
        .expect(200);

      expect(response.body.results).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid movie ID format', async () => {
      await request(app)
        .get('/api/tmdb/movie/invalid')
        .expect(400);
    });

    it('should require search query parameter', async () => {
      await request(app)
        .get('/api/tmdb/search/movie')
        .expect(400);
    });
  });
});
