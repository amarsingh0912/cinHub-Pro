/**
 * Enhanced infinite movies hook with debounced filter support and request cancellation
 * Integrates the advanced filter system with the existing infinite scroll functionality
 */

import { useMemo } from 'react';
import { useInfiniteMovies } from './use-infinite-movies';
import { useAdvancedFiltersWithURL } from './use-debounced-filters';
import type { AdvancedFilterState } from '@/types/filters';

interface UseInfiniteMoviesWithFiltersOptions {
  initialFilters?: Partial<AdvancedFilterState>;
  debounceDelay?: number;
  syncToURL?: boolean;
  pushState?: boolean;
  enabled?: boolean;
  staleTime?: number;
  rootMargin?: string;
  threshold?: number;
}

/**
 * Complete hook that combines infinite scrolling with advanced debounced filters
 * Provides the complete filtering experience with URL sync and request cancellation
 */
export function useInfiniteMoviesWithFilters(options: UseInfiniteMoviesWithFiltersOptions = {}) {
  const {
    initialFilters,
    debounceDelay = 250,
    syncToURL = true,
    pushState = false,
    enabled = true,
    staleTime = 1000 * 60 * 10, // 10 minutes
    rootMargin = '100px',
    threshold = 0.1,
  } = options;

  // Advanced filter management with debouncing and URL sync
  const filterHooks = useAdvancedFiltersWithURL(initialFilters, {
    debounceDelay,
    syncToURL,
    pushState,
  });

  const {
    filters,
    debouncedFilters,
    isDebouncing,
    getAbortSignal,
  } = filterHooks;

  // Build API endpoint based on debounced filters
  const { endpoint, queryParams } = useMemo(() => {
    const contentType = debouncedFilters.contentType;
    const category = debouncedFilters.category;
    
    // Check if any advanced filters are applied (excluding contentType, category, and default values)
    const hasAdvancedFilters = 
      debouncedFilters.with_genres?.length ||
      debouncedFilters.without_genres?.length ||
      debouncedFilters.vote_average?.min ||
      debouncedFilters.vote_average?.max ||
      debouncedFilters.vote_count?.min ||
      debouncedFilters.primary_release_date?.start ||
      debouncedFilters.primary_release_date?.end ||
      debouncedFilters.first_air_date?.start ||
      debouncedFilters.first_air_date?.end ||
      debouncedFilters.with_runtime?.min ||
      debouncedFilters.with_runtime?.max ||
      debouncedFilters.with_original_language ||
      debouncedFilters.region ||
      debouncedFilters.with_watch_providers?.length ||
      debouncedFilters.with_companies?.length ||
      debouncedFilters.with_people?.length ||
      // Only consider certification_country as advanced filter if it's different from default 'US' or explicitly set
      (debouncedFilters.certification_country && debouncedFilters.certification_country !== 'US') ||
      debouncedFilters.certification;
    
    let baseEndpoint: string;
    
    // If advanced filters are applied, always use discover endpoint
    if (hasAdvancedFilters || category === 'discover') {
      baseEndpoint = contentType === 'movie' ? '/api/movies/discover' : '/api/tv/discover';
    }
    // For specific categories without filters, use dedicated endpoints
    else if (category === 'trending') {
      baseEndpoint = contentType === 'movie' ? '/api/movies/trending' : '/api/tv/trending';
    } else if (category === 'popular') {
      baseEndpoint = contentType === 'movie' ? '/api/movies/popular' : '/api/tv/popular';
    } else if (category === 'upcoming' && contentType === 'movie') {
      baseEndpoint = '/api/movies/upcoming';
    } else if (category === 'now_playing' && contentType === 'movie') {
      baseEndpoint = '/api/movies/now_playing';
    } else if (category === 'top_rated' && contentType === 'movie') {
      baseEndpoint = '/api/movies/top-rated';
    } else if (category === 'airing_today' && contentType === 'tv') {
      baseEndpoint = '/api/tv/airing_today';
    } else if (category === 'on_the_air' && contentType === 'tv') {
      baseEndpoint = '/api/tv/on-the-air';
    } else if (category === 'top_rated' && contentType === 'tv') {
      baseEndpoint = '/api/tv/top-rated';
    } else {
      // Default to discover endpoint
      baseEndpoint = contentType === 'movie' ? '/api/movies/discover' : '/api/tv/discover';
    }

    // Build query parameters from debounced filters
    const params: Record<string, any> = {};

    // Add filters when using discover endpoint or when advanced filters are applied
    if (hasAdvancedFilters || category === 'discover') {
      if (debouncedFilters.sort_by) params.sort_by = debouncedFilters.sort_by;
      
      if (debouncedFilters.with_genres?.length) {
        params.with_genres = debouncedFilters.with_genres.join(',');
      }
      if (debouncedFilters.without_genres?.length) {
        params.without_genres = debouncedFilters.without_genres.join(',');
      }

      // Rating filters
      if (debouncedFilters.vote_average?.min) params['vote_average.gte'] = debouncedFilters.vote_average.min;
      if (debouncedFilters.vote_average?.max) params['vote_average.lte'] = debouncedFilters.vote_average.max;
      if (debouncedFilters.vote_count?.min) params['vote_count.gte'] = debouncedFilters.vote_count.min;

      // Date filters
      if (debouncedFilters.primary_release_date?.start) {
        params['primary_release_date.gte'] = debouncedFilters.primary_release_date.start;
      }
      if (debouncedFilters.primary_release_date?.end) {
        params['primary_release_date.lte'] = debouncedFilters.primary_release_date.end;
      }
      if (debouncedFilters.first_air_date?.start) {
        params['first_air_date.gte'] = debouncedFilters.first_air_date.start;
      }
      if (debouncedFilters.first_air_date?.end) {
        params['first_air_date.lte'] = debouncedFilters.first_air_date.end;
      }

      // Runtime filters
      if (debouncedFilters.with_runtime?.min) params['with_runtime.gte'] = debouncedFilters.with_runtime.min;
      if (debouncedFilters.with_runtime?.max) params['with_runtime.lte'] = debouncedFilters.with_runtime.max;

      // Language and region
      if (debouncedFilters.with_original_language) {
        params.with_original_language = debouncedFilters.with_original_language;
      }
      if (debouncedFilters.region) params.region = debouncedFilters.region;
      if (debouncedFilters.watch_region) params.watch_region = debouncedFilters.watch_region;

      // Streaming providers
      if (debouncedFilters.with_watch_providers?.length) {
        params.with_watch_providers = debouncedFilters.with_watch_providers.join('|');
      }

      // Companies
      if (debouncedFilters.with_companies?.length) {
        params.with_companies = debouncedFilters.with_companies.join(',');
      }

      // People
      if (debouncedFilters.with_people?.length) {
        params.with_people = debouncedFilters.with_people.join(',');
      }

      // Content filters
      if (debouncedFilters.certification_country) {
        params.certification_country = debouncedFilters.certification_country;
      }
      if (debouncedFilters.certification) {
        params.certification = debouncedFilters.certification;
      }
    }
    
    // Include adult content filter for all categories (not just discover)
    if (debouncedFilters.include_adult !== undefined) {
      params.include_adult = debouncedFilters.include_adult;
    }

    return { endpoint: baseEndpoint, queryParams: params };
  }, [debouncedFilters]);

  // Use the enhanced infinite movies hook
  const infiniteQuery = useInfiniteMovies({
    queryKey: [endpoint, debouncedFilters.category || 'discover', debouncedFilters.contentType, queryParams],
    enabled: enabled, // Query key changes handle debouncing naturally
    staleTime,
    rootMargin,
    threshold,
  });

  return {
    // Filter management
    ...filterHooks,
    
    // Movie data
    ...infiniteQuery,
    
    // Combined state
    isLoadingOrDebouncing: infiniteQuery.isLoading || isDebouncing,
    isLoadingCount: infiniteQuery.isLoading || isDebouncing,
    
    // Convenience methods
    getQueryKey: () => [endpoint, debouncedFilters.category || 'discover', debouncedFilters.contentType, queryParams],
  };
}