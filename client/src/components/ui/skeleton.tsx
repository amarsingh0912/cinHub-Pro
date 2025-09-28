import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-gradient-to-r from-muted/50 via-muted/70 to-muted/50 bg-[length:200%_100%] animate-shimmer",
        className
      )}
      {...props}
    />
  )
}

function MovieCardSkeleton({ size = 'normal' }: { size?: 'normal' | 'compact' }) {
  return (
    <div className={`movie-card ${size === 'compact' ? 'movie-card-compact' : ''} group animate-fade-in`}>
      <div className="aspect-[2/3] relative overflow-hidden rounded-2xl glassmorphism-card bg-card/60 border border-border/20">
        <Skeleton className="w-full h-full bg-gradient-to-br from-muted/40 via-muted/20 to-muted/40" />
        
        {/* Shimmer overlay effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer bg-[length:200%_100%]" />
      </div>
      <div className="mt-4 space-y-3">
        <Skeleton className="h-5 w-3/4 bg-gradient-to-r from-muted/50 to-muted/30 rounded-md" />
        <Skeleton className="h-4 w-1/2 bg-gradient-to-r from-muted/40 to-muted/20 rounded-md" />
      </div>
    </div>
  )
}

function HeroSkeleton() {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center hero-gradient overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="space-y-8 animate-fade-in">
          <div className="space-y-4">
            <Skeleton className="h-16 sm:h-20 lg:h-24 w-3/4 mx-auto bg-gradient-to-r from-muted/40 via-muted/20 to-muted/40 rounded-2xl" />
            <Skeleton className="h-16 sm:h-20 lg:h-24 w-2/3 mx-auto bg-gradient-to-r from-primary/30 via-primary/10 to-secondary/30 rounded-2xl" />
          </div>
          
          <Skeleton className="h-8 sm:h-10 w-4/5 mx-auto bg-gradient-to-r from-muted/40 to-muted/20 rounded-xl" />
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16">
            <Skeleton className="h-16 w-52 bg-gradient-to-r from-primary/40 via-primary/20 to-primary/40 rounded-2xl" />
            <Skeleton className="h-16 w-44 bg-gradient-to-r from-muted/40 to-muted/20 rounded-2xl" />
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-8 rounded-2xl glassmorphism-card border border-border/20">
                <Skeleton className="h-14 lg:h-16 w-20 mx-auto mb-4 bg-gradient-to-br from-primary/30 via-primary/10 to-secondary/30 rounded-xl" />
                <Skeleton className="h-4 w-16 mx-auto bg-gradient-to-r from-muted/40 to-muted/20 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function TabsSkeleton() {
  return (
    <div className="w-full animate-fade-in">
      <div className="flex justify-center mb-8">
        <Skeleton className="h-12 w-80 bg-gradient-to-r from-muted/40 to-muted/20 rounded-xl" />
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <MovieCardSkeleton key={i} />
        ))}
      </div>
      
      <div className="text-center mt-8">
        <Skeleton className="h-12 w-48 mx-auto bg-gradient-to-r from-muted/40 to-muted/20 rounded-xl" />
      </div>
    </div>
  )
}

export { Skeleton, MovieCardSkeleton, HeroSkeleton, TabsSkeleton }
