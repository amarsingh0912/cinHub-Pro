import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Film } from 'lucide-react';

/**
 * RecommendationCarousel Component
 * 
 * A horizontal scrollable carousel for displaying movie recommendations
 * 
 * Props:
 * @param {string} title - Carousel section title (e.g., "Trending Now", "Because you watched")
 * @param {string} endpoint - API endpoint to fetch recommendations from
 * @param {function} onMovieClick - Optional callback when a movie poster is clicked
 * 
 * Example usage:
 * <RecommendationCarousel 
 *   title="Trending Now" 
 *   endpoint="/api/recs/trending"
 *   onMovieClick={(movie) => navigate(`/movie/${movie.id}`)}
 * />
 */
export default function RecommendationCarousel({ title, endpoint, onMovieClick }) {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scrollPosition, setScrollPosition] = useState(0);

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

  const scroll = (direction) => {
    const container = document.getElementById(`carousel-${title.replace(/\s+/g, '-')}`);
    if (container) {
      const scrollAmount = 300;
      const newPosition = direction === 'left' 
        ? scrollPosition - scrollAmount 
        : scrollPosition + scrollAmount;
      
      container.scrollTo({
        left: newPosition,
        behavior: 'smooth'
      });
      setScrollPosition(newPosition);
    }
  };

  const handleMovieClick = (movie) => {
    if (onMovieClick) {
      onMovieClick(movie);
    }
  };

  if (loading) {
    return (
      <div className="w-full mb-8" data-testid={`carousel-${title.replace(/\s+/g, '-')}-loading`}>
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">{title}</h2>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div 
              key={i} 
              className="min-w-[200px] h-[300px] bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
              data-testid={`skeleton-${i}`}
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg" data-testid="carousel-error">
        <p className="text-red-600 dark:text-red-400">Error loading recommendations: {error}</p>
      </div>
    );
  }

  if (!movies || movies.length === 0) {
    return (
      <div className="w-full mb-8" data-testid="carousel-empty">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">{title}</h2>
        <div className="flex items-center justify-center h-[300px] bg-gray-100 dark:bg-gray-800 rounded-lg">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <Film className="w-16 h-16 mx-auto mb-2 opacity-50" />
            <p>No recommendations available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mb-8 relative group" data-testid={`carousel-${title.replace(/\s+/g, '-')}`}>
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">{title}</h2>
      
      <div className="relative">
        {/* Left scroll button */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/70 hover:bg-black/90 text-white p-2 rounded-r-lg opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Scroll left"
          data-testid="button-scroll-left"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Movie cards container */}
        <div
          id={`carousel-${title.replace(/\s+/g, '-')}`}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {movies.map((movie) => (
            <div
              key={movie.id}
              className="min-w-[200px] flex-shrink-0 cursor-pointer transition-transform hover:scale-105"
              onClick={() => handleMovieClick(movie)}
              data-testid={`card-movie-${movie.id}`}
            >
              <div className="relative rounded-lg overflow-hidden shadow-lg bg-gray-200 dark:bg-gray-700 h-[300px]">
                {movie.poster_url ? (
                  <img
                    src={movie.poster_url}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    data-testid={`img-poster-${movie.id}`}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-800">
                    <Film className="w-16 h-16 text-gray-500 dark:text-gray-600" />
                  </div>
                )}
                
                {/* Overlay with title on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                  <h3 className="text-white font-semibold text-sm mb-1" data-testid={`text-title-${movie.id}`}>
                    {movie.title}
                  </h3>
                  {movie.year && (
                    <p className="text-gray-300 text-xs" data-testid={`text-year-${movie.id}`}>
                      {movie.year}
                    </p>
                  )}
                  {movie.genres && (
                    <p className="text-gray-400 text-xs mt-1 line-clamp-1" data-testid={`text-genres-${movie.id}`}>
                      {movie.genres}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right scroll button */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/70 hover:bg-black/90 text-white p-2 rounded-l-lg opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Scroll right"
          data-testid="button-scroll-right"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Movie count indicator */}
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2" data-testid="text-movie-count">
        {movies.length} {movies.length === 1 ? 'movie' : 'movies'}
      </p>
    </div>
  );
}
