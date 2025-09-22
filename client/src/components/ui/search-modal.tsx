import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { Movie } from "@/types/movie";
import { getImageUrl } from "@/lib/tmdb";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["/api/movies/search", { query }],
    enabled: query.length > 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const handleClose = () => {
    setQuery("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl" data-testid="search-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
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
              className="pl-10"
              data-testid="input-search"
            />
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          </div>
          
          {isLoading && (
            <div className="text-center py-8" data-testid="search-loading">
              <p className="text-muted-foreground">Searching...</p>
            </div>
          )}
          
          {searchResults?.results?.length > 0 && (
            <div className="max-h-96 overflow-y-auto space-y-2" data-testid="search-results">
              {searchResults.results.slice(0, 8).map((movie: Movie) => (
                <Link key={movie.id} href={`/movie/${movie.id}`} data-testid={`search-result-${movie.id}`}>
                  <div
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer"
                    onClick={handleClose}
                  >
                    <img
                      src={getImageUrl(movie.poster_path, 'w200')}
                      alt={movie.title}
                      className="w-12 h-18 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate" data-testid={`search-title-${movie.id}`}>
                        {movie.title}
                      </h4>
                      <p className="text-sm text-muted-foreground" data-testid={`search-year-${movie.id}`}>
                        {movie.release_date ? new Date(movie.release_date).getFullYear() : 'TBA'}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground" data-testid={`search-rating-${movie.id}`}>
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
