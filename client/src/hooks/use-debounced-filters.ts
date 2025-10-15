/**
 * Advanced debounced filter hooks with 250ms debouncing, request cancellation,
 * and instant UI updates for TMDB movie/TV filtering system
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { 
  AdvancedFilterState, 
  UseAdvancedFiltersReturn,
  UseDebouncedFiltersReturn,
  UseAdvancedFiltersWithURLReturn,
  PresetCategory,
  ContentType 
} from '@/types/filters';
import { createDefaultFilters, deepEqual, mergeFilters } from '@/types/filters';
import { useAutoFilterURLSync } from './use-filter-url-sync';

/**
 * Hook for debounced filter state with 250ms delay and request cancellation support
 * Provides instant UI updates while debouncing actual API requests
 */
export function useDebouncedFilters(
  filters: AdvancedFilterState,
  delay: number = 250
): UseDebouncedFiltersReturn {
  const [debouncedFilters, setDebouncedFilters] = useState<AdvancedFilterState>(filters);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup timeout and abort controller on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Debounce filter changes
  useEffect(() => {
    // Check if filters actually changed to avoid unnecessary debouncing
    const filtersChanged = JSON.stringify(filters) !== JSON.stringify(debouncedFilters);
    
    if (!filtersChanged) {
      return;
    }

    // Check if only instant-update fields changed (category, contentType, sort_by)
    // These should not be debounced for immediate UI feedback
    const instantFields = ['category', 'contentType', 'sort_by'];
    
    // Check if any instant field changed
    const hasInstantFieldChange = instantFields.some(field => 
      filters[field as keyof AdvancedFilterState] !== debouncedFilters[field as keyof AdvancedFilterState]
    );
    
    // Check if any non-instant field changed
    const nonInstantFieldsChanged = Object.keys(filters).some(key => {
      if (instantFields.includes(key)) return false; // Skip instant fields
      return JSON.stringify(filters[key as keyof AdvancedFilterState]) !== 
             JSON.stringify(debouncedFilters[key as keyof AdvancedFilterState]);
    });
    
    // Only instant fields changed means: instant field changed AND no non-instant fields changed
    const onlyInstantFieldsChanged = hasInstantFieldChange && !nonInstantFieldsChanged;

    // If only instant fields changed, update immediately without debouncing
    if (onlyInstantFieldsChanged) {
      // Cancel any in-flight requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      setDebouncedFilters(filters);
      setIsDebouncing(false);
      // Create new abort controller for new requests
      abortControllerRef.current = new AbortController();
      return;
    }

    setIsDebouncing(true);

    // Cancel any in-flight requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      setDebouncedFilters(filters);
      setIsDebouncing(false);
      // Create new abort controller for new requests
      abortControllerRef.current = new AbortController();
    }, delay);

  }, [filters, delay, debouncedFilters]);

  const cancelDebounce = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsDebouncing(false);
  }, []);

  const flushDebounce = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setDebouncedFilters(filters);
    setIsDebouncing(false);
    // Create new abort controller for new requests
    abortControllerRef.current = new AbortController();
  }, [filters]);

  // Expose the abort signal for consumers
  const getAbortSignal = useCallback(() => {
    if (!abortControllerRef.current) {
      abortControllerRef.current = new AbortController();
    }
    return abortControllerRef.current.signal;
  }, []);

  return {
    debouncedFilters,
    isDebouncing,
    cancelDebounce,
    flushDebounce,
    getAbortSignal,
  };
}

/**
 * Core hook for advanced filter management with all TMDB-native facets
 * Provides comprehensive filter state management with helper methods
 */
