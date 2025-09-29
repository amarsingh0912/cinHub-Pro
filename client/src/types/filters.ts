/**
 * Advanced Responsive Filter Types for Movies & TV Catalogue
 * TMDB-native filter facets mapped to /discover/movie and /discover/tv
 */

// Base content types
export type ContentType = 'movie' | 'tv';
export type MediaType = ContentType; // Alias for compatibility

// Sort options mapped to TMDB sort_by parameter - Complete TMDB API coverage
export type SortOption = 
  // General sorting (available for both movies and TV)
  | 'popularity.desc' | 'popularity.asc'
  | 'vote_average.desc' | 'vote_average.asc'
  | 'vote_count.desc' | 'vote_count.asc'
  // Title/Name sorting
  | 'original_title.asc' | 'original_title.desc'  // Movies
  | 'name.asc' | 'name.desc'                      // TV Shows
  // Movie-specific sorting
  | 'primary_release_date.desc' | 'primary_release_date.asc'
  | 'release_date.desc' | 'release_date.asc'      // Alternative date format
  | 'revenue.desc' | 'revenue.asc'
  // TV-specific sorting
  | 'first_air_date.desc' | 'first_air_date.asc'
  | 'air_date.desc' | 'air_date.asc';

// Genre structure from TMDB
export interface Genre {
  id: number;
  name: string;
}

// Keyword/Mood structure from TMDB
export interface Keyword {
  id: number;
  name: string;
}

// Person structure from TMDB (for cast/crew filtering)
export interface Person {
  id: number;
  name: string;
  profile_path?: string | null;
  known_for_department?: string;
  popularity?: number;
}

// Company structure from TMDB
export interface Company {
  id: number;
  name: string;
  logo_path?: string | null;
  origin_country?: string;
}

// Network structure from TMDB (TV-specific)
export interface Network {
  id: number;
  name: string;
  logo_path?: string | null;
  origin_country?: string;
}

// Streaming provider structure from TMDB
export interface WatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
  display_priority: number;
}

// Language structure
export interface Language {
  iso_639_1: string;
  english_name: string;
  name: string;
}

// Country/Region structure
export interface Country {
  iso_3166_1: string;
  english_name: string;
  native_name?: string;
}

// Certification structure
export interface Certification {
  certification: string;
  meaning: string;
  order: number;
}

// Watch monetization types
export type WatchMonetizationType = 'flatrate' | 'free' | 'ads' | 'rent' | 'buy';

// Date range for filtering
export interface DateRange {
  start?: string; // YYYY-MM-DD format
  end?: string;   // YYYY-MM-DD format
}

// Numeric range for ratings, runtime, etc.
export interface NumericRange {
  min?: number;
  max?: number;
}

// Quick filter chip presets
export interface QuickFilterChip {
  id: string;
  label: string;
  icon?: string;
  filters: Partial<AdvancedFilterState>;
  description?: string;
}

// Complete filter state structure
export interface AdvancedFilterState {
  // Core filtering
  contentType: ContentType;
  
  // Content discovery category (trending, popular, etc.)
  category?: string;
  
  // Multi-select filters
  with_genres: number[];           // Genre IDs to include
  without_genres: number[];        // Genre IDs to exclude
  with_keywords: number[];         // Keyword IDs to include
  without_keywords: number[];      // Keyword IDs to exclude
  
  // Date filters
  primary_release_date: DateRange; // Movies
  first_air_date: DateRange;       // TV Shows
  
  // Numeric filters
  with_runtime: NumericRange;      // Runtime in minutes
  vote_average: NumericRange;      // Rating 0-10
  vote_count: NumericRange;        // Minimum vote count
  
  // Language & Region
  with_original_language?: string; // Language ISO code
  region?: string;                 // Country ISO code for releases
  watch_region?: string;           // Country ISO code for streaming
  
  // Streaming & Monetization
  with_watch_providers: number[];     // Streaming provider IDs
  with_watch_monetization_types: WatchMonetizationType[];
  
  // People (cast/crew)
  with_people: number[];           // Person IDs
  
  // Production
  with_companies: number[];        // Production company IDs (movies & TV)
  with_networks: number[];         // TV network IDs (TV only)
  
