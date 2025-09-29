/**
 * URL State Management Hook for Advanced Filters
 * Provides bidirectional sync between filter state and URL query parameters
 * Enables deep linking and state preservation across routes/sessions
 */

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useLocation } from 'wouter';
import type { 
  AdvancedFilterState, 
  FilterQueryParams, 
  UseFilterURLSyncReturn,
  ContentType,
  SortOption,
  WatchMonetizationType
} from '@/types/filters';
import { DEFAULT_MOVIE_FILTERS, DEFAULT_TV_FILTERS } from '@/types/filters';

/**
 * Converts filter state to URL query parameters
 */
export function filtersToQueryParams(filters: AdvancedFilterState): FilterQueryParams {
  const params: FilterQueryParams = {};

  // Core content type and category
  if (filters.contentType) params.type = filters.contentType;
  if (filters.category && filters.category !== 'discover') params.category = filters.category;

  // Genres - multi-select arrays
  if (filters.with_genres.length > 0) {
    params.with_genres = filters.with_genres.join(',');
  }
  if (filters.without_genres.length > 0) {
    params.without_genres = filters.without_genres.join(',');
  }

  // Keywords - multi-select arrays
  if (filters.with_keywords.length > 0) {
    params.with_keywords = filters.with_keywords.join(',');
  }
  if (filters.without_keywords.length > 0) {
    params.without_keywords = filters.without_keywords.join(',');
  }

  // Date ranges - Movies
  if (filters.primary_release_date.start) {
    params['primary_release_date.gte'] = filters.primary_release_date.start;
  }
  if (filters.primary_release_date.end) {
    params['primary_release_date.lte'] = filters.primary_release_date.end;
  }

  // Date ranges - TV Shows
  if (filters.first_air_date.start) {
    params['first_air_date.gte'] = filters.first_air_date.start;
  }
  if (filters.first_air_date.end) {
    params['first_air_date.lte'] = filters.first_air_date.end;
  }

  // Numeric ranges - Runtime
  if (filters.with_runtime.min !== undefined) {
    params['with_runtime.gte'] = String(filters.with_runtime.min);
  }
  if (filters.with_runtime.max !== undefined) {
    params['with_runtime.lte'] = String(filters.with_runtime.max);
  }

  // Numeric ranges - Vote Average (Rating)
  if (filters.vote_average.min !== undefined && filters.vote_average.min > 0) {
    params['vote_average.gte'] = String(filters.vote_average.min);
  }
  if (filters.vote_average.max !== undefined && filters.vote_average.max < 10) {
    params['vote_average.lte'] = String(filters.vote_average.max);
  }

  // Numeric ranges - Vote Count (symmetric coverage)
  if (filters.vote_count.min !== undefined && filters.vote_count.min > 0) {
    params['vote_count.gte'] = String(filters.vote_count.min);
  }
  if (filters.vote_count.max !== undefined) {
    params['vote_count.lte'] = String(filters.vote_count.max);
  }

  // Language & Region
  if (filters.with_original_language && filters.with_original_language !== 'all') {
    params.with_original_language = filters.with_original_language;
  }
  if (filters.region) {
    params.region = filters.region;
  }
  if (filters.watch_region) {
    params.watch_region = filters.watch_region;
  }

  // Streaming providers
  if (filters.with_watch_providers.length > 0) {
    params.with_watch_providers = filters.with_watch_providers.join(',');
  }
  if (filters.with_watch_monetization_types.length > 0) {
    params.with_watch_monetization_types = filters.with_watch_monetization_types.join('|');
  }

  // People, companies, networks
  if (filters.with_people.length > 0) {
    params.with_people = filters.with_people.join(',');
  }
  if (filters.with_companies.length > 0) {
    params.with_companies = filters.with_companies.join(',');
  }
  if (filters.with_networks.length > 0) {
    params.with_networks = filters.with_networks.join(',');
  }

  // Content filtering
  if (filters.include_adult === true) {
    params.include_adult = 'true';
  }
  if (filters.certification_country) {
    params.certification_country = filters.certification_country;
  }
  if (filters.certification) {
    params.certification = filters.certification;
  }

  // Sorting - only include if different from default
  if (filters.sort_by !== 'popularity.desc') {
    params.sort_by = filters.sort_by;
  }

  // Pagination
  if (filters.page && filters.page > 1) {
    params.page = String(filters.page);
  }

  // Search query
  if (filters.search_query) {
    params.q = filters.search_query;
  }

  return params;
}

/**
 * Converts URL query parameters to filter state
 */
