import { Button } from "@/components/ui/button";
import { Play, Info, Star, Sparkles, Film } from "lucide-react";
import { Link } from "wouter";

export default function HeroSection() {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center hero-gradient overflow-hidden" data-testid="hero-section">
      {/* Enhanced background with multiple layers */}
      <div className="absolute inset-0 z-0">
        <img
          src="/hero-background.jpg"
          alt="Epic movie scene with dramatic lighting and cinematic atmosphere"
          className="w-full h-full object-cover opacity-20 scale-105 animate-ken-burns motion-reduce:animate-none motion-reduce:scale-100"
          style={{ willChange: 'transform' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5"></div>
      </div>

      {/* Floating decorative elements */}
      <div className="absolute inset-0 z-[5] pointer-events-none motion-reduce:hidden">
        <div className="absolute top-20 left-10 w-2 h-2 bg-primary/30 rounded-full animate-float-slow motion-reduce:animate-none" aria-hidden="true"></div>
        <div className="absolute top-32 right-20 w-1 h-1 bg-secondary/40 rounded-full animate-float-medium motion-reduce:animate-none sm:block hidden" aria-hidden="true"></div>
        <div className="absolute bottom-40 left-20 w-3 h-3 bg-primary/20 rounded-full animate-float-fast motion-reduce:animate-none" aria-hidden="true"></div>
        <div className="absolute bottom-60 right-10 w-1.5 h-1.5 bg-secondary/30 rounded-full animate-float-slow motion-reduce:animate-none sm:block hidden" aria-hidden="true"></div>
        <Star className="absolute top-40 right-40 w-4 h-4 text-secondary/30 animate-pulse-slow motion-reduce:animate-none" aria-hidden="true" focusable="false" />
        <Sparkles className="absolute bottom-80 left-40 w-3 h-3 text-primary/30 animate-pulse-slow motion-reduce:animate-none sm:block hidden" aria-hidden="true" focusable="false" />
        <Film className="absolute top-60 left-60 w-3 h-3 text-secondary/20 animate-float-medium motion-reduce:animate-none" aria-hidden="true" focusable="false" />
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="space-y-8">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-black mb-8 animate-slide-up-stagger-1" data-testid="hero-title">
            <div className="inline-block mb-2 lg:mb-0">Discover Your Next</div>
            <div className="inline-block">
              <span className="bg-gradient-to-r from-primary via-primary-300 to-secondary bg-clip-text text-transparent animate-gradient-x motion-reduce:animate-none"> Favorite Movie</span>
            </div>
          </h1>
          
          <p className="text-lg sm:text-xl lg:text-2xl text-muted-foreground/90 mb-10 max-w-4xl mx-auto leading-relaxed font-medium animate-slide-up-stagger-2" data-testid="hero-description">
            Explore millions of movies, get personalized recommendations, and 
            <span className="text-foreground/95 font-semibold bg-gradient-to-r from-primary/20 to-secondary/20 px-2 py-1 rounded-md"> never miss the latest releases</span>
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16 animate-slide-up-stagger-3">
            <Link href="/movies">
              <Button 
                size="lg" 
                className="btn-interactive group relative overflow-hidden bg-gradient-to-r from-primary via-primary-500 to-primary-600 hover:from-primary-400 hover:via-primary-500 hover:to-primary-700 text-white shadow-lg hover:shadow-2xl hover:shadow-primary/30 border-0 px-10 py-5 text-lg font-bold tracking-wide transition-all duration-500 rounded-xl" 
                data-testid="button-start-exploring"
              >
                <Play className="w-5 h-5 mr-3 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300" />
                Start Exploring
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
              </Button>
            </Link>
            <Link href="/about">
              <Button 
                size="lg" 
                variant="outline" 
                className="group glassmorphism-card border-2 border-white/20 hover:border-primary/60 backdrop-blur-sm hover:bg-primary/8 px-10 py-5 text-lg font-semibold transition-all duration-500 rounded-xl hover:scale-105" 
                data-testid="button-learn-more"
              >
                <Info className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform duration-300" />
                Learn More
              </Button>
            </Link>
          </div>
          
          {/* Enhanced Stats with cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-5xl mx-auto animate-slide-up-stagger-4" data-testid="stats-grid">
            <div className="group text-center p-8 rounded-2xl glassmorphism-card bg-gradient-to-br from-primary/12 to-primary/6 border border-primary/25 hover:border-primary/50 backdrop-blur-sm transition-all duration-500 hover:scale-110 hover:shadow-xl hover:shadow-primary/20">
              <div className="text-5xl lg:text-6xl font-display font-black text-primary mb-3 group-hover:scale-110 transition-transform duration-500" data-testid="stat-movies">
                1M+
              </div>
              <div className="text-sm font-bold text-foreground/80 uppercase tracking-widest">Movies</div>
            </div>
            <div className="group text-center p-8 rounded-2xl glassmorphism-card bg-gradient-to-br from-secondary/12 to-secondary/6 border border-secondary/25 hover:border-secondary/50 backdrop-blur-sm transition-all duration-500 hover:scale-110 hover:shadow-xl hover:shadow-secondary/20">
              <div className="text-5xl lg:text-6xl font-display font-black text-secondary mb-3 group-hover:scale-110 transition-transform duration-500" data-testid="stat-users">
                50K+
              </div>
              <div className="text-sm font-bold text-foreground/80 uppercase tracking-widest">Users</div>
            </div>
            <div className="group text-center p-8 rounded-2xl glassmorphism-card bg-gradient-to-br from-primary/12 to-primary/6 border border-primary/25 hover:border-primary/50 backdrop-blur-sm transition-all duration-500 hover:scale-110 hover:shadow-xl hover:shadow-primary/20">
              <div className="text-5xl lg:text-6xl font-display font-black text-primary mb-3 group-hover:scale-110 transition-transform duration-500" data-testid="stat-reviews">
                100K+
              </div>
              <div className="text-sm font-bold text-foreground/80 uppercase tracking-widest">Reviews</div>
            </div>
            <div className="group text-center p-8 rounded-2xl glassmorphism-card bg-gradient-to-br from-secondary/12 to-secondary/6 border border-secondary/25 hover:border-secondary/50 backdrop-blur-sm transition-all duration-500 hover:scale-110 hover:shadow-xl hover:shadow-secondary/20">
              <div className="text-5xl lg:text-6xl font-display font-black text-secondary mb-3 group-hover:scale-110 transition-transform duration-500" data-testid="stat-countries">
                50+
              </div>
              <div className="text-sm font-bold text-foreground/80 uppercase tracking-widest">Countries</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
