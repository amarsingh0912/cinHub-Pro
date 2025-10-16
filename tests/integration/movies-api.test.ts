import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import { registerRoutes } from '../../server/routes';

describe('Movies API', () => {
  let app: Express;
  let server: any;
  let authToken: string;
  let adminToken: string;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    server = await registerRoutes(app);

    // Get regular user token
    const userResponse = await request(app)
      .post('/api/auth/signin')
      .send({
        identifier: 'test@example.com',
        password: 'testPassword123',
      });
    authToken = userResponse.body.accessToken;

    // Get admin user token
    const adminResponse = await request(app)
      .post('/api/auth/signin')
      .send({
        identifier: 'admin@cinehub.com',
        password: 'admin123',
      });
    adminToken = adminResponse.body.accessToken;
  });

  afterAll(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  describe('GET /api/movies/trending', () => {
    it('should return trending movies', async () => {
      const response = await request(app)
        .get('/api/movies/trending')
        .query({ page: 1 })
        .expect(200);

      expect(response.body).toHaveProperty('results');
      expect(Array.isArray(response.body.results)).toBe(true);
      expect(response.body.results.length).toBeGreaterThan(0);
      expect(response.body).toHaveProperty('page', 1);
      expect(response.body).toHaveProperty('total_pages');
    });

    it('should support pagination', async () => {
      const page1 = await request(app)
        .get('/api/movies/trending')
        .query({ page: 1 });

      const page2 = await request(app)
        .get('/api/movies/trending')
        .query({ page: 2 });

      expect(page1.body.page).toBe(1);
      expect(page2.body.page).toBe(2);
      expect(page1.body.results[0].id).not.toBe(page2.body.results[0].id);
    });

    it('should support time_window parameter', async () => {
      const dayResponse = await request(app)
        .get('/api/movies/trending')
        .query({ time_window: 'day' })
        .expect(200);

      const weekResponse = await request(app)
        .get('/api/movies/trending')
        .query({ time_window: 'week' })
        .expect(200);

      expect(dayResponse.body.results).toBeTruthy();
      expect(weekResponse.body.results).toBeTruthy();
    });
  });

  describe('GET /api/movies/popular', () => {
    it('should return popular movies', async () => {
      const response = await request(app)
        .get('/api/movies/popular')
        .expect(200);

      expect(response.body.results).toBeDefined();
      expect(response.body.results.length).toBeGreaterThan(0);
      expect(response.body.results[0]).toHaveProperty('title');
      expect(response.body.results[0]).toHaveProperty('vote_average');
    });
  });

  describe('GET /api/movies/upcoming', () => {
    it('should return upcoming movies', async () => {
      const response = await request(app)
        .get('/api/movies/upcoming')
        .expect(200);

      expect(response.body.results).toBeDefined();
      expect(response.body.results[0]).toHaveProperty('release_date');
    });

    it('should only return future releases', async () => {
      const response = await request(app)
        .get('/api/movies/upcoming')
        .expect(200);

      const now = new Date();
      const firstMovie = response.body.results[0];
      const releaseDate = new Date(firstMovie.release_date);

      expect(releaseDate >= now || 
             releaseDate.toDateString() === now.toDateString()).toBe(true);
    });
  });

  describe('GET /api/movies/:id', () => {
    it('should return movie details', async () => {
      const response = await request(app)
        .get('/api/movies/550') // Fight Club
        .expect(200);

      expect(response.body).toHaveProperty('id', 550);
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('overview');
      expect(response.body).toHaveProperty('release_date');
      expect(response.body).toHaveProperty('vote_average');
    });

    it('should include cast and crew', async () => {
      const response = await request(app)
        .get('/api/movies/550')
        .query({ append_to_response: 'credits' })
        .expect(200);

      expect(response.body).toHaveProperty('credits');
      expect(response.body.credits).toHaveProperty('cast');
      expect(response.body.credits).toHaveProperty('crew');
    });

    it('should return 404 for non-existent movie', async () => {
      await request(app)
        .get('/api/movies/9999999')
        .expect(404);
    });
  });

  describe('GET /api/movies/discover', () => {
    it('should support genre filtering', async () => {
      const response = await request(app)
        .get('/api/movies/discover')
        .query({ with_genres: '28' }) // Action
        .expect(200);

      expect(response.body.results).toBeDefined();
      const firstMovie = response.body.results[0];
      expect(firstMovie.genre_ids).toContain(28);
    });

    it('should support release year filtering', async () => {
      const response = await request(app)
        .get('/api/movies/discover')
        .query({
          'primary_release_date.gte': '2020-01-01',
          'primary_release_date.lte': '2020-12-31',
        })
        .expect(200);

      const firstMovie = response.body.results[0];
      const releaseYear = new Date(firstMovie.release_date).getFullYear();
      expect(releaseYear).toBe(2020);
    });

    it('should support vote average filtering', async () => {
      const response = await request(app)
        .get('/api/movies/discover')
        .query({ 'vote_average.gte': 7.5 })
        .expect(200);

      response.body.results.forEach((movie: any) => {
        expect(movie.vote_average).toBeGreaterThanOrEqual(7.5);
      });
    });

    it('should support sorting', async () => {
      const response = await request(app)
        .get('/api/movies/discover')
        .query({ sort_by: 'vote_average.desc' })
        .expect(200);

      const ratings = response.body.results.map((m: any) => m.vote_average);
      const sortedRatings = [...ratings].sort((a, b) => b - a);
      expect(ratings).toEqual(sortedRatings);
    });

    it('should support multiple filters combined', async () => {
      const response = await request(app)
        .get('/api/movies/discover')
        .query({
          with_genres: '28,12', // Action, Adventure
          'vote_average.gte': 7,
          'primary_release_year': 2023,
          sort_by: 'popularity.desc',
        })
        .expect(200);

      expect(response.body.results).toBeDefined();
      expect(response.body.results.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/movies/search', () => {
    it('should search movies by title', async () => {
      const response = await request(app)
        .get('/api/movies/search')
        .query({ query: 'fight club' })
        .expect(200);

      expect(response.body.results).toBeDefined();
      expect(response.body.results[0].title.toLowerCase()).toContain('fight');
    });

    it('should return empty results for non-existent movies', async () => {
      const response = await request(app)
        .get('/api/movies/search')
        .query({ query: 'xyznonexistentmovie123' })
        .expect(200);

      expect(response.body.results).toEqual([]);
    });

    it('should handle special characters in search', async () => {
      const response = await request(app)
        .get('/api/movies/search')
        .query({ query: 'Star Wars: Episode IV' })
        .expect(200);

      expect(response.body.results).toBeDefined();
    });
  });

  describe('GET /api/movies/genre/:genreId', () => {
    it('should return movies by genre', async () => {
      const response = await request(app)
        .get('/api/movies/genre/28') // Action
        .expect(200);

      expect(response.body.results).toBeDefined();
      response.body.results.forEach((movie: any) => {
        expect(movie.genre_ids).toContain(28);
      });
    });
  });

  describe('GET /api/movies/:id/recommendations', () => {
    it('should return movie recommendations', async () => {
      const response = await request(app)
        .get('/api/movies/550/recommendations')
        .expect(200);

      expect(response.body.results).toBeDefined();
      expect(response.body.results.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/movies/:id/similar', () => {
    it('should return similar movies', async () => {
      const response = await request(app)
        .get('/api/movies/550/similar')
        .expect(200);

      expect(response.body.results).toBeDefined();
    });
  });

  describe('Cache Behavior', () => {
    it('should return cached data on subsequent requests', async () => {
      const response1 = await request(app)
        .get('/api/movies/trending')
        .expect(200);

      const response2 = await request(app)
        .get('/api/movies/trending')
        .expect(200);

      expect(response1.body).toEqual(response2.body);
    });

    it('should cache movie details', async () => {
      const response1 = await request(app)
        .get('/api/movies/550')
        .expect(200);

      const response2 = await request(app)
        .get('/api/movies/550')
        .expect(200);

      expect(response1.body.id).toBe(response2.body.id);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid movie ID', async () => {
      await request(app)
        .get('/api/movies/invalid')
        .expect(400);
    });

    it('should handle missing query parameter', async () => {
      await request(app)
        .get('/api/movies/search')
        .expect(400);
    });

    it('should handle invalid page number', async () => {
      await request(app)
        .get('/api/movies/trending')
        .query({ page: -1 })
        .expect(400);
    });

    it('should handle page number exceeding limits', async () => {
      const response = await request(app)
        .get('/api/movies/trending')
        .query({ page: 1000 });

      expect([200, 422]).toContain(response.status);
    });
  });

  describe('Rate Limiting', () => {
    it('should respect rate limits', async () => {
      const requests = Array(150).fill(null).map(() =>
        request(app).get('/api/movies/trending')
      );

      const responses = await Promise.all(requests);
      const rateLimitedResponses = responses.filter(r => r.status === 429);

      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});
