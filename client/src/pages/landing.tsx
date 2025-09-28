import { useQuery } from "@tanstack/react-query";
import type { MovieResponse, TVResponse } from "@/types/movie";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import HeroSection from "@/components/movie/hero-section";
import MovieGrid from "@/components/movie/movie-grid";
import MovieCard from "@/components/movie/movie-card";
import CategoryGrid from "@/components/movie/category-grid";
import FeaturedCollections from "@/components/movie/featured-collections";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Link } from "wouter";
import { getImageUrl } from "@/lib/tmdb";
import { List, Bot, Bell, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Landing() {
  const { data: trendingMovies } = useQuery<MovieResponse>({
    queryKey: ["/api/movies/trending"],
    staleTime: 1000 * 60 * 15, // 15 minutes
  });

  const { data: trendingTVShows } = useQuery<TVResponse>({
    queryKey: ["/api/tv/trending"],
    staleTime: 1000 * 60 * 15, // 15 minutes
  });

  const { data: popularMovies } = useQuery<MovieResponse>({
    queryKey: ["/api/movies/popular"],
    staleTime: 1000 * 60 * 15, // 15 minutes
  });

  const { data: popularTVShows } = useQuery<TVResponse>({
    queryKey: ["/api/tv/popular"],
    staleTime: 1000 * 60 * 15, // 15 minutes
  });

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="landing-page">
      <Header />
      
      <main className="pt-16">
        <HeroSection />
        
        {/* Trending Section with Tabs */}
        <section className="py-16 animate-fade-in-up" data-testid="trending-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8 animate-slide-up-stagger-1">
              <h2 className="text-3xl font-display font-bold text-center mb-2" data-testid="trending-title">
                Trending Now
              </h2>
              <p className="text-muted-foreground text-center">
                Discover the most popular movies and TV shows this week
              </p>
            </div>
            
            <Tabs defaultValue="movies" className="w-full animate-slide-up-stagger-2" data-testid="trending-tabs">
              <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8">
                <TabsTrigger value="movies" data-testid="tab-trending-movies">Movies</TabsTrigger>
                <TabsTrigger value="tv" data-testid="tab-trending-tv">TV Shows</TabsTrigger>
              </TabsList>
              
              <TabsContent value="movies" data-testid="trending-movies-tab-content">
                {trendingMovies?.results && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 animate-stagger-in">
                    {trendingMovies.results.slice(0, 12).map((movie) => (
                      <MovieCard key={movie.id} movie={movie} mediaType="movie" />
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
              
              <TabsContent value="tv" data-testid="trending-tv-tab-content">
                {trendingTVShows?.results && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 animate-stagger-in">
                    {trendingTVShows.results.slice(0, 12).map((show) => (
                      <MovieCard key={show.id} movie={show} mediaType="tv" />
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
        
        <div className="animate-fade-in-up">
          <CategoryGrid />
        </div>
        
        <div className="animate-fade-in-up">
          <FeaturedCollections />
        </div>
        
        {/* Popular Section with Tabs */}
        <section className="py-16 bg-card/30 animate-fade-in-up" data-testid="popular-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8 animate-slide-up-stagger-1">
              <h2 className="text-3xl font-display font-bold text-center mb-2" data-testid="popular-title">
                Popular This Week
              </h2>
              <p className="text-muted-foreground text-center">
                Most watched movies and TV shows right now
              </p>
            </div>
            
            <Tabs defaultValue="movies" className="w-full animate-slide-up-stagger-2" data-testid="popular-tabs">
              <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8">
                <TabsTrigger value="movies" data-testid="tab-popular-movies">Movies</TabsTrigger>
                <TabsTrigger value="tv" data-testid="tab-popular-tv">TV Shows</TabsTrigger>
              </TabsList>
              
              <TabsContent value="movies" data-testid="popular-movies-tab-content">
                {popularMovies?.results && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {popularMovies.results.slice(0, 12).map((movie) => (
                      <MovieCard key={movie.id} movie={movie} mediaType="movie" />
                    ))}
                  </div>
                )}
                <div className="text-center mt-8">
                  <Link href="/movies?category=popular">
                    <Button variant="outline" data-testid="button-view-all-popular-movies">
                      View All Popular Movies
                    </Button>
                  </Link>
                </div>
              </TabsContent>
              
              <TabsContent value="tv" data-testid="popular-tv-tab-content">
                {popularTVShows?.results && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {popularTVShows.results.slice(0, 12).map((show) => (
                      <MovieCard key={show.id} movie={show} mediaType="tv" />
                    ))}
                  </div>
                )}
                <div className="text-center mt-8">
                  <Link href="/tv-shows?category=popular">
                    <Button variant="outline" data-testid="button-view-all-popular-tv">
                      View All Popular TV Shows
                    </Button>
                  </Link>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>
        
        {/* User Features Preview */}
        <section className="py-20 animate-fade-in-up" data-testid="features-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 animate-slide-up-stagger-1">
              <h2 className="text-4xl font-display font-bold mb-4" data-testid="features-title">
                Enhance Your Movie Experience
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="features-description">
                Create personalized watchlists, get AI-powered recommendations, and never miss a great movie again
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-stagger-in" data-testid="features-grid">
              <div className="text-center group">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                  <List className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-display font-semibold mb-3" data-testid="feature-watchlists-title">
                  Personal Watchlists
                </h3>
                <p className="text-muted-foreground" data-testid="feature-watchlists-description">
                  Create unlimited custom lists to organize your must-watch movies and track your viewing progress.
                </p>
              </div>
              
              <div className="text-center group">
                <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-secondary/20 transition-colors">
                  <Bot className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="text-xl font-display font-semibold mb-3" data-testid="feature-recommendations-title">
                  Smart Recommendations
                </h3>
                <p className="text-muted-foreground" data-testid="feature-recommendations-description">
                  Get personalized movie suggestions based on your viewing history and preferences.
                </p>
              </div>
              
              <div className="text-center group">
                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-500/20 transition-colors">
                  <Bell className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="text-xl font-display font-semibold mb-3" data-testid="feature-notifications-title">
                  Release Notifications
                </h3>
                <p className="text-muted-foreground" data-testid="feature-notifications-description">
                  Stay updated with new releases from your favorite actors, directors, and franchises.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
