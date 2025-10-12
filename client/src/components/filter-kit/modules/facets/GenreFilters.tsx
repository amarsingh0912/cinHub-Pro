import { useQuery } from "@tanstack/react-query";
import { AdvancedFilterState } from "@/types/filters";
import { FilterChip } from "../../atoms";
import { motion } from "framer-motion";
import { filterMotion } from "../../filter-motion";

interface GenreFiltersProps {
  filters: AdvancedFilterState;
  onFiltersChange: (filters: AdvancedFilterState) => void;
}

export function GenreFilters({ filters, onFiltersChange }: GenreFiltersProps) {
  const { data: genres } = useQuery({
    queryKey: [filters.contentType === 'movie' ? '/api/movies/genres' : '/api/tv/genres'],
  });

  const genreList = (genres as any)?.genres || [];

  const toggleGenre = (genreId: number) => {
    const isSelected = filters.with_genres.includes(genreId);
    onFiltersChange({
      ...filters,
      with_genres: isSelected
        ? filters.with_genres.filter(id => id !== genreId)
        : [...filters.with_genres, genreId]
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-foreground">Include Genres</h4>
        <motion.div
          className="flex flex-wrap gap-2"
          variants={filterMotion.staggerContainer}
          initial="initial"
          animate="animate"
        >
          {genreList.map((genre: any) => (
            <FilterChip
              key={genre.id}
              label={genre.name}
              selected={filters.with_genres.includes(genre.id)}
              onToggle={() => toggleGenre(genre.id)}
              variant="primary"
              size="md"
              data-testid={`genre-chip-${genre.id}`}
            />
          ))}
        </motion.div>
      </div>

      {filters.with_genres.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground">Exclude Genres (Optional)</h4>
          <motion.div
            className="flex flex-wrap gap-2"
            variants={filterMotion.staggerContainer}
            initial="initial"
            animate="animate"
          >
            {genreList
              .filter((genre: any) => !filters.with_genres.includes(genre.id))
              .map((genre: any) => (
                <FilterChip
                  key={genre.id}
                  label={genre.name}
                  selected={filters.without_genres.includes(genre.id)}
                  onToggle={() => {
                    const isSelected = filters.without_genres.includes(genre.id);
                    onFiltersChange({
                      ...filters,
                      without_genres: isSelected
                        ? filters.without_genres.filter(id => id !== genre.id)
                        : [...filters.without_genres, genre.id]
                    });
                  }}
                  variant="warning"
                  size="sm"
                  data-testid={`exclude-genre-chip-${genre.id}`}
                />
              ))}
          </motion.div>
        </div>
      )}
    </div>
  );
}
