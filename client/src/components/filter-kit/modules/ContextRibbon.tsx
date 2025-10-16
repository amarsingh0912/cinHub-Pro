import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, RotateCcw, TrendingUp, Star, Calendar, Clock, PlayCircle, Radio } from "lucide-react";
import { AdvancedFilterState, PresetCategory } from "@/types/filters";
import { cn } from "@/lib/utils";
import { FilterChip, MetricPill } from "../atoms";
import { filterMotion } from "../filter-motion";
import { useFilterContext } from "@/contexts/FilterContext";
import { ActiveFiltersChips } from "./ActiveFiltersChips";

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
    const currentCategory = filters.category || 'trending';
    
    const movieOnlyCategories = ['upcoming', 'now_playing'];
    const tvOnlyCategories = ['airing_today', 'on_the_air'];
    
    let newCategory = currentCategory;
    
    if (type === 'tv' && movieOnlyCategories.includes(currentCategory)) {
      newCategory = 'trending';
    } else if (type === 'movie' && tvOnlyCategories.includes(currentCategory)) {
      newCategory = 'trending';
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
    { value: 'trending', label: 'Trending', icon: TrendingUp },
    { value: 'popular', label: 'Popular', icon: Star },
    { value: 'upcoming', label: 'Upcoming', icon: Calendar },
    { value: 'top_rated', label: 'Top Rated', icon: Star },
    { value: 'now_playing', label: 'Now Playing', icon: PlayCircle },
  ];

  const tvCategories = [
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
    (filters.primary_release_date?.start || filters.primary_release_date?.end) ? 1 : 0,
    (filters.first_air_date?.start || filters.first_air_date?.end) ? 1 : 0,
    (filters.air_date?.start || filters.air_date?.end) ? 1 : 0,
  ].reduce((sum, count) => sum + count, 0);

  const hasActiveFilters = activeFiltersCount > 0;

  const resetFilters = () => {
    const defaultFilters: AdvancedFilterState = {
      contentType: filters.contentType,
      category: 'trending',
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
        {/* Active Filters Chips */}
        <ActiveFiltersChips 
          filters={filters}
          onFiltersChange={onFiltersChange}
          className="py-2"
        />
      </div>
    </div>
  );
}
