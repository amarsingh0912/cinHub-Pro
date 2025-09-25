import { useParams } from "wouter";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { MovieResponse } from "@/types/movie";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MovieCard from "@/components/movie/movie-card";
import MovieCardSkeleton from "@/components/movie/movie-card-skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Film, Tv } from "lucide-react";

// Genre ID to name mapping for movies
const MOVIE_GENRES: Record<string, string> = {
  '28': 'Action',
  '12': 'Adventure', 
  '16': 'Animation',
  '35': 'Comedy',
  '80': 'Crime',
  '99': 'Documentary',
  '18': 'Drama',
  '10751': 'Family',
  '14': 'Fantasy',
  '36': 'History',
  '27': 'Horror',
  '10402': 'Music',
  '9648': 'Mystery',
  '10749': 'Romance',
  '878': 'Science Fiction',
  '53': 'Thriller',
  '10752': 'War',
  '37': 'Western'
};

// Genre ID to name mapping for TV shows
const TV_GENRES: Record<string, string> = {
  '10759': 'Action & Adventure',
  '16': 'Animation',
  '35': 'Comedy',
  '80': 'Crime',
  '99': 'Documentary',
  '18': 'Drama',
  '10751': 'Family',
  '10762': 'Kids',
  '9648': 'Mystery',
  '10763': 'News',
  '10764': 'Reality',
  '10765': 'Sci-Fi & Fantasy',
  '10766': 'Soap',
  '10767': 'Talk',
  '10768': 'War & Politics',
  '37': 'Western'
};

export default function Genre() {
  const { genreId } = useParams();
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState("movies");

  const genreName = activeTab === "movies" ? MOVIE_GENRES[genreId || ''] : TV_GENRES[genreId || ''];

  const { data: moviesData, isLoading: moviesLoading } = useQuery<MovieResponse>({
    queryKey: [`/api/movies/genre/${genreId}`, { page }],
    enabled: !!genreId && activeTab === "movies",
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { data: tvData, isLoading: tvLoading } = useQuery<MovieResponse>({
    queryKey: [`/api/tv/genre/${genreId}`, { page }],
    enabled: !!genreId && activeTab === "tv",
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const isLoading = activeTab === "movies" ? moviesLoading : tvLoading;
  const data = activeTab === "movies" ? moviesData : tvData;

  const loadMore = () => {
    if (data?.total_pages && page < data.total_pages) {
      setPage(page + 1);
    }
  };

  if (!genreId || !genreName) {
    return (
      <div className="min-h-screen bg-background text-foreground" data-testid="genre-not-found">
        <Header />
        <div className="pt-16 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Genre Not Found</h1>
            <p className="text-muted-foreground">The genre you're looking for doesn't exist.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="genre-page">
      <Header />
      
      <main className="pt-16">
        {/* Genre Header */}
        <section className="py-12 border-b border-border" data-testid="genre-header">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center mx-auto mb-6">
                {activeTab === "movies" ? (
                  <Film className="w-10 h-10 text-white" />
                ) : (
                  <Tv className="w-10 h-10 text-white" />
                )}
              </div>
              <h1 className="text-4xl font-display font-bold mb-4" data-testid="genre-title">
                {genreName}
              </h1>
              <p className="text-xl text-muted-foreground" data-testid="genre-description">
                Discover the best {genreName.toLowerCase()} {activeTab === "movies" ? "movies" : "TV shows"} from around the world
              </p>
            </div>
          </div>
        </section>

        {/* Content Tabs */}
        <section className="py-8" data-testid="genre-content">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
                <TabsTrigger value="movies" data-testid="tab-movies">
                  <Film className="w-4 h-4 mr-2" />
                  Movies
                </TabsTrigger>
                <TabsTrigger value="tv" data-testid="tab-tv">
                  <Tv className="w-4 h-4 mr-2" />
                  TV Shows
                </TabsTrigger>
              </TabsList>

              <TabsContent value="movies" data-testid="movies-grid">
                {isLoading && page === 1 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {Array.from({ length: 18 }).map((_, index) => (
                      <MovieCardSkeleton key={index} />
                    ))}
                  </div>
                ) : data?.results && data.results.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 mb-8">
                      {data.results.map((movie: any) => (
                        <MovieCard key={`movie-${movie.id}`} movie={movie} />
                      ))}
                    </div>
                    
                    {/* Load More Button */}
                    {data.total_pages && page < data.total_pages && (
                      <div className="text-center">
                        <Button
                          onClick={loadMore}
                          variant="outline"
                          size="lg"
                          disabled={isLoading}
                          data-testid="button-load-more"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            'Load More Movies'
                          )}
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12" data-testid="empty-movies">
                    <Film className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No movies found for this genre.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="tv" data-testid="tv-grid">
                {isLoading && page === 1 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {Array.from({ length: 18 }).map((_, index) => (
                      <MovieCardSkeleton key={index} />
                    ))}
                  </div>
                ) : data?.results && data.results.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 mb-8">
                      {data.results.map((show: any) => (
                        <MovieCard key={`tv-${show.id}`} movie={show} isTV={true} />
                      ))}
                    </div>
                    
                    {/* Load More Button */}
                    {data.total_pages && page < data.total_pages && (
                      <div className="text-center">
                        <Button
                          onClick={loadMore}
                          variant="outline"
                          size="lg"
                          disabled={isLoading}
                          data-testid="button-load-more"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            'Load More TV Shows'
                          )}
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12" data-testid="empty-tv">
                    <Tv className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No TV shows found for this genre.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}