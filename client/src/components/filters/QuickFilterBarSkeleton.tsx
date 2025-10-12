import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface QuickFilterBarSkeletonProps {
  className?: string;
}

export function QuickFilterBarSkeleton({ className }: QuickFilterBarSkeletonProps) {
  return (
    <div
      className={cn("glassmorphism border-b border-border/50 backdrop-blur-xl", className)}
      data-testid="quick-filter-bar-skeleton"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        {/* Top Row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-6 w-16" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>

        {/* Filter Chips Row */}
        <div className="flex items-center gap-2">
          {/* Genre label and chips */}
          <Skeleton className="h-4 w-12" />
          <div className="flex gap-1.5">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-7 w-16 rounded-full" />
            ))}
          </div>

          <Skeleton className="h-6 w-px" />

          {/* Year chips */}
          <Skeleton className="h-4 w-4" />
          <div className="flex gap-1.5">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-7 w-14" />
            ))}
          </div>

          <Skeleton className="h-6 w-px" />

          {/* Rating chips */}
          <Skeleton className="h-4 w-4" />
          <div className="flex gap-1.5">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-7 w-14" />
            ))}
          </div>

          <Skeleton className="h-6 w-px" />

          {/* Sort dropdown */}
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-7 w-32" />
        </div>
      </div>
    </div>
  );
}
