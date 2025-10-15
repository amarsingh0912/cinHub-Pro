import { Movie } from "@/types/movie";
import { RevealOnScroll, REVEAL_PRESETS } from "@/hooks/useRevealAnimation";
import MovieCard from "./movie-card";
import MovieGridSkeleton from "./movie-grid-skeleton";
import { Loader2 } from "lucide-react";

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
              {movies.map((movie) => (
                <MovieCard
                  key={`${mediaType}-${movie.id}`}
                  movie={movie}
                  mediaType={mediaType}
                />
              ))}
            </div>
          </RevealOnScroll>
        ) : enableAnimations && animationType === "fade" ? (
          <RevealOnScroll options={REVEAL_PRESETS.fadeIn}>
            <div
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6"
              data-testid="movie-grid"
            >
              {movies.map((movie) => (
                <MovieCard
                  key={`${mediaType}-${movie.id}`}
                  movie={movie}
                  mediaType={mediaType}
                />
              ))}
            </div>
          </RevealOnScroll>
        ) : (
          <div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6"
            data-testid="movie-grid"
          >
            {movies.map((movie) => (
              <MovieCard
                key={`${mediaType}-${movie.id}`}
                movie={movie}
                mediaType={mediaType}
              />
            ))}
          </div>
        )}

        {/* Infinite scroll trigger and loading state */}
        {(hasNextPage || isFetchingNextPage) && (
          <div className="mt-8">
            {isFetchingNextPage && (
              <div
                className="flex items-center justify-center py-8"
                data-testid="loading-more"
              >
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">
                  Loading more...
                </span>
              </div>
            )}

            {/* Invisible trigger element for infinite scroll */}
            {infiniteScrollTriggerRef && (
              <div
                ref={infiniteScrollTriggerRef}
                className="h-4"
                data-testid="infinite-scroll-trigger"
              />
            )}
          </div>
        )}
      </div>
    </section>
  );
}
