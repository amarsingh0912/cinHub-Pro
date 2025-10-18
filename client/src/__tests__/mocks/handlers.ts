import { http, HttpResponse } from 'msw';

// Mock data fixtures
const mockMovies = [
  {
    id: 550,
    title: 'Fight Club',
    overview: 'A ticking-time-bomb insomniac and a slippery soap salesman...',
    poster_path: '/path/to/poster.jpg',
    backdrop_path: '/path/to/backdrop.jpg',
    vote_average: 8.4,
    release_date: '1999-10-15',
    genre_ids: [18, 53],
    popularity: 85.123,
    media_type: 'movie',
  },
  {
    id: 13,
    title: 'Forrest Gump',
    overview: 'A man with a low IQ has accomplished great things in his life...',
    poster_path: '/path/to/forrest.jpg',
    backdrop_path: '/path/to/forrest_backdrop.jpg',
    vote_average: 8.8,
    release_date: '1994-07-06',
    genre_ids: [35, 18, 10749],
    popularity: 92.456,
    media_type: 'movie',
  },
];

const mockTVShows = [
  {
    id: 1396,
    name: 'Breaking Bad',
    overview: 'A high school chemistry teacher turned meth cook...',
    poster_path: '/path/to/bb_poster.jpg',
    backdrop_path: '/path/to/bb_backdrop.jpg',
    vote_average: 9.5,
    first_air_date: '2008-01-20',
    genre_ids: [18, 80],
    popularity: 99.789,
    media_type: 'tv',
  },
];

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  username: 'testuser',
  displayName: 'Test User',
  firstName: 'Test',
  lastName: 'User',
  isAdmin: false,
  isVerified: true,
  providers: ['local'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockAccessToken = 'mock-access-token-12345';
const mockRefreshToken = 'mock-refresh-token-67890';

export const handlers = [
  // Auth endpoints
  http.get('/api/auth/user', () => {
    return HttpResponse.json(mockUser);
  }),

  http.post('/api/auth/signup', async ({ request }) => {
    const body = (await request.json()) as Record<string, any>;
    return HttpResponse.json({
      user: { ...mockUser, ...body },
      accessToken: mockAccessToken,
      refreshToken: mockRefreshToken,
    }, { status: 201 });
  }),

  http.post('/api/auth/signin', async ({ request }) => {
    const body = (await request.json()) as Record<string, any>;
    return HttpResponse.json({
      user: mockUser,
      accessToken: mockAccessToken,
      refreshToken: mockRefreshToken,
    });
  }),

  http.post('/api/auth/signin-jwt', async ({ request }) => {
    const body = (await request.json()) as Record<string, any>;
    return HttpResponse.json({
      user: mockUser,
      accessToken: mockAccessToken,
      refreshToken: mockRefreshToken,
    });
  }),

  http.post('/api/auth/login', async ({ request }) => {
    const body = (await request.json()) as Record<string, any>;
    return HttpResponse.json({
      user: mockUser,
      accessToken: mockAccessToken,
    });
  }),

  http.post('/api/auth/logout', () => {
    return HttpResponse.json({ success: true });
  }),

  http.post('/api/auth/refresh', () => {
    return HttpResponse.json({
      accessToken: mockAccessToken,
    });
  }),

  http.post('/api/auth/send-otp', async ({ request }) => {
    return HttpResponse.json({ success: true, message: 'OTP sent successfully' });
  }),

  http.post('/api/auth/verify-otp', async ({ request }) => {
    return HttpResponse.json({ success: true, verified: true });
  }),

  http.post('/api/auth/verify-signup-otp', async ({ request }) => {
    const body = (await request.json()) as Record<string, any>;
    return HttpResponse.json({
      user: mockUser,
      accessToken: mockAccessToken,
      refreshToken: mockRefreshToken,
    });
  }),

  http.post('/api/auth/reset-password', async ({ request }) => {
    return HttpResponse.json({ success: true, message: 'Password reset successfully' });
  }),

  // Movies endpoints
  http.get('/api/movies/trending', () => {
    return HttpResponse.json({
      page: 1,
      results: mockMovies,
      total_pages: 10,
      total_results: 200,
    });
  }),

  http.get('/api/movies/popular', () => {
    return HttpResponse.json({
      page: 1,
      results: mockMovies,
      total_pages: 10,
      total_results: 200,
    });
  }),

  http.get('/api/movies/:id', ({ params }) => {
    const movie = mockMovies.find(m => m.id === Number(params.id));
    if (!movie) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json({
      ...movie,
      runtime: 139,
      budget: 63000000,
      revenue: 100853753,
      genres: [{ id: 18, name: 'Drama' }],
      credits: {
        cast: [
          {
            id: 287,
            name: 'Brad Pitt',
            character: 'Tyler Durden',
            profile_path: '/path/to/brad.jpg',
          },
        ],
      },
    });
  }),

  // TV endpoints
  http.get('/api/tv/trending', () => {
    return HttpResponse.json({
      page: 1,
      results: mockTVShows,
      total_pages: 10,
      total_results: 200,
    });
  }),

  http.get('/api/tv/:id', ({ params }) => {
    const show = mockTVShows.find(s => s.id === Number(params.id));
    if (!show) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json({
      ...show,
      number_of_seasons: 5,
      number_of_episodes: 62,
      genres: [{ id: 18, name: 'Drama' }],
      credits: {
        cast: [
          {
            id: 17419,
            name: 'Bryan Cranston',
            character: 'Walter White',
            profile_path: '/path/to/bryan.jpg',
          },
        ],
      },
    });
  }),

  // Search endpoint
  http.get('/api/search', ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('query');
    
    if (!query) {
      return HttpResponse.json({
        page: 1,
        results: [],
        total_pages: 0,
        total_results: 0,
      });
    }

    const results = [...mockMovies, ...mockTVShows].filter(item =>
      ('title' in item ? item.title : item.name)
        .toLowerCase()
        .includes(query.toLowerCase())
    );

    return HttpResponse.json({
      page: 1,
      results,
      total_pages: 1,
      total_results: results.length,
    });
  }),

  // Favorites endpoints
  http.get('/api/favorites', () => {
    return HttpResponse.json([]);
  }),

  http.post('/api/favorites', async ({ request }) => {
    const body = (await request.json()) as Record<string, any>;
    return HttpResponse.json({
      id: 'favorite-123',
      ...body,
      createdAt: new Date().toISOString(),
    }, { status: 201 });
  }),

  http.delete('/api/favorites/:id', ({ params }) => {
    return HttpResponse.json({ success: true });
  }),

  http.get('/api/favorites/:mediaType/:mediaId/check', () => {
    return HttpResponse.json({ isFavorite: false });
  }),

  // Watchlists endpoints
  http.get('/api/watchlists', () => {
    return HttpResponse.json([
      {
        id: 'watchlist-1',
        userId: mockUser.id,
        name: 'My Watchlist',
        description: 'Movies to watch',
        isPublic: false,
        createdAt: new Date().toISOString(),
      },
    ]);
  }),

  http.post('/api/watchlists', async ({ request }) => {
    const body = (await request.json()) as Record<string, any>;
    return HttpResponse.json({
      id: 'watchlist-new',
      userId: mockUser.id,
      ...body,
      createdAt: new Date().toISOString(),
    }, { status: 201 });
  }),

  // Reviews endpoints
  http.get('/api/reviews/:mediaType/:mediaId', () => {
    return HttpResponse.json([]);
  }),

  http.post('/api/reviews', async ({ request }) => {
    const body = (await request.json()) as Record<string, any>;
    return HttpResponse.json({
      id: 'review-123',
      userId: mockUser.id,
      ...body,
      createdAt: new Date().toISOString(),
    }, { status: 201 });
  }),

  // Search history
  http.get('/api/search-history', () => {
    return HttpResponse.json([]);
  }),

  http.post('/api/search-history', async ({ request }) => {
    return HttpResponse.json({ success: true }, { status: 201 });
  }),

  // Activity history
  http.post('/api/activity-history', async ({ request }) => {
    return HttpResponse.json({ success: true }, { status: 201 });
  }),

  http.get('/api/activity-history', () => {
    return HttpResponse.json([]);
  }),

  // Watchlist items
  http.get('/api/watchlists/:id', ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      userId: mockUser.id,
      name: 'Test Watchlist',
      description: 'Test description',
      isPublic: false,
      items: [],
      createdAt: new Date().toISOString(),
    });
  }),

  http.patch('/api/watchlists/:id', async ({ params, request }) => {
    const body = (await request.json()) as Record<string, any>;
    return HttpResponse.json({
      id: params.id,
      userId: mockUser.id,
      ...body,
      updatedAt: new Date().toISOString(),
    });
  }),

  http.delete('/api/watchlists/:id', () => {
    return HttpResponse.json({ success: true });
  }),

  http.post('/api/watchlists/:id/items', async ({ params, request }) => {
    const body = (await request.json()) as Record<string, any>;
    return HttpResponse.json({
      id: 'item-123',
      watchlistId: params.id,
      ...body,
      createdAt: new Date().toISOString(),
    }, { status: 201 });
  }),

  http.delete('/api/watchlists/:watchlistId/items/:itemId', () => {
    return HttpResponse.json({ success: true });
  }),

  http.get('/api/watchlists/:id/items', () => {
    return HttpResponse.json([]);
  }),

  // Reviews CRUD
  http.get('/api/reviews/user', () => {
    return HttpResponse.json([]);
  }),

  http.patch('/api/reviews/:id', async ({ params, request }) => {
    const body = (await request.json()) as Record<string, any>;
    return HttpResponse.json({
      id: params.id,
      userId: mockUser.id,
      ...body,
      updatedAt: new Date().toISOString(),
    });
  }),

  http.delete('/api/reviews/:id', () => {
    return HttpResponse.json({ success: true });
  }),

  // User preferences
  http.get('/api/users/preferences', () => {
    return HttpResponse.json({
      theme: 'dark',
      language: 'en',
    });
  }),

  http.put('/api/users/preferences', async ({ request }) => {
    const body = (await request.json()) as Record<string, any>;
    return HttpResponse.json({
      ...body,
      updatedAt: new Date().toISOString(),
    });
  }),

  // User profile
  http.patch('/api/users/profile', async ({ request }) => {
    const body = (await request.json()) as Record<string, any>;
    return HttpResponse.json({
      ...mockUser,
      ...body,
      updatedAt: new Date().toISOString(),
    });
  }),

  http.post('/api/users/avatar', async ({ request }) => {
    return HttpResponse.json({
      profileImageUrl: 'https://res.cloudinary.com/test/image/upload/v123/avatar.jpg',
      success: true,
    });
  }),

  http.delete('/api/users/avatar', () => {
    return HttpResponse.json({ success: true });
  }),

  // Admin endpoints
  http.get('/api/admin/users', () => {
    return HttpResponse.json({
      users: [mockUser],
      total: 1,
      page: 1,
      totalPages: 1,
    });
  }),

  http.get('/api/admin/users/:id', ({ params }) => {
    return HttpResponse.json(mockUser);
  }),

  http.patch('/api/admin/users/:id', async ({ params, request }) => {
    const body = (await request.json()) as Record<string, any>;
    return HttpResponse.json({
      ...mockUser,
      ...body,
      updatedAt: new Date().toISOString(),
    });
  }),

  http.delete('/api/admin/users/:id', () => {
    return HttpResponse.json({ success: true });
  }),

  http.get('/api/admin/stats', () => {
    return HttpResponse.json({
      totalUsers: 100,
      totalMovies: 500,
      totalReviews: 250,
      activeUsers: 75,
    });
  }),

  // Discover endpoints
  http.get('/api/discover/movie', ({ request }) => {
    return HttpResponse.json({
      page: 1,
      results: mockMovies,
      total_pages: 10,
      total_results: 200,
    });
  }),

  http.get('/api/discover/tv', ({ request }) => {
    return HttpResponse.json({
      page: 1,
      results: mockTVShows,
      total_pages: 10,
      total_results: 200,
    });
  }),

  // Genre endpoints
  http.get('/api/genre/movie/list', () => {
    return HttpResponse.json({
      genres: [
        { id: 28, name: 'Action' },
        { id: 12, name: 'Adventure' },
        { id: 18, name: 'Drama' },
      ],
    });
  }),

  http.get('/api/genre/tv/list', () => {
    return HttpResponse.json({
      genres: [
        { id: 10759, name: 'Action & Adventure' },
        { id: 18, name: 'Drama' },
        { id: 10765, name: 'Sci-Fi & Fantasy' },
      ],
    });
  }),

  // Person endpoints
  http.get('/api/person/:id', ({ params }) => {
    return HttpResponse.json({
      id: Number(params.id),
      name: 'Brad Pitt',
      biography: 'An American actor and film producer...',
      birthday: '1963-12-18',
      place_of_birth: 'Shawnee, Oklahoma, USA',
      profile_path: '/path/to/brad.jpg',
      known_for_department: 'Acting',
    });
  }),

  http.get('/api/person/:id/combined_credits', ({ params }) => {
    return HttpResponse.json({
      cast: mockMovies,
      crew: [],
    });
  }),

  // Collection endpoints
  http.get('/api/collection/:id', ({ params }) => {
    return HttpResponse.json({
      id: Number(params.id),
      name: 'The Matrix Collection',
      overview: 'The complete Matrix saga...',
      poster_path: '/path/to/collection.jpg',
      backdrop_path: '/path/to/collection_backdrop.jpg',
      parts: mockMovies,
    });
  }),

  // More TV endpoints
  http.get('/api/tv/popular', () => {
    return HttpResponse.json({
      page: 1,
      results: mockTVShows,
      total_pages: 10,
      total_results: 200,
    });
  }),

  http.get('/api/tv/top-rated', () => {
    return HttpResponse.json({
      page: 1,
      results: mockTVShows,
      total_pages: 10,
      total_results: 200,
    });
  }),

  http.get('/api/tv/on-the-air', () => {
    return HttpResponse.json({
      page: 1,
      results: mockTVShows,
      total_pages: 10,
      total_results: 200,
    });
  }),

  http.get('/api/tv/airing_today', () => {
    return HttpResponse.json({
      page: 1,
      results: mockTVShows,
      total_pages: 10,
      total_results: 200,
    });
  }),

  // More movie endpoints
  http.get('/api/movies/now-playing', () => {
    return HttpResponse.json({
      page: 1,
      results: mockMovies,
      total_pages: 10,
      total_results: 200,
    });
  }),

  http.get('/api/movies/upcoming', () => {
    return HttpResponse.json({
      page: 1,
      results: mockMovies,
      total_pages: 10,
      total_results: 200,
    });
  }),

  http.get('/api/movies/top-rated', () => {
    return HttpResponse.json({
      page: 1,
      results: mockMovies,
      total_pages: 10,
      total_results: 200,
    });
  }),

  // Cache status endpoints
  http.get('/api/cache/status', () => {
    return HttpResponse.json({
      queue: {
        pending: 0,
        active: 0,
        completed: 10,
      },
      cacheHitRate: 0.85,
      totalCached: 150,
    });
  }),

  http.get('/api/cache/stats', () => {
    return HttpResponse.json({
      movies: 75,
      tvShows: 50,
      images: 200,
      lastUpdated: new Date().toISOString(),
    });
  }),

  // WebSocket endpoints (for non-WS clients)
  http.get('/ws/cache-status', () => {
    return HttpResponse.json({ message: 'WebSocket endpoint' });
  }),

  // Admin analytics
  http.get('/api/admin/analytics', () => {
    return HttpResponse.json({
      userGrowth: [
        { date: '2025-01-01', count: 50 },
        { date: '2025-01-02', count: 65 },
      ],
      popularMovies: mockMovies,
      activeUsers: 75,
      newReviews: 25,
    });
  }),

  http.get('/api/admin/logs', () => {
    return HttpResponse.json({
      logs: [
        { id: '1', level: 'info', message: 'User logged in', timestamp: new Date().toISOString() },
      ],
      total: 1,
      page: 1,
    });
  }),

  // TMDB external API mocks for integration tests
  http.get('https://api.themoviedb.org/3/search/multi', ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('query');
    
    return HttpResponse.json({
      page: 1,
      results: query === 'inception' ? mockMovies : [],
      total_pages: 1,
      total_results: query === 'inception' ? mockMovies.length : 0,
    });
  }),

  http.get('https://api.themoviedb.org/3/discover/movie', ({ request }) => {
    return HttpResponse.json({
      page: 1,
      results: mockMovies,
      total_pages: 100,
      total_results: 2000,
    });
  }),

  http.get('https://api.themoviedb.org/3/discover/tv', ({ request }) => {
    return HttpResponse.json({
      page: 1,
      results: mockTVShows,
      total_pages: 50,
      total_results: 1000,
    });
  }),

  http.get('https://api.themoviedb.org/3/movie/:id', ({ params }) => {
    return HttpResponse.json({
      ...mockMovies[0],
      id: Number(params.id),
      runtime: 139,
      budget: 63000000,
      revenue: 100853753,
    });
  }),

  http.get('https://api.themoviedb.org/3/tv/:id', ({ params }) => {
    return HttpResponse.json({
      ...mockTVShows[0],
      id: Number(params.id),
      number_of_seasons: 5,
      number_of_episodes: 62,
    });
  }),
];
