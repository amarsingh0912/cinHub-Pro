/**
 * React Query hook for discovering TV shows by category
 * Uses the unified TMDB Discover API with category-specific parameters
 */

import { useQuery } from '@tanstack/react-query';
import type { TVResponse } from '@/types/movie';
import type { TVCategory, DiscoverOptions } from '@/types/tmdb';
import { getTVCategoryEndpoint } from '@/types/tmdb';

/**
 * Hook to fetch TV shows by category using the Discover API
 * 
 * @param category - TV category (airing_today, on_the_air, popular, trending, top_rated)
 * @param options - Query options including page, enabled state, and staleTime
 * @returns React Query result with TV show data
 * 
 * @example
 * const { data, isLoading, error } = useDiscoverTvShows('airing_today', { page: 1 });
 */
export function useDiscoverTvShows(
  category: TVCategory,
  options: DiscoverOptions = {}
) {
  const {
    page = 1,
    enabled = true,
    staleTime = 1000 * 60 * 10, // 10 minutes default
    additionalParams = {},
  } = options;

  const endpoint = getTVCategoryEndpoint(category);

  return useQuery<TVResponse>({
    queryKey: [endpoint, { page, ...additionalParams }],
    enabled,
    staleTime,
  });
}

/**
 * Hook to fetch TV shows with custom discover parameters
 * Allows full control over discover API parameters
 * 
 * @param params - Custom discover parameters
 * @param options - Query options
 * @returns React Query result with TV show data
 * 
 * @example
 * const { data } = useDiscoverTvShowsCustom({
 *   'vote_average.gte': 8,
 *   'vote_count.gte': 500,
 *   with_genres: '10765,10759' // Sci-Fi & Fantasy, Action & Adventure
 * });
 */
export function useDiscoverTvShowsCustom(
  params: Record<string, any>,
  options: Omit<DiscoverOptions, 'additionalParams'> = {}
) {
  const {
    page = 1,
    enabled = true,
    staleTime = 1000 * 60 * 10,
  } = options;

  return useQuery<TVResponse>({
    queryKey: ['/api/tv/discover', { page, ...params }],
    enabled,
    staleTime,
  });
}
