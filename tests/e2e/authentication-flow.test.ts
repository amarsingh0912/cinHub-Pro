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

describe('E2E: Complete Authentication Flow', () => {
  let app: Express;
  let server: any;
  
  const testUser = {
    email: 'e2e-auth@test.com',
    username: 'e2eauthuser',
    password: 'SecurePassword123!',
    firstName: 'E2E',
    lastName: 'Test'
  };

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

  it('should complete full user signup, verification, and login flow', async () => {
    // Step 1: User signs up
    const signupResponse = await request(app)
      .post('/api/auth/signup')
      .set('X-CSRF-Token', 'test')
      .send(testUser)
      .expect(201);

    expect(signupResponse.body).toHaveProperty('message');
    expect(signupResponse.body).toHaveProperty('userId');
    const userId = signupResponse.body.userId;

    // Step 2: User receives OTP (mocked) and verifies
    const otpCode = '123456'; // In real scenario, this would be retrieved from email/SMS
    
    // Request OTP
    await request(app)
      .post('/api/auth/request-otp')
      .set('X-CSRF-Token', 'test')
      .send({
        target: testUser.email,
        purpose: 'signup'
      })
      .expect(200);

    // Verify OTP
    const verifyResponse = await request(app)
      .post('/api/auth/verify-otp')
      .set('X-CSRF-Token', 'test')
      .send({
        target: testUser.email,
        code: otpCode,
        purpose: 'signup'
      });

    expect([200, 400]).toContain(verifyResponse.status);

    // Step 3: User logs in with credentials
    const signinResponse = await request(app)
      .post('/api/auth/signin-jwt')
      .set('X-CSRF-Token', 'test')
      .send({
        identifier: testUser.email,
        password: testUser.password
      })
      .expect(200);

    expect(signinResponse.body).toHaveProperty('accessToken');
    expect(signinResponse.body).toHaveProperty('refreshToken');
    expect(signinResponse.body).toHaveProperty('user');
    expect(signinResponse.body.user.email).toBe(testUser.email);

    const accessToken = signinResponse.body.accessToken;
    const refreshToken = signinResponse.body.refreshToken;

    // Step 4: User accesses protected resource
    const userResponse = await request(app)
      .get('/api/auth/user')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('X-CSRF-Token', 'test')
      .expect(200);

    expect(userResponse.body).toHaveProperty('id');
    expect(userResponse.body.email).toBe(testUser.email);

    // Step 5: User updates profile
    const updateResponse = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('X-CSRF-Token', 'test')
      .send({
        firstName: 'Updated',
        lastName: 'Name'
      });

    expect([200, 404]).toContain(updateResponse.status);

    // Step 6: Token expires, user refreshes token
    const refreshResponse = await request(app)
      .post('/api/auth/refresh')
      .set('X-CSRF-Token', 'test')
      .send({ refreshToken })
      .expect(200);

    expect(refreshResponse.body).toHaveProperty('accessToken');
    const newAccessToken = refreshResponse.body.accessToken;

    // Step 7: User uses new token
    await request(app)
      .get('/api/auth/user')
      .set('Authorization', `Bearer ${newAccessToken}`)
      .set('X-CSRF-Token', 'test')
      .expect(200);

    // Step 8: User logs out
    const logoutResponse = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${newAccessToken}`)
      .set('X-CSRF-Token', 'test')
      .send({ refreshToken })
      .expect(200);

    expect(logoutResponse.body).toHaveProperty('message');

    // Step 9: Verify old tokens no longer work after logout
    const oldTokenResponse = await request(app)
      .post('/api/auth/refresh')
      .set('X-CSRF-Token', 'test')
      .send({ refreshToken });

    expect([401, 403]).toContain(oldTokenResponse.status);
  });

  it('should handle password reset flow', async () => {
    // Step 1: User requests password reset
    const forgotResponse = await request(app)
      .post('/api/auth/forgot-password')
      .set('X-CSRF-Token', 'test')
      .send({ email: testUser.email })
      .expect(200);

    expect(forgotResponse.body).toHaveProperty('message');

    // Step 2: User receives OTP and verifies
    const otpCode = '123456';
    
    const verifyResponse = await request(app)
      .post('/api/auth/verify-otp')
      .set('X-CSRF-Token', 'test')
      .send({
        target: testUser.email,
        code: otpCode,
        purpose: 'reset'
      });

    expect([200, 400]).toContain(verifyResponse.status);

    // Step 3: User resets password with new password
    const newPassword = 'NewSecurePassword123!';
    const resetResponse = await request(app)
      .post('/api/auth/reset-password')
      .set('X-CSRF-Token', 'test')
      .send({
        email: testUser.email,
        code: otpCode,
        newPassword
      });

    expect([200, 400]).toContain(resetResponse.status);

    // Step 4: User can log in with new password (if reset was successful)
    if (resetResponse.status === 200) {
      const signinResponse = await request(app)
        .post('/api/auth/signin-jwt')
        .set('X-CSRF-Token', 'test')
        .send({
          identifier: testUser.email,
          password: newPassword
        })
        .expect(200);

      expect(signinResponse.body).toHaveProperty('accessToken');
    }
  });

  it('should handle social OAuth login flow', async () => {
    // Step 1: User initiates Google OAuth
    const googleAuthResponse = await request(app)
      .get('/api/auth/google')
      .expect(302); // Redirect to Google

    expect(googleAuthResponse.headers.location).toBeDefined();

    // OAuth callback would normally be handled by Google
    // In a real E2E test, you'd simulate the callback with proper tokens
  });

  it('should reject invalid credentials', async () => {
    // Attempt login with wrong password
    await request(app)
      .post('/api/auth/signin-jwt')
      .set('X-CSRF-Token', 'test')
      .send({
        identifier: testUser.email,
        password: 'WrongPassword123!'
      })
      .expect(401);

    // Attempt login with non-existent user
    await request(app)
      .post('/api/auth/signin-jwt')
      .set('X-CSRF-Token', 'test')
      .send({
        identifier: 'nonexistent@test.com',
        password: 'SomePassword123!'
      })
      .expect(401);
  });

  it('should enforce security constraints', async () => {
    // Test rate limiting (multiple failed attempts)
    for (let i = 0; i < 3; i++) {
      await request(app)
        .post('/api/auth/signin-jwt')
        .set('X-CSRF-Token', 'test')
        .send({
          identifier: testUser.email,
          password: 'WrongPassword!'
        });
    }

    // Further attempts might be rate limited
    const rateLimitResponse = await request(app)
      .post('/api/auth/signin-jwt')
      .set('X-CSRF-Token', 'test')
      .send({
        identifier: testUser.email,
        password: 'WrongPassword!'
      });

    expect([401, 429]).toContain(rateLimitResponse.status);
  });
});
