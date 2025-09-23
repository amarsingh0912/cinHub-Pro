import { useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { MovieDetails } from "@/types/movie";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Heart, Plus, Star, Clock, Calendar, DollarSign, Play } from "lucide-react";
import { getImageUrl, formatRuntime, formatCurrency } from "@/lib/tmdb";

export default function MovieDetail() {
  const { id } = useParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: movie, isLoading: movieLoading } = useQuery<MovieDetails>({
    queryKey: ["/api/movies", id],
    enabled: !!id,
  });

  const { data: favoriteStatus } = useQuery<{ isFavorite: boolean }>({
    queryKey: ["/api/favorites", id, "check"],
    enabled: !!id && isAuthenticated,
    retry: false,
  });

  const addToFavoritesMutation = useMutation({
    mutationFn: async () => {
      if (!movie) return;
      await apiRequest("POST", "/api/favorites", {
        movieId: movie.id,
        movieTitle: movie.title,
        moviePosterPath: movie.poster_path,
        movieReleaseDate: movie.release_date,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/favorites", id, "check"] });
      toast({
        title: "Added to Favorites",
        description: `${movie?.title} has been added to your favorites.`,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to add movie to favorites.",
        variant: "destructive",
      });
    },
  });

  const removeFromFavoritesMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/favorites/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/favorites", id, "check"] });
      toast({
        title: "Removed from Favorites",
        description: `${movie?.title} has been removed from your favorites.`,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to remove movie from favorites.",
        variant: "destructive",
      });
    },
  });

  // Set page title when movie loads
  useEffect(() => {
    if (movie) {
      document.title = `${movie.title} - StreamFlix`;
    }
  }, [movie]);

  if (movieLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground" data-testid="movie-detail-loading">
        <Header />
        <div className="pt-16 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading movie details...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-background text-foreground" data-testid="movie-not-found">
        <Header />
        <div className="pt-16 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Movie Not Found</h1>
            <p className="text-muted-foreground">The movie you're looking for doesn't exist.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const isFavorite = favoriteStatus?.isFavorite;
  const trailer = movie.videos?.results?.find((video: any) => 
    video.type === "Trailer" && video.site === "YouTube"
  );

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="movie-detail-page">
      <Header />
      
      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative min-h-[70vh] flex items-end" data-testid="movie-hero">
          <div className="absolute inset-0">
            <img
              src={getImageUrl(movie.backdrop_path, 'original')}
              alt={movie.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent"></div>
          </div>
          
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-end">
              <div className="lg:col-span-1">
                <img
                  src={getImageUrl(movie.poster_path, 'w500')}
                  alt={movie.title}
                  className="w-full max-w-sm mx-auto lg:mx-0 rounded-lg shadow-2xl"
                  data-testid="movie-poster"
                />
              </div>
              
              <div className="lg:col-span-2 text-center lg:text-left">
                <h1 className="text-4xl lg:text-6xl font-display font-bold mb-4" data-testid="movie-title">
                  {movie.title}
                </h1>
                {movie.tagline && (
                  <p className="text-xl text-muted-foreground mb-6" data-testid="movie-tagline">
                    "{movie.tagline}"
                  </p>
                )}
                
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mb-6">
                  <div className="flex items-center gap-2" data-testid="movie-rating">
                    <Star className="w-5 h-5 text-yellow-500 fill-current" />
                    <span className="font-semibold">{movie.vote_average.toFixed(1)}</span>
                    <span className="text-muted-foreground">({movie.vote_count.toLocaleString()} votes)</span>
                  </div>
                  
                  {movie.runtime && (
                    <div className="flex items-center gap-2" data-testid="movie-runtime">
                      <Clock className="w-5 h-5 text-muted-foreground" />
                      <span>{formatRuntime(movie.runtime)}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2" data-testid="movie-release-date">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <span>{new Date(movie.release_date).getFullYear()}</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-6" data-testid="movie-genres">
                  {movie.genres?.map((genre: any) => (
                    <Badge key={genre.id} variant="secondary">
                      {genre.name}
                    </Badge>
                  ))}
                </div>
                
                <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                  {trailer && (
                    <Button size="lg" className="flex items-center gap-2" data-testid="button-watch-trailer">
                      <Play className="w-5 h-5" />
                      Watch Trailer
                    </Button>
                  )}
                  
                  {isAuthenticated && (
                    <>
                      <Button
                        variant={isFavorite ? "destructive" : "outline"}
                        size="lg"
                        onClick={() => isFavorite ? removeFromFavoritesMutation.mutate() : addToFavoritesMutation.mutate()}
                        disabled={addToFavoritesMutation.isPending || removeFromFavoritesMutation.isPending}
                        className="flex items-center gap-2"
                        data-testid="button-favorite"
                      >
                        <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                        {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                      </Button>
                      
                      <Button variant="outline" size="lg" className="flex items-center gap-2" data-testid="button-add-to-watchlist">
                        <Plus className="w-5 h-5" />
                        Add to Watchlist
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Movie Details */}
        <section className="py-12" data-testid="movie-details">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2">
                <h2 className="text-2xl font-display font-bold mb-4" data-testid="overview-title">Overview</h2>
                <p className="text-lg text-muted-foreground leading-relaxed mb-8" data-testid="movie-overview">
                  {movie.overview}
                </p>
                
                {movie.credits?.cast && (
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold mb-4" data-testid="cast-title">Top Cast</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4" data-testid="cast-grid">
                      {movie.credits.cast.slice(0, 8).map((actor: any) => (
                        <div key={actor.id} className="text-center">
                          <img
                            src={getImageUrl(actor.profile_path, 'w200')}
                            alt={actor.name}
                            className="w-full aspect-[2/3] object-cover rounded-lg mb-2"
                            data-testid={`actor-image-${actor.id}`}
                          />
                          <h4 className="font-medium" data-testid={`actor-name-${actor.id}`}>{actor.name}</h4>
                          <p className="text-sm text-muted-foreground" data-testid={`actor-character-${actor.id}`}>
                            {actor.character}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <div className="bg-card rounded-lg p-6 border border-border" data-testid="movie-info-card">
                  <h3 className="text-xl font-semibold mb-4">Movie Info</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-muted-foreground">Status</h4>
                      <p data-testid="movie-status">{movie.status}</p>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="font-medium text-muted-foreground">Original Language</h4>
                      <p data-testid="movie-language">{movie.original_language.toUpperCase()}</p>
                    </div>
                    
                    {movie.budget > 0 && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="font-medium text-muted-foreground">Budget</h4>
                          <p data-testid="movie-budget">{formatCurrency(movie.budget)}</p>
                        </div>
                      </>
                    )}
                    
                    {movie.revenue > 0 && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="font-medium text-muted-foreground">Revenue</h4>
                          <p data-testid="movie-revenue">{formatCurrency(movie.revenue)}</p>
                        </div>
                      </>
                    )}
                    
                    {movie.production_companies?.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="font-medium text-muted-foreground">Production Companies</h4>
                          <div className="space-y-2">
                            {movie.production_companies.slice(0, 3).map((company: any) => (
                              <p key={company.id} data-testid={`company-${company.id}`}>{company.name}</p>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
