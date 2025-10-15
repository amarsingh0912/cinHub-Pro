/**
 * Utility functions for TMDB Discover API
 * Provides unified parameter generation for movies and TV shows based on categories
 */

export type MovieCategory = 'upcoming' | 'now_playing' | 'popular' | 'trending' | 'top_rated';
export type TVCategory = 'airing_today' | 'on_the_air' | 'popular' | 'trending' | 'top_rated';

interface DiscoverParams {
  page?: number;
  sort_by?: string;
  'primary_release_date.gte'?: string;
  'primary_release_date.lte'?: string;
  'release_date.gte'?: string;
  'release_date.lte'?: string;
  'air_date.gte'?: string;
  'air_date.lte'?: string;
  'first_air_date.gte'?: string;
  'vote_average.gte'?: number;
  'vote_average.lte'?: number;
  'vote_count.gte'?: number;
  with_release_type?: string;
  language?: string;
  region?: string;
  include_adult?: boolean;
  include_null_first_air_dates?: boolean;
  [key: string]: any;
}

/**
 * Get current date in YYYY-MM-DD format
 */
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get date N days from today in YYYY-MM-DD format
 */
function getDateOffset(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

/**
 * Get date for one year ago in YYYY-MM-DD format
 */
function getOneYearAgo(): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 1);
  return date.toISOString().split('T')[0];
}

/**
 * Build discover parameters for movies based on category
 */
export function buildMovieDiscoverParams(
  category: MovieCategory,
  page: number = 1,
  additionalParams: Record<string, any> = {}
): DiscoverParams {
  const today = getTodayDate();
  const thirtyDaysAgo = getDateOffset(-30);
  const oneYearAgo = getOneYearAgo();
  
  const baseParams: DiscoverParams = {
    page,
    language: 'en-US',
    region: 'IN',
    include_adult: false,
    ...additionalParams,
  };

  switch (category) {
    case 'upcoming':
      // Upcoming movies: released in the future, theatrical releases only
      return {
        ...baseParams,
        'primary_release_date.gte': today,
        sort_by: 'primary_release_date.asc',
        with_release_type: '2|3', // Theatrical releases only
      };

    case 'now_playing':
      // Now Playing: released in the last 30 days, theatrical releases
      return {
        ...baseParams,
        'primary_release_date.lte': today,
        'primary_release_date.gte': thirtyDaysAgo,
        with_release_type: '2|3', // Theatrical releases only
        sort_by: 'release_date.desc',
      };

    case 'popular':
      // Popular movies: sorted by popularity
      return {
        ...baseParams,
        sort_by: 'popularity.desc',
        with_release_type: '2|3', // Theatrical releases only
      };

    case 'trending':
      // Trending: high popularity with significant votes
      return {
        ...baseParams,
        sort_by: 'popularity.desc',
        'vote_count.gte': 1000,
        with_release_type: '2|3',
      };

    case 'top_rated':
      // Top Rated: highest rated with minimum vote count
      return {
        ...baseParams,
        sort_by: 'vote_average.desc',
        'vote_count.gte': 500,
        with_release_type: '2|3',
      };

    default:
      return baseParams;
  }
}

/**
 * Build discover parameters for TV shows based on category
 */
export function buildTVDiscoverParams(
  category: TVCategory,
  page: number = 1,
  additionalParams: Record<string, any> = {}
): DiscoverParams {
  const today = getTodayDate();
  const sevenDaysFromNow = getDateOffset(7);
  const oneYearAgo = getOneYearAgo();
  
  const baseParams: DiscoverParams = {
    page,
    language: 'en-US',
    include_adult: false,
    include_null_first_air_dates: false,
    ...additionalParams,
  };

  switch (category) {
    case 'airing_today':
      // Airing Today / On Air: currently airing shows (next 7 days)
      return {
        ...baseParams,
        'air_date.gte': today,
        'air_date.lte': sevenDaysFromNow,
        sort_by: 'popularity.desc',
      };

    case 'on_the_air':
      // On the Air: same as airing today
      return {
        ...baseParams,
        'air_date.gte': today,
        'air_date.lte': sevenDaysFromNow,
        sort_by: 'popularity.desc',
      };

    case 'popular':
      // Popular TV shows: sorted by popularity
      return {
        ...baseParams,
        sort_by: 'popularity.desc',
      };

    case 'top_rated':
      // Top Rated: highest rated with minimum vote count
      return {
        ...baseParams,
        sort_by: 'vote_average.desc',
        'vote_count.gte': 200,
      };

    case 'trending':
      // Trending: high popularity, recent shows
      return {
        ...baseParams,
        sort_by: 'popularity.desc',
        'first_air_date.gte': oneYearAgo,
      };

    default:
      return baseParams;
  }
}

/**
 * Check if category should use discover API or original trending endpoint
 * Trending still uses /trending endpoint for most accurate results
 */
export function shouldUseTrendingEndpoint(category: string): boolean {
  return category === 'trending';
}
