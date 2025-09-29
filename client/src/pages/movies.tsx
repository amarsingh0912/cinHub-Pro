import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useInfiniteMovies } from "@/hooks/use-infinite-movies";
import type { MovieResponse, TVResponse } from "@/types/movie";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MovieGrid from "@/components/movie/movie-grid";
import MovieCardSkeleton from "@/components/movie/movie-card-skeleton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Loader2, Filter, X, ChevronDown, ChevronUp, Film, Settings, Palette, Star, Globe, Calendar, Shield, Eye } from "lucide-react";
import { Link } from "wouter";

// Movie genres
const MOVIE_GENRES = [
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 14, name: "Fantasy" },
  { id: 36, name: "History" },
  { id: 27, name: "Horror" },
  { id: 10402, name: "Music" },
  { id: 9648, name: "Mystery" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Science Fiction" },
  { id: 53, name: "Thriller" },
  { id: 10752, name: "War" },
  { id: 37, name: "Western" }
];

// TV show genres
const TV_GENRES = [
  { id: 10759, name: "Action & Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 10762, name: "Kids" },
  { id: 9648, name: "Mystery" },
  { id: 10763, name: "News" },
  { id: 10764, name: "Reality" },
  { id: 10765, name: "Sci-Fi & Fantasy" },
  { id: 10766, name: "Soap" },
  { id: 10767, name: "Talk" },
  { id: 10768, name: "War & Politics" },
  { id: 37, name: "Western" }
];

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "zh", name: "Chinese" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "hi", name: "Hindi" },
  { code: "ar", name: "Arabic" }
];

// Content categories for movies
const MOVIE_CATEGORIES = [
  { value: "discover", name: "Discover" },
  { value: "trending", name: "Trending" },
  { value: "popular", name: "Popular" },
  { value: "upcoming", name: "Upcoming" },
  { value: "now_playing", name: "Now in Theaters" }
];

// Content categories for TV shows
const TV_CATEGORIES = [
  { value: "discover", name: "Discover" },
  { value: "trending", name: "Trending" },
  { value: "popular", name: "Popular" },
  { value: "airing_today", name: "Airing Today" },
  { value: "on_the_air", name: "On The Air" }
];

// Certificate/Rating options
const CERTIFICATES = [
  { value: "G", name: "G - General Audiences" },
  { value: "PG", name: "PG - Parental Guidance" },
  { value: "PG-13", name: "PG-13 - Parents Strongly Cautioned" },
  { value: "R", name: "R - Restricted" },
  { value: "NC-17", name: "NC-17 - Adults Only" }
];

type ContentType = 'movies' | 'tv';
type MovieCategory = 'discover' | 'trending' | 'popular' | 'upcoming' | 'now_playing';
type TVCategory = 'discover' | 'trending' | 'popular' | 'airing_today' | 'on_the_air';

interface ContentFilters {
  contentType: ContentType;
  category: MovieCategory | TVCategory;
  sortBy: string;
  genres: number[];
  releaseYear: string;
  minRating: number;
  maxRating: number;
  language: string;
  certificate: string;
  status: string;
  includeAdult: boolean;
}

