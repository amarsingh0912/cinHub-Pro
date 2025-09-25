import { Movie } from "@/types/movie";
import MovieCard from "./movie-card";
import MovieGridSkeleton from "./movie-grid-skeleton";

interface MovieGridProps {
  movies: Movie[];
  title?: string;
  showViewAll?: boolean;
  viewAllHref?: string;
  isLoading?: boolean;
  skeletonCount?: number;
}

export default function MovieGrid({
  movies,
  title,
  showViewAll,
  viewAllHref,
  isLoading,
  skeletonCount = 12,
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
        )}

        <div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6"
          data-testid="movie-grid"
        >
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      </div>
    </section>
  );
}
