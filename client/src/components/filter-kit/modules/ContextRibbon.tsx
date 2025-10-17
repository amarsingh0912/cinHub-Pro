import { AdvancedFilterState, PresetCategory } from "@/types/filters";

interface ContextRibbonProps {
  filters: AdvancedFilterState;
  onFiltersChange: (filters: AdvancedFilterState) => void;
  setPreset?: (presetCategory: PresetCategory) => void;
  totalResults?: number;
  isLoading?: boolean;
  className?: string;
}

export function ContextRibbon({ filters, onFiltersChange, setPreset, totalResults, isLoading, className }: ContextRibbonProps) {
  // ContextRibbon is no longer used - filter chips moved to main content area
  return null;
}
