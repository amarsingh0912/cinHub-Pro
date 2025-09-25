import { Skeleton } from "@/components/ui/skeleton";

export default function MovieCardSkeleton() {
  return (
    <div className="movie-card group relative" data-testid="movie-card-skeleton">
      {/* Image skeleton */}
      <div className="aspect-[2/3] relative overflow-hidden rounded-xl bg-accent/50 border border-border/20 backdrop-blur-sm">
        <Skeleton className="w-full h-full rounded-xl animate-shimmer" />
        
        {/* Rating badge skeleton */}
        <div className="absolute top-3 right-3">
          <Skeleton className="h-6 w-12 rounded-lg animate-pulse" style={{ animationDelay: '0.3s' }} />
        </div>
        
        {/* Loading wave effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-wave rounded-xl" />
      </div>
      
      {/* Title and year skeleton */}
      <div className="mt-4 space-y-2">
        <Skeleton className="h-5 w-full rounded-md animate-pulse" style={{ animationDelay: '0.1s' }} />
        <Skeleton className="h-4 w-16 rounded-md animate-pulse" style={{ animationDelay: '0.2s' }} />
      </div>
    </div>
  );
}