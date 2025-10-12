import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Save, RotateCcw, Sparkles } from "lucide-react";
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

interface FilterLabProps {
  filters: AdvancedFilterState;
  onFiltersChange: (filters: AdvancedFilterState) => void;
  onSavePreset?: () => void;
  className?: string;
}

export function FilterLab({ filters, onFiltersChange, onSavePreset, className }: FilterLabProps) {
  const { isLabOpen, setLabOpen } = useFilterContext();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");

  if (!isLabOpen) return null;

  const resetFilters = () => {
    const defaultFilters: AdvancedFilterState = {
      contentType: filters.contentType,
      category: 'discover',
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
