/**
 * Utility functions for TMDB Discover API
 * Provides unified parameter generation for movies and TV shows with comprehensive filter support
 */

export type MovieCategory =
  | "upcoming"
  | "now_playing"
  | "popular"
  | "trending"
  | "top_rated";
export type TVCategory =
  | "airing_today"
  | "on_the_air"
  | "popular"
  | "trending"
  | "top_rated";

/**
 * Comprehensive movie discover parameters matching TMDB API
 */
export interface MovieDiscoverParams {
  // Pagination & Sorting
  page?: number;
  sort_by?: string;

  // Date Filters
  "primary_release_date.gte"?: string;
  "primary_release_date.lte"?: string;
  "release_date.gte"?: string;
  "release_date.lte"?: string;
  primary_release_year?: number;
  year?: number;

  // Rating & Votes
  "vote_average.gte"?: number;
  "vote_average.lte"?: number;
  "vote_count.gte"?: number;
  "vote_count.lte"?: number;

  // Genre & Keywords
  with_genres?: string;
  without_genres?: string;
  with_keywords?: string;
  without_keywords?: string;

  // People (Cast & Crew)
  with_cast?: string;
  with_crew?: string;
  with_people?: string;

  // Production
  with_companies?: string;

  // Runtime
  "with_runtime.gte"?: number;
  "with_runtime.lte"?: number;

  // Language & Region
  language?: string;
  with_original_language?: string;
  region?: string;
  watch_region?: string;

  // Streaming Providers
  with_watch_providers?: string;
  with_watch_monetization_types?: string;

  // Content Filters
  include_adult?: boolean;
  include_video?: boolean;

  // Release Type & Certification
  with_release_type?: string;
  certification?: string;
  "certification.gte"?: string;
  "certification.lte"?: string;
  certification_country?: string;

  [key: string]: any;
}

/**
 * Comprehensive TV discover parameters matching TMDB API
 */
export interface TVDiscoverParams {
  // Pagination & Sorting
  page?: number;
  sort_by?: string;

  // Date Filters
  "first_air_date.gte"?: string;
  "first_air_date.lte"?: string;
  "air_date.gte"?: string;
  "air_date.lte"?: string;
  first_air_date_year?: number;
  timezone?: string;

  // Rating & Votes
  "vote_average.gte"?: number;
  "vote_average.lte"?: number;
  "vote_count.gte"?: number;
  "vote_count.lte"?: number;

  // Genre & Keywords
  with_genres?: string;
  without_genres?: string;
  with_keywords?: string;
  without_keywords?: string;

  // Networks & Production
  with_networks?: string;
  with_companies?: string;

  // Runtime
  "with_runtime.gte"?: number;
  "with_runtime.lte"?: number;

  // Language & Region
  language?: string;
  with_original_language?: string;
  watch_region?: string;

  // Streaming Providers
  with_watch_providers?: string;
  with_watch_monetization_types?: string;

  // Content Filters
  include_adult?: boolean;
  include_null_first_air_dates?: boolean;
  screened_theatrically?: boolean;

  // TV-Specific
  with_status?: string;
  with_type?: string;

  [key: string]: any;
}

// Union type for convenience
export type DiscoverParams = MovieDiscoverParams | TVDiscoverParams;

/**
 * Get current date in YYYY-MM-DD format
 */
function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Get date N days from today in YYYY-MM-DD format
 */
function getDateOffset(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

/**
 * Get date for one year ago in YYYY-MM-DD format
 */
function getOneYearAgo(): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 1);
  return date.toISOString().split("T")[0];
}

/**
 * Remove null and undefined values from an object
 */
function cleanFilters(filters: Record<string, any>): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value !== null && value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

/**
 * Transform filter parameter names for TMDB API compatibility
 */
function transformMovieFilters(filters: Record<string, any>): Record<string, any> {
  const transformed: Record<string, any> = { ...filters };
  
  // Transform parameter names
  if (filters.genres !== undefined && filters.genres !== null) {
    transformed.with_genres = filters.genres;
    delete transformed.genres;
  } else {
    delete transformed.genres;
  }
  
  if (filters.year !== undefined && filters.year !== null) {
    transformed.primary_release_year = filters.year;
    delete transformed.year;
  } else {
    delete transformed.year;
  }
  
  // Clean null and undefined values
  return cleanFilters(transformed);
}

/**
 * Build discover parameters for movies based on category or custom filters
 * Supports all TMDB Discover API filters for movies
 */
