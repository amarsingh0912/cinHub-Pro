/**
 * React Query hook for discovering movies by category or custom filters
 * Uses the unified TMDB Discover API with comprehensive filter support
 */

import { useQuery } from '@tanstack/react-query';
import type { MovieResponse } from '@/types/movie';
import type { MovieCategory, DiscoverOptions, MovieDiscoverParams } from '@/types/tmdb';
import { getMovieCategoryEndpoint } from '@/types/tmdb';

/**
 * Hook to fetch movies by category using the Discover API
 * 
 * @param category - Movie category (upcoming, now_playing, popular, trending, top_rated)
 * @param options - Query options including page, enabled state, and staleTime
 * @returns React Query result with movie data
 * 
 * @example
 * const { data, isLoading, error } = useDiscoverMovies('upcoming', { page: 1 });
 */
export function useDiscoverMovies(
  category: MovieCategory,
  options: DiscoverOptions = {}
) {
  const {
    page = 1,
    enabled = true,
    staleTime = 1000 * 60 * 10, // 10 minutes default
    additionalParams = {},
  } = options;

  const endpoint = getMovieCategoryEndpoint(category);

  return useQuery<MovieResponse>({
    queryKey: [endpoint, { page, ...additionalParams }],
    enabled,
    staleTime,
  });
}

/**
 * Hook to fetch movies with custom discover parameters
 * Supports ALL TMDB Discover API filters for comprehensive movie discovery
 * 
 * @param params - Custom discover parameters (MovieDiscoverParams)
 * @param options - Query options
 * @returns React Query result with movie data
 * 
 * @example
 * // Upcoming Movies in India
 * const { data } = useDiscoverMoviesCustom({
 *   region: 'IN',
 *   sort_by: 'primary_release_date.asc',
 *   'primary_release_date.gte': '2025-10-15',
 *   with_release_type: '2|3'
 * });
 * 
 * @example
 * // Highly Rated Sci-Fi Movies
 * const { data } = useDiscoverMoviesCustom({
 *   with_genres: '878',
 *   'vote_average.gte': 8,
 *   sort_by: 'vote_average.desc',
 *   'vote_count.gte': 1000
 * });
 * 
 * @example
 * // Family-Friendly Animated Movies
 * const { data } = useDiscoverMoviesCustom({
 *   with_genres: '16|10751',
 *   certification_country: 'US',
 *   'certification.lte': 'PG',
 *   sort_by: 'popularity.desc'
 * });
 */
export function useDiscoverMoviesCustom(
  params: Partial<MovieDiscoverParams> = {},
  options: Omit<DiscoverOptions, 'additionalParams'> = {}
) {
  const {
    page = 1,
    enabled = true,
    staleTime = 1000 * 60 * 10,
  } = options;

  return useQuery<MovieResponse>({
    queryKey: ['/api/movies/discover', { page, ...params }],
    enabled,
    staleTime,
  });
}

/**
 * Hook to build movie discover parameters with utility functions
 * Useful for complex filter combinations
 * 
 * @example
 * // Find movies with specific cast, genres, and date range
 * const params = buildMovieFilters({
 *   with_cast: '500,190', // Leonardo DiCaprio, Samuel L. Jackson
 *   with_genres: '28|12', // Action OR Adventure
 *   'primary_release_date.gte': '2020-01-01',
 *   'vote_average.gte': 7
 * });
 * const { data } = useDiscoverMoviesCustom(params);
 */
export function buildMovieFilters(filters: Partial<MovieDiscoverParams>): Partial<MovieDiscoverParams> {
  return {
    language: 'en-US',
    include_adult: false,
    ...filters,
  };
}
