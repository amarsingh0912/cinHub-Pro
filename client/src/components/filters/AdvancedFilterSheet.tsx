import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetFooter 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  X, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  Star, 
  Calendar, 
  Clock, 
  Globe, 
  MonitorPlay, 
  Users, 
  Building2, 
  Shield,
  Search,
  Film,
  Tv,
  Sparkles,
  TrendingUp,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { PeopleAutocomplete } from "./PeopleAutocomplete";
import { CompaniesAutocomplete } from "./CompaniesAutocomplete";
import { KeywordsAutocomplete } from "./KeywordsAutocomplete";
import { NaturalLanguageSearch } from "./NaturalLanguageSearch";
import { ContentTypeToggle } from "./SegmentedToggle";
import { GenreChipGroup } from "./ChipGroup";
import { RuntimeSlider } from "./DualRangeSlider";
import { RatingSlider } from "./StarSlider";
import type { 
  AdvancedFilterState, 
  FilterCategory, 
  Genre,
  Language,
  Country,
  WatchProvider,
  Person,
  Company,
  Network,
  QuickFilterChip
} from "@/types/filters";

interface AdvancedFilterSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  filters: AdvancedFilterState;
  onFiltersChange: (filters: AdvancedFilterState) => void;
  appliedFiltersCount?: number;
}

// API data hooks for real TMDB data

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
  { value: 'original_title.asc', label: 'Title A-Z (Movies)' },
  { value: 'name.asc', label: 'Name A-Z (TV)' },
  { value: 'revenue.desc', label: 'Highest Revenue (Movies)' },
];

const MONETIZATION_TYPES = [
  { value: 'flatrate', label: 'Subscription' },
  { value: 'free', label: 'Free' },
  { value: 'ads', label: 'Free with Ads' },
  { value: 'rent', label: 'Rent' },
  { value: 'buy', label: 'Buy' },
];

const FILTER_CATEGORIES: FilterCategory[] = [
  {
    id: 'content',
    label: 'Content Type',
    icon: 'Film',
    description: 'Movies or TV Shows',
    fields: ['contentType'],
    collapsible: false,
    defaultOpen: true
  },
  {
    id: 'genres',
    label: 'Genres',
    icon: 'Tag',
    description: 'Include or exclude specific genres',
    fields: ['with_genres', 'without_genres'],
    collapsible: true,
    defaultOpen: true
  },
  {
    id: 'release',
    label: 'Release & Runtime',
    icon: 'Calendar',
    description: 'Release dates and runtime duration',
    fields: ['primary_release_date', 'first_air_date', 'with_runtime'],
    collapsible: true,
    defaultOpen: false
  },
  {
    id: 'ratings',
    label: 'Ratings & Reviews',
    icon: 'Star',
    description: 'User ratings and vote counts',
    fields: ['vote_average', 'vote_count'],
    collapsible: true,
    defaultOpen: false
  },
  {
    id: 'streaming',
    label: 'Streaming & Availability',
    icon: 'MonitorPlay',
    description: 'Streaming services and availability',
    fields: ['with_watch_providers', 'with_watch_monetization_types', 'watch_region'],
    collapsible: true,
    defaultOpen: false
  },
  {
    id: 'advanced',
    label: 'Advanced Filters',
    icon: 'Settings',
    description: 'Language, people, companies, and more',
    fields: ['with_original_language', 'region', 'certification', 'include_adult'],
    collapsible: true,
    defaultOpen: false
  }
];

const QUICK_FILTER_PRESETS: QuickFilterChip[] = [
  {
    id: 'this-year',
    label: 'This Year',
    filters: {
      primary_release_date: {
        start: `${new Date().getFullYear()}-01-01`,
        end: `${new Date().getFullYear()}-12-31`
      },
      first_air_date: {
        start: `${new Date().getFullYear()}-01-01`, 
        end: `${new Date().getFullYear()}-12-31`
      }
    } as Partial<AdvancedFilterState>,
    description: 'Released this year'
  },
  {
    id: '2010s',
    label: '2010s',
    filters: {
      primary_release_date: { start: '2010-01-01', end: '2019-12-31' },
      first_air_date: { start: '2010-01-01', end: '2019-12-31' }
    } as Partial<AdvancedFilterState>,
    description: 'From the 2010s decade'
  },
  {
    id: 'highly-rated',
    label: 'Highly Rated',
    filters: {
      vote_average: { min: 7.5 },
      vote_count: { min: 100 }
    } as Partial<AdvancedFilterState>,
    description: '7.5+ rating with 100+ votes'
  },
  {
    id: 'netflix',
    label: 'Netflix',
    filters: {
      with_watch_providers: [8], // Netflix provider ID
      watch_region: 'US'
    } as Partial<AdvancedFilterState>,
    description: 'Available on Netflix'
  },
  {
    id: 'free-to-watch',
    label: 'Free',
    filters: {
      with_watch_monetization_types: ['free', 'ads']
    } as Partial<AdvancedFilterState>,
    description: 'Free to watch'
  }
];

