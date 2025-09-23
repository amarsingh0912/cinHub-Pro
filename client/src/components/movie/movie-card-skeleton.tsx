import { Skeleton } from "@/components/ui/skeleton";

export default function MovieCardSkeleton() {
  return (
    <div className="movie-card" data-testid="movie-card-skeleton">
      {/* Image skeleton */}
      <div className="aspect-[2/3] relative overflow-hidden rounded-lg">
        <Skeleton className="w-full h-full" />
      </div>
      
      {/* Title and year skeleton */}
      <div className="mt-3 space-y-2">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}