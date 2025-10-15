import { AdvancedFilterState } from "@/types/filters";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { LanguageSelect } from "../../atoms/LanguageSelect";
import { CountrySelect } from "../../atoms/CountrySelect";
import { KeywordAutocomplete } from "@/components/filters/KeywordAutocomplete";
import { CompanyAutocomplete } from "@/components/filters/CompanyAutocomplete";
import { NetworkAutocomplete } from "@/components/filters/NetworkAutocomplete";

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
  { value: 'primary_release_date.desc', label: 'Latest Release (Movies)' },
  { value: 'primary_release_date.asc', label: 'Oldest Release (Movies)' },
  { value: 'first_air_date.desc', label: 'Latest Air Date (TV)' },
  { value: 'first_air_date.asc', label: 'Oldest Air Date (TV)' },
  { value: 'revenue.desc', label: 'Highest Revenue (Movies)' },
];

const RELEASE_TYPES = [
  { value: '1', label: 'Premiere' },
  { value: '2', label: 'Theatrical (Limited)' },
  { value: '3', label: 'Theatrical' },
  { value: '4', label: 'Digital' },
  { value: '5', label: 'Physical' },
  { value: '6', label: 'TV' },
];

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (US)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US)' },
  { value: 'America/Chicago', label: 'Central Time (US)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Central European Time' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time' },
  { value: 'Asia/Kolkata', label: 'India Standard Time' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time' },
];

export function AdvancedFilters({ filters, onFiltersChange }: AdvancedFiltersProps) {
  const isMovie = filters.contentType === 'movie';

  return (
    <div className="space-y-6">
      {/* Sort By */}
      <div className="space-y-3">
        <Label htmlFor="sort-by" className="text-sm font-medium text-foreground">Sort By</Label>
        <Select
          value={filters.sort_by}
          onValueChange={(value) => onFiltersChange({ ...filters, sort_by: value as any })}
        >
          <SelectTrigger id="sort-by" className="w-full" data-testid="select-sort-by">
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

      <Separator />

      {/* Keywords */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-foreground">Keywords & Themes</h4>
        
        <KeywordAutocomplete
          value={filters.with_keywords || []}
          onChange={(value) => onFiltersChange({ ...filters, with_keywords: value })}
          placeholder="Include keywords..."
          label="Include Keywords"
        />
        
        <KeywordAutocomplete
          value={filters.without_keywords || []}
          onChange={(value) => onFiltersChange({ ...filters, without_keywords: value })}
          placeholder="Exclude keywords..."
          label="Exclude Keywords"
        />
      </div>

      <Separator />

      {/* Production */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-foreground">Production</h4>
        
        <CompanyAutocomplete
          value={filters.with_companies}
          onChange={(value) => onFiltersChange({ ...filters, with_companies: value })}
          placeholder="Search production companies..."
        />
        
        {!isMovie && (
          <NetworkAutocomplete
            value={filters.with_networks}
            onChange={(value) => onFiltersChange({ ...filters, with_networks: value })}
            placeholder="Search TV networks..."
          />
        )}
      </div>

      <Separator />

      {/* Language & Region */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-foreground">Language & Region</h4>
        
        <div className="space-y-3">
          <Label htmlFor="language-select" className="text-sm font-medium text-foreground">Original Language</Label>
          <LanguageSelect
            id="language-select"
            value={filters.with_original_language}
            onValueChange={(value) => onFiltersChange({ ...filters, with_original_language: value })}
            placeholder="All languages"
            className="w-full"
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="country-select" className="text-sm font-medium text-foreground">Release Region</Label>
          <CountrySelect
            id="country-select"
            value={filters.region}
            onValueChange={(value) => onFiltersChange({ ...filters, region: value })}
            placeholder="All countries"
            className="w-full"
          />
        </div>
      </div>

      <Separator />

      {/* Certification / Content Rating */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-foreground">Content Rating</h4>
        
        <div className="space-y-3">
          <Label htmlFor="cert-country" className="text-sm font-medium text-foreground">Certification Country</Label>
          <CountrySelect
            id="cert-country"
            value={filters.certification_country}
            onValueChange={(value) => onFiltersChange({ ...filters, certification_country: value })}
            placeholder="Select country (e.g., US)"
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">Choose a country to filter by its rating system</p>
        </div>

        {filters.certification_country && (
          <div className="space-y-3">
            <Label htmlFor="certification" className="text-sm font-medium text-foreground">Certification</Label>
            <Input
              id="certification"
              placeholder="e.g., PG-13, R, TV-MA"
              value={filters.certification || ''}
              onChange={(e) => onFiltersChange({ ...filters, certification: e.target.value })}
              className="w-full"
              data-testid="input-certification"
            />
            <p className="text-xs text-muted-foreground">
              Enter certification code (e.g., US: G, PG, PG-13, R, NC-17)
            </p>
          </div>
        )}

        {isMovie && filters.certification_country && (
          <div className="space-y-3">
            <Label htmlFor="certification-lte" className="text-sm font-medium text-foreground">Maximum Rating</Label>
            <Input
              id="certification-lte"
              placeholder="e.g., PG-13"
              value={filters.certification_lte || ''}
              onChange={(e) => onFiltersChange({ ...filters, certification_lte: e.target.value })}
              className="w-full"
              data-testid="input-certification-lte"
            />
            <p className="text-xs text-muted-foreground">
              Show content rated up to this level
            </p>
          </div>
        )}
      </div>

      <Separator />

      {/* Release Type (Movies only) */}
      {isMovie && (
        <>
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Release Type</h4>
            <div className="space-y-3">
              <Label className="text-sm font-medium text-foreground">Select Release Types</Label>
              <div className="grid grid-cols-2 gap-2">
                {RELEASE_TYPES.map((type) => {
                  const isSelected = filters.with_release_type?.includes(Number(type.value));
                  return (
                    <button
                      key={type.value}
                      onClick={() => {
                        const current = filters.with_release_type || [];
                        const value = Number(type.value);
                        const newValue = isSelected
                          ? current.filter(t => t !== value)
                          : [...current, value];
                        onFiltersChange({ ...filters, with_release_type: newValue.length > 0 ? newValue : undefined });
                      }}
                      className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                        isSelected
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-muted/30 border-border hover:bg-muted/50 text-muted-foreground'
                      }`}
                      data-testid={`release-type-${type.value}`}
                    >
                      {type.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Filter by how the movie was released
              </p>
            </div>
          </div>
          <Separator />
        </>
      )}

      {/* TV-Specific Filters */}
      {!isMovie && (
        <>
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">TV-Specific Options</h4>
            
            {/* Timezone */}
            <div className="space-y-3">
              <Label htmlFor="timezone" className="text-sm font-medium text-foreground">Timezone</Label>
              <Select
                value={filters.timezone}
                onValueChange={(value) => onFiltersChange({ ...filters, timezone: value })}
              >
                <SelectTrigger id="timezone" className="w-full" data-testid="select-timezone">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No timezone filter</SelectItem>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Filter shows by their air time in a specific timezone
              </p>
            </div>

            {/* Screened Theatrically */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="screened-theatrically" className="text-sm font-medium text-foreground">
                  Screened Theatrically
                </Label>
                <p className="text-xs text-muted-foreground">Only show TV shows with theatrical releases</p>
              </div>
              <Switch
                id="screened-theatrically"
                checked={filters.screened_theatrically || false}
                onCheckedChange={(checked) => onFiltersChange({ ...filters, screened_theatrically: checked })}
                data-testid="switch-screened-theatrically"
              />
            </div>
          </div>
          <Separator />
        </>
      )}

      {/* Content Filters */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-foreground">Content Filters</h4>
        
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
            data-testid="switch-include-adult"
          />
        </div>

        {/* Include Video (Movies only) */}
        {isMovie && (
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
              data-testid="switch-include-video"
            />
          </div>
        )}
      </div>
    </div>
  );
}
