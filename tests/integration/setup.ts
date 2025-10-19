import { expect, beforeAll, afterEach, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { tmdbHandlers } from './mocks/tmdb-handlers';

// Set up test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-key-for-testing-purposes-only';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-purposes-only';
process.env.SESSION_SECRET = 'test-session-secret-for-testing-purposes-only';
process.env.SENDGRID_API_KEY = 'test-sendgrid-key';
process.env.TWILIO_ACCOUNT_SID = 'test-twilio-sid';
process.env.TWILIO_AUTH_TOKEN = 'test-twilio-token';
process.env.TWILIO_PHONE_NUMBER = '+15551234567';
process.env.TWILIO_VERIFY_SERVICE_SID = 'test-verify-service-sid';
process.env.CLOUDINARY_CLOUD_NAME = 'test-cloudinary';
process.env.CLOUDINARY_API_KEY = 'test-cloudinary-key';
process.env.CLOUDINARY_API_SECRET = 'test-cloudinary-secret';
process.env.TMDB_API_KEY = 'test-tmdb-key';
process.env.TMDB_ACCESS_TOKEN = 'test-tmdb-token';

// Set up MSW server for external API mocking
const server = setupServer(...tmdbHandlers);

// Start server before all tests
beforeAll(() => {
  server.listen({
    onUnhandledRequest: 'bypass',
  });
});

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers();
});

// Clean up after all tests
afterAll(() => {
  server.close();
});

// Add custom matcher for toBeOneOf
expect.extend({
  toBeOneOf(received: any, expected: any[]) {
    const pass = expected.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${expected.join(', ')}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${expected.join(', ')}`,
        pass: false,
      };
    }
  },
});

// Extend TypeScript types for custom matcher
declare module 'vitest' {
  interface Assertion<T = any> {
    toBeOneOf(expected: any[]): T;
  }
  interface AsymmetricMatchersContaining {
    toBeOneOf(expected: any[]): any;
  }
}