export function useAdvancedFilters(
  initialFilters?: Partial<AdvancedFilterState>
): UseAdvancedFiltersReturn {
  const [filters, setFilters] = useState<AdvancedFilterState>(() => ({
    ...createDefaultFilters(),
    ...initialFilters,
  }));

  // Individual filter update methods for common operations
  const updateFilter = useCallback(<K extends keyof AdvancedFilterState>(
    key: K,
    value: AdvancedFilterState[K]
  ) => {
    setFilters(prev => {
      // Always merge updates, never replace
      return { ...prev, [key]: value };
    });
  }, []);
  
  // Set preset while preserving user overrides
  const setPreset = useCallback((presetCategory: PresetCategory) => {
    setFilters(prev => {
      // Collect user overrides (filters that differ from current preset defaults)
      const userOverrides: Partial<AdvancedFilterState> = {};
      
      // Preserve only explicit user-selected filters (not region/language defaults)
      if (prev.with_genres?.length) {
        userOverrides.with_genres = prev.with_genres;
      }
      if (prev.without_genres?.length) {
        userOverrides.without_genres = prev.without_genres;
      }
      if (prev.vote_average?.min || prev.vote_average?.max) {
        userOverrides.vote_average = prev.vote_average;
      }
      if (prev.vote_count?.min) {
        userOverrides.vote_count = prev.vote_count;
      }
      if (prev.with_watch_providers?.length) {
        userOverrides.with_watch_providers = prev.with_watch_providers;
      }
      
      // Merge preset defaults with user overrides
      return mergeFilters(presetCategory, prev.contentType, userOverrides);
    });
  }, []);

  const toggleGenre = useCallback((genreId: number) => {
    setFilters(prev => ({
      ...prev,
      with_genres: prev.with_genres.includes(genreId)
        ? prev.with_genres.filter(id => id !== genreId)
        : [...prev.with_genres, genreId],
    }));
  }, []);

  const setGenres = useCallback((genres: number[]) => {
    updateFilter('with_genres', genres);
  }, [updateFilter]);

  const clearGenres = useCallback(() => {
    updateFilter('with_genres', []);
  }, [updateFilter]);

  const setRatingRange = useCallback((min: number, max: number) => {
    setFilters(prev => ({
      ...prev,
      vote_average: {
        min: min > 0 ? min : undefined,
        max: max < 10 ? max : undefined,
      },
    }));
  }, []);

  const setYearRange = useCallback((startYear?: number, endYear?: number) => {
    setFilters(prev => ({
      ...prev,
      primary_release_date: {
        start: startYear ? `${startYear}-01-01` : undefined,
        end: endYear ? `${endYear}-12-31` : undefined,
      },
      first_air_date: {
        start: startYear ? `${startYear}-01-01` : undefined,
        end: endYear ? `${endYear}-12-31` : undefined,
      },
    }));
  }, []);

  const toggleWatchProvider = useCallback((providerId: number) => {
    setFilters(prev => ({
      ...prev,
      with_watch_providers: prev.with_watch_providers.includes(providerId)
        ? prev.with_watch_providers.filter(id => id !== providerId)
        : [...prev.with_watch_providers, providerId],
    }));
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters(createDefaultFilters());
  }, []);

  const resetToDefaults = useCallback((newDefaults?: Partial<AdvancedFilterState>) => {
    setFilters({
      ...createDefaultFilters(),
      ...newDefaults,
    });
  }, []);

  // Check if any non-default filters are active using deep comparison
  const hasActiveFilters = useMemo(() => {
    const defaults = createDefaultFilters();
    return !deepEqual(filters, defaults);
  }, [filters]);

  return {
    filters,
    setFilters,
    updateFilter,
    setPreset,
    toggleGenre,
    setGenres,
    clearGenres,
    setRatingRange,
    setYearRange,
    toggleWatchProvider,
    clearAllFilters,
    resetToDefaults,
    hasActiveFilters,
  };
}

/**
 * Complete filter management hook with debouncing, URL sync, and instant updates
 * This is the primary hook to use in components for full filter functionality
 */
