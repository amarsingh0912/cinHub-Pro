/**
 * TypeScript types for TMDB Discover API
 */

export type MovieCategory = 'upcoming' | 'now_playing' | 'popular' | 'trending' | 'top_rated';
export type TVCategory = 'airing_today' | 'on_the_air' | 'popular' | 'trending' | 'top_rated';
export type MediaType = 'movie' | 'tv';

/**
 * Discover parameters for movies
 */
export interface MovieDiscoverParams {
  page?: number;
  sort_by?: string;
  'primary_release_date.gte'?: string;
  'primary_release_date.lte'?: string;
  'release_date.gte'?: string;
  'release_date.lte'?: string;
  'vote_average.gte'?: number;
  'vote_average.lte'?: number;
  'vote_count.gte'?: number;
  with_release_type?: string;
  with_genres?: string;
  without_genres?: string;
  with_keywords?: string;
  without_keywords?: string;
  'with_runtime.gte'?: number;
  'with_runtime.lte'?: number;
  with_original_language?: string;
  region?: string;
  watch_region?: string;
  with_watch_providers?: string;
  with_people?: string;
  with_companies?: string;
  include_adult?: boolean;
  certification_country?: string;
  certification?: string;
  language?: string;
}

/**
 * Discover parameters for TV shows
 */
export interface TVDiscoverParams {
  page?: number;
  sort_by?: string;
  'first_air_date.gte'?: string;
  'first_air_date.lte'?: string;
  'air_date.gte'?: string;
  'air_date.lte'?: string;
  'vote_average.gte'?: number;
  'vote_average.lte'?: number;
  'vote_count.gte'?: number;
  with_genres?: string;
  without_genres?: string;
  with_keywords?: string;
  without_keywords?: string;
  'with_runtime.gte'?: number;
  'with_runtime.lte'?: number;
  with_original_language?: string;
  watch_region?: string;
  with_watch_providers?: string;
  with_people?: string;
  with_companies?: string;
  with_networks?: string;
  include_adult?: boolean;
  include_null_first_air_dates?: boolean;
  certification_country?: string;
  certification?: string;
  language?: string;
}

/**
 * Options for discover hooks
 */
export interface DiscoverOptions {
  page?: number;
  enabled?: boolean;
  staleTime?: number;
  additionalParams?: Record<string, any>;
}

/**
 * Category display names
 */
export const MOVIE_CATEGORY_LABELS: Record<MovieCategory, string> = {
  upcoming: 'Upcoming',
  now_playing: 'Now Playing',
  popular: 'Popular',
  trending: 'Trending',
  top_rated: 'Top Rated',
};

export const TV_CATEGORY_LABELS: Record<TVCategory, string> = {
  airing_today: 'Airing Today',
  on_the_air: 'On the Air',
  popular: 'Popular',
  trending: 'Trending',
  top_rated: 'Top Rated',
};

/**
 * API endpoint builders
 */
export function getMovieCategoryEndpoint(category: MovieCategory): string {
  const endpointMap: Record<MovieCategory, string> = {
    upcoming: '/api/movies/upcoming',
    now_playing: '/api/movies/now_playing',
    popular: '/api/movies/popular',
    trending: '/api/movies/trending',
    top_rated: '/api/movies/top-rated',
  };
  return endpointMap[category];
}

export function getTVCategoryEndpoint(category: TVCategory): string {
  const endpointMap: Record<TVCategory, string> = {
    airing_today: '/api/tv/airing_today',
    on_the_air: '/api/tv/on-the-air',
    popular: '/api/tv/popular',
    trending: '/api/tv/trending',
    top_rated: '/api/tv/top-rated',
  };
  return endpointMap[category];
}
