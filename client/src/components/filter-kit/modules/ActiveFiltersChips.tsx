import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { AdvancedFilterState } from "@/types/filters";
import { GENRE_MAP } from "@/types/movie";
import { FilterChip } from "../atoms";

interface ActiveFiltersChipsProps {
  filters: AdvancedFilterState;
  onFiltersChange: (filters: AdvancedFilterState) => void;
  className?: string;
}

// Reverse genre map for ID to name lookup
const GENRE_ID_TO_NAME: Record<number, string> = Object.entries(GENRE_MAP).reduce(
  (acc, [name, id]) => ({ ...acc, [id]: name.charAt(0).toUpperCase() + name.slice(1).replace('-', ' ') }),
  {}
);

// Common streaming providers mapping
const PROVIDER_NAMES: Record<number, string> = {
  8: 'Netflix',
  9: 'Amazon Prime',
  337: 'Disney+',
  384: 'HBO Max',
  15: 'Hulu',
  350: 'Apple TV+',
  531: 'Paramount+',
  1899: 'Max',
  // Add more as needed
};

export function ActiveFiltersChips({ filters, onFiltersChange, className }: ActiveFiltersChipsProps) {
  const activeChips: Array<{
    id: string;
    label: string;
    onRemove: () => void;
    variant?: 'default' | 'primary' | 'success' | 'warning';
  }> = [];

  // Genres
  if (filters.with_genres?.length) {
    filters.with_genres.forEach((genreId) => {
      activeChips.push({
        id: `genre-${genreId}`,
        label: GENRE_ID_TO_NAME[genreId] || `Genre ${genreId}`,
        variant: 'primary',
        onRemove: () => {
          onFiltersChange({
            ...filters,
            with_genres: filters.with_genres.filter(id => id !== genreId),
          });
        },
      });
    });
  }

  // Excluded Genres
  if (filters.without_genres?.length) {
    filters.without_genres.forEach((genreId) => {
      activeChips.push({
        id: `without-genre-${genreId}`,
        label: `Not ${GENRE_ID_TO_NAME[genreId] || `Genre ${genreId}`}`,
        variant: 'warning',
        onRemove: () => {
          onFiltersChange({
            ...filters,
            without_genres: filters.without_genres.filter(id => id !== genreId),
          });
        },
      });
    });
  }

  // Watch Providers
  if (filters.with_watch_providers?.length) {
    filters.with_watch_providers.forEach((providerId) => {
      activeChips.push({
        id: `provider-${providerId}`,
        label: PROVIDER_NAMES[providerId] || `Provider ${providerId}`,
        variant: 'success',
        onRemove: () => {
          onFiltersChange({
            ...filters,
            with_watch_providers: filters.with_watch_providers.filter(id => id !== providerId),
          });
        },
      });
    });
  }

  // Rating Range
  if (filters.vote_average?.min || filters.vote_average?.max) {
    const min = filters.vote_average.min || 0;
    const max = filters.vote_average.max || 10;
    activeChips.push({
      id: 'rating',
      label: `Rating ${min}-${max}`,
      onRemove: () => {
        onFiltersChange({
          ...filters,
          vote_average: {},
        });
      },
    });
  }

  // Vote Count (Minimum votes)
  if (filters.vote_count?.min) {
    activeChips.push({
      id: 'vote-count',
      label: `${filters.vote_count.min}+ votes`,
      onRemove: () => {
        onFiltersChange({
          ...filters,
          vote_count: {},
        });
      },
    });
  }

  // Runtime Range
  if (filters.with_runtime?.min || filters.with_runtime?.max) {
    const min = filters.with_runtime.min;
    const max = filters.with_runtime.max;
    const label = min && max 
      ? `${min}-${max} min` 
      : min 
      ? `${min}+ min` 
      : `Up to ${max} min`;
    activeChips.push({
      id: 'runtime',
      label,
      onRemove: () => {
        onFiltersChange({
          ...filters,
          with_runtime: {},
        });
      },
    });
  }

  // Language
  if (filters.with_original_language) {
    activeChips.push({
      id: 'language',
      label: `Language: ${filters.with_original_language.toUpperCase()}`,
      onRemove: () => {
        onFiltersChange({
          ...filters,
          with_original_language: undefined,
        });
      },
    });
  }

  // Release Year (for movies)
  if (filters.primary_release_year) {
    activeChips.push({
      id: 'release-year',
      label: `Year: ${filters.primary_release_year}`,
      onRemove: () => {
        onFiltersChange({
          ...filters,
          primary_release_year: undefined,
        });
      },
    });
  }

  // Release Date Range (for movies)
  if (filters.primary_release_date?.start || filters.primary_release_date?.end) {
    const start = filters.primary_release_date.start;
    const end = filters.primary_release_date.end;
    const label = start && end 
      ? `Released ${start} to ${end}` 
      : start 
      ? `Released after ${start}` 
      : `Released before ${end}`;
    activeChips.push({
      id: 'release-date',
      label,
      onRemove: () => {
        onFiltersChange({
          ...filters,
          primary_release_date: {},
        });
      },
    });
  }

  // First Air Date Range (for TV)
  if (filters.first_air_date?.start || filters.first_air_date?.end) {
    const start = filters.first_air_date.start;
    const end = filters.first_air_date.end;
    const label = start && end 
      ? `Aired ${start} to ${end}` 
      : start 
      ? `Aired after ${start}` 
      : `Aired before ${end}`;
    activeChips.push({
      id: 'first-air-date',
      label,
      onRemove: () => {
        onFiltersChange({
          ...filters,
          first_air_date: {},
        });
      },
    });
  }

  // Air Date Range (for TV - used by airing_today preset)
  if (filters.air_date?.start || filters.air_date?.end) {
    const start = filters.air_date.start;
    const end = filters.air_date.end;
    const label = start && end 
      ? `Airing ${start} to ${end}` 
      : start 
      ? `Airing after ${start}` 
      : `Airing before ${end}`;
    activeChips.push({
      id: 'air-date',
      label,
      onRemove: () => {
        onFiltersChange({
          ...filters,
          air_date: {},
        });
      },
    });
  }

  if (activeChips.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <AnimatePresence mode="popLayout">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-muted-foreground">Active Filters:</span>
          {activeChips.map((chip) => (
            <motion.div
              key={chip.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            >
              <FilterChip
                label={chip.label}
                selected
                size="sm"
                variant={chip.variant}
                onRemove={chip.onRemove}
                data-testid={`filter-chip-${chip.id}`}
              />
            </motion.div>
          ))}
        </div>
      </AnimatePresence>
    </div>
  );
}
