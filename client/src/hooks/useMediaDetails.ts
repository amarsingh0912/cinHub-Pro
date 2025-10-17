import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { MovieDetails, TVShowDetails } from "@/types/movie";

/**
 * Hook to fetch movie or TV show details with proper caching
 * Query key structure: ["/api/movies" or "/api/tv", id]
 */
export function useMediaDetails(type: 'movie' | 'tv', id: string | number | undefined) {
  const endpoint = type === 'movie' ? "/api/movies" : "/api/tv";

  return useQuery<MovieDetails | TVShowDetails>({
    queryKey: [endpoint, id],
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}

/**
 * Hook to fetch cast and crew information
 * Uses the embedded credits in the details response
 */
export function useCast(type: 'movie' | 'tv', id: string | number | undefined) {
  const { data, isLoading } = useMediaDetails(type, id);
  
  return {
    cast: data?.credits?.cast || [],
    crew: data?.credits?.crew || [],
    isLoading,
  };
}

/**
 * Hook to fetch similar content
 * Uses the embedded similar data in the details response
 */
export function useSimilar(type: 'movie' | 'tv', id: string | number | undefined) {
  const { data, isLoading } = useMediaDetails(type, id);
  
  return {
    data: type === 'movie' 
      ? (data as MovieDetails)?.similar?.results || []
      : (data as TVShowDetails)?.similar?.results || [],
    isLoading,
  };
}

/**
 * Hook to fetch recommendations
 * Uses the embedded recommendations in the details response
 */
export function useRecommendations(type: 'movie' | 'tv', id: string | number | undefined) {
  const { data, isLoading } = useMediaDetails(type, id);
  
  return {
    data: type === 'movie'
      ? (data as MovieDetails)?.recommendations?.results || []
      : (data as TVShowDetails)?.recommendations?.results || [],
    isLoading,
  };
}

/**
 * Hook to prefetch media details
 * Use this when hovering over cards or anticipating navigation
 */
export function usePrefetchMediaDetails() {
  const queryClient = useQueryClient();

  return {
    prefetchMovie: (id: number) => {
      queryClient.prefetchQuery({
        queryKey: ["/api/movies", id],
        staleTime: 1000 * 60 * 5,
      });
    },
    prefetchTV: (id: number) => {
      queryClient.prefetchQuery({
        queryKey: ["/api/tv", id],
        staleTime: 1000 * 60 * 5,
      });
    },
  };
}
