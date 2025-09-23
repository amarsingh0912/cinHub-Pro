import { Button } from "@/components/ui/button";
import { Play, Info } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center hero-gradient" data-testid="hero-section">
      {/* Hero movie backdrop */}
      <div className="absolute inset-0 z-0">
        <img
          src="/hero-background.jpg"
          alt="Epic movie scene with dramatic lighting and cinematic atmosphere"
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent"></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="animate-fade-in">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold mb-6" data-testid="hero-title">
            Discover Your Next
            <span className="text-primary"> Favorite Movie</span>
          </h1>
          <p className="text-xl sm:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto" data-testid="hero-description">
            Explore millions of movies, get personalized recommendations, and never miss the latest releases
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button size="lg" className="flex items-center gap-2" data-testid="button-start-exploring">
              <Play className="w-5 h-5" />
              Start Exploring
            </Button>
            <Button size="lg" variant="outline" className="flex items-center gap-2" data-testid="button-learn-more">
              <Info className="w-5 h-5" />
              Learn More
            </Button>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-2xl mx-auto" data-testid="stats-grid">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary" data-testid="stat-movies">1M+</div>
              <div className="text-muted-foreground">Movies</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary" data-testid="stat-users">50K+</div>
              <div className="text-muted-foreground">Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary" data-testid="stat-reviews">100K+</div>
              <div className="text-muted-foreground">Reviews</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary" data-testid="stat-countries">50+</div>
              <div className="text-muted-foreground">Countries</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