export function queryParamsToFilters(params: URLSearchParams, contentType?: ContentType): AdvancedFilterState {
  // Determine content type from params or use provided default
  const type = (params.get('type') as ContentType) || contentType || 'movie';
  
  // Start with appropriate default filters
  const defaultFilters = type === 'tv' ? DEFAULT_TV_FILTERS : DEFAULT_MOVIE_FILTERS;
  const filters: AdvancedFilterState = {
    ...defaultFilters,
    contentType: type
  };

  // Parse category
  const category = params.get('category');
  if (category) filters.category = category;

  // Parse genres
  const withGenres = params.get('with_genres');
  if (withGenres) {
    filters.with_genres = withGenres.split(',').map(Number).filter(Boolean);
  }
  const withoutGenres = params.get('without_genres');
  if (withoutGenres) {
    filters.without_genres = withoutGenres.split(',').map(Number).filter(Boolean);
  }

  // Parse keywords
  const withKeywords = params.get('with_keywords');
  if (withKeywords) {
    filters.with_keywords = withKeywords.split(',').map(Number).filter(Boolean);
  }
  const withoutKeywords = params.get('without_keywords');
  if (withoutKeywords) {
    filters.without_keywords = withoutKeywords.split(',').map(Number).filter(Boolean);
  }

  // Parse date ranges - Movies
  const primaryReleaseDateGte = params.get('primary_release_date.gte');
  const primaryReleaseDateLte = params.get('primary_release_date.lte');
  if (primaryReleaseDateGte || primaryReleaseDateLte) {
    filters.primary_release_date = {
      start: primaryReleaseDateGte || undefined,
      end: primaryReleaseDateLte || undefined
    };
  }

  // Parse date ranges - TV Shows  
  const firstAirDateGte = params.get('first_air_date.gte');
  const firstAirDateLte = params.get('first_air_date.lte');
  if (firstAirDateGte || firstAirDateLte) {
    filters.first_air_date = {
      start: firstAirDateGte || undefined,
      end: firstAirDateLte || undefined
    };
  }

  // Parse numeric ranges - Runtime
  const runtimeGte = params.get('with_runtime.gte');
  const runtimeLte = params.get('with_runtime.lte');
  if (runtimeGte || runtimeLte) {
    filters.with_runtime = {
      min: runtimeGte ? Number(runtimeGte) : undefined,
      max: runtimeLte ? Number(runtimeLte) : undefined
    };
  }

  // Parse numeric ranges - Vote Average
  const voteAverageGte = params.get('vote_average.gte');
  const voteAverageLte = params.get('vote_average.lte');
  if (voteAverageGte || voteAverageLte) {
    filters.vote_average = {
      min: voteAverageGte ? Number(voteAverageGte) : undefined,
      max: voteAverageLte ? Number(voteAverageLte) : undefined
    };
  }

  // Parse numeric ranges - Vote Count (symmetric)
  const voteCountGte = params.get('vote_count.gte');
  const voteCountLte = params.get('vote_count.lte');
  if (voteCountGte || voteCountLte) {
    filters.vote_count = {
      min: voteCountGte ? Number(voteCountGte) : undefined,
      max: voteCountLte ? Number(voteCountLte) : undefined
    };
  }

  // Parse language & region
  const originalLanguage = params.get('with_original_language');
  if (originalLanguage) filters.with_original_language = originalLanguage;
  
  const region = params.get('region');
  if (region) filters.region = region;
  
  const watchRegion = params.get('watch_region');
  if (watchRegion) filters.watch_region = watchRegion;

  // Parse streaming providers
  const watchProviders = params.get('with_watch_providers');
  if (watchProviders) {
    filters.with_watch_providers = watchProviders.split(',').map(Number).filter(Boolean);
  }
  
  const watchMonetization = params.get('with_watch_monetization_types');
  if (watchMonetization) {
    filters.with_watch_monetization_types = watchMonetization.split('|') as WatchMonetizationType[];
  }

  // Parse people, companies, networks
  const withPeople = params.get('with_people');
  if (withPeople) {
    filters.with_people = withPeople.split(',').map(Number).filter(Boolean);
  }
  
  const withCompanies = params.get('with_companies');
  if (withCompanies) {
    filters.with_companies = withCompanies.split(',').map(Number).filter(Boolean);
  }
  
  const withNetworks = params.get('with_networks');
  if (withNetworks) {
    filters.with_networks = withNetworks.split(',').map(Number).filter(Boolean);
  }

  // Parse content filtering
  const includeAdult = params.get('include_adult');
  if (includeAdult === 'true') filters.include_adult = true;
  
  const certificationCountry = params.get('certification_country');
  if (certificationCountry) filters.certification_country = certificationCountry;
  
  const certification = params.get('certification');
  if (certification) filters.certification = certification;

  // Parse sorting
  const sortBy = params.get('sort_by') as SortOption;
  if (sortBy) filters.sort_by = sortBy;

  // Parse pagination
  const page = params.get('page');
  if (page) filters.page = Number(page);

  // Parse search query
  const searchQuery = params.get('q');
  if (searchQuery) filters.search_query = searchQuery;

  return filters;
}

