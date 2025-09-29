import { useState, useEffect, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Search, 
  X, 
  Sparkles, 
  Brain,
  Wand2,
  Calendar,
  Star,
  MapPin,
  Film,
  Tv,
  Tag
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdvancedFilterState } from "@/types/filters";

interface DateRange {
  start?: string;
  end?: string;
}

interface RatingRange {
  min?: number;
  max?: number;
}

interface FilterChip {
  id: string;
  type: 'genre' | 'year' | 'rating' | 'provider' | 'country' | 'contentType' | 'keyword';
  label: string;
  value: string | number | number[] | DateRange | RatingRange;
  original: string;
  icon?: any;
  removable?: boolean;
}

interface NaturalLanguageSearchProps {
  onFiltersApply: (filters: Partial<AdvancedFilterState>) => void;
  placeholder?: string;
  className?: string;
}

export function NaturalLanguageSearch({ 
  onFiltersApply, 
  placeholder = "Search like: \"action movies from 2020 on Netflix rated above 7\"",
  className 
}: NaturalLanguageSearchProps) {
  const [query, setQuery] = useState("");
  const [chips, setChips] = useState<FilterChip[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Natural language parsing patterns
  const parsePatterns = useMemo(() => [
    // Content type patterns
    { 
      pattern: /\b(movies?|films?)\b/gi, 
      type: 'contentType' as const, 
      value: 'movie',
      icon: Film
    },
    { 
      pattern: /\b(tv shows?|series|television)\b/gi, 
      type: 'contentType' as const, 
      value: 'tv',
      icon: Tv
    },

    // Year patterns
    { 
      pattern: /\b(from|since|after)\s+(\d{4})\b/gi, 
      type: 'year' as const, 
      extract: (match: RegExpMatchArray) => ({ start: match[2] }),
      icon: Calendar
    },
    { 
      pattern: /\b(before|until)\s+(\d{4})\b/gi, 
      type: 'year' as const, 
      extract: (match: RegExpMatchArray) => ({ end: match[2] }),
      icon: Calendar
    },
    { 
      pattern: /\bin\s+(\d{4})\b/gi, 
      type: 'year' as const, 
      extract: (match: RegExpMatchArray) => ({ start: match[1], end: match[1] }),
      icon: Calendar
    },
    { 
      pattern: /\b(\d{4})-(\d{4})\b/gi, 
      type: 'year' as const, 
      extract: (match: RegExpMatchArray) => ({ start: match[1], end: match[2] }),
      icon: Calendar
    },

    // Rating patterns
    { 
      pattern: /\brated?\s+(above|over|more than|\>)\s*(\d+(?:\.\d+)?)\b/gi, 
      type: 'rating' as const, 
      extract: (match: RegExpMatchArray) => ({ min: parseFloat(match[2]) }),
      icon: Star
    },
    { 
      pattern: /\brated?\s+(below|under|less than|\<)\s*(\d+(?:\.\d+)?)\b/gi, 
      type: 'rating' as const, 
      extract: (match: RegExpMatchArray) => ({ max: parseFloat(match[2]) }),
      icon: Star
    },
    { 
      pattern: /\brated?\s*(\d+(?:\.\d+)?)\+\b/gi, 
      type: 'rating' as const, 
      extract: (match: RegExpMatchArray) => ({ min: parseFloat(match[1]) }),
      icon: Star
    },

    // Streaming provider patterns
    { 
      pattern: /\bon\s+(netflix)\b/gi, 
      type: 'provider' as const, 
      value: [8], // Netflix provider ID
      icon: MapPin
    },
    { 
      pattern: /\bon\s+(disney|disney\+|disney plus)\b/gi, 
      type: 'provider' as const, 
      value: [337], // Disney+ provider ID
      icon: MapPin
    },
    { 
      pattern: /\bon\s+(amazon|prime|amazon prime)\b/gi, 
      type: 'provider' as const, 
      value: [119], // Amazon Prime Video provider ID
      icon: MapPin
    },
    { 
      pattern: /\bon\s+(hbo|hbo max)\b/gi, 
      type: 'provider' as const, 
      value: [384], // HBO Max provider ID
      icon: MapPin
    },

    // Genre patterns
    { 
      pattern: /\b(action|thrillers?|comedy|comedies|drama|horror|sci-?fi|romance|documentary|documentaries|animation|crime|family|fantasy|history|music|mystery|war|western)\b/gi, 
      type: 'genre' as const, 
      extract: (match: RegExpMatchArray) => {
        const genreMap: Record<string, number> = {
          'action': 28, 'thriller': 53, 'comedy': 35, 'drama': 18,
          'horror': 27, 'sci-fi': 878, 'science fiction': 878,
          'romance': 10749, 'documentary': 99, 'animation': 16,
          'crime': 80, 'family': 10751, 'fantasy': 14,
          'history': 36, 'music': 10402, 'mystery': 9648,
          'war': 10752, 'western': 37
        };
        const genre = match[0].toLowerCase().replace(/s$/, '').replace('-', '');
        return genreMap[genre] || null;
      },
      icon: Tag
    },

    // Country patterns
    { 
      pattern: /\bin\s+(us|usa|america|united states)\b/gi, 
      type: 'country' as const, 
      value: 'US',
      icon: MapPin
    },
    { 
      pattern: /\bin\s+(uk|britain|united kingdom)\b/gi, 
      type: 'country' as const, 
      value: 'GB',
      icon: MapPin
    },
    { 
      pattern: /\bin\s+(india)\b/gi, 
      type: 'country' as const, 
      value: 'IN',
      icon: MapPin
    },
    { 
      pattern: /\bin\s+(japan)\b/gi, 
      type: 'country' as const, 
      value: 'JP',
      icon: MapPin
    },
    { 
      pattern: /\bin\s+(korea|south korea)\b/gi, 
      type: 'country' as const, 
      value: 'KR',
      icon: MapPin
    },
  ], []);

  // Sample suggestions for better UX
  const sampleQueries = [
    "action movies from 2020 on Netflix rated above 7",
    "comedy series from 2010-2023 with high ratings",
    "thriller movies on HBO rated 8+",
    "animated films from Disney rated above 6",
    "sci-fi shows since 2015 on Amazon Prime",
    "documentaries from 2020 in the US",
    "Korean drama series rated above 8",
    "horror movies before 2010 rated 7+"
  ];

  // Parse natural language query into filter chips
  const parseQuery = useCallback((inputQuery: string) => {
    if (!inputQuery.trim()) {
      setChips([]);
      return;
    }

    setIsProcessing(true);
    const newChips: FilterChip[] = [];
    let processedQuery = inputQuery;

    parsePatterns.forEach((pattern, index) => {
      const matches = Array.from(processedQuery.matchAll(pattern.pattern));
      matches.forEach((match) => {
        const chipId = `${pattern.type}-${index}-${Date.now()}-${Math.random()}`;
        let value: string | number | number[] | DateRange | RatingRange = pattern.value || '';
        let label = match[0];

        // Extract complex values
        if (pattern.extract && typeof pattern.extract === 'function') {
          const extractedValue = pattern.extract(match);
          if (extractedValue === null) return; // Skip invalid extractions
          value = extractedValue as DateRange | RatingRange | number;
        }

        // Create label based on type
        switch (pattern.type) {
          case 'year':
            const yearValue = value as DateRange;
            if (yearValue.start && yearValue.end && yearValue.start === yearValue.end) {
              label = `Year: ${yearValue.start}`;
            } else if (yearValue.start && yearValue.end) {
              label = `Years: ${yearValue.start}-${yearValue.end}`;
            } else if (yearValue.start) {
              label = `Since: ${yearValue.start}`;
            } else if (yearValue.end) {
              label = `Until: ${yearValue.end}`;
            }
            break;
          case 'rating':
            const ratingValue = value as RatingRange;
            if (ratingValue.min && ratingValue.max) {
              label = `Rating: ${ratingValue.min}-${ratingValue.max}`;
            } else if (ratingValue.min) {
              label = `Rating: ${ratingValue.min}+`;
            } else if (ratingValue.max) {
              label = `Rating: <${ratingValue.max}`;
            }
            break;
          case 'provider':
            label = `On: ${match[1]}`;
            break;
          case 'contentType':
            label = value === 'movie' ? 'Movies' : 'TV Shows';
            break;
          case 'genre':
            label = `Genre: ${match[0]}`;
            break;
          case 'country':
            label = `Region: ${match[1]}`;
            break;
        }

        newChips.push({
          id: chipId,
          type: pattern.type,
          label,
          value,
          original: match[0],
          icon: pattern.icon,
          removable: true
        });

        // Remove processed text to avoid duplicate matches
        processedQuery = processedQuery.replace(match[0], '');
      });
    });

    setChips(newChips);
    setIsProcessing(false);
  }, [parsePatterns]);

  // Debounced parsing
  useEffect(() => {
    const timer = setTimeout(() => {
      parseQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, parseQuery]);

  // Apply filters to parent component
  const applyFilters = useCallback(() => {
    const filters: Partial<AdvancedFilterState> = {};

    chips.forEach(chip => {
      switch (chip.type) {
        case 'contentType':
          if (typeof chip.value === 'string') {
            filters.contentType = chip.value as 'movie' | 'tv';
          }
          break;
        case 'year':
          const yearValue = chip.value as DateRange;
          if (filters.contentType === 'tv') {
            filters.first_air_date = { 
              ...filters.first_air_date, 
              ...(yearValue.start && { start: yearValue.start }),
              ...(yearValue.end && { end: yearValue.end })
            };
          } else {
            filters.primary_release_date = { 
              ...filters.primary_release_date, 
              ...(yearValue.start && { start: yearValue.start }),
              ...(yearValue.end && { end: yearValue.end })
            };
          }
          break;
        case 'rating':
          const ratingValue = chip.value as RatingRange;
          filters.vote_average = { 
            ...filters.vote_average, 
            ...(ratingValue.min && { min: ratingValue.min }),
            ...(ratingValue.max && { max: ratingValue.max })
          };
          break;
        case 'provider':
          if (Array.isArray(chip.value)) {
            filters.with_watch_providers = [...(filters.with_watch_providers || []), ...chip.value];
          }
          break;
        case 'genre':
          if (typeof chip.value === 'number') {
            filters.with_genres = [...(filters.with_genres || []), chip.value];
          }
          break;
        case 'country':
          if (typeof chip.value === 'string') {
            filters.watch_region = chip.value;
          }
          break;
      }
    });

    onFiltersApply(filters);
  }, [chips, onFiltersApply]);

  // Remove chip
  const removeChip = (chipId: string) => {
    setChips(prev => prev.filter(chip => chip.id !== chipId));
  };

  // Clear all chips
  const clearAll = () => {
    setChips([]);
    setQuery("");
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className={cn(
              "pl-10 pr-12 h-12",
              "glassmorphism-input",
              "text-base placeholder:text-muted-foreground/70",
              "border-2 border-transparent",
              "focus-visible:border-primary/50",
              "transition-all duration-300"
            )}
            data-testid="natural-language-search"
          />
          {isProcessing && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Brain className="h-4 w-4 text-primary animate-pulse" />
            </div>
          )}
        </div>

        {/* Sample Suggestions */}
        {!query && (
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="text-xs text-muted-foreground">Try:</span>
            {sampleQueries.slice(0, 3).map((suggestion, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                onClick={() => setQuery(suggestion)}
                className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
                data-testid={`suggestion-${index}`}
              >
                "{suggestion}"
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Filter Chips */}
      {chips.length > 0 && (
        <Card className="p-4 glassmorphism-card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Detected Filters</span>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={applyFilters}
                size="sm"
                className="glassmorphism-button border-primary/30"
                data-testid="apply-filters"
              >
                <Wand2 className="h-3 w-3 mr-1" />
                Apply
              </Button>
              <Button
                onClick={clearAll}
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                data-testid="clear-all-chips"
              >
                Clear
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {chips.map((chip) => {
              const IconComponent = chip.icon || Tag;
              return (
                <Badge
                  key={chip.id}
                  variant="secondary"
                  className={cn(
                    "glassmorphism-chip",
                    "flex items-center gap-1.5 py-1.5 px-3",
                    "transition-all duration-200",
                    "hover:scale-105 hover:shadow-glow",
                    "border border-border/50"
                  )}
                  data-testid={`filter-chip-${chip.type}`}
                >
                  <IconComponent className="h-3 w-3" />
                  <span className="text-xs font-medium">{chip.label}</span>
                  {chip.removable && (
                    <button
                      onClick={() => removeChip(chip.id)}
                      className="ml-1 hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                      data-testid={`remove-chip-${chip.id}`}
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  )}
                </Badge>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}