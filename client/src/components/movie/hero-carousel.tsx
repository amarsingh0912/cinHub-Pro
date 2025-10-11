import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Play, Info, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import type { Movie } from "@/types/movie";

interface HeroCarouselProps {
  autoplayInterval?: number;
}

export default function HeroCarousel({ autoplayInterval = 5000 }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const { data: trendingMovies, isLoading } = useQuery<{ results: Movie[] }>({
    queryKey: ["/api/movies/trending"],
    staleTime: 1000 * 60 * 15,
  });

  const featuredMovies = trendingMovies?.results?.slice(0, 5) || [];

  useEffect(() => {
    if (featuredMovies.length === 0) return;

    const interval = setInterval(() => {
      handleNext();
    }, autoplayInterval);

    return () => clearInterval(interval);
  }, [currentIndex, featuredMovies.length, autoplayInterval]);

  const handleNext = () => {
    if (isTransitioning || featuredMovies.length === 0) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % featuredMovies.length);
    setTimeout(() => setIsTransitioning(false), 600);
  };

  const handlePrev = () => {
    if (isTransitioning || featuredMovies.length === 0) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + featuredMovies.length) % featuredMovies.length);
    setTimeout(() => setIsTransitioning(false), 600);
  };

  const goToSlide = (index: number) => {
    if (isTransitioning || index === currentIndex) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 600);
  };

  if (isLoading || featuredMovies.length === 0) {
    return (
      <div className="relative h-[70vh] md:h-[80vh] bg-gradient-to-br from-primary/10 to-secondary/10 animate-pulse" data-testid="hero-carousel-skeleton">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-muted-foreground">Loading featured content...</div>
        </div>
      </div>
    );
  }

  const currentMovie = featuredMovies[currentIndex];
  const backdropUrl = currentMovie?.backdrop_path 
    ? `https://image.tmdb.org/t/p/original${currentMovie.backdrop_path}`
    : `https://image.tmdb.org/t/p/w1280${currentMovie?.poster_path}`;

  return (
    <section className="relative h-[70vh] md:h-[80vh] overflow-hidden group" data-testid="hero-carousel">
      {featuredMovies.map((movie, index) => {
        const isActive = index === currentIndex;
        const movieBackdrop = movie.backdrop_path 
          ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
          : `https://image.tmdb.org/t/p/w1280${movie.poster_path}`;

        return (
          <div
            key={movie.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              isActive ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
            data-testid={`hero-slide-${index}`}
          >
            <div className="absolute inset-0">
              <img
                src={movieBackdrop}
                alt={movie.title || "Featured content"}
                className="w-full h-full object-cover scale-105"
                loading={index === 0 ? "eager" : "lazy"}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/20" />
              <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/50 to-transparent" />
              <div 
                className="absolute inset-0 opacity-30 blur-3xl"
                style={{
                  background: `radial-gradient(circle at 20% 50%, rgba(147, 51, 234, 0.3), transparent 60%)`
                }}
              />
            </div>

            {isActive && (
              <div className="relative z-20 h-full flex items-center">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                  <div className="max-w-2xl space-y-6 animate-fade-in">
                    <div className="inline-flex items-center gap-2 bg-primary/20 backdrop-blur-sm rounded-full px-4 py-2 mb-2">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                      <span className="text-sm font-medium text-primary">Featured</span>
                    </div>

                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight" data-testid={`hero-title-${index}`}>
                      {movie.title}
                    </h1>

                    <div className="flex items-center gap-4 text-sm md:text-base">
                      {movie.vote_average > 0 && (
                        <div className="flex items-center gap-1" data-testid={`hero-rating-${index}`}>
                          <span className="text-yellow-500">★</span>
                          <span className="font-semibold">{movie.vote_average.toFixed(1)}</span>
                        </div>
                      )}
                      {movie.release_date && (
                        <span className="text-muted-foreground">
                          {new Date(movie.release_date).getFullYear()}
                        </span>
                      )}
                      {movie.genre_ids && movie.genre_ids.length > 0 && (
                        <span className="text-muted-foreground">
                          {/* We'd need genre mapping here, simplified for now */}
                          {movie.genre_ids.slice(0, 2).join(" • ")}
                        </span>
                      )}
                    </div>

                    <p className="text-base md:text-lg text-muted-foreground line-clamp-3 max-w-xl" data-testid={`hero-overview-${index}`}>
                      {movie.overview}
                    </p>

                    <div className="flex flex-wrap gap-4 pt-4">
                      <Link href={`/movie/${movie.id}`}>
                        <Button size="lg" className="group" data-testid={`button-play-${index}`}>
                          <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="currentColor" />
                          Watch Now
                        </Button>
                      </Link>
                      <Link href={`/movie/${movie.id}`}>
                        <Button size="lg" variant="outline" className="backdrop-blur-sm bg-background/50" data-testid={`button-info-${index}`}>
                          <Info className="w-5 h-5 mr-2" />
                          More Info
                        </Button>
                      </Link>
                      <Button size="lg" variant="outline" className="backdrop-blur-sm bg-background/50" data-testid={`button-watchlist-${index}`}>
                        <Plus className="w-5 h-5 mr-2" />
                        Add to Watchlist
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <button
        onClick={handlePrev}
        disabled={isTransitioning}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
        aria-label="Previous slide"
        data-testid="button-prev-slide"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={handleNext}
        disabled={isTransitioning}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
        aria-label="Next slide"
        data-testid="button-next-slide"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-2" data-testid="carousel-indicators">
        {featuredMovies.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            disabled={isTransitioning}
            className={`h-1 rounded-full transition-all duration-300 ${
              index === currentIndex 
                ? "w-8 bg-primary" 
                : "w-6 bg-white/50 hover:bg-white/70"
            }`}
            aria-label={`Go to slide ${index + 1}`}
            data-testid={`indicator-${index}`}
          />
        ))}
      </div>
    </section>
  );
}