/**
 * Advanced Filter URL Synchronization Hook
 * Provides bidirectional sync between filter state and URL query parameters
 * Includes proper browser history integration and popstate handling
 */
export function useFilterURLSync(initialFilters?: AdvancedFilterState): UseFilterURLSyncReturn {
  const [location, navigate] = useLocation();

  // Subscribe to URL changes including browser back/forward navigation
  const [urlParams, setUrlParams] = useState<FilterQueryParams>(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const params: FilterQueryParams = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  });

  // Listen for browser history changes (back/forward buttons)
  useEffect(() => {
    const handlePopState = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const params: FilterQueryParams = {};
      searchParams.forEach((value, key) => {
        params[key] = value;
      });
      setUrlParams(params);
    };

    // Listen to popstate events for browser back/forward
    window.addEventListener('popstate', handlePopState);
    
    // Also listen to custom URL change events we might trigger
    window.addEventListener('urlchange', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('urlchange', handlePopState);
    };
  }, []);

  // Update urlParams when location changes (wouter navigation)
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const params: FilterQueryParams = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    setUrlParams(params);
  }, [location]);

  /**
   * Sync filter state to URL with proper history management
   */
  const syncToURL = useCallback((filters: AdvancedFilterState, options: { pushState?: boolean } = {}) => {
    const queryParams = filtersToQueryParams(filters);
    const searchParams = new URLSearchParams();
    
    // Add non-empty parameters to URL
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.set(key, String(value));
      }
    });

    const newSearch = searchParams.toString();
    const currentPath = window.location.pathname;
    const newURL = newSearch ? `${currentPath}?${newSearch}` : currentPath;
    
    // Update URL and browser history
    if (window.location.pathname + window.location.search !== newURL) {
      if (options.pushState) {
        // Create new history entry (for significant filter changes)
        window.history.pushState(null, '', newURL);
      } else {
        // Replace current history entry (for minor filter changes)
        window.history.replaceState(null, '', newURL);
      }
      
      // Update local state
      const params: FilterQueryParams = {};
      searchParams.forEach((value, key) => {
        params[key] = value;
      });
      setUrlParams(params);
      
      // Dispatch custom event for other listeners
      window.dispatchEvent(new Event('urlchange'));
    }
  }, []);

  /**
   * Sync from current URL to filter state
   */
  const syncFromURL = useCallback((): AdvancedFilterState => {
    const searchParams = new URLSearchParams(window.location.search);
    return queryParamsToFilters(searchParams, initialFilters?.contentType);
  }, [initialFilters?.contentType]);

  /**
   * Update specific URL parameters with proper state management
   */
  const updateURL = useCallback((params: Partial<FilterQueryParams>, options: { pushState?: boolean } = {}) => {
    const searchParams = new URLSearchParams(window.location.search);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.set(key, String(value));
      } else {
        searchParams.delete(key);
      }
    });

    const newSearch = searchParams.toString();
    const currentPath = window.location.pathname;
    const newURL = newSearch ? `${currentPath}?${newSearch}` : currentPath;
    
    if (window.location.pathname + window.location.search !== newURL) {
      if (options.pushState) {
        window.history.pushState(null, '', newURL);
      } else {
        window.history.replaceState(null, '', newURL);
      }
      
      // Update local state  
      const updatedParams: FilterQueryParams = {};
      searchParams.forEach((value, key) => {
        updatedParams[key] = value;
      });
      setUrlParams(updatedParams);
      
      // Dispatch custom event
      window.dispatchEvent(new Event('urlchange'));
    }
  }, []);

  return {
    syncToURL,
    syncFromURL,
    urlParams,
    updateURL
  };
}

/**
 * Utility hook to automatically sync filters to URL with proper history support
 * CRITICAL FIX: Waits for actual filter state propagation before allowing syncToURL
 */
