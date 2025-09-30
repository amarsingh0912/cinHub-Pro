import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useInfiniteMoviesWithFilters } from "@/hooks/use-infinite-movies-with-filters";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MovieGrid from "@/components/movie/movie-grid";
import MovieCardSkeleton from "@/components/movie/movie-card-skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  X, 
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
  SlidersHorizontal,
  Tag,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { PeopleAutocomplete } from "@/components/filters/PeopleAutocomplete";
import { CompaniesAutocomplete } from "@/components/filters/CompaniesAutocomplete";
import { KeywordsAutocomplete } from "@/components/filters/KeywordsAutocomplete";
import { ContentTypeToggle } from "@/components/filters/SegmentedToggle";
import { GenreChipGroup } from "@/components/filters/ChipGroup";
import { RuntimeSlider } from "@/components/filters/DualRangeSlider";
import type { 
  AdvancedFilterState, 
  Genre,
  WatchProvider,
  Person,
  Company,
  Keyword
} from "@/types/filters";
import { DEFAULT_MOVIE_FILTERS } from "@/types/filters";

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
  { value: 'flatrate', label: 'Subscription', icon: '📺' },
  { value: 'free', label: 'Free', icon: '🎁' },
  { value: 'ads', label: 'Free with Ads', icon: '📢' },
  { value: 'rent', label: 'Rent', icon: '💵' },
  { value: 'buy', label: 'Buy', icon: '💰' },
];

const RELEASE_TYPES = [
  { value: 1, label: 'Premiere' },
  { value: 2, label: 'Theatrical (Limited)' },
  { value: 3, label: 'Theatrical' },
  { value: 4, label: 'Digital' },
  { value: 5, label: 'Physical' },
  { value: 6, label: 'TV' },
  { value: 7, label: 'Streaming' },
];

const QUICK_FILTERS = [
  { 
    id: 'this-year', 
    label: 'This Year',
    filters: {
      primary_release_date: { start: `${new Date().getFullYear()}-01-01`, end: `${new Date().getFullYear()}-12-31` },
      first_air_date: { start: `${new Date().getFullYear()}-01-01`, end: `${new Date().getFullYear()}-12-31` }
    }
  },
  { 
    id: '2020s', 
    label: '2020s',
    filters: {
      primary_release_date: { start: '2020-01-01', end: '2029-12-31' },
      first_air_date: { start: '2020-01-01', end: '2029-12-31' }
    }
  },
  { 
    id: '2010s', 
    label: '2010s',
    filters: {
      primary_release_date: { start: '2010-01-01', end: '2019-12-31' },
      first_air_date: { start: '2010-01-01', end: '2019-12-31' }
    }
  },
  { 
    id: '2000s', 
    label: '2000s',
    filters: {
      primary_release_date: { start: '2000-01-01', end: '2009-12-31' },
      first_air_date: { start: '2000-01-01', end: '2009-12-31' }
    }
  },
  { 
    id: '90s', 
    label: '90s',
    filters: {
      primary_release_date: { start: '1990-01-01', end: '1999-12-31' },
      first_air_date: { start: '1990-01-01', end: '1999-12-31' }
    }
  },
];

