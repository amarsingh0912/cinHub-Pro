import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { MovieResponse, TVResponse, Movie, TVShow } from "@/types/movie";
import { GENRE_MAP } from "@/types/movie";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import HeroCarousel from "@/components/movie/hero-carousel";
import ContentRow from "@/components/movie/content-row";
import GenreChips from "@/components/movie/genre-chips";
import { TrendingUp, Clock, Star, Film, Tv, Play } from "lucide-react";
import type { ViewingHistory } from "@shared/schema";

export default function EnhancedHome() {
  const { user } = useAuth();
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  
  const selectedGenreId = selectedGenre ? GENRE_MAP[selectedGenre] : null;

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

  const { data: trendingTVShows, isLoading: trendingTVShowsLoading } = useQuery<TVResponse>({
    queryKey: ["/api/tv/trending"],
    staleTime: 1000 * 60 * 15,
  });

  const { data: popularTVShows, isLoading: popularTVShowsLoading } = useQuery<TVResponse>({
    queryKey: ["/api/tv/popular"],
    staleTime: 1000 * 60 * 15,
  });

  const { data: viewingHistory, isLoading: viewingHistoryLoading } = useQuery<ViewingHistory[]>({
    queryKey: ["/api/viewing-history"],
    staleTime: 1000 * 60 * 5,
    enabled: !!user,
  });

  const { data: favorites } = useQuery<any[]>({
    queryKey: ["/api/favorites"],
    staleTime: 1000 * 60 * 5,
    enabled: !!user,
  });

  const continueWatching = viewingHistory?.filter(
    (item) => item.watchDuration && item.totalDuration && 
    (item.watchDuration / item.totalDuration) < 0.9 && 
    (item.watchDuration / item.totalDuration) > 0.05
  ).slice(0, 12);

  const recentlyWatched = viewingHistory?.slice(0, 12);

  const recentMovies = recentlyWatched?.map((item) => ({
    id: item.mediaId,
    title: item.mediaTitle,
    poster_path: item.mediaPosterPath,
    release_date: item.mediaReleaseDate || "",
    overview: "",
    vote_average: 0,
    vote_count: 0,
    genre_ids: [],
    adult: false,
    original_language: "",
    original_title: item.mediaTitle,
    popularity: 0,
    video: false,
    backdrop_path: null,
  })) || [];

  const continueWatchingMovies = continueWatching?.map((item) => ({
    id: item.mediaId,
    title: item.mediaTitle,
    poster_path: item.mediaPosterPath,
    release_date: item.mediaReleaseDate || "",
    overview: "",
    vote_average: 0,
    vote_count: 0,
    genre_ids: [],
    adult: false,
    original_language: "",
    original_title: item.mediaTitle,
    popularity: 0,
    video: false,
    backdrop_path: null,
    watchProgress: item.watchDuration && item.totalDuration 
      ? (item.watchDuration / item.totalDuration) * 100 
      : 0,
  })) || [];

  const basedOnFavorites = favorites?.slice(0, 12).map((fav) => ({
    id: fav.mediaId,
    title: fav.mediaTitle,
    poster_path: fav.mediaPosterPath,
    release_date: fav.mediaReleaseDate || "",
    overview: "",
    vote_average: 0,
    vote_count: 0,
    genre_ids: [],
    adult: false,
    original_language: "",
    original_title: fav.mediaTitle,
    popularity: 0,
    video: false,
    backdrop_path: null,
  })) || [];

  const filterByGenre = (items: Movie[] | TVShow[] | undefined) => {
    if (!items || !selectedGenreId) return items || [];
    return items.filter(item => item.genre_ids?.includes(selectedGenreId));
  };

  const filteredTrendingMovies = useMemo(() => 
    filterByGenre(trendingMovies?.results), 
    [trendingMovies, selectedGenreId]
  );
  
  const filteredPopularMovies = useMemo(() => 
    filterByGenre(popularMovies?.results), 
    [popularMovies, selectedGenreId]
  );
  
  const filteredTrendingTV = useMemo(() => 
    filterByGenre(trendingTVShows?.results), 
    [trendingTVShows, selectedGenreId]
  );
  
  const filteredPopularTV = useMemo(() => 
    filterByGenre(popularTVShows?.results), 
    [popularTVShows, selectedGenreId]
  );

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="enhanced-home-page">
      <Header />
      
      <main className="pt-16">
        <HeroCarousel />
        
        <GenreChips onGenreChange={setSelectedGenre} selectedGenre={selectedGenre} />

        <div className="space-y-4 pb-16">
          {user && continueWatching && continueWatching.length > 0 && (
            <ContentRow
              title="Continue Watching"
              items={continueWatchingMovies}
              isLoading={viewingHistoryLoading}
              icon={<Play className="w-6 h-6" />}
              useEnhancedCards={true}
              showProgress={true}
            />
          )}

          <ContentRow
            title="Trending Movies"
            items={filteredTrendingMovies}
            isLoading={trendingMoviesLoading}
            mediaType="movie"
            icon={<TrendingUp className="w-6 h-6" />}
            viewAllLink="/movies?category=trending"
          />

          <ContentRow
            title="Popular on CineHub Pro"
            items={filteredPopularMovies}
            isLoading={popularMoviesLoading}
            mediaType="movie"
            icon={<Film className="w-6 h-6" />}
            viewAllLink="/movies?category=popular"
          />

          {user && recentlyWatched && recentlyWatched.length > 0 && (
            <ContentRow
              title="Recently Watched"
              items={recentMovies}
              isLoading={viewingHistoryLoading}
              icon={<Clock className="w-6 h-6" />}
              useEnhancedCards={true}
            />
          )}

          <ContentRow
            title="Trending TV Shows"
            items={filteredTrendingTV}
            isLoading={trendingTVShowsLoading}
            mediaType="tv"
            icon={<Tv className="w-6 h-6" />}
            viewAllLink="/tv-shows?category=trending"
          />

          <ContentRow
            title="Coming Soon"
            items={upcomingMovies?.results || []}
            isLoading={upcomingMoviesLoading}
            mediaType="movie"
            icon={<Star className="w-6 h-6" />}
            viewAllLink="/movies?category=upcoming"
          />

          <ContentRow
            title="Popular TV Shows"
            items={filteredPopularTV}
            isLoading={popularTVShowsLoading}
            mediaType="tv"
            icon={<Tv className="w-6 h-6" />}
            viewAllLink="/tv-shows?category=popular"
          />

          {user && basedOnFavorites && basedOnFavorites.length > 0 && (
            <ContentRow
              title="Based on Your Favorites"
              items={basedOnFavorites}
              icon={<Star className="w-6 h-6" />}
              useEnhancedCards={true}
            />
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
