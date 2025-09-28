import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import type { TVResponse } from "@/types/movie";
import { useRevealAnimation, RevealOnScroll, REVEAL_PRESETS } from "@/hooks/useRevealAnimation";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MovieCardSkeleton from "@/components/movie/movie-card-skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Film } from "lucide-react";
import { Link } from "wouter";

export default function TVShows() {
  const [location, navigate] = useLocation();
  
  // Determine which tab to show based on URL query parameters or default
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const category = searchParams.get('category') || 'trending';
  const currentTab = ['trending', 'popular', 'top-rated'].includes(category) ? category : 'trending';
  
  const handleTabChange = (value: string) => {
    navigate(`/tv-shows?category=${value}`);
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
                <TabsList className="grid w-full grid-cols-3 max-w-lg mx-auto mb-8">
                  <TabsTrigger value="trending" data-testid="tab-trending-tv">Trending</TabsTrigger>
                  <TabsTrigger value="popular" data-testid="tab-popular-tv">Popular</TabsTrigger>
                  <TabsTrigger value="top-rated" data-testid="tab-top-rated-tv">Top Rated</TabsTrigger>
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
                      <Link key={show.id} href={`/tv/${show.id}`}>
                        <div className="tv-card group cursor-pointer" data-testid={`tv-card-${show.id}`}>
                          <div className="aspect-[2/3] relative overflow-hidden rounded-lg bg-accent">
                            {show.poster_path ? (
                              <img
                                src={`https://image.tmdb.org/t/p/w500${show.poster_path}`}
                                alt={show.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full bg-muted flex items-center justify-center">
                                <Film className="w-16 h-16 text-muted-foreground" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="absolute bottom-4 left-4 right-4">
                                <div className="flex items-center gap-2 text-white">
                                  <i className="fas fa-star text-secondary"></i>
                                  <span data-testid={`tv-rating-${show.id}`}>{show.vote_average.toFixed(1)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="mt-3">
                            <h3 className="font-semibold truncate" data-testid={`tv-title-${show.id}`}>
                              {show.name}
                            </h3>
                            <p className="text-sm text-muted-foreground" data-testid={`tv-year-${show.id}`}>
                              {show.first_air_date ? new Date(show.first_air_date).getFullYear() : 'TBA'}
                            </p>
                          </div>
                        </div>
                      </Link>
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
                      <Link key={show.id} href={`/tv/${show.id}`}>
                        <div className="tv-card group cursor-pointer" data-testid={`tv-card-${show.id}`}>
                          <div className="aspect-[2/3] relative overflow-hidden rounded-lg bg-accent">
                            {show.poster_path ? (
                              <img
                                src={`https://image.tmdb.org/t/p/w500${show.poster_path}`}
                                alt={show.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full bg-muted flex items-center justify-center">
                                <Film className="w-16 h-16 text-muted-foreground" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="absolute bottom-4 left-4 right-4">
                                <div className="flex items-center gap-2 text-white">
                                  <i className="fas fa-star text-secondary"></i>
                                  <span data-testid={`tv-rating-${show.id}`}>{show.vote_average.toFixed(1)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="mt-3">
                            <h3 className="font-semibold truncate" data-testid={`tv-title-${show.id}`}>
                              {show.name}
                            </h3>
                            <p className="text-sm text-muted-foreground" data-testid={`tv-year-${show.id}`}>
                              {show.first_air_date ? new Date(show.first_air_date).getFullYear() : 'TBA'}
                            </p>
                          </div>
                        </div>
                      </Link>
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
                      <Link key={show.id} href={`/tv/${show.id}`}>
                        <div className="tv-card group cursor-pointer" data-testid={`tv-card-${show.id}`}>
                          <div className="aspect-[2/3] relative overflow-hidden rounded-lg bg-accent">
                            {show.poster_path ? (
                              <img
                                src={`https://image.tmdb.org/t/p/w500${show.poster_path}`}
                                alt={show.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full bg-muted flex items-center justify-center">
                                <Film className="w-16 h-16 text-muted-foreground" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="absolute bottom-4 left-4 right-4">
                                <div className="flex items-center gap-2 text-white">
                                  <i className="fas fa-star text-secondary"></i>
                                  <span data-testid={`tv-rating-${show.id}`}>{show.vote_average.toFixed(1)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="mt-3">
                            <h3 className="font-semibold truncate" data-testid={`tv-title-${show.id}`}>
                              {show.name}
                            </h3>
                            <p className="text-sm text-muted-foreground" data-testid={`tv-year-${show.id}`}>
                              {show.first_air_date ? new Date(show.first_air_date).getFullYear() : 'TBA'}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12" data-testid="top-rated-tv-empty">
                    <p className="text-muted-foreground">No top rated TV shows found.</p>
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