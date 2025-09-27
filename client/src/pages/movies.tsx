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
                    variant="outline"
                    onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                    className="flex items-center gap-2"
                    data-testid="toggle-filters"
                  >
                    <Filter className="w-4 h-4" />
                    Filters
                    {hasActiveFilters && (
                      <Badge variant="secondary" className="ml-2">Active</Badge>
                    )}
                    {isFiltersOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                  
                  <Select 
                    value={filters.sortBy} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}
                  >
                    <SelectTrigger className="w-56" data-testid="sort-select">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      {getSortOptions().map((option) => (
                        <SelectItem key={option.value} value={option.value} data-testid={`sort-${option.value}`}>
                          {option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Comprehensive Filters Panel */}
              <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                <CollapsibleContent>
                  <Card className="w-full" data-testid="filters-panel">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{filters.contentType === 'movies' ? 'Movie' : 'TV Show'} Filters</CardTitle>
                        {hasActiveFilters && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={clearAllFilters}
                            data-testid="clear-filters"
                          >
                            Clear All
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Genres */}
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Genres</Label>
                          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                            {getAvailableGenres().map((genre) => (
                              <Badge
                                key={genre.id}
                                variant={filters.genres.includes(genre.id) ? "default" : "outline"}
                                className="cursor-pointer hover:bg-primary/80"
                                onClick={() => handleGenreToggle(genre.id)}
                                data-testid={`genre-${genre.name.toLowerCase().replace(/ /g, '-')}`}
                              >
                                {genre.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        {/* Release Year */}
                        <div className="space-y-3">
                          <Label htmlFor="release-year" className="text-sm font-medium">Release Year</Label>
                          <Input
                            id="release-year"
                            type="number"
                            placeholder="e.g., 2023"
                            min="1900"
                            max={new Date().getFullYear() + 5}
                            value={filters.releaseYear}
                            onChange={(e) => setFilters(prev => ({ ...prev, releaseYear: e.target.value }))}
                            data-testid="input-release-year"
                          />
                        </div>
                        
                        {/* Rating Range */}
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Rating Range</Label>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs w-8">{filters.minRating}</span>
                              <Slider
                                value={[filters.minRating]}
                                onValueChange={([value]) => setFilters(prev => ({ ...prev, minRating: value }))}
                                max={10}
                                min={0}
                                step={0.1}
                                className="flex-1"
                                data-testid="slider-min-rating"
                              />
                              <span className="text-xs">Min</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs w-8">{filters.maxRating}</span>
                              <Slider
                                value={[filters.maxRating]}
                                onValueChange={([value]) => setFilters(prev => ({ ...prev, maxRating: value }))}
                                max={10}
                                min={0}
                                step={0.1}
                                className="flex-1"
                                data-testid="slider-max-rating"
                              />
                              <span className="text-xs">Max</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Content Type Toggle */}
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Content Type</Label>
                          <Select 
                            value={filters.contentType} 
                            onValueChange={(value) => handleContentTypeChange(value as ContentType)}
                          >
                            <SelectTrigger data-testid="select-content-type">
                              <SelectValue placeholder="Select content type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="movies" data-testid="content-type-movies">Movies</SelectItem>
                              <SelectItem value="tv" data-testid="content-type-tv">TV Shows</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Category Filter */}
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Category</Label>
                          <Select 
                            value={filters.category} 
                            onValueChange={(value) => setFilters(prev => ({ ...prev, category: value as MovieCategory | TVCategory }))}
                          >
                            <SelectTrigger data-testid="select-category">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {getAvailableCategories().map((category) => (
                                <SelectItem key={category.value} value={category.value} data-testid={`category-${category.value}`}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Language */}
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Original Language</Label>
                          <Select 
                            value={filters.language} 
                            onValueChange={(value) => setFilters(prev => ({ ...prev, language: value }))}
                          >
                            <SelectTrigger data-testid="select-language">
                              <SelectValue placeholder="Any language" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all" data-testid="language-any">Any Language</SelectItem>
                              {LANGUAGES.map((lang) => (
                                <SelectItem key={lang.code} value={lang.code} data-testid={`language-${lang.code}`}>
                                  {lang.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Certificate/Rating Filter - Movies Only */}
                        {filters.contentType === 'movies' && (
                          <div className="space-y-3">
                            <Label className="text-sm font-medium">Certificate/Rating</Label>
                            <Select 
                              value={filters.certificate} 
                              onValueChange={(value) => setFilters(prev => ({ ...prev, certificate: value }))}
                            >
                              <SelectTrigger data-testid="select-certificate">
                                <SelectValue placeholder="Any certificate" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all" data-testid="certificate-all">All Ratings</SelectItem>
                                {CERTIFICATES.map((cert) => (
                                  <SelectItem key={cert.value} value={cert.value} data-testid={`certificate-${cert.value}`}>
                                    {cert.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        
                        {/* Release Status */}
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Release Status</Label>
                          <Select 
                            value={filters.status} 
                            onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                          >
                            <SelectTrigger data-testid="select-status">
                              <SelectValue placeholder="Any status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all" data-testid="status-all">All {filters.contentType === 'movies' ? 'Movies' : 'TV Shows'}</SelectItem>
                              <SelectItem value="released" data-testid="status-released">Released</SelectItem>
                              <SelectItem value="upcoming" data-testid="status-upcoming">Upcoming</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Include Adult Content */}
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Adult Content</Label>
                          <div className="flex items-center space-x-3">
                            <Switch
                              checked={filters.includeAdult}
                              onCheckedChange={(checked) => setFilters(prev => ({ ...prev, includeAdult: checked }))}
                              data-testid="toggle-include-adult"
                            />
                            <span className="text-sm text-muted-foreground">
                              {filters.includeAdult ? 'Including adult content' : 'Excluding adult content'}
                            </span>
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
