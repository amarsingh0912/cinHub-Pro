import { useQuery } from "@tanstack/react-query";
import type { MovieResponse, TVResponse } from "@/types/movie";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MovieGrid from "@/components/movie/movie-grid";
import MovieCardSkeleton from "@/components/movie/movie-card-skeleton";
import { Link } from "wouter";
import { Plus, Heart, Clock, Film, Star, TrendingUp, Users, Play, ArrowRight, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Home() {
  const { user } = useAuth();
  
  const { data: trendingMovies, isLoading: trendingMoviesLoading } = useQuery<MovieResponse>({
    queryKey: ["/api/movies/trending"],
    staleTime: 1000 * 60 * 15, // 15 minutes
  });

  const { data: trendingTVShows, isLoading: trendingTVShowsLoading } = useQuery<TVResponse>({
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
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden" data-testid="hero-section">
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary/20" />
          
          {/* Animated Background Elements */}
          <div className="absolute inset-0">
            <div className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full animate-pulse" />
            <div className="absolute bottom-20 right-10 w-32 h-32 bg-secondary/10 rounded-full animate-pulse" style={{animationDelay: '1s'}} />
            <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-accent/20 rounded-full animate-pulse" style={{animationDelay: '2s'}} />
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-6">
                <Star className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-primary">Welcome to CineHub Pro</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent" data-testid="hero-title">
                Hey {user?.firstName || 'Movie Lover'}! 👋
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-3xl mx-auto leading-relaxed" data-testid="hero-description">
                Discover incredible movies, create your watchlists, and join a community of film enthusiasts.
              </p>
              
              <p className="text-lg text-muted-foreground/80 mb-12 max-w-2xl mx-auto">
                From blockbuster hits to hidden gems - your next favorite film is just a click away.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12">
                <Link href="/search">
                  <Button size="lg" className="group min-w-[200px]" data-testid="button-search-movies">
                    <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                    Explore Movies
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline" size="lg" className="group min-w-[200px]" data-testid="button-my-dashboard">
                    <User className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                    My Dashboard
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Stats */}
        <section className="py-16 bg-card/30 border-y border-border" data-testid="stats-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-display font-bold mb-4">Your Movie Journey</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">Track your progress and see how your movie collection grows</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center group">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Heart className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-3xl font-bold mb-2" data-testid="stat-favorites">{favorites?.length || 0}</h3>
                <p className="text-muted-foreground">Favorite Movies</p>
              </div>
              
              <div className="text-center group">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Clock className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="text-3xl font-bold mb-2" data-testid="stat-watchlists">{watchlists?.length || 0}</h3>
                <p className="text-muted-foreground">Watchlists</p>
              </div>
              
              <div className="text-center group">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Plus className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-3xl font-bold mb-2" data-testid="stat-total-movies">
                  {(favorites?.length || 0) + (watchlists?.reduce((acc, list) => acc + (list.itemCount || 0), 0) || 0)}
                </h3>
                <p className="text-muted-foreground">Movies Saved</p>
              </div>
              
              <div className="text-center group">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-8 h-8 text-purple-500" />
                </div>
                <h3 className="text-3xl font-bold mb-2">50K+</h3>
                <p className="text-muted-foreground">Movies & Shows Available</p>
              </div>
            </div>
          </div>
        </section>

        {/* Trending Content */}
        <section className="py-20" data-testid="trending-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-orange-500/10 rounded-full px-4 py-2 mb-6">
                <TrendingUp className="w-5 h-5 text-orange-500" />
                <span className="text-sm font-medium text-orange-500">Hot Right Now</span>
              </div>
              
              <h2 className="text-4xl md:text-5xl font-display font-bold mb-6" data-testid="trending-title">
                Trending This Week
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Discover what everyone's watching - from blockbuster hits to binge-worthy series
              </p>
            </div>
            
            <Tabs defaultValue="movies" className="w-full" data-testid="trending-tabs">
              <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8">
                <TabsTrigger value="movies" data-testid="tab-movies">Movies</TabsTrigger>
                <TabsTrigger value="tv" data-testid="tab-tv">TV Shows</TabsTrigger>
              </TabsList>
              
              <TabsContent value="movies" data-testid="movies-tab-content">
                {trendingMoviesLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {Array.from({ length: 12 }, (_, index) => (
                      <MovieCardSkeleton key={index} />
                    ))}
                  </div>
                ) : trendingMovies?.results && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {trendingMovies.results.slice(0, 12).map((movie) => (
                      <Link key={movie.id} href={`/movie/${movie.id}`} data-testid={`link-movie-${movie.id}`}>
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
                                <Film className="w-16 h-16 text-muted-foreground" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="absolute bottom-4 left-4 right-4">
                                <div className="flex items-center gap-2 text-white">
                                  <Star className="w-4 h-4 text-yellow-400 fill-current" aria-hidden="true" />
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
                  <Link href="/movies?category=trending">
                    <Button variant="outline" data-testid="button-view-all-trending-movies">
                      View All Trending Movies
                    </Button>
                  </Link>
                </div>
              </TabsContent>
              
              <TabsContent value="tv" data-testid="tv-tab-content">
                {trendingTVShowsLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {Array.from({ length: 12 }, (_, index) => (
                      <MovieCardSkeleton key={index} />
                    ))}
                  </div>
                ) : trendingTVShows?.results && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {trendingTVShows.results.slice(0, 12).map((show) => (
                      <Link key={show.id} href={`/tv/${show.id}`} data-testid={`link-tv-${show.id}`}>
                        <div className="tv-card group cursor-pointer">
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
                                <Film className="w-16 h-16 text-muted-foreground" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="absolute bottom-4 left-4 right-4">
                                <div className="flex items-center gap-2 text-white">
                                  <Star className="w-4 h-4 text-yellow-400 fill-current" aria-hidden="true" />
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
                      </Link>
                    ))}
                  </div>
                )}
                <div className="text-center mt-8">
                  <Link href="/tv-shows?category=trending">
                    <Button variant="outline" data-testid="button-view-all-trending-tv">
                      View All Trending TV Shows
                    </Button>
                  </Link>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* Community & Features Section */}
        <section className="py-20 relative overflow-hidden" data-testid="community-section">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-blue-500/10 rounded-full px-4 py-2 mb-6">
                <Users className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium text-blue-500">Join the Community</span>
              </div>
              
              <h2 className="text-4xl md:text-5xl font-display font-bold mb-6" data-testid="community-title">
                More Than Just Movies
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-12">
                Connect with fellow movie lovers, share your thoughts, and discover hidden gems together
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <div className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Heart className="w-10 h-10 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Create Watchlists</h3>
                <p className="text-muted-foreground">Organize your must-watch movies and never forget a recommendation again.</p>
              </div>
              
              <div className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Star className="w-10 h-10 text-purple-500" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Rate & Review</h3>
                <p className="text-muted-foreground">Share your thoughts and help others discover their next favorite film.</p>
              </div>
              
              <div className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-500/10 to-orange-600/10 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Film className="w-10 h-10 text-orange-500" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Discover More</h3>
                <p className="text-muted-foreground">Explore curated collections and find movies you never knew existed.</p>
              </div>
            </div>
            
            <div className="text-center">
              <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-8 border border-border/50 max-w-2xl mx-auto">
                <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Star className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold mb-4" data-testid="ai-recommendations-title">
                  AI-Powered Recommendations Coming Soon!
                </h3>
                <p className="text-muted-foreground mb-6">
                  Our intelligent recommendation engine is being trained to understand your unique taste. Start adding movies to your favorites to help us learn your preferences.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/movies">
                    <Button className="min-w-[150px]" data-testid="button-explore-movies">
                      <Film className="w-4 h-4 mr-2" />
                      Explore Movies
                    </Button>
                  </Link>
                  <Link href="/tv-shows">
                    <Button variant="outline" className="min-w-[150px]" data-testid="button-explore-shows">
                      <Play className="w-4 h-4 mr-2" />
                      Browse TV Shows
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