export default function Movies() {
  const [location] = useLocation();
  const searchString = useSearch(); // This gives us the query string without the ?
  // Remove currentPage state as it's handled by infinite query
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  
  // Parse URL parameters to set initial filters
  const getInitialFilters = () => {
    // Use wouter's useSearch hook to get query parameters
    const searchParams = new URLSearchParams(searchString);
    
    const categoryParam = searchParams.get('category');
    const contentTypeParam = searchParams.get('contentType');
    
    // Validate category parameter
    const validMovieCategories = ['discover', 'trending', 'popular', 'upcoming', 'now_playing'];
    const validTVCategories = ['discover', 'trending', 'popular', 'airing_today', 'on_the_air'];
    const contentType = (contentTypeParam === 'tv') ? 'tv' : 'movies';
    const validCategories = contentType === 'movies' ? validMovieCategories : validTVCategories;
    const category = (categoryParam && validCategories.includes(categoryParam)) ? categoryParam : 'discover';
    
    return {
      contentType: contentType as ContentType,
      category: category as MovieCategory | TVCategory,
      sortBy: 'popularity.desc',
      genres: [],
      releaseYear: '',
      minRating: 0,
      maxRating: 10,
      language: 'all',
      certificate: 'all',
      status: 'all',
      includeAdult: false
    };
  };
  
  const [filters, setFilters] = useState<ContentFilters>(getInitialFilters);
  
  // Update filters when URL changes
  useEffect(() => {
    const newFilters = getInitialFilters();
    setFilters(newFilters);
  }, [location, searchString]);
  
  // Get available categories based on content type
  const getAvailableCategories = () => {
    return filters.contentType === 'movies' ? MOVIE_CATEGORIES : TV_CATEGORIES;
  };
  
  // Get available genres based on content type
  const getAvailableGenres = () => {
    return filters.contentType === 'movies' ? MOVIE_GENRES : TV_GENRES;
  };
  
  // Get available sort options based on content type
  const getSortOptions = () => {
    if (filters.contentType === 'movies') {
      return [
        { value: 'popularity.desc', name: 'Most Popular' },
        { value: 'popularity.asc', name: 'Least Popular' },
        { value: 'vote_average.desc', name: 'Highest Rated' },
        { value: 'vote_average.asc', name: 'Lowest Rated' },
        { value: 'primary_release_date.desc', name: 'Newest' },
        { value: 'primary_release_date.asc', name: 'Oldest' },
        { value: 'revenue.desc', name: 'Highest Revenue' },
        { value: 'vote_count.desc', name: 'Most Voted' }
      ];
    } else {
      return [
        { value: 'popularity.desc', name: 'Most Popular' },
        { value: 'popularity.asc', name: 'Least Popular' },
        { value: 'vote_average.desc', name: 'Highest Rated' },
        { value: 'vote_average.asc', name: 'Lowest Rated' },
        { value: 'first_air_date.desc', name: 'Newest' },
        { value: 'first_air_date.asc', name: 'Oldest' },
        { value: 'vote_count.desc', name: 'Most Voted' }
      ];
    }
  };
  
  // Handle content type change - reset category and genres if invalid for new type
  const handleContentTypeChange = (newContentType: ContentType) => {
    const newCategories = newContentType === 'movies' ? MOVIE_CATEGORIES : TV_CATEGORIES;
    const isValidCategory = newCategories.some(cat => cat.value === filters.category);
    
    setFilters(prev => ({
      ...prev,
      contentType: newContentType,
      category: isValidCategory ? prev.category : 'discover',
      genres: [], // Clear genres as they differ between movies and TV
      sortBy: 'popularity.desc', // Reset sort to safe default
      certificate: newContentType === 'tv' ? 'all' : prev.certificate // Clear certificate for TV
    }));
  };


  // Create API endpoint and query parameters based on filters
  const getApiEndpoint = () => {
    const { contentType, category } = filters;
    
    // For specific categories, use dedicated endpoints
    if (category === 'trending') {
      return contentType === 'movies' ? '/api/movies/trending' : '/api/tv/trending';
    }
    if (category === 'popular') {
      return contentType === 'movies' ? '/api/movies/popular' : '/api/tv/popular';
    }
    if (category === 'upcoming') {
      return '/api/movies/upcoming';
    }
    if (category === 'now_playing') {
      return '/api/movies/now_playing';
    }
    if (category === 'airing_today') {
      return '/api/tv/airing_today';
    }
    if (category === 'on_the_air') {
      return '/api/tv/on-the-air';
    }
    
    // For discover, use discover endpoint
    return contentType === 'movies' ? '/api/movies/discover' : '/api/tv/discover';
  };
  
  const createQueryParams = () => {
    const params: Record<string, any> = {};
    
    // Only add filters for discover endpoint
    if (filters.category === 'discover') {
      params.sort_by = filters.sortBy;
      
      if (filters.genres.length > 0) {
        params.with_genres = filters.genres.join(',');
      }
      if (filters.releaseYear) {
        if (filters.contentType === 'movies') {
          params.primary_release_year = filters.releaseYear;
        } else {
          params.first_air_date_year = filters.releaseYear;
        }
      }
      if (filters.minRating > 0) {
        params['vote_average.gte'] = filters.minRating;
      }
      if (filters.maxRating < 10) {
        params['vote_average.lte'] = filters.maxRating;
      }
      if (filters.language && filters.language !== 'all') {
        params.with_original_language = filters.language;
      }
      if (filters.certificate && filters.certificate !== 'all') {
        params.certification_country = 'US';
        params['certification.lte'] = filters.certificate;
      }
      if (filters.status && filters.status !== 'all') {
        // Map our status filter to TMDB's release date filters
        if (filters.status === 'released') {
          if (filters.contentType === 'movies') {
            params['primary_release_date.lte'] = new Date().toISOString().split('T')[0];
          } else {
            params['first_air_date.lte'] = new Date().toISOString().split('T')[0];
          }
        } else if (filters.status === 'upcoming') {
          if (filters.contentType === 'movies') {
            params['primary_release_date.gte'] = new Date().toISOString().split('T')[0];
          } else {
            params['first_air_date.gte'] = new Date().toISOString().split('T')[0];
          }
        }
      }
      
    }
    
    // Include adult content filter for all categories (not just discover)
    params.include_adult = filters.includeAdult;

    return params;
  };

  const {
    data: movies,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    triggerRef
  } = useInfiniteMovies({
    queryKey: [getApiEndpoint(), createQueryParams(), filters.contentType],
    enabled: true,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Filters are automatically handled by the infinite query

  const handleGenreToggle = (genreId: number) => {
    setFilters(prev => ({
      ...prev,
      genres: prev.genres.includes(genreId)
        ? prev.genres.filter(id => id !== genreId)
        : [...prev.genres, genreId]
    }));
  };

  const clearAllFilters = () => {
    setFilters(prev => ({
      ...prev,
      category: 'discover' as MovieCategory | TVCategory,
      sortBy: 'popularity.desc',
      genres: [],
      releaseYear: '',
      minRating: 0,
      maxRating: 10,
      language: 'all',
      certificate: prev.contentType === 'movies' ? 'all' : 'all',
      status: 'all',
      includeAdult: false
    }));
  };

  const hasActiveFilters = filters.genres.length > 0 || filters.releaseYear || 
    filters.minRating > 0 || filters.maxRating < 10 || 
    (filters.language && filters.language !== 'all') || 
    (filters.certificate && filters.certificate !== 'all') ||
    (filters.status && filters.status !== 'all') ||
    filters.category !== 'discover' || filters.includeAdult;

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="movies-page">
      <Header />
      
      <main className="pt-16">
        {/* Page Header */}
        <section className="py-12 border-b border-border" data-testid="movies-header">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-4xl font-display font-bold mb-2" data-testid="content-title">
                    {filters.contentType === 'movies' ? 
                      (filters.category === 'discover' ? 'Discover Movies' :
                       filters.category === 'trending' ? 'Trending Movies' :
                       filters.category === 'popular' ? 'Popular Movies' :
                       filters.category === 'upcoming' ? 'Upcoming Movies' :
                       filters.category === 'now_playing' ? 'Now in Theaters' : 'Movies') :
                      (filters.category === 'discover' ? 'Discover TV Shows' :
                       filters.category === 'trending' ? 'Trending TV Shows' :
                       filters.category === 'popular' ? 'Popular TV Shows' : 'TV Shows')
                    }
                  </h1>
                  <p className="text-xl text-muted-foreground" data-testid="content-description">
                    Browse through thousands of {filters.contentType === 'movies' ? 'movies' : 'TV shows'} {filters.category !== 'discover' ? `- ${getAvailableCategories().find(c => c.value === filters.category)?.name}` : 'with advanced filtering'}
                  </p>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <Button
                      variant={hasActiveFilters ? "default" : "outline"}
                      onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                      className={`relative flex items-center gap-3 min-w-[140px] px-6 py-3 h-12 font-semibold transition-all duration-500 transform group-hover:scale-[1.02] ${
                        hasActiveFilters 
                          ? 'bg-gradient-to-r from-primary via-primary/90 to-primary/80 hover:from-primary/95 hover:via-primary/85 hover:to-primary/75 shadow-2xl shadow-primary/25 border-2 border-primary/20' 
                          : 'hover:bg-gradient-to-r hover:from-accent/10 hover:to-accent/5 border-2 hover:border-primary/60 hover:shadow-xl hover:shadow-primary/10'
                      }`}
                      data-testid="toggle-filters"
                    >
                      <div className="relative">
                        <div className={`transition-all duration-500 ${isFiltersOpen ? 'rotate-180 scale-110' : 'rotate-0'}`}>
                          <Filter className="w-5 h-5" />
                        </div>
                        {hasActiveFilters && (
                          <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-gradient-to-r from-red-500 to-red-600 rounded-full animate-pulse shadow-lg shadow-red-500/50 border-2 border-white"></div>
                        )}
                      </div>
                      <span className="tracking-wide">Filters</span>
                      {hasActiveFilters && (
                        <Badge variant="secondary" className="ml-1 bg-white/25 text-white border-0 text-xs px-2.5 py-1 font-bold tracking-wider shadow-lg animate-bounce">
                          ACTIVE
                        </Badge>
                      )}
                      <div className={`transition-all duration-500 ${isFiltersOpen ? 'rotate-180 scale-110' : 'rotate-0'}`}>
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </Button>
                    {/* Tooltip-like indicator */}
                    {hasActiveFilters && (
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-2 h-1 bg-primary rounded-full animate-pulse"></div>
                    )}
                  </div>
                  
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <Select 
                      value={filters.sortBy} 
                      onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}
                    >
                      <SelectTrigger className="relative w-60 h-12 border-2 transition-all duration-300 hover:border-primary/60 focus:border-primary/80 bg-card/70 backdrop-blur-md shadow-lg hover:shadow-xl hover:shadow-primary/10" data-testid="sort-select">
                        <Settings className="w-4 h-4 mr-2 text-muted-foreground" />
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent className="bg-card/95 backdrop-blur-xl border-2 shadow-2xl animate-in slide-in-from-top-2 duration-300">
                        {getSortOptions().map((option) => (
                          <SelectItem 
                            key={option.value} 
                            value={option.value} 
                            data-testid={`sort-${option.value}`}
                            className="transition-all duration-200 hover:bg-gradient-to-r hover:from-primary/15 hover:to-primary/5 cursor-pointer py-3"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-primary/60 rounded-full"></div>
                              {option.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              {/* Comprehensive Filters Panel */}
              <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                <CollapsibleContent>
                  <Card className="w-full bg-gradient-to-br from-card/95 to-card/80 backdrop-blur-md border-2 border-border/50 shadow-2xl overflow-hidden" data-testid="filters-panel">
                    <CardHeader className="pb-3 bg-gradient-to-r from-accent/20 to-accent/10 border-b border-border/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-primary/10 rounded-lg">
                            <Film className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                              {filters.contentType === 'movies' ? 'Movie' : 'TV Show'} Filters
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              Refine your search with advanced options
                            </p>
                          </div>
                        </div>
                        {hasActiveFilters && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={clearAllFilters}
                            className="transition-all duration-200 hover:bg-destructive hover:text-destructive-foreground hover:scale-105 border-destructive/50"
                            data-testid="clear-filters"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Clear All
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      {/* Filter Sections with Visual Grouping */}
                      <div className="space-y-4">
                        {/* Content & Category Section */}
                        <div className="group relative bg-gradient-to-br from-accent/8 via-accent/5 to-accent/3 rounded-xl p-4 border border-accent/30 hover:border-accent/60 transition-all duration-500 hover:shadow-lg hover:shadow-accent/10 overflow-hidden">
                          {/* Animated background effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 transform translate-x-[-100%] group-hover:translate-x-[100%] animate-pulse"></div>
                          
                          <div className="relative z-10">
                            <h3 className="text-base font-semibold mb-3 text-foreground flex items-center gap-2 group-hover:scale-105 transition-transform duration-300">
                              <div className="relative">
                                <div className="w-2 h-2 bg-gradient-to-r from-primary to-secondary rounded-full animate-pulse shadow-lg shadow-primary/30"></div>
                                <div className="absolute inset-0 w-2 h-2 bg-gradient-to-r from-primary to-secondary rounded-full animate-ping opacity-75"></div>
                              </div>
                              <Film className="w-4 h-4 text-primary animate-pulse" />
                              <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                                Content & Category
                              </span>
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Content Type Toggle */}
                              <div className="space-y-2 group/item">
                                <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5 tracking-wide">
                                  <Settings className="w-3 h-3 text-primary/70" />
                                  Content Type
                                </Label>
                                <div className="relative">
                                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg blur opacity-0 group-hover/item:opacity-100 transition-opacity duration-300"></div>
                                  <Select 
                                    value={filters.contentType} 
                                    onValueChange={(value) => handleContentTypeChange(value as ContentType)}
                                  >
                                    <SelectTrigger className="relative h-9 border hover:border-primary/60 focus:border-primary/80 transition-all duration-300 bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-md group-hover/item:scale-[1.01]" data-testid="select-content-type">
                                      <div className="flex items-center gap-2">
                                        <Film className="w-4 h-4 text-muted-foreground" />
                                        <SelectValue placeholder="Select content type" />
                                      </div>
                                    </SelectTrigger>
                                    <SelectContent className="bg-card/95 backdrop-blur-xl border-2 shadow-2xl animate-in slide-in-from-top-2 duration-300">
                                      <SelectItem value="movies" data-testid="content-type-movies" className="hover:bg-gradient-to-r hover:from-primary/15 hover:to-primary/5 py-3 cursor-pointer">
                                        <div className="flex items-center gap-2">
                                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                          Movies
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="tv" data-testid="content-type-tv" className="hover:bg-gradient-to-r hover:from-secondary/15 hover:to-secondary/5 py-3 cursor-pointer">
                                        <div className="flex items-center gap-2">
                                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                          TV Shows
                                        </div>
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              
                              {/* Category Filter */}
                              <div className="space-y-2 group/item">
                                <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5 tracking-wide">
                                  <Palette className="w-3 h-3 text-secondary/70" />
                                  Category
                                </Label>
                                <div className="relative">
                                  <div className="absolute inset-0 bg-gradient-to-r from-secondary/10 to-primary/10 rounded-lg blur opacity-0 group-hover/item:opacity-100 transition-opacity duration-300"></div>
                                  <Select 
                                    value={filters.category} 
                                    onValueChange={(value) => setFilters(prev => ({ ...prev, category: value as MovieCategory | TVCategory }))}
                                  >
                                    <SelectTrigger className="relative h-9 border hover:border-secondary/60 focus:border-secondary/80 transition-all duration-300 bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-md group-hover/item:scale-[1.01]" data-testid="select-category">
                                      <div className="flex items-center gap-2">
                                        <Palette className="w-4 h-4 text-muted-foreground" />
                                        <SelectValue placeholder="Select category" />
                                      </div>
                                    </SelectTrigger>
                                    <SelectContent className="bg-card/95 backdrop-blur-xl border-2 shadow-2xl animate-in slide-in-from-top-2 duration-300">
                                      {getAvailableCategories().map((category) => (
                                        <SelectItem key={category.value} value={category.value} data-testid={`category-${category.value}`} className="hover:bg-gradient-to-r hover:from-secondary/15 hover:to-secondary/5 py-3 cursor-pointer">
                                          <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-gradient-to-r from-secondary to-primary rounded-full"></div>
                                            {category.name}
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Genres & Discovery Section */}
                        <div className="group relative bg-gradient-to-br from-primary/8 via-primary/5 to-primary/3 rounded-xl p-4 border border-primary/30 hover:border-primary/60 transition-all duration-500 hover:shadow-lg hover:shadow-primary/15 overflow-hidden">
                          {/* Animated sparkle effect */}
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
                            <div className="absolute top-4 right-4 w-1 h-1 bg-primary rounded-full animate-ping"></div>
                            <div className="absolute top-8 right-8 w-1 h-1 bg-secondary rounded-full animate-ping animation-delay-300"></div>
                            <div className="absolute bottom-4 left-4 w-1 h-1 bg-accent rounded-full animate-ping animation-delay-600"></div>
                          </div>
                          
                          <div className="relative z-10">
                            <h3 className="text-base font-semibold mb-3 text-foreground flex items-center gap-2 group-hover:scale-105 transition-transform duration-300">
                              <div className="relative">
                                <div className="w-2 h-2 bg-gradient-to-r from-secondary to-accent rounded-full animate-pulse shadow-lg shadow-secondary/30"></div>
                                <div className="absolute inset-0 w-2 h-2 bg-gradient-to-r from-secondary to-accent rounded-full animate-ping opacity-75"></div>
                              </div>
                              <Palette className="w-4 h-4 text-secondary animate-pulse" />
                              <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                                Genres & Discovery
                              </span>
                            </h3>
                            <div className="space-y-3">
                              {/* Genres */}
                              <div className="space-y-2 group/genres">
                                <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5 tracking-wide">
                                  <Star className="w-3 h-3 text-primary/70" />
                                  Movie Genres
                                  <span className="text-xs text-muted-foreground ml-1 px-1.5 py-0.5 bg-muted/30 rounded-full">
                                    {filters.genres.length} selected
                                  </span>
                                </Label>
                                <div className="relative">
                                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl blur opacity-0 group-hover/genres:opacity-100 transition-opacity duration-500"></div>
                                  <div className="relative flex flex-wrap gap-2 max-h-32 overflow-y-auto p-3 bg-gradient-to-br from-background/40 to-background/20 backdrop-blur-sm rounded-lg border border-border/30 hover:border-primary/40 transition-all duration-300 scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent">
                                    {getAvailableGenres().map((genre, index) => (
                                      <Badge
                                        key={genre.id}
                                        variant={filters.genres.includes(genre.id) ? "default" : "outline"}
                                        className={`cursor-pointer transition-all duration-300 transform hover:scale-105 hover:rotate-1 font-medium px-2 py-1 text-xs ${
                                          filters.genres.includes(genre.id) 
                                            ? 'bg-gradient-to-r from-primary via-primary/90 to-primary/80 text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 border-primary/20' 
                                            : 'hover:bg-gradient-to-r hover:from-primary/15 hover:to-secondary/10 hover:border-primary/60 hover:shadow-lg border-2'
                                        }`}
                                        style={{ animationDelay: `${index * 50}ms` }}
                                        onClick={() => handleGenreToggle(genre.id)}
                                        data-testid={`genre-${genre.name.toLowerCase().replace(/ /g, '-')}`}
                                      >
                                        <div className="flex items-center gap-1.5">
                                          {filters.genres.includes(genre.id) && (
                                            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                          )}
                                          {genre.name}
                                          {filters.genres.includes(genre.id) && (
                                            <X className="w-3 h-3 ml-1 hover:scale-125 transition-transform" />
                                          )}
                                        </div>
                                      </Badge>
                                    ))}
                                  </div>
                                  
                                  {/* Genre selection summary */}
                                  {filters.genres.length > 0 && (
                                    <div className="mt-2 p-2 bg-primary/10 rounded-lg border border-primary/20 animate-in slide-in-from-top-2 duration-300">
                                      <div className="flex items-center gap-2 text-xs text-primary font-medium">
                                        <Star className="w-4 h-4" />
                                        <span>
                                          {filters.genres.length === 1 ? '1 genre selected' : `${filters.genres.length} genres selected`}
                                        </span>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => setFilters(prev => ({ ...prev, genres: [] }))}
                                          className="ml-auto h-auto p-0.5 hover:bg-primary/20"
                                        >
                                          <X className="w-2.5 h-2.5" />
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Details & Ratings Section */}
                        <div className="group relative bg-gradient-to-br from-secondary/8 via-secondary/5 to-secondary/3 rounded-xl p-4 border border-secondary/30 hover:border-secondary/60 transition-all duration-500 hover:shadow-lg hover:shadow-secondary/15 overflow-hidden">
                          {/* Floating elements effect */}
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
                            <div className="absolute top-6 right-6 w-2 h-2 bg-secondary rounded-full animate-bounce animation-delay-100"></div>
                            <div className="absolute bottom-6 right-12 w-1.5 h-1.5 bg-accent rounded-full animate-bounce animation-delay-500"></div>
                            <div className="absolute top-12 left-6 w-1 h-1 bg-primary rounded-full animate-bounce animation-delay-700"></div>
                          </div>
                          
                          <div className="relative z-10">
                            <h3 className="text-base font-semibold mb-3 text-foreground flex items-center gap-2 group-hover:scale-105 transition-transform duration-300">
                              <div className="relative">
                                <div className="w-2 h-2 bg-gradient-to-r from-accent to-primary rounded-full animate-pulse shadow-lg shadow-accent/30"></div>
                                <div className="absolute inset-0 w-2 h-2 bg-gradient-to-r from-accent to-primary rounded-full animate-ping opacity-75"></div>
                              </div>
                              <Star className="w-4 h-4 text-accent animate-pulse" />
                              <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                                Details & Ratings
                              </span>
                            </h3>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                              {/* Release Year */}
                              <div className="space-y-2 group/year">
                                <Label htmlFor="release-year" className="text-xs font-semibold text-foreground flex items-center gap-1.5 tracking-wide">
                                  <Calendar className="w-3 h-3 text-secondary/70" />
                                  Release Year
                                </Label>
                                <div className="relative">
                                  <div className="absolute inset-0 bg-gradient-to-r from-secondary/10 to-accent/10 rounded-lg blur opacity-0 group-hover/year:opacity-100 transition-opacity duration-300"></div>
                                  <Input
                                    id="release-year"
                                    type="number"
                                    placeholder="e.g., 2025"
                                    min="1900"
                                    max={new Date().getFullYear() + 5}
                                    value={filters.releaseYear}
                                    onChange={(e) => setFilters(prev => ({ ...prev, releaseYear: e.target.value }))}
                                    className="relative h-9 border hover:border-secondary/60 focus:border-secondary/80 transition-all duration-300 bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-md group-hover/year:scale-[1.01] text-center font-semibold"
                                    data-testid="input-release-year"
                                  />
                                  {filters.releaseYear && (
                                    <div className="absolute -top-2 -right-2 w-4 h-4 bg-secondary rounded-full flex items-center justify-center">
                                      <div className="w-2 h-2 bg-white rounded-full"></div>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Rating Range */}
                              <div className="space-y-2 lg:col-span-2 group/rating">
                                <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5 tracking-wide">
                                  <Star className="w-3 h-3 text-accent/70" />
                                  Rating Range
                                  <span className="text-xs text-muted-foreground ml-1 px-1.5 py-0.5 bg-muted/30 rounded-full">
                                    {filters.minRating} - {filters.maxRating}
                                  </span>
                                </Label>
                                <div className="relative">
                                  <div className="absolute inset-0 bg-gradient-to-r from-accent/10 to-primary/10 rounded-xl blur opacity-0 group-hover/rating:opacity-100 transition-opacity duration-500"></div>
                                  <div className="relative space-y-3 p-3 bg-gradient-to-br from-background/50 to-background/30 backdrop-blur-sm rounded-lg border border-border/30 hover:border-accent/40 transition-all duration-300 group-hover/rating:scale-[1.01]">
                                    {/* Minimum Rating */}
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-muted-foreground">Minimum Rating</span>
                                        <div className="flex items-center gap-1">
                                          <Star className="w-2.5 h-2.5 text-yellow-500 fill-current" />
                                          <span className="text-xs font-bold text-accent">{filters.minRating}</span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-4">
                                        <div className="flex-1 relative">
                                          <Slider
                                            value={[filters.minRating]}
                                            onValueChange={([value]) => setFilters(prev => ({ ...prev, minRating: value }))}
                                            max={10}
                                            min={0}
                                            step={0.1}
                                            className="w-full"
                                            data-testid="slider-min-rating"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Maximum Rating */}
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-muted-foreground">Maximum Rating</span>
                                        <div className="flex items-center gap-1">
                                          <Star className="w-2.5 h-2.5 text-yellow-500 fill-current" />
                                          <span className="text-xs font-bold text-accent">{filters.maxRating}</span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-4">
                                        <div className="flex-1 relative">
                                          <Slider
                                            value={[filters.maxRating]}
                                            onValueChange={([value]) => setFilters(prev => ({ ...prev, maxRating: value }))}
                                            max={10}
                                            min={0}
                                            step={0.1}
                                            className="w-full"
                                            data-testid="slider-max-rating"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Rating Range Display */}
                                    <div className="flex items-center justify-center gap-2 pt-1 border-t border-border/20">
                                      <div className="px-2 py-0.5 bg-accent/10 rounded-full text-xs font-medium text-accent">
                                        {filters.minRating} ★
                                      </div>
                                      <span className="text-muted-foreground text-xs">to</span>
                                      <div className="px-2 py-0.5 bg-accent/10 rounded-full text-xs font-medium text-accent">
                                        {filters.maxRating} ★
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Advanced Options Section */}
                        <div className="group relative bg-gradient-to-br from-muted/8 via-muted/5 to-muted/3 rounded-xl p-4 border border-muted/30 hover:border-muted/60 transition-all duration-500 hover:shadow-lg hover:shadow-muted/15 overflow-hidden">
                          {/* Orbital animation effect */}
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
                            <div className="absolute top-8 right-8 w-1 h-1 bg-muted-foreground rounded-full animate-spin animation-delay-200"></div>
                            <div className="absolute bottom-8 left-8 w-1.5 h-1.5 bg-primary rounded-full animate-spin animation-delay-800"></div>
                            <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-secondary rounded-full animate-spin animation-delay-1000"></div>
                          </div>
                          
                          <div className="relative z-10">
                            <h3 className="text-base font-semibold mb-3 text-foreground flex items-center gap-2 group-hover:scale-105 transition-transform duration-300">
                              <div className="relative">
                                <div className="w-2 h-2 bg-gradient-to-r from-muted-foreground to-secondary rounded-full animate-pulse shadow-lg shadow-muted-foreground/30"></div>
                                <div className="absolute inset-0 w-2 h-2 bg-gradient-to-r from-muted-foreground to-secondary rounded-full animate-ping opacity-75"></div>
                              </div>
                              <Settings className="w-4 h-4 text-muted-foreground animate-pulse" />
                              <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                                Advanced Options
                              </span>
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                              {/* Language */}
                              <div className="space-y-2 group/lang">
                                <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5 tracking-wide">
                                  <Globe className="w-3 h-3 text-muted-foreground/70" />
                                  Original Language
                                </Label>
                                <div className="relative">
                                  <div className="absolute inset-0 bg-gradient-to-r from-muted/10 to-primary/10 rounded-lg blur opacity-0 group-hover/lang:opacity-100 transition-opacity duration-300"></div>
                                  <Select 
                                    value={filters.language} 
                                    onValueChange={(value) => setFilters(prev => ({ ...prev, language: value }))}
                                  >
                                    <SelectTrigger className="relative h-9 border hover:border-muted-foreground/60 focus:border-muted-foreground/80 transition-all duration-300 bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-md group-hover/lang:scale-[1.01]" data-testid="select-language">
                                      <div className="flex items-center gap-2">
                                        <Globe className="w-4 h-4 text-muted-foreground" />
                                        <SelectValue placeholder="Any language" />
                                      </div>
                                    </SelectTrigger>
                                    <SelectContent className="bg-card/95 backdrop-blur-xl border-2 shadow-2xl animate-in slide-in-from-top-2 duration-300">
                                      <SelectItem value="all" data-testid="language-any" className="hover:bg-gradient-to-r hover:from-muted/15 hover:to-muted/5 py-3 cursor-pointer">
                                        <div className="flex items-center gap-2">
                                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                          Any Language
                                        </div>
                                      </SelectItem>
                                      {LANGUAGES.map((lang) => (
                                        <SelectItem key={lang.code} value={lang.code} data-testid={`language-${lang.code}`} className="hover:bg-gradient-to-r hover:from-primary/15 hover:to-primary/5 py-3 cursor-pointer">
                                          <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                            {lang.name}
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              
                              {/* Certificate/Rating Filter - Movies Only */}
                              {filters.contentType === 'movies' && (
                                <div className="space-y-2 group/cert">
                                  <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5 tracking-wide">
                                    <Shield className="w-3 h-3 text-muted-foreground/70" />
                                    Certificate/Rating
                                  </Label>
                                  <div className="relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-lg blur opacity-0 group-hover/cert:opacity-100 transition-opacity duration-300"></div>
                                    <Select 
                                      value={filters.certificate} 
                                      onValueChange={(value) => setFilters(prev => ({ ...prev, certificate: value }))}
                                    >
                                      <SelectTrigger className="relative h-9 border hover:border-orange-500/60 focus:border-orange-500/80 transition-all duration-300 bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-md group-hover/cert:scale-[1.01]" data-testid="select-certificate">
                                        <div className="flex items-center gap-2">
                                          <Shield className="w-4 h-4 text-muted-foreground" />
                                          <SelectValue placeholder="Any certificate" />
                                        </div>
                                      </SelectTrigger>
                                      <SelectContent className="bg-card/95 backdrop-blur-xl border-2 shadow-2xl animate-in slide-in-from-top-2 duration-300">
                                        <SelectItem value="all" data-testid="certificate-all" className="hover:bg-gradient-to-r hover:from-gray-500/15 hover:to-gray-500/5 py-3 cursor-pointer">
                                          <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                            All Ratings
                                          </div>
                                        </SelectItem>
                                        {CERTIFICATES.map((cert) => (
                                          <SelectItem key={cert.value} value={cert.value} data-testid={`certificate-${cert.value}`} className="hover:bg-gradient-to-r hover:from-orange-500/15 hover:to-red-500/5 py-3 cursor-pointer">
                                            <div className="flex items-center gap-2">
                                              <div className="w-2 h-2 bg-gradient-to-r from-orange-400 to-red-500 rounded-full"></div>
                                              {cert.name}
                                            </div>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              )}
                              
                              {/* Release Status */}
                              <div className="space-y-2 group/status">
                                <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5 tracking-wide">
                                  <Calendar className="w-3 h-3 text-muted-foreground/70" />
                                  Release Status
                                </Label>
                                <div className="relative">
                                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-lg blur opacity-0 group-hover/status:opacity-100 transition-opacity duration-300"></div>
                                  <Select 
                                    value={filters.status} 
                                    onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                                  >
                                    <SelectTrigger className="relative h-9 border hover:border-green-500/60 focus:border-green-500/80 transition-all duration-300 bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-md group-hover/status:scale-[1.01]" data-testid="select-status">
                                      <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-muted-foreground" />
                                        <SelectValue placeholder="Any status" />
                                      </div>
                                    </SelectTrigger>
                                    <SelectContent className="bg-card/95 backdrop-blur-xl border-2 shadow-2xl animate-in slide-in-from-top-2 duration-300">
                                      <SelectItem value="all" data-testid="status-all" className="hover:bg-gradient-to-r hover:from-gray-500/15 hover:to-gray-500/5 py-3 cursor-pointer">
                                        <div className="flex items-center gap-2">
                                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                          All {filters.contentType === 'movies' ? 'Movies' : 'TV Shows'}
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="released" data-testid="status-released" className="hover:bg-gradient-to-r hover:from-green-500/15 hover:to-green-500/5 py-3 cursor-pointer">
                                        <div className="flex items-center gap-2">
                                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                          Released
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="upcoming" data-testid="status-upcoming" className="hover:bg-gradient-to-r hover:from-blue-500/15 hover:to-blue-500/5 py-3 cursor-pointer">
                                        <div className="flex items-center gap-2">
                                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                          Upcoming
                                        </div>
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              
                              {/* Include Adult Content */}
                              <div className="space-y-2 group/adult">
                                <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5 tracking-wide">
                                  <Eye className="w-3 h-3 text-muted-foreground/70" />
                                  Adult Content
                                </Label>
                                <div className="relative">
                                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg blur opacity-0 group-hover/adult:opacity-100 transition-opacity duration-300"></div>
                                  <div className="relative flex items-center justify-between p-2 bg-gradient-to-br from-background/50 to-background/30 backdrop-blur-sm rounded-lg border border-border/30 hover:border-purple-500/40 transition-all duration-300 group-hover/adult:scale-[1.01]">
                                    <div className="flex items-center gap-2">
                                      <Switch
                                        checked={filters.includeAdult}
                                        onCheckedChange={(checked) => setFilters(prev => ({ ...prev, includeAdult: checked }))}
                                        data-testid="toggle-include-adult"
                                        className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-purple-500 data-[state=checked]:to-pink-500"
                                      />
                                      <div className="flex flex-col">
                                        <span className={`text-xs font-medium transition-colors ${filters.includeAdult ? 'text-purple-600 dark:text-purple-400' : 'text-muted-foreground'}`}>
                                          {filters.includeAdult ? 'Including' : 'Excluding'}
                                        </span>
                                        <span className="text-xs text-muted-foreground">Adult content</span>
                                      </div>
                                    </div>
                                    {filters.includeAdult && (
                                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>
        </section>

        {/* Movies Grid with Infinite Scroll */}
        <MovieGrid
          movies={movies}
          isLoading={isLoading}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          infiniteScrollTriggerRef={triggerRef}
          mediaType={filters.contentType === 'movies' ? 'movie' : 'tv'}
          skeletonCount={18}
        />
      </main>
      
      <Footer />
    </div>
  );
}
