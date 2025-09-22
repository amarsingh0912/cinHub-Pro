import { useQuery } from "@tanstack/react-query";
import type { MovieResponse } from "@/types/movie";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MovieGrid from "@/components/movie/movie-grid";
import { Link } from "wouter";
import { Plus, Heart, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { user } = useAuth();
  
  const { data: trendingMovies } = useQuery<MovieResponse>({
    queryKey: ["/api/movies/trending"],
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

        {/* Trending Movies */}
        {trendingMovies?.results && (
          <MovieGrid
            movies={trendingMovies.results.slice(0, 12)}
            title="Trending This Week"
            showViewAll
            viewAllHref="/movies"
          />
        )}

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
