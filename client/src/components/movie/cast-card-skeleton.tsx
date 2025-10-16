import { Skeleton } from "@/components/ui/skeleton";

export default function CastCardSkeleton() {
  return (
    <div className="text-center" data-testid="cast-card-skeleton">
      <div className="w-full aspect-[2/3] bg-muted rounded-lg mb-3 overflow-hidden">
        <Skeleton className="w-full h-full" />
      </div>
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-3 w-3/4 mx-auto" />
    </div>
  );
}
