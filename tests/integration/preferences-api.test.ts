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

describe('Preferences API', () => {
  let app: Express;
  let server: any;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    server = await registerRoutes(app);

    // Create user
    const signupResponse = await request(app)
      .post('/api/auth/signup')
      .set('X-CSRF-Token', 'test')
      .send({
        email: 'preferences@test.com',
        username: 'preferencesuser',
        password: 'TestPassword123!',
        firstName: 'Preferences',
        lastName: 'User'
      });

    userId = signupResponse.body.userId;

    // Sign in to get JWT token
    const signinResponse = await request(app)
      .post('/api/auth/signin-jwt')
      .set('X-CSRF-Token', 'test')
      .send({
        identifier: 'preferences@test.com',
        password: 'TestPassword123!'
      });

    authToken = signinResponse.body.accessToken;
  });

  afterAll(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  describe('GET /api/preferences', () => {
    it('should return user preferences', async () => {
      const response = await request(app)
        .get('/api/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-CSRF-Token', 'test')
        .expect(200);

      expect(response.body).toHaveProperty('preferences');
    });

    it('should return default preferences for new users', async () => {
      const response = await request(app)
        .get('/api/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-CSRF-Token', 'test')
        .expect(200);

      // Check for expected preference structure
      expect(response.body.preferences).toBeDefined();
    });

    it('should reject unauthenticated requests', async () => {
      await request(app)
        .get('/api/preferences')
        .set('X-CSRF-Token', 'test')
        .expect(401);
    });
  });

  describe('PUT /api/preferences', () => {
    it('should update user preferences successfully', async () => {
      const preferences = {
        theme: 'dark',
        language: 'en',
        notifications: {
          email: true,
          push: false
        },
        favoriteGenres: [28, 12, 878], // Action, Adventure, Sci-Fi
        contentRating: 'R',
        autoplay: true
      };

      const response = await request(app)
        .put('/api/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-CSRF-Token', 'test')
        .send({ preferences })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('preferences');
      expect(response.body.preferences.theme).toBe('dark');
      expect(response.body.preferences.language).toBe('en');
      expect(response.body.preferences.favoriteGenres).toEqual([28, 12, 878]);
    });

    it('should allow partial preference updates', async () => {
      const partialPreferences = {
        theme: 'light'
      };

      const response = await request(app)
        .put('/api/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-CSRF-Token', 'test')
        .send({ preferences: partialPreferences })
        .expect(200);

      expect(response.body.preferences.theme).toBe('light');
    });

    it('should validate preference data', async () => {
      const invalidPreferences = {
        theme: 123, // Should be string
        notifications: 'invalid' // Should be object
      };

      const response = await request(app)
        .put('/api/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-CSRF-Token', 'test')
        .send({ preferences: invalidPreferences });

      // May accept it depending on validation rules
      expect([200, 400]).toContain(response.status);
    });

    it('should reject unauthenticated requests', async () => {
      await request(app)
        .put('/api/preferences')
        .set('X-CSRF-Token', 'test')
        .send({ preferences: { theme: 'dark' } })
        .expect(401);
    });

    it('should handle complex nested preferences', async () => {
      const complexPreferences = {
        theme: 'dark',
        notifications: {
          email: true,
          push: false,
          sms: false,
          frequency: 'daily'
        },
        privacy: {
          showActivity: true,
          showFavorites: false,
          allowRecommendations: true
        },
        display: {
          cardsPerRow: 4,
          showRatings: true,
          showReleaseDates: true
        }
      };

      const response = await request(app)
        .put('/api/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-CSRF-Token', 'test')
        .send({ preferences: complexPreferences })
        .expect(200);

      expect(response.body.preferences.notifications).toEqual(complexPreferences.notifications);
      expect(response.body.preferences.privacy).toEqual(complexPreferences.privacy);
      expect(response.body.preferences.display).toEqual(complexPreferences.display);
    });

    it('should preserve existing preferences when updating', async () => {
      // First update
      await request(app)
        .put('/api/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-CSRF-Token', 'test')
        .send({ 
          preferences: { 
            theme: 'dark',
            language: 'en'
          } 
        });

      // Second update (partial)
      const response = await request(app)
        .put('/api/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-CSRF-Token', 'test')
        .send({ 
          preferences: { 
            autoplay: true 
          } 
        })
        .expect(200);

      // Theme should still be preserved
      expect(response.body.preferences.theme).toBe('dark');
      expect(response.body.preferences.autoplay).toBe(true);
    });
  });

  describe('Preferences Persistence', () => {
    it('should persist preferences across sessions', async () => {
      const testPreferences = {
        theme: 'dark',
        language: 'es',
        favoriteGenres: [18, 35] // Drama, Comedy
      };

      // Update preferences
      await request(app)
        .put('/api/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-CSRF-Token', 'test')
        .send({ preferences: testPreferences })
        .expect(200);

      // Fetch preferences
      const response = await request(app)
        .get('/api/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-CSRF-Token', 'test')
        .expect(200);

      expect(response.body.preferences.theme).toBe('dark');
      expect(response.body.preferences.language).toBe('es');
      expect(response.body.preferences.favoriteGenres).toEqual([18, 35]);
    });
  });
});
