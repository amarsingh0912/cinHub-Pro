import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  X,
  ChevronDown,
  Star,
  Calendar,
  Languages,
  ArrowUpDown,
  Sparkles,
  Sliders,
  Undo2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useUndoReset } from "@/hooks/use-undo-reset";
import type { AdvancedFilterState, SortOption } from "@/types/filters";

interface QuickFilterBarProps {
  filters: AdvancedFilterState;
  onFiltersChange: (filters: AdvancedFilterState) => void;
  onOpenAdvanced: () => void;
  resultCount?: number;
  isLoading?: boolean;
  className?: string;
}

const QUICK_GENRES = [
  { id: 28, name: "Action", color: "bg-red-500/10 text-red-500 border-red-500/20" },
  { id: 35, name: "Comedy", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
  { id: 18, name: "Drama", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  { id: 878, name: "Sci-Fi", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  { id: 27, name: "Horror", color: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
  { id: 10749, name: "Romance", color: "bg-pink-500/10 text-pink-500 border-pink-500/20" },
];

const QUICK_TV_GENRES = [
  { id: 10759, name: "Action", color: "bg-red-500/10 text-red-500 border-red-500/20" },
  { id: 35, name: "Comedy", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
  { id: 18, name: "Drama", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  { id: 10765, name: "Sci-Fi", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  { id: 9648, name: "Mystery", color: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20" },
  { id: 80, name: "Crime", color: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
];

const YEAR_PRESETS = [
  { label: "2024", value: "2024" },
  { label: "2023", value: "2023" },
  { label: "2020s", value: "2020s" },
  { label: "2010s", value: "2010s" },
  { label: "Classic", value: "classic" },
];

const RATING_PRESETS = [
  { label: "Any", min: 0, max: 10 },
  { label: "7+ ⭐", min: 7, max: 10 },
  { label: "8+ ⭐⭐", min: 8, max: 10 },
  { label: "9+ ⭐⭐⭐", min: 9, max: 10 },
];

const SORT_OPTIONS: { value: SortOption; label: string; isMovieOnly?: boolean; isTVOnly?: boolean }[] = [
  { value: "popularity.desc", label: "Most Popular" },
  { value: "vote_average.desc", label: "Highest Rated" },
  { value: "primary_release_date.desc", label: "Latest", isMovieOnly: true },
  { value: "first_air_date.desc", label: "Latest", isTVOnly: true },
  { value: "vote_count.desc", label: "Most Voted" },
];

export function QuickFilterBar({
  filters,
  onFiltersChange,
  onOpenAdvanced,
  resultCount,
  isLoading = false,
  className,
}: QuickFilterBarProps) {
  const [isSticky, setIsSticky] = useState(false);
  const { toast } = useToast();

  // Undo reset functionality
  const { storeFiltersBeforeReset, restorePreviousFilters } = useUndoReset({
    onRestore: onFiltersChange,
  });

  // Handle scroll for sticky behavior
  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const currentGenres = filters.contentType === "movie" ? QUICK_GENRES : QUICK_TV_GENRES;

  const toggleGenre = (genreId: number) => {
    const currentGenres = filters.with_genres || [];
    const updatedGenres = currentGenres.includes(genreId)
      ? currentGenres.filter((id) => id !== genreId)
      : [...currentGenres, genreId];
    onFiltersChange({ ...filters, with_genres: updatedGenres });
  };

  const setYearPreset = (preset: string) => {
    const currentYear = new Date().getFullYear();
    let dateRange = {};

    switch (preset) {
      case "2024":
        dateRange = { start: "2024-01-01", end: "2024-12-31" };
        break;
      case "2023":
        dateRange = { start: "2023-01-01", end: "2023-12-31" };
        break;
      case "2020s":
        dateRange = { start: "2020-01-01", end: `${currentYear}-12-31` };
        break;
      case "2010s":
        dateRange = { start: "2010-01-01", end: "2019-12-31" };
        break;
      case "classic":
        dateRange = { start: "1950-01-01", end: "1999-12-31" };
        break;
      default:
        dateRange = {};
    }

    if (filters.contentType === "movie") {
      onFiltersChange({ ...filters, primary_release_date: dateRange });
    } else {
      onFiltersChange({ ...filters, first_air_date: dateRange });
    }
  };

  const setRatingPreset = (preset: typeof RATING_PRESETS[0]) => {
    onFiltersChange({
      ...filters,
      vote_average: { min: preset.min > 0 ? preset.min : undefined, max: preset.max < 10 ? preset.max : undefined },
    });
  };

  const setSortOption = (sortBy: SortOption) => {
    onFiltersChange({ ...filters, sort_by: sortBy });
  };

  // Count active filters
  const activeFilterCount = useMemo(() => {
    return [
      filters.with_genres?.length || 0,
      filters.without_genres?.length || 0,
      filters.with_watch_providers?.length || 0,
      (filters.primary_release_date?.start || filters.first_air_date?.start) ? 1 : 0,
      (filters.vote_average?.min || filters.vote_average?.max) ? 1 : 0,
      filters.with_people?.length || 0,
      filters.with_companies?.length || 0,
    ].reduce((sum, count) => sum + count, 0);
  }, [filters]);

  const clearAllFilters = () => {
    // Store current filters for undo
    storeFiltersBeforeReset(filters);

    // Clear all filters
    onFiltersChange({
      contentType: filters.contentType,
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
      sort_by: "popularity.desc",
    } as AdvancedFilterState);

    // Show undo toast
    toast({
      title: "Filters Cleared",
      description: "All filters have been reset",
      action: (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (restorePreviousFilters()) {
              toast({
                title: "Filters Restored",
                description: "Your previous filters have been restored",
              });
            }
          }}
          className="gap-2"
        >
          <Undo2 className="h-3 w-3" />
          Undo
        </Button>
      ),
    });
  };

  const availableSortOptions = SORT_OPTIONS.filter(
    (opt) =>
      !opt.isMovieOnly || filters.contentType === "movie"
  ).filter(
    (opt) =>
      !opt.isTVOnly || filters.contentType === "tv"
  );

  const hasYearFilter = filters.primary_release_date?.start || filters.first_air_date?.start;
  const hasRatingFilter = filters.vote_average?.min || filters.vote_average?.max;

  return (
    <div
      className={cn(
        "transition-all duration-300 z-40",
        isSticky ? "sticky top-16 shadow-lg" : "relative",
        className
      )}
      data-testid="quick-filter-bar"
    >
      <div className="glassmorphism border-b border-border/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          {/* Top Row: Result Count + Actions */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {/* Result Count */}
              <AnimatePresence mode="wait">
                {resultCount !== undefined && (
                  <motion.div
                    key={resultCount}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="flex items-center gap-2"
                  >
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground" data-testid="result-count">
                      {isLoading ? (
                        <span className="animate-pulse">Loading...</span>
                      ) : (
                        <>
                          <span className="text-primary">{resultCount.toLocaleString()}</span>{" "}
                          {resultCount === 1 ? "result" : "results"}
                        </>
                      )}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Active Filter Count */}
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="h-6 px-2 text-xs" data-testid="active-filter-badge">
                  {activeFilterCount} active
                </Badge>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="h-8 px-3 text-xs hover:text-destructive"
                  data-testid="clear-all-filters"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear All
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={onOpenAdvanced}
                className="h-8 px-3 text-xs glassmorphism-chip"
                data-testid="open-advanced-filters"
              >
                <Sliders className="h-3 w-3 mr-1" />
                Advanced
                {activeFilterCount > 0 && (
                  <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </div>
          </div>

          {/* Filter Chips Row */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {/* Genre Chips */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-xs font-medium text-muted-foreground mr-1">Genre:</span>
              {currentGenres.map((genre) => {
                const isActive = filters.with_genres?.includes(genre.id);
                return (
                  <motion.button
                    key={genre.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleGenre(genre.id)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium border transition-all duration-200",
                      "hover:shadow-md",
                      isActive
                        ? genre.color + " shadow-sm"
                        : "bg-muted/50 text-muted-foreground border-muted hover:bg-muted"
                    )}
                    data-testid={`genre-chip-${genre.id}`}
                  >
                    {genre.name}
                    {isActive && <X className="inline-block h-3 w-3 ml-1" />}
                  </motion.button>
                );
              })}
            </div>

            <div className="h-6 w-px bg-border flex-shrink-0" />

            {/* Year Chips */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              {YEAR_PRESETS.map((preset) => (
                <Button
                  key={preset.value}
                  variant={hasYearFilter ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setYearPreset(preset.value)}
                  className="h-7 px-2.5 text-xs"
                  data-testid={`year-preset-${preset.value}`}
                >
                  {preset.label}
                </Button>
              ))}
            </div>

            <div className="h-6 w-px bg-border flex-shrink-0" />

            {/* Rating Chips */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Star className="h-3.5 w-3.5 text-muted-foreground" />
              {RATING_PRESETS.map((preset) => {
                const isActive =
                  filters.vote_average?.min === preset.min && filters.vote_average?.max === preset.max;
                return (
                  <Button
                    key={preset.label}
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setRatingPreset(preset)}
                    className="h-7 px-2.5 text-xs"
                    data-testid={`rating-preset-${preset.label}`}
                  >
                    {preset.label}
                  </Button>
                );
              })}
            </div>

            <div className="h-6 w-px bg-border flex-shrink-0" />

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
              <Select value={filters.sort_by} onValueChange={setSortOption}>
                <SelectTrigger className="h-7 w-[140px] text-xs" data-testid="sort-select">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {availableSortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="text-xs">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
