/**
 * Test data factories using a simple approach
 * These generate realistic test data with customizable properties
 */

let movieIdCounter = 1000;
let tvShowIdCounter = 2000;
let userIdCounter = 1;

// Simple random string generator
function randomString(length: number = 10): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// Simple random number generator
function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Simple random date generator
function randomDate(start: Date, end: Date): string {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().split('T')[0];
}

export function createMovie(overrides?: any) {
  const id = overrides?.id ?? movieIdCounter++;
  const title = overrides?.title ?? `Movie ${id}`;
  
  return {
    id,
    title,
    overview: overrides?.overview ?? `This is the overview for ${title}`,
    poster_path: overrides?.poster_path ?? `/poster-${id}.jpg`,
    backdrop_path: overrides?.backdrop_path ?? `/backdrop-${id}.jpg`,
    vote_average: overrides?.vote_average ?? randomNumber(5, 10) / 1.0,
    vote_count: overrides?.vote_count ?? randomNumber(100, 10000),
    release_date: overrides?.release_date ?? randomDate(new Date('1990-01-01'), new Date()),
    genre_ids: overrides?.genre_ids ?? [18, 28],
    popularity: overrides?.popularity ?? randomNumber(10, 100),
    adult: overrides?.adult ?? false,
    original_language: overrides?.original_language ?? 'en',
    original_title: overrides?.original_title ?? title,
    video: overrides?.video ?? false,
    ...overrides,
  };
}

export function createMovieDetails(overrides?: any) {
  const movie = createMovie(overrides);
  
  return {
    ...movie,
    runtime: overrides?.runtime ?? randomNumber(90, 180),
    budget: overrides?.budget ?? randomNumber(1000000, 100000000),
    revenue: overrides?.revenue ?? randomNumber(1000000, 500000000),
    status: overrides?.status ?? 'Released',
    tagline: overrides?.tagline ?? `A great tagline for ${movie.title}`,
    genres: overrides?.genres ?? [
      { id: 18, name: 'Drama' },
      { id: 28, name: 'Action' },
    ],
    production_companies: overrides?.production_companies ?? [
      {
        id: 1,
        logo_path: '/logo.png',
        name: 'Production Company',
        origin_country: 'US',
      },
    ],
    credits: overrides?.credits ?? {
      cast: [
        {
          id: 1,
          name: 'Actor Name',
          character: 'Character Name',
          profile_path: '/actor.jpg',
          order: 0,
        },
      ],
      crew: [
        {
          id: 2,
          name: 'Director Name',
          job: 'Director',
          department: 'Directing',
          profile_path: '/director.jpg',
        },
      ],
    },
    videos: overrides?.videos ?? {
      results: [
        {
          id: 'video-1',
          key: 'dQw4w9WgXcQ',
          name: `${movie.title} - Trailer`,
          site: 'YouTube',
          type: 'Trailer',
        },
      ],
    },
    similar: overrides?.similar ?? { results: [] },
    recommendations: overrides?.recommendations ?? { results: [] },
  };
}

export function createTVShow(overrides?: any) {
  const id = overrides?.id ?? tvShowIdCounter++;
  const name = overrides?.name ?? `TV Show ${id}`;
  
  return {
    id,
    name,
    overview: overrides?.overview ?? `This is the overview for ${name}`,
    poster_path: overrides?.poster_path ?? `/tv-poster-${id}.jpg`,
    backdrop_path: overrides?.backdrop_path ?? `/tv-backdrop-${id}.jpg`,
    vote_average: overrides?.vote_average ?? randomNumber(5, 10) / 1.0,
    vote_count: overrides?.vote_count ?? randomNumber(100, 5000),
    first_air_date: overrides?.first_air_date ?? randomDate(new Date('2000-01-01'), new Date()),
    genre_ids: overrides?.genre_ids ?? [18, 10765],
    popularity: overrides?.popularity ?? randomNumber(10, 100),
    origin_country: overrides?.origin_country ?? ['US'],
    original_language: overrides?.original_language ?? 'en',
    original_name: overrides?.original_name ?? name,
    ...overrides,
  };
}

