import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Film } from "lucide-react";
import { Movie, MovieResponse } from "@/types/movie";
import { getImageUrl } from "@/lib/tmdb";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const { isAuthenticated } = useAuth();

  const { data: searchResults, isLoading } = useQuery<MovieResponse>({
    queryKey: ["/api/movies/search", { query }],
    enabled: query.length > 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Search history tracking mutation
  const trackSearchHistoryMutation = useMutation({
    mutationFn: async ({ query, resultsCount }: { query: string; resultsCount: number }) => {
      await apiRequest("POST", "/api/search-history", {
        query,
        searchType: 'movie',
        resultsCount
      });
    },
    onError: (error) => {
      // Silent fail for search history - don't show error to user
      console.log('Failed to track search history:', error);
    },
  });

  // Track search history when results load
  useEffect(() => {
    if (searchResults && query.length > 2 && isAuthenticated) {
      trackSearchHistoryMutation.mutate({
        query,
        resultsCount: searchResults.results?.length || 0
      });
    }
  }, [searchResults, query, isAuthenticated]);

  const handleClose = () => {
    setQuery("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl w-[calc(100%-1rem)] sm:w-[calc(100%-2rem)]" data-testid="search-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg pr-8">
            <Search className="w-4 h-4 sm:w-5 sm:h-5" />
            Search Movies
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search for movies..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 sm:pl-10 h-11 text-base"
              data-testid="input-search"
              autoFocus
            />
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          </div>
          
          {isLoading && (
            <div className="text-center py-8" data-testid="search-loading">
              <p className="text-muted-foreground">Searching...</p>
            </div>
          )}
          
          {searchResults?.results?.length > 0 && (
            <div className="max-h-[50vh] sm:max-h-96 overflow-y-auto space-y-2" data-testid="search-results">
              {searchResults.results.slice(0, 8).map((movie: Movie) => (
                <Link key={movie.id} href={`/movie/${movie.id}`} data-testid={`search-result-${movie.id}`}>
                  <div
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer active:bg-accent/80 min-h-[72px]"
                    onClick={handleClose}
                  >
                    {movie.poster_path ? (
                      <img
                        src={getImageUrl(movie.poster_path, 'w200')}
                        alt={movie.title}
                        className="w-12 h-18 object-cover rounded flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-18 bg-muted rounded flex items-center justify-center flex-shrink-0">
                        <Film className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate text-sm sm:text-base" data-testid={`search-title-${movie.id}`}>
                        {movie.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-muted-foreground" data-testid={`search-year-${movie.id}`}>
                        {movie.release_date ? new Date(movie.release_date).getFullYear() : 'TBA'}
                      </p>
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground flex-shrink-0" data-testid={`search-rating-${movie.id}`}>
                      ⭐ {movie.vote_average.toFixed(1)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          
          {query.length > 2 && !isLoading && (!searchResults?.results?.length) && (
            <div className="text-center py-8" data-testid="search-no-results">
              <p className="text-muted-foreground">No movies found for "{query}"</p>
            </div>
          )}
          
          {query.length <= 2 && (
            <div className="text-center py-8" data-testid="search-prompt">
              <p className="text-muted-foreground">Type at least 3 characters to search</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
