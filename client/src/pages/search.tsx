import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import type { MovieResponse } from "@/types/movie";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MovieGrid from "@/components/movie/movie-grid";
import MovieCardSkeleton from "@/components/movie/movie-card-skeleton";
import { getImageUrl } from "@/lib/tmdb";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, Film } from "lucide-react";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: searchResults, isLoading } = useQuery<any>({
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
                  className="pl-12 pr-24 py-4 text-lg"
                  data-testid="input-search"
                />
                <Search className="w-6 h-6 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
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
                    {searchResults.total_results > 0 
                      ? `Found ${searchResults.total_results.toLocaleString()} results for "${searchTerm}"`
                      : `No results found for "${searchTerm}"`
                    }
                  </h2>
                </div>
                
                {searchResults.results?.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6" data-testid="search-results-grid">
                    {searchResults.results
                      .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
                      .map((item: any) => {
                        const isMovie = item.media_type === 'movie';
                        const title = isMovie ? item.title : item.name;
                        const releaseDate = isMovie ? item.release_date : item.first_air_date;
                        const href = isMovie ? `/movie/${item.id}` : `/tv/${item.id}`;
                        
                        return (
                          <Link key={`${item.media_type}-${item.id}`} href={href} data-testid={`${item.media_type}-card-${item.id}`}>
                            <div className="movie-card group cursor-pointer">
                              <div className="aspect-[2/3] relative overflow-hidden rounded-lg bg-accent">
                                {item.poster_path ? (
                                  <img
                                    src={getImageUrl(item.poster_path)}
                                    alt={title}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-muted flex items-center justify-center">
                                    <Film className="w-16 h-16 text-muted-foreground" />
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                  <div className="absolute bottom-4 left-4 right-4">
                                    <div className="flex items-center gap-2 text-white">
                                      <i className="fas fa-star text-secondary"></i>
                                      <span data-testid={`result-rating-${item.id}`}>{item.vote_average?.toFixed(1) || 'N/A'}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="mt-3">
                                <h3 className="font-semibold truncate" data-testid={`result-title-${item.id}`}>
                                  {title}
                                </h3>
                                <p className="text-sm text-muted-foreground" data-testid={`result-year-${item.id}`}>
                                  {releaseDate ? new Date(releaseDate).getFullYear() : 'TBA'}
                                </p>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                  </div>
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
                )}
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
