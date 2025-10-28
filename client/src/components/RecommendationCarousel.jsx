import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Film, Star } from 'lucide-react';

/**
 * Modern, Responsive RecommendationCarousel Component
 * 
 * A fully responsive horizontal scrollable carousel with touch support
 * Optimized for mobile, tablet, and desktop viewing
 * 
 * Props:
 * @param {string} title - Carousel section title
 * @param {string} endpoint - API endpoint to fetch recommendations from
 * @param {function} onMovieClick - Callback when a movie is clicked
 */
export default function RecommendationCarousel({ title, endpoint, onMovieClick }) {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollContainerRef = useRef(null);
  const touchStartX = useRef(0);
  const scrollStartX = useRef(0);

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(endpoint);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch recommendations: ${response.statusText}`);
        }
        
        const data = await response.json();
        setMovies(data);
      } catch (err) {
        console.error('Error fetching recommendations:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (endpoint) {
      fetchRecommendations();
    }
  }, [endpoint]);

  // Update scroll button visibility
  const updateScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    updateScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', updateScrollButtons);
      window.addEventListener('resize', updateScrollButtons);
      return () => {
        container.removeEventListener('scroll', updateScrollButtons);
        window.removeEventListener('resize', updateScrollButtons);
      };
    }
  }, [movies]);

  // Smooth scroll with dynamic amount based on screen size
  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const cardWidth = container.querySelector('[data-movie-card]')?.offsetWidth || 200;
      const gap = 16; // gap-4 = 16px
      const scrollAmount = (cardWidth + gap) * 2; // Scroll 2 cards at a time
      
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Touch/swipe support for mobile
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    scrollStartX.current = scrollContainerRef.current.scrollLeft;
  };

  const handleTouchMove = (e) => {
    if (scrollContainerRef.current) {
      const touchDelta = touchStartX.current - e.touches[0].clientX;
      scrollContainerRef.current.scrollLeft = scrollStartX.current + touchDelta;
    }
  };

  const handleMovieClick = (movie) => {
    if (onMovieClick) {
      onMovieClick(movie);
    }
  };

  if (loading) {
    return (
      <div className="w-full mb-12" data-testid={`carousel-${title.replace(/\s+/g, '-')}-loading`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">{title}</h2>
        </div>
        <div className="flex gap-3 sm:gap-4 overflow-hidden">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div 
              key={i} 
              className="min-w-[140px] sm:min-w-[160px] md:min-w-[180px] lg:min-w-[200px] aspect-[2/3] bg-muted rounded-xl animate-pulse"
              data-testid={`skeleton-${i}`}
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full mb-12 p-4 sm:p-6 bg-destructive/10 border border-destructive/20 rounded-xl" data-testid="carousel-error">
        <p className="text-destructive text-sm sm:text-base">Error loading recommendations: {error}</p>
      </div>
    );
  }

  if (!movies || movies.length === 0) {
    return (
      <div className="w-full mb-12" data-testid="carousel-empty">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-6">{title}</h2>
        <div className="flex items-center justify-center min-h-[280px] sm:min-h-[320px] bg-muted/50 rounded-xl border border-border">
          <div className="text-center text-muted-foreground">
            <Film className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 opacity-50" />
            <p className="text-sm sm:text-base">No recommendations available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mb-12 select-none" data-testid={`carousel-${title.replace(/\s+/g, '-')}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 px-4 sm:px-0">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">{title}</h2>
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className="p-2 rounded-full bg-background border border-border hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            aria-label="Scroll left"
            data-testid="button-scroll-left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className="p-2 rounded-full bg-background border border-border hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            aria-label="Scroll right"
            data-testid="button-scroll-right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Carousel Container */}
      <div className="relative group">
        {/* Desktop Scroll Buttons - Overlay Style */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-background/95 backdrop-blur-sm hover:bg-background text-foreground p-3 rounded-r-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 border border-l-0 border-border"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-background/95 backdrop-blur-sm hover:bg-background text-foreground p-3 rounded-l-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 border border-r-0 border-border"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Movie Cards Container */}
        <div
          ref={scrollContainerRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide scroll-smooth px-4 sm:px-0 snap-x snap-mandatory"
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {movies.map((movie, index) => (
            <div
              key={movie.id}
              data-movie-card
              className="flex-shrink-0 w-[140px] sm:w-[160px] md:w-[180px] lg:w-[200px] snap-start group/card"
              onClick={() => handleMovieClick(movie)}
              data-testid={`card-movie-${movie.id}`}
            >
              {/* Movie Card */}
              <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-muted shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer group-hover/card:scale-105 group-hover/card:z-10">
                {/* Poster Image */}
                {movie.poster_url ? (
                  <img
                    src={movie.poster_url}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    data-testid={`img-poster-${movie.id}`}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/20">
                    <Film className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground/50" />
                  </div>
                )}
                
                {/* Gradient Overlay - Always visible on mobile, hover on desktop */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-100 md:opacity-0 md:group-hover/card:opacity-100 transition-opacity duration-300" />
                
                {/* Movie Info - Always visible on mobile, hover on desktop */}
                <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 transform translate-y-0 md:translate-y-2 md:opacity-0 md:group-hover/card:translate-y-0 md:group-hover/card:opacity-100 transition-all duration-300">
                  <h3 
                    className="text-white font-bold text-sm sm:text-base mb-1 line-clamp-2 drop-shadow-lg" 
                    data-testid={`text-title-${movie.id}`}
                  >
                    {movie.title}
                  </h3>
                  
                  <div className="flex items-center gap-2 mb-1">
                    {movie.year && (
                      <span className="text-white/90 text-xs sm:text-sm font-medium" data-testid={`text-year-${movie.id}`}>
                        {movie.year}
                      </span>
                    )}
                    {movie.avg_rating && (
                      <div className="flex items-center gap-1 bg-yellow-500/90 backdrop-blur-sm px-2 py-0.5 rounded-full">
                        <Star className="w-3 h-3 fill-white text-white" />
                        <span className="text-xs font-bold text-white">
                          {typeof movie.avg_rating === 'number' ? movie.avg_rating.toFixed(1) : movie.avg_rating}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {movie.genres && (
                    <p className="text-white/80 text-xs line-clamp-1" data-testid={`text-genres-${movie.id}`}>
                      {movie.genres.split(',').slice(0, 2).join(' • ')}
                    </p>
                  )}
                </div>

                {/* Index Badge - Desktop only */}
                <div className="hidden md:block absolute top-3 left-3 w-8 h-8 bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity">
                  <span className="text-white text-sm font-bold">{index + 1}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Movie Count */}
      <p className="text-xs sm:text-sm text-muted-foreground mt-4 px-4 sm:px-0" data-testid="text-movie-count">
        {movies.length} {movies.length === 1 ? 'movie' : 'movies'}
      </p>

      {/* Mobile Scroll Indicator */}
      <div className="flex md:hidden justify-center mt-4 gap-1">
        {canScrollLeft && (
          <div className="w-2 h-2 rounded-full bg-primary/30" />
        )}
        <div className="w-2 h-2 rounded-full bg-primary" />
        {canScrollRight && (
          <div className="w-2 h-2 rounded-full bg-primary/30" />
        )}
      </div>
    </div>
  );
}
