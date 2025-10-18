/**
 * Test fixtures for movies and TV shows
 * These provide consistent test data across the test suite
 */

export const mockMovie = {
  id: 550,
  title: 'Fight Club',
  overview: 'A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy.',
  poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
  backdrop_path: '/hZkgoQYus5vegHoetLkCJzb17zJ.jpg',
  vote_average: 8.4,
  vote_count: 26000,
  release_date: '1999-10-15',
  genre_ids: [18, 53],
  popularity: 85.123,
  adult: false,
  original_language: 'en',
  original_title: 'Fight Club',
  video: false,
};

export const mockMovieDetails = {
  ...mockMovie,
  runtime: 139,
  budget: 63000000,
  revenue: 100853753,
  status: 'Released',
  tagline: 'Mischief. Mayhem. Soap.',
  genres: [
    { id: 18, name: 'Drama' },
    { id: 53, name: 'Thriller' },
  ],
  production_companies: [
    {
      id: 508,
      logo_path: '/7PzJdsLGlR7oW4J0J5Xcd0pHGRg.png',
      name: '20th Century Fox',
      origin_country: 'US',
    },
  ],
  credits: {
    cast: [
      {
        id: 287,
        name: 'Brad Pitt',
        character: 'Tyler Durden',
        profile_path: '/cckcYc2v0yh1tc9QjRelptcOBko.jpg',
        order: 0,
      },
      {
        id: 819,
        name: 'Edward Norton',
        character: 'The Narrator',
        profile_path: '/5XBzD5WuTyVQZeS4VI25z2moMeY.jpg',
        order: 1,
      },
    ],
    crew: [
      {
        id: 7467,
        name: 'David Fincher',
        job: 'Director',
        department: 'Directing',
        profile_path: '/tpEczFclQZeKAiCeKZZ0adRvtfz.jpg',
      },
    ],
  },
  videos: {
    results: [
      {
        id: '5c9294240e0a267cd516835f',
        key: 'SUXWAEX2jlg',
        name: 'Fight Club - Trailer',
        site: 'YouTube',
        type: 'Trailer',
      },
    ],
  },
  similar: {
    results: [mockMovie],
  },
  recommendations: {
    results: [mockMovie],
  },
};

export const mockTVShow = {
  id: 1396,
  name: 'Breaking Bad',
  overview: 'A high school chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine.',
  poster_path: '/3xnWaLQjelJDDF7LT1WBo6f4BRe.jpg',
  backdrop_path: '/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg',
  vote_average: 9.5,
  vote_count: 12000,
  first_air_date: '2008-01-20',
  genre_ids: [18, 80],
  popularity: 99.789,
  origin_country: ['US'],
  original_language: 'en',
  original_name: 'Breaking Bad',
};

export const mockTVShowDetails = {
  ...mockTVShow,
  number_of_seasons: 5,
  number_of_episodes: 62,
  status: 'Ended',
  type: 'Scripted',
  last_air_date: '2013-09-29',
  in_production: false,
  genres: [
    { id: 18, name: 'Drama' },
    { id: 80, name: 'Crime' },
  ],
  created_by: [
    {
      id: 66633,
      name: 'Vince Gilligan',
      profile_path: '/rLSUjr725ez1cK7SKVxC9udO03Y.jpg',
    },
  ],
  credits: {
    cast: [
      {
        id: 17419,
        name: 'Bryan Cranston',
        character: 'Walter White',
        profile_path: '/7Jahy5LZX2Fo8fGJltMhtqKRi2B.jpg',
        order: 0,
      },
      {
        id: 134531,
        name: 'Aaron Paul',
        character: 'Jesse Pinkman',
        profile_path: '/lOhc8fGqajxDPRs6LXhg6lPM5SI.jpg',
        order: 1,
      },
    ],
  },
  videos: {
    results: [
      {
        id: '533ec654c3a36854480003eb',
        key: 'HhesaQXLuRY',
        name: 'Breaking Bad - Trailer',
        site: 'YouTube',
        type: 'Trailer',
      },
    ],
  },
};

export const mockMoviesResponse = {
  page: 1,
  results: [mockMovie, { ...mockMovie, id: 13, title: 'Forrest Gump' }],
  total_pages: 100,
  total_results: 2000,
};

export const mockTVShowsResponse = {
  page: 1,
  results: [mockTVShow],
  total_pages: 50,
  total_results: 1000,
};

export const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  username: 'testuser',
  displayName: 'Test User',
  isAdmin: false,
  profilePicture: null,
  bio: null,
  phoneNumber: null,
  emailVerified: true,
  phoneVerified: false,
  createdAt: new Date('2024-01-01').toISOString(),
  updatedAt: new Date('2024-01-01').toISOString(),
};

export const mockFavorite = {
  id: 'favorite-1',
  userId: mockUser.id,
  mediaType: 'movie' as const,
  mediaId: 550,
  mediaTitle: 'Fight Club',
  mediaPosterPath: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
  createdAt: new Date().toISOString(),
};

export const mockWatchlist = {
  id: 'watchlist-1',
  userId: mockUser.id,
  name: 'My Watchlist',
  description: 'Movies to watch',
  isPublic: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockReview = {
  id: 'review-1',
  userId: mockUser.id,
  mediaType: 'movie' as const,
  mediaId: 550,
  rating: 5,
  review: 'Amazing movie! A masterpiece of modern cinema.',
  isPublic: true,
  mediaTitle: 'Fight Club',
  mediaPosterPath: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
