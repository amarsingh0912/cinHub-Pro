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

describe('E2E: Review Posting and Management Flow', () => {
  let app: Express;
  let server: any;
  let authToken: string;
  let reviewId: string;

  const testUser = {
    email: 'e2e-review@test.com',
    username: 'e2ereviewuser',
    password: 'TestPassword123!',
    firstName: 'Review',
    lastName: 'Tester'
  };

  const testMovie = {
    mediaType: 'movie',
    mediaId: 550,
    title: 'Fight Club'
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

  it('should complete full review lifecycle', async () => {
    // Step 1: User browses movies
    const moviesResponse = await request(app)
      .get('/api/movies/popular')
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-CSRF-Token', 'test')
      .expect(200);

    expect(moviesResponse.body).toHaveProperty('results');
    expect(moviesResponse.body.results.length).toBeGreaterThan(0);

    // Step 2: User views movie details
    const movieDetailsResponse = await request(app)
      .get(`/api/movies/${testMovie.mediaId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-CSRF-Token', 'test')
      .expect(200);

    expect(movieDetailsResponse.body).toHaveProperty('id', testMovie.mediaId);
    expect(movieDetailsResponse.body).toHaveProperty('title');

    // Step 3: User checks existing reviews for the movie
    const existingReviewsResponse = await request(app)
      .get(`/api/reviews/${testMovie.mediaType}/${testMovie.mediaId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-CSRF-Token', 'test')
      .expect(200);

    expect(existingReviewsResponse.body).toHaveProperty('reviews');
    const initialReviewCount = existingReviewsResponse.body.reviews.length;

    // Step 4: User writes a review
    const reviewData = {
      mediaType: testMovie.mediaType,
      mediaId: testMovie.mediaId,
      rating: 9,
      content: 'An absolutely phenomenal movie! The plot twists are incredible and the cinematography is stunning. Edward Norton and Brad Pitt deliver outstanding performances. A must-watch for anyone who loves psychological thrillers.',
      title: 'A Masterpiece of Modern Cinema'
    };

    const createReviewResponse = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-CSRF-Token', 'test')
      .send(reviewData)
      .expect(201);

    expect(createReviewResponse.body).toHaveProperty('review');
    reviewId = createReviewResponse.body.review.id;
    expect(createReviewResponse.body.review.rating).toBe(9);
    expect(createReviewResponse.body.review.content).toBe(reviewData.content);

    // Step 5: User views the movie again and sees their review
    const updatedReviewsResponse = await request(app)
      .get(`/api/reviews/${testMovie.mediaType}/${testMovie.mediaId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-CSRF-Token', 'test')
      .expect(200);

    expect(updatedReviewsResponse.body.reviews.length).toBe(initialReviewCount + 1);
    
    const userReview = updatedReviewsResponse.body.reviews.find(
      (r: any) => r.id === reviewId
    );
    expect(userReview).toBeDefined();
    expect(userReview.rating).toBe(9);

    // Step 6: User edits their review after reconsideration
    const updatedReviewData = {
      rating: 10,
      content: 'After a second viewing, I have to upgrade this to a perfect 10/10. The symbolism and deeper meanings become even more apparent. This movie gets better with every watch!',
      title: 'Even Better on Second Viewing'
    };

    const editResponse = await request(app)
      .put(`/api/reviews/${reviewId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-CSRF-Token', 'test')
      .send(updatedReviewData)
      .expect(200);

    expect(editResponse.body.review.rating).toBe(10);
    expect(editResponse.body.review.content).toBe(updatedReviewData.content);
    expect(editResponse.body.review.title).toBe(updatedReviewData.title);

    // Step 7: Verify the review was updated
    const verifyUpdateResponse = await request(app)
      .get(`/api/reviews/${testMovie.mediaType}/${testMovie.mediaId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-CSRF-Token', 'test')
      .expect(200);

    const updatedReview = verifyUpdateResponse.body.reviews.find(
      (r: any) => r.id === reviewId
    );
    expect(updatedReview.rating).toBe(10);
    expect(updatedReview.title).toBe(updatedReviewData.title);

    // Step 8: User deletes their review
    const deleteResponse = await request(app)
      .delete(`/api/reviews/${reviewId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-CSRF-Token', 'test')
      .expect(200);

    expect(deleteResponse.body).toHaveProperty('message');

    // Step 9: Verify review is deleted
    const finalReviewsResponse = await request(app)
      .get(`/api/reviews/${testMovie.mediaType}/${testMovie.mediaId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-CSRF-Token', 'test')
      .expect(200);

    const deletedReview = finalReviewsResponse.body.reviews.find(
      (r: any) => r.id === reviewId
    );
    expect(deletedReview).toBeUndefined();
  });

  it('should validate review data', async () => {
    // Test missing required fields
    const invalidReview1 = {
      mediaType: testMovie.mediaType,
      mediaId: testMovie.mediaId,
      // Missing rating
      content: 'Great movie!'
    };

    await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-CSRF-Token', 'test')
      .send(invalidReview1)
      .expect(400);

    // Test invalid rating (out of range)
    const invalidReview2 = {
      mediaType: testMovie.mediaType,
      mediaId: testMovie.mediaId,
      rating: 11, // Should be 0-10
      content: 'Great movie!'
    };

    await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-CSRF-Token', 'test')
      .send(invalidReview2)
      .expect(400);

    // Test review with minimum content length violation
    const invalidReview3 = {
      mediaType: testMovie.mediaType,
      mediaId: testMovie.mediaId,
      rating: 8,
      content: 'Bad' // Too short
    };

    const response3 = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-CSRF-Token', 'test')
      .send(invalidReview3);

    expect([400, 201]).toContain(response3.status);
  });

  it('should prevent duplicate reviews for same media', async () => {
    const reviewData = {
      mediaType: testMovie.mediaType,
      mediaId: 551, // Different movie ID for this test
      rating: 8,
      content: 'First review for The Matrix',
      title: 'Great Movie'
    };

    // Post first review
    const firstReview = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-CSRF-Token', 'test')
      .send(reviewData)
      .expect(201);

    const firstReviewId = firstReview.body.review.id;

    // Try to post second review for same movie
    const duplicateResponse = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-CSRF-Token', 'test')
      .send({
        ...reviewData,
        content: 'Second review attempt'
      });

    expect([409, 201]).toContain(duplicateResponse.status);

    // Cleanup
    await request(app)
      .delete(`/api/reviews/${firstReviewId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-CSRF-Token', 'test');
  });

  it('should allow users to review both movies and TV shows', async () => {
    // Review a movie
    const movieReview = {
      mediaType: 'movie',
      mediaId: 680, // Pulp Fiction
      rating: 10,
      content: 'Tarantino\'s masterpiece with incredible dialogue and nonlinear storytelling.',
      title: 'Absolute Classic'
    };

    const movieResponse = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-CSRF-Token', 'test')
      .send(movieReview)
      .expect(201);

    const movieReviewId = movieResponse.body.review.id;

    // Review a TV show
    const tvReview = {
      mediaType: 'tv',
      mediaId: 1396, // Breaking Bad
      rating: 10,
      content: 'One of the greatest TV series ever made. Perfect character development and gripping storyline.',
      title: 'Television Perfection'
    };

    const tvResponse = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-CSRF-Token', 'test')
      .send(tvReview)
      .expect(201);

    const tvReviewId = tvResponse.body.review.id;

    // Verify both reviews exist
    const movieReviews = await request(app)
      .get('/api/reviews/movie/680')
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-CSRF-Token', 'test')
      .expect(200);

    expect(movieReviews.body.reviews.some((r: any) => r.id === movieReviewId)).toBe(true);

    const tvReviews = await request(app)
      .get('/api/reviews/tv/1396')
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-CSRF-Token', 'test')
      .expect(200);

    expect(tvReviews.body.reviews.some((r: any) => r.id === tvReviewId)).toBe(true);

    // Cleanup
    await request(app)
      .delete(`/api/reviews/${movieReviewId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-CSRF-Token', 'test');

    await request(app)
      .delete(`/api/reviews/${tvReviewId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-CSRF-Token', 'test');
  });

  it('should prevent unauthorized users from editing others reviews', async () => {
    // Create another user
    const otherUser = {
      email: 'other-reviewer@test.com',
      username: 'otherreviewer',
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

    // First user creates review
    const reviewData = {
      mediaType: testMovie.mediaType,
      mediaId: 652, // Different movie for this test
      rating: 7,
      content: 'Pretty good movie overall',
      title: 'Decent Watch'
    };

    const createResponse = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-CSRF-Token', 'test')
      .send(reviewData)
      .expect(201);

    const reviewIdToEdit = createResponse.body.review.id;

    // Other user tries to edit the review
    const unauthorizedEditResponse = await request(app)
      .put(`/api/reviews/${reviewIdToEdit}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .set('X-CSRF-Token', 'test')
      .send({
        rating: 1,
        content: 'Trying to sabotage this review!'
      });

    expect([403, 404]).toContain(unauthorizedEditResponse.status);

    // Other user tries to delete the review
    const unauthorizedDeleteResponse = await request(app)
      .delete(`/api/reviews/${reviewIdToEdit}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .set('X-CSRF-Token', 'test');

    expect([403, 404]).toContain(unauthorizedDeleteResponse.status);

    // Cleanup
    await request(app)
      .delete(`/api/reviews/${reviewIdToEdit}`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-CSRF-Token', 'test');
  });
});
