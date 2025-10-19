import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import { registerRoutes } from '../../server/routes';

// Mock external services
vi.mock('@sendgrid/mail', () => {
  const mockSend = vi.fn().mockResolvedValue([{ statusCode: 202 }]);
  const mockSetApiKey = vi.fn();
  
  return {
    default: {
      setApiKey: mockSetApiKey,
      send: mockSend
    },
    setApiKey: mockSetApiKey,
    send: mockSend
  };
});

vi.mock('twilio', () => ({
  default: vi.fn().mockReturnValue({
    messages: {
      create: vi.fn().mockResolvedValue({ sid: 'mock-sid' })
    }
  })
}));

describe('Admin API', () => {
  let app: Express;
  let server: any;
  let adminToken: string;
  let regularToken: string;
  let testUserId: string;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    server = await registerRoutes(app);

    // Create admin user and get token
    const adminSignup = await request(app)
      .post('/api/auth/signup')
      .set('X-CSRF-Token', 'test')
      .send({
        email: 'admin@test.com',
        username: 'adminuser',
        password: 'AdminPassword123!',
        firstName: 'Admin',
        lastName: 'User'
      });

    // Sign in as admin to get JWT token
    const adminSignin = await request(app)
      .post('/api/auth/signin-jwt')
      .set('X-CSRF-Token', 'test')
      .send({
        identifier: 'admin@test.com',
        password: 'AdminPassword123!'
      });

    adminToken = adminSignin.body.accessToken;

    // Create regular user
    const regularSignup = await request(app)
      .post('/api/auth/signup')
      .set('X-CSRF-Token', 'test')
      .send({
        email: 'regular@test.com',
        username: 'regularuser',
        password: 'RegularPassword123!',
        firstName: 'Regular',
        lastName: 'User'
      });

    testUserId = regularSignup.body.userId;

    // Sign in as regular user
    const regularSignin = await request(app)
      .post('/api/auth/signin-jwt')
      .set('X-CSRF-Token', 'test')
      .send({
        identifier: 'regular@test.com',
        password: 'RegularPassword123!'
      });

    regularToken = regularSignin.body.accessToken;
  });

  afterAll(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  describe('GET /api/admin/users', () => {
    it('should return all users for admin', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-CSRF-Token', 'test')
        .expect(200);

      expect(response.body).toHaveProperty('users');
      expect(Array.isArray(response.body.users)).toBe(true);
      expect(response.body.users.length).toBeGreaterThan(0);
    });

    it('should reject access for non-admin users', async () => {
      await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${regularToken}`)
        .set('X-CSRF-Token', 'test')
        .expect(403);
    });

    it('should reject access for unauthenticated requests', async () => {
      await request(app)
        .get('/api/admin/users')
        .set('X-CSRF-Token', 'test')
        .expect(401);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/admin/users?page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-CSRF-Token', 'test')
        .expect(200);

      expect(response.body).toHaveProperty('users');
      expect(response.body.users.length).toBeLessThanOrEqual(5);
    });

    it('should support filtering by search query', async () => {
      const response = await request(app)
        .get('/api/admin/users?search=regular')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-CSRF-Token', 'test')
        .expect(200);

      expect(response.body).toHaveProperty('users');
      expect(Array.isArray(response.body.users)).toBe(true);
    });
  });

  describe('PATCH /api/admin/users/:userId/role', () => {
    it('should update user role for admin', async () => {
      const response = await request(app)
        .patch(`/api/admin/users/${testUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-CSRF-Token', 'test')
        .send({ isAdmin: true })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.isAdmin).toBe(true);
    });

    it('should reject role update for non-admin users', async () => {
      await request(app)
        .patch(`/api/admin/users/${testUserId}/role`)
        .set('Authorization', `Bearer ${regularToken}`)
        .set('X-CSRF-Token', 'test')
        .send({ isAdmin: true })
        .expect(403);
    });

    it('should validate role data', async () => {
      await request(app)
        .patch(`/api/admin/users/${testUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-CSRF-Token', 'test')
        .send({ isAdmin: 'invalid' })
        .expect(400);
    });

    it('should return 404 for non-existent user', async () => {
      await request(app)
        .patch('/api/admin/users/non-existent-id/role')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-CSRF-Token', 'test')
        .send({ isAdmin: false })
        .expect(404);
    });
  });

  describe('PATCH /api/admin/users/:userId/status', () => {
    it('should update user verification status', async () => {
      const response = await request(app)
        .patch(`/api/admin/users/${testUserId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-CSRF-Token', 'test')
        .send({ isVerified: true })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.user.isVerified).toBe(true);
    });

    it('should reject status update for non-admin users', async () => {
      await request(app)
        .patch(`/api/admin/users/${testUserId}/status`)
        .set('Authorization', `Bearer ${regularToken}`)
        .set('X-CSRF-Token', 'test')
        .send({ isVerified: true })
        .expect(403);
    });
  });

  describe('DELETE /api/admin/users/:userId', () => {
    it('should reject delete for non-admin users', async () => {
      await request(app)
        .delete(`/api/admin/users/${testUserId}`)
        .set('Authorization', `Bearer ${regularToken}`)
        .set('X-CSRF-Token', 'test')
        .expect(403);
    });

    it('should delete user for admin', async () => {
      // Create a user to delete
      const userToDelete = await request(app)
        .post('/api/auth/signup')
        .set('X-CSRF-Token', 'test')
        .send({
          email: 'delete@test.com',
          username: 'deleteuser',
          password: 'DeletePassword123!',
          firstName: 'Delete',
          lastName: 'User'
        });

      const response = await request(app)
        .delete(`/api/admin/users/${userToDelete.body.userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-CSRF-Token', 'test')
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 404 for non-existent user', async () => {
      await request(app)
        .delete('/api/admin/users/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-CSRF-Token', 'test')
        .expect(404);
    });

    it('should prevent admin from deleting themselves', async () => {
      // Get admin user ID
      const adminUser = await request(app)
        .get('/api/auth/user')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-CSRF-Token', 'test');

      await request(app)
        .delete(`/api/admin/users/${adminUser.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-CSRF-Token', 'test')
        .expect(400);
    });
  });

  describe('GET /api/admin/stats', () => {
    it('should return platform statistics for admin', async () => {
      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-CSRF-Token', 'test')
        .expect(200);

      expect(response.body).toHaveProperty('stats');
      expect(response.body.stats).toHaveProperty('totalUsers');
      expect(response.body.stats).toHaveProperty('verifiedUsers');
      expect(response.body.stats).toHaveProperty('totalReviews');
      expect(response.body.stats).toHaveProperty('totalWatchlists');
      expect(response.body.stats).toHaveProperty('totalFavorites');
    });

    it('should reject access for non-admin users', async () => {
      await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${regularToken}`)
        .set('X-CSRF-Token', 'test')
        .expect(403);
    });

    it('should return stats with correct data types', async () => {
      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-CSRF-Token', 'test')
        .expect(200);

      const { stats } = response.body;
      expect(typeof stats.totalUsers).toBe('number');
      expect(typeof stats.verifiedUsers).toBe('number');
      expect(typeof stats.totalReviews).toBe('number');
      expect(typeof stats.totalWatchlists).toBe('number');
      expect(typeof stats.totalFavorites).toBe('number');
    });
  });
});
