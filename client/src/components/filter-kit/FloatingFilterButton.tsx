import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFilterContext } from "@/contexts/FilterContext";
import { AdvancedFilterState } from "@/types/filters";

interface FloatingFilterButtonProps {
  filters: AdvancedFilterState;
  onResetFilters?: () => void;
  activeFiltersCount?: number;
}

export function FloatingFilterButton({ filters, onResetFilters, activeFiltersCount = 0 }: FloatingFilterButtonProps) {
  const { toggleDock } = useFilterContext();
  const hasActiveFilters = activeFiltersCount > 0;

  return (
    <>
      {/* Reset Button - Shows when filters are active */}
      <AnimatePresence>
        {hasActiveFilters && onResetFilters && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={onResetFilters}
            className={cn(
              "fixed bottom-24 right-6 z-50",
              "p-4 rounded-full shadow-2xl",
              "bg-muted/90 backdrop-blur-md border-2 border-border",
              "hover:bg-muted transition-all duration-300",
              "hover:scale-110 active:scale-95"
            )}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            data-testid="floating-reset-button"
          >
            <RotateCcw className="h-5 w-5 text-foreground" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Main Filter Button */}
      <motion.button
        onClick={toggleDock}
        className={cn(
          "fixed bottom-6 right-6 z-50",
          "flex items-center gap-3 px-6 py-4 rounded-full shadow-2xl",
          "border-2 backdrop-blur-md transition-all duration-300",
          "hover:scale-110 active:scale-95",
          hasActiveFilters
            ? "bg-primary text-primary-foreground border-primary shadow-primary/20"
            : "bg-background/90 text-foreground border-border hover:bg-background"
        )}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        data-testid="floating-filter-button"
      >
        <SlidersHorizontal className="h-5 w-5" />
        <span className="font-semibold">Filters</span>
        {hasActiveFilters && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-background/20 text-primary-foreground"
          >
            {activeFiltersCount}
          </motion.span>
        )}
      </motion.button>
    </>
  );
}
