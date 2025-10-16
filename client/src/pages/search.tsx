import { useState, useEffect, useRef, useMemo } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Search, Loader2, TrendingUp, Clock, Sparkles, ChevronRight, ArrowUpDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("relevance");
  const trackedSearchTerms = useRef(new Set<string>());
  const { isAuthenticated } = useAuth();

  const popularSearches = [
    "Spider-Man", "Avengers", "Batman", "Oppenheimer", "Breaking Bad", 
    "Game of Thrones", "Stranger Things", "The Office", "Marvel", "Star Wars"
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
      query: searchTerm
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
                Explore thousands of movies and TV shows with powerful search
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
                    className="h-16 pl-14 pr-32 text-lg rounded-2xl border-2 border-border/50 bg-slate-900/90 dark:bg-slate-950/90 backdrop-blur-sm focus:border-primary shadow-lg shadow-black/5 transition-all text-foreground placeholder:text-muted-foreground"
                    data-testid="input-search"
                  />
                  <Search className="w-6 h-6 absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
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

              {/* Sort By Filter - Only shown when there are search results */}
              {searchTerm && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-center gap-3 mt-6"
                >
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ArrowUpDown className="w-4 h-4" />
                    <span className="font-medium">Sort by:</span>
                  </div>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-48 h-9" data-testid="select-sort">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Relevance</SelectItem>
                      <SelectItem value="rating.desc">Highest Rated</SelectItem>
                      <SelectItem value="rating.asc">Lowest Rated</SelectItem>
                      <SelectItem value="release_date.desc">Newest First</SelectItem>
                      <SelectItem value="release_date.asc">Oldest First</SelectItem>
                      <SelectItem value="popularity.desc">Most Popular</SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>
              )}
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
                          <span>Use the sort by filter to organize your results</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ChevronRight className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                          <span>Search works for both movies and TV shows</span>
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
                      </div>

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

                      // Apply client-side sorting
                      const sortedResults = [...processedResults].sort((a, b) => {
                        switch (sortBy) {
                          case "rating.desc":
                            return (b.vote_average || 0) - (a.vote_average || 0);
                          case "rating.asc":
                            return (a.vote_average || 0) - (b.vote_average || 0);
                          case "release_date.desc":
                            return new Date(b.release_date || 0).getTime() - new Date(a.release_date || 0).getTime();
                          case "release_date.asc":
                            return new Date(a.release_date || 0).getTime() - new Date(b.release_date || 0).getTime();
                          case "popularity.desc":
                            return (b.popularity || 0) - (a.popularity || 0);
                          case "relevance":
                          default:
                            return 0; // Keep original order (relevance from TMDB)
                        }
                      });
                      
                      return sortedResults.length > 0 ? (
                        <MovieGrid
                          movies={sortedResults as any}
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
                              We couldn't find anything matching <span className="font-semibold">"{searchTerm}"</span>. Try different keywords.
                            </p>
                            <Button
                              variant="default"
                              onClick={() => {
                                setQuery("");
                                setSearchTerm("");
                                setSortBy("relevance");
                              }}
                              data-testid="button-new-search"
                            >
                              <Search className="w-4 h-4 mr-2" />
                              New Search
                            </Button>
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
