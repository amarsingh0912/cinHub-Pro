import { AdvancedFilterState } from "@/types/filters";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface AdvancedFiltersProps {
  filters: AdvancedFilterState;
  onFiltersChange: (filters: AdvancedFilterState) => void;
}

const SORT_OPTIONS = [
  { value: 'popularity.desc', label: 'Most Popular' },
  { value: 'popularity.asc', label: 'Least Popular' },
  { value: 'vote_average.desc', label: 'Highest Rated' },
  { value: 'vote_average.asc', label: 'Lowest Rated' },
  { value: 'vote_count.desc', label: 'Most Voted' },
  { value: 'primary_release_date.desc', label: 'Latest Release' },
  { value: 'primary_release_date.asc', label: 'Oldest Release' },
];

export function AdvancedFilters({ filters, onFiltersChange }: AdvancedFiltersProps) {
  return (
    <div className="space-y-6">
      {/* Sort By */}
      <div className="space-y-3">
        <Label htmlFor="sort-by" className="text-sm font-medium text-foreground">Sort By</Label>
        <Select
          value={filters.sort_by}
          onValueChange={(value) => onFiltersChange({ ...filters, sort_by: value as any })}
        >
          <SelectTrigger id="sort-by" className="w-full">
            <SelectValue placeholder="Select sorting" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Include Adult */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="include-adult" className="text-sm font-medium text-foreground">
            Include Adult Content
          </Label>
          <p className="text-xs text-muted-foreground">Show adult/mature content in results</p>
        </div>
        <Switch
          id="include-adult"
          checked={filters.include_adult || false}
          onCheckedChange={(checked) => onFiltersChange({ ...filters, include_adult: checked })}
        />
      </div>

      {/* Include Video (Movies only) */}
      {filters.contentType === 'movie' && (
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="include-video" className="text-sm font-medium text-foreground">
              Include Video Content
            </Label>
            <p className="text-xs text-muted-foreground">Include video-only releases</p>
          </div>
          <Switch
            id="include-video"
            checked={filters.include_video || false}
            onCheckedChange={(checked) => onFiltersChange({ ...filters, include_video: checked })}
          />
        </div>
      )}
    </div>
  );
}