  // Content filtering
  include_adult?: boolean;         // Include adult content
  certification_country?: string;  // Country for certification ratings
  certification?: string;         // Certification rating
  
  // Sorting & Search
  sort_by: SortOption;
  
  // Search integration
  search_query?: string;           // Global search term
  search_type?: 'multi' | 'movie' | 'tv' | 'person';
  
  // Pagination
  page?: number;
  
  // UI state (not sent to API)
  ui?: {
    showAdvancedFilters: boolean;
    collapsedSections: string[];
    recentFilters: string[];
  };
}

// Filter options and data structures
export interface FilterOptions {
  movieGenres: Genre[];
  tvGenres: Genre[];
  languages: Language[];
  countries: Country[];
  movieCertifications: Record<string, Certification[]>;
  tvCertifications: Record<string, Certification[]>;
  watchProviders: Record<string, WatchProvider[]>; // by region
  quickFilters: QuickFilterChip[];
}

// API filter parameters (what gets sent to backend) - Complete TMDB API mapping
export interface TMDBFilterParams {
  // Core
  api_key: string;
  page?: number;
  
  // Content filtering
  with_genres?: string;        // Comma-separated genre IDs
  without_genres?: string;     // Comma-separated genre IDs
  with_keywords?: string;      // Comma-separated keyword IDs
  without_keywords?: string;   // Comma-separated keyword IDs
  
  // Date ranges - Complete coverage
  'primary_release_date.gte'?: string;  // Movies
  'primary_release_date.lte'?: string;  // Movies
  'release_date.gte'?: string;          // Movies alternative
  'release_date.lte'?: string;          // Movies alternative
  'first_air_date.gte'?: string;        // TV
  'first_air_date.lte'?: string;        // TV
  'air_date.gte'?: string;              // TV alternative
  'air_date.lte'?: string;              // TV alternative
  
  // Numeric ranges - Symmetric coverage
  'with_runtime.gte'?: string;
  'with_runtime.lte'?: string;
  'vote_average.gte'?: string;
  'vote_average.lte'?: string;
  'vote_count.gte'?: string;            // Minimum votes
  'vote_count.lte'?: string;            // Maximum votes - CRITICAL FIX
  
  // Language & Region
  with_original_language?: string;
  region?: string;
  watch_region?: string;
  
  // Streaming
  with_watch_providers?: string;  // Comma-separated provider IDs
  with_watch_monetization_types?: string; // Pipe-separated types
  
  // People & Production
  with_people?: string;          // Comma-separated person IDs
  with_companies?: string;       // Comma-separated company IDs
  with_networks?: string;        // Comma-separated network IDs
  
  // Content
  include_adult?: string;        // "true" or "false"
  certification_country?: string;
  certification?: string;
  
  // Sorting - All TMDB supported options
  sort_by?: string;
}

