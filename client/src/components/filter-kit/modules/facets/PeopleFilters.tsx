import { AdvancedFilterState } from "@/types/filters";
import { PeopleAutocomplete } from "@/components/filters/PeopleAutocomplete";

interface PeopleFiltersProps {
  filters: AdvancedFilterState;
  onFiltersChange: (filters: AdvancedFilterState) => void;
}

export function PeopleFilters({ filters, onFiltersChange }: PeopleFiltersProps) {
  const isMovie = filters.contentType === 'movie';

  return (
    <div className="space-y-6">
      {isMovie && (
        <>
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">Cast Members</h4>
            <PeopleAutocomplete
              value={filters.with_cast}
              onChange={(value) => onFiltersChange({ ...filters, with_cast: value })}
              placeholder="Search for actors..."
            />
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">Crew Members</h4>
            <PeopleAutocomplete
              value={filters.with_crew}
              onChange={(value) => onFiltersChange({ ...filters, with_crew: value })}
              placeholder="Search for directors, writers..."
            />
          </div>
        </>
      )}

      {!isMovie && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground">People</h4>
          <PeopleAutocomplete
            value={filters.with_people}
            onChange={(value) => onFiltersChange({ ...filters, with_people: value })}
            placeholder="Search for people..."
          />
        </div>
      )}
    </div>
  );
}