export function AdvancedFilterSheet({ 
  isOpen, 
  onOpenChange, 
  filters, 
  onFiltersChange,
  appliedFiltersCount = 0 
}: AdvancedFilterSheetProps) {
  const isMobile = useIsMobile();
  const [collapsedSections, setCollapsedSections] = useState<string[]>(['advanced']);
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Initialize collapsed sections based on mobile state (only once)
  useEffect(() => {
    if (!hasInitialized) {
      setHasInitialized(true);
      if (isMobile) {
        setCollapsedSections(['release', 'ratings', 'streaming', 'advanced']); // More collapsed on mobile
      } else {
        setCollapsedSections(['advanced']); // Only advanced collapsed on desktop
      }
    }
  }, [isMobile, hasInitialized]);

  // Fetch real data from TMDB APIs
  const { data: movieGenresData } = useQuery({
    queryKey: ['/api/movies/genres'],
    staleTime: 1000 * 60 * 30, // 30 minutes - genres don't change often
  });

  const { data: tvGenresData } = useQuery({
    queryKey: ['/api/tv/genres'],
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  const { data: languagesData } = useQuery({
    queryKey: ['/api/languages'],
    staleTime: 1000 * 60 * 60, // 1 hour - languages change rarely
  });

  const { data: countriesData } = useQuery({
    queryKey: ['/api/countries'],
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const { data: watchProvidersData } = useQuery({
    queryKey: ['/api/watch/providers', filters.watch_region || 'US', { type: filters.contentType }],
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  // Memoized data
  const currentGenres = useMemo(() => {
    const movieGenres = (movieGenresData as any)?.genres || [];
    const tvGenres = (tvGenresData as any)?.genres || [];
    return filters.contentType === 'movie' ? movieGenres : tvGenres;
  }, [filters.contentType, movieGenresData, tvGenresData]);

  const languages = useMemo(() => {
    return (languagesData as any) || [];
  }, [languagesData]);

  const countries = useMemo(() => {
    return (countriesData as any) || [];
  }, [countriesData]);

  const watchProviders = useMemo(() => {
    return (watchProvidersData as any)?.results?.[filters.watch_region || 'US']?.flatrate || [];
  }, [watchProvidersData, filters.watch_region]);

  const updateFilter = <K extends keyof AdvancedFilterState>(
    key: K, 
    value: AdvancedFilterState[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleGenre = (genreId: number) => {
    const currentGenres = filters.with_genres || [];
    const updatedGenres = currentGenres.includes(genreId)
      ? currentGenres.filter(id => id !== genreId)
      : [...currentGenres, genreId];
    updateFilter('with_genres', updatedGenres);
  };

  const toggleWatchProvider = (providerId: number) => {
    const currentProviders = filters.with_watch_providers || [];
    const updatedProviders = currentProviders.includes(providerId)
      ? currentProviders.filter(id => id !== providerId)
      : [...currentProviders, providerId];
    updateFilter('with_watch_providers', updatedProviders);
  };

  const applyQuickFilter = (preset: QuickFilterChip) => {
    onFiltersChange({ ...filters, ...preset.filters });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      contentType: filters.contentType, // Keep content type
      with_genres: [],
      without_genres: [],
      with_keywords: [],
      without_keywords: [],
      primary_release_date: {},
      first_air_date: {},
      with_runtime: {},
      vote_average: {},
      vote_count: {},
      with_watch_providers: [],
      with_watch_monetization_types: [],
      with_people: [],
      with_companies: [],
      with_networks: [],
      with_original_language: undefined,
      watch_region: 'US',
      region: undefined,
      certification: undefined,
      include_adult: false,
      sort_by: 'popularity.desc'
    } as AdvancedFilterState);
  };

  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => 
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const renderContentTypeFilter = () => (
    <div className="space-y-4">
      <Label className="text-sm font-semibold flex items-center gap-2 text-foreground/90">
        <div className="p-1 rounded-md bg-primary/10 text-primary">
          <Film className="h-4 w-4" />
        </div>
        Content Type
      </Label>
      <div className="flex justify-center">
        <ContentTypeToggle
          value={filters.contentType}
          onValueChange={(value) => updateFilter('contentType', value as 'movie' | 'tv')}
          size="md"
          variant="premium"
          showCounts={false}
          data-testid="content-type-toggle"
        />
      </div>
    </div>
  );

  const renderGenreFilter = () => (
    <div className="space-y-4">
      <Label className="text-sm font-semibold flex items-center gap-2 text-foreground/90">
        <div className="p-1 rounded-md bg-primary/10 text-primary">
          <Filter className="h-4 w-4" />
        </div>
        Genres
        {(filters.with_genres?.length > 0 || filters.without_genres?.length > 0) && (
          <Badge variant="secondary" className="ml-2 h-5 px-2 text-xs">
            {(filters.with_genres?.length || 0) + (filters.without_genres?.length || 0)}
          </Badge>
        )}
      </Label>
      <GenreChipGroup
        selectedGenres={{
          with_genres: filters.with_genres || [],
          without_genres: filters.without_genres || []
        }}
        onGenresChange={(genres) => {
          updateFilter('with_genres', genres.with_genres);
          updateFilter('without_genres', genres.without_genres);
        }}
        genres={currentGenres}
        data-testid="genre-filter"
      />
    </div>
  );

  const renderYearFilter = () => {
    const currentYear = new Date().getFullYear();
    const startYear = filters.contentType === 'movie' 
      ? parseInt(filters.primary_release_date?.start?.substring(0, 4) || `${currentYear - 20}`)
      : parseInt(filters.first_air_date?.start?.substring(0, 4) || `${currentYear - 20}`);
    const endYear = filters.contentType === 'movie'
      ? parseInt(filters.primary_release_date?.end?.substring(0, 4) || `${currentYear}`)
      : parseInt(filters.first_air_date?.end?.substring(0, 4) || `${currentYear}`);

    const hasYearFilter = (filters.primary_release_date?.start || filters.first_air_date?.start);

    return (
      <div className="space-y-4">
        <Label className="text-sm font-semibold flex items-center gap-2 text-foreground/90">
          <div className="p-1 rounded-md bg-primary/10 text-primary">
            <Calendar className="h-4 w-4" />
          </div>
          Release Year Range
          {hasYearFilter && (
            <Badge variant="secondary" className="ml-2 h-5 px-2 text-xs">
              {startYear}-{endYear}
            </Badge>
          )}
        </Label>
        
        {/* Quick filter chips */}
        <div className="flex flex-wrap gap-2">
          {QUICK_FILTER_PRESETS.slice(0, 2).map((preset) => (
            <Button
              key={preset.id}
              variant="outline"
              size="sm"
              onClick={() => applyQuickFilter(preset)}
              data-testid={`quick-filter-${preset.id}`}
              className="h-7 text-xs"
            >
              {preset.label}
            </Button>
          ))}
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              {startYear} - {endYear}
            </Label>
            <Slider
              value={[startYear, endYear]}
              min={1900}
              max={currentYear + 2}
              step={1}
              onValueChange={([start, end]) => {
                const dateRange = {
                  start: `${start}-01-01`,
                  end: `${end}-12-31`
                };
                if (filters.contentType === 'movie') {
                  updateFilter('primary_release_date', dateRange);
                } else {
                  updateFilter('first_air_date', dateRange);
                }
              }}
              className="w-full"
              data-testid="year-range-slider"
            />
          </div>
        </div>
      </div>
    );
  };

  const renderRatingFilter = () => {
    const hasRatingFilter = filters.vote_average?.min || filters.vote_average?.max || filters.vote_count?.min;
    
    return (
      <div className="space-y-4">
        <Label className="text-sm font-semibold flex items-center gap-2 text-foreground/90">
          <div className="p-1 rounded-md bg-primary/10 text-primary">
            <Star className="h-4 w-4" />
          </div>
          User Rating
          {hasRatingFilter && (
            <Badge variant="secondary" className="ml-2 h-5 px-2 text-xs">
              {filters.vote_average?.min || 0}-{filters.vote_average?.max || 10}
            </Badge>
          )}
        </Label>
      
      <div className="space-y-3">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            Rating: {filters.vote_average?.min || 0} - {filters.vote_average?.max || 10}
          </Label>
          <Slider
            value={[filters.vote_average?.min || 0, filters.vote_average?.max || 10]}
            min={0}
            max={10}
            step={0.1}
            onValueChange={([min, max]) => {
              updateFilter('vote_average', { min: min > 0 ? min : undefined, max: max < 10 ? max : undefined });
            }}
            className="w-full"
            data-testid="rating-slider"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            Minimum Vote Count: {filters.vote_count?.min || 0}
          </Label>
          <Slider
            value={[filters.vote_count?.min || 0]}
            min={0}
            max={1000}
            step={10}
            onValueChange={([min]) => {
              updateFilter('vote_count', { min: min > 0 ? min : undefined });
            }}
            className="w-full"
            data-testid="vote-count-slider"
          />
        </div>
      </div>
    </div>
  );
  };

  const renderRuntimeFilter = () => (
    <div className="space-y-4">
      <RuntimeSlider
        value={[
          filters.with_runtime?.min || (filters.contentType === 'movie' ? 60 : 15),
          filters.with_runtime?.max || (filters.contentType === 'movie' ? 240 : 120)
        ]}
        onValueChange={([min, max]) => {
          const minValue = filters.contentType === 'movie' ? (min > 60 ? min : undefined) : (min > 15 ? min : undefined);
          const maxValue = filters.contentType === 'movie' ? (max < 240 ? max : undefined) : (max < 120 ? max : undefined);
          
          updateFilter('with_runtime', {
            min: minValue,
            max: maxValue
          });
        }}
        contentType={filters.contentType}
        data-testid="runtime-filter"
      />
    </div>
  );

  const renderStreamingFilter = () => {
    const hasStreamingFilter = filters.with_watch_providers?.length > 0 || filters.with_watch_monetization_types?.length > 0;
    
    return (
      <div className="space-y-4">
        <Label className="text-sm font-semibold flex items-center gap-2 text-foreground/90">
          <div className="p-1 rounded-md bg-primary/10 text-primary">
            <MonitorPlay className="h-4 w-4" />
          </div>
          Streaming Providers
          {hasStreamingFilter && (
            <Badge variant="secondary" className="ml-2 h-5 px-2 text-xs">
              {filters.with_watch_providers?.length || 0}
            </Badge>
          )}
        </Label>

      {/* Region selection */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Region</Label>
        <Select 
          value={filters.watch_region} 
          onValueChange={(value) => updateFilter('watch_region', value)}
        >
          <SelectTrigger data-testid="region-select">
            <SelectValue placeholder="Select region" />
          </SelectTrigger>
          <SelectContent>
            {countries.map((country: any) => (
              <SelectItem key={country.iso_3166_1} value={country.iso_3166_1}>
                {country.english_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Streaming providers */}
      <div className="grid grid-cols-2 gap-2">
        {watchProviders.map((provider: any) => (
          <div key={provider.provider_id} className="flex items-center space-x-2">
            <Checkbox
              id={`provider-${provider.provider_id}`}
              checked={filters.with_watch_providers?.includes(provider.provider_id) || false}
              onCheckedChange={() => toggleWatchProvider(provider.provider_id)}
              data-testid={`provider-${provider.provider_id}`}
            />
            <Label 
              htmlFor={`provider-${provider.provider_id}`} 
              className="text-sm font-normal cursor-pointer"
            >
              {provider.provider_name}
            </Label>
          </div>
        ))}
      </div>

      {/* Monetization types */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Availability Type</Label>
        <div className="flex flex-wrap gap-2">
          {MONETIZATION_TYPES.map((type) => (
            <Button
              key={type.value}
              variant={filters.with_watch_monetization_types?.includes(type.value as any) ? "default" : "outline"}
              size="sm"
              onClick={() => {
                const current = filters.with_watch_monetization_types || [];
                const updated = current.includes(type.value as any)
                  ? current.filter(t => t !== type.value)
                  : [...current, type.value as any];
                updateFilter('with_watch_monetization_types', updated);
              }}
              data-testid={`monetization-${type.value}`}
              className="h-7 text-xs"
            >
              {type.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
  };

  const renderLanguageFilter = () => (
    <div className="space-y-3">
      <Label className="text-sm font-semibold flex items-center gap-2 text-foreground/90">
        <div className="p-1 rounded-md bg-primary/10 text-primary">
          <Globe className="h-4 w-4" />
        </div>
        Original Language
        {filters.with_original_language && (
          <Badge variant="secondary" className="ml-2 h-5 px-2 text-xs uppercase">
            {filters.with_original_language}
          </Badge>
        )}
      </Label>
      <Select 
        value={filters.with_original_language} 
        onValueChange={(value) => updateFilter('with_original_language', value === 'all' ? undefined : value)}
      >
        <SelectTrigger data-testid="language-select">
          <SelectValue placeholder="Any language" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Any Language</SelectItem>
          {languages.map((language: any) => (
            <SelectItem key={language.iso_639_1} value={language.iso_639_1}>
              {language.english_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const renderSortFilter = () => {
    const isSortActive = filters.sort_by && filters.sort_by !== 'popularity.desc';
    
    return (
      <div className="space-y-3">
        <Label className="text-sm font-semibold flex items-center gap-2 text-foreground/90">
          <div className="p-1 rounded-md bg-primary/10 text-primary">
            <TrendingUp className="h-4 w-4" />
          </div>
          Sort By
          {isSortActive && (
            <Badge variant="secondary" className="ml-2 h-5 px-2 text-xs">
              Custom
            </Badge>
          )}
        </Label>
      <Select 
        value={filters.sort_by} 
        onValueChange={(value) => updateFilter('sort_by', value as any)}
      >
        <SelectTrigger data-testid="sort-select">
          <SelectValue />
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
  );
  };

  const renderAdultContentFilter = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold flex items-center gap-2 text-foreground/90">
          <div className="p-1 rounded-md bg-primary/10 text-primary">
            <Shield className="h-4 w-4" />
          </div>
          Include Adult Content
        </Label>
        <Switch
          checked={filters.include_adult || false}
          onCheckedChange={(checked) => updateFilter('include_adult', checked)}
          data-testid="adult-content-switch"
        />
      </div>
    </div>
  );

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent 
        side={isMobile ? "bottom" : "right"} 
        className={cn(
          "w-full focus:outline-none border-border/50 flex flex-col",
          isMobile ? "h-[90dvh]" : "sm:max-w-lg h-full",
          // Glassmorphism effect
          "backdrop-blur-xl bg-background/95 border-border/20"
        )}
        data-testid="filter-sheet"
      >
        {/* Mobile drag handle */}
        {isMobile && (
          <div className="flex justify-center py-2 -mt-2">
            <motion.div 
              className="w-12 h-1.5 bg-gradient-to-r from-primary/40 via-primary to-primary/40 rounded-full"
              animate={{ scaleX: [1, 0.8, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        )}
        <SheetHeader className={cn(
          "space-y-3 flex-shrink-0 relative",
          isMobile ? "px-4 pb-4" : "px-6 pb-5"
        )}>
          {/* Decorative gradient background */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
          
          <SheetTitle className="flex items-center gap-3 text-xl font-bold relative">
            <div className="relative">
              <Filter className="h-6 w-6 text-primary" />
              <Sparkles className="h-3 w-3 text-primary absolute -top-1 -right-1 animate-pulse" />
            </div>
            <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Advanced Filters
            </span>
            {appliedFiltersCount > 0 && (
              <Badge 
                variant="default" 
                className="ml-auto bg-gradient-to-r from-primary to-primary/80 text-white border-0 shadow-lg animate-pulse"
                data-testid="applied-filters-count"
              >
                {appliedFiltersCount}
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground flex items-center gap-2 relative">
            <TrendingUp className="h-4 w-4" />
            Discover content with precise filtering across all TMDB categories
          </SheetDescription>
          
          {/* Quick filter chips */}
          <div className="flex flex-wrap gap-2 pt-2 relative" role="group" aria-label="Quick filter presets">
            {QUICK_FILTER_PRESETS.map((preset, index) => (
              <motion.div
                key={preset.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyQuickFilter(preset)}
                  data-testid={`quick-filter-${preset.id}`}
                  className={cn(
                    "h-7 text-xs relative overflow-hidden group",
                    "hover:bg-gradient-to-r hover:from-primary/20 hover:to-primary/10",
                    "hover:border-primary/50 hover:shadow-md",
                    "transition-all duration-300 hover:scale-105"
                  )}
                  aria-label={`Apply ${preset.label} filter: ${preset.description}`}
                  title={preset.description}
                >
                  <Zap className="h-3 w-3 mr-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  {preset.label}
                </Button>
              </motion.div>
            ))}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className={cn("py-4", isMobile ? "space-y-4 px-4" : "space-y-6 px-6")}>
            {/* Natural Language Search */}
            <div className={cn(isMobile ? "space-y-2" : "space-y-3")}>
              <NaturalLanguageSearch
                onFiltersApply={(newFilters) => {
                  onFiltersChange({ ...filters, ...newFilters });
                }}
                placeholder={isMobile ? "Try: action movies on Netflix" : "Try: 'action movies from 2020 on Netflix rated above 7'"}
              />
            </div>

            <Separator />

            {/* Essential filters first - Content Type and Sort */}
            <div className={cn("grid gap-4", isMobile ? "grid-cols-1" : "grid-cols-2")}>
              <div>{renderContentTypeFilter()}</div>
              <div>{renderSortFilter()}</div>
            </div>

            <Separator />

            {/* Filter Categories */}
            {FILTER_CATEGORIES.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08 }}
              >
                <Collapsible
                  open={!collapsedSections.includes(category.id)}
                  onOpenChange={() => toggleSection(category.id)}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        "flex w-full items-center justify-between p-3 mb-2",
                        "hover:bg-gradient-to-r hover:from-primary/10 hover:to-transparent",
                        "focus:bg-gradient-to-r focus:from-primary/15 focus:to-transparent",
                        "focus:outline-none focus:ring-2 focus:ring-primary/30 rounded-lg",
                        "transition-all duration-300 group",
                        !collapsedSections.includes(category.id) && "bg-primary/5"
                      )}
                      data-testid={`toggle-${category.id}`}
                      aria-expanded={!collapsedSections.includes(category.id)}
                      aria-controls={`filter-category-${category.id}`}
                      aria-label={`Toggle ${category.label} filter section`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-1.5 rounded-md transition-colors duration-300",
                          !collapsedSections.includes(category.id) 
                            ? "bg-primary/20 text-primary" 
                            : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                        )}>
                          {category.id === 'genres' && <Filter className="h-4 w-4" />}
                          {category.id === 'release' && <Calendar className="h-4 w-4" />}
                          {category.id === 'ratings' && <Star className="h-4 w-4" />}
                          {category.id === 'streaming' && <MonitorPlay className="h-4 w-4" />}
                          {category.id === 'advanced' && <Sparkles className="h-4 w-4" />}
                        </div>
                        <div className="text-left">
                          <span className="text-sm font-semibold block">{category.label}</span>
                          {category.description && (
                            <span className="text-xs text-muted-foreground hidden lg:block">
                              {category.description}
                            </span>
                          )}
                        </div>
                      </div>
                      <motion.div
                        animate={{ rotate: collapsedSections.includes(category.id) ? 0 : 180 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ChevronDown className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </motion.div>
                    </Button>
                  </CollapsibleTrigger>
                  <AnimatePresence>
                    {!collapsedSections.includes(category.id) && (
                      <CollapsibleContent 
                        forceMount
                        className={cn("overflow-hidden")}
                        id={`filter-category-${category.id}`}
                        role="region"
                        aria-labelledby={`toggle-${category.id}`}
                      >
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className={cn(
                            "pt-3 pb-4 px-3 rounded-lg",
                            "bg-gradient-to-br from-muted/30 to-transparent",
                            "border border-border/50",
                            isMobile ? "space-y-3" : "space-y-4"
                          )}
                        >
                          {category.id === 'genres' && renderGenreFilter()}
                          {category.id === 'release' && (
                            <div className="space-y-4">
                              {renderYearFilter()}
                              <Separator className="bg-gradient-to-r from-transparent via-border to-transparent" />
                              {renderRuntimeFilter()}
                            </div>
                          )}
                          {category.id === 'ratings' && renderRatingFilter()}
                          {category.id === 'streaming' && renderStreamingFilter()}
                          {category.id === 'advanced' && (
                            <div className="space-y-4">
                              <KeywordsAutocomplete
                                value={filters.with_keywords || []}
                                onChange={(keywords) => updateFilter('with_keywords', keywords)}
                              />
                              <Separator className="bg-gradient-to-r from-transparent via-border to-transparent" />
                              <PeopleAutocomplete
                                value={filters.with_people || []}
                                onChange={(people) => updateFilter('with_people', people)}
                              />
                              <Separator className="bg-gradient-to-r from-transparent via-border to-transparent" />
                              <CompaniesAutocomplete
                                value={filters.with_companies || []}
                                onChange={(companies) => updateFilter('with_companies', companies)}
                              />
                              <Separator className="bg-gradient-to-r from-transparent via-border to-transparent" />
                              {renderLanguageFilter()}
                              <Separator className="bg-gradient-to-r from-transparent via-border to-transparent" />
                              {renderAdultContentFilter()}
                            </div>
                          )}
                        </motion.div>
                      </CollapsibleContent>
                    )}
                  </AnimatePresence>
                </Collapsible>
              </motion.div>
            ))}
            </div>
          </ScrollArea>
        </div>

        <SheetFooter className={cn(
          "flex-col space-y-3 pt-5 border-t flex-shrink-0",
          "bg-gradient-to-t from-background via-background/95 to-background/90 backdrop-blur-xl",
          "border-gradient-to-r border-t-border/50",
          isMobile ? "px-4 pb-4" : "px-6 pb-6"
        )}>
          {/* Applied filters summary */}
          {appliedFiltersCount > 0 && (
            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  {appliedFiltersCount} {appliedFiltersCount === 1 ? 'Filter' : 'Filters'} Applied
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="h-7 px-3 text-xs hover:bg-destructive/10 hover:text-destructive transition-colors"
                  data-testid="clear-all-quick"
                  aria-label="Clear all applied filters"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear All
                </Button>
              </div>
              
              {/* Quick applied filters preview */}
              <div 
                className="flex flex-wrap gap-1 max-h-16 overflow-y-auto" 
                role="list" 
                aria-label="Applied filters summary"
              >
                {filters.with_genres.length > 0 && (
                  <button
                    onClick={(e) => {
                      updateFilter('with_genres', []);
                      // Focus management: move to next focusable element or Clear All button
                      const nextElement = e.currentTarget.nextElementSibling as HTMLElement || 
                                        document.querySelector('[data-testid="clear-all-quick"]') as HTMLElement;
                      nextElement?.focus();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        updateFilter('with_genres', []);
                        // Focus management: move to next focusable element or Clear All button
                        const nextElement = e.currentTarget.nextElementSibling as HTMLElement || 
                                          document.querySelector('[data-testid="clear-all-quick"]') as HTMLElement;
                        nextElement?.focus();
                      }
                    }}
                    className="inline-flex items-center gap-1 text-xs h-6 px-2 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                    aria-label={`Remove ${filters.with_genres.length} genre ${filters.with_genres.length === 1 ? 'filter' : 'filters'}`}
                    role="listitem"
                  >
                    {filters.with_genres.length} {filters.with_genres.length === 1 ? 'Genre' : 'Genres'}
                    <X className="h-2.5 w-2.5" />
                  </button>
                )}
                {(filters.primary_release_date?.start || filters.first_air_date?.start) && (
                  <button
                    onClick={(e) => {
                      updateFilter('primary_release_date', {});
                      updateFilter('first_air_date', {});
                      // Focus management: move to next focusable element or Clear All button
                      const nextElement = e.currentTarget.nextElementSibling as HTMLElement || 
                                        document.querySelector('[data-testid="clear-all-quick"]') as HTMLElement;
                      nextElement?.focus();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        updateFilter('primary_release_date', {});
                        updateFilter('first_air_date', {});
                        // Focus management: move to next focusable element or Clear All button
                        const nextElement = e.currentTarget.nextElementSibling as HTMLElement || 
                                          document.querySelector('[data-testid="clear-all-quick"]') as HTMLElement;
                        nextElement?.focus();
                      }
                    }}
                    className="inline-flex items-center gap-1 text-xs h-6 px-2 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                    aria-label="Remove date range filter"
                    role="listitem"
                  >
                    Date Range
                    <X className="h-2.5 w-2.5" />
                  </button>
                )}
                {(filters.vote_average?.min || filters.vote_average?.max) && (
                  <button
                    onClick={(e) => {
                      updateFilter('vote_average', {});
                      // Focus management: move to next focusable element or Clear All button
                      const nextElement = e.currentTarget.nextElementSibling as HTMLElement || 
                                        document.querySelector('[data-testid="clear-all-quick"]') as HTMLElement;
                      nextElement?.focus();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        updateFilter('vote_average', {});
                        // Focus management: move to next focusable element or Clear All button
                        const nextElement = e.currentTarget.nextElementSibling as HTMLElement || 
                                          document.querySelector('[data-testid="clear-all-quick"]') as HTMLElement;
                        nextElement?.focus();
                      }
                    }}
                    className="inline-flex items-center gap-1 text-xs h-6 px-2 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                    aria-label="Remove rating filter"
                    role="listitem"
                  >
                    Rating Filter
                    <X className="h-2.5 w-2.5" />
                  </button>
                )}
                {filters.with_watch_providers.length > 0 && (
                  <button
                    onClick={(e) => {
                      updateFilter('with_watch_providers', []);
                      // Focus management: move to next focusable element or Clear All button
                      const nextElement = e.currentTarget.nextElementSibling as HTMLElement || 
                                        document.querySelector('[data-testid="clear-all-quick"]') as HTMLElement;
                      nextElement?.focus();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        updateFilter('with_watch_providers', []);
                        // Focus management: move to next focusable element or Clear All button
                        const nextElement = e.currentTarget.nextElementSibling as HTMLElement || 
                                          document.querySelector('[data-testid="clear-all-quick"]') as HTMLElement;
                        nextElement?.focus();
                      }
                    }}
                    className="inline-flex items-center gap-1 text-xs h-6 px-2 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                    aria-label={`Remove ${filters.with_watch_providers.length} streaming provider ${filters.with_watch_providers.length === 1 ? 'filter' : 'filters'}`}
                    role="listitem"
                  >
                    {filters.with_watch_providers.length} {filters.with_watch_providers.length === 1 ? 'Provider' : 'Providers'}
                    <X className="h-2.5 w-2.5" />
                  </button>
                )}
                {filters.sort_by !== 'popularity.desc' && (
                  <button
                    onClick={(e) => {
                      updateFilter('sort_by', 'popularity.desc');
                      // Focus management: move to next focusable element or Clear All button
                      const nextElement = e.currentTarget.nextElementSibling as HTMLElement || 
                                        document.querySelector('[data-testid="clear-all-quick"]') as HTMLElement;
                      nextElement?.focus();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        updateFilter('sort_by', 'popularity.desc');
                        // Focus management: move to next focusable element or Clear All button
                        const nextElement = e.currentTarget.nextElementSibling as HTMLElement || 
                                          document.querySelector('[data-testid="clear-all-quick"]') as HTMLElement;
                        nextElement?.focus();
                      }
                    }}
                    className="inline-flex items-center gap-1 text-xs h-6 px-2 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                    aria-label="Reset sorting to default (most popular)"
                    role="listitem"
                  >
                    Custom Sort
                    <X className="h-2.5 w-2.5" />
                  </button>
                )}
              </div>
            </motion.div>
          )}
          
          <div className="flex gap-3 w-full">
            {appliedFiltersCount === 0 ? (
              <Button 
                onClick={() => onOpenChange(false)}
                className={cn(
                  "w-full h-11 font-semibold",
                  "bg-gradient-to-r from-primary to-primary/80",
                  "hover:from-primary/90 hover:to-primary/70",
                  "shadow-lg hover:shadow-xl transition-all duration-300"
                )}
                data-testid="close-filters"
                aria-label="Close filters panel"
              >
                Close
              </Button>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  onClick={clearAllFilters}
                  className={cn(
                    "flex-1 h-11 font-semibold",
                    "hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50",
                    "transition-all duration-300"
                  )}
                  data-testid="clear-filters"
                  aria-label="Clear all applied filters"
                >
                  <X className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                <Button 
                  onClick={() => onOpenChange(false)}
                  className={cn(
                    "flex-1 h-11 font-semibold relative overflow-hidden group",
                    "bg-gradient-to-r from-primary to-primary/80",
                    "hover:from-primary/90 hover:to-primary/70",
                    "shadow-lg hover:shadow-xl transition-all duration-300"
                  )}
                  data-testid="apply-filters"
                  aria-label="Apply current filter settings"
                >
                  <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                  Apply {appliedFiltersCount > 0 ? `(${appliedFiltersCount})` : ''}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                </Button>
              </>
            )}
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}