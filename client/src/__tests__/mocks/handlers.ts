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
  },
];

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  username: 'testuser',
  displayName: 'Test User',
  isAdmin: false,
  createdAt: new Date().toISOString(),
};

export const handlers = [
  // Auth endpoints
  http.get('/api/auth/user', () => {
    return HttpResponse.json(mockUser);
  }),

  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      user: mockUser,
      accessToken: 'mock-access-token',
    });
  }),

  http.post('/api/auth/logout', () => {
    return HttpResponse.json({ success: true });
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
    const body = await request.json();
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
    const body = await request.json();
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
    const body = await request.json();
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
];
