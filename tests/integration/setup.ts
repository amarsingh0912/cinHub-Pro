import { expect, beforeAll, afterEach, afterAll, beforeEach } from 'vitest';
import { setupServer } from 'msw/node';
import { tmdbHandlers } from './mocks/tmdb-handlers';
import { sql } from 'drizzle-orm';
import { db } from '../../server/db';

// Set up test environment variables
process.env.NODE_ENV = 'test';
// Use DATABASE_URL if it exists, otherwise tests will fail if database operations are needed
if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL not set for integration tests - database operations will fail');
}
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

// Database cleanup function
async function cleanDatabase() {
  try {
    // Delete in order to respect foreign key constraints
    // Order matters: delete child tables before parent tables
    await db.execute(sql`TRUNCATE TABLE search_history CASCADE`);
    await db.execute(sql`TRUNCATE TABLE activity_history CASCADE`);
    await db.execute(sql`TRUNCATE TABLE viewing_history CASCADE`);
    await db.execute(sql`TRUNCATE TABLE tmdb_reviews_cache CASCADE`);
    await db.execute(sql`TRUNCATE TABLE media_credits CASCADE`);
    await db.execute(sql`TRUNCATE TABLE images_cache CASCADE`);
    await db.execute(sql`TRUNCATE TABLE people_cache CASCADE`);
    await db.execute(sql`TRUNCATE TABLE tv_shows_cache CASCADE`);
    await db.execute(sql`TRUNCATE TABLE movies_cache CASCADE`);
    await db.execute(sql`TRUNCATE TABLE reviews CASCADE`);
    await db.execute(sql`TRUNCATE TABLE watchlist_items CASCADE`);
    await db.execute(sql`TRUNCATE TABLE watchlists CASCADE`);
    await db.execute(sql`TRUNCATE TABLE favorites CASCADE`);
    await db.execute(sql`TRUNCATE TABLE otp_verifications CASCADE`);
    await db.execute(sql`TRUNCATE TABLE auth_sessions CASCADE`);
    await db.execute(sql`TRUNCATE TABLE social_accounts CASCADE`);
    await db.execute(sql`TRUNCATE TABLE users CASCADE`);
    await db.execute(sql`TRUNCATE TABLE sessions CASCADE`);
  } catch (error) {
    console.error('Error cleaning database:', error);
  }
}

// Start server before all tests
beforeAll(async () => {
  server.listen({
    onUnhandledRequest: 'bypass',
  });
  // Clean database before all tests to ensure clean state
  await cleanDatabase();
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
