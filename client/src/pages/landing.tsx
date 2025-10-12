import { useQuery } from "@tanstack/react-query";
import type { MovieResponse } from "@/types/movie";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { getImageUrl } from "@/lib/tmdb";
import { 
  Play, 
  TrendingUp, 
  Globe, 
  Star, 
  ChevronRight,
  Sparkles,
  Film,
  Heart,
  Zap,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SiApple, SiAndroid, SiGoogleplay } from "react-icons/si";
import { useRevealAnimation, REVEAL_PRESETS } from "@/hooks/useRevealAnimation";

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [nextHeroIndex, setNextHeroIndex] = useState(0);

  const { data: trendingMovies } = useQuery<MovieResponse>({
    queryKey: ["/api/movies/trending"],
    staleTime: 1000 * 60 * 15,
  });

  const { data: popularMovies } = useQuery<MovieResponse>({
    queryKey: ["/api/movies/popular"],
    staleTime: 1000 * 60 * 15,
  });

  // Reveal animations for sections
  const heroTitleReveal = useRevealAnimation(REVEAL_PRESETS.heroTitle);
  const heroSubtitleReveal = useRevealAnimation(REVEAL_PRESETS.heroSubtitle);
  const heroButtonsReveal = useRevealAnimation(REVEAL_PRESETS.heroButtons);
  const featuresSectionReveal = useRevealAnimation({ animation: 'fade-in-up', threshold: 0.2 });
  const genresSectionReveal = useRevealAnimation({ animation: 'fade-in-up', threshold: 0.2 });
  const testimonialsSectionReveal = useRevealAnimation({ animation: 'fade-in-up', threshold: 0.2 });

  // Handle scroll for navigation transparency and parallax
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 50);
      setScrollY(currentScrollY);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-rotate hero images with smooth crossfade
  useEffect(() => {
    if (!trendingMovies?.results?.length) return;
    
    const interval = setInterval(() => {
      const next = (currentHeroIndex + 1) % Math.min(5, trendingMovies.results.length);
      setNextHeroIndex(next);
      
      // After crossfade duration, swap current to next
      setTimeout(() => {
        setCurrentHeroIndex(next);
      }, 1200);
    }, 6000);
    
    return () => clearInterval(interval);
  }, [trendingMovies, currentHeroIndex]);

  const currentHero = trendingMovies?.results?.[currentHeroIndex];
  const nextHero = trendingMovies?.results?.[nextHeroIndex];

  const genres = [
    { id: 28, name: "Action", emoji: "💥", color: "from-red-500/20 to-orange-500/20" },
    { id: 10749, name: "Romance", emoji: "💕", color: "from-pink-500/20 to-rose-500/20" },
    { id: 878, name: "Sci-Fi", emoji: "🚀", color: "from-blue-500/20 to-cyan-500/20" },
    { id: 53, name: "Thriller", emoji: "🔪", color: "from-purple-500/20 to-indigo-500/20" },
    { id: 35, name: "Comedy", emoji: "😂", color: "from-yellow-500/20 to-amber-500/20" },
    { id: 18, name: "Drama", emoji: "🎭", color: "from-slate-500/20 to-gray-500/20" },
  ];

  const features = [
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "Personalized Recommendations",
      description: "AI-powered suggestions tailored to your unique taste",
      color: "text-purple-400"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Seamless Streaming Experience",
      description: "4K quality with zero buffering, anywhere you watch",
      color: "text-blue-400"
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Watch Anywhere",
      description: "All your devices, one account, endless entertainment",
      color: "text-green-400"
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Your Curated Watchlist",
      description: "Organize, track, and never miss your next favorite",
      color: "text-red-400"
    }
  ];

  const testimonials = [
    { 
      name: "Sarah M.", 
      text: "The best streaming platform I've ever used. The recommendations are spot-on!",
      rating: 5 
    },
    { 
      name: "James K.", 
      text: "Finally, a service that understands my taste in movies. Absolutely love it!",
      rating: 5 
    },
    { 
      name: "Emma R.", 
      text: "The interface is beautiful and so easy to use. 10/10 would recommend!",
      rating: 5 
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="landing-page">
      {/* Dynamic Navigation Bar */}
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled 
            ? 'bg-background/80 backdrop-blur-xl border-b border-border shadow-lg' 
            : 'bg-transparent'
        }`}
        role="navigation"
        aria-label="Main navigation"
        data-testid="main-nav"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/">
              <a className="flex items-center gap-2 group" data-testid="link-home">
                <Film className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-2xl font-display font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  cinHub Pro
                </span>
              </a>
            </Link>
            
            <div className="hidden md:flex items-center gap-8">
              <Link href="/movies">
                <a className="text-sm font-medium hover:text-primary transition-colors" data-testid="link-movies">
                  Movies
                </a>
              </Link>
              <Link href="/tv-shows">
                <a className="text-sm font-medium hover:text-primary transition-colors" data-testid="link-tv-shows">
                  TV Shows
                </a>
              </Link>
              <Button variant="ghost" size="sm" data-testid="button-login">
                Login
              </Button>
              <Button size="sm" className="bg-gradient-to-r from-primary to-secondary" data-testid="button-signup">
                Sign Up Free
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Smooth Crossfade */}
      <section 
        className="relative h-[90vh] flex items-center justify-center overflow-hidden"
        data-testid="hero-section"
        aria-label="Hero banner"
      >
        {/* Layered Background Images with Parallax and Crossfade */}
        <div className="absolute inset-0 z-0">
          {/* Base Layer - Current Image (always visible) */}
          {currentHero && (
            <div 
              key={`current-${currentHeroIndex}`}
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${getImageUrl(currentHero.backdrop_path, 'original')})`,
                transform: `translateY(${scrollY * 0.3}px) scale(${1 + scrollY * 0.0002})`,
                opacity: 1,
                zIndex: 0
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-transparent to-background/60" />
            </div>
          )}
          
          {/* Overlay Layer - Next Image (crossfades in) */}
          {nextHero && nextHeroIndex !== currentHeroIndex && (
            <div 
              key={`next-${nextHeroIndex}`}
              className="absolute inset-0 bg-cover bg-center animate-fade-in"
              style={{
                backgroundImage: `url(${getImageUrl(nextHero.backdrop_path, 'original')})`,
                transform: `translateY(${scrollY * 0.3}px) scale(${1 + scrollY * 0.0002})`,
                animationDuration: '1200ms',
                animationFillMode: 'forwards',
                zIndex: 1
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-transparent to-background/60" />
            </div>
          )}
        </div>

        {/* Hero Content with Reveal Animations */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-6 text-sm px-4 py-1" data-testid="badge-trending">
            <TrendingUp className="w-4 h-4 mr-2" />
            Trending Now
          </Badge>
          
          <h1 
            ref={heroTitleReveal.ref as any}
            className={`text-5xl md:text-7xl lg:text-8xl font-display font-bold mb-6 ${heroTitleReveal.className}`}
            data-testid="hero-title"
          >
            <span className="bg-gradient-to-r from-white via-primary to-secondary bg-clip-text text-transparent">
              Discover. Watch.
            </span>
            <br />
            <span className="text-foreground">
              Experience Cinema
            </span>
            <br />
            <span className="text-foreground/80 text-4xl md:text-5xl lg:text-6xl">
              Like Never Before
            </span>
          </h1>

          <p 
            ref={heroSubtitleReveal.ref as any}
            className={`text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 ${heroSubtitleReveal.className}`}
            data-testid="hero-description"
          >
            Stream thousands of movies and TV shows in stunning 4K. Your next favorite story is just a click away.
          </p>

          <div 
            ref={heroButtonsReveal.ref as any}
            className={`flex flex-col sm:flex-row gap-4 justify-center ${heroButtonsReveal.className}`}
          >
            <Button 
              size="lg" 
              className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-secondary hover:shadow-primary group"
              data-testid="button-get-started"
            >
              <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
              Get Started Free
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-6 border-2 hover:bg-primary/10"
              data-testid="button-explore"
            >
              Explore Movies
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronRight className="w-6 h-6 rotate-90 text-muted-foreground" />
        </div>
      </section>

      {/* Features Section with Scroll-Triggered Reveal */}
      <section 
        ref={featuresSectionReveal.ref as any}
        className={`py-24 relative overflow-hidden ${featuresSectionReveal.className}`}
        data-testid="features-section" 
        aria-label="Platform features"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4" data-testid="features-title">
              Why Choose cinHub Pro?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="features-subtitle">
              Experience the future of entertainment with cutting-edge features
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index}
                className="group hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20 bg-card/50 backdrop-blur border-border/50"
                data-testid={`feature-card-${index}`}
                style={{
                  animationDelay: `${index * 100}ms`
                }}
              >
                <CardContent className="p-6 text-center">
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${feature.color === 'text-purple-400' ? 'from-purple-500/20 to-pink-500/20' : feature.color === 'text-blue-400' ? 'from-blue-500/20 to-cyan-500/20' : feature.color === 'text-green-400' ? 'from-green-500/20 to-emerald-500/20' : 'from-red-500/20 to-rose-500/20'} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                    <div className={feature.color}>
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-display font-semibold mb-3" data-testid={`feature-title-${index}`}>
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground" data-testid={`feature-description-${index}`}>
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Genre Showcase with Scroll Reveal */}
      <section 
        ref={genresSectionReveal.ref as any}
        className={`py-24 bg-card/30 ${genresSectionReveal.className}`}
        data-testid="genres-section" 
        aria-label="Browse genres"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4" data-testid="genres-title">
              Explore Every Genre
            </h2>
            <p className="text-xl text-muted-foreground" data-testid="genres-subtitle">
              From action-packed thrillers to heartwarming romances
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {genres.map((genre, index) => (
              <Link key={genre.id} href={`/genre/${genre.id}`}>
                <Card 
                  className="group cursor-pointer hover:scale-105 transition-all duration-300 overflow-hidden border-2 border-transparent hover:border-primary/50 bg-gradient-to-br hover:shadow-2xl"
                  data-testid={`genre-card-${genre.id}`}
                  style={{
                    animationDelay: `${index * 80}ms`
                  }}
                >
                  <CardContent className={`p-8 text-center bg-gradient-to-br ${genre.color} group-hover:opacity-100 opacity-90 transition-opacity`}>
                    <div className="text-5xl mb-3 transform group-hover:scale-125 transition-transform duration-300">
                      {genre.emoji}
                    </div>
                    <h3 className="text-lg font-display font-semibold group-hover:text-primary transition-colors" data-testid={`genre-name-${genre.id}`}>
                      {genre.name}
                    </h3>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials & Social Proof with Scroll Reveal */}
      <section 
        ref={testimonialsSectionReveal.ref as any}
        className={`py-24 relative overflow-hidden ${testimonialsSectionReveal.className}`}
        data-testid="testimonials-section" 
        aria-label="User testimonials"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <Badge className="mb-4 text-sm px-4 py-1" data-testid="badge-social-proof">
              <Star className="w-4 h-4 mr-2 fill-current" />
              Loved by 100,000+ Movie Fans
            </Badge>
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4" data-testid="testimonials-title">
              What Our Users Say
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {testimonials.map((testimonial, index) => (
              <Card 
                key={index}
                className="bg-card/50 backdrop-blur border-border/50"
                data-testid={`testimonial-card-${index}`}
                style={{
                  animationDelay: `${index * 150}ms`
                }}
              >
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4" data-testid={`testimonial-rating-${index}`}>
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 italic" data-testid={`testimonial-text-${index}`}>
                    "{testimonial.text}"
                  </p>
                  <p className="font-semibold" data-testid={`testimonial-name-${index}`}>
                    {testimonial.name}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div data-testid="stat-movies">
              <div className="text-4xl md:text-5xl font-display font-bold text-primary mb-2">50K+</div>
              <div className="text-muted-foreground">Movies & Shows</div>
            </div>
            <div data-testid="stat-users">
              <div className="text-4xl md:text-5xl font-display font-bold text-secondary mb-2">100K+</div>
              <div className="text-muted-foreground">Active Users</div>
            </div>
            <div data-testid="stat-countries">
              <div className="text-4xl md:text-5xl font-display font-bold text-green-400 mb-2">150+</div>
              <div className="text-muted-foreground">Countries</div>
            </div>
            <div data-testid="stat-rating">
              <div className="text-4xl md:text-5xl font-display font-bold text-blue-400 mb-2">4.9/5</div>
              <div className="text-muted-foreground">User Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden" data-testid="cta-section" aria-label="Call to action">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary/20" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h2 className="text-4xl md:text-6xl font-display font-bold mb-6" data-testid="cta-title">
            Ready to Start Watching?
          </h2>
          <p className="text-xl text-muted-foreground mb-10" data-testid="cta-description">
            Join thousands of movie lovers. Start your free trial today. No credit card required.
          </p>
          <Button 
            size="lg" 
            className="text-xl px-12 py-8 bg-gradient-to-r from-primary to-secondary hover:shadow-2xl hover:shadow-primary/50 group"
            data-testid="button-start-free-trial"
          >
            <Play className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
            Start Your Free Trial
          </Button>

          {/* App Download Badges */}
          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <Badge variant="outline" className="px-4 py-2 text-sm" data-testid="badge-app-store">
              <SiApple className="w-5 h-5 mr-2" />
              App Store
            </Badge>
            <Badge variant="outline" className="px-4 py-2 text-sm" data-testid="badge-google-play">
              <SiGoogleplay className="w-5 h-5 mr-2" />
              Google Play
            </Badge>
            <Badge variant="outline" className="px-4 py-2 text-sm" data-testid="badge-android">
              <SiAndroid className="w-5 h-5 mr-2" />
              Android
            </Badge>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card/30 border-t border-border py-12" role="contentinfo" data-testid="footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Film className="w-8 h-8 text-primary" />
                <span className="text-xl font-display font-bold">cinHub Pro</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4" data-testid="footer-mission">
                Bringing the magic of cinema to your screen. Stream, discover, and fall in love with movies all over again.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4" data-testid="footer-product-title">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/movies"><a className="hover:text-primary transition-colors" data-testid="footer-link-movies">Movies</a></Link></li>
                <li><Link href="/tv-shows"><a className="hover:text-primary transition-colors" data-testid="footer-link-tv-shows">TV Shows</a></Link></li>
                <li><Link href="/search"><a className="hover:text-primary transition-colors" data-testid="footer-link-search">Search</a></Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4" data-testid="footer-company-title">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about"><a className="hover:text-primary transition-colors" data-testid="footer-link-about">About Us</a></Link></li>
                <li><Link href="/contact"><a className="hover:text-primary transition-colors" data-testid="footer-link-contact">Contact</a></Link></li>
                <li><Link href="/privacy-policy"><a className="hover:text-primary transition-colors" data-testid="footer-link-privacy">Privacy Policy</a></Link></li>
                <li><Link href="/terms-of-service"><a className="hover:text-primary transition-colors" data-testid="footer-link-terms">Terms of Service</a></Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4" data-testid="footer-download-title">Download Apps</h3>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start" data-testid="button-download-ios">
                  <SiApple className="w-5 h-5 mr-2" />
                  iOS App
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start" data-testid="button-download-android">
                  <SiAndroid className="w-5 h-5 mr-2" />
                  Android App
                </Button>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground" data-testid="footer-copyright">
            <p>© 2025 cinHub Pro. All rights reserved. Made with ❤️ for movie lovers.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
