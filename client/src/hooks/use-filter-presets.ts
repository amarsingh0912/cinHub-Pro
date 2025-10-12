import { useState, useEffect, useCallback } from 'react';
import type { AdvancedFilterState, FilterPreset } from '@/types/filters';
import { nanoid } from 'nanoid';

const PRESETS_STORAGE_KEY = 'cinehub_filter_presets';

interface UseFilterPresetsOptions {
  maxPresets?: number;
}

/**
 * Hook for managing filter presets with localStorage persistence
 * Allows users to save, load, and delete custom filter configurations
 */
export function useFilterPresets(options: UseFilterPresetsOptions = {}) {
  const { maxPresets = 10 } = options;
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load presets from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PRESETS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as FilterPreset[];
        // Convert date strings back to Date objects
        const presetsWithDates = parsed.map(preset => ({
          ...preset,
          createdAt: new Date(preset.createdAt),
          updatedAt: new Date(preset.updatedAt),
        }));
        setPresets(presetsWithDates);
      }
    } catch (error) {
      console.error('Failed to load filter presets:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save presets to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
      } catch (error) {
        console.error('Failed to save filter presets:', error);
      }
    }
  }, [presets, isLoading]);

  // Save a new preset
  const savePreset = useCallback(
    (name: string, filters: AdvancedFilterState, description?: string): FilterPreset | null => {
      if (presets.length >= maxPresets) {
        return null; // Max presets reached
      }

      // Remove UI-specific fields from filters
      const { ui, ...filterData } = filters;

      const newPreset: FilterPreset = {
        id: nanoid(),
        name,
        description,
        filters: filterData as AdvancedFilterState,
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        usage_count: 0,
      };

      setPresets((prev) => [...prev, newPreset]);
      return newPreset;
    },
    [presets.length, maxPresets]
  );

  // Update an existing preset
  const updatePreset = useCallback((id: string, updates: Partial<FilterPreset>) => {
    setPresets((prev) =>
      prev.map((preset) =>
        preset.id === id
          ? {
              ...preset,
              ...updates,
              updatedAt: new Date(),
            }
          : preset
      )
    );
  }, []);

  // Delete a preset
  const deletePreset = useCallback((id: string) => {
    setPresets((prev) => prev.filter((preset) => preset.id !== id));
  }, []);

  // Load a preset (increment usage count)
  const loadPreset = useCallback(
    (id: string): AdvancedFilterState | null => {
      const preset = presets.find((p) => p.id === id);
      if (!preset) return null;

      // Increment usage count
      updatePreset(id, {
        usage_count: preset.usage_count + 1,
      });

      return preset.filters;
    },
    [presets, updatePreset]
  );

  // Get a preset by ID
  const getPreset = useCallback(
    (id: string) => {
      return presets.find((p) => p.id === id) || null;
    },
    [presets]
  );

  // Clear all presets
  const clearAllPresets = useCallback(() => {
    setPresets([]);
  }, []);

  // Check if preset name already exists
  const presetNameExists = useCallback(
    (name: string) => {
      return presets.some((p) => p.name.toLowerCase() === name.toLowerCase());
    },
    [presets]
  );

  return {
    presets,
    isLoading,
    savePreset,
    updatePreset,
    deletePreset,
    loadPreset,
    getPreset,
    clearAllPresets,
    presetNameExists,
    canSaveMore: presets.length < maxPresets,
    remainingSlots: maxPresets - presets.length,
  };
}
