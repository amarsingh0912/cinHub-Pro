import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import { registerRoutes } from '../../server/routes';
import { mockMovieDetails, mockTVDetails, mockMoviesList } from '../__mocks__/tmdb-service';

// Mock TMDB API responses
vi.mock('../../server/services/tmdbCache', () => ({
  TMDBCacheService: vi.fn().mockImplementation(() => ({
    getMovieFromCache: vi.fn().mockResolvedValue(null),
    getTvShowFromCache: vi.fn().mockResolvedValue(null),
    cacheMovie: vi.fn().mockResolvedValue(mockMovieDetails),
    cacheTvShow: vi.fn().mockResolvedValue(mockTVDetails),
  })),
  tmdbCacheService: {
    getMovieFromCache: vi.fn().mockResolvedValue(null),
    getTvShowFromCache: vi.fn().mockResolvedValue(null),
    cacheMovie: vi.fn().mockResolvedValue(mockMovieDetails),
    cacheTvShow: vi.fn().mockResolvedValue(mockTVDetails),
  }
}));

describe('TMDB API Integration', () => {
  let app: Express;
  let server: any;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    
    // Mock TMDB fetch calls
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/movie/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockMovieDetails)
        });
      }
      if (url.includes('/tv/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockTVDetails)
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockMoviesList)
      });
    });
    
    server = await registerRoutes(app);
  });

  afterAll(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    vi.clearAllMocks();
  });

  describe('Movies API', () => {
    describe('GET /api/movies/trending', () => {
      it('should return trending movies', async () => {
        const response = await request(app)
          .get('/api/movies/trending')
          .expect(200);

        expect(response.body).toHaveProperty('results');
        expect(Array.isArray(response.body.results)).toBe(true);
        expect(response.body).toHaveProperty('page');
        expect(response.body).toHaveProperty('total_pages');
      });

      it('should support pagination', async () => {
        const response = await request(app)
          .get('/api/movies/trending?page=2')
          .expect(200);

        expect(response.body.page).toBe(2);
      });

      it('should support time window parameter', async () => {
        const response = await request(app)
          .get('/api/movies/trending?time_window=week')
          .expect(200);

        expect(response.body).toHaveProperty('results');
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
      });

      it('should include credits', async () => {
        const response = await request(app)
          .get('/api/movies/550')
          .expect(200);

        expect(response.body).toHaveProperty('credits');
        expect(response.body.credits).toHaveProperty('cast');
        expect(response.body.credits).toHaveProperty('crew');
      });

      it('should return 404 for non-existent movie', async () => {
        // Mock 404 response
        global.fetch = vi.fn().mockResolvedValueOnce({
          ok: false,
          status: 404,
          json: () => Promise.resolve({ status_message: 'Not found' })
        });
        
        await request(app)
          .get('/api/movies/999999999')
          .expect(404);
      });
    });

    describe('GET /api/movies/discover', () => {
      it('should support genre filtering', async () => {
        const response = await request(app)
          .get('/api/movies/discover?with_genres=28') // Action
          .expect(200);

        expect(response.body).toHaveProperty('results');
        expect(Array.isArray(response.body.results)).toBe(true);
      });

      it('should support rating filtering', async () => {
        const response = await request(app)
          .get('/api/movies/discover?vote_average.gte=8')
          .expect(200);

        expect(response.body).toHaveProperty('results');
      });

      it('should support multiple filters', async () => {
        const response = await request(app)
          .get('/api/movies/discover?with_genres=28&vote_average.gte=7&primary_release_year=2024')
          .expect(200);

        expect(response.body).toHaveProperty('results');
      });

      it('should support sorting', async () => {
        const response = await request(app)
          .get('/api/movies/discover?sort_by=popularity.desc')
          .expect(200);

        expect(response.body).toHaveProperty('results');
      });
    });

    describe('GET /api/movies/search', () => {
      it('should search for movies', async () => {
        const response = await request(app)
          .get('/api/movies/search?query=fight+club')
          .expect(200);

        expect(response.body).toHaveProperty('results');
        expect(response.body.results.length).toBeGreaterThan(0);
      });

      it('should return empty results for non-existent movie', async () => {
        const response = await request(app)
          .get('/api/movies/search?query=xyzabc123nonexistent')
          .expect(200);

        expect(response.body.results).toHaveLength(0);
      });
    });
  });

  describe('TV Shows API', () => {
    describe('GET /api/tv/trending', () => {
      it('should return trending TV shows', async () => {
        const response = await request(app)
          .get('/api/tv/trending')
          .expect(200);

        expect(response.body).toHaveProperty('results');
        expect(Array.isArray(response.body.results)).toBe(true);
      });
    });

    describe('GET /api/tv/:id', () => {
      it('should return TV show details', async () => {
        const response = await request(app)
          .get('/api/tv/1399') // Game of Thrones
          .expect(200);

        expect(response.body).toHaveProperty('id', 1399);
        expect(response.body).toHaveProperty('name');
        expect(response.body).toHaveProperty('first_air_date');
        expect(response.body).toHaveProperty('number_of_seasons');
      });

      it('should return 404 for non-existent TV show', async () => {
        // Mock 404 response
        global.fetch = vi.fn().mockResolvedValueOnce({
          ok: false,
          status: 404,
          json: () => Promise.resolve({ status_message: 'Not found' })
        });
        
        await request(app)
          .get('/api/tv/999999999')
          .expect(404);
      });
    });

    describe('GET /api/tv/discover', () => {
      it('should support genre filtering', async () => {
        const response = await request(app)
          .get('/api/tv/discover?with_genres=18') // Drama
          .expect(200);

        expect(response.body).toHaveProperty('results');
      });

      it('should support air date filtering', async () => {
        const response = await request(app)
          .get('/api/tv/discover?first_air_date_year=2020')
          .expect(200);

        expect(response.body).toHaveProperty('results');
      });
    });
  });

  describe('Cache Status API', () => {
    describe('GET /api/cache-status/:type/:id', () => {
      it('should return cache status for movie', async () => {
        const response = await request(app)
          .get('/api/cache-status/movie/550')
          .expect(200);

        expect(response.body).toHaveProperty('status');
        expect(response.body.status).toBeOneOf(['not_found', 'cached', 'processing', 'failed']);
      });

      it('should return cache status for TV show', async () => {
        const response = await request(app)
          .get('/api/cache-status/tv/1399')
          .expect(200);

        expect(response.body).toHaveProperty('status');
      });

      it('should reject invalid media type', async () => {
        await request(app)
          .get('/api/cache-status/invalid/123')
          .expect(400);
      });
    });
  });
});