// Filter validation errors
export interface FilterValidationError {
  field: keyof AdvancedFilterState;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

// Filter change event
export interface FilterChangeEvent {
  field: keyof AdvancedFilterState;
  value: any;
  previousValue: any;
  timestamp: Date;
}

// Filter preset for saving/loading user preferences
export interface FilterPreset {
  id: string;
  name: string;
  description?: string;
  filters: AdvancedFilterState;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
  usage_count: number;
}

// URL query parameters structure for deep links - Complete symmetric coverage
export interface FilterQueryParams extends Record<string, string | string[] | undefined> {
  type?: string;                    // movie | tv
  category?: string;               // discover, trending, etc.
  with_genres?: string;            // comma-separated IDs
  without_genres?: string;
  with_keywords?: string;
  without_keywords?: string;
  'primary_release_date.gte'?: string;
  'primary_release_date.lte'?: string;
  'first_air_date.gte'?: string;
  'first_air_date.lte'?: string;
  'release_date.gte'?: string;     // Alternative date format
  'release_date.lte'?: string;
  'air_date.gte'?: string;         // Alternative TV date format
  'air_date.lte'?: string;
  'with_runtime.gte'?: string;
  'with_runtime.lte'?: string;
  'vote_average.gte'?: string;
  'vote_average.lte'?: string;
  'vote_count.gte'?: string;       // Minimum votes
  'vote_count.lte'?: string;       // Maximum votes - CRITICAL FIX
  with_original_language?: string;
  region?: string;
  watch_region?: string;
  with_watch_providers?: string;
  with_watch_monetization_types?: string;
  with_people?: string;
  with_companies?: string;
  with_networks?: string;
  include_adult?: string;
  certification_country?: string;
  certification?: string;
  sort_by?: string;
  page?: string;
  q?: string;                      // search query
}

// Default filter states
export const DEFAULT_MOVIE_FILTERS: AdvancedFilterState = {
  contentType: 'movie',
  category: 'discover',
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
  sort_by: 'popularity.desc',
  ui: {
    showAdvancedFilters: false,
    collapsedSections: [],
    recentFilters: []
  }
};

export const DEFAULT_TV_FILTERS: AdvancedFilterState = {
  ...DEFAULT_MOVIE_FILTERS,
  contentType: 'tv',
  sort_by: 'popularity.desc'
};

// Quick filter presets
export const QUICK_FILTER_PRESETS: QuickFilterChip[] = [
  {
    id: 'this-year',
    label: 'This Year',
    icon: 'Calendar',
    filters: {
      primary_release_date: {
        start: new Date().getFullYear() + '-01-01',
        end: new Date().getFullYear() + '-12-31'
      },
      first_air_date: {
        start: new Date().getFullYear() + '-01-01', 
        end: new Date().getFullYear() + '-12-31'
      }
    },
    description: 'Released this year'
  },
  {
    id: '2010s',
    label: '2010s',
    icon: 'Calendar',
    filters: {
      primary_release_date: { start: '2010-01-01', end: '2019-12-31' },
      first_air_date: { start: '2010-01-01', end: '2019-12-31' }
    },
    description: 'From the 2010s decade'
  },
  {
    id: 'highly-rated',
    label: 'Highly Rated',
    icon: 'Star',
    filters: {
      vote_average: { min: 7.5 },
      vote_count: { min: 100 }
    },
    description: '7.5+ rating with 100+ votes'
  },
  {
    id: 'netflix',
    label: 'Netflix',
    icon: 'Monitor',
    filters: {
      with_watch_providers: [8], // Netflix provider ID
      watch_region: 'US'
    },
    description: 'Available on Netflix'
  },
  {
    id: 'free-to-watch',
    label: 'Free',
    icon: 'DollarSign',
    filters: {
      with_watch_monetization_types: ['free', 'ads']
    },
    description: 'Free to watch'
  }
];

// Filter categories for UI organization
export interface FilterCategory {
  id: string;
  label: string;
  icon: string;
  description: string;
  fields: (keyof AdvancedFilterState)[];
  collapsible: boolean;
  defaultOpen: boolean;
}

export const FILTER_CATEGORIES: FilterCategory[] = [
  {
    id: 'content',
    label: 'Content Type',
    icon: 'Film',
    description: 'Movies or TV Shows',
    fields: ['contentType', 'category'],
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
    icon: 'Monitor',
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
    fields: ['with_keywords', 'without_keywords', 'with_original_language', 'with_people', 'with_companies', 'with_networks', 'certification'],
    collapsible: true,
    defaultOpen: false
  }
];

// Hook return types
export interface UseAdvancedFiltersReturn {
  filters: AdvancedFilterState;
  setFilters: (filters: AdvancedFilterState | ((prev: AdvancedFilterState) => AdvancedFilterState)) => void;
  updateFilter: <K extends keyof AdvancedFilterState>(key: K, value: AdvancedFilterState[K]) => void;
  resetFilters: () => void;
  clearFilter: (key: keyof AdvancedFilterState) => void;
  hasActiveFilters: boolean;
  activeFilterCount: number;
  validationErrors: FilterValidationError[];
  isValid: boolean;
}

export interface UseFilterURLSyncReturn {
  syncToURL: (filters: AdvancedFilterState) => void;
  syncFromURL: () => AdvancedFilterState;
  urlParams: FilterQueryParams;
  updateURL: (params: Partial<FilterQueryParams>) => void;
}

export interface UseDebouncedFiltersReturn {
  debouncedFilters: AdvancedFilterState;
  isDebouncing: boolean;
  cancelDebounce: () => void;
  flushDebounce: () => void;
}