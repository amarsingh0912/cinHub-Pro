import { useMemo } from "react";
import { useInfiniteMoviesWithFilters } from "@/hooks/use-infinite-movies-with-filters";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MovieGrid from "@/components/movie/movie-grid";
import MovieCardSkeleton from "@/components/movie/movie-card-skeleton";
import { ContextRibbon, FilterDock, FilterLab } from "@/components/filter-kit";
import { Loader2 } from "lucide-react";
import { DEFAULT_MOVIE_FILTERS } from "@/types/filters";

export default function Movies() {
  // Use the complete filter system with URL sync and debouncing
  const {
    filters,
    setFilters,
    updateFilter,
    debouncedFilters,
    isDebouncing,
    data: movies,
    totalResults,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    triggerRef,
    hasActiveFilters,
  } = useInfiniteMoviesWithFilters({
    initialFilters: DEFAULT_MOVIE_FILTERS,
    debounceDelay: 250,
    syncToURL: true,
    pushState: false,
    enabled: true,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Get the display title based on content type and category
  const getTitle = () => {
    const { contentType, category } = filters;
    
    if (contentType === 'movie') {
      switch (category) {
        case 'trending': return 'Trending Movies';
        case 'popular': return 'Popular Movies';
        case 'upcoming': return 'Upcoming Movies';
        case 'now_playing': return 'Now in Theaters';
        case 'top_rated': return 'Top Rated Movies';
        default: return 'Discover Movies';
      }
    } else {
      switch (category) {
        case 'trending': return 'Trending TV Shows';
        case 'popular': return 'Popular TV Shows';
        case 'airing_today': return 'Airing Today';
        case 'on_the_air': return 'On The Air';
        case 'top_rated': return 'Top Rated TV Shows';
        default: return 'Discover TV Shows';
      }
    }
  };

  const getDescription = () => {
    const { contentType, category } = filters;
    const contentName = contentType === 'movie' ? 'movies' : 'TV shows';
    
    if (category === 'discover') {
      return `Browse and filter thousands of ${contentName} with advanced options`;
    }
    
    return `Explore ${contentName} in the ${category} category`;
  };

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
    <div className="min-h-screen bg-background text-foreground" data-testid="movies-page">
      <Header />

      {/* Context Ribbon - New Filter UI */}
      <ContextRibbon
        filters={filters}
        onFiltersChange={setFilters}
        totalResults={totalResults}
        isLoading={isLoading || isDebouncing}
      />
      
      <main className="pt-0">
        {/* Page Header */}
        <section className="py-8 md:py-12 border-b border-border/50" data-testid="movies-header">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-display font-bold mb-2" data-testid="content-title">
                    {getTitle()}
                  </h1>
                  <p className="text-lg md:text-xl text-muted-foreground" data-testid="content-description">
                    {getDescription()}
                  </p>
                </div>
                
                {/* Show filter badge on desktop */}
                <div className="hidden md:flex items-center gap-2">
                  {appliedFiltersCount > 0 && (
                    <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary" data-testid="filter-count-badge">
                      {appliedFiltersCount} {appliedFiltersCount === 1 ? 'filter' : 'filters'} applied
                    </div>
                  )}
                  {isDebouncing && (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50 border border-border text-sm text-muted-foreground" data-testid="debouncing-indicator">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Updating...
                    </div>
                  )}
                </div>
              </div>
              
              {/* Mobile filter info */}
              <div className="md:hidden flex items-center gap-2">
                {appliedFiltersCount > 0 && (
                  <div className="px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary">
                    {appliedFiltersCount} {appliedFiltersCount === 1 ? 'filter' : 'filters'}
                  </div>
                )}
                {isDebouncing && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50 border border-border text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Updating...
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Movies Grid */}
        <section className="py-8 md:py-12" data-testid="movies-grid-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                {Array.from({ length: 18 }).map((_, i) => (
                  <MovieCardSkeleton key={i} />
                ))}
              </div>
            ) : movies && movies.length > 0 ? (
              <>
                <MovieGrid movies={movies} mediaType={filters.contentType} />
                
                {/* Infinite scroll trigger */}
                {hasNextPage && (
                  <div ref={triggerRef} className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}
                
                {isFetchingNextPage && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6 mt-6">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <MovieCardSkeleton key={i} />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 md:py-24" data-testid="no-results">
                <div className="w-full max-w-md text-center">
                  <svg
                    className="mx-auto h-16 w-16 md:h-20 md:w-20 text-muted-foreground/50 mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <h3 className="text-lg md:text-xl font-semibold text-foreground mb-2">
                    No results found
                  </h3>
                  <p className="text-sm md:text-base text-muted-foreground mb-6">
                    Try adjusting your filters or search criteria to find what you're looking for.
                  </p>
                  {hasActiveFilters && (
                    <button
                      onClick={() => setFilters(DEFAULT_MOVIE_FILTERS)}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                      data-testid="reset-filters-button"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />

      {/* Filter Dock - Responsive drawer */}
      <FilterDock
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* Filter Lab - Advanced modal */}
      <FilterLab
        filters={filters}
        onFiltersChange={setFilters}
      />
    </div>
  );
}