export default function Discover() {
  const [collapsedSections, setCollapsedSections] = useState<string[]>([]);
  const [pendingFilters, setPendingFilters] = useState<AdvancedFilterState>(DEFAULT_MOVIE_FILTERS);
  
  // Use the filter system - but don't sync to URL automatically
  const {
    filters: appliedFilters,
    setFilters: setAppliedFilters,
    debouncedFilters,
    isDebouncing,
    data: movies,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    triggerRef,
    hasActiveFilters,
  } = useInfiniteMoviesWithFilters({
    initialFilters: DEFAULT_MOVIE_FILTERS,
    debounceDelay: 250,
    syncToURL: true,
    pushState: false,
    enabled: true,
    staleTime: 1000 * 60 * 10,
  });

  // Fetch real data from TMDB APIs
  const { data: movieGenresData } = useQuery({
    queryKey: ['/api/movies/genres'],
    staleTime: 1000 * 60 * 30,
  });

  const { data: tvGenresData } = useQuery({
    queryKey: ['/api/tv/genres'],
    staleTime: 1000 * 60 * 30,
  });

  const { data: languagesData } = useQuery({
    queryKey: ['/api/languages'],
    staleTime: 1000 * 60 * 60,
  });

  const { data: countriesData } = useQuery({
    queryKey: ['/api/countries'],
    staleTime: 1000 * 60 * 60,
  });

  const { data: watchProvidersData } = useQuery({
    queryKey: [`/api/watch/providers/${pendingFilters.watch_region || 'US'}`, { type: pendingFilters.contentType }],
    staleTime: 1000 * 60 * 30,
  });

  const currentGenres = useMemo(() => {
    const movieGenres = (movieGenresData as any)?.genres || [];
    const tvGenres = (tvGenresData as any)?.genres || [];
    return pendingFilters.contentType === 'movie' ? movieGenres : tvGenres;
  }, [pendingFilters.contentType, movieGenresData, tvGenresData]);

  const languages = useMemo(() => (languagesData as any) || [], [languagesData]);
  const countries = useMemo(() => (countriesData as any) || [], [countriesData]);
  const watchProviders = useMemo(() => 
    (watchProvidersData as any)?.results?.[pendingFilters.watch_region || 'US']?.flatrate || [],
    [watchProvidersData, pendingFilters.watch_region]
  );

  const updatePendingFilter = <K extends keyof AdvancedFilterState>(
    key: K, 
    value: AdvancedFilterState[K]
  ) => {
    setPendingFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    setAppliedFilters(pendingFilters);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearAllFilters = () => {
    const clearedFilters = {
      ...DEFAULT_MOVIE_FILTERS,
      contentType: pendingFilters.contentType,
    };
    setPendingFilters(clearedFilters);
    setAppliedFilters(clearedFilters);
  };

  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => 
      prev.includes(sectionId) ? prev.filter(id => id !== sectionId) : [...prev, sectionId]
    );
  };

  const removeFilter = (filterKey: string, value?: any) => {
    switch (filterKey) {
      case 'with_genres':
      case 'without_genres':
      case 'with_keywords':
      case 'without_keywords':
      case 'with_watch_providers':
      case 'with_watch_monetization_types':
      case 'with_people':
      case 'with_companies':
      case 'with_networks':
        updatePendingFilter(filterKey as any, (pendingFilters[filterKey as keyof AdvancedFilterState] as any[]).filter((v: any) => v !== value));
        break;
      case 'primary_release_date':
      case 'first_air_date':
      case 'release_date':
      case 'air_date':
        updatePendingFilter(filterKey as any, {});
        break;
      case 'with_runtime':
      case 'vote_average':
      case 'vote_count':
        updatePendingFilter(filterKey as any, {});
        break;
      default:
        updatePendingFilter(filterKey as any, undefined);
    }
  };

  const getActiveFilterChips = () => {
    const chips: { label: string; key: string; value?: any }[] = [];

    if (pendingFilters.with_genres?.length) {
      pendingFilters.with_genres.forEach(id => {
        const genre = currentGenres.find((g: Genre) => g.id === id);
        if (genre) chips.push({ label: `Genre: ${genre.name}`, key: 'with_genres', value: id });
      });
    }

    if (pendingFilters.without_genres?.length) {
      pendingFilters.without_genres.forEach(id => {
        const genre = currentGenres.find((g: Genre) => g.id === id);
        if (genre) chips.push({ label: `Exclude: ${genre.name}`, key: 'without_genres', value: id });
      });
    }

    if (pendingFilters.with_keywords?.length) {
      chips.push({ label: `${pendingFilters.with_keywords.length} Keywords`, key: 'with_keywords' });
    }

    if (pendingFilters.vote_average?.min || pendingFilters.vote_average?.max) {
      const min = pendingFilters.vote_average.min || 0;
      const max = pendingFilters.vote_average.max || 10;
      chips.push({ label: `Rating: ${min.toFixed(1)}-${max.toFixed(1)}`, key: 'vote_average' });
    }

    if (pendingFilters.vote_count?.min) {
      chips.push({ label: `Min ${pendingFilters.vote_count.min} votes`, key: 'vote_count' });
    }

    if (pendingFilters.primary_release_date?.start || pendingFilters.first_air_date?.start) {
      const dateRange = pendingFilters.contentType === 'movie' ? pendingFilters.primary_release_date : pendingFilters.first_air_date;
      if (dateRange.start) {
        chips.push({ 
          label: `${dateRange.start.substring(0, 4)}${dateRange.end ? `-${dateRange.end.substring(0, 4)}` : '+'}`, 
          key: pendingFilters.contentType === 'movie' ? 'primary_release_date' : 'first_air_date'
        });
      }
    }

    if (pendingFilters.with_runtime?.min || pendingFilters.with_runtime?.max) {
      chips.push({ label: `Runtime: ${pendingFilters.with_runtime.min || 0}-${pendingFilters.with_runtime.max || 240}min`, key: 'with_runtime' });
    }

    if (pendingFilters.with_watch_providers?.length) {
      chips.push({ label: `${pendingFilters.with_watch_providers.length} Providers`, key: 'with_watch_providers' });
    }

    if (pendingFilters.with_original_language) {
      const lang = languages.find((l: any) => l.iso_639_1 === pendingFilters.with_original_language);
      chips.push({ label: `Language: ${lang?.english_name || pendingFilters.with_original_language}`, key: 'with_original_language' });
    }

    if (pendingFilters.certification) {
      chips.push({ label: `Certification: ${pendingFilters.certification}`, key: 'certification' });
    }

    if (pendingFilters.include_adult) {
      chips.push({ label: 'Adult Content', key: 'include_adult' });
    }

    if (pendingFilters.sort_by !== 'popularity.desc') {
      const sortOption = SORT_OPTIONS.find(s => s.value === pendingFilters.sort_by);
      chips.push({ label: `Sort: ${sortOption?.label}`, key: 'sort_by' });
    }

    return chips;
  };

  const activeChips = getActiveFilterChips();
  const appliedFiltersCount = activeChips.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-foreground" data-testid="discover-page">
      <Header />
      
      <main className="pt-16">
        <div className="max-w-[1920px] mx-auto">
          <div className="grid lg:grid-cols-[400px_1fr] xl:grid-cols-[450px_1fr] gap-0">
            {/* Filters Sidebar */}
            <aside className="lg:h-screen lg:sticky lg:top-16 bg-slate-950/50 backdrop-blur-xl border-r border-slate-800/50">
              <ScrollArea className="h-full">
                <div className="p-6 space-y-6">
                  {/* Header */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold flex items-center gap-2">
                        <SlidersHorizontal className="h-6 w-6 text-primary" />
                        Discover
                      </h2>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Explore every filter option from TMDB's database
                    </p>
                  </div>

                  <Separator className="bg-slate-800/50" />

                  {/* Content Type Toggle */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <Film className="h-4 w-4 text-primary" />
                      Content Type
                    </Label>
                    <ContentTypeToggle
                      value={pendingFilters.contentType}
                      onChange={(value) => updatePendingFilter('contentType', value)}
                      data-testid="content-type-toggle"
                    />
                  </div>

                  <Separator className="bg-slate-800/50" />

                  {/* Sort By */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Sort By
                    </Label>
                    <Select 
                      value={pendingFilters.sort_by} 
                      onValueChange={(value) => updatePendingFilter('sort_by', value as any)}
                    >
                      <SelectTrigger className="w-full bg-slate-900/50 border-slate-700 hover:bg-slate-900 transition-colors" data-testid="sort-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-700">
                        {SORT_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value} className="hover:bg-slate-800">
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator className="bg-slate-800/50" />

                  {/* Genres */}
                  <Collapsible open={!collapsedSections.includes('genres')}>
                    <div className="space-y-3">
                      <CollapsibleTrigger
                        onClick={() => toggleSection('genres')}
                        className="flex items-center justify-between w-full group"
                        data-testid="toggle-genres"
                      >
                        <Label className="text-sm font-semibold flex items-center gap-2 cursor-pointer">
                          <Tag className="h-4 w-4 text-primary" />
                          Genres
                          {(pendingFilters.with_genres?.length || pendingFilters.without_genres?.length) ? (
                            <Badge variant="secondary" className="ml-2 h-5 px-2 text-xs">
                              {(pendingFilters.with_genres?.length || 0) + (pendingFilters.without_genres?.length || 0)}
                            </Badge>
                          ) : null}
                        </Label>
                        {collapsedSections.includes('genres') ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                        ) : (
                          <ChevronUp className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                        )}
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <GenreChipGroup
                          selectedGenres={{
                            with_genres: pendingFilters.with_genres || [],
                            without_genres: pendingFilters.without_genres || []
                          }}
                          onGenresChange={(genres) => {
                            updatePendingFilter('with_genres', genres.with_genres);
                            updatePendingFilter('without_genres', genres.without_genres);
                          }}
                          genres={currentGenres}
                          data-testid="genre-filter"
                        />
                      </CollapsibleContent>
                    </div>
                  </Collapsible>

                  <Separator className="bg-slate-800/50" />

                  {/* Keywords */}
                  <Collapsible open={!collapsedSections.includes('keywords')}>
                    <div className="space-y-3">
                      <CollapsibleTrigger
                        onClick={() => toggleSection('keywords')}
                        className="flex items-center justify-between w-full group"
                        data-testid="toggle-keywords"
                      >
                        <Label className="text-sm font-semibold flex items-center gap-2 cursor-pointer">
                          <Tag className="h-4 w-4 text-primary" />
                          Keywords & Moods
                          {(pendingFilters.with_keywords?.length || pendingFilters.without_keywords?.length) ? (
                            <Badge variant="secondary" className="ml-2 h-5 px-2 text-xs">
                              {(pendingFilters.with_keywords?.length || 0) + (pendingFilters.without_keywords?.length || 0)}
                            </Badge>
                          ) : null}
                        </Label>
                        {collapsedSections.includes('keywords') ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                        ) : (
                          <ChevronUp className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                        )}
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <KeywordsAutocomplete
                          selectedKeywords={{
                            with_keywords: pendingFilters.with_keywords || [],
                            without_keywords: pendingFilters.without_keywords || []
                          }}
                          onKeywordsChange={(keywords) => {
                            updatePendingFilter('with_keywords', keywords.with_keywords);
                            updatePendingFilter('without_keywords', keywords.without_keywords);
                          }}
                          data-testid="keywords-filter"
                        />
                      </CollapsibleContent>
                    </div>
                  </Collapsible>

                  <Separator className="bg-slate-800/50" />

                  {/* Release Date & Year */}
                  <Collapsible open={!collapsedSections.includes('dates')}>
                    <div className="space-y-3">
                      <CollapsibleTrigger
                        onClick={() => toggleSection('dates')}
                        className="flex items-center justify-between w-full group"
                        data-testid="toggle-dates"
                      >
                        <Label className="text-sm font-semibold flex items-center gap-2 cursor-pointer">
                          <Calendar className="h-4 w-4 text-primary" />
                          Release Date
                        </Label>
                        {collapsedSections.includes('dates') ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                        ) : (
                          <ChevronUp className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                        )}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-4 pt-2">
                        {/* Quick filter chips */}
                        <div className="flex flex-wrap gap-2">
                          {QUICK_FILTERS.map((preset) => (
                            <Button
                              key={preset.id}
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const filters = preset.filters as any;
                                if (pendingFilters.contentType === 'movie') {
                                  updatePendingFilter('primary_release_date', filters.primary_release_date);
                                } else {
                                  updatePendingFilter('first_air_date', filters.first_air_date);
                                }
                              }}
                              data-testid={`quick-filter-${preset.id}`}
                              className="h-7 text-xs bg-slate-900/50 border-slate-700 hover:bg-slate-800 hover:border-primary/50 transition-all"
                            >
                              {preset.label}
                            </Button>
                          ))}
                        </div>

                        {/* Year Range Slider */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium text-muted-foreground">
                              Year Range
                            </Label>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (pendingFilters.contentType === 'movie') {
                                  updatePendingFilter('primary_release_date', {});
                                } else {
                                  updatePendingFilter('first_air_date', {});
                                }
                              }}
                              className="h-6 px-2 text-xs hover:text-destructive"
                              data-testid="reset-year"
                            >
                              Reset
                            </Button>
                          </div>
                          <Slider
                            value={[
                              parseInt((pendingFilters.contentType === 'movie' 
                                ? pendingFilters.primary_release_date?.start 
                                : pendingFilters.first_air_date?.start
                              )?.substring(0, 4) || `${new Date().getFullYear() - 20}`),
                              parseInt((pendingFilters.contentType === 'movie' 
                                ? pendingFilters.primary_release_date?.end 
                                : pendingFilters.first_air_date?.end
                              )?.substring(0, 4) || `${new Date().getFullYear()}`)
                            ]}
                            min={1900}
                            max={new Date().getFullYear() + 2}
                            step={1}
                            onValueChange={([start, end]) => {
                              const dateRange = {
                                start: `${start}-01-01`,
                                end: `${end}-12-31`
                              };
                              if (pendingFilters.contentType === 'movie') {
                                updatePendingFilter('primary_release_date', dateRange);
                              } else {
                                updatePendingFilter('first_air_date', dateRange);
                              }
                            }}
                            className="w-full"
                            data-testid="year-range-slider"
                          />
                          <div className="text-xs text-center text-muted-foreground">
                            {(pendingFilters.contentType === 'movie' 
                              ? pendingFilters.primary_release_date?.start 
                              : pendingFilters.first_air_date?.start
                            )?.substring(0, 4) || new Date().getFullYear() - 20}
                            {' '}-{' '}
                            {(pendingFilters.contentType === 'movie' 
                              ? pendingFilters.primary_release_date?.end 
                              : pendingFilters.first_air_date?.end
                            )?.substring(0, 4) || new Date().getFullYear()}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>

                  <Separator className="bg-slate-800/50" />

                  {/* Runtime */}
                  <Collapsible open={!collapsedSections.includes('runtime')}>
                    <div className="space-y-3">
                      <CollapsibleTrigger
                        onClick={() => toggleSection('runtime')}
                        className="flex items-center justify-between w-full group"
                        data-testid="toggle-runtime"
                      >
                        <Label className="text-sm font-semibold flex items-center gap-2 cursor-pointer">
                          <Clock className="h-4 w-4 text-primary" />
                          Runtime
                        </Label>
                        {collapsedSections.includes('runtime') ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                        ) : (
                          <ChevronUp className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                        )}
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <RuntimeSlider
                          value={[
                            pendingFilters.with_runtime?.min || (pendingFilters.contentType === 'movie' ? 60 : 15),
                            pendingFilters.with_runtime?.max || (pendingFilters.contentType === 'movie' ? 240 : 120)
                          ]}
                          onValueChange={([min, max]) => {
                            const minValue = pendingFilters.contentType === 'movie' ? (min > 60 ? min : undefined) : (min > 15 ? min : undefined);
                            const maxValue = pendingFilters.contentType === 'movie' ? (max < 240 ? max : undefined) : (max < 120 ? max : undefined);
                            updatePendingFilter('with_runtime', { min: minValue, max: maxValue });
                          }}
                          contentType={pendingFilters.contentType}
                          data-testid="runtime-filter"
                        />
                      </CollapsibleContent>
                    </div>
                  </Collapsible>

                  <Separator className="bg-slate-800/50" />

                  {/* User Rating */}
                  <Collapsible open={!collapsedSections.includes('rating')}>
                    <div className="space-y-3">
                      <CollapsibleTrigger
                        onClick={() => toggleSection('rating')}
                        className="flex items-center justify-between w-full group"
                        data-testid="toggle-rating"
                      >
                        <Label className="text-sm font-semibold flex items-center gap-2 cursor-pointer">
                          <Star className="h-4 w-4 text-primary" />
                          User Rating
                        </Label>
                        {collapsedSections.includes('rating') ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                        ) : (
                          <ChevronUp className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                        )}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-4 pt-2">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium text-muted-foreground">
                              Rating: {(pendingFilters.vote_average?.min || 0).toFixed(1)} - {(pendingFilters.vote_average?.max || 10).toFixed(1)} ⭐
                            </Label>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updatePendingFilter('vote_average', {})}
                              className="h-6 px-2 text-xs hover:text-destructive"
                              data-testid="reset-rating"
                            >
                              Reset
                            </Button>
                          </div>
                          <Slider
                            value={[pendingFilters.vote_average?.min || 0, pendingFilters.vote_average?.max || 10]}
                            min={0}
                            max={10}
                            step={0.1}
                            onValueChange={([min, max]) => {
                              updatePendingFilter('vote_average', { 
                                min: min > 0 ? min : undefined, 
                                max: max < 10 ? max : undefined 
                              });
                            }}
                            className="w-full"
                            data-testid="rating-slider"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium text-muted-foreground">
                              Vote Count: {pendingFilters.vote_count?.min || 0}{pendingFilters.vote_count?.max ? ` - ${pendingFilters.vote_count.max}` : '+'}
                            </Label>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updatePendingFilter('vote_count', {})}
                              className="h-6 px-2 text-xs hover:text-destructive"
                              data-testid="reset-vote-count"
                            >
                              Reset
                            </Button>
                          </div>
                          <Slider
                            value={[pendingFilters.vote_count?.min || 0, pendingFilters.vote_count?.max || 5000]}
                            min={0}
                            max={5000}
                            step={50}
                            onValueChange={([min, max]) => {
                              updatePendingFilter('vote_count', { 
                                min: min > 0 ? min : undefined, 
                                max: max < 5000 ? max : undefined 
                              });
                            }}
                            className="w-full"
                            data-testid="vote-count-slider"
                          />
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>

                  <Separator className="bg-slate-800/50" />

                  {/* Streaming Providers */}
                  <Collapsible open={!collapsedSections.includes('providers')}>
                    <div className="space-y-3">
                      <CollapsibleTrigger
                        onClick={() => toggleSection('providers')}
                        className="flex items-center justify-between w-full group"
                        data-testid="toggle-providers"
                      >
                        <Label className="text-sm font-semibold flex items-center gap-2 cursor-pointer">
                          <MonitorPlay className="h-4 w-4 text-primary" />
                          Streaming Providers
                          {pendingFilters.with_watch_providers?.length ? (
                            <Badge variant="secondary" className="ml-2 h-5 px-2 text-xs">
                              {pendingFilters.with_watch_providers.length}
                            </Badge>
                          ) : null}
                        </Label>
                        {collapsedSections.includes('providers') ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                        ) : (
                          <ChevronUp className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                        )}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-4 pt-2">
                        {/* Region Selector */}
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-muted-foreground">Region</Label>
                          <Select 
                            value={pendingFilters.watch_region || 'US'} 
                            onValueChange={(value) => updatePendingFilter('watch_region', value)}
                          >
                            <SelectTrigger className="w-full bg-slate-900/50 border-slate-700" data-testid="region-select">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-700">
                              {countries.slice(0, 20).map((country: any) => (
                                <SelectItem key={country.iso_3166_1} value={country.iso_3166_1}>
                                  {country.english_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Provider Logos Grid */}
                        {watchProviders.length > 0 ? (
                          <div className="grid grid-cols-4 gap-3">
                            {watchProviders.map((provider: WatchProvider) => (
                              <button
                                key={provider.provider_id}
                                onClick={() => {
                                  const current = pendingFilters.with_watch_providers || [];
                                  updatePendingFilter(
                                    'with_watch_providers',
                                    current.includes(provider.provider_id)
                                      ? current.filter(id => id !== provider.provider_id)
                                      : [...current, provider.provider_id]
                                  );
                                }}
                                className={cn(
                                  "aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105",
                                  pendingFilters.with_watch_providers?.includes(provider.provider_id)
                                    ? "border-primary shadow-lg shadow-primary/20"
                                    : "border-slate-700 hover:border-slate-600"
                                )}
                                data-testid={`provider-${provider.provider_id}`}
                              >
                                <img
                                  src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                                  alt={provider.provider_name}
                                  className="w-full h-full object-cover"
                                />
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground text-center py-4">
                            No providers available for this region
                          </p>
                        )}

                        {/* Monetization Types */}
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-muted-foreground">Availability Type</Label>
                          <div className="flex flex-wrap gap-2">
                            {MONETIZATION_TYPES.map((type) => (
                              <Button
                                key={type.value}
                                variant={pendingFilters.with_watch_monetization_types?.includes(type.value as any) ? "default" : "outline"}
                                size="sm"
                                onClick={() => {
                                  const current = pendingFilters.with_watch_monetization_types || [];
                                  updatePendingFilter(
                                    'with_watch_monetization_types',
                                    current.includes(type.value as any)
                                      ? current.filter(v => v !== type.value)
                                      : [...current, type.value as any]
                                  );
                                }}
                                className="h-8 text-xs"
                                data-testid={`monetization-${type.value}`}
                              >
                                {type.icon} {type.label}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>

                  <Separator className="bg-slate-800/50" />

                  {/* Advanced Filters */}
                  <Collapsible open={!collapsedSections.includes('advanced')}>
                    <div className="space-y-3">
                      <CollapsibleTrigger
                        onClick={() => toggleSection('advanced')}
                        className="flex items-center justify-between w-full group"
                        data-testid="toggle-advanced"
                      >
                        <Label className="text-sm font-semibold flex items-center gap-2 cursor-pointer">
                          <SlidersHorizontal className="h-4 w-4 text-primary" />
                          Advanced Filters
                        </Label>
                        {collapsedSections.includes('advanced') ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                        ) : (
                          <ChevronUp className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                        )}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-4 pt-2">
                        {/* People */}
                        <div className="space-y-2">
                          <Label className="text-xs font-medium flex items-center gap-2">
                            <Users className="h-3 w-3" />
                            Cast & Crew
                          </Label>
                          <PeopleAutocomplete
                            selectedPeople={pendingFilters.with_people || []}
                            onPeopleChange={(people) => updatePendingFilter('with_people', people)}
                            data-testid="people-filter"
                          />
                        </div>

                        {/* Companies */}
                        <div className="space-y-2">
                          <Label className="text-xs font-medium flex items-center gap-2">
                            <Building2 className="h-3 w-3" />
                            Production Companies
                          </Label>
                          <CompaniesAutocomplete
                            selectedCompanies={pendingFilters.with_companies || []}
                            onCompaniesChange={(companies) => updatePendingFilter('with_companies', companies)}
                            data-testid="companies-filter"
                          />
                        </div>

                        {/* Original Language */}
                        <div className="space-y-2">
                          <Label className="text-xs font-medium flex items-center gap-2">
                            <Globe className="h-3 w-3" />
                            Original Language
                          </Label>
                          <Select 
                            value={pendingFilters.with_original_language || ''} 
                            onValueChange={(value) => updatePendingFilter('with_original_language', value || undefined)}
                          >
                            <SelectTrigger className="w-full bg-slate-900/50 border-slate-700" data-testid="language-select">
                              <SelectValue placeholder="Any language" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-700">
                              <SelectItem value="">Any language</SelectItem>
                              {languages.slice(0, 30).map((lang: any) => (
                                <SelectItem key={lang.iso_639_1} value={lang.iso_639_1}>
                                  {lang.english_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Certification */}
                        {pendingFilters.contentType === 'movie' && (
                          <div className="space-y-2">
                            <Label className="text-xs font-medium flex items-center gap-2">
                              <Shield className="h-3 w-3" />
                              Certification (US)
                            </Label>
                            <Select 
                              value={pendingFilters.certification || ''} 
                              onValueChange={(value) => {
                                updatePendingFilter('certification', value || undefined);
                                updatePendingFilter('certification_country', value ? 'US' : undefined);
                              }}
                            >
                              <SelectTrigger className="w-full bg-slate-900/50 border-slate-700" data-testid="certification-select">
                                <SelectValue placeholder="Any rating" />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-900 border-slate-700">
                                <SelectItem value="">Any rating</SelectItem>
                                <SelectItem value="G">G - General Audiences</SelectItem>
                                <SelectItem value="PG">PG - Parental Guidance</SelectItem>
                                <SelectItem value="PG-13">PG-13</SelectItem>
                                <SelectItem value="R">R - Restricted</SelectItem>
                                <SelectItem value="NC-17">NC-17</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {/* Adult Content Toggle */}
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-medium flex items-center gap-2">
                            <Shield className="h-3 w-3" />
                            Include Adult Content
                          </Label>
                          <Switch
                            checked={pendingFilters.include_adult || false}
                            onCheckedChange={(checked) => updatePendingFilter('include_adult', checked)}
                            data-testid="adult-toggle"
                          />
                        </div>

                        {/* Release Type (Movies only) */}
                        {pendingFilters.contentType === 'movie' && (
                          <div className="space-y-2">
                            <Label className="text-xs font-medium">Release Type</Label>
                            <div className="grid grid-cols-2 gap-2">
                              {RELEASE_TYPES.map((type) => (
                                <Button
                                  key={type.value}
                                  variant={pendingFilters.with_release_type?.includes(type.value) ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => {
                                    const current = pendingFilters.with_release_type || [];
                                    updatePendingFilter(
                                      'with_release_type',
                                      current.includes(type.value)
                                        ? current.filter(v => v !== type.value)
                                        : [...current, type.value]
                                    );
                                  }}
                                  className="h-8 text-xs"
                                  data-testid={`release-type-${type.value}`}
                                >
                                  {type.label}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                      </CollapsibleContent>
                    </div>
                  </Collapsible>

                  <Separator className="bg-slate-800/50" />

                  {/* Action Buttons */}
                  <div className="space-y-3 pt-4">
                    <Button
                      onClick={applyFilters}
                      className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20"
                      data-testid="apply-filters-button"
                    >
                      <Search className="h-5 w-5 mr-2" />
                      Search & Discover
                    </Button>
                    {appliedFiltersCount > 0 && (
                      <Button
                        onClick={clearAllFilters}
                        variant="outline"
                        className="w-full border-slate-700 hover:bg-slate-800/50"
                        data-testid="clear-all-button"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Clear All Filters ({appliedFiltersCount})
                      </Button>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </aside>

            {/* Main Content */}
            <div className="bg-gradient-to-b from-slate-900/50 to-slate-900/30">
              {/* Active Filters Bar */}
              {activeChips.length > 0 && (
                <div className="sticky top-16 z-10 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800/50 p-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-muted-foreground whitespace-nowrap">
                      Active Filters:
                    </span>
                    <AnimatePresence mode="popLayout">
                      {activeChips.map((chip, index) => (
                        <motion.div
                          key={`${chip.key}-${chip.value || index}`}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Badge 
                            variant="secondary" 
                            className="h-7 px-3 gap-2 bg-slate-800 border-slate-700 hover:bg-slate-700 transition-colors cursor-pointer"
                            onClick={() => removeFilter(chip.key, chip.value)}
                            data-testid={`active-chip-${chip.key}`}
                          >
                            {chip.label}
                            <X className="h-3 w-3" />
                          </Badge>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* Results */}
              <div className="p-6">
                <div className="mb-6">
                  <h1 className="text-3xl font-bold mb-2">
                    {pendingFilters.contentType === 'movie' ? 'Discover Movies' : 'Discover TV Shows'}
                  </h1>
                  <p className="text-muted-foreground">
                    {isLoading ? 'Loading...' : movies ? `${movies.length} results found` : 'Adjust filters and click Search'}
                  </p>
                </div>

                {isLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {Array.from({ length: 20 }).map((_, i) => (
                      <MovieCardSkeleton key={i} />
                    ))}
                  </div>
                ) : movies && movies.length > 0 ? (
                  <>
                    <MovieGrid movies={movies} mediaType={pendingFilters.contentType} />
                    
                    {hasNextPage && (
                      <div ref={triggerRef} className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    )}
                    
                    {isFetchingNextPage && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-6">
                        {Array.from({ length: 10 }).map((_, i) => (
                          <MovieCardSkeleton key={i} />
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-full max-w-md text-center">
                      <svg
                        className="mx-auto h-20 w-20 text-muted-foreground/50 mb-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <h3 className="text-xl font-semibold mb-2">
                        No results found
                      </h3>
                      <p className="text-muted-foreground mb-6">
                        Try adjusting your filters or search criteria.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
