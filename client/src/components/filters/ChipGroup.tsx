import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Plus, X, Check, Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

export interface ChipItem {
  id: string | number;
  label: string;
  value: string | number;
  color?: string;
  description?: string;
  count?: number;
}

export interface ChipSelection {
  item: ChipItem;
  mode: 'include' | 'exclude';
}

interface ChipGroupProps {
  items: ChipItem[];
  selected: ChipSelection[];
  onSelectionChange: (selections: ChipSelection[]) => void;
  placeholder?: string;
  emptyMessage?: string;
  maxSelections?: number;
  allowExclude?: boolean;
  searchable?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'premium' | 'minimal';
  'data-testid'?: string;
}

export const ChipGroup = ({
  items,
  selected,
  onSelectionChange,
  placeholder = "Search items...",
  emptyMessage = "No items found",
  maxSelections,
  allowExclude = true,
  searchable = true,
  className,
  size = 'md',
  variant = 'premium',
  'data-testid': testId
}: ChipGroupProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredChip, setHoveredChip] = useState<string | null>(null);

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    
    const query = searchQuery.toLowerCase();
    return items.filter(item => 
      item.label.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query)
    );
  }, [items, searchQuery]);

  // Show all filtered items (including selected ones for mode switching)
  const availableItems = useMemo(() => {
    return filteredItems;
  }, [filteredItems]);

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const chipSizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const addSelection = (item: ChipItem, mode: 'include' | 'exclude' = 'include') => {
    const existingIndex = selected.findIndex(s => s.item.id === item.id);
    
    if (existingIndex !== -1) {
      const existing = selected[existingIndex];
      if (existing.mode === mode) {
        setIsOpen(false);
        return;
      }
      
      // If switching to 'include' mode, remove all other 'include' selections
      let updated = [...selected];
      if (mode === 'include') {
        updated = updated.filter(s => s.mode !== 'include');
      }
      updated[updated.findIndex(s => s.item.id === item.id)] = { ...existing, mode };
      onSelectionChange(updated);
      setIsOpen(false);
      return;
    }
    
    if (maxSelections && selected.length >= maxSelections) return;
    
    // If adding new 'include' selection, remove all existing 'include' selections
    let updatedSelected = [...selected];
    if (mode === 'include') {
      updatedSelected = updatedSelected.filter(s => s.mode !== 'include');
    }
    
    const newSelection: ChipSelection = { item, mode };
    onSelectionChange([...updatedSelected, newSelection]);
    setIsOpen(false);
  };

  const removeSelection = (itemId: string | number) => {
    onSelectionChange(selected.filter(s => s.item.id !== itemId));
  };

  const toggleSelectionMode = (itemId: string | number) => {
    onSelectionChange(
      selected.map(s => 
        s.item.id === itemId 
          ? { ...s, mode: s.mode === 'include' ? 'exclude' : 'include' }
          : s
      )
    );
  };

  const clearAll = () => {
    onSelectionChange([]);
  };

  const getChipVariant = (mode: 'include' | 'exclude') => {
    switch (mode) {
      case 'include':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20';
      case 'exclude':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/20';
    }
  };

  return (
    <div 
      className={cn("space-y-3", className)}
      data-testid={testId}
    >
      {/* Selected chips */}
      <AnimatePresence mode="popLayout">
        {selected.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className={cn("font-medium text-muted-foreground", sizeClasses[size])}>
                Selected ({selected.length}{maxSelections && `/${maxSelections}`})
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                data-testid="clear-all-chips"
              >
                Clear All
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <AnimatePresence mode="popLayout">
                {selected.map((selection, index) => (
                  <motion.div
                    key={selection.item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: -20 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 25,
                      delay: index * 0.05
                    }}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg border",
                      "transition-all duration-200 cursor-pointer group",
                      getChipVariant(selection.mode),
                      chipSizeClasses[size]
                    )}
                    onMouseEnter={() => setHoveredChip(selection.item.id.toString())}
                    onMouseLeave={() => setHoveredChip(null)}
                    data-testid={`selected-chip-${selection.item.id}`}
                  >
                    {/* Mode indicator */}
                    <div
                      className={cn(
                        "flex items-center justify-center w-5 h-5 rounded-full",
                        "transition-all duration-200 shadow-sm",
                        selection.mode === 'include' 
                          ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30" 
                          : "bg-rose-500/20 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/30"
                      )}
                    >
                      {selection.mode === 'include' ? (
                        <Check className="w-3 h-3 font-bold" />
                      ) : (
                        <X className="w-3 h-3 font-bold" />
                      )}
                    </div>

                    {/* Label */}
                    <span className="font-medium">
                      {selection.item.label}
                    </span>

                    {/* Count */}
                    {selection.item.count && (
                      <span className="opacity-70 font-normal">
                        ({selection.item.count.toLocaleString()})
                      </span>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-1 ml-1">
                      {allowExclude && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelectionMode(selection.item.id);
                          }}
                          className={cn(
                            "flex items-center justify-center w-4 h-4 rounded-full",
                            "opacity-0 group-hover:opacity-100 transition-all duration-200",
                            "hover:scale-110 active:scale-95",
                            selection.mode === 'include'
                              ? "hover:bg-destructive/20 hover:text-destructive"
                              : "hover:bg-primary/20 hover:text-primary"
                          )}
                          title={selection.mode === 'include' ? 'Exclude' : 'Include'}
                          data-testid={`toggle-chip-mode-${selection.item.id}`}
                        >
                          <Filter className="w-2.5 h-2.5" />
                        </button>
                      )}
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSelection(selection.item.id);
                        }}
                        className={cn(
                          "flex items-center justify-center w-4 h-4 rounded-full",
                          "opacity-0 group-hover:opacity-100 transition-all duration-200",
                          "hover:bg-destructive/20 hover:text-destructive",
                          "hover:scale-110 active:scale-95"
                        )}
                        title="Remove"
                        data-testid={`remove-chip-${selection.item.id}`}
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add chips section */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start gap-2 glass-panel border-white/10",
              "hover:bg-primary/5 transition-all duration-200",
              variant === 'premium' && "glass-panel border-white/10",
              size === 'sm' && "h-8",
              size === 'md' && "h-10",
              size === 'lg' && "h-12"
            )}
            disabled={maxSelections ? selected.length >= maxSelections : false}
            data-testid="add-chips-trigger"
          >
            <Plus className="w-4 h-4" />
            Add {items.length > 0 ? items[0].label.split(' ').pop()?.toLowerCase() || 'items' : 'items'}
            {maxSelections && (
              <Badge variant="secondary" className="ml-auto">
                {selected.length}/{maxSelections}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        
        <PopoverContent
          className={cn(
            "w-80 p-0 glass-panel border-white/10",
            variant === 'premium' && "backdrop-blur-md"
          )}
          align="start"
          data-testid="chips-popover"
        >
          <div className="p-3 space-y-3">
            {/* Search */}
            {searchable && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={placeholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 glass-input"
                  data-testid="chip-search-input"
                />
              </div>
            )}

            {/* Available items */}
            <div className="max-h-60 overflow-y-auto space-y-1">
              {availableItems.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  {searchQuery ? "No matching items found" : emptyMessage}
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {availableItems.map((item, index) => {
                    const selection = selected.find(s => s.item.id === item.id);
                    const isIncluded = selection?.mode === 'include';
                    const isExcluded = selection?.mode === 'exclude';
                    
                    return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.02 }}
                      className="group"
                    >
                      <div
                        className={cn(
                          "flex items-center justify-between p-2 rounded-lg",
                          "hover:bg-primary/5 cursor-pointer transition-all duration-200",
                          "border border-transparent hover:border-primary/10",
                          (isIncluded || isExcluded) && "bg-muted/30"
                        )}
                        data-testid={`available-chip-${item.id}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {isIncluded && (
                              <div className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                                <Check className="w-2.5 h-2.5" />
                              </div>
                            )}
                            {isExcluded && (
                              <div className="flex items-center justify-center w-4 h-4 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400">
                                <X className="w-2.5 h-2.5" />
                              </div>
                            )}
                            <span className={cn(
                              "font-medium truncate",
                              isIncluded && "text-emerald-600 dark:text-emerald-400",
                              isExcluded && "text-rose-600 dark:text-rose-400"
                            )}>
                              {item.label}
                            </span>
                            {item.count && (
                              <span className="text-xs text-muted-foreground">
                                ({item.count.toLocaleString()})
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              {item.description}
                            </p>
                          )}
                        </div>

                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => addSelection(item, 'include')}
                            className="h-7 w-7 p-0 hover:bg-emerald-500/15 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-full"
                            title="Include this item"
                            data-testid={`include-chip-${item.id}`}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </Button>
                          {allowExclude && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => addSelection(item, 'exclude')}
                              className="h-7 w-7 p-0 hover:bg-rose-500/15 hover:text-rose-600 dark:hover:text-rose-400 rounded-full"
                              title="Exclude this item"
                              data-testid={`exclude-chip-${item.id}`}
                            >
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

// Genre-specific implementation
export interface GenreChipGroupProps {
  selectedGenres: { with_genres: number[]; without_genres: number[] };
  onGenresChange: (genres: { with_genres: number[]; without_genres: number[] }) => void;
  genres: Array<{ id: number; name: string }>;
  className?: string;
}

export const GenreChipGroup = ({
  selectedGenres,
  onGenresChange,
  genres,
  className
}: GenreChipGroupProps) => {
  // Convert genres to chip items
  const chipItems: ChipItem[] = genres.map(genre => ({
    id: genre.id,
    label: genre.name,
    value: genre.id
  }));

  // Convert selections to chip format
  const chipSelections: ChipSelection[] = [
    ...selectedGenres.with_genres.map(id => {
      const genre = genres.find(g => g.id === id);
      return genre ? {
        item: { id: genre.id, label: genre.name, value: genre.id },
        mode: 'include' as const
      } : null;
    }).filter(Boolean) as ChipSelection[],
    ...selectedGenres.without_genres.map(id => {
      const genre = genres.find(g => g.id === id);
      return genre ? {
        item: { id: genre.id, label: genre.name, value: genre.id },
        mode: 'exclude' as const
      } : null;
    }).filter(Boolean) as ChipSelection[]
  ];

  const handleSelectionChange = (selections: ChipSelection[]) => {
    const with_genres = selections
      .filter(s => s.mode === 'include')
      .map(s => s.item.id as number);
    
    const without_genres = selections
      .filter(s => s.mode === 'exclude')
      .map(s => s.item.id as number);

    onGenresChange({ with_genres, without_genres });
  };

  return (
    <ChipGroup
      items={chipItems}
      selected={chipSelections}
      onSelectionChange={handleSelectionChange}
      placeholder="Search genres..."
      emptyMessage="No genres available"
      allowExclude={true}
      searchable={true}
      size="md"
      variant="premium"
      className={className}
      data-testid="genre-chip-group"
    />
  );
};

export default ChipGroup;