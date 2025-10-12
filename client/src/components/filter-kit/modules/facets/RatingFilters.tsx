import { AdvancedFilterState } from "@/types/filters";
import { RangeField } from "../../atoms";
import { Star } from "lucide-react";

interface RatingFiltersProps {
  filters: AdvancedFilterState;
  onFiltersChange: (filters: AdvancedFilterState) => void;
}

export function RatingFilters({ filters, onFiltersChange }: RatingFiltersProps) {
  const handleRatingChange = (value: [number, number]) => {
    onFiltersChange({
      ...filters,
      vote_average: { 
        min: value[0] > 0 ? value[0] : undefined, 
        max: value[1] < 10 ? value[1] : undefined 
      }
    });
  };

  const handleVoteCountChange = (value: [number, number]) => {
    onFiltersChange({
      ...filters,
      vote_count: { 
        min: value[0] > 0 ? value[0] : undefined, 
        max: value[1] < 10000 ? value[1] : undefined 
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Rating Range */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
          <h4 className="text-sm font-medium text-foreground">User Rating</h4>
        </div>
        <RangeField
          min={0}
          max={10}
          value={[
            filters.vote_average.min || 0,
            filters.vote_average.max || 10
          ]}
          onChange={handleRatingChange}
          step={0.5}
          showInputs={false}
          formatValue={(v) => v === 0 ? 'Any' : v === 10 ? '10' : v.toFixed(1)}
        />
      </div>

      {/* Vote Count */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-foreground">Minimum Votes</h4>
        <RangeField
          min={0}
          max={10000}
          value={[
            filters.vote_count.min || 0,
            filters.vote_count.max || 10000
          ]}
          onChange={handleVoteCountChange}
          step={100}
          showInputs={false}
          formatValue={(v) => v === 0 ? 'Any' : v === 10000 ? '10000+' : v.toLocaleString()}
        />
      </div>
    </div>
  );
}
