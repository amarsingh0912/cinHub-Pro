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
import { ActiveFiltersChips } from "@/components/filter-kit/modules/ActiveFiltersChips";
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

      <main className="pt-20">
        {/* Enhanced Cinematic Hero Section */}
        <section className="relative mb-10 md:mb-12" data-testid="movies-header">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header Content with Glassmorphism */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 md:gap-8 mb-8">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className={cn(
                      "relative p-3 rounded-2xl",
                      "bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5",
                      "border border-primary/30",
                      "shadow-lg shadow-primary/10",
                      "backdrop-blur-sm"
                    )}
                  >
                    <CategoryIcon className="h-7 w-7 text-primary drop-shadow-[0_2px_8px_rgba(var(--primary),0.4)]" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent rounded-2xl opacity-50" />
                  </div>
                  <div>
                    <h1
                      className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text"
                      data-testid="content-title"
                    >
                      {categoryInfo.title}
                    </h1>
                  </div>
                </div>
                <p
                  className="text-base sm:text-lg text-muted-foreground/90 font-medium max-w-2xl"
                  data-testid="content-description"
                >
                  {categoryInfo.description}
                </p>
              </div>

              {/* Enhanced Stats Cards with Glassmorphism */}
              <div className="flex items-center gap-4">
                {!isLoading && totalResults > 0 && (
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/25 via-primary/15 to-primary/10 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-all duration-500 motion-reduce:hidden" />
                    <div className="relative px-6 py-3.5 bg-gradient-to-br from-card/95 to-card/80 backdrop-blur-xl rounded-2xl border border-border/60 shadow-lg group-hover:shadow-xl group-hover:border-primary/40 transition-all duration-300">
                      <div className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest mb-1.5">
                        Results
                      </div>
                      <div className="text-2xl font-display font-extrabold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                        {totalResults.toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}

                {appliedFiltersCount > 0 && (
                  <div
                    className="relative group"
                    data-testid="filter-count-badge"
                  >
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/40 via-primary/25 to-secondary/30 rounded-2xl blur-md opacity-60 group-hover:opacity-100 transition-all duration-500 motion-reduce:hidden" />
                    <div className="relative px-6 py-3.5 bg-gradient-to-br from-primary/15 to-primary/10 backdrop-blur-xl rounded-2xl border border-primary/40 shadow-lg group-hover:shadow-xl group-hover:border-primary/60 transition-all duration-300">
                      <div className="text-[10px] font-bold text-primary/80 uppercase tracking-widest mb-1.5">
                        Filters
                      </div>
                      <div className="text-2xl font-display font-extrabold text-primary drop-shadow-[0_2px_8px_rgba(var(--primary),0.4)]">
                        {appliedFiltersCount}
                      </div>
                    </div>
                  </div>
                )}

                {isDebouncing && (
                  <div
                    className="flex items-center gap-2.5 px-5 py-3.5 rounded-2xl bg-gradient-to-br from-muted/60 to-muted/40 backdrop-blur-sm border border-border/60 shadow-md"
                    data-testid="debouncing-indicator"
                  >
                    <Loader2 className="h-4 w-4 animate-spin text-primary drop-shadow-[0_2px_4px_rgba(var(--primary),0.3)]" />
                    <span className="text-sm font-semibold text-muted-foreground">Updating...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Active Filters Chips */}
        <section className="mb-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ActiveFiltersChips 
              filters={filters}
              onFiltersChange={setFilters}
            />
          </div>
        </section>

        {/* Enhanced Movies Grid Section */}
        <section className="pb-20 md:pb-24" data-testid="movies-grid-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 sm:gap-6 md:gap-7 lg:gap-8">
                {Array.from({ length: 18 }).map((_, i) => (
                  <MovieCardSkeleton key={i} />
                ))}
              </div>
            ) : movies && movies.length > 0 ? (
              <MovieGrid
                movies={movies}
                mediaType={filters.contentType}
                hasNextPage={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                infiniteScrollTriggerRef={triggerRef}
                enableAnimations={false}
              />
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