export function useAdvancedFiltersWithURL(
  initialFilters?: Partial<AdvancedFilterState>,
  options?: {
    debounceDelay?: number;
    syncToURL?: boolean;
    pushState?: boolean;
  }
): UseAdvancedFiltersWithURLReturn {
  const {
    debounceDelay = 250,
    syncToURL = true,
    pushState = false,
  } = options || {};

  // Core filter state management
  const filterMethods = useAdvancedFilters(initialFilters);
  const { filters, setFilters } = filterMethods;

  // Debounced filters for API requests with abort signal
  const debouncedHooks = useDebouncedFilters(filters, debounceDelay);
  const { 
    debouncedFilters, 
    isDebouncing, 
    cancelDebounce, 
    flushDebounce,
    getAbortSignal 
  } = debouncedHooks;

  // URL synchronization (only if enabled)
  useAutoFilterURLSync(
    filters,
    syncToURL ? setFilters : undefined,
    { pushState }
  );

  // Memoized URL params for external access
  const urlParams = useMemo(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const params: Record<string, string> = {};
    
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    return params;
  }, [filters]); // Update when filters change to trigger URL sync

  const syncToURLManually = useCallback((options?: { pushState?: boolean }) => {
    // This will be handled by useAutoFilterURLSync automatically
    // This method exists for API compatibility but doesn't need implementation
  }, []);

  const hasURLFilters = useMemo(() => {
    return window.location.search.length > 1;
  }, [urlParams]);

  return {
    ...filterMethods,
    debouncedFilters,
    isDebouncing,
    cancelDebounce,
    flushDebounce,
    getAbortSignal,
    syncToURL: syncToURLManually,
    urlParams,
    hasURLFilters,
  };
}

/**
 * Hook for infinite query integration with debounced filters and request cancellation
 * Combines debounced filter state with TanStack Query infinite queries
 */
export function useAdvancedFilteredQuery<T = any>(
  baseEndpoint: string,
  filters: AdvancedFilterState,
  abortSignal?: AbortSignal,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    select?: (data: any) => T;
  }
) {
  const {
    enabled = true,
    staleTime = 1000 * 60 * 5, // 5 minutes default
    select,
  } = options || {};

  // Build query parameters from advanced filters
  const queryParams = useMemo(() => {
    const params: Record<string, any> = {};

    // Content type and basic filters
    if (filters.contentType) params.content_type = filters.contentType;
    if (filters.sort_by) params.sort_by = filters.sort_by;
    if (filters.page) params.page = filters.page;

    // Genre filters
    if (filters.with_genres?.length) {
      params.with_genres = filters.with_genres.join(',');
    }
    if (filters.without_genres?.length) {
      params.without_genres = filters.without_genres.join(',');
    }

    // Rating filters
    if (filters.vote_average?.min) params['vote_average.gte'] = filters.vote_average.min;
    if (filters.vote_average?.max) params['vote_average.lte'] = filters.vote_average.max;
    if (filters.vote_count?.min) params['vote_count.gte'] = filters.vote_count.min;

    // Date filters
    if (filters.primary_release_date?.start) params['primary_release_date.gte'] = filters.primary_release_date.start;
    if (filters.primary_release_date?.end) params['primary_release_date.lte'] = filters.primary_release_date.end;
    if (filters.first_air_date?.start) params['first_air_date.gte'] = filters.first_air_date.start;
    if (filters.first_air_date?.end) params['first_air_date.lte'] = filters.first_air_date.end;

    // Runtime filters
    if (filters.with_runtime?.min) params['with_runtime.gte'] = filters.with_runtime.min;
    if (filters.with_runtime?.max) params['with_runtime.lte'] = filters.with_runtime.max;

    // Language and region
    if (filters.with_original_language) params.with_original_language = filters.with_original_language;
    if (filters.region) params.region = filters.region;
    if (filters.watch_region) params.watch_region = filters.watch_region;

    // Streaming providers
    if (filters.with_watch_providers?.length) {
      params.with_watch_providers = filters.with_watch_providers.join('|');
    }

    // Companies
    if (filters.with_companies?.length) {
      params.with_companies = filters.with_companies.join(',');
    }

    // People
    if (filters.with_people?.length) {
      params.with_people = filters.with_people.join(',');
    }

    // Content filters
    if (filters.include_adult !== undefined) params.include_adult = filters.include_adult;
    if (filters.certification_country) params.certification_country = filters.certification_country;
    if (filters.certification) params.certification = filters.certification;

    return params;
  }, [filters]);

  // Create stable query key
  const queryKey = useMemo(() => [baseEndpoint, queryParams], [baseEndpoint, queryParams]);

  return useQuery<T>({
    queryKey,
    queryFn: async () => {
      const queryString = new URLSearchParams(queryParams).toString();
      const url = queryString ? `${baseEndpoint}?${queryString}` : baseEndpoint;
      
      const response = await fetch(url, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest', // CSRF protection
        },
        signal: abortSignal, // Pass abort signal for cancellation
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }

      return response.json();
    },
    enabled,
    staleTime,
    select,
  });
}