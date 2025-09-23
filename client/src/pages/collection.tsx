import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { MovieResponse } from "@/types/movie";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MovieCardSkeleton from "@/components/movie/movie-card-skeleton";
import { CATEGORIES } from "@/types/movie";
import { Loader2, Film } from "lucide-react";

export default function Collection() {
  const { category } = useParams();
  
  const categoryInfo = CATEGORIES.find(cat => cat.slug === category);
  
  const { data: moviesData, isLoading } = useQuery<MovieResponse>({
    queryKey: ["/api/movies/discover", category],
    enabled: !!category,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  if (!categoryInfo) {
    return (
      <div className="min-h-screen bg-background text-foreground" data-testid="collection-not-found">
        <Header />
        <div className="pt-16 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Collection Not Found</h1>
            <p className="text-muted-foreground">The collection you're looking for doesn't exist.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="collection-page">
      <Header />
      
      <main className="pt-16">
        {/* Collection Header */}
        <section className="py-12 border-b border-border" data-testid="collection-header">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className={`w-20 h-20 bg-gradient-to-br ${categoryInfo.color} rounded-full flex items-center justify-center mx-auto mb-6`}>
                <i className={`fas fa-${categoryInfo.icon} text-3xl text-white`}></i>
              </div>
              <h1 className="text-4xl font-display font-bold mb-4" data-testid="collection-title">
                {categoryInfo.name} Movies
              </h1>
              <p className="text-xl text-muted-foreground" data-testid="collection-description">
                Discover the best {categoryInfo.name.toLowerCase()} movies from around the world
              </p>
            </div>
          </div>
        </section>

        {/* Movies Grid */}
        <section className="py-8" data-testid="collection-movies">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6" data-testid="collection-loading">
                {Array.from({ length: 18 }, (_, index) => (
                  <MovieCardSkeleton key={index} />
                ))}
              </div>
            ) : (
              <>
                {moviesData?.results && moviesData.results.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6" data-testid="collection-movies-grid">
                    {moviesData.results.map((movie: any) => (
                      <div key={movie.id} className="movie-card group cursor-pointer">
                        <div className="aspect-[2/3] relative overflow-hidden rounded-lg bg-accent">
                          {movie.poster_path ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                              alt={movie.title}
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
                                <span data-testid={`movie-rating-${movie.id}`}>{movie.vote_average.toFixed(1)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3">
                          <h3 className="font-semibold truncate" data-testid={`movie-title-${movie.id}`}>
                            {movie.title}
                          </h3>
                          <p className="text-sm text-muted-foreground" data-testid={`movie-year-${movie.id}`}>
                            {movie.release_date ? new Date(movie.release_date).getFullYear() : 'TBA'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12" data-testid="collection-empty">
                    <div className={`w-16 h-16 bg-gradient-to-br ${categoryInfo.color} opacity-50 rounded-full flex items-center justify-center mx-auto mb-4`}>
                      <i className={`fas fa-${categoryInfo.icon} text-2xl text-white`}></i>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No movies found</h3>
                    <p className="text-muted-foreground">
                      We couldn't find any {categoryInfo.name.toLowerCase()} movies at the moment.
                    </p>
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
