import { useInfiniteQuery } from '@tanstack/react-query';
import { useInfiniteScroll } from './use-infinite-scroll';

interface InfiniteMoviesOptions {
  queryKey: (string | Record<string, any>)[];
  enabled?: boolean;
  staleTime?: number;
  rootMargin?: string;
  threshold?: number;
}

interface PageParam {
  page: number;
}

interface TMDBResponse {
  page: number;
  results: any[];
  total_pages: number;
  total_results: number;
}

/**
 * Custom hook for infinite scrolling of movies/TV shows using TanStack Query
 * Combines useInfiniteQuery with intersection observer for automatic loading
 */
export function useInfiniteMovies({
  queryKey,
  enabled = true,
  staleTime = 1000 * 60 * 10, // 10 minutes
  rootMargin = '100px',
  threshold = 0.1,
}: InfiniteMoviesOptions) {
  const infiniteQuery = useInfiniteQuery<TMDBResponse, Error>({
    queryKey,
    queryFn: async ({ pageParam = 1 }) => {
      // Extract the base path from queryKey
      const [endpoint, params] = queryKey;
      
      // Build query parameters
      const queryParams = new URLSearchParams({
        page: String(pageParam),
        ...(typeof params === 'object' && params !== null ? params : {})
      });

      const response = await fetch(`${endpoint}?${queryParams}`, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest', // CSRF protection
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }

      return response.json();
    },
    getNextPageParam: (lastPage: TMDBResponse) => {
      if (lastPage.page < lastPage.total_pages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled,
    staleTime,
  });

  // Use infinite scroll hook
  const triggerRef = useInfiniteScroll({
    hasNextPage: infiniteQuery.hasNextPage ?? false,
    isFetchingNextPage: infiniteQuery.isFetchingNextPage,
    fetchNextPage: infiniteQuery.fetchNextPage,
    rootMargin,
    threshold,
    disabled: !enabled || infiniteQuery.isError,
  });

  // Flatten all pages into a single array
  const data = infiniteQuery.data?.pages.flatMap(page => page.results) ?? [];
  
  // Get total count from first page
  const totalResults = infiniteQuery.data?.pages[0]?.total_results ?? 0;

  return {
    data,
    totalResults,
    isLoading: infiniteQuery.isLoading,
    isError: infiniteQuery.isError,
    error: infiniteQuery.error,
    hasNextPage: infiniteQuery.hasNextPage,
    isFetchingNextPage: infiniteQuery.isFetchingNextPage,
    fetchNextPage: infiniteQuery.fetchNextPage,
    triggerRef,
    refetch: infiniteQuery.refetch,
  };
}