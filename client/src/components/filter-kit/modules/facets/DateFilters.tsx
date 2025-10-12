import { AdvancedFilterState } from "@/types/filters";
import { RangeField } from "../../atoms";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DateFiltersProps {
  filters: AdvancedFilterState;
  onFiltersChange: (filters: AdvancedFilterState) => void;
}

export function DateFilters({ filters, onFiltersChange }: DateFiltersProps) {
  const isMovie = filters.contentType === 'movie';
  const currentYear = new Date().getFullYear();

  const handleRuntimeChange = (value: [number, number]) => {
    onFiltersChange({
      ...filters,
      with_runtime: { min: value[0], max: value[1] }
    });
  };

  const handleYearChange = (field: 'start' | 'end', value: string) => {
    if (isMovie) {
      onFiltersChange({
        ...filters,
        primary_release_date: {
          ...filters.primary_release_date,
          [field]: value ? `${value}-${field === 'start' ? '01-01' : '12-31'}` : undefined
        }
      });
    } else {
      onFiltersChange({
        ...filters,
        first_air_date: {
          ...filters.first_air_date,
          [field]: value ? `${value}-${field === 'start' ? '01-01' : '12-31'}` : undefined
        }
      });
    }
  };

  const startYear = isMovie
    ? filters.primary_release_date.start?.split('-')[0] || ''
    : filters.first_air_date.start?.split('-')[0] || '';
  
  const endYear = isMovie
    ? filters.primary_release_date.end?.split('-')[0] || ''
    : filters.first_air_date.end?.split('-')[0] || '';

  return (
    <div className="space-y-6">
      {/* Year Range */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-foreground">
          {isMovie ? 'Release Year' : 'First Air Date Year'}
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="year-start" className="text-xs text-muted-foreground">From</Label>
            <Input
              id="year-start"
              type="number"
              placeholder="1900"
              value={startYear}
              onChange={(e) => handleYearChange('start', e.target.value)}
              min={1900}
              max={currentYear}
              className="h-9"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="year-end" className="text-xs text-muted-foreground">To</Label>
            <Input
              id="year-end"
              type="number"
              placeholder={currentYear.toString()}
              value={endYear}
              onChange={(e) => handleYearChange('end', e.target.value)}
              min={1900}
              max={currentYear}
              className="h-9"
            />
          </div>
        </div>
      </div>

      {/* Runtime */}
      <div className="space-y-3">
        <RangeField
          label="Runtime (minutes)"
          min={0}
          max={300}
          value={[
            filters.with_runtime.min || 0,
            filters.with_runtime.max || 300
          ]}
          onChange={handleRuntimeChange}
          step={5}
          showInputs={false}
          formatValue={(v) => v === 0 ? 'Any' : v === 300 ? '300+' : `${v}min`}
        />
      </div>
    </div>
  );
}
