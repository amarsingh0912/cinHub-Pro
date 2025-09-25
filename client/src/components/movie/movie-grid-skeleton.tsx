import { Skeleton } from "@/components/ui/skeleton";
import MovieCardSkeleton from "./movie-card-skeleton";

interface MovieGridSkeletonProps {
  title?: string;
  showViewAll?: boolean;
  count?: number;
}

export default function MovieGridSkeleton({ title, showViewAll, count = 12 }: MovieGridSkeletonProps) {
  return (
    <section className="py-16" data-testid="movie-grid-skeleton">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {title && (
          <div className="flex items-center justify-between mb-8">
            <Skeleton className="h-9 w-48" />
            {showViewAll && (
              <Skeleton className="h-6 w-20" />
            )}
          </div>
        )}
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 animate-stagger-in" data-testid="movie-grid-skeleton-grid">
          {Array.from({ length: count }, (_, index) => (
            <div key={index} style={{ animationDelay: `${index * 0.1}s` }} className="animate-fade-in-up">
              <MovieCardSkeleton />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}