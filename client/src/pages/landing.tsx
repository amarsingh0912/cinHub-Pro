import { useQuery } from "@tanstack/react-query";
import type { MovieResponse } from "@/types/movie";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import HeroSection from "@/components/movie/hero-section";
import MovieGrid from "@/components/movie/movie-grid";
import CategoryGrid from "@/components/movie/category-grid";
import FeaturedCollections from "@/components/movie/featured-collections";

export default function Landing() {
  const { data: trendingMovies } = useQuery<MovieResponse>({
    queryKey: ["/api/movies/trending"],
    staleTime: 1000 * 60 * 15, // 15 minutes
  });

  const { data: popularMovies } = useQuery<MovieResponse>({
    queryKey: ["/api/movies/popular"],
    staleTime: 1000 * 60 * 15, // 15 minutes
  });

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="landing-page">
      <Header />
      
      <main className="pt-16">
        <HeroSection />
        
        {trendingMovies?.results && (
          <MovieGrid
            movies={trendingMovies.results.slice(0, 12)}
            title="Trending Now"
            showViewAll
            viewAllHref="/movies"
          />
        )}
        
        <CategoryGrid />
        
        <FeaturedCollections />
        
        {popularMovies?.results && (
          <div className="bg-card/30">
            <MovieGrid
              movies={popularMovies.results.slice(0, 12)}
              title="Popular Movies"
              showViewAll
              viewAllHref="/movies"
            />
          </div>
        )}
        
        {/* User Features Preview */}
        <section className="py-20" data-testid="features-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-display font-bold mb-4" data-testid="features-title">
                Enhance Your Movie Experience
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="features-description">
                Create personalized watchlists, get AI-powered recommendations, and never miss a great movie again
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" data-testid="features-grid">
              <div className="text-center group">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                  <i className="fas fa-list text-2xl text-primary"></i>
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
                  <i className="fas fa-robot text-2xl text-secondary"></i>
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
                  <i className="fas fa-bell text-2xl text-blue-500"></i>
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
