import { useMemo } from "react";
import { useInfiniteMoviesWithFilters } from "@/hooks/use-infinite-movies-with-filters";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MovieGrid from "@/components/movie/movie-grid";
import MovieCardSkeleton from "@/components/movie/movie-card-skeleton";
import {
  ContextRibbon,
  FilterDock,
  FilterLab,
  FloatingFilterButton,
} from "@/components/filter-kit";
import {
  Loader2,
  X,
  Film,
  TrendingUp,
  Star,
  Calendar,
  PlayCircle,
  Sparkles,
} from "lucide-react";
import { DEFAULT_MOVIE_FILTERS } from "@/types/filters";
import { cn } from "@/lib/utils";

export default function Movies() {

  // Use the complete filter system with URL sync and debouncing
  const {
    filters,
    setFilters,
    updateFilter,
    setPreset,
    debouncedFilters,
    isDebouncing,
    data: movies,
    totalResults,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    triggerRef,
    hasActiveFilters,
    queryString,
    endpoint,
  } = useInfiniteMoviesWithFilters({
    initialFilters: DEFAULT_MOVIE_FILTERS,
    debounceDelay: 250,
    syncToURL: true,
    pushState: false,
    enabled: true,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Get the display title and icon based on category
  const getCategoryInfo = () => {
    const { category } = filters;

    const categoryMap: Record<
      string,
      {
        title: string;
        description: string;
        icon: any;
        gradient: string;
        iconColor: string;
      }
    > = {
      trending: {
        title: "Trending Movies",
        description: "Discover the hottest movies trending right now",
        icon: TrendingUp,
        gradient: "from-orange-500/20 via-red-500/20 to-pink-500/20",
        iconColor: "text-orange-500",
      },
      popular: {
        title: "Popular Movies",
        description: "Explore the most popular movies of all time",
        icon: Film,
        gradient: "from-blue-500/20 via-purple-500/20 to-pink-500/20",
        iconColor: "text-blue-500",
      },
      upcoming: {
        title: "Upcoming Movies",
        description: "Get ready for upcoming movie releases",
        icon: Calendar,
        gradient: "from-green-500/20 via-teal-500/20 to-cyan-500/20",
        iconColor: "text-green-500",
      },
      now_playing: {
        title: "Now in Theaters",
        description: "See what's playing in theaters now",
        icon: PlayCircle,
        gradient: "from-purple-500/20 via-violet-500/20 to-indigo-500/20",
        iconColor: "text-purple-500",
      },
      top_rated: {
        title: "Top Rated Movies",
        description: "Browse the highest-rated movies",
        icon: Star,
        gradient: "from-yellow-500/20 via-amber-500/20 to-orange-500/20",
        iconColor: "text-yellow-500",
      },
    };

    return (
      categoryMap[category || "trending"] || {
        title: "Trending Movies",
        description:
          "Browse and filter thousands of movies with advanced options",
        icon: Sparkles,
        gradient: "from-orange-500/20 via-red-500/20 to-pink-500/20",
        iconColor: "text-orange-500",
      }
    );
  };

  const categoryInfo = getCategoryInfo();
  const CategoryIcon = categoryInfo.icon;

  // Count applied filters for the badge
  const appliedFiltersCount = useMemo(() => {
    return [
      filters.with_genres?.length || 0,
      filters.without_genres?.length || 0,
      filters.with_watch_providers?.length || 0,
      filters.with_watch_monetization_types?.length || 0,
      filters.with_people?.length || 0,
      filters.with_companies?.length || 0,
      filters.with_networks?.length || 0,
      filters.primary_release_date?.start || filters.primary_release_date?.end
        ? 1
        : 0,
      filters.first_air_date?.start || filters.first_air_date?.end ? 1 : 0,
      filters.with_runtime?.min || filters.with_runtime?.max ? 1 : 0,
      filters.vote_average?.min || filters.vote_average?.max ? 1 : 0,
      filters.vote_count?.min || filters.vote_count?.max ? 1 : 0,
      filters.with_original_language ? 1 : 0,
      filters.region ? 1 : 0,
      filters.watch_region && filters.watch_region !== "US" ? 1 : 0,
      filters.certification ? 1 : 0,
      filters.include_adult ? 1 : 0,
      filters.sort_by && filters.sort_by !== "popularity.desc" ? 1 : 0,
    ].reduce((sum, count) => sum + count, 0);
  }, [filters]);

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      data-testid="movies-page"
    >
      <Header />

      {/* Context Ribbon - New Filter UI */}
      <ContextRibbon
        filters={filters}
        onFiltersChange={setFilters}
        setPreset={setPreset}
        totalResults={totalResults}
        isLoading={isLoading || isDebouncing}
      />

      <main className="pt-4">
        {/* Redesigned Hero Section */}
        <section className="relative mb-8" data-testid="movies-header">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header Content */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn(
                    "p-2.5 rounded-xl",
                    "bg-gradient-to-br from-primary/20 to-primary/5",
                    "border border-primary/20"
                  )}>
                    <CategoryIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h1
                      className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight"
                      data-testid="content-title"
                    >
                      {categoryInfo.title}
                    </h1>
                  </div>
                </div>
                <p
                  className="text-sm sm:text-base text-muted-foreground"
                  data-testid="content-description"
                >
                  {categoryInfo.description}
                </p>
              </div>

              {/* Stats Cards */}
              <div className="flex items-center gap-3">
                {!isLoading && totalResults > 0 && (
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-primary/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
                    <div className="relative px-5 py-3 bg-background/80 dark:bg-background/60 backdrop-blur-xl rounded-xl border border-border/50">
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                        Results
                      </div>
                      <div className="text-xl font-bold text-foreground">
                        {totalResults.toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}

                {appliedFiltersCount > 0 && (
                  <div className="relative group" data-testid="filter-count-badge">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-primary/20 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-500" />
                    <div className="relative px-5 py-3 bg-primary/10 dark:bg-primary/20 backdrop-blur-xl rounded-xl border border-primary/30">
                      <div className="text-xs font-medium text-primary/80 uppercase tracking-wide mb-1">
                        Filters
                      </div>
                      <div className="text-xl font-bold text-primary">
                        {appliedFiltersCount}
                      </div>
                    </div>
                  </div>
                )}

                {isDebouncing && (
                  <div
                    className="flex items-center gap-2 px-4 py-3 rounded-xl bg-muted/50 border border-border/50"
                    data-testid="debouncing-indicator"
                  >
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm font-medium">Updating...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Movies Grid Section */}
        <section className="pb-16 md:pb-20" data-testid="movies-grid-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 md:gap-8">
                {Array.from({ length: 18 }).map((_, i) => (
                  <MovieCardSkeleton key={i} />
                ))}
              </div>
            ) : movies && movies.length > 0 ? (
              <>
                <MovieGrid movies={movies} mediaType={filters.contentType} />

                {/* Infinite scroll trigger - hidden but functional */}
                {hasNextPage && !isFetchingNextPage && (
                  <div ref={triggerRef} className="h-1" />
                )}

                {/* Show skeleton while fetching next page */}
                {isFetchingNextPage && (
                  <div
                    ref={triggerRef}
                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 md:gap-8 mt-8"
                  >
                    {Array.from({ length: 12 }).map((_, i) => (
                      <MovieCardSkeleton key={i} />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div
                className="flex flex-col items-center justify-center py-20 md:py-32"
                data-testid="no-results"
              >
                <div className="w-full max-w-lg text-center">
                  {/* Empty State Icon */}
                  <div className="mb-8 relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full blur-3xl" />
                    <div className="relative mx-auto w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center border border-border/50">
                      <Film className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground/50" />
                    </div>
                  </div>

                  <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                    No movies found
                  </h3>
                  <p className="text-base md:text-lg text-muted-foreground mb-8 max-w-md mx-auto">
                    We couldn't find any movies matching your criteria. Try
                    adjusting your filters or explore different categories.
                  </p>

                  {hasActiveFilters && (
                    <button
                      onClick={() => setFilters(DEFAULT_MOVIE_FILTERS)}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl text-base font-semibold"
                      data-testid="reset-filters-button"
                    >
                      <X className="h-5 w-5" />
                      Clear All Filters
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />

      {/* Floating Filter Button */}
      <FloatingFilterButton
        filters={filters}
        onResetFilters={() => setFilters(DEFAULT_MOVIE_FILTERS)}
        activeFiltersCount={appliedFiltersCount}
      />

      {/* Filter Dock - Responsive drawer */}
      <FilterDock
        filters={filters}
        onFiltersChange={setFilters}
        setPreset={setPreset}
      />

      {/* Filter Lab - Advanced modal */}
      <FilterLab filters={filters} onFiltersChange={setFilters} />
    </div>
  );
}
