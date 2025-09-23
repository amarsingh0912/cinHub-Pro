import { useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { TVShowDetails } from "@/types/movie";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Heart, Plus, Star, Calendar, Play, Tv } from "lucide-react";
import { getImageUrl } from "@/lib/tmdb";

export default function TVDetail() {
  const { id } = useParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tvShow, isLoading: tvLoading } = useQuery<TVShowDetails>({
    queryKey: ["/api/tv", id],
    enabled: !!id,
  });

  const { data: favoriteStatus } = useQuery<{ isFavorite: boolean }>({
    queryKey: ["/api/favorites", id, "check"],
    enabled: !!id && isAuthenticated,
    retry: false,
  });

  const addToFavoritesMutation = useMutation({
    mutationFn: async () => {
      if (!tvShow) return;
      await apiRequest("POST", "/api/favorites", {
        movieId: tvShow.id,
        movieTitle: tvShow.name,
        moviePosterPath: tvShow.poster_path,
        movieReleaseDate: tvShow.first_air_date,
        mediaType: 'tv'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/favorites", id, "check"] });
      toast({
        title: "Added to Favorites",
        description: `${tvShow?.name} has been added to your favorites.`,
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
        description: "Failed to add TV show to favorites.",
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
        description: `${tvShow?.name} has been removed from your favorites.`,
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
        description: "Failed to remove TV show from favorites.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (tvShow) {
      document.title = `${tvShow.name} - StreamFlix`;
    }
  }, [tvShow]);

  if (tvLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground" data-testid="tv-loading">
        <Header />
        <div className="pt-16 flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!tvShow) {
    return (
      <div className="min-h-screen bg-background text-foreground" data-testid="tv-not-found">
        <Header />
        <div className="pt-16 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">TV Show Not Found</h1>
            <p className="text-muted-foreground">The TV show you're looking for doesn't exist.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const formatRuntime = (runtime: number[]) => {
    if (!runtime || runtime.length === 0) return "N/A";
    return `${runtime[0]} min`;
  };

  const trailerVideo = tvShow.videos?.results.find(video => video.type === "Trailer" && video.site === "YouTube");

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="tv-detail-page">
      <Header />
      
      <main className="pt-16">
        {/* Hero Section */}
        <section 
          className="relative min-h-[70vh] flex items-end"
          style={{
            backgroundImage: tvShow.backdrop_path 
              ? `linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.8) 100%), url(${getImageUrl(tvShow.backdrop_path, 'original')})`
              : 'linear-gradient(45deg, #1a1a1a 0%, #2d2d2d 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
          data-testid="tv-hero-section"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-end">
              {/* Poster */}
              <div className="flex justify-center lg:justify-start">
                <div className="w-80 aspect-[2/3] relative overflow-hidden rounded-lg bg-accent shadow-2xl" data-testid="tv-poster">
                  {tvShow.poster_path ? (
                    <img
                      src={getImageUrl(tvShow.poster_path, 'w500')}
                      alt={tvShow.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Tv className="w-16 h-16 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>
              
              {/* TV Show Info */}
              <div className="lg:col-span-2 text-center lg:text-left">
                <h1 className="text-4xl md:text-6xl font-display font-bold mb-4 text-white" data-testid="tv-title">
                  {tvShow.name}
                </h1>
                
                {tvShow.tagline && (
                  <p className="text-xl text-gray-300 mb-6 italic" data-testid="tv-tagline">
                    "{tvShow.tagline}"
                  </p>
                )}
                
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mb-6" data-testid="tv-metadata">
                  <div className="flex items-center gap-2 text-secondary">
                    <Star className="w-5 h-5 fill-current" />
                    <span className="font-semibold" data-testid="tv-rating">{tvShow.vote_average.toFixed(1)}</span>
                    <span className="text-gray-400">({tvShow.vote_count.toLocaleString()} votes)</span>
                  </div>
                  
                  <Separator orientation="vertical" className="h-6 bg-gray-500" />
                  
                  <div className="flex items-center gap-2 text-gray-300">
                    <Calendar className="w-5 h-5" />
                    <span data-testid="tv-year">{tvShow.first_air_date ? new Date(tvShow.first_air_date).getFullYear() : 'TBA'}</span>
                  </div>
                  
                  <Separator orientation="vertical" className="h-6 bg-gray-500" />
                  
                  <div className="flex items-center gap-2 text-gray-300">
                    <Tv className="w-5 h-5" />
                    <span data-testid="tv-runtime">{formatRuntime(tvShow.episode_run_time)}</span>
                  </div>
                  
                  {tvShow.number_of_seasons && (
                    <>
                      <Separator orientation="vertical" className="h-6 bg-gray-500" />
                      <span className="text-gray-300" data-testid="tv-seasons">
                        {tvShow.number_of_seasons} Season{tvShow.number_of_seasons !== 1 ? 's' : ''}
                      </span>
                    </>
                  )}
                </div>
                
                {/* Genres */}
                {tvShow.genres && tvShow.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-8 justify-center lg:justify-start" data-testid="tv-genres">
                    {tvShow.genres.map((genre) => (
                      <Badge key={genre.id} variant="secondary" className="text-sm">
                        {genre.name}
                      </Badge>
                    ))}
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4 justify-center lg:justify-start" data-testid="tv-actions">
                  {trailerVideo && (
                    <Button
                      size="lg"
                      className="min-w-[140px]"
                      onClick={() => window.open(`https://www.youtube.com/watch?v=${trailerVideo.key}`, '_blank')}
                      data-testid="button-play-trailer"
                    >
                      <Play className="w-5 h-5 mr-2" />
                      Play Trailer
                    </Button>
                  )}
                  
                  {isAuthenticated ? (
                    favoriteStatus?.isFavorite ? (
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => removeFromFavoritesMutation.mutate()}
                        disabled={removeFromFavoritesMutation.isPending}
                        className="min-w-[140px]"
                        data-testid="button-remove-favorite"
                      >
                        <Heart className="w-5 h-5 mr-2 fill-current text-red-500" />
                        Remove Favorite
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => addToFavoritesMutation.mutate()}
                        disabled={addToFavoritesMutation.isPending}
                        className="min-w-[140px]"
                        data-testid="button-add-favorite"
                      >
                        <Heart className="w-5 h-5 mr-2" />
                        Add to Favorites
                      </Button>
                    )
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Content Section */}
        <section className="py-16" data-testid="tv-content-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Overview */}
                <div data-testid="tv-overview-section">
                  <h2 className="text-2xl font-display font-bold mb-4">Overview</h2>
                  <p className="text-muted-foreground leading-relaxed" data-testid="tv-overview">
                    {tvShow.overview || "No overview available for this TV show."}
                  </p>
                </div>
                
                {/* Cast */}
                {tvShow.credits?.cast && tvShow.credits.cast.length > 0 && (
                  <div data-testid="tv-cast-section">
                    <h2 className="text-2xl font-display font-bold mb-6">Cast</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {tvShow.credits.cast.slice(0, 10).map((actor) => (
                        <div key={actor.id} className="text-center group" data-testid={`cast-member-${actor.id}`}>
                          <div className="aspect-[2/3] relative overflow-hidden rounded-lg bg-accent mb-2">
                            {actor.profile_path ? (
                              <img
                                src={getImageUrl(actor.profile_path, 'w200')}
                                alt={actor.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <div className="w-full h-full bg-muted flex items-center justify-center">
                                <span className="text-muted-foreground text-xs">No Photo</span>
                              </div>
                            )}
                          </div>
                          <h3 className="font-semibold text-sm truncate" data-testid={`actor-name-${actor.id}`}>
                            {actor.name}
                          </h3>
                          <p className="text-xs text-muted-foreground truncate" data-testid={`character-name-${actor.id}`}>
                            {actor.character}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Sidebar */}
              <div className="space-y-8">
                {/* TV Show Details */}
                <div data-testid="tv-details-sidebar">
                  <h3 className="text-xl font-display font-bold mb-4">TV Show Details</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-semibold text-muted-foreground">First Air Date:</span>
                      <p data-testid="tv-release-date">
                        {tvShow.first_air_date ? new Date(tvShow.first_air_date).toLocaleDateString() : 'TBA'}
                      </p>
                    </div>
                    
                    {tvShow.last_air_date && (
                      <div>
                        <span className="font-semibold text-muted-foreground">Last Air Date:</span>
                        <p data-testid="tv-last-air-date">
                          {new Date(tvShow.last_air_date).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    
                    <div>
                      <span className="font-semibold text-muted-foreground">Status:</span>
                      <p data-testid="tv-status">{tvShow.status}</p>
                    </div>
                    
                    {tvShow.type && (
                      <div>
                        <span className="font-semibold text-muted-foreground">Type:</span>
                        <p data-testid="tv-type">{tvShow.type}</p>
                      </div>
                    )}
                    
                    <div>
                      <span className="font-semibold text-muted-foreground">Episodes:</span>
                      <p data-testid="tv-episodes">{tvShow.number_of_episodes}</p>
                    </div>
                    
                    <div>
                      <span className="font-semibold text-muted-foreground">Seasons:</span>
                      <p data-testid="tv-seasons-count">{tvShow.number_of_seasons}</p>
                    </div>
                    
                    <div>
                      <span className="font-semibold text-muted-foreground">Episode Runtime:</span>
                      <p data-testid="tv-episode-runtime">{formatRuntime(tvShow.episode_run_time)}</p>
                    </div>
                    
                    <div>
                      <span className="font-semibold text-muted-foreground">Original Language:</span>
                      <p data-testid="tv-language">{tvShow.original_language.toUpperCase()}</p>
                    </div>
                    
                    {tvShow.networks && tvShow.networks.length > 0 && (
                      <div>
                        <span className="font-semibold text-muted-foreground">Networks:</span>
                        <p data-testid="tv-networks">
                          {tvShow.networks.map(network => network.name).join(', ')}
                        </p>
                      </div>
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