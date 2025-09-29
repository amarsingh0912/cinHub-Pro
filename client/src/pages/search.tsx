import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { useInfiniteMovies } from "@/hooks/use-infinite-movies";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import type { MovieResponse } from "@/types/movie";
import { useRevealAnimation, RevealOnScroll, REVEAL_PRESETS } from "@/hooks/useRevealAnimation";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MovieGrid from "@/components/movie/movie-grid";
import MovieCardSkeleton from "@/components/movie/movie-card-skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Search, Loader2, Film, Filter, TrendingUp, Clock, Star, Calendar, SlidersHorizontal, X, Sparkles } from "lucide-react";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("relevance");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const [minRating, setMinRating] = useState("0");
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const trackedSearchTerms = useRef(new Set<string>());
  const { isAuthenticated } = useAuth();

  // Popular searches
  const popularSearches = [
    "Spider-Man", "Avengers", "Batman", "John Wick", "Breaking Bad", 
    "Game of Thrones", "The Office", "Friends", "Marvel", "Disney"
  ];

  // Movie genres for filtering
  const genres = [
    { id: "all", name: "All Genres" },
    { id: "28", name: "Action" },
    { id: "12", name: "Adventure" },
    { id: "16", name: "Animation" },
    { id: "35", name: "Comedy" },
    { id: "80", name: "Crime" },
    { id: "99", name: "Documentary" },
    { id: "18", name: "Drama" },
    { id: "10751", name: "Family" },
    { id: "14", name: "Fantasy" },
    { id: "36", name: "History" },
    { id: "27", name: "Horror" },
    { id: "10402", name: "Music" },
    { id: "9648", name: "Mystery" },
    { id: "10749", name: "Romance" },
    { id: "878", name: "Science Fiction" },
    { id: "53", name: "Thriller" },
    { id: "10752", name: "War" },
    { id: "37", name: "Western" }
  ];

  // Generate year options for the last 50 years
  const currentYear = new Date().getFullYear();
  const yearOptions = [
    { value: "all", label: "All Years" },
    ...Array.from({ length: 50 }, (_, i) => {
      const year = currentYear - i;
      return { value: year.toString(), label: year.toString() };
    })
  ];

  // Get recent search history for authenticated users
  const { data: searchHistory } = useQuery({
    queryKey: ["/api/search-history", { limit: 5 }],
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const {
    data: searchResults,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    triggerRef,
    totalResults
  } = useInfiniteMovies({
    queryKey: ["/api/search", { 
      query: searchTerm,
      genre: selectedGenre !== "all" ? selectedGenre : undefined,
      year: selectedYear !== "all" ? selectedYear : undefined,
      rating: minRating !== "0" ? minRating : undefined,
      sort: sortBy !== "relevance" ? sortBy : undefined
    }],
    enabled: searchTerm.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Search history tracking mutation
  const trackSearchHistoryMutation = useMutation({
    mutationFn: async ({ query, resultsCount }: { query: string; resultsCount: number }) => {
      await apiRequest("POST", "/api/search-history", {
        query,
        searchType: 'multi',
        resultsCount
      });
    },
    onError: (error) => {
      // Silent fail for search history - don't show error to user
      console.log('Failed to track search history:', error);
    },
  });

  // Track search history when results load (only once per unique search term)
  useEffect(() => {
    if (searchResults && searchTerm && isAuthenticated && totalResults !== undefined) {
      // Only track if we haven't tracked this search term before
      if (!trackedSearchTerms.current.has(searchTerm)) {
        trackedSearchTerms.current.add(searchTerm);
        trackSearchHistoryMutation.mutate({
          query: searchTerm,
          resultsCount: totalResults
        });
      }
    }
  }, [searchResults, searchTerm, isAuthenticated, totalResults]);

  // Handle search suggestions
  useEffect(() => {
    if (query.length > 2) {
      const suggestions = popularSearches.filter(search => 
        search.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5);
      setSearchSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query]);

  const handleSearch = (e: React.FormEvent, searchQuery?: string) => {
    e.preventDefault();
    const finalQuery = searchQuery || query.trim();
    if (finalQuery) {
      setSearchTerm(finalQuery);
      setQuery(finalQuery);
      setShowSuggestions(false);
    }
  };

  const handleSearchSuggestion = (suggestion: string) => {
    setQuery(suggestion);
    setSearchTerm(suggestion);
    setShowSuggestions(false);
  };

  const clearFilters = () => {
    setSortBy("relevance");
    setSelectedGenre("all");
    setSelectedYear("all");
    setMinRating("0");
  };

  const hasActiveFilters = sortBy !== "relevance" || selectedGenre !== "all" || selectedYear !== "all" || minRating !== "0";

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="search-page">
      <Header />
      
      <main className="pt-16">
        {/* Enhanced Search Header */}
        <section className="py-16 bg-gradient-to-b from-primary/5 to-background border-b border-border" data-testid="search-header">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <RevealOnScroll options={REVEAL_PRESETS.sectionHeader}>
              <div className="text-center mb-12">
                <div className="inline-flex items-center px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Discover Amazing Content
                </div>
                <h1 className="text-5xl sm:text-6xl font-display font-bold mb-6 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent" data-testid="search-title">
                  Find Your Next
                  <br />
                  <span className="text-primary">Favorite</span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="search-description">
                  Explore our vast collection of movies and TV shows. Use advanced filters to discover exactly what you're looking for.
                </p>
              </div>
            </RevealOnScroll>
            
            <RevealOnScroll options={{...REVEAL_PRESETS.fadeIn, delay: 300}}>
              <div className="max-w-4xl mx-auto">
                <form onSubmit={(e) => handleSearch(e)} className="relative mb-6">
                  <div className="relative" data-testid="search-form">
                    <Input
                      type="text"
                      placeholder="Search for movies, TV shows, actors, or directors..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onFocus={() => setShowSuggestions(searchSuggestions.length > 0)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      className="pl-12 pr-32 py-6 text-lg rounded-xl border-2 focus:border-primary transition-colors"
                      data-testid="input-search"
                    />
                    <Search className="w-6 h-6 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowFilters(!showFilters)}
                        className="h-10 px-3"
                        data-testid="button-filters"
                      >
                        <SlidersHorizontal className="w-4 h-4 mr-1" />
                        Filters
                        {hasActiveFilters && (
                          <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                            ON
                          </Badge>
                        )}
                      </Button>
                      <Button
                        type="submit"
                        size="sm"
                        className="h-10 px-4"
                        disabled={!query.trim() || isLoading}
                        data-testid="button-search"
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Search className="w-4 h-4 mr-1" />
                            Search
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {/* Search Suggestions */}
                    {showSuggestions && searchSuggestions.length > 0 && (
                      <Card className="absolute top-full left-0 right-0 mt-2 z-10" data-testid="search-suggestions">
                        <CardContent className="p-2">
                          {searchSuggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => handleSearchSuggestion(suggestion)}
                              className="w-full px-3 py-2 text-left hover:bg-accent rounded-md transition-colors flex items-center"
                              data-testid={`suggestion-${index}`}
                            >
                              <Search className="w-4 h-4 mr-2 text-muted-foreground" />
                              {suggestion}
                            </button>
                          ))}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </form>

                {/* Advanced Filters */}
                {showFilters && (
                  <Card className="mb-6" data-testid="filters-panel">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold flex items-center">
                          <Filter className="w-5 h-5 mr-2" />
                          Advanced Filters
                        </h3>
                        {hasActiveFilters && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearFilters}
                            data-testid="button-clear-filters"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Clear All
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Sort By</label>
                          <Select value={sortBy} onValueChange={setSortBy} data-testid="select-sort">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="relevance">Relevance</SelectItem>
                              <SelectItem value="rating.desc">Highest Rated</SelectItem>
                              <SelectItem value="rating.asc">Lowest Rated</SelectItem>
                              <SelectItem value="release_date.desc">Newest</SelectItem>
                              <SelectItem value="release_date.asc">Oldest</SelectItem>
                              <SelectItem value="popularity.desc">Most Popular</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium mb-2 block">Genre</label>
                          <Select value={selectedGenre} onValueChange={setSelectedGenre} data-testid="select-genre">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {genres.map((genre) => (
                                <SelectItem key={genre.id} value={genre.id}>
                                  {genre.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium mb-2 block">Year</label>
                          <Select value={selectedYear} onValueChange={setSelectedYear} data-testid="select-year">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {yearOptions.map((year) => (
                                <SelectItem key={year.value} value={year.value}>
                                  {year.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium mb-2 block">Min Rating</label>
                          <Select value={minRating} onValueChange={setMinRating} data-testid="select-rating">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">Any Rating</SelectItem>
                              <SelectItem value="1">1+ ⭐</SelectItem>
                              <SelectItem value="2">2+ ⭐⭐</SelectItem>
                              <SelectItem value="3">3+ ⭐⭐⭐</SelectItem>
                              <SelectItem value="4">4+ ⭐⭐⭐⭐</SelectItem>
                              <SelectItem value="5">5+ ⭐⭐⭐⭐⭐</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Popular Searches & Recent History */}
                {!searchTerm && (
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Popular Searches */}
                    <Card data-testid="popular-searches">
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                          <TrendingUp className="w-5 h-5 mr-2 text-primary" />
                          Popular Searches
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {popularSearches.map((search, index) => (
                            <button
                              key={index}
                              onClick={() => handleSearchSuggestion(search)}
                              className="px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-full text-sm transition-colors"
                              data-testid={`popular-search-${index}`}
                            >
                              {search}
                            </button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Recent Searches */}
                    {isAuthenticated && searchHistory && searchHistory.length > 0 && (
                      <Card data-testid="recent-searches">
                        <CardContent className="p-6">
                          <h3 className="text-lg font-semibold mb-4 flex items-center">
                            <Clock className="w-5 h-5 mr-2 text-primary" />
                            Recent Searches
                          </h3>
                          <div className="space-y-2">
                            {searchHistory.slice(0, 5).map((item: any, index: number) => (
                              <button
                                key={index}
                                onClick={() => handleSearchSuggestion(item.query)}
                                className="w-full px-3 py-2 text-left hover:bg-accent rounded-md transition-colors flex items-center justify-between group"
                                data-testid={`recent-search-${index}`}
                              >
                                <span className="flex items-center">
                                  <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                                  {item.query}
                                </span>
                                <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                  {item.resultsCount} results
                                </span>
                              </button>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </div>
            </RevealOnScroll>
          </div>
        </section>

        {/* Enhanced Search Results */}
        <section className="py-12" data-testid="search-results-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {isLoading ? (
              <div className="space-y-8">
                <div className="h-8 bg-muted rounded-md w-1/3 animate-pulse"></div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6" data-testid="search-loading">
                  {Array.from({ length: 18 }, (_, index) => (
                    <MovieCardSkeleton key={index} />
                  ))}
                </div>
              </div>
            ) : searchTerm && searchResults ? (
              <>
                <RevealOnScroll options={REVEAL_PRESETS.fadeIn}>
                  <div className="mb-8" data-testid="search-results-header">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                      <div>
                        <h2 className="text-3xl font-bold mb-2" data-testid="results-count">
                          {totalResults > 0 
                            ? `${totalResults.toLocaleString()} Results`
                            : `No Results Found`
                          }
                        </h2>
                        <p className="text-muted-foreground">
                          {totalResults > 0 
                            ? `Searching for "${searchTerm}"`
                            : `No matches for "${searchTerm}"`
                          }
                        </p>
                      </div>
                      
                      {hasActiveFilters && (
                        <div className="flex flex-wrap items-center gap-2 mt-4 sm:mt-0">
                          <span className="text-sm text-muted-foreground">Filters:</span>
                          {selectedGenre !== "all" && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              {genres.find(g => g.id === selectedGenre)?.name}
                              <button 
                                onClick={() => setSelectedGenre("all")}
                                className="ml-1 hover:bg-destructive/10 rounded-full p-0.5"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          )}
                          {selectedYear !== "all" && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              {selectedYear}
                              <button 
                                onClick={() => setSelectedYear("all")}
                                className="ml-1 hover:bg-destructive/10 rounded-full p-0.5"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          )}
                          {minRating !== "0" && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              {minRating}+ ⭐
                              <button 
                                onClick={() => setMinRating("0")}
                                className="ml-1 hover:bg-destructive/10 rounded-full p-0.5"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          )}
                          {sortBy !== "relevance" && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              Sort: {sortBy.replace(/\./g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2')}
                              <button 
                                onClick={() => setSortBy("relevance")}
                                className="ml-1 hover:bg-destructive/10 rounded-full p-0.5"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <Separator />
                  </div>
                </RevealOnScroll>
                
                {/* Filter and normalize the search results for MovieGrid */}
                {(() => {
                  const processedResults = searchResults
                    .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
                    .map((item: any) => {
                      const isMovie = item.media_type === 'movie';
                      return {
                        id: item.id,
                        poster_path: item.poster_path,
                        vote_average: item.vote_average || 0,
                        overview: item.overview || '',
                        backdrop_path: item.backdrop_path || null,
                        vote_count: item.vote_count || 0,
                        genre_ids: item.genre_ids || [],
                        adult: item.adult || false,
                        original_language: item.original_language || 'en',
                        popularity: item.popularity || 0,
                        media_type: item.media_type,
                        ...(isMovie ? {
                          title: item.title,
                          release_date: item.release_date,
                          original_title: item.original_title || item.title,
                          video: item.video || false
                        } : {
                          name: item.name,
                          first_air_date: item.first_air_date,
                          original_name: item.original_name || item.name,
                          origin_country: item.origin_country || []
                        })
                      };
                    });
                  
                  return processedResults.length > 0 ? (
                    <MovieGrid
                      movies={processedResults}
                      isLoading={false}
                      hasNextPage={hasNextPage}
                      isFetchingNextPage={isFetchingNextPage}
                      infiniteScrollTriggerRef={triggerRef}
                      mediaType="movie" // Mixed results, but MovieCard will handle the media_type
                      skeletonCount={18}
                    />
                  ) : (
                    <Card className="text-center py-16" data-testid="no-results">
                      <CardContent>
                        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                          <Search className="w-12 h-12 text-muted-foreground" />
                        </div>
                        <h3 className="text-2xl font-semibold mb-3">No Results Found</h3>
                        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                          We couldn't find any movies or TV shows matching your search. Try adjusting your filters or search terms.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                          <Button
                            variant="outline"
                            onClick={clearFilters}
                            disabled={!hasActiveFilters}
                            data-testid="button-clear-all-filters"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Clear All Filters
                          </Button>
                          <Button
                            variant="default"
                            onClick={() => {
                              setQuery("");
                              setSearchTerm("");
                              clearFilters();
                            }}
                            data-testid="button-new-search"
                          >
                            <Search className="w-4 h-4 mr-2" />
                            Start New Search
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })()}
              </>
            ) : null}
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
