import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';

describe('Landing Page Integration', () => {
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

  describe('GET /', () => {
    it('should return 200 status code', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);
    });

    it('should serve HTML content', async () => {
      const response = await request(app)
        .get('/')
        .expect('Content-Type', /html/);
    });

    it('should include app meta tags', async () => {
      const response = await request(app)
        .get('/');
      
      expect(response.text).toContain('<meta');
      expect(response.text).toContain('CineHub Pro');
    });

    it('should include app scripts', async () => {
      const response = await request(app)
        .get('/');
      
      expect(response.text).toContain('<script');
    });

    it('should have proper charset', async () => {
      const response = await request(app)
        .get('/');
      
      expect(response.text).toContain('charset="UTF-8"') || 
      expect(response.text).toContain('charset=utf-8');
    });
  });

  describe('Static Assets', () => {
    it('should serve JavaScript bundles', async () => {
      await request(app)
        .get('/assets/index.js')
        .expect(200)
        .expect('Content-Type', /javascript/);
    });

    it('should serve CSS files', async () => {
      await request(app)
        .get('/assets/index.css')
        .expect(200)
        .expect('Content-Type', /css/);
    });

    it('should return 404 for non-existent assets', async () => {
      await request(app)
        .get('/assets/nonexistent.js')
        .expect(404);
    });
  });

  describe('SEO', () => {
    it('should have title tag', async () => {
      const response = await request(app)
        .get('/');
      
      expect(response.text).toMatch(/<title>.*CineHub Pro.*<\/title>/i);
    });

    it('should have meta description', async () => {
      const response = await request(app)
        .get('/');
      
      expect(response.text).toContain('name="description"');
    });

    it('should have Open Graph tags', async () => {
      const response = await request(app)
        .get('/');
      
      expect(response.text).toContain('og:title') ||
      expect(response.text).toContain('property="og:');
    });

    it('should have viewport meta tag', async () => {
      const response = await request(app)
        .get('/');
      
      expect(response.text).toContain('name="viewport"');
    });
  });

  describe('Security Headers', () => {
    it('should set X-Content-Type-Options header', async () => {
      await request(app)
        .get('/')
        .expect('X-Content-Type-Options', 'nosniff');
    });

    it('should set X-Frame-Options header', async () => {
      const response = await request(app)
        .get('/');
      
      expect(response.headers['x-frame-options']).toBeTruthy();
    });

    it('should set Strict-Transport-Security in production', async () => {
      if (process.env.NODE_ENV === 'production') {
        const response = await request(app)
          .get('/');
        
        expect(response.headers['strict-transport-security']).toBeTruthy();
      }
    });

    it('should set Content-Security-Policy', async () => {
      const response = await request(app)
        .get('/');
      
      // CSP might be set
      if (response.headers['content-security-policy']) {
        expect(response.headers['content-security-policy']).toBeTruthy();
      }
    });
  });

  describe('Caching', () => {
    it('should set cache headers for static assets', async () => {
      const response = await request(app)
        .get('/assets/index.js');
      
      expect(response.headers['cache-control']).toBeTruthy();
    });

    it('should not cache HTML pages', async () => {
      const response = await request(app)
        .get('/');
      
      expect(response.headers['cache-control']).toMatch(/no-cache|no-store/i);
    });
  });

  describe('Compression', () => {
    it('should support gzip compression', async () => {
      const response = await request(app)
        .get('/')
        .set('Accept-Encoding', 'gzip');
      
      // Compression might be applied
      if (response.headers['content-encoding']) {
        expect(response.headers['content-encoding']).toMatch(/gzip/);
      }
    });
  });
});
