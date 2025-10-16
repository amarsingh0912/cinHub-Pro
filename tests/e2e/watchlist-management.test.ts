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

describe('E2E: Watchlist Management Flow', () => {
  let app: Express;
  let server: any;
  let authToken: string;
  let watchlistId: string;

  const testUser = {
    email: 'e2e-watchlist@test.com',
    username: 'e2ewatchlistuser',
    password: 'TestPassword123!',
    firstName: 'Watchlist',
    lastName: 'Tester'
  };

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    server = await registerRoutes(app);

    // Setup: Create and authenticate user
    await request(app)
      .post('/api/auth/signup')
      .set('X-CSRF-Token', 'test')
      .send(testUser);

    const signinResponse = await request(app)
      .post('/api/auth/signin-jwt')
      .set('X-CSRF-Token', 'test')
      .send({
        identifier: testUser.email,
        password: testUser.password
      });

    authToken = signinResponse.body.accessToken;
  });

  afterAll(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it('should complete full watchlist lifecycle', async () => {
    // Step 1: User browses movies
    const moviesResponse = await request(app)
      .get('/api/movies/popular')
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-CSRF-Token', 'test')
      .expect(200);

    expect(moviesResponse.body).toHaveProperty('results');
    expect(moviesResponse.body.results.length).toBeGreaterThan(0);

    // Step 2: User creates a new watchlist
    const createWatchlistResponse = await request(app)
      .post('/api/watchlists')
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-CSRF-Token', 'test')
      .send({
        name: 'Must Watch Classics',
        description: 'Classic movies I need to watch',
        isPublic: true
      })
      .expect(201);

    expect(createWatchlistResponse.body).toHaveProperty('watchlist');
    watchlistId = createWatchlistResponse.body.watchlist.id;
    expect(createWatchlistResponse.body.watchlist.name).toBe('Must Watch Classics');

    // Step 3: User views their watchlists
    const watchlistsResponse = await request(app)
      .get('/api/watchlists')
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-CSRF-Token', 'test')
      .expect(200);

    expect(watchlistsResponse.body).toHaveProperty('watchlists');
    expect(watchlistsResponse.body.watchlists.length).toBeGreaterThan(0);
    
    const foundWatchlist = watchlistsResponse.body.watchlists.find(
      (w: any) => w.id === watchlistId
    );
    expect(foundWatchlist).toBeDefined();

    // Step 4: User adds movie to watchlist
    const movie1 = { mediaType: 'movie', mediaId: 550, title: 'Fight Club' };
    const addItemResponse = await request(app)
      .post(`/api/watchlists/${watchlistId}/items`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-CSRF-Token', 'test')
      .send(movie1)
      .expect(201);

    expect(addItemResponse.body).toHaveProperty('message');

    // Step 5: User adds more movies to watchlist
    const movie2 = { mediaType: 'movie', mediaId: 13, title: 'Forrest Gump' };
    const movie3 = { mediaType: 'movie', mediaId: 680, title: 'Pulp Fiction' };

    await request(app)
      .post(`/api/watchlists/${watchlistId}/items`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-CSRF-Token', 'test')
      .send(movie2)
      .expect(201);

    await request(app)
      .post(`/api/watchlists/${watchlistId}/items`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-CSRF-Token', 'test')
      .send(movie3)
      .expect(201);

    // Step 6: User views watchlist details
    const watchlistDetailsResponse = await request(app)
      .get(`/api/watchlists/${watchlistId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-CSRF-Token', 'test')
      .expect(200);

    expect(watchlistDetailsResponse.body).toHaveProperty('watchlist');
    expect(watchlistDetailsResponse.body.watchlist).toHaveProperty('items');
    expect(watchlistDetailsResponse.body.watchlist.items.length).toBe(3);

    // Step 7: User updates watchlist metadata
    const updateResponse = await request(app)
      .put(`/api/watchlists/${watchlistId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-CSRF-Token', 'test')
      .send({
        name: 'Must Watch Classics - Updated',
        description: 'Updated description',
        isPublic: false
      })
      .expect(200);

    expect(updateResponse.body.watchlist.name).toBe('Must Watch Classics - Updated');
    expect(updateResponse.body.watchlist.isPublic).toBe(false);

    // Step 8: User removes an item from watchlist
    const removeItemResponse = await request(app)
      .delete(`/api/watchlists/${watchlistId}/items/movie/550`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-CSRF-Token', 'test')
      .expect(200);

    expect(removeItemResponse.body).toHaveProperty('message');

    // Step 9: Verify item was removed
    const verifyResponse = await request(app)
      .get(`/api/watchlists/${watchlistId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-CSRF-Token', 'test')
      .expect(200);

    expect(verifyResponse.body.watchlist.items.length).toBe(2);
    const hasMovie1 = verifyResponse.body.watchlist.items.some(
      (item: any) => item.mediaId === 550
    );
    expect(hasMovie1).toBe(false);

    // Step 10: User deletes the watchlist
    const deleteResponse = await request(app)
      .delete(`/api/watchlists/${watchlistId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-CSRF-Token', 'test')
      .expect(200);

    expect(deleteResponse.body).toHaveProperty('message');

    // Step 11: Verify watchlist is deleted
    await request(app)
      .get(`/api/watchlists/${watchlistId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-CSRF-Token', 'test')
      .expect(404);
  });

  it('should handle duplicate items gracefully', async () => {
    // Create watchlist
    const watchlistResponse = await request(app)
      .post('/api/watchlists')
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-CSRF-Token', 'test')
      .send({
        name: 'Test Duplicates',
        description: 'Testing duplicate items'
      })
      .expect(201);

    const testWatchlistId = watchlistResponse.body.watchlist.id;

    // Add item
    const movie = { mediaType: 'movie', mediaId: 551, title: 'The Matrix' };
    await request(app)
      .post(`/api/watchlists/${testWatchlistId}/items`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-CSRF-Token', 'test')
      .send(movie)
      .expect(201);

    // Try to add same item again
    const duplicateResponse = await request(app)
      .post(`/api/watchlists/${testWatchlistId}/items`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-CSRF-Token', 'test')
      .send(movie);

    expect([200, 409]).toContain(duplicateResponse.status);

    // Cleanup
    await request(app)
      .delete(`/api/watchlists/${testWatchlistId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-CSRF-Token', 'test');
  });

  it('should support multiple watchlists with different themes', async () => {
    // Create multiple watchlists
    const watchlist1 = await request(app)
      .post('/api/watchlists')
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-CSRF-Token', 'test')
      .send({ name: 'Action Movies', description: 'High-octane action' })
      .expect(201);

    const watchlist2 = await request(app)
      .post('/api/watchlists')
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-CSRF-Token', 'test')
      .send({ name: 'Comedies', description: 'Funny movies' })
      .expect(201);

    const watchlist3 = await request(app)
      .post('/api/watchlists')
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-CSRF-Token', 'test')
      .send({ name: 'Documentaries', description: 'Educational content' })
      .expect(201);

    // Verify all watchlists exist
    const allWatchlistsResponse = await request(app)
      .get('/api/watchlists')
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-CSRF-Token', 'test')
      .expect(200);

    expect(allWatchlistsResponse.body.watchlists.length).toBeGreaterThanOrEqual(3);

    // Cleanup
    const ids = [
      watchlist1.body.watchlist.id,
      watchlist2.body.watchlist.id,
      watchlist3.body.watchlist.id
    ];

    for (const id of ids) {
      await request(app)
        .delete(`/api/watchlists/${id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-CSRF-Token', 'test');
    }
  });

  it('should prevent unauthorized access to private watchlists', async () => {
    // Create another user
    const otherUser = {
      email: 'other@test.com',
      username: 'otheruser',
      password: 'OtherPassword123!'
    };

    await request(app)
      .post('/api/auth/signup')
      .set('X-CSRF-Token', 'test')
      .send(otherUser);

    const otherSignin = await request(app)
      .post('/api/auth/signin-jwt')
      .set('X-CSRF-Token', 'test')
      .send({
        identifier: otherUser.email,
        password: otherUser.password
      });

    const otherToken = otherSignin.body.accessToken;

    // Create private watchlist
    const privateWatchlist = await request(app)
      .post('/api/watchlists')
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-CSRF-Token', 'test')
      .send({
        name: 'Private Watchlist',
        isPublic: false
      })
      .expect(201);

    const privateId = privateWatchlist.body.watchlist.id;

    // Other user tries to access private watchlist
    const unauthorizedResponse = await request(app)
      .get(`/api/watchlists/${privateId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .set('X-CSRF-Token', 'test');

    expect([403, 404]).toContain(unauthorizedResponse.status);

    // Cleanup
    await request(app)
      .delete(`/api/watchlists/${privateId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-CSRF-Token', 'test');
  });
});
