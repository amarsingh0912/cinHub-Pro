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
import { Loader2, Filter, X, ChevronDown, ChevronUp, Film } from "lucide-react";
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
      return '/api/tv/on_the_air';
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
                  <Button
                    variant={hasActiveFilters ? "default" : "outline"}
                    onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                    className={`relative flex items-center gap-2 min-w-[120px] transition-all duration-300 hover:scale-105 ${
                      hasActiveFilters 
                        ? 'bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg' 
                        : 'hover:bg-accent hover:text-accent-foreground border-2 hover:border-primary/50'
                    }`}
                    data-testid="toggle-filters"
                  >
                    <div className="relative">
                      <Filter className={`w-4 h-4 transition-transform duration-300 ${isFiltersOpen ? 'rotate-180' : ''}`} />
                      {hasActiveFilters && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      )}
                    </div>
                    Filters
                    {hasActiveFilters && (
                      <Badge variant="secondary" className="ml-1 bg-white/20 text-white border-0 text-xs px-2 py-0.5 animate-pulse">
                        Active
                      </Badge>
                    )}
                    <div className={`transition-transform duration-300 ${isFiltersOpen ? 'rotate-180' : ''}`}>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </Button>
                  
                  <div className="relative">
                    <Select 
                      value={filters.sortBy} 
                      onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}
                    >
                      <SelectTrigger className="w-56 h-10 border-2 transition-all duration-200 hover:border-primary/50 focus:border-primary bg-card/50 backdrop-blur-sm" data-testid="sort-select">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent className="bg-card/95 backdrop-blur-md border-2">
                        {getSortOptions().map((option) => (
                          <SelectItem 
                            key={option.value} 
                            value={option.value} 
                            data-testid={`sort-${option.value}`}
                            className="transition-colors duration-200 hover:bg-primary/10"
                          >
                            {option.name}
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
                    <CardHeader className="pb-6 bg-gradient-to-r from-accent/20 to-accent/10 border-b border-border/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Film className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
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
                    <CardContent className="p-8">
                      {/* Filter Sections with Visual Grouping */}
                      <div className="space-y-8">
                        {/* Content & Category Section */}
                        <div className="bg-accent/5 rounded-xl p-6 border border-accent/20 hover:border-accent/40 transition-colors duration-300">
                          <h3 className="text-lg font-semibold mb-6 text-foreground/90 flex items-center gap-2">
                            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                            Content & Category
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Content Type Toggle */}
                            <div className="space-y-3">
                              <Label className="text-sm font-medium text-foreground/80">Content Type</Label>
                              <Select 
                                value={filters.contentType} 
                                onValueChange={(value) => handleContentTypeChange(value as ContentType)}
                              >
                                <SelectTrigger className="h-11 border-2 hover:border-primary/50 transition-colors bg-card/50" data-testid="select-content-type">
                                  <SelectValue placeholder="Select content type" />
                                </SelectTrigger>
                                <SelectContent className="bg-card/95 backdrop-blur-md">
                                  <SelectItem value="movies" data-testid="content-type-movies" className="hover:bg-primary/10">Movies</SelectItem>
                                  <SelectItem value="tv" data-testid="content-type-tv" className="hover:bg-primary/10">TV Shows</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            {/* Category Filter */}
                            <div className="space-y-3">
                              <Label className="text-sm font-medium text-foreground/80">Category</Label>
                              <Select 
                                value={filters.category} 
                                onValueChange={(value) => setFilters(prev => ({ ...prev, category: value as MovieCategory | TVCategory }))}
                              >
                                <SelectTrigger className="h-11 border-2 hover:border-primary/50 transition-colors bg-card/50" data-testid="select-category">
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent className="bg-card/95 backdrop-blur-md">
                                  {getAvailableCategories().map((category) => (
                                    <SelectItem key={category.value} value={category.value} data-testid={`category-${category.value}`} className="hover:bg-primary/10">
                                      {category.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>

                        {/* Genres & Filters Section */}
                        <div className="bg-primary/5 rounded-xl p-6 border border-primary/20 hover:border-primary/40 transition-colors duration-300">
                          <h3 className="text-lg font-semibold mb-6 text-foreground/90 flex items-center gap-2">
                            <div className="w-2 h-2 bg-secondary rounded-full animate-pulse"></div>
                            Genres & Discovery
                          </h3>
                          <div className="space-y-6">
                            {/* Genres */}
                            <div className="space-y-4">
                              <Label className="text-sm font-medium text-foreground/80">Genres</Label>
                              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-3 bg-background/30 rounded-lg border border-border/30">
                                {getAvailableGenres().map((genre) => (
                                  <Badge
                                    key={genre.id}
                                    variant={filters.genres.includes(genre.id) ? "default" : "outline"}
                                    className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
                                      filters.genres.includes(genre.id) 
                                        ? 'bg-gradient-to-r from-primary to-primary/80 shadow-md hover:shadow-lg' 
                                        : 'hover:bg-primary/10 hover:border-primary/50'
                                    }`}
                                    onClick={() => handleGenreToggle(genre.id)}
                                    data-testid={`genre-${genre.name.toLowerCase().replace(/ /g, '-')}`}
                                  >
                                    {genre.name}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Details & Ratings Section */}
                        <div className="bg-secondary/5 rounded-xl p-6 border border-secondary/20 hover:border-secondary/40 transition-colors duration-300">
                          <h3 className="text-lg font-semibold mb-6 text-foreground/90 flex items-center gap-2">
                            <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                            Details & Ratings
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Release Year */}
                            <div className="space-y-3">
                              <Label htmlFor="release-year" className="text-sm font-medium text-foreground/80">Release Year</Label>
                              <Input
                                id="release-year"
                                type="number"
                                placeholder="e.g., 2023"
                                min="1900"
                                max={new Date().getFullYear() + 5}
                                value={filters.releaseYear}
                                onChange={(e) => setFilters(prev => ({ ...prev, releaseYear: e.target.value }))}
                                className="h-11 border-2 hover:border-primary/50 focus:border-primary bg-card/50 transition-colors"
                                data-testid="input-release-year"
                              />
                            </div>
                            
                            {/* Rating Range */}
                            <div className="space-y-3 md:col-span-2">
                              <Label className="text-sm font-medium text-foreground/80">Rating Range</Label>
                              <div className="space-y-4 p-4 bg-background/30 rounded-lg border border-border/30">
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-medium w-12 text-center bg-primary/10 rounded px-2 py-1">{filters.minRating}</span>
                                  <Slider
                                    value={[filters.minRating]}
                                    onValueChange={([value]) => setFilters(prev => ({ ...prev, minRating: value }))}
                                    max={10}
                                    min={0}
                                    step={0.1}
                                    className="flex-1"
                                    data-testid="slider-min-rating"
                                  />
                                  <span className="text-xs text-muted-foreground font-medium">Min</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-medium w-12 text-center bg-primary/10 rounded px-2 py-1">{filters.maxRating}</span>
                                  <Slider
                                    value={[filters.maxRating]}
                                    onValueChange={([value]) => setFilters(prev => ({ ...prev, maxRating: value }))}
                                    max={10}
                                    min={0}
                                    step={0.1}
                                    className="flex-1"
                                    data-testid="slider-max-rating"
                                  />
                                  <span className="text-xs text-muted-foreground font-medium">Max</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Advanced Options Section */}
                        <div className="bg-muted/5 rounded-xl p-6 border border-muted/20 hover:border-muted/40 transition-colors duration-300">
                          <h3 className="text-lg font-semibold mb-6 text-foreground/90 flex items-center gap-2">
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse"></div>
                            Advanced Options
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Language */}
                            <div className="space-y-3">
                              <Label className="text-sm font-medium text-foreground/80">Original Language</Label>
                              <Select 
                                value={filters.language} 
                                onValueChange={(value) => setFilters(prev => ({ ...prev, language: value }))}
                              >
                                <SelectTrigger className="h-11 border-2 hover:border-primary/50 transition-colors bg-card/50" data-testid="select-language">
                                  <SelectValue placeholder="Any language" />
                                </SelectTrigger>
                                <SelectContent className="bg-card/95 backdrop-blur-md">
                                  <SelectItem value="all" data-testid="language-any" className="hover:bg-primary/10">Any Language</SelectItem>
                                  {LANGUAGES.map((lang) => (
                                    <SelectItem key={lang.code} value={lang.code} data-testid={`language-${lang.code}`} className="hover:bg-primary/10">
                                      {lang.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            {/* Certificate/Rating Filter - Movies Only */}
                            {filters.contentType === 'movies' && (
                              <div className="space-y-3">
                                <Label className="text-sm font-medium text-foreground/80">Certificate/Rating</Label>
                                <Select 
                                  value={filters.certificate} 
                                  onValueChange={(value) => setFilters(prev => ({ ...prev, certificate: value }))}
                                >
                                  <SelectTrigger className="h-11 border-2 hover:border-primary/50 transition-colors bg-card/50" data-testid="select-certificate">
                                    <SelectValue placeholder="Any certificate" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-card/95 backdrop-blur-md">
                                    <SelectItem value="all" data-testid="certificate-all" className="hover:bg-primary/10">All Ratings</SelectItem>
                                    {CERTIFICATES.map((cert) => (
                                      <SelectItem key={cert.value} value={cert.value} data-testid={`certificate-${cert.value}`} className="hover:bg-primary/10">
                                        {cert.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                            
                            {/* Release Status */}
                            <div className="space-y-3">
                              <Label className="text-sm font-medium text-foreground/80">Release Status</Label>
                              <Select 
                                value={filters.status} 
                                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                              >
                                <SelectTrigger className="h-11 border-2 hover:border-primary/50 transition-colors bg-card/50" data-testid="select-status">
                                  <SelectValue placeholder="Any status" />
                                </SelectTrigger>
                                <SelectContent className="bg-card/95 backdrop-blur-md">
                                  <SelectItem value="all" data-testid="status-all" className="hover:bg-primary/10">All {filters.contentType === 'movies' ? 'Movies' : 'TV Shows'}</SelectItem>
                                  <SelectItem value="released" data-testid="status-released" className="hover:bg-primary/10">Released</SelectItem>
                                  <SelectItem value="upcoming" data-testid="status-upcoming" className="hover:bg-primary/10">Upcoming</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            {/* Include Adult Content */}
                            <div className="space-y-3">
                              <Label className="text-sm font-medium text-foreground/80">Adult Content</Label>
                              <div className="flex items-center space-x-3 p-3 bg-background/30 rounded-lg border border-border/30">
                                <Switch
                                  checked={filters.includeAdult}
                                  onCheckedChange={(checked) => setFilters(prev => ({ ...prev, includeAdult: checked }))}
                                  data-testid="toggle-include-adult"
                                  className="data-[state=checked]:bg-primary"
                                />
                                <span className={`text-sm transition-colors ${filters.includeAdult ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                                  {filters.includeAdult ? 'Including adult content' : 'Excluding adult content'}
                                </span>
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
