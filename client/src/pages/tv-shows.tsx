import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { TVResponse } from "@/types/movie";
import { useRevealAnimation, RevealOnScroll, REVEAL_PRESETS } from "@/hooks/useRevealAnimation";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MovieCardSkeleton from "@/components/movie/movie-card-skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import MovieCard from "@/components/movie/movie-card";

export default function TVShows() {
  const [currentTab, setCurrentTab] = useState<string>('trending');
  
  const handleTabChange = (value: string) => {
    setCurrentTab(value);
  };
  
  const { data: trendingTVShows, isLoading: trendingLoading } = useQuery<TVResponse>({
    queryKey: ["/api/tv/trending"],
    staleTime: 1000 * 60 * 15, // 15 minutes
  });

  const { data: popularTVShows, isLoading: popularLoading } = useQuery<TVResponse>({
    queryKey: ["/api/tv/popular"],
    staleTime: 1000 * 60 * 15, // 15 minutes
  });

  const { data: topRatedTVShows, isLoading: topRatedLoading } = useQuery<TVResponse>({
    queryKey: ["/api/tv/top-rated"],
    staleTime: 1000 * 60 * 15, // 15 minutes
  });

  const { data: airingTodayTVShows, isLoading: airingTodayLoading } = useQuery<TVResponse>({
    queryKey: ["/api/tv/airing_today"],
    staleTime: 1000 * 60 * 15, // 15 minutes
  });

  const { data: onTheAirTVShows, isLoading: onTheAirLoading } = useQuery<TVResponse>({
    queryKey: ["/api/tv/on-the-air"],
    staleTime: 1000 * 60 * 15, // 15 minutes
  });

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="tv-shows-page">
      <Header />
      
      <main className="pt-16">
        {/* Page Header */}
        <section className="py-12 border-b border-border" data-testid="tv-shows-header">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <RevealOnScroll options={REVEAL_PRESETS.sectionHeader}>
              <div className="text-center">
                <h1 className="text-4xl font-display font-bold mb-4" data-testid="tv-shows-title">
                  TV Shows
                </h1>
                <p className="text-xl text-muted-foreground" data-testid="tv-shows-description">
                  Discover amazing TV shows from around the world
                </p>
              </div>
            </RevealOnScroll>
          </div>
        </section>

        {/* TV Shows Tabs */}
        <section className="py-16" data-testid="tv-shows-content">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <RevealOnScroll options={REVEAL_PRESETS.sectionContent}>
              <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full" data-testid="tv-shows-tabs">
                <TabsList className="grid w-full grid-cols-5 max-w-4xl mx-auto mb-8">
                  <TabsTrigger value="trending" data-testid="tab-trending-tv">Trending</TabsTrigger>
                  <TabsTrigger value="popular" data-testid="tab-popular-tv">Popular</TabsTrigger>
                  <TabsTrigger value="top-rated" data-testid="tab-top-rated-tv">Top Rated</TabsTrigger>
                  <TabsTrigger value="airing-today" data-testid="tab-airing-today-tv">Airing Today</TabsTrigger>
                  <TabsTrigger value="on-the-air" data-testid="tab-on-the-air-tv">On The Air</TabsTrigger>
                </TabsList>
              
              <TabsContent value="trending" data-testid="trending-tv-content">
                {trendingLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6" data-testid="trending-tv-loading">
                    {Array.from({ length: 18 }, (_, index) => (
                      <MovieCardSkeleton key={index} />
                    ))}
                  </div>
                ) : trendingTVShows?.results && trendingTVShows.results.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6" data-testid="trending-tv-grid">
                    {trendingTVShows.results.map((show) => (
                      <MovieCard key={show.id} movie={show} mediaType="tv" />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12" data-testid="trending-tv-empty">
                    <p className="text-muted-foreground">No trending TV shows found.</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="popular" data-testid="popular-tv-content">
                {popularLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6" data-testid="popular-tv-loading">
                    {Array.from({ length: 18 }, (_, index) => (
                      <MovieCardSkeleton key={index} />
                    ))}
                  </div>
                ) : popularTVShows?.results && popularTVShows.results.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6" data-testid="popular-tv-grid">
                    {popularTVShows.results.map((show) => (
                      <MovieCard key={show.id} movie={show} mediaType="tv" />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12" data-testid="popular-tv-empty">
                    <p className="text-muted-foreground">No popular TV shows found.</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="top-rated" data-testid="top-rated-tv-content">
                {topRatedLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6" data-testid="top-rated-tv-loading">
                    {Array.from({ length: 18 }, (_, index) => (
                      <MovieCardSkeleton key={index} />
                    ))}
                  </div>
                ) : topRatedTVShows?.results && topRatedTVShows.results.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6" data-testid="top-rated-tv-grid">
                    {topRatedTVShows.results.map((show) => (
                      <MovieCard key={show.id} movie={show} mediaType="tv" />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12" data-testid="top-rated-tv-empty">
                    <p className="text-muted-foreground">No top rated TV shows found.</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="airing-today" data-testid="airing-today-tv-content">
                {airingTodayLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6" data-testid="airing-today-tv-loading">
                    {Array.from({ length: 18 }, (_, index) => (
                      <MovieCardSkeleton key={index} />
                    ))}
                  </div>
                ) : airingTodayTVShows?.results && airingTodayTVShows.results.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6" data-testid="airing-today-tv-grid">
                    {airingTodayTVShows.results.map((show) => (
                      <MovieCard key={show.id} movie={show} mediaType="tv" />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12" data-testid="airing-today-tv-empty">
                    <p className="text-muted-foreground">No TV shows airing today found.</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="on-the-air" data-testid="on-the-air-tv-content">
                {onTheAirLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6" data-testid="on-the-air-tv-loading">
                    {Array.from({ length: 18 }, (_, index) => (
                      <MovieCardSkeleton key={index} />
                    ))}
                  </div>
                ) : onTheAirTVShows?.results && onTheAirTVShows.results.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6" data-testid="on-the-air-tv-grid">
                    {onTheAirTVShows.results.map((show) => (
                      <MovieCard key={show.id} movie={show} mediaType="tv" />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12" data-testid="on-the-air-tv-empty">
                    <p className="text-muted-foreground">No TV shows on the air found.</p>
                  </div>
                )}
              </TabsContent>
              </Tabs>
            </RevealOnScroll>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}