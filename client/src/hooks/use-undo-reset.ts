import { useRef, useCallback } from 'react';
import type { AdvancedFilterState } from '@/types/filters';

interface UseUndoResetOptions {
  onRestore: (filters: AdvancedFilterState) => void;
}

/**
 * Hook for managing undo functionality for filter resets
 * Stores the previous filter state and provides a restore function
 */
export function useUndoReset({ onRestore }: UseUndoResetOptions) {
  const previousFiltersRef = useRef<AdvancedFilterState | null>(null);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Store current filters before reset
  const storeFiltersBeforeReset = useCallback((filters: AdvancedFilterState) => {
    previousFiltersRef.current = JSON.parse(JSON.stringify(filters)); // Deep clone
    
    // Clear any existing timeout
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }

    // Auto-clear after 10 seconds
    undoTimeoutRef.current = setTimeout(() => {
      previousFiltersRef.current = null;
    }, 10000);
  }, []);

  // Restore previous filters
  const restorePreviousFilters = useCallback(() => {
    if (previousFiltersRef.current) {
      onRestore(previousFiltersRef.current);
      previousFiltersRef.current = null;
      
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
        undoTimeoutRef.current = null;
      }
      
      return true;
    }
    return false;
  }, [onRestore]);

  // Check if undo is available
  const canUndo = useCallback(() => {
    return previousFiltersRef.current !== null;
  }, []);

  // Clear undo state
  const clearUndo = useCallback(() => {
    previousFiltersRef.current = null;
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = null;
    }
  }, []);

  return {
    storeFiltersBeforeReset,
    restorePreviousFilters,
    canUndo: canUndo(),
    clearUndo,
  };
}
