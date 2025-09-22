import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { MovieResponse } from "@/types/movie";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MovieGrid from "@/components/movie/movie-grid";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export default function Movies() {
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState("popular");

  const { data: moviesData, isLoading } = useQuery<MovieResponse>({
    queryKey: ["/api/movies/popular", { page: currentPage }],
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  const handleLoadMore = () => {
    setCurrentPage(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="movies-page">
      <Header />
      
      <main className="pt-16">
        {/* Page Header */}
        <section className="py-12 border-b border-border" data-testid="movies-header">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-4xl font-display font-bold mb-2" data-testid="movies-title">
                  Discover Movies
                </h1>
                <p className="text-xl text-muted-foreground" data-testid="movies-description">
                  Browse through thousands of movies from around the world
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-48" data-testid="filter-select">
                    <SelectValue placeholder="Filter movies" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popular" data-testid="filter-popular">Popular</SelectItem>
                    <SelectItem value="top-rated" data-testid="filter-top-rated">Top Rated</SelectItem>
                    <SelectItem value="upcoming" data-testid="filter-upcoming">Upcoming</SelectItem>
                    <SelectItem value="now-playing" data-testid="filter-now-playing">Now Playing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </section>

        {/* Movies Grid */}
        <section className="py-8" data-testid="movies-content">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {isLoading ? (
              <div className="flex items-center justify-center py-12" data-testid="movies-loading">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading movies...</span>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 mb-8" data-testid="movies-grid">
                  {moviesData?.results?.map((movie) => (
                    <div key={movie.id} className="movie-card group cursor-pointer">
                      <div className="aspect-[2/3] relative overflow-hidden rounded-lg bg-accent">
                        <img
                          src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                          alt={movie.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute bottom-4 left-4 right-4">
                            <div className="flex items-center gap-2 text-white">
                              <i className="fas fa-star text-secondary"></i>
                              <span data-testid={`rating-${movie.id}`}>{movie.vote_average.toFixed(1)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3">
                        <h3 className="font-semibold truncate" data-testid={`title-${movie.id}`}>
                          {movie.title}
                        </h3>
                        <p className="text-sm text-muted-foreground" data-testid={`year-${movie.id}`}>
                          {movie.release_date ? new Date(movie.release_date).getFullYear() : 'TBA'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Load More Button */}
                {moviesData?.results && moviesData.results.length > 0 && (
                  <div className="text-center" data-testid="load-more-section">
                    <Button
                      onClick={handleLoadMore}
                      variant="outline"
                      size="lg"
                      disabled={isLoading}
                      data-testid="button-load-more"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Loading...
                        </>
                      ) : (
                        'Load More Movies'
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
