import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Save, RotateCcw, Sparkles, Copy, Check } from "lucide-react";
import { useState } from "react";
import { AdvancedFilterState } from "@/types/filters";
import { cn } from "@/lib/utils";
import { useFilterContext } from "@/contexts/FilterContext";
import { filterMotion } from "../filter-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GenreFilters } from "./facets/GenreFilters";
import { DateFilters } from "./facets/DateFilters";
import { RatingFilters } from "./facets/RatingFilters";
import { StreamingFilters } from "./facets/StreamingFilters";
import { PeopleFilters } from "./facets/PeopleFilters";
import { AdvancedFilters } from "./facets/AdvancedFilters";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";

interface FilterLabProps {
  filters: AdvancedFilterState;
  onFiltersChange: (filters: AdvancedFilterState) => void;
  onSavePreset?: () => void;
  className?: string;
}

// Utility function to build TMDB query string from filters
function buildTMDBQueryString(filters: AdvancedFilterState): string {
  const params = new URLSearchParams();
  const isMovie = filters.contentType === 'movie';

  // Genres
  if (filters.with_genres?.length > 0) {
    params.append('with_genres', filters.with_genres.join(','));
  }
  if (filters.without_genres?.length > 0) {
    params.append('without_genres', filters.without_genres.join(','));
  }

  // Keywords
  if (filters.with_keywords && filters.with_keywords.length > 0) {
    params.append('with_keywords', filters.with_keywords.join(','));
  }
  if (filters.without_keywords && filters.without_keywords.length > 0) {
    params.append('without_keywords', filters.without_keywords.join(','));
  }

  // Date filters - Movies
  if (isMovie) {
    if (filters.primary_release_date?.start) {
      params.append('primary_release_date.gte', filters.primary_release_date.start);
    }
    if (filters.primary_release_date?.end) {
      params.append('primary_release_date.lte', filters.primary_release_date.end);
    }
    if (filters.release_date?.start) {
      params.append('release_date.gte', filters.release_date.start);
    }
    if (filters.release_date?.end) {
      params.append('release_date.lte', filters.release_date.end);
    }
    if (filters.primary_release_year) {
      params.append('primary_release_year', filters.primary_release_year.toString());
    }
  }

  // Date filters - TV
  if (!isMovie) {
    if (filters.first_air_date?.start) {
      params.append('first_air_date.gte', filters.first_air_date.start);
    }
    if (filters.first_air_date?.end) {
      params.append('first_air_date.lte', filters.first_air_date.end);
    }
    if (filters.air_date?.start) {
      params.append('air_date.gte', filters.air_date.start);
    }
    if (filters.air_date?.end) {
      params.append('air_date.lte', filters.air_date.end);
    }
    if (filters.first_air_date_year) {
      params.append('first_air_date_year', filters.first_air_date_year.toString());
    }
    if (filters.timezone) {
      params.append('timezone', filters.timezone);
    }
  }

  // Numeric filters
  if (filters.with_runtime?.min !== undefined) {
    params.append('with_runtime.gte', filters.with_runtime.min.toString());
  }
  if (filters.with_runtime?.max !== undefined) {
    params.append('with_runtime.lte', filters.with_runtime.max.toString());
  }
  if (filters.vote_average?.min !== undefined) {
    params.append('vote_average.gte', filters.vote_average.min.toString());
  }
  if (filters.vote_average?.max !== undefined) {
    params.append('vote_average.lte', filters.vote_average.max.toString());
  }
  if (filters.vote_count?.min !== undefined) {
    params.append('vote_count.gte', filters.vote_count.min.toString());
  }
  if (filters.vote_count?.max !== undefined) {
    params.append('vote_count.lte', filters.vote_count.max.toString());
  }

  // Language & Region
  if (filters.with_original_language) {
    params.append('with_original_language', filters.with_original_language);
  }
  if (filters.region) {
    params.append('region', filters.region);
  }
  if (filters.watch_region) {
    params.append('watch_region', filters.watch_region);
  }

  // Streaming
  if (filters.with_watch_providers?.length > 0) {
    params.append('with_watch_providers', filters.with_watch_providers.join('|'));
  }
  if (filters.with_watch_monetization_types?.length > 0) {
    params.append('with_watch_monetization_types', filters.with_watch_monetization_types.join('|'));
  }

  // People - Movies only
  if (isMovie) {
    if (filters.with_cast?.length > 0) {
      params.append('with_cast', filters.with_cast.join(','));
    }
    if (filters.with_crew?.length > 0) {
      params.append('with_crew', filters.with_crew.join(','));
    }
    if (filters.with_people?.length > 0) {
      params.append('with_people', filters.with_people.join(','));
    }
  }

  // Production
  if (filters.with_companies?.length > 0) {
    params.append('with_companies', filters.with_companies.join(','));
  }
  if (!isMovie && filters.with_networks?.length > 0) {
    params.append('with_networks', filters.with_networks.join(','));
  }

  // Content filtering - Movies
  if (isMovie) {
    if (filters.include_adult !== undefined) {
      params.append('include_adult', filters.include_adult.toString());
    }
    if (filters.include_video !== undefined) {
      params.append('include_video', filters.include_video.toString());
    }
    if (filters.certification_country) {
      params.append('certification_country', filters.certification_country);
    }
    if (filters.certification) {
      params.append('certification', filters.certification);
    }
    if (filters.certification_lte) {
      params.append('certification.lte', filters.certification_lte);
    }
    if (filters.with_release_type && filters.with_release_type.length > 0) {
      params.append('with_release_type', filters.with_release_type.join('|'));
    }
  }

  // Content filtering - TV
  if (!isMovie && filters.screened_theatrically !== undefined) {
    params.append('screened_theatrically', filters.screened_theatrically.toString());
  }

  // Sorting
  if (filters.sort_by) {
    params.append('sort_by', filters.sort_by);
  }

  return params.toString();
}