export function buildMovieDiscoverParams(
  category: MovieCategory,
  filters: Record<string, any> = {},
): MovieDiscoverParams {
  const today = getTodayDate();
  const tomorrow = getDateOffset(1);
  const thirtyDaysAgo = getDateOffset(-30);
  const fortyFiveDaysAgo = getDateOffset(-100);

  // Transform filter parameter names
  const transformedFilters = transformMovieFilters(filters);
  
  const page = transformedFilters.page || 1;
  
  const baseParams: MovieDiscoverParams = {
    page,
    language: "en-US",
    include_adult: false,
    include_video: false,
    ...transformedFilters,
  };

  // Category-specific defaults (can be overridden by filters)
  let categoryDefaults: Partial<MovieDiscoverParams> = {};
  
  switch (category) {
    case "upcoming":
      // Upcoming movies: released after today
      categoryDefaults = {
        "primary_release_date.gte": tomorrow,
        "primary_release_date.lte": getDateOffset(90), // Next 90 days
        sort_by: "popularity.desc",
      };
      break;

    case "now_playing":
      // Now Playing: released in the last 30 days
      categoryDefaults = {
        "primary_release_date.lte": today,
        "primary_release_date.gte": thirtyDaysAgo,
        sort_by: "primary_release_date.desc",
      };
      break;

    case "popular":
      // Popular movies: sorted by popularity with minimum votes to reduce noise
      categoryDefaults = {
        sort_by: "popularity.desc",
        "vote_count.gte": 50,
      };
      break;

    case "trending":
      // Trending: recent releases (last ~45 days) with high popularity and engagement
      categoryDefaults = {
        sort_by: "popularity.desc",
        "vote_count.gte": 50,
        "primary_release_date.gte": fortyFiveDaysAgo,
      };
      break;

    case "top_rated":
      // Top Rated: highest rated with minimum vote count
      categoryDefaults = {
        sort_by: "vote_average.desc",
        "vote_count.gte": 500,
      };
      break;
  }

  // Merge: category defaults first, then user filters override
  return {
    ...categoryDefaults,
    ...baseParams,
  };
}

/**
 * Transform filter parameter names for TV TMDB API compatibility
 */
function transformTVFilters(filters: Record<string, any>): Record<string, any> {
  const transformed: Record<string, any> = { ...filters };
  
  // Transform parameter names
  if (filters.genres !== undefined && filters.genres !== null) {
    transformed.with_genres = filters.genres;
    delete transformed.genres;
  } else {
    delete transformed.genres;
  }
  
  // Clean null and undefined values
  return cleanFilters(transformed);
}

/**
 * Build discover parameters for TV shows based on category or custom filters
 * Supports all TMDB Discover API filters for TV shows
 */
export function buildTVDiscoverParams(
  category: TVCategory,
  filters: Record<string, any> = {},
): TVDiscoverParams {
  const today = getTodayDate();
  const sevenDaysFromNow = getDateOffset(7);
  const oneYearAgo = getOneYearAgo();

  // Transform filter parameter names
  const transformedFilters = transformTVFilters(filters);
  
  const page = transformedFilters.page || 1;

  const baseParams: TVDiscoverParams = {
    page,
    language: "en-US",
    include_adult: false,
    include_null_first_air_dates: false,
    ...transformedFilters,
  };

  // Category-specific defaults (can be overridden by filters)
  let categoryDefaults: Partial<TVDiscoverParams> = {};

  switch (category) {
    case "airing_today":
      // Airing Today / On Air: currently airing shows (next 7 days)
      categoryDefaults = {
        "air_date.gte": today,
        "air_date.lte": sevenDaysFromNow,
        sort_by: "popularity.desc",
      };
      break;

    case "on_the_air":
      // On the Air: same as airing today
      categoryDefaults = {
        "air_date.gte": today,
        "air_date.lte": sevenDaysFromNow,
        sort_by: "popularity.desc",
      };
      break;

    case "popular":
      // Popular TV shows: sorted by popularity
      categoryDefaults = {
        sort_by: "popularity.desc",
      };
      break;

    case "top_rated":
      // Top Rated: highest rated with minimum vote count
      categoryDefaults = {
        sort_by: "vote_average.desc",
        "vote_count.gte": 200,
      };
      break;

    case "trending":
      // Trending: high popularity, recent shows
      categoryDefaults = {
        sort_by: "popularity.desc",
        "first_air_date.gte": oneYearAgo,
      };
      break;
  }

  // Merge: category defaults first, then user filters override
  return {
    ...categoryDefaults,
    ...baseParams,
  };
}

/**
 * Convert array values to pipe-separated OR strings for TMDB API
 * TMDB uses '|' for OR logic and ',' for AND logic
 */
export function arrayToOrString(
  arr: number[] | string[] | undefined,
): string | undefined {
  if (!arr || arr.length === 0) return undefined;
  return arr.join("|");
}

/**
 * Convert array values to comma-separated AND strings for TMDB API
 */
export function arrayToAndString(
  arr: number[] | string[] | undefined,
): string | undefined {
  if (!arr || arr.length === 0) return undefined;
  return arr.join(",");
}

/**
 * Check if category should use discover API or original trending endpoint
 * Trending still uses /trending endpoint for most accurate results
 */
export function shouldUseTrendingEndpoint(category: string): boolean {
  return category === "trending";
}
