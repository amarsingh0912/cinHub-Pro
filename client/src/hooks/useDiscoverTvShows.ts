/**
 * React Query hook for discovering TV shows by category or custom filters
 * Uses the unified TMDB Discover API with comprehensive filter support
 */

import { useQuery } from '@tanstack/react-query';
import type { TVResponse } from '@/types/movie';
import type { TVCategory, DiscoverOptions, TVDiscoverParams } from '@/types/tmdb';
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
 * Supports ALL TMDB Discover API filters for comprehensive TV show discovery
 * 
 * @param params - Custom discover parameters (TVDiscoverParams)
 * @param options - Query options
 * @returns React Query result with TV show data
 * 
 * @example
 * // Currently Airing TV Shows
 * const { data } = useDiscoverTvShowsCustom({
 *   'air_date.gte': '2025-10-01',
 *   'air_date.lte': '2025-10-15',
 *   sort_by: 'popularity.desc'
 * });
 * 
 * @example
 * // Top Rated Dramas
 * const { data } = useDiscoverTvShowsCustom({
 *   with_genres: '18',
 *   'vote_average.gte': 8,
 *   'vote_count.gte': 200,
 *   sort_by: 'vote_average.desc'
 * });
 * 
 * @example
 * // Trending Netflix Originals
 * const { data } = useDiscoverTvShowsCustom({
 *   with_networks: '213', // Netflix
 *   sort_by: 'popularity.desc',
 *   'first_air_date.gte': '2024-01-01'
 * });
 */
export function useDiscoverTvShowsCustom(
  params: Partial<TVDiscoverParams> = {},
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

/**
 * Hook to build TV discover parameters with utility functions
 * Useful for complex filter combinations
 * 
 * @example
 * // Find TV shows on specific networks with genres
 * const params = buildTVFilters({
 *   with_networks: '213|49', // Netflix OR HBO
 *   with_genres: '18|10765', // Drama OR Sci-Fi & Fantasy
 *   'first_air_date.gte': '2020-01-01',
 *   'vote_average.gte': 7
 * });
 * const { data } = useDiscoverTvShowsCustom(params);
 */
export function buildTVFilters(filters: Partial<TVDiscoverParams>): Partial<TVDiscoverParams> {
  return {
    language: 'en-US',
    include_adult: false,
    include_null_first_air_dates: false,
    ...filters,
  };
}
