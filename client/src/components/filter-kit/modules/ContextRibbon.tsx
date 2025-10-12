import { motion, AnimatePresence } from "framer-motion";
import { Film, Tv, SlidersHorizontal, X, RotateCcw } from "lucide-react";
import { AdvancedFilterState } from "@/types/filters";
import { cn } from "@/lib/utils";
import { FilterChip, MetricPill } from "../atoms";
import { filterMotion } from "../filter-motion";
import { useFilterContext } from "@/contexts/FilterContext";

interface ContextRibbonProps {
  filters: AdvancedFilterState;
  onFiltersChange: (filters: AdvancedFilterState) => void;
  totalResults?: number;
  isLoading?: boolean;
  className?: string;
}

export function ContextRibbon({ filters, onFiltersChange, totalResults, isLoading, className }: ContextRibbonProps) {
  const { toggleDock, toggleLab } = useFilterContext();

  const toggleContentType = () => {
    onFiltersChange({
      ...filters,
      contentType: filters.contentType === 'movie' ? 'tv' : 'movie'
    });
  };

  // Count active filters
  const activeFiltersCount = [
    filters.with_genres?.length || 0,
    filters.without_genres?.length || 0,
    filters.with_watch_providers?.length || 0,
    filters.with_cast?.length || 0,
    filters.with_crew?.length || 0,
    (filters.vote_average?.min || filters.vote_average?.max) ? 1 : 0,
    (filters.with_runtime?.min || filters.with_runtime?.max) ? 1 : 0,
    filters.with_original_language ? 1 : 0,
  ].reduce((sum, count) => sum + count, 0);

  const hasActiveFilters = activeFiltersCount > 0;

  const resetFilters = () => {
    const defaultFilters: AdvancedFilterState = {
      contentType: filters.contentType,
      category: 'discover',
      with_genres: [],
      without_genres: [],
      primary_release_date: {},
      release_date: {},
      first_air_date: {},
      air_date: {},
      with_runtime: {},
      vote_average: {},
      vote_count: {},
      with_watch_providers: [],
      with_watch_monetization_types: [],
      with_cast: [],
      with_crew: [],
      with_people: [],
      with_companies: [],
      with_networks: [],
      sort_by: 'popularity.desc',
    };
    onFiltersChange(defaultFilters);
  };

  return (
    <div
      className={cn(
        "sticky top-0 z-40 glass-panel border-b border-border/50 backdrop-blur-xl bg-background/80",
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 py-3">
          {/* Left: Content Type Toggle */}
          <div className="flex items-center gap-3">
            <motion.button
              onClick={toggleContentType}
              className={cn(
                "relative flex items-center gap-2 px-4 py-2 rounded-full",
                "border backdrop-blur-sm transition-all duration-300",
                "hover:scale-105 active:scale-95",
                filters.contentType === 'movie'
                  ? "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400"
                  : "bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400"
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              data-testid="content-type-toggle"
            >
              {filters.contentType === 'movie' ? (
                <Film className="h-4 w-4" />
              ) : (
                <Tv className="h-4 w-4" />
              )}
              <span className="font-semibold text-sm">
                {filters.contentType === 'movie' ? 'Movies' : 'TV Shows'}
              </span>
            </motion.button>

            {/* Results count */}
            {totalResults !== undefined && (
              <MetricPill
                label="Results"
                value={isLoading ? '...' : totalResults.toLocaleString()}
                variant="default"
              />
            )}
          </div>

          {/* Center: Active Filters Summary */}
          <div className="hidden md:flex items-center gap-2 flex-1 justify-center max-w-2xl">
            <AnimatePresence mode="wait">
              {hasActiveFilters ? (
                <motion.div
                  key="filters"
                  className="flex items-center gap-2 flex-wrap"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {filters.with_genres.slice(0, 3).map((genreId) => (
                    <FilterChip
                      key={genreId}
                      label={`Genre ${genreId}`}
                      selected
                      size="sm"
                      variant="primary"
                    />
                  ))}
                  {activeFiltersCount > 3 && (
                    <span className="text-xs text-muted-foreground">
                      +{activeFiltersCount - 3} more
                    </span>
                  )}
                </motion.div>
              ) : (
                <motion.p
                  key="empty"
                  className="text-sm text-muted-foreground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  No filters applied
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Mobile filter count */}
            {hasActiveFilters && (
              <motion.div
                className="md:hidden px-2 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                {activeFiltersCount}
              </motion.div>
            )}

            {/* Reset button */}
            {hasActiveFilters && (
              <motion.button
                onClick={resetFilters}
                className="p-2 rounded-full hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                data-testid="reset-filters"
              >
                <RotateCcw className="h-4 w-4" />
              </motion.button>
            )}

            {/* Filter Dock toggle */}
            <motion.button
              onClick={toggleDock}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full",
                "border backdrop-blur-sm transition-all duration-300",
                "hover:scale-105 active:scale-95",
                hasActiveFilters
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "bg-muted/50 border-border/50 text-foreground hover:bg-muted"
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              data-testid="open-filter-dock"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline text-sm font-medium">Filters</span>
              {hasActiveFilters && (
                <span className="px-1.5 py-0.5 text-xs font-bold rounded-full bg-primary text-primary-foreground">
                  {activeFiltersCount}
                </span>
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
