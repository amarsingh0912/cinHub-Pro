import { motion, AnimatePresence } from "framer-motion";
import { Film, Tv, SlidersHorizontal, X, RotateCcw, TrendingUp, Star, Calendar, Clock, PlayCircle, Radio } from "lucide-react";
import { AdvancedFilterState, PresetCategory } from "@/types/filters";
import { cn } from "@/lib/utils";
import { FilterChip, MetricPill } from "../atoms";
import { filterMotion } from "../filter-motion";
import { useFilterContext } from "@/contexts/FilterContext";

interface ContextRibbonProps {
  filters: AdvancedFilterState;
  onFiltersChange: (filters: AdvancedFilterState) => void;
  setPreset?: (presetCategory: PresetCategory) => void;
  totalResults?: number;
  isLoading?: boolean;
  className?: string;
}

export function ContextRibbon({ filters, onFiltersChange, setPreset, totalResults, isLoading, className }: ContextRibbonProps) {
  const { toggleDock, toggleLab } = useFilterContext();

  const setContentType = (type: 'movie' | 'tv') => {
    const currentCategory = filters.category || 'discover';
    
    const movieOnlyCategories = ['upcoming', 'now_playing'];
    const tvOnlyCategories = ['airing_today', 'on_the_air'];
    
    let newCategory = currentCategory;
    
    if (type === 'tv' && movieOnlyCategories.includes(currentCategory)) {
      newCategory = 'discover';
    } else if (type === 'movie' && tvOnlyCategories.includes(currentCategory)) {
      newCategory = 'discover';
    }
    
    onFiltersChange({
      ...filters,
      contentType: type,
      category: newCategory
    });
  };

  const setCategory = (category: string) => {
    // Use setPreset if available to preserve user filters while switching presets
    if (setPreset) {
      setPreset(category as PresetCategory);
    } else {
      // Fallback: just update category without merging preset defaults
      onFiltersChange({
        ...filters,
        category,
        activePreset: category as PresetCategory,
      });
    }
  };

  const movieCategories = [
    { value: 'discover', label: 'Discover', icon: Film },
    { value: 'trending', label: 'Trending', icon: TrendingUp },
    { value: 'popular', label: 'Popular', icon: Star },
    { value: 'upcoming', label: 'Upcoming', icon: Calendar },
    { value: 'top_rated', label: 'Top Rated', icon: Star },
    { value: 'now_playing', label: 'Now Playing', icon: PlayCircle },
  ];

  const tvCategories = [
    { value: 'discover', label: 'Discover', icon: Tv },
    { value: 'trending', label: 'Trending', icon: TrendingUp },
    { value: 'popular', label: 'Popular', icon: Star },
    { value: 'airing_today', label: 'Airing Today', icon: Radio },
    { value: 'on_the_air', label: 'On The Air', icon: Clock },
    { value: 'top_rated', label: 'Top Rated', icon: Star },
  ];

  const categories = filters.contentType === 'movie' ? movieCategories : tvCategories;

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
        "sticky top-16 z-40 backdrop-blur-xl bg-background/95 border-b-2 border-border shadow-lg",
        className
      )}
      data-testid="context-ribbon"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* First Row: Content Type and Actions */}
        <div className="flex items-center justify-between gap-4 py-3">
          {/* Left: Content Type Tabs */}
          <div className="flex items-center gap-3">
            {/* Tabs for Movies and TV Shows */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/30 border border-border/50">
              <motion.button
                onClick={() => setContentType('movie')}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-1.5 rounded-md",
                  "transition-all duration-300 font-medium text-sm",
                  filters.contentType === 'movie'
                    ? "bg-background text-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                data-testid="tab-movies"
              >
                <Film className="h-4 w-4" />
                <span>Movies</span>
                {filters.contentType === 'movie' && (
                  <motion.div
                    className="absolute inset-0 rounded-md bg-gradient-to-r from-blue-500/10 to-blue-600/10"
                    layoutId="activeTab"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </motion.button>

              <motion.button
                onClick={() => setContentType('tv')}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-1.5 rounded-md",
                  "transition-all duration-300 font-medium text-sm",
                  filters.contentType === 'tv'
                    ? "bg-background text-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                data-testid="tab-tv-shows"
              >
                <Tv className="h-4 w-4" />
                <span>TV Shows</span>
                {filters.contentType === 'tv' && (
                  <motion.div
                    className="absolute inset-0 rounded-md bg-gradient-to-r from-purple-500/10 to-purple-600/10"
                    layoutId="activeTab"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </motion.button>
            </div>

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

        {/* Second Row: Category Selector */}
        <div className="border-t border-border/30 py-2 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            {categories.map((category) => {
              const Icon = category.icon;
              const isActive = filters.category === category.value || (!filters.category && category.value === 'discover');
              
              return (
                <motion.button
                  key={category.value}
                  onClick={() => setCategory(category.value)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg",
                    "transition-all duration-200 font-medium text-sm whitespace-nowrap",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  data-testid={`category-${category.value}`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{category.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
