import { useQuery } from "@tanstack/react-query";
import type { MovieResponse, TVResponse } from "@/types/movie";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MovieGrid from "@/components/movie/movie-grid";
import { Link } from "wouter";
import { Plus, Heart, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Home() {
  const { user } = useAuth();
  
  const { data: trendingMovies } = useQuery<MovieResponse>({
    queryKey: ["/api/movies/trending"],
    staleTime: 1000 * 60 * 15, // 15 minutes
  });

  const { data: trendingTVShows } = useQuery<TVResponse>({
    queryKey: ["/api/tv/trending"],
    staleTime: 1000 * 60 * 15, // 15 minutes
  });

  const { data: favorites } = useQuery<any[]>({
    queryKey: ["/api/favorites"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { data: watchlists } = useQuery<any[]>({
    queryKey: ["/api/watchlists"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="home-page">
      <Header />
      
      <main className="pt-16">
        {/* Welcome Section */}
        <section className="py-12 bg-gradient-to-r from-primary/10 to-secondary/10" data-testid="welcome-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-display font-bold mb-4" data-testid="welcome-title">
                Welcome back, {user?.firstName || 'Movie Lover'}! 🎬
              </h1>
              <p className="text-xl text-muted-foreground mb-8" data-testid="welcome-description">
                Ready to discover your next favorite movie?
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/search">
                  <Button size="lg" data-testid="button-search-movies">
                    Search Movies
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline" size="lg" data-testid="button-my-dashboard">
                    My Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Stats */}
        {(favorites || watchlists) && (
          <section className="py-8 border-b border-border" data-testid="stats-section">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Heart className="w-6 h-6 text-red-500" />
                  </div>
                  <h3 className="text-2xl font-bold" data-testid="stat-favorites">{favorites?.length || 0}</h3>
                  <p className="text-muted-foreground">Favorite Movies</p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-6 h-6 text-blue-500" />
                  </div>
                  <h3 className="text-2xl font-bold" data-testid="stat-watchlists">{watchlists?.length || 0}</h3>
                  <p className="text-muted-foreground">Watchlists</p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Plus className="w-6 h-6 text-green-500" />
                  </div>
                  <h3 className="text-2xl font-bold" data-testid="stat-total-movies">
                    {(favorites?.length || 0) + (watchlists?.reduce((acc, list) => acc + (list.itemCount || 0), 0) || 0)}
                  </h3>
                  <p className="text-muted-foreground">Total Movies Saved</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Trending Content */}
        <section className="py-16" data-testid="trending-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h2 className="text-3xl font-display font-bold text-center mb-2" data-testid="trending-title">
                Trending This Week
              </h2>
              <p className="text-muted-foreground text-center">
                Discover the most popular movies and TV shows
              </p>
            </div>
            
            <Tabs defaultValue="movies" className="w-full" data-testid="trending-tabs">
              <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8">
                <TabsTrigger value="movies" data-testid="tab-movies">Movies</TabsTrigger>
                <TabsTrigger value="tv" data-testid="tab-tv">TV Shows</TabsTrigger>
              </TabsList>
              
              <TabsContent value="movies" data-testid="movies-tab-content">
                {trendingMovies?.results && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {trendingMovies.results.slice(0, 12).map((movie) => (
                      <Link key={movie.id} href={`/movie/${movie.id}`}>
                        <div className="movie-card group cursor-pointer">
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
                                <span className="text-muted-foreground text-xs text-center p-2">
                                  No Image
                                </span>
                              </div>
                            )}
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
                      </Link>
                    ))}
                  </div>
                )}
                <div className="text-center mt-8">
                  <Link href="/movies">
                    <Button variant="outline" data-testid="button-view-all-movies">
                      View All Movies
                    </Button>
                  </Link>
                </div>
              </TabsContent>
              
              <TabsContent value="tv" data-testid="tv-tab-content">
                {trendingTVShows?.results && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {trendingTVShows.results.slice(0, 12).map((show) => (
                      <div key={show.id} className="tv-card group cursor-pointer">
                        <div className="aspect-[2/3] relative overflow-hidden rounded-lg bg-accent">
                          {show.poster_path ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w500${show.poster_path}`}
                              alt={show.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <span className="text-muted-foreground text-xs text-center p-2">
                                No Image
                              </span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute bottom-4 left-4 right-4">
                              <div className="flex items-center gap-2 text-white">
                                <i className="fas fa-star text-secondary"></i>
                                <span data-testid={`tv-rating-${show.id}`}>{show.vote_average.toFixed(1)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3">
                          <h3 className="font-semibold truncate" data-testid={`tv-title-${show.id}`}>
                            {show.name}
                          </h3>
                          <p className="text-sm text-muted-foreground" data-testid={`tv-year-${show.id}`}>
                            {show.first_air_date ? new Date(show.first_air_date).getFullYear() : 'TBA'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="text-center mt-8">
                  <Button variant="outline" disabled data-testid="button-view-all-tv">
                    View All TV Shows (Coming Soon)
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* Personalized Recommendations */}
        <section className="py-16 bg-card/30" data-testid="recommendations-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-display font-bold mb-4" data-testid="recommendations-title">
                Recommended for You
              </h2>
              <p className="text-muted-foreground mb-8" data-testid="recommendations-description">
                Based on your viewing history and preferences
              </p>
              
              <div className="bg-accent/50 rounded-lg p-8 border border-border">
                <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-robot text-2xl text-secondary"></i>
                </div>
                <h3 className="text-xl font-semibold mb-3" data-testid="recommendations-coming-soon">
                  Personalized Recommendations Coming Soon!
                </h3>
                <p className="text-muted-foreground mb-6">
                  Our AI recommendation engine is learning from your preferences. Add some movies to your favorites and watchlists to get started.
                </p>
                <Link href="/movies">
                  <Button data-testid="button-explore-movies">
                    Explore Movies
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
