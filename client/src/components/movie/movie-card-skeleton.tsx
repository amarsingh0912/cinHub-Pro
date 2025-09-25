import { Skeleton } from "@/components/ui/skeleton";

export default function MovieCardSkeleton() {
  return (
    <div className="movie-card animate-pulse" data-testid="movie-card-skeleton">
      {/* Image skeleton */}
      <div className="aspect-[2/3] relative overflow-hidden rounded-xl bg-accent/50 border border-border/20 backdrop-blur-sm">
        <Skeleton className="w-full h-full rounded-xl" />
        
        {/* Rating badge skeleton */}
        <div className="absolute top-3 right-3">
          <Skeleton className="h-6 w-12 rounded-lg" />
        </div>
      </div>
      
      {/* Title and year skeleton */}
      <div className="mt-4 space-y-2">
        <Skeleton className="h-5 w-full rounded-md" />
        <Skeleton className="h-4 w-16 rounded-md" />
      </div>
    </div>
  );
}