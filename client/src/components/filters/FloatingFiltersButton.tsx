import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { AdvancedFilterSheet } from "./AdvancedFilterSheet";
import type { AdvancedFilterState } from "@/types/filters";

interface FloatingFiltersButtonProps {
  filters: AdvancedFilterState;
  onFiltersChange: (filters: AdvancedFilterState) => void;
  className?: string;
  position?: 'fixed' | 'absolute' | 'relative';
}

export function FloatingFiltersButton({ 
  filters, 
  onFiltersChange, 
  className,
  position = 'fixed'
}: FloatingFiltersButtonProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Count applied filters
  const appliedFiltersCount = [
    filters.with_genres?.length || 0,
    filters.without_genres?.length || 0,
    filters.with_keywords?.length || 0,
    filters.without_keywords?.length || 0,
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

  return (
    <>
      <Button
        onClick={() => setIsSheetOpen(true)}
        className={cn(
          "group relative",
          // Glassmorphism effect
          "backdrop-blur-xl bg-background/90 border-border/50",
          "hover:bg-background/95 hover:border-border/70",
          "shadow-lg hover:shadow-xl transition-all duration-200",
          // Position styles based on prop
          position === 'fixed' && "fixed bottom-6 right-6 z-40",
          position === 'absolute' && "absolute",
          position === 'relative' && "relative",
          className
        )}
        size="lg"
        data-testid="floating-filters-button"
      >
        <Filter className="h-5 w-5 mr-2 transition-transform group-hover:scale-110" />
        Filters
        {appliedFiltersCount > 0 && (
          <Badge 
            variant="destructive" 
            className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs font-bold animate-pulse"
            data-testid="filters-badge"
          >
            {appliedFiltersCount}
          </Badge>
        )}
      </Button>

      <AdvancedFilterSheet
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        filters={filters}
        onFiltersChange={onFiltersChange}
        appliedFiltersCount={appliedFiltersCount}
      />
    </>
  );
}