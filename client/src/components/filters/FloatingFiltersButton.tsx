import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Filter, 
  Settings,
  Command,
  Sparkles,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
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
  const [isHovered, setIsHovered] = useState(false);
  const isMobile = useIsMobile();

  // Keyboard shortcut handler (⌘/Ctrl-K)
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      setIsSheetOpen(true);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Count applied filters with more comprehensive logic
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

  const hasFilters = appliedFiltersCount > 0;

  return (
    <>
      <Button
        onClick={() => setIsSheetOpen(true)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "group relative overflow-hidden",
          // Ultra-premium glassmorphism
          "glassmorphism-floating",
          // Size and spacing
          isMobile ? "h-14 px-6" : "h-12 px-8",
          // Premium animations and transitions
          "transition-all duration-500 ease-out",
          "hover:scale-105 hover:rotate-1",
          "active:scale-95 active:rotate-0",
          // Glow effects
          hasFilters && "shadow-glow animate-pulse-slow",
          // Position styles
          position === 'fixed' && "fixed bottom-6 right-6 z-50",
          position === 'absolute' && "absolute",
          position === 'relative' && "relative",
          className
        )}
        size={isMobile ? "lg" : "default"}
        data-testid="floating-filters-button"
      >
        {/* Animated background gradient */}
        <div className={cn(
          "absolute inset-0 opacity-0 transition-opacity duration-500",
          "bg-gradient-to-r from-primary/20 via-secondary/10 to-primary/20",
          "animate-gradient-x",
          isHovered && "opacity-100"
        )} />

        {/* Sparkle effects */}
        <div className={cn(
          "absolute inset-0 opacity-0 transition-opacity duration-300",
          isHovered && "opacity-100"
        )}>
          <Sparkles className="absolute top-1 left-2 h-3 w-3 text-secondary animate-pulse" />
          <Sparkles className="absolute bottom-1 right-2 h-2 w-2 text-primary animate-pulse delay-150" />
        </div>

        {/* Main content */}
        <div className="relative flex items-center gap-2 font-medium">
          <Filter className={cn(
            "h-5 w-5 transition-all duration-300",
            "group-hover:scale-110 group-hover:rotate-12",
            hasFilters && "text-primary"
          )} />
          
          <span className="hidden sm:inline">
            {hasFilters ? "Active Filters" : "Filters"}
          </span>

          {!isMobile && (
            <div className={cn(
              "hidden lg:flex items-center gap-1 ml-2 px-2 py-1",
              "glassmorphism-chip rounded-md text-xs text-muted-foreground",
              "transition-all duration-300",
              isHovered && "scale-105"
            )}>
              <Command className="h-3 w-3" />
              <span>K</span>
            </div>
          )}

          {appliedFiltersCount > 0 && (
            <Badge 
              variant="destructive" 
              className={cn(
                "ml-1 h-6 w-6 p-0 flex items-center justify-center",
                "text-xs font-bold rounded-full",
                "animate-bounce",
                "bg-gradient-to-r from-primary to-primary-600",
                "shadow-glow text-white border-0"
              )}
              data-testid="filters-badge"
            >
              {appliedFiltersCount > 99 ? "99+" : appliedFiltersCount}
            </Badge>
          )}
        </div>

        {/* Ripple effect */}
        <div className={cn(
          "absolute inset-0 rounded-full",
          "bg-gradient-to-r from-primary/10 to-secondary/10",
          "scale-0 transition-transform duration-300",
          "group-active:scale-100 group-active:opacity-50"
        )} />
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