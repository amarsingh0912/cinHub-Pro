import { useMemo } from "react";
import { useInfiniteMoviesWithFilters } from "@/hooks/use-infinite-movies-with-filters";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MovieGrid from "@/components/movie/movie-grid";
import MovieCardSkeleton from "@/components/movie/movie-card-skeleton";
import { ContextRibbon, FilterDock, FilterLab, FloatingFilterButton } from "@/components/filter-kit";
import { Loader2, Tv, TrendingUp, Star, Calendar, Radio, Sparkles, X } from "lucide-react";
import { DEFAULT_TV_FILTERS } from "@/types/filters";

export default function TVShows() {
  // Use the complete filter system with URL sync and debouncing
  const {
    filters,
    setFilters,
    updateFilter,
    setPreset,
    debouncedFilters,
    isDebouncing,
    data: shows,
    totalResults,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    triggerRef,
    hasActiveFilters,
  } = useInfiniteMoviesWithFilters({
    initialFilters: DEFAULT_TV_FILTERS,
    debounceDelay: 250,
    syncToURL: true,
    pushState: false,
    enabled: true,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Get the display title and icon based on category
  const getCategoryInfo = () => {
    const { category } = filters;
    
    const categoryMap: Record<string, {
      title: string;
      description: string;
      icon: any;
      gradient: string;
      iconColor: string;
    }> = {
      trending: {
        title: 'Trending TV Shows',
        description: 'Discover the hottest TV shows trending right now',
        icon: TrendingUp,
        gradient: 'from-orange-500/20 via-red-500/20 to-pink-500/20',
        iconColor: 'text-orange-500',
      },
      popular: {
        title: 'Popular TV Shows',
        description: 'Explore the most popular TV shows of all time',
        icon: Tv,
        gradient: 'from-blue-500/20 via-purple-500/20 to-pink-500/20',
        iconColor: 'text-blue-500',
      },
      airing_today: {
        title: 'Airing Today',
        description: "See what's airing on TV today",
        icon: Radio,
        gradient: 'from-green-500/20 via-teal-500/20 to-cyan-500/20',
        iconColor: 'text-green-500',
      },
      on_the_air: {
        title: 'On The Air',
        description: 'Browse shows currently on the air',
        icon: Calendar,
        gradient: 'from-purple-500/20 via-violet-500/20 to-indigo-500/20',
        iconColor: 'text-purple-500',
      },
      top_rated: {
        title: 'Top Rated TV Shows',
        description: 'Watch the highest-rated TV shows',
        icon: Star,
        gradient: 'from-yellow-500/20 via-amber-500/20 to-orange-500/20',
        iconColor: 'text-yellow-500',
      },
    };
    
    return categoryMap[category || 'trending'] || {
      title: 'Trending TV Shows',
      description: 'Browse and filter thousands of TV shows with advanced options',
      icon: Sparkles,
      gradient: 'from-orange-500/20 via-red-500/20 to-pink-500/20',
      iconColor: 'text-orange-500',
    };
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
      (filters.primary_release_date?.start || filters.primary_release_date?.end) ? 1 : 0,
      (filters.first_air_date?.start || filters.first_air_date?.end) ? 1 : 0,
      (filters.with_runtime?.min || filters.with_runtime?.max) ? 1 : 0,
      (filters.vote_average?.min || filters.vote_average?.max) ? 1 : 0,
      (filters.vote_count?.min || filters.vote_count?.max) ? 1 : 0,
      filters.with_original_language ? 1 : 0,
      filters.region ? 1 : 0,
      filters.watch_region && filters.watch_region !== 'US' ? 1 : 0,
      filters.certification ? 1 : 0,
      filters.include_adult ? 1 : 0,
      filters.sort_by && filters.sort_by !== 'popularity.desc' ? 1 : 0,
    ].reduce((sum, count) => sum + count, 0);
  }, [filters]);

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="tv-shows-page">
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
        {/* Modern Hero Section */}
        <section className="relative overflow-hidden" data-testid="tv-shows-header">
          {/* Gradient Background */}
          <div className={`absolute inset-0 bg-gradient-to-br ${categoryInfo.gradient} dark:opacity-30 opacity-50`} />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
            {/* Category Icon Badge */}
            <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background/80 dark:bg-background/60 backdrop-blur-sm border border-border/50 shadow-lg">
              <CategoryIcon className={`h-5 w-5 ${categoryInfo.iconColor}`} />
              <span className="text-sm font-medium">TV Shows</span>
            </div>

            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
              <div className="flex-1">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold mb-4 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent" data-testid="content-title">
                  {categoryInfo.title}
                </h1>
                <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed" data-testid="content-description">
                  {categoryInfo.description}
                </p>
              </div>
              
              {/* Stats & Actions Card */}
              <div className="flex flex-wrap gap-3 items-center">
                {/* Results Count */}
                {!isLoading && totalResults > 0 && (
                  <div className="px-4 py-2.5 rounded-xl bg-background/80 dark:bg-background/60 backdrop-blur-sm border border-border/50 shadow-lg">
                    <div className="text-xs text-muted-foreground mb-0.5">Total Results</div>
                    <div className="text-2xl font-bold bg-gradient-to-br from-primary to-primary/70 bg-clip-text text-transparent">
                      {totalResults.toLocaleString()}
                    </div>
                  </div>
                )}
                
                {/* Filter Badge */}
                {appliedFiltersCount > 0 && (
                  <div className="px-4 py-2.5 rounded-xl bg-primary/10 dark:bg-primary/20 backdrop-blur-sm border border-primary/30 shadow-lg" data-testid="filter-count-badge">
                    <div className="text-xs text-primary/70 mb-0.5">Active Filters</div>
                    <div className="text-2xl font-bold text-primary">
                      {appliedFiltersCount}
                    </div>
                  </div>
                )}
                
                {/* Debouncing Indicator */}
                {isDebouncing && (
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-background/80 dark:bg-background/60 backdrop-blur-sm border border-border/50 shadow-lg" data-testid="debouncing-indicator">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm font-medium">Updating...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* TV Shows Grid Section */}
        <section className="py-8 md:py-12" data-testid="tv-shows-grid-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                {Array.from({ length: 18 }).map((_, i) => (
                  <MovieCardSkeleton key={i} />
                ))}
              </div>
            ) : shows && shows.length > 0 ? (
              <>
                <MovieGrid movies={shows} mediaType={filters.contentType} />
                
                {/* Infinite scroll trigger - hidden but functional */}
                {hasNextPage && !isFetchingNextPage && (
                  <div ref={triggerRef} className="h-1" />
                )}
                
                {/* Show skeleton while fetching next page */}
                {isFetchingNextPage && (
                  <div ref={triggerRef} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6 mt-6">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <MovieCardSkeleton key={i} />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 md:py-32" data-testid="no-results">
                <div className="w-full max-w-lg text-center">
                  {/* Empty State Icon */}
                  <div className="mb-8 relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full blur-3xl" />
                    <div className="relative mx-auto w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center border border-border/50">
                      <Tv className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground/50" />
                    </div>
                  </div>
                  
                  <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                    No TV shows found
                  </h3>
                  <p className="text-base md:text-lg text-muted-foreground mb-8 max-w-md mx-auto">
                    We couldn't find any TV shows matching your criteria. Try adjusting your filters or explore different categories.
                  </p>
                  
                  {hasActiveFilters && (
                    <button
                      onClick={() => setFilters(DEFAULT_TV_FILTERS)}
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
        onResetFilters={() => setFilters(DEFAULT_TV_FILTERS)}
        activeFiltersCount={appliedFiltersCount}
      />

      {/* Filter Dock - Responsive drawer */}
      <FilterDock
        filters={filters}
        onFiltersChange={setFilters}
        setPreset={setPreset}
      />

      {/* Filter Lab - Advanced modal */}
      <FilterLab
        filters={filters}
        onFiltersChange={setFilters}
      />
    </div>
  );
}
