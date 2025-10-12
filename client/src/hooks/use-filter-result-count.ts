import { useMemo } from 'react';
import type { InfiniteData } from '@tanstack/react-query';
import type { MovieResponse } from '@/types/movie';

interface UseFilterResultCountOptions {
  data: InfiniteData<MovieResponse> | undefined;
  isLoading: boolean;
  isDebouncing?: boolean;
}

/**
 * Hook to extract and manage result count from infinite query data
 * Provides total count and loading states for display
 */
export function useFilterResultCount({
  data,
  isLoading,
  isDebouncing = false,
}: UseFilterResultCountOptions) {
  const totalResults = useMemo(() => {
    if (!data?.pages?.length) return 0;
    
    // Get total_results from first page (TMDB provides this in response)
    const firstPage = data.pages[0];
    return firstPage?.total_results || 0;
  }, [data]);

  const currentPageResults = useMemo(() => {
    if (!data?.pages?.length) return 0;
    
    // Count all results loaded so far
    return data.pages.reduce((total, page) => {
      return total + (page?.results?.length || 0);
    }, 0);
  }, [data]);

  const totalPages = useMemo(() => {
    if (!data?.pages?.length) return 0;
    
    const firstPage = data.pages[0];
    return firstPage?.total_pages || 0;
  }, [data]);

  const isLoadingCount = isLoading || isDebouncing;

  return {
    totalResults,
    currentPageResults,
    totalPages,
    isLoadingCount,
    hasResults: totalResults > 0,
  };
}
