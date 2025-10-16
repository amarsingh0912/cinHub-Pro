/**
 * Enhanced infinite movies hook with debounced filter support and request cancellation
 * Integrates the advanced filter system with the existing infinite scroll functionality
 */

import { useMemo } from 'react';
import { useInfiniteMovies } from './use-infinite-movies';
import { useAdvancedFiltersWithURL } from './use-debounced-filters';
import { buildQueryString } from '@/types/filters';
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

  // Build API endpoint and query params from merged filters
  const { endpoint, queryParams, queryString } = useMemo(() => {
    const contentType = debouncedFilters.contentType;
    
    // ALWAYS use discover endpoint with all merged filter params
    // This ensures preset parameters are preserved when user filters are applied
    const baseEndpoint = contentType === 'movie' ? '/api/movies/discover' : '/api/tv/discover';

    // Build comprehensive query parameters from debounced filters (which already contain merged preset defaults)
    const params: Record<string, any> = {};

    // Core filters
    if (debouncedFilters.sort_by) params.sort_by = debouncedFilters.sort_by;
    
    // Genre filters
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

    // Date filters - Movies
    if (debouncedFilters.primary_release_date?.start) {
      params['primary_release_date.gte'] = debouncedFilters.primary_release_date.start;
    }
    if (debouncedFilters.primary_release_date?.end) {
      params['primary_release_date.lte'] = debouncedFilters.primary_release_date.end;
    }
    
    // Date filters - TV
    if (debouncedFilters.first_air_date?.start) {
      params['first_air_date.gte'] = debouncedFilters.first_air_date.start;
    }
    if (debouncedFilters.first_air_date?.end) {
      params['first_air_date.lte'] = debouncedFilters.first_air_date.end;
    }
    
    // Alternative TV air date filters
    if (debouncedFilters.air_date?.start) {
      params['air_date.gte'] = debouncedFilters.air_date.start;
    }
    if (debouncedFilters.air_date?.end) {
      params['air_date.lte'] = debouncedFilters.air_date.end;
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

    // Streaming providers (use pipe for OR logic, will be encoded as %7C)
    if (debouncedFilters.with_watch_providers?.length) {
      params.with_watch_providers = debouncedFilters.with_watch_providers;
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
    if (debouncedFilters.include_adult !== undefined) {
      params.include_adult = debouncedFilters.include_adult;
    }
    if (debouncedFilters.include_video !== undefined) {
      params.include_video = debouncedFilters.include_video;
    }
    if (debouncedFilters.certification_country) {
      params.certification_country = debouncedFilters.certification_country;
    }
    if (debouncedFilters.certification) {
      params.certification = debouncedFilters.certification;
    }
    
    // Release type (for movies - theatrical, etc.)
    if (debouncedFilters.with_release_type?.length) {
      params.with_release_type = debouncedFilters.with_release_type;
    }

    // Build query string with proper URL encoding (pipes as %7C)
    const qs = buildQueryString(params);
    
    // Log the final URL for debugging
    const fullUrl = `${baseEndpoint}?${qs}`;
    console.log(`[Filter Debug] Fetching: ${fullUrl}`);
    console.log(`[Filter Debug] Active Preset: ${debouncedFilters.activePreset || 'none'}`);
    console.log(`[Filter Debug] Params:`, params);

    return { endpoint: baseEndpoint, queryParams: params, queryString: qs };
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
    
    // Debug information
    queryString,
    endpoint,
    
    // Convenience methods
    getQueryKey: () => [endpoint, debouncedFilters.category || 'discover', debouncedFilters.contentType, queryParams],
  };
}