import { useState, useEffect, useRef } from "react";
import { useInfiniteMovies } from "@/hooks/use-infinite-movies";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MovieGrid from "@/components/movie/movie-grid";
import MovieCardSkeleton from "@/components/movie/movie-card-skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Search, Loader2, Filter, TrendingUp, Clock, X, Sparkles, ChevronRight, Grid3x3, List } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [mediaType, setMediaType] = useState<"all" | "movie" | "tv">("all");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("relevance");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const [minRating, setMinRating] = useState("0");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const trackedSearchTerms = useRef(new Set<string>());
  const { isAuthenticated } = useAuth();

  const popularSearches = [
    "Spider-Man", "Avengers", "Batman", "Oppenheimer", "Breaking Bad", 
    "Game of Thrones", "Stranger Things", "The Office", "Marvel", "Star Wars"
  ];

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

  const currentYear = new Date().getFullYear();
  const yearOptions = [
    { value: "all", label: "All Years" },
    ...Array.from({ length: 50 }, (_, i) => {
      const year = currentYear - i;
      return { value: year.toString(), label: year.toString() };
    })
  ];

  const { data: searchHistory } = useQuery({
    queryKey: ["/api/search-history", { limit: 5 }],
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 2,
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
      sort: sortBy !== "relevance" ? sortBy : undefined,
      mediaType: mediaType !== "all" ? mediaType : undefined
    }],
    enabled: searchTerm.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  const trackSearchHistoryMutation = useMutation({
    mutationFn: async ({ query, resultsCount }: { query: string; resultsCount: number }) => {
      await apiRequest("POST", "/api/search-history", {
        query,
        searchType: 'multi',
        resultsCount
      });
    },
    onError: (error) => {
      console.log('Failed to track search history:', error);
    },
  });

  useEffect(() => {
    if (searchResults && searchTerm && isAuthenticated && totalResults !== undefined) {
      if (!trackedSearchTerms.current.has(searchTerm)) {
        trackedSearchTerms.current.add(searchTerm);
        trackSearchHistoryMutation.mutate({
          query: searchTerm,
          resultsCount: totalResults
        });
      }
    }
  }, [searchResults, searchTerm, isAuthenticated, totalResults]);

  const handleSearch = (e: React.FormEvent, searchQuery?: string) => {
    e.preventDefault();
    const finalQuery = searchQuery || query.trim();
    if (finalQuery) {
      setSearchTerm(finalQuery);
      setQuery(finalQuery);
    }
  };

  const handleQuickSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    setSearchTerm(searchQuery);
  };

  const clearFilters = () => {
    setSortBy("relevance");
    setSelectedGenre("all");
    setSelectedYear("all");
    setMinRating("0");
  };

  const hasActiveFilters = sortBy !== "relevance" || selectedGenre !== "all" || selectedYear !== "all" || minRating !== "0";
  const activeFilterCount = [
    sortBy !== "relevance",
    selectedGenre !== "all",
    selectedYear !== "all",
    minRating !== "0"
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="search-page">
      <Header />
      
      <main className="pt-16">
        {/* Hero Search Section */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden" data-testid="search-header">
          {/* Animated Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10 pointer-events-none"></div>
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative max-w-5xl mx-auto">
            {/* Title */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 backdrop-blur-sm rounded-full mb-6">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Search & Discover</span>
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-4 tracking-tight" data-testid="search-title">
                Find Your Next
                <br />
                <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  Adventure
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="search-description">
                Explore thousands of movies and TV shows with powerful search and filters
              </p>
            </motion.div>

            {/* Search Bar */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-8"
            >
              <form onSubmit={(e) => handleSearch(e)} className="relative">
                <div className="relative group" data-testid="search-form">
                  <Input
                    type="text"
                    placeholder="Search movies, TV shows, actors..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="h-16 pl-14 pr-40 text-lg rounded-2xl border-2 border-border/50 bg-background/80 backdrop-blur-sm focus:border-primary shadow-lg shadow-black/5 transition-all"
                    data-testid="input-search"
                  />
                  <Search className="w-6 h-6 absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <Sheet open={showFilters} onOpenChange={setShowFilters}>
                      <SheetTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-10 gap-2"
                          data-testid="button-filters"
                        >
                          <Filter className="w-4 h-4" />
                          <span className="hidden sm:inline">Filters</span>
                          {activeFilterCount > 0 && (
                            <Badge variant="default" className="h-5 min-w-5 rounded-full px-1.5">
                              {activeFilterCount}
                            </Badge>
                          )}
                        </Button>
                      </SheetTrigger>
                      <SheetContent className="w-[90vw] sm:w-[400px] overflow-y-auto">
                        <SheetHeader>
                          <SheetTitle>Search Filters</SheetTitle>
                          <SheetDescription>
                            Refine your search with advanced filters
                          </SheetDescription>
                        </SheetHeader>
                        
                        <div className="mt-8 space-y-6">
                          {/* Media Type */}
                          <div>
                            <label className="text-sm font-semibold mb-3 block">Media Type</label>
                            <Tabs value={mediaType} onValueChange={(v) => setMediaType(v as typeof mediaType)} className="w-full">
                              <TabsList className="w-full grid grid-cols-3">
                                <TabsTrigger value="all">All</TabsTrigger>
                                <TabsTrigger value="movie">Movies</TabsTrigger>
                                <TabsTrigger value="tv">TV Shows</TabsTrigger>
                              </TabsList>
                            </Tabs>
                          </div>

                          <Separator />

                          {/* Genre */}
                          <div>
                            <label className="text-sm font-semibold mb-3 block">Genre</label>
                            <div className="grid grid-cols-2 gap-2">
                              {genres.map((genre) => (
                                <Button
                                  key={genre.id}
                                  variant={selectedGenre === genre.id ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setSelectedGenre(genre.id)}
                                  className="justify-start"
                                >
                                  {genre.name}
                                </Button>
                              ))}
                            </div>
                          </div>

                          <Separator />

                          {/* Year */}
                          <div>
                            <label className="text-sm font-semibold mb-3 block">Release Year</label>
                            <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto p-1">
                              {yearOptions.map((year) => (
                                <Button
                                  key={year.value}
                                  variant={selectedYear === year.value ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setSelectedYear(year.value)}
                                >
                                  {year.label}
                                </Button>
                              ))}
                            </div>
                          </div>

                          <Separator />

                          {/* Rating */}
                          <div>
                            <label className="text-sm font-semibold mb-3 block">Minimum Rating</label>
                            <div className="grid grid-cols-3 gap-2">
                              {["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].map((rating) => (
                                <Button
                                  key={rating}
                                  variant={minRating === rating ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setMinRating(rating)}
                                >
                                  {rating === "0" ? "Any" : `${rating}+`}
                                </Button>
                              ))}
                            </div>
                          </div>

                          <Separator />

                          {/* Sort By */}
                          <div>
                            <label className="text-sm font-semibold mb-3 block">Sort By</label>
                            <div className="space-y-2">
                              {[
                                { value: "relevance", label: "Relevance" },
                                { value: "rating.desc", label: "Highest Rated" },
                                { value: "rating.asc", label: "Lowest Rated" },
                                { value: "release_date.desc", label: "Newest First" },
                                { value: "release_date.asc", label: "Oldest First" },
                                { value: "popularity.desc", label: "Most Popular" }
                              ].map((option) => (
                                <Button
                                  key={option.value}
                                  variant={sortBy === option.value ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setSortBy(option.value)}
                                  className="w-full justify-start"
                                >
                                  {option.label}
                                </Button>
                              ))}
                            </div>
                          </div>

                          {/* Clear Filters */}
                          {hasActiveFilters && (
                            <>
                              <Separator />
                              <Button
                                variant="outline"
                                onClick={() => {
                                  clearFilters();
                                  setMediaType("all");
                                }}
                                className="w-full"
                                data-testid="button-clear-filters"
                              >
                                <X className="w-4 h-4 mr-2" />
                                Clear All Filters
                              </Button>
                            </>
                          )}
                        </div>
                      </SheetContent>
                    </Sheet>

                    <Button
                      type="submit"
                      size="lg"
                      className="h-10 px-6 font-semibold rounded-xl"
                      disabled={!query.trim() || isLoading}
                      data-testid="button-search"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Search"
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </motion.div>

            {/* Quick Access Cards */}
            {!searchTerm && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="grid md:grid-cols-2 gap-6"
              >
                {/* Popular Searches */}
                <Card className="border-2 hover:border-primary/50 transition-colors" data-testid="popular-searches">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-primary" />
                      </div>
                      <h3 className="text-lg font-bold">Trending Searches</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {popularSearches.map((search, index) => (
                        <button
                          key={index}
                          onClick={() => handleQuickSearch(search)}
                          className="group px-4 py-2 bg-secondary/50 hover:bg-primary hover:text-primary-foreground rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2"
                          data-testid={`popular-search-${index}`}
                        >
                          {search}
                          <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Searches */}
                {isAuthenticated && Array.isArray(searchHistory) && searchHistory.length > 0 ? (
                  <Card className="border-2 hover:border-primary/50 transition-colors" data-testid="recent-searches">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Clock className="w-5 h-5 text-primary" />
                        </div>
                        <h3 className="text-lg font-bold">Recent Searches</h3>
                      </div>
                      <div className="space-y-2">
                        {searchHistory.slice(0, 5).map((item: any, index: number) => (
                          <button
                            key={index}
                            onClick={() => handleQuickSearch(item.query)}
                            className="w-full group px-4 py-3 hover:bg-accent rounded-lg transition-colors flex items-center justify-between"
                            data-testid={`recent-search-${index}`}
                          >
                            <div className="flex items-center gap-3">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">{item.query}</span>
                            </div>
                            <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                              {item.resultsCount} results
                            </span>
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-2 border-dashed" data-testid="search-tips">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Sparkles className="w-5 h-5 text-primary" />
                        </div>
                        <h3 className="text-lg font-bold">Search Tips</h3>
                      </div>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <ChevronRight className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                          <span>Try searching for movie titles, actors, or directors</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ChevronRight className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                          <span>Use filters to narrow down results by genre, year, or rating</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ChevronRight className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                          <span>Switch between movies and TV shows for specific content</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            )}
          </div>
        </section>

        {/* Search Results */}
        <AnimatePresence mode="wait">
          {searchTerm && (
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 px-4 sm:px-6 lg:px-8"
              data-testid="search-results-section"
            >
              <div className="max-w-7xl mx-auto">
                {isLoading ? (
                  <div className="space-y-8">
                    <div className="h-10 bg-muted rounded-lg w-64 animate-pulse"></div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6" data-testid="search-loading">
                      {Array.from({ length: 18 }, (_, index) => (
                        <MovieCardSkeleton key={index} />
                      ))}
                    </div>
                  </div>
                ) : searchResults ? (
                  <>
                    {/* Results Header */}
                    <div className="mb-8" data-testid="search-results-header">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                          <h2 className="text-3xl font-bold mb-2" data-testid="results-count">
                            {totalResults && totalResults > 0 ? (
                              <>
                                <span className="text-primary">{totalResults.toLocaleString()}</span>{" "}
                                {totalResults === 1 ? "Result" : "Results"}
                              </>
                            ) : (
                              "No Results Found"
                            )}
                          </h2>
                          <p className="text-muted-foreground">
                            for <span className="font-semibold text-foreground">"{searchTerm}"</span>
                          </p>
                        </div>

                        {/* View Mode Toggle */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant={viewMode === "grid" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setViewMode("grid")}
                            data-testid="button-grid-view"
                          >
                            <Grid3x3 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant={viewMode === "list" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setViewMode("list")}
                            data-testid="button-list-view"
                          >
                            <List className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Active Filters */}
                      {(hasActiveFilters || mediaType !== "all") && (
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                          <span className="text-sm text-muted-foreground font-medium">Active filters:</span>
                          {mediaType !== "all" && (
                            <Badge variant="secondary" className="gap-2 pl-3 pr-2 py-1">
                              {mediaType === "movie" ? "Movies" : "TV Shows"}
                              <button
                                onClick={() => setMediaType("all")}
                                className="hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          )}
                          {selectedGenre !== "all" && (
                            <Badge variant="secondary" className="gap-2 pl-3 pr-2 py-1">
                              {genres.find(g => g.id === selectedGenre)?.name}
                              <button
                                onClick={() => setSelectedGenre("all")}
                                className="hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          )}
                          {selectedYear !== "all" && (
                            <Badge variant="secondary" className="gap-2 pl-3 pr-2 py-1">
                              Year: {selectedYear}
                              <button
                                onClick={() => setSelectedYear("all")}
                                className="hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          )}
                          {minRating !== "0" && (
                            <Badge variant="secondary" className="gap-2 pl-3 pr-2 py-1">
                              Rating: {minRating}+
                              <button
                                onClick={() => setMinRating("0")}
                                className="hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          )}
                          {sortBy !== "relevance" && (
                            <Badge variant="secondary" className="gap-2 pl-3 pr-2 py-1">
                              Sort: {sortBy.replace(/\./g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2')}
                              <button
                                onClick={() => setSortBy("relevance")}
                                className="hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              clearFilters();
                              setMediaType("all");
                            }}
                            className="h-7 text-xs"
                          >
                            Clear all
                          </Button>
                        </div>
                      )}

                      <Separator />
                    </div>
                    
                    {/* Results Grid */}
                    {(() => {
                      const processedResults = searchResults
                        .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
                        .map((item: any) => {
                          const isMovie = item.media_type === 'movie';
                          const baseData = {
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
                            media_type: item.media_type
                          };

                          if (isMovie) {
                            return {
                              ...baseData,
                              title: item.title,
                              release_date: item.release_date,
                              original_title: item.original_title || item.title,
                              video: item.video || false
                            };
                          } else {
                            return {
                              ...baseData,
                              title: item.name,
                              release_date: item.first_air_date,
                              original_title: item.original_name || item.name,
                              video: false,
                              name: item.name,
                              first_air_date: item.first_air_date,
                              original_name: item.original_name || item.name,
                              origin_country: item.origin_country || []
                            };
                          }
                        });
                      
                      return processedResults.length > 0 ? (
                        <MovieGrid
                          movies={processedResults as any}
                          isLoading={false}
                          hasNextPage={hasNextPage}
                          isFetchingNextPage={isFetchingNextPage}
                          infiniteScrollTriggerRef={triggerRef}
                          mediaType="movie"
                          skeletonCount={18}
                        />
                      ) : (
                        <Card className="text-center py-20 border-2 border-dashed" data-testid="no-results">
                          <CardContent>
                            <div className="w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6">
                              <Search className="w-12 h-12 text-muted-foreground" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3">No Matches Found</h3>
                            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                              We couldn't find anything matching <span className="font-semibold">"{searchTerm}"</span>. Try different keywords or adjust your filters.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  clearFilters();
                                  setMediaType("all");
                                }}
                                disabled={!hasActiveFilters && mediaType === "all"}
                                data-testid="button-clear-all-filters"
                              >
                                <X className="w-4 h-4 mr-2" />
                                Clear Filters
                              </Button>
                              <Button
                                variant="default"
                                onClick={() => {
                                  setQuery("");
                                  setSearchTerm("");
                                  clearFilters();
                                  setMediaType("all");
                                }}
                                data-testid="button-new-search"
                              >
                                <Search className="w-4 h-4 mr-2" />
                                New Search
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })()}
                  </>
                ) : null}
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>
      
      <Footer />
    </div>
  );
}