export function useAutoFilterURLSync(
  filters: AdvancedFilterState, 
  onFiltersChange?: (filters: AdvancedFilterState) => void,
  options?: { pushState?: boolean }
) {
  const { syncToURL, syncFromURL, urlParams } = useFilterURLSync(filters);
  const hasInitializedRef = useRef(false);
  const hydratedFiltersRef = useRef(false);
  const pendingUrlFiltersRef = useRef<AdvancedFilterState | null>(null);
  
  // Memoize options to prevent unnecessary re-renders
  const stableOptions = useMemo(() => options || {}, [options?.pushState]);

  // CRITICAL FIX: Initial hydration from URL, only once
  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      
      // Check if URL actually has query parameters
      const hasRealURLParams = window.location.search.length > 1;
      
      if (hasRealURLParams && onFiltersChange) {
        const urlFilters = syncFromURL();
        // Store the URL filters we're trying to hydrate
        pendingUrlFiltersRef.current = urlFilters;
        onFiltersChange(urlFilters);
      } else {
        // No URL filters to hydrate, allow normal sync behavior
        hydratedFiltersRef.current = true;
      }
    }
  }, []); // Only run once on mount

  // Check if filters have been successfully hydrated from URL
  useEffect(() => {
    if (pendingUrlFiltersRef.current && !hydratedFiltersRef.current) {
      // CRITICAL FIX: Full state comparison instead of partial field check
      const expectedParams = filtersToQueryParams(pendingUrlFiltersRef.current);
      const currentParams = filtersToQueryParams(filters);
      
      // Convert to normalized query strings for robust comparison
      const expectedParamsObj = new URLSearchParams();
      const currentParamsObj = new URLSearchParams();
      
      Object.entries(expectedParams).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          expectedParamsObj.set(key, String(value));
        }
      });
      
      Object.entries(currentParams).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          currentParamsObj.set(key, String(value));
        }
      });
      
      const expectedString = expectedParamsObj.toString();
      const currentString = currentParamsObj.toString();
      
      // Compare the full serialized query strings
      if (expectedString === currentString) {
        // Filters have been successfully hydrated, now allow normal sync behavior
        hydratedFiltersRef.current = true;
        pendingUrlFiltersRef.current = null;
      }
    }
  }, [filters]);

  // Only sync to URL after confirmed hydration and when filters actually change
  useEffect(() => {
    if (hydratedFiltersRef.current) {
      // Check if current filters differ from URL
      const currentParams = filtersToQueryParams(filters);
      const currentUrlParams = new URLSearchParams(window.location.search);
      const expectedUrlParams = new URLSearchParams();
      
      Object.entries(currentParams).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          expectedUrlParams.set(key, String(value));
        }
      });
      
      const currentURLString = currentUrlParams.toString();
      const expectedURLString = expectedUrlParams.toString();
      
      // Only sync if there's actually a difference
      if (currentURLString !== expectedURLString) {
        syncToURL(filters, stableOptions);
      }
    }
  }, [filters, syncToURL, stableOptions]); // Removed hasHydrated dependency, using ref instead

  // Watch for external URL parameter changes (browser navigation, manual edits)  
  useEffect(() => {
    if (hydratedFiltersRef.current && onFiltersChange) {
      const urlFilters = syncFromURL();
      
      // Check if URL filters differ from current filters
      const currentParams = filtersToQueryParams(filters);
      const urlParamsString = new URLSearchParams(currentParams as any).toString();
      const currentUrlParams = new URLSearchParams(window.location.search).toString();
      
      if (urlParamsString !== currentUrlParams) {
        // URL changed externally (back/forward, manual edit), update filters
        onFiltersChange(urlFilters);
      }
    }
  }, [urlParams, syncFromURL, onFiltersChange, filters]);
}

/**
 * Utility functions for working with filter URLs
 */
export const FilterURLUtils = {
  /**
   * Check if current URL has filter parameters
   */
  hasFilterParams(): boolean {
    const searchParams = new URLSearchParams(window.location.search);
    const filterKeys = [
      'type', 'category', 'with_genres', 'without_genres', 'with_keywords', 
      'primary_release_date.gte', 'first_air_date.gte', 'vote_average.gte',
      'with_runtime.gte', 'sort_by'
    ];
    
    return filterKeys.some(key => searchParams.has(key));
  },

  /**
   * Generate shareable filter URL
   */
  generateShareableURL(filters: AdvancedFilterState, baseURL?: string): string {
    const queryParams = filtersToQueryParams(filters);
    const searchParams = new URLSearchParams();
    
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.set(key, String(value));
      }
    });

    const base = baseURL || window.location.origin + window.location.pathname;
    const search = searchParams.toString();
    
    return search ? `${base}?${search}` : base;
  },

  /**
   * Clear all filter parameters from URL
   */
  clearFilterParams(): void {
    const currentPath = window.location.pathname;
    window.history.replaceState(null, '', currentPath);
  },

  /**
   * Parse filters from any URL string
   */
  parseFiltersFromURL(url: string): AdvancedFilterState | null {
    try {
      const urlObj = new URL(url);
      return queryParamsToFilters(urlObj.searchParams);
    } catch {
      return null;
    }
  }
};