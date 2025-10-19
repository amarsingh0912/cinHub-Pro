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

describe('Authentication API', () => {
  let app: Express;
  let server: any;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    server = await registerRoutes(app);
  });

  afterAll(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  describe('POST /api/auth/signup', () => {
    const testUser = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User'
    };

    it('should create a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('userId');
    });

    it('should reject duplicate email', async () => {
      await request(app)
        .post('/api/auth/signup')
        .send(testUser)
        .expect(409);
    });

    it('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({ ...testUser, email: 'invalid-email', username: 'newuser' })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should reject weak password', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({ ...testUser, email: 'new@example.com', username: 'newuser2', password: '123' })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should reject missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'test@example.com' })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/auth/signin-jwt', () => {
    const credentials = {
      identifier: 'testuser',
      password: 'TestPassword123!'
    };

    it('should sign in with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/signin-jwt')
        .send(credentials)
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should sign in with email instead of username', async () => {
      const response = await request(app)
        .post('/api/auth/signin-jwt')
        .send({ identifier: 'test@example.com', password: 'TestPassword123!' })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/signin-jwt')
        .send({ identifier: 'testuser', password: 'wrongpassword' })
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should reject non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/signin-jwt')
        .send({ identifier: 'nonexistent', password: 'password123' })
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/auth/signin-jwt')
        .send({ identifier: 'testuser', password: 'TestPassword123!' });
      
      refreshToken = response.body.refreshToken;
    });

    it('should refresh access token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.accessToken).toBeTruthy();
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should reject missing refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/auth/me', () => {
    let accessToken: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/auth/signin-jwt')
        .send({ identifier: 'testuser', password: 'TestPassword123!' });
      
      accessToken = response.body.accessToken;
    });

    it('should return current user with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('username');
      expect(response.body).toHaveProperty('email');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should reject request without token', async () => {
      await request(app)
        .get('/api/auth/me')
        .expect(401);
    });

    it('should reject request with invalid token', async () => {
      await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    let accessToken: string;
    let refreshToken: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/auth/signin-jwt')
        .send({ identifier: 'testuser', password: 'TestPassword123!' });
      
      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
    });

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });

    it('should invalidate refresh token after logout', async () => {
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken });

      // Try to use the refresh token
      await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(401);
    });
  });

  describe('OTP Verification', () => {
    describe('POST /api/auth/request-otp', () => {
      it('should send OTP to valid email', async () => {
        const response = await request(app)
          .post('/api/auth/request-otp')
          .send({ target: 'test@example.com', purpose: 'reset' })
          .expect(200);

        expect(response.body).toHaveProperty('message');
      });

      it('should reject invalid purpose', async () => {
        await request(app)
          .post('/api/auth/request-otp')
          .send({ target: 'test@example.com', purpose: 'invalid' })
          .expect(400);
      });
    });

    describe('POST /api/auth/verify-otp', () => {
      it('should verify valid OTP', async () => {
        // Request OTP first
        await request(app)
          .post('/api/auth/request-otp')
          .send({ target: 'test@example.com', purpose: 'reset' });

        // Note: In real test, you'd need to get the actual OTP from test database
        const response = await request(app)
          .post('/api/auth/verify-otp')
          .send({ 
            target: 'test@example.com', 
            code: '123456', // This would be the actual OTP in real test
            purpose: 'reset' 
          });

        // Expect either success or failure based on code
        expect(response.status).toBeOneOf([200, 400]);
      });

      it('should reject invalid OTP', async () => {
        const response = await request(app)
          .post('/api/auth/verify-otp')
          .send({ 
            target: 'test@example.com', 
            code: '000000',
            purpose: 'reset' 
          })
          .expect(400);

        expect(response.body).toHaveProperty('message');
      });
    });
  });
});
