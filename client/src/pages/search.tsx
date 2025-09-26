import { useState } from "react";
import { Link } from "wouter";
import { useInfiniteMovies } from "@/hooks/use-infinite-movies";
import type { MovieResponse } from "@/types/movie";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MovieGrid from "@/components/movie/movie-grid";
import MovieCardSkeleton from "@/components/movie/movie-card-skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, Film } from "lucide-react";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const {
    data: searchResults,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    triggerRef,
    totalResults
  } = useInfiniteMovies({
    queryKey: ["/api/search", { query: searchTerm }],
    enabled: searchTerm.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchTerm(query.trim());
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="search-page">
      <Header />
      
      <main className="pt-16">
        {/* Search Header */}
        <section className="py-12 border-b border-border" data-testid="search-header">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-display font-bold mb-4" data-testid="search-title">
                Search Movies & TV Shows
              </h1>
              <p className="text-xl text-muted-foreground" data-testid="search-description">
                Find your favorite movies and TV shows from our extensive database
              </p>
            </div>
            
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="relative" data-testid="search-form">
                <Input
                  type="text"
                  placeholder="Search for movies and TV shows..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-12 pr-28 py-4 text-lg"
                  data-testid="input-search"
                />
                <Search className="w-6 h-6 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Button
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-10"
                  disabled={!query.trim() || isLoading}
                  data-testid="button-search"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Search"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </section>

        {/* Search Results */}
        <section className="py-8" data-testid="search-results-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6" data-testid="search-loading">
                {Array.from({ length: 12 }, (_, index) => (
                  <MovieCardSkeleton key={index} />
                ))}
              </div>
            ) : searchTerm && searchResults ? (
              <>
                <div className="mb-6" data-testid="search-results-header">
                  <h2 className="text-2xl font-bold" data-testid="results-count">
                    {totalResults > 0 
                      ? `Found ${totalResults.toLocaleString()} results for "${searchTerm}"`
                      : `No results found for "${searchTerm}"`
                    }
                  </h2>
                </div>
                
                {/* Filter and normalize the search results for MovieGrid */}
                {(() => {
                  const processedResults = searchResults
                    .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
                    .map((item: any) => {
                      const isMovie = item.media_type === 'movie';
                      return {
                        id: item.id,
                        poster_path: item.poster_path,
                        vote_average: item.vote_average || 0,
                        overview: item.overview || '',
                        backdrop_path: item.backdrop_path || null,
                        vote_count: item.vote_count || 0,
                        genre_ids: item.genre_ids || [],
                        adult: item.adult || false,
                        original_language: item.original_language || 'en',
                        popularity: item.popularity || 0,
                        media_type: item.media_type,
                        ...(isMovie ? {
                          title: item.title,
                          release_date: item.release_date,
                          original_title: item.original_title || item.title,
                          video: item.video || false
                        } : {
                          name: item.name,
                          first_air_date: item.first_air_date,
                          original_name: item.original_name || item.name,
                          origin_country: item.origin_country || []
                        })
                      };
                    });
                  
                  return processedResults.length > 0 ? (
                    <MovieGrid
                      movies={processedResults}
                      isLoading={false}
                      hasNextPage={hasNextPage}
                      isFetchingNextPage={isFetchingNextPage}
                      infiniteScrollTriggerRef={triggerRef}
                      mediaType="movie" // Mixed results, but MovieCard will handle the media_type
                      skeletonCount={12}
                    />
                  ) : (
                    <div className="text-center py-12" data-testid="no-results">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">No results found</h3>
                      <p className="text-muted-foreground">
                        Try searching with different keywords or check your spelling.
                      </p>
                    </div>
                  );
                })()}
              </>
            ) : (
              <div className="text-center py-12" data-testid="search-prompt">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Start your search</h3>
                <p className="text-muted-foreground">
                  Enter a movie title, TV show, actor, or director to find what you're looking for.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
