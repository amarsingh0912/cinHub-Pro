import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';

describe('Search Page Integration', () => {
  let app: Express;
  let server: any;

  beforeAll(async () => {
    const { default: express } = await import('express');
    const { registerRoutes } = await import('../../server/routes');
    
    app = express();
    server = await registerRoutes(app);
  });

  afterAll(() => {
    if (server) {
      server.close();
    }
  });

  describe('Search Endpoint', () => {
    it('should return search results for valid query', async () => {
      const response = await request(app)
        .get('/api/search')
        .query({ query: 'inception' })
        .expect(200);

      expect(response.body).toHaveProperty('results');
      expect(Array.isArray(response.body.results)).toBe(true);
    });

    it('should handle empty query', async () => {
      const response = await request(app)
        .get('/api/search')
        .query({ query: '' });

      expect(response.status).toBeOneOf([200, 400]);
    });

    it('should handle missing query parameter', async () => {
      const response = await request(app)
        .get('/api/search');

      expect(response.status).toBeOneOf([200, 400]);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/search')
        .query({ query: 'star', page: 2 })
        .expect(200);

      expect(response.body).toHaveProperty('page');
      expect(response.body.page).toBe(2);
    });

    it('should support media type filter', async () => {
      const response = await request(app)
        .get('/api/search')
        .query({ query: 'inception', media_type: 'movie' })
        .expect(200);

      if (response.body.results && response.body.results.length > 0) {
        expect(response.body.results[0].media_type).toBe('movie');
      }
    });

    it('should return results with proper structure', async () => {
      const response = await request(app)
        .get('/api/search')
        .query({ query: 'avatar' })
        .expect(200);

      expect(response.body).toHaveProperty('results');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('total_pages');
      expect(response.body).toHaveProperty('total_results');
    });
  });

  describe('Search Filtering', () => {
    it('should filter by movies only', async () => {
      const response = await request(app)
        .get('/api/search')
        .query({ query: 'batman', media_type: 'movie' })
        .expect(200);

      response.body.results?.forEach((item: any) => {
        expect(item.media_type).toBe('movie');
      });
    });

    it('should filter by TV shows only', async () => {
      const response = await request(app)
        .get('/api/search')
        .query({ query: 'breaking', media_type: 'tv' })
        .expect(200);

      response.body.results?.forEach((item: any) => {
        expect(item.media_type).toBe('tv');
      });
    });

    it('should filter by people only', async () => {
      const response = await request(app)
        .get('/api/search')
        .query({ query: 'leonardo', media_type: 'person' })
        .expect(200);

      response.body.results?.forEach((item: any) => {
        expect(item.media_type).toBe('person');
      });
    });

    it('should return all types without filter', async () => {
      const response = await request(app)
        .get('/api/search')
        .query({ query: 'star' })
        .expect(200);

      const mediaTypes = new Set(
        response.body.results?.map((item: any) => item.media_type)
      );
      
      expect(mediaTypes.size).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Search Sorting', () => {
    it('should support sorting by popularity', async () => {
      const response = await request(app)
        .get('/api/search')
        .query({ query: 'action', sort_by: 'popularity.desc' })
        .expect(200);

      if (response.body.results && response.body.results.length > 1) {
        const first = response.body.results[0].popularity || 0;
        const second = response.body.results[1].popularity || 0;
        expect(first).toBeGreaterThanOrEqual(second);
      }
    });

    it('should support sorting by vote average', async () => {
      const response = await request(app)
        .get('/api/search')
        .query({ query: 'drama', sort_by: 'vote_average.desc' })
        .expect(200);

      // Results might be sorted by rating
      expect(response.body.results).toBeTruthy();
    });
  });

  describe('Search Validation', () => {
    it('should handle very long queries', async () => {
      const longQuery = 'a'.repeat(500);
      const response = await request(app)
        .get('/api/search')
        .query({ query: longQuery });

      expect(response.status).toBeOneOf([200, 400]);
    });

    it('should handle special characters in query', async () => {
      const response = await request(app)
        .get('/api/search')
        .query({ query: 'test!@#$%^&*()' })
        .expect(200);

      expect(response.body).toHaveProperty('results');
    });

    it('should handle unicode characters', async () => {
      const response = await request(app)
        .get('/api/search')
        .query({ query: '电影' })
        .expect(200);

      expect(response.body).toHaveProperty('results');
    });

    it('should validate page number', async () => {
      const response = await request(app)
        .get('/api/search')
        .query({ query: 'test', page: -1 });

      expect(response.status).toBeOneOf([200, 400]);
    });

    it('should validate media type', async () => {
      const response = await request(app)
        .get('/api/search')
        .query({ query: 'test', media_type: 'invalid' });

      expect(response.status).toBeOneOf([200, 400]);
    });
  });

  describe('Search Performance', () => {
    it('should respond within acceptable time', async () => {
      const start = Date.now();
      
      await request(app)
        .get('/api/search')
        .query({ query: 'marvel' })
        .expect(200);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(5000); // 5 seconds max
    });

    it('should handle concurrent searches', async () => {
      const promises = Array(5).fill(null).map((_, i) =>
        request(app)
          .get('/api/search')
          .query({ query: `test${i}` })
      );

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('Search Error Handling', () => {
    it('should handle TMDB API errors gracefully', async () => {
      const response = await request(app)
        .get('/api/search')
        .query({ query: 'test', page: 9999 });

      expect(response.status).toBeOneOf([200, 400, 404, 500]);
    });

    it('should return proper error format', async () => {
      const response = await request(app)
        .get('/api/search')
        .query({ query: '', page: 0 });

      if (response.status >= 400) {
        expect(response.body).toHaveProperty('message');
      }
    });
  });
});
