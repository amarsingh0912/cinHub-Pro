import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Filter, 
  Settings,
  Command,
  Sparkles,
  Zap,
  ChevronRight
} from "lucide-react";
import { motion } from "framer-motion";
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
  // Only count the date filter relevant to the current content type
  const hasDateFilter = filters.contentType === 'movie'
    ? (filters.primary_release_date?.start || filters.primary_release_date?.end) ? 1 : 0
    : (filters.first_air_date?.start || filters.first_air_date?.end) ? 1 : 0;

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
    hasDateFilter,
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
      <motion.div
        whileHover={{ scale: 1.05, rotate: 1 }}
        whileTap={{ scale: 0.95, rotate: 0 }}
        className={cn(
          position === 'fixed' && "fixed bottom-6 right-6 z-50",
          position === 'absolute' && "absolute",
          position === 'relative' && "relative",
          className
        )}
      >
        <Button
          onClick={() => setIsSheetOpen(true)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={cn(
            "group relative overflow-hidden",
            // Ultra-premium glassmorphism with gradient border
            "glassmorphism-floating border-2",
            hasFilters 
              ? "border-primary/50 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent"
              : "border-border/50 bg-background/80",
            // Size and spacing
            isMobile ? "h-14 px-6" : "h-12 px-8",
            // Premium animations and transitions
            "transition-all duration-500 ease-out",
            // Glow effects
            hasFilters && "shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] animate-pulse-slow"
          )}
          size={isMobile ? "lg" : "default"}
          data-testid="floating-filters-button"
        >
        {/* Animated background gradient */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 animate-gradient-x"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.5 }}
        />

        {/* Sparkle effects */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0"
        >
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            <Sparkles className="absolute top-1 left-2 h-3 w-3 text-secondary" />
          </motion.div>
          <motion.div
            animate={{ 
              scale: [1, 1.3, 1],
              rotate: [360, 180, 0]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "linear",
              delay: 0.5
            }}
          >
            <Sparkles className="absolute bottom-1 right-2 h-2 w-2 text-primary" />
          </motion.div>
        </motion.div>

        {/* Main content */}
        <div className="relative flex items-center gap-2 font-semibold">
          <motion.div
            animate={{ 
              rotate: isHovered ? [0, -12, 12, -12, 0] : 0
            }}
            transition={{ 
              duration: 0.5,
              ease: "easeInOut"
            }}
          >
            <Filter className={cn(
              "h-5 w-5 transition-all duration-300",
              hasFilters && "text-primary drop-shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]"
            )} />
          </motion.div>
          
          <span className={cn(
            "hidden sm:inline transition-all duration-300",
            hasFilters && "text-primary"
          )}>
            {hasFilters ? "Active Filters" : "Filters"}
          </span>
          
          {!isMobile && isHovered && (
            <motion.div
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -5 }}
            >
              <ChevronRight className="h-4 w-4" />
            </motion.div>
          )}

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
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 500,
                damping: 15
              }}
            >
              <Badge 
                variant="destructive" 
                className={cn(
                  "ml-1 h-6 w-6 p-0 flex items-center justify-center",
                  "text-xs font-bold rounded-full",
                  "bg-gradient-to-br from-primary via-primary to-primary/80",
                  "shadow-[0_0_15px_rgba(var(--primary-rgb),0.6)] text-white border-0",
                  "animate-pulse"
                )}
                data-testid="filters-badge"
              >
                {appliedFiltersCount > 99 ? "99+" : appliedFiltersCount}
              </Badge>
            </motion.div>
          )}
        </div>

        {/* Orbital glow effect */}
        {hasFilters && (
          <motion.div
            className="absolute inset-0 rounded-lg"
            animate={{
              boxShadow: [
                "0 0 20px rgba(var(--primary-rgb), 0.3)",
                "0 0 30px rgba(var(--primary-rgb), 0.5)",
                "0 0 20px rgba(var(--primary-rgb), 0.3)"
              ]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
      </Button>
      </motion.div>

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