import { motion } from "framer-motion";
import { TrendingUp, Star, Calendar, PlayCircle, Radio, Clock, Eye } from "lucide-react";
import { AdvancedFilterState, PresetCategory } from "@/types/filters";
import { cn } from "@/lib/utils";
import { filterMotion } from "../../filter-motion";

interface ViewByFiltersProps {
  filters: AdvancedFilterState;
  onFiltersChange: (filters: AdvancedFilterState) => void;
  setPreset?: (presetCategory: PresetCategory) => void;
}

export function ViewByFilters({ filters, onFiltersChange, setPreset }: ViewByFiltersProps) {
  const movieCategories = [
    { value: 'trending', label: 'Trending', icon: TrendingUp, description: 'Hot movies trending right now' },
    { value: 'popular', label: 'Popular', icon: Star, description: 'Most popular movies' },
    { value: 'upcoming', label: 'Upcoming', icon: Calendar, description: 'Coming soon to theaters' },
    { value: 'top_rated', label: 'Top Rated', icon: Star, description: 'Highest rated movies' },
    { value: 'now_playing', label: 'Now Playing', icon: PlayCircle, description: 'Currently in theaters' },
  ];

  const tvCategories = [
    { value: 'trending', label: 'Trending', icon: TrendingUp, description: 'Hot TV shows trending right now' },
    { value: 'popular', label: 'Popular', icon: Star, description: 'Most popular TV shows' },
    { value: 'airing_today', label: 'Airing Today', icon: Radio, description: 'Airing on TV today' },
    { value: 'on_the_air', label: 'On The Air', icon: Clock, description: 'Currently on the air' },
    { value: 'top_rated', label: 'Top Rated', icon: Star, description: 'Highest rated TV shows' },
  ];

  const categories = filters.contentType === 'movie' ? movieCategories : tvCategories;

  const setCategory = (category: string) => {
    if (setPreset) {
      setPreset(category as PresetCategory);
    } else {
      onFiltersChange({
        ...filters,
        category,
        activePreset: category as PresetCategory,
      });
    }
  };

  return (
    <div className="space-y-4 mt-6">
      <div className="grid grid-cols-1 gap-3">
        {categories.map((category) => {
          const Icon = category.icon;
          const defaultCategory = 'trending';
          const isActive = filters.category === category.value || (!filters.category && category.value === defaultCategory);

          return (
            <motion.button
              key={category.value}
              onClick={() => setCategory(category.value)}
              className={cn(
                "relative flex items-center gap-4 p-4 rounded-xl border transition-all duration-200",
                "text-left group hover:shadow-lg",
                isActive
                  ? "bg-primary/10 border-primary/30 shadow-md"
                  : "bg-muted/20 border-border/50 hover:bg-muted/40 hover:border-border"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              data-testid={`view-by-${category.value}`}
            >
              <div className={cn(
                "p-3 rounded-lg transition-colors",
                isActive
                  ? "bg-primary/20 text-primary"
                  : "bg-muted/50 text-muted-foreground group-hover:bg-muted group-hover:text-foreground"
              )}>
                <Icon className="h-5 w-5" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className={cn(
                  "font-semibold mb-1 transition-colors",
                  isActive ? "text-primary" : "text-foreground"
                )}>
                  {category.label}
                </div>
                <div className="text-xs text-muted-foreground line-clamp-1">
                  {category.description}
                </div>
              </div>

              {isActive && (
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary" />
              )}
            </motion.button>
          );
        })}
      </div>

      <div className="mt-6 p-4 rounded-lg bg-muted/20 border border-border/50">
        <div className="flex items-start gap-3">
          <Eye className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm mb-1">View Options</h4>
            <p className="text-xs text-muted-foreground">
              Select how you want to browse {filters.contentType === 'movie' ? 'movies' : 'TV shows'}. 
              Each view provides a different way to discover content.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
