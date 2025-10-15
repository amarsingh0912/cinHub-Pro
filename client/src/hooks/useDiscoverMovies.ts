/**
 * React Query hook for discovering movies by category
 * Uses the unified TMDB Discover API with category-specific parameters
 */

import { useQuery } from '@tanstack/react-query';
import type { MovieResponse } from '@/types/movie';
import type { MovieCategory, DiscoverOptions } from '@/types/tmdb';
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
 * Allows full control over discover API parameters
 * 
 * @param params - Custom discover parameters
 * @param options - Query options
 * @returns React Query result with movie data
 * 
 * @example
 * const { data } = useDiscoverMoviesCustom({
 *   'vote_average.gte': 8,
 *   'vote_count.gte': 1000,
 *   with_genres: '28,12' // Action & Adventure
 * });
 */
export function useDiscoverMoviesCustom(
  params: Record<string, any>,
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