export function FilterLab({ filters, onFiltersChange, onSavePreset, className }: FilterLabProps) {
  const { isLabOpen, setLabOpen } = useFilterContext();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  if (!isLabOpen) return null;

  const resetFilters = () => {
    const defaultFilters: AdvancedFilterState = {
      contentType: filters.contentType,
      category: filters.contentType === 'movie' ? 'trending' : 'discover',
      with_genres: [],
      without_genres: [],
      primary_release_date: {},
      release_date: {},
      first_air_date: {},
      air_date: {},
      with_runtime: {},
      vote_average: {},
      vote_count: {},
      with_watch_providers: [],
      with_watch_monetization_types: [],
      with_cast: [],
      with_crew: [],
      with_people: [],
      with_companies: [],
      with_networks: [],
      sort_by: 'popularity.desc',
    };
    onFiltersChange(defaultFilters);
  };

  const tmdbQueryString = buildTMDBQueryString(filters);

  const copyQueryString = async () => {
    try {
      await navigator.clipboard.writeText(tmdbQueryString);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "TMDB query string copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy query string to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <AnimatePresence>
      {isLabOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLabOpen(false)}
          />

          {/* Modal */}
          <motion.div
            className={cn(
              "fixed inset-4 md:inset-8 z-[70] glass-panel border border-border/50 rounded-3xl overflow-hidden",
              "flex flex-col",
              className
            )}
            {...filterMotion.labScale}
          >
            {/* Header */}
            <div className="flex-shrink-0 glass-panel border-b border-border/50 backdrop-blur-xl p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">Filter Lab</h2>
                    <p className="text-sm text-muted-foreground">Advanced filtering and discovery</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetFilters}
                    className="gap-2"
                    data-testid="lab-reset-filters"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span className="hidden sm:inline">Reset</span>
                  </Button>

                  {onSavePreset && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={onSavePreset}
                      className="gap-2"
                      data-testid="lab-save-preset"
                    >
                      <Save className="h-4 w-4" />
                      <span className="hidden sm:inline">Save Preset</span>
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setLabOpen(false)}
                    className="rounded-full"
                    data-testid="close-filter-lab"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search filters and options..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background/50 border-border/50"
                />
              </div>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1">
              <div className="p-4 md:p-6">
                <Tabs defaultValue="genres" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 mb-6">
                    <TabsTrigger value="genres">Genres</TabsTrigger>
                    <TabsTrigger value="dates">Dates</TabsTrigger>
                    <TabsTrigger value="ratings">Ratings</TabsTrigger>
                    <TabsTrigger value="streaming">Streaming</TabsTrigger>
                    <TabsTrigger value="people">People</TabsTrigger>
                    <TabsTrigger value="advanced">Advanced</TabsTrigger>
                  </TabsList>

                  <TabsContent value="genres" className="space-y-4">
                    <GenreFilters filters={filters} onFiltersChange={onFiltersChange} />
                  </TabsContent>

                  <TabsContent value="dates" className="space-y-4">
                    <DateFilters filters={filters} onFiltersChange={onFiltersChange} />
                  </TabsContent>

                  <TabsContent value="ratings" className="space-y-4">
                    <RatingFilters filters={filters} onFiltersChange={onFiltersChange} />
                  </TabsContent>

                  <TabsContent value="streaming" className="space-y-4">
                    <StreamingFilters filters={filters} onFiltersChange={onFiltersChange} />
                  </TabsContent>

                  <TabsContent value="people" className="space-y-4">
                    <PeopleFilters filters={filters} onFiltersChange={onFiltersChange} />
                  </TabsContent>

                  <TabsContent value="advanced" className="space-y-4">
                    <AdvancedFilters filters={filters} onFiltersChange={onFiltersChange} />
                  </TabsContent>
                </Tabs>
              </div>
            </ScrollArea>

            {/* TMDB Query String Display */}
            {tmdbQueryString && (
              <div className="flex-shrink-0 glass-panel border-t border-border/50 backdrop-blur-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2">TMDB Discover Query</h4>
                    <div className="relative">
                      <code className="text-xs text-foreground/80 bg-muted/50 px-3 py-2 rounded-lg block overflow-x-auto whitespace-nowrap">
                        {tmdbQueryString}
                      </code>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyQueryString}
                    className="flex-shrink-0 gap-2"
                    data-testid="copy-query-string"
                  >
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
