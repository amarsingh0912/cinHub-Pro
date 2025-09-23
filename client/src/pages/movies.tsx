import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { MovieResponse } from "@/types/movie";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MovieGrid from "@/components/movie/movie-grid";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Filter, X, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "wouter";

// Genre mappings
const GENRES = [
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

interface MovieFilters {
  sortBy: string;
  genres: number[];
  releaseYear: string;
  minRating: number;
  maxRating: number;
  minRuntime: string;
  maxRuntime: string;
  language: string;
  minVotes: string;
}

export default function Movies() {
  const [currentPage, setCurrentPage] = useState(1);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<MovieFilters>({
    sortBy: 'popularity.desc',
    genres: [],
    releaseYear: '',
    minRating: 0,
    maxRating: 10,
    minRuntime: '',
    maxRuntime: '',
    language: '',
    minVotes: ''
  });

  // Create query parameters from filters
  const createQueryParams = () => {
    const params: Record<string, any> = {
      page: currentPage,
      sort_by: filters.sortBy
    };

    if (filters.genres.length > 0) {
      params.with_genres = filters.genres.join(',');
    }
    if (filters.releaseYear) {
      params.primary_release_year = filters.releaseYear;
    }
    if (filters.minRating > 0) {
      params['vote_average.gte'] = filters.minRating;
    }
    if (filters.maxRating < 10) {
      params['vote_average.lte'] = filters.maxRating;
    }
    if (filters.minRuntime) {
      params['with_runtime.gte'] = filters.minRuntime;
    }
    if (filters.maxRuntime) {
      params['with_runtime.lte'] = filters.maxRuntime;
    }
    if (filters.language) {
      params.with_original_language = filters.language;
    }
    if (filters.minVotes) {
      params['vote_count.gte'] = filters.minVotes;
    }

    return params;
  };

  const { data: moviesData, isLoading } = useQuery<MovieResponse>({
    queryKey: ["/api/movies/discover", createQueryParams()],
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const handleLoadMore = () => {
    setCurrentPage(prev => prev + 1);
  };

  const handleGenreToggle = (genreId: number) => {
    setFilters(prev => ({
      ...prev,
      genres: prev.genres.includes(genreId)
        ? prev.genres.filter(id => id !== genreId)
        : [...prev.genres, genreId]
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      sortBy: 'popularity.desc',
      genres: [],
      releaseYear: '',
      minRating: 0,
      maxRating: 10,
      minRuntime: '',
      maxRuntime: '',
      language: '',
      minVotes: ''
    });
  };

  const hasActiveFilters = filters.genres.length > 0 || filters.releaseYear || 
    filters.minRating > 0 || filters.maxRating < 10 || filters.minRuntime || 
    filters.maxRuntime || filters.language || filters.minVotes;

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
                  <h1 className="text-4xl font-display font-bold mb-2" data-testid="movies-title">
                    Discover Movies
                  </h1>
                  <p className="text-xl text-muted-foreground" data-testid="movies-description">
                    Browse through thousands of movies with advanced filtering
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
                      <SelectItem value="popularity.desc" data-testid="sort-popularity">Most Popular</SelectItem>
                      <SelectItem value="popularity.asc" data-testid="sort-popularity-asc">Least Popular</SelectItem>
                      <SelectItem value="vote_average.desc" data-testid="sort-rating">Highest Rated</SelectItem>
                      <SelectItem value="vote_average.asc" data-testid="sort-rating-asc">Lowest Rated</SelectItem>
                      <SelectItem value="primary_release_date.desc" data-testid="sort-newest">Newest</SelectItem>
                      <SelectItem value="primary_release_date.asc" data-testid="sort-oldest">Oldest</SelectItem>
                      <SelectItem value="revenue.desc" data-testid="sort-revenue">Highest Revenue</SelectItem>
                      <SelectItem value="vote_count.desc" data-testid="sort-most-voted">Most Voted</SelectItem>
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
                        <CardTitle className="text-lg">Movie Filters</CardTitle>
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
                            {GENRES.map((genre) => (
                              <Badge
                                key={genre.id}
                                variant={filters.genres.includes(genre.id) ? "default" : "outline"}
                                className="cursor-pointer hover:bg-primary/80"
                                onClick={() => handleGenreToggle(genre.id)}
                                data-testid={`genre-${genre.name.toLowerCase().replace(' ', '-')}`}
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
                        
                        {/* Runtime */}
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Runtime (minutes)</Label>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              placeholder="Min"
                              value={filters.minRuntime}
                              onChange={(e) => setFilters(prev => ({ ...prev, minRuntime: e.target.value }))}
                              data-testid="input-min-runtime"
                            />
                            <Input
                              type="number"
                              placeholder="Max"
                              value={filters.maxRuntime}
                              onChange={(e) => setFilters(prev => ({ ...prev, maxRuntime: e.target.value }))}
                              data-testid="input-max-runtime"
                            />
                          </div>
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
                              <SelectItem value="" data-testid="language-any">Any Language</SelectItem>
                              {LANGUAGES.map((lang) => (
                                <SelectItem key={lang.code} value={lang.code} data-testid={`language-${lang.code}`}>
                                  {lang.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Minimum Votes */}
                        <div className="space-y-3">
                          <Label htmlFor="min-votes" className="text-sm font-medium">Minimum Votes</Label>
                          <Input
                            id="min-votes"
                            type="number"
                            placeholder="e.g., 1000"
                            value={filters.minVotes}
                            onChange={(e) => setFilters(prev => ({ ...prev, minVotes: e.target.value }))}
                            data-testid="input-min-votes"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>
        </section>

        {/* Movies Grid */}
        <section className="py-8" data-testid="movies-content">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {isLoading ? (
              <div className="flex items-center justify-center py-12" data-testid="movies-loading">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading movies...</span>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 mb-8" data-testid="movies-grid">
                  {moviesData?.results?.map((movie) => (
                    <Link key={movie.id} href={`/movie/${movie.id}`}>
                      <div className="movie-card group cursor-pointer">
                        <div className="aspect-[2/3] relative overflow-hidden rounded-lg bg-accent">
                          {movie.poster_path ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                              alt={movie.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <span className="text-muted-foreground text-xs text-center p-2">
                                No Image
                              </span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute bottom-4 left-4 right-4">
                              <div className="flex items-center gap-2 text-white">
                                <i className="fas fa-star text-secondary"></i>
                                <span data-testid={`rating-${movie.id}`}>{movie.vote_average.toFixed(1)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3">
                          <h3 className="font-semibold truncate" data-testid={`title-${movie.id}`}>
                            {movie.title}
                          </h3>
                          <p className="text-sm text-muted-foreground" data-testid={`year-${movie.id}`}>
                            {movie.release_date ? new Date(movie.release_date).getFullYear() : 'TBA'}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Results Info and Load More */}
                {moviesData && (
                  <div className="space-y-4">
                    <div className="text-center text-sm text-muted-foreground" data-testid="results-info">
                      Showing {moviesData.results?.length || 0} of {moviesData.total_results?.toLocaleString() || 0} movies
                      {currentPage > 1 && ` (Page ${currentPage} of ${moviesData.total_pages || 1})`}
                    </div>
                    
                    {moviesData.results && moviesData.results.length > 0 && currentPage < (moviesData.total_pages || 1) && (
                      <div className="text-center" data-testid="load-more-section">
                        <Button
                          onClick={handleLoadMore}
                          variant="outline"
                          size="lg"
                          disabled={isLoading}
                          data-testid="button-load-more"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              Loading...
                            </>
                          ) : (
                            'Load More Movies'
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