export function createTVShowDetails(overrides?: any) {
  const show = createTVShow(overrides);
  
  return {
    ...show,
    number_of_seasons: overrides?.number_of_seasons ?? randomNumber(1, 10),
    number_of_episodes: overrides?.number_of_episodes ?? randomNumber(10, 100),
    status: overrides?.status ?? 'Ended',
    type: overrides?.type ?? 'Scripted',
    last_air_date: overrides?.last_air_date ?? randomDate(new Date('2010-01-01'), new Date()),
    in_production: overrides?.in_production ?? false,
    genres: overrides?.genres ?? [
      { id: 18, name: 'Drama' },
    ],
    created_by: overrides?.created_by ?? [
      {
        id: 1,
        name: 'Creator Name',
        profile_path: '/creator.jpg',
      },
    ],
    credits: overrides?.credits ?? {
      cast: [
        {
          id: 1,
          name: 'Actor Name',
          character: 'Character Name',
          profile_path: '/actor.jpg',
          order: 0,
        },
      ],
    },
    videos: overrides?.videos ?? {
      results: [
        {
          id: 'video-1',
          key: 'dQw4w9WgXcQ',
          name: `${show.name} - Trailer`,
          site: 'YouTube',
          type: 'Trailer',
        },
      ],
    },
  };
}

export function createUser(overrides?: any) {
  const id = overrides?.id ?? `user-${userIdCounter++}`;
  const username = overrides?.username ?? `user${randomString(8)}`;
  
  return {
    id,
    email: overrides?.email ?? `${username}@example.com`,
    username,
    displayName: overrides?.displayName ?? username,
    isAdmin: overrides?.isAdmin ?? false,
    profilePicture: overrides?.profilePicture ?? null,
    bio: overrides?.bio ?? null,
    phoneNumber: overrides?.phoneNumber ?? null,
    emailVerified: overrides?.emailVerified ?? true,
    phoneVerified: overrides?.phoneVerified ?? false,
    createdAt: overrides?.createdAt ?? new Date().toISOString(),
    updatedAt: overrides?.updatedAt ?? new Date().toISOString(),
    ...overrides,
  };
}

export function createFavorite(overrides?: any) {
  return {
    id: overrides?.id ?? `favorite-${randomString(8)}`,
    userId: overrides?.userId ?? 'user-123',
    mediaType: overrides?.mediaType ?? 'movie',
    mediaId: overrides?.mediaId ?? 550,
    mediaTitle: overrides?.mediaTitle ?? 'Movie Title',
    mediaPosterPath: overrides?.mediaPosterPath ?? '/poster.jpg',
    createdAt: overrides?.createdAt ?? new Date().toISOString(),
    ...overrides,
  };
}

export function createWatchlist(overrides?: any) {
  return {
    id: overrides?.id ?? `watchlist-${randomString(8)}`,
    userId: overrides?.userId ?? 'user-123',
    name: overrides?.name ?? 'My Watchlist',
    description: overrides?.description ?? 'A collection of movies to watch',
    isPublic: overrides?.isPublic ?? false,
    createdAt: overrides?.createdAt ?? new Date().toISOString(),
    updatedAt: overrides?.updatedAt ?? new Date().toISOString(),
    ...overrides,
  };
}

export function createReview(overrides?: any) {
  return {
    id: overrides?.id ?? `review-${randomString(8)}`,
    userId: overrides?.userId ?? 'user-123',
    mediaType: overrides?.mediaType ?? 'movie',
    mediaId: overrides?.mediaId ?? 550,
    rating: overrides?.rating ?? randomNumber(1, 5),
    review: overrides?.review ?? 'This is a great movie!',
    isPublic: overrides?.isPublic ?? true,
    mediaTitle: overrides?.mediaTitle ?? 'Movie Title',
    mediaPosterPath: overrides?.mediaPosterPath ?? '/poster.jpg',
    createdAt: overrides?.createdAt ?? new Date().toISOString(),
    updatedAt: overrides?.updatedAt ?? new Date().toISOString(),
    ...overrides,
  };
}

// Batch creators
export function createMovies(count: number, overrides?: any): any[] {
  return Array.from({ length: count }, (_, i) => 
    createMovie({ ...overrides, id: (overrides?.id ?? 1000) + i })
  );
}

export function createTVShows(count: number, overrides?: any): any[] {
  return Array.from({ length: count }, (_, i) => 
    createTVShow({ ...overrides, id: (overrides?.id ?? 2000) + i })
  );
}

export function createMoviesResponse(count: number = 20, page: number = 1, overrides?: any) {
  return {
    page,
    results: createMovies(count, overrides),
    total_pages: overrides?.total_pages ?? 100,
    total_results: overrides?.total_results ?? 2000,
  };
}

export function createTVShowsResponse(count: number = 20, page: number = 1, overrides?: any) {
  return {
    page,
    results: createTVShows(count, overrides),
    total_pages: overrides?.total_pages ?? 50,
    total_results: overrides?.total_results ?? 1000,
  };
}
