import { motion, AnimatePresence } from "framer-motion";
import { X, Tag, Calendar, Star, MonitorPlay, Users, Settings } from "lucide-react";
import { AdvancedFilterState } from "@/types/filters";
import { cn } from "@/lib/utils";
import { useFilterContext } from "@/contexts/FilterContext";
import { filterMotion } from "../filter-motion";
import { FacetHeader } from "../atoms";
import { useIsMobile } from "@/hooks/use-mobile";
import { GenreFilters } from "./facets/GenreFilters";
import { DateFilters } from "./facets/DateFilters";
import { RatingFilters } from "./facets/RatingFilters";
import { StreamingFilters } from "./facets/StreamingFilters";
import { PeopleFilters } from "./facets/PeopleFilters";
import { AdvancedFilters } from "./facets/AdvancedFilters";

interface FilterDockProps {
  filters: AdvancedFilterState;
  onFiltersChange: (filters: AdvancedFilterState) => void;
  className?: string;
}

const DOCK_SECTIONS = [
  { id: 'explore', label: 'Explore', icon: Tag, description: 'Genres & themes' },
  { id: 'release', label: 'Release', icon: Calendar, description: 'Dates & runtime' },
  { id: 'ratings', label: 'Ratings', icon: Star, description: 'Score & popularity' },
  { id: 'streaming', label: 'Streaming', icon: MonitorPlay, description: 'Services & availability' },
  { id: 'people', label: 'People', icon: Users, description: 'Cast & crew' },
  { id: 'advanced', label: 'Advanced', icon: Settings, description: 'More options' },
];

export function FilterDock({ filters, onFiltersChange, className }: FilterDockProps) {
  const { isDockOpen, setDockOpen, activeSection, setActiveSection } = useFilterContext();
  const isMobile = useIsMobile();

  if (!isDockOpen) return null;

  const currentSection = DOCK_SECTIONS.find(s => s.id === activeSection) || DOCK_SECTIONS[0];

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isDockOpen && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDockOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Dock Panel */}
      <AnimatePresence>
        {isDockOpen && (
          <motion.div
            className={cn(
              "fixed z-50 glass-panel border",
              isMobile
                ? "inset-x-0 bottom-0 rounded-t-3xl border-t border-x-0 max-h-[85vh]"
                : "top-0 right-0 bottom-0 w-full max-w-md border-l border-y-0 rounded-l-3xl",
              className
            )}
            {...(isMobile ? filterMotion.dockSlideBottom : filterMotion.dockSlideRight)}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 glass-panel border-b border-border/50 backdrop-blur-xl">
              <div className="flex items-center justify-between p-4">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Filter & Discover</h2>
                  <p className="text-xs text-muted-foreground">Find exactly what you're looking for</p>
                </div>
                <motion.button
                  onClick={() => setDockOpen(false)}
                  className="p-2 rounded-full hover:bg-muted/50 transition-colors"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  data-testid="close-filter-dock"
                >
                  <X className="h-5 w-5" />
                </motion.button>
              </div>

              {/* Section Tabs */}
              <div className="flex overflow-x-auto px-4 pb-3 gap-2 scrollbar-hide">
                {DOCK_SECTIONS.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;
                  return (
                    <motion.button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={cn(
                        "relative flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap",
                        "border backdrop-blur-sm transition-all duration-300 flex-shrink-0",
                        isActive
                          ? "bg-primary/10 border-primary/30 text-primary"
                          : "bg-muted/30 border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      data-testid={`section-tab-${section.id}`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{section.label}</span>
                      {isActive && (
                        <motion.div
                          layoutId="active-section"
                          className="absolute inset-0 bg-primary/5 rounded-full border border-primary/20"
                          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Content Area */}
            <div className="overflow-y-auto h-full pb-24 px-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                  className="py-6"
                >
                  <FacetHeader
                    icon={currentSection.icon}
                    title={currentSection.label}
                    description={currentSection.description}
                  />

                  {activeSection === 'explore' && (
                    <GenreFilters filters={filters} onFiltersChange={onFiltersChange} />
                  )}
                  {activeSection === 'release' && (
                    <DateFilters filters={filters} onFiltersChange={onFiltersChange} />
                  )}
                  {activeSection === 'ratings' && (
                    <RatingFilters filters={filters} onFiltersChange={onFiltersChange} />
                  )}
                  {activeSection === 'streaming' && (
                    <StreamingFilters filters={filters} onFiltersChange={onFiltersChange} />
                  )}
                  {activeSection === 'people' && (
                    <PeopleFilters filters={filters} onFiltersChange={onFiltersChange} />
                  )}
                  {activeSection === 'advanced' && (
                    <AdvancedFilters filters={filters} onFiltersChange={onFiltersChange} />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
