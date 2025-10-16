import { Movie } from "@/types/movie";
import { RevealOnScroll, REVEAL_PRESETS } from "@/hooks/useRevealAnimation";
import MovieCard from "./movie-card";
import MovieCardSkeleton from "./movie-card-skeleton";
import MovieGridSkeleton from "./movie-grid-skeleton";
import { useState, useEffect } from "react";

interface MovieGridProps {
  movies: Movie[];
  title?: string;
  showViewAll?: boolean;
  viewAllHref?: string;
  isLoading?: boolean;
  skeletonCount?: number;
  // Infinite scroll props
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  infiniteScrollTriggerRef?: React.RefObject<HTMLDivElement>;
  mediaType?: "movie" | "tv";
  // Animation props
  enableAnimations?: boolean;
  animationType?: "staggered" | "fade" | "none";
}

// Hook to track grid columns based on viewport and react to resize
function useGridColumns() {
  const [columns, setColumns] = useState(() => {
    if (typeof window === 'undefined') return 6;
    const width = window.innerWidth;
    if (width >= 1024) return 6;
    if (width >= 768) return 4;
    if (width >= 640) return 3;
    return 2;
  });

  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width >= 1024) setColumns(6);
      else if (width >= 768) setColumns(4);
      else if (width >= 640) setColumns(3);
      else setColumns(2);
    };

    // Update immediately on mount to fix SSR hydration
    updateColumns();
    
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  return columns;
}

export default function MovieGrid({
  movies,
  title,
  showViewAll,
  viewAllHref,
  isLoading,
  skeletonCount = 12,
  hasNextPage,
  isFetchingNextPage,
  infiniteScrollTriggerRef,
  mediaType = "movie",
  enableAnimations = true,
  animationType = "staggered",
}: MovieGridProps) {
  const gridColumns = useGridColumns();
  
  // Calculate skeletons needed to fill incomplete row or show full new row
  const getSkeletonCount = () => {
    const remainder = movies.length % gridColumns;
    return remainder === 0 ? gridColumns : gridColumns - remainder;
  };

  if (isLoading) {
    return (
      <MovieGridSkeleton
        title={title}
        showViewAll={showViewAll}
        count={skeletonCount}
      />
    );
  }

  if (!movies.length) {
    return (
      <div className="text-center py-12" data-testid="empty-movies">
        <p className="text-muted-foreground">No movies found.</p>
      </div>
    );
  }

  return (
    <section className="py-16" data-testid="movie-grid-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {title && (
          <RevealOnScroll
            options={
              enableAnimations
                ? REVEAL_PRESETS.sectionHeader
                : { animation: "fade-in", once: false }
            }
          >
            <div className="flex items-center justify-between mb-8">
              <h2
                className="text-3xl font-display font-bold"
                data-testid="section-title"
              >
                {title}
              </h2>
              {showViewAll && viewAllHref && (
                <a
                  href={viewAllHref}
                  className="text-primary hover:text-primary/80 font-medium flex items-center gap-2"
                  data-testid="link-view-all"
                >
                  View All <i className="fas fa-arrow-right"></i>
                </a>
              )}
            </div>
          </RevealOnScroll>
        )}

        {enableAnimations && animationType === "staggered" ? (
          <RevealOnScroll options={REVEAL_PRESETS.staggeredFadeIn}>
            <div
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6"
              data-testid="movie-grid"
            >
              {movies.map((movie, index) => (
                <MovieCard
                  key={`${mediaType}-${movie.id}-${index}`}
                  movie={movie}
                  mediaType={mediaType}
                />
              ))}
              {isFetchingNextPage && Array.from({ length: getSkeletonCount() }, (_, index) => (
                <div key={`skeleton-${movies.length + index}`} role="status" aria-hidden="true">
                  <MovieCardSkeleton />
                </div>
              ))}
            </div>
          </RevealOnScroll>
        ) : enableAnimations && animationType === "fade" ? (
          <RevealOnScroll options={REVEAL_PRESETS.fadeIn}>
            <div
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6"
              data-testid="movie-grid"
            >
              {movies.map((movie, index) => (
                <MovieCard
                  key={`${mediaType}-${movie.id}-${index}`}
                  movie={movie}
                  mediaType={mediaType}
                />
              ))}
              {isFetchingNextPage && Array.from({ length: getSkeletonCount() }, (_, index) => (
                <div key={`skeleton-${movies.length + index}`} role="status" aria-hidden="true">
                  <MovieCardSkeleton />
                </div>
              ))}
            </div>
          </RevealOnScroll>
        ) : (
          <div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6"
            data-testid="movie-grid"
          >
            {movies.map((movie, index) => (
              <MovieCard
                key={`${mediaType}-${movie.id}-${index}`}
                movie={movie}
                mediaType={mediaType}
              />
            ))}
            {isFetchingNextPage && Array.from({ length: getSkeletonCount() }, (_, index) => (
              <div key={`skeleton-${movies.length + index}`} role="status" aria-hidden="true">
                <MovieCardSkeleton />
              </div>
            ))}
          </div>
        )}

        {/* Infinite scroll trigger */}
        {(hasNextPage || isFetchingNextPage) && infiniteScrollTriggerRef && (
          <div
            ref={infiniteScrollTriggerRef}
            className="h-4 mt-8"
            data-testid="infinite-scroll-trigger"
          />
        )}
      </div>
    </section>
  );
}
