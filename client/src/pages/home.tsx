import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { MovieResponse, TVResponse, Movie, TVShow } from "@/types/movie";
import { useAuth } from "@/hooks/useAuth";
import EnhancedHeader from "@/components/layout/enhanced-header";
import FloatingNav from "@/components/layout/floating-nav";
import Footer from "@/components/layout/footer";
import HeroCarousel from "@/components/movie/hero-carousel";
import ContentRow from "@/components/movie/content-row";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Star, Clock, Film, Play, Sparkles, Eye, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

const GENRE_FILTERS = [
  { id: "all", name: "All", genreId: null },
  { id: "action", name: "Action", genreId: 28 },
  { id: "comedy", name: "Comedy", genreId: 35 },
  { id: "drama", name: "Drama", genreId: 18 },
  { id: "horror", name: "Horror", genreId: 27 },
  { id: "romance", name: "Romance", genreId: 10749 },
  { id: "scifi", name: "Sci-Fi", genreId: 878 },
];

export default function Home() {
  const { user } = useAuth();
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  
  const { data: trendingMovies, isLoading: trendingMoviesLoading } = useQuery<MovieResponse>({
    queryKey: ["/api/movies/trending"],
    staleTime: 1000 * 60 * 15,
  });

  const { data: popularMovies, isLoading: popularMoviesLoading } = useQuery<MovieResponse>({
    queryKey: ["/api/movies/popular"],
    staleTime: 1000 * 60 * 15,
  });

  const { data: upcomingMovies, isLoading: upcomingMoviesLoading } = useQuery<MovieResponse>({
    queryKey: ["/api/movies/upcoming"],
    staleTime: 1000 * 60 * 15,
  });

  const { data: topRatedMovies, isLoading: topRatedMoviesLoading } = useQuery<MovieResponse>({
    queryKey: ["/api/movies/top-rated"],
    staleTime: 1000 * 60 * 15,
  });

  const { data: nowPlayingMovies, isLoading: nowPlayingMoviesLoading } = useQuery<MovieResponse>({
    queryKey: ["/api/movies/now_playing"],
    staleTime: 1000 * 60 * 15,
  });

  const { data: trendingTVShows, isLoading: trendingTVShowsLoading } = useQuery<TVResponse>({
    queryKey: ["/api/tv/trending"],
    staleTime: 1000 * 60 * 15,
  });

  const { data: popularTVShows, isLoading: popularTVShowsLoading } = useQuery<TVResponse>({
    queryKey: ["/api/tv/popular"],
    staleTime: 1000 * 60 * 15,
  });

  const { data: viewingHistory, isLoading: viewingHistoryLoading } = useQuery<any[]>({
    queryKey: ["/api/viewing-history"],
    staleTime: 1000 * 60 * 5,
    enabled: !!user,
  });

  const filterByGenre = (items: Movie[] | undefined) => {
    if (!items || selectedGenre === "all") return items || [];
    const genreFilter = GENRE_FILTERS.find(g => g.id === selectedGenre);
    if (!genreFilter?.genreId) return items;
    return items.filter(item => item.genre_ids?.includes(genreFilter.genreId!));
  };

  const continueWatching = viewingHistory
    ?.filter(item => item.watchProgress && item.watchProgress < 90)
    .slice(0, 12)
    .map(item => ({
      ...item.mediaData,
      watchProgress: item.watchProgress,
      mediaType: item.mediaType
    })) || [];

  const recentlyWatched = viewingHistory
    ?.slice(0, 12)
    .map(item => ({
      ...item.mediaData,
      mediaType: item.mediaType
    })) || [];

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="home-page">
      <EnhancedHeader />
      <FloatingNav />
      
      <main className="pt-16 pb-20 md:pb-0">
        <HeroCarousel />

        <section className="py-6 bg-gradient-to-b from-background/80 to-background sticky top-16 z-30 backdrop-blur-sm border-b border-border/50" data-testid="genre-filters">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2" role="group" aria-label="Genre filters">
              <span className="text-sm font-medium text-muted-foreground whitespace-nowrap mr-2">Filter by:</span>
              {GENRE_FILTERS.map((genre) => (
                <button
                  key={genre.id}
                  onClick={() => setSelectedGenre(genre.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedGenre(genre.id);
                    }
                  }}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                    selectedGenre === genre.id 
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" 
                      : "bg-background border border-border hover:bg-primary/10"
                  )}
                  aria-pressed={selectedGenre === genre.id}
                  data-testid={`filter-${genre.id}`}
                >
                  {genre.name}
                </button>
              ))}
            </div>
          </div>
        </section>

        {user && continueWatching.length > 0 && (
          <ContentRow
            title="Continue Watching"
            items={continueWatching}
            isLoading={viewingHistoryLoading}
            mediaType="movie"
            icon={<Play className="w-6 h-6" />}
            showProgress={true}
            useEnhancedCards={true}
            data-testid="row-continue-watching"
          />
        )}

        <ContentRow
          title="Trending Movies"
          items={filterByGenre(trendingMovies?.results)}
          isLoading={trendingMoviesLoading}
          mediaType="movie"
          icon={<TrendingUp className="w-6 h-6" />}
          viewAllLink="/movies?category=trending"
          useEnhancedCards={true}
          data-testid="row-trending-movies"
        />

        <ContentRow
          title="Popular on CineHub Pro"
          items={filterByGenre(popularMovies?.results)}
          isLoading={popularMoviesLoading}
          mediaType="movie"
          icon={<Sparkles className="w-6 h-6" />}
          viewAllLink="/movies?category=popular"
          useEnhancedCards={true}
          data-testid="row-popular-movies"
        />

        <ContentRow
          title="New Releases"
          items={filterByGenre(upcomingMovies?.results)}
          isLoading={upcomingMoviesLoading}
          mediaType="movie"
          icon={<Calendar className="w-6 h-6" />}
          viewAllLink="/movies?category=upcoming"
          useEnhancedCards={true}
          data-testid="row-new-releases"
        />

        <ContentRow
          title="Top Rated Movies"
          items={filterByGenre(topRatedMovies?.results)}
          isLoading={topRatedMoviesLoading}
          mediaType="movie"
          icon={<Star className="w-6 h-6" />}
          viewAllLink="/movies?category=top-rated"
          useEnhancedCards={true}
          data-testid="row-top-rated"
        />

        <ContentRow
          title="Now Playing in Theaters"
          items={filterByGenre(nowPlayingMovies?.results)}
          isLoading={nowPlayingMoviesLoading}
          mediaType="movie"
          icon={<Film className="w-6 h-6" />}
          viewAllLink="/movies?category=now-playing"
          useEnhancedCards={true}
          data-testid="row-now-playing"
        />

        <ContentRow
          title="Trending TV Shows"
          items={trendingTVShows?.results || []}
          isLoading={trendingTVShowsLoading}
          mediaType="tv"
          icon={<TrendingUp className="w-6 h-6" />}
          viewAllLink="/tv-shows?category=trending"
          useEnhancedCards={true}
          data-testid="row-trending-tv"
        />

        <ContentRow
          title="Popular TV Shows"
          items={popularTVShows?.results || []}
          isLoading={popularTVShowsLoading}
          mediaType="tv"
          icon={<Sparkles className="w-6 h-6" />}
          viewAllLink="/tv-shows?category=popular"
          useEnhancedCards={true}
          data-testid="row-popular-tv"
        />

        {user && recentlyWatched.length > 0 && (
          <ContentRow
            title="Recently Watched"
            items={recentlyWatched}
            isLoading={viewingHistoryLoading}
            mediaType="movie"
            icon={<Eye className="w-6 h-6" />}
            useEnhancedCards={true}
            data-testid="row-recently-watched"
          />
        )}

        <section className="py-20 bg-gradient-to-t from-primary/5 to-transparent" data-testid="cta-section">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="bg-card/50 backdrop-blur-sm rounded-3xl p-12 border border-border/50">
              <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Discover Your Next Favorite
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Explore our vast collection of movies and TV shows. Find hidden gems, revisit classics, and stay up to date with the latest releases.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild data-testid="button-browse-movies">
                  <a href="/movies">
                    <Film className="w-5 h-5 mr-2" />
                    Browse Movies
                  </a>
                </Button>
                <Button size="lg" variant="outline" asChild data-testid="button-browse-tv">
                  <a href="/tv-shows">
                    <Play className="w-5 h-5 mr-2" />
                    Browse TV Shows
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
