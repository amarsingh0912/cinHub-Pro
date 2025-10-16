import { useEffect, useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, Plus, Star, Calendar, Play, Tv, Users, MessageSquare, Info, Film } from "lucide-react";
import { getImageUrl } from "@/lib/tmdb";
import { ExpandableText } from "@/components/ui/expandable-text";
import { Link } from "wouter";
import MovieCard from "@/components/movie/movie-card";
import MovieCardSkeleton from "@/components/movie/movie-card-skeleton";
import CastCardSkeleton from "@/components/movie/cast-card-skeleton";

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
    queryKey: ["/api/favorites", "tv", id, "check"],
    enabled: !!id && isAuthenticated,
    retry: false,
  });

  const { data: reviews, isLoading: reviewsLoading } = useQuery<any[]>({
    queryKey: ["/api/reviews", "tv", id],
    enabled: !!id,
    retry: false,
  });

  const { data: watchlists } = useQuery<any[]>({
    queryKey: ["/api/watchlists"],
    enabled: isAuthenticated,
    retry: false,
  });

  // Watchlist dialog state
  const [isWatchlistDialogOpen, setIsWatchlistDialogOpen] = useState(false);
  const [selectedWatchlistId, setSelectedWatchlistId] = useState<string>("");
  
  // Trailer modal state
  const [isTrailerModalOpen, setIsTrailerModalOpen] = useState(false);

  // Viewing history tracking mutation
  const trackViewingHistoryMutation = useMutation({
    mutationFn: async () => {
      if (!tvShow) return;
      await apiRequest("POST", "/api/viewing-history", {
        mediaType: 'tv',
        mediaId: tvShow.id,
        mediaTitle: tvShow.name,
        mediaPosterPath: tvShow.poster_path,
        mediaReleaseDate: tvShow.first_air_date
      });
    },
    onError: (error) => {
      // Silent fail for viewing history - don't show error to user
      console.log('Failed to track viewing history:', error);
    },
  });

  // Track viewing history when TV show loads and user is authenticated
  useEffect(() => {
    if (tvShow && isAuthenticated && !authLoading) {
      trackViewingHistoryMutation.mutate();
    }
  }, [tvShow, isAuthenticated, authLoading]);

  const addToFavoritesMutation = useMutation({
    mutationFn: async () => {
      if (!tvShow) return;
      await apiRequest("POST", "/api/favorites", {
        mediaType: 'tv',
        mediaId: tvShow.id,
        mediaTitle: tvShow.name,
        mediaPosterPath: tvShow.poster_path,
        mediaReleaseDate: tvShow.first_air_date
      });
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/favorites", "tv", id, "check"] });
      
      // Track activity history
      try {
        await apiRequest("POST", "/api/activity-history", {
          activityType: 'favorite_added',
          entityType: 'tv',
          entityId: tvShow?.id?.toString(),
          entityTitle: tvShow?.name,
          description: `Added "${tvShow?.name}" to favorites`
        });
      } catch (error) {
        console.log('Failed to track activity history:', error);
      }
      
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
      await apiRequest("DELETE", `/api/favorites/tv/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/favorites", "tv", id, "check"] });
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

  const addToWatchlistMutation = useMutation({
    mutationFn: async () => {
      if (!tvShow || !selectedWatchlistId) return;
      await apiRequest("POST", `/api/watchlists/${selectedWatchlistId}/items`, {
        mediaType: "tv",
        mediaId: tvShow.id,
        mediaTitle: tvShow.name,
        mediaPosterPath: tvShow.poster_path,
        mediaReleaseDate: tvShow.first_air_date,
      });
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlists"] });
      
      // Track activity history
      try {
        await apiRequest("POST", "/api/activity-history", {
          activityType: "watchlist_item_added",
          entityType: "tv",
          entityId: tvShow?.id?.toString(),
          entityTitle: tvShow?.name,
          description: `Added "${tvShow?.name}" to watchlist`
        });
      } catch (error) {
        console.log("Failed to track activity history:", error);
      }
      
      setIsWatchlistDialogOpen(false);
      setSelectedWatchlistId("");
      toast({
        title: "Added to Watchlist",
        description: `${tvShow?.name} has been added to your watchlist.`,
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
        description: "Failed to add TV show to watchlist.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (tvShow) {
      document.title = `${tvShow.name} - StreamFlix`;
    }
  }, [tvShow]);

  if (tvLoading) {
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
                      <Link key={genre.id} href={`/genre/${genre.id}`}>
                        <Badge 
                          variant="secondary" 
                          className="text-sm cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                          data-testid={`genre-${genre.id}`}
                        >
                          {genre.name}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4 justify-center lg:justify-start" data-testid="tv-actions">
                  {trailerVideo && (
                    <Button
                      size="lg"
                      className="min-w-[140px]"
                      onClick={() => setIsTrailerModalOpen(true)}
                      data-testid="button-play-trailer"
                    >
                      <Play className="w-5 h-5 mr-2" />
                      Play Trailer
                    </Button>
                  )}
                  
                  {isAuthenticated ? (
                    <>
                      {favoriteStatus?.isFavorite ? (
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
                      )}
                      
                      <Button 
                        variant="outline" 
                        size="lg" 
                        className="min-w-[140px] flex items-center gap-2" 
                        onClick={() => setIsWatchlistDialogOpen(true)}
                        data-testid="button-add-to-watchlist"
                      >
                        <Plus className="w-5 h-5" />
                        Add to Watchlist
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* TV Show Content */}
        <section className="py-12" data-testid="tv-content">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Overview */}
            <div className="mb-8">
              <h2 className="text-2xl font-display font-bold mb-4" data-testid="overview-title">Overview</h2>
              <p className="text-lg text-muted-foreground leading-relaxed" data-testid="tv-overview">
                {tvShow.overview || "No overview available for this TV show."}
              </p>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="cast" className="w-full" data-testid="tv-tabs">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="cast" className="flex items-center gap-2" data-testid="tab-cast">
                  <Users className="w-4 h-4" />
                  Cast & Crew
                </TabsTrigger>
                <TabsTrigger value="reviews" className="flex items-center gap-2" data-testid="tab-reviews">
                  <MessageSquare className="w-4 h-4" />
                  Reviews
                </TabsTrigger>
                <TabsTrigger value="details" className="flex items-center gap-2" data-testid="tab-details">
                  <Info className="w-4 h-4" />
                  Details
                </TabsTrigger>
                <TabsTrigger value="stills" className="flex items-center gap-2" data-testid="tab-stills">
                  <Film className="w-4 h-4" />
                  TV Stills
                </TabsTrigger>
              </TabsList>

              {/* Cast & Crew Tab */}
              <TabsContent value="cast" className="mt-6" data-testid="content-cast">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Cast */}
                  <div>
                    <h3 className="text-xl font-semibold mb-6" data-testid="cast-title">Cast</h3>
                    {tvShow.credits?.cast && tvShow.credits.cast.length > 0 ? (
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2" data-testid="cast-grid">
                        {tvShow.credits.cast.slice(0, 12).map((actor: any) => (
                          <Link key={actor.id} href={"/person/" + actor.id}>
                            <div className="text-center cursor-pointer group hover:scale-105 transition-transform">
                              <div className="w-full aspect-[2/3] bg-muted rounded-lg mb-3 overflow-hidden flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                                {actor.profile_path ? (
                                  <img
                                    src={getImageUrl(actor.profile_path, 'w500')}
                                    alt={actor.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                    data-testid={`actor-image-${actor.id}`}
                                  />
                                ) : (
                                  <Users className="w-12 h-12 text-muted-foreground" />
                                )}
                              </div>
                              <h4 className="font-semibold text-sm group-hover:text-primary transition-colors" data-testid={`actor-name-${actor.id}`}>{actor.name}</h4>
                              <p className="text-xs text-muted-foreground mt-1" data-testid={`actor-character-${actor.id}`}>
                                {actor.character}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2" data-testid="cast-loading">
                        {Array.from({ length: 12 }).map((_, i) => (
                          <CastCardSkeleton key={i} />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Crew */}
                  <div>
                    <h3 className="text-xl font-semibold mb-6" data-testid="crew-title">Key Crew</h3>
                    {tvShow.credits?.crew && tvShow.credits.crew.filter((person: any) => ['Director', 'Producer', 'Writer', 'Executive Producer', 'Creator'].includes(person.job)).length > 0 ? (
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2" data-testid="crew-grid">
                        {tvShow.credits.crew
                          .filter((person: any) => ['Director', 'Producer', 'Writer', 'Executive Producer', 'Creator'].includes(person.job))
                          .slice(0, 6)
                          .map((person: any, index: number) => (
                            <Link key={`${person.id}-${index}`} href={"/person/" + person.id}>
                              <div className="text-center cursor-pointer group hover:scale-105 transition-transform">
                                <div className="w-full aspect-[2/3] bg-muted rounded-lg mb-3 overflow-hidden flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                                  {person.profile_path ? (
                                    <img
                                      src={getImageUrl(person.profile_path, 'w200')}
                                      alt={person.name}
                                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                      data-testid={`crew-image-${person.id}`}
                                    />
                                  ) : (
                                    <Users className="w-12 h-12 text-muted-foreground" />
                                  )}
                                </div>
                                <h4 className="font-semibold text-sm group-hover:text-primary transition-colors" data-testid={`crew-name-${person.id}`}>{person.name}</h4>
                                <p className="text-xs text-muted-foreground mt-1" data-testid={`crew-job-${person.id}`}>
                                  {person.job}
                                </p>
                              </div>
                            </Link>
                          ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2" data-testid="crew-loading">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <CastCardSkeleton key={i} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews" className="mt-6" data-testid="content-reviews">
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold" data-testid="reviews-title">User Reviews</h3>
                  {reviewsLoading ? (
                    <div className="text-center py-8" data-testid="reviews-loading">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading reviews...</p>
                    </div>
                  ) : reviews && reviews.length > 0 ? (
                    <div className="space-y-4" data-testid="reviews-list">
                      {reviews.map((review: any) => (
                        <div key={review.id} className="bg-card rounded-lg p-6 border border-border">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h4 className="font-medium" data-testid={`review-author-${review.id}`}>
                                {review.author_name || 'Anonymous'}
                              </h4>
                              {review.rating && (
                                <div className="flex items-center gap-2 mt-1">
                                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                  <span className="text-sm" data-testid={`review-rating-${review.id}`}>
                                    {review.rating}/10
                                  </span>
                                </div>
                              )}
                            </div>
                            <span className="text-sm text-muted-foreground" data-testid={`review-date-${review.id}`}>
                              {new Date(review.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <ExpandableText 
                            text={review.content}
                            testId={`review-content-${review.id}`}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8" data-testid="no-reviews">
                      <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No reviews available for this TV show.</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Details Tab */}
              <TabsContent value="details" className="mt-6" data-testid="content-details">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-card rounded-lg p-6 border border-border" data-testid="tv-info-card">
                    <h3 className="text-xl font-semibold mb-4">TV Show Information</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-muted-foreground">First Air Date</h4>
                        <p data-testid="tv-release-date">
                          {tvShow.first_air_date ? new Date(tvShow.first_air_date).toLocaleDateString() : 'TBA'}
                        </p>
                      </div>
                      
                      {tvShow.last_air_date && (
                        <>
                          <Separator />
                          <div>
                            <h4 className="font-medium text-muted-foreground">Last Air Date</h4>
                            <p data-testid="tv-last-air-date">
                              {new Date(tvShow.last_air_date).toLocaleDateString()}
                            </p>
                          </div>
                        </>
                      )}
                      
                      <Separator />
                      
                      <div>
                        <h4 className="font-medium text-muted-foreground">Status</h4>
                        <p data-testid="tv-status">{tvShow.status}</p>
                      </div>
                      
                      {tvShow.type && (
                        <>
                          <Separator />
                          <div>
                            <h4 className="font-medium text-muted-foreground">Type</h4>
                            <p data-testid="tv-type">{tvShow.type}</p>
                          </div>
                        </>
                      )}
                      
                      <Separator />
                      
                      <div>
                        <h4 className="font-medium text-muted-foreground">Episodes</h4>
                        <p data-testid="tv-episodes">{tvShow.number_of_episodes}</p>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h4 className="font-medium text-muted-foreground">Seasons</h4>
                        <p data-testid="tv-seasons-count">{tvShow.number_of_seasons}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card rounded-lg p-6 border border-border" data-testid="production-info-card">
                    <h3 className="text-xl font-semibold mb-4">Production</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-muted-foreground">Episode Runtime</h4>
                        <p data-testid="tv-episode-runtime">{formatRuntime(tvShow.episode_run_time)}</p>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h4 className="font-medium text-muted-foreground">Original Language</h4>
                        <p data-testid="tv-language">{tvShow.original_language.toUpperCase()}</p>
                      </div>
                      
                      {tvShow.networks && tvShow.networks.length > 0 && (
                        <>
                          <Separator />
                          <div>
                            <h4 className="font-medium text-muted-foreground">Networks</h4>
                            <div className="space-y-1">
                              {tvShow.networks.map((network: any) => (
                                <p key={network.id} data-testid={`network-${network.id}`}>
                                  {network.name}
                                </p>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                      
                      {tvShow.production_companies && tvShow.production_companies.length > 0 && (
                        <>
                          <Separator />
                          <div>
                            <h4 className="font-medium text-muted-foreground">Production Companies</h4>
                            <div className="space-y-1">
                              {tvShow.production_companies.slice(0, 5).map((company: any) => (
                                <p key={company.id} data-testid={`company-${company.id}`}>
                                  {company.name}
                                </p>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* TV Stills Tab */}
              <TabsContent value="stills" className="mt-6" data-testid="content-stills">
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold">TV Show Images</h3>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {tvShow.poster_path && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground">Poster</h4>
                        <a 
                          href={getImageUrl(tvShow.poster_path, 'original')} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="block aspect-[2/3] overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer" 
                          data-testid="tv-poster-still"
                        >
                          <img
                            src={getImageUrl(tvShow.poster_path, 'w780')}
                            alt={`${tvShow.name} - Poster`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </a>
                      </div>
                    )}
                    
                    {tvShow.backdrop_path && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground">Backdrop</h4>
                        <a 
                          href={getImageUrl(tvShow.backdrop_path, 'original')} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="block aspect-[2/3] overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer" 
                          data-testid="tv-backdrop-still"
                        >
                          <img
                            src={getImageUrl(tvShow.backdrop_path, 'w780')}
                            alt={`${tvShow.name} - Backdrop`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </a>
                      </div>
                    )}
                  </div>
                  
                  {!tvShow.poster_path && !tvShow.backdrop_path && (
                    <div className="text-center py-12">
                      <Film className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No images available for this TV show</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* Similar and Recommended TV Shows Section */}
        <section className="container mx-auto px-4 py-8">
          <Tabs defaultValue="recommended" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="recommended" data-testid="tab-recommended">Recommended</TabsTrigger>
              <TabsTrigger value="similar" data-testid="tab-similar">Similar</TabsTrigger>
            </TabsList>
            
            <TabsContent value="recommended" className="mt-6">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" data-testid="heading-recommended">Recommended TV Shows</h2>
                {tvShow?.recommendations?.results && tvShow.recommendations.results.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {tvShow.recommendations.results.slice(0, 12).map((rec: any) => (
                      <MovieCard key={rec.id} movie={rec} mediaType="tv" />
                    ))}
                  </div>
                ) : tvShow?.recommendations?.results ? (
                  <p className="text-muted-foreground text-center py-8" data-testid="no-recommended">
                    No recommended TV shows available.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6" data-testid="recommended-loading">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <MovieCardSkeleton key={i} />
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="similar" className="mt-6">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" data-testid="heading-similar">Similar TV Shows</h2>
                {tvShow?.similar?.results && tvShow.similar.results.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {tvShow.similar.results.slice(0, 12).map((sim: any) => (
                      <MovieCard key={sim.id} movie={sim} mediaType="tv" />
                    ))}
                  </div>
                ) : tvShow?.similar?.results ? (
                  <p className="text-muted-foreground text-center py-8" data-testid="no-similar">
                    No similar TV shows available.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6" data-testid="similar-loading">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <MovieCardSkeleton key={i} />
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </section>
      </main>

      {/* Add to Watchlist Dialog */}
      <Dialog open={isWatchlistDialogOpen} onOpenChange={setIsWatchlistDialogOpen}>
        <DialogContent data-testid="add-to-watchlist-dialog">
          <DialogHeader>
            <DialogTitle>Add to Watchlist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select a watchlist to add "{tvShow?.name}" to:
            </p>
            {watchlists && watchlists.length > 0 ? (
              <>
                <Select value={selectedWatchlistId} onValueChange={setSelectedWatchlistId}>
                  <SelectTrigger data-testid="select-watchlist">
                    <SelectValue placeholder="Choose a watchlist" />
                  </SelectTrigger>
                  <SelectContent>
                    {watchlists.map((watchlist: any) => (
                      <SelectItem key={watchlist.id} value={watchlist.id} data-testid={`watchlist-option-${watchlist.id}`}>
                        {watchlist.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsWatchlistDialogOpen(false);
                      setSelectedWatchlistId("");
                    }}
                    data-testid="button-cancel-watchlist"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => addToWatchlistMutation.mutate()}
                    disabled={!selectedWatchlistId || addToWatchlistMutation.isPending}
                    data-testid="button-add-to-selected-watchlist"
                  >
                    Add to Watchlist
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-4">
                  You don't have any watchlists yet. Create one first to add TV shows.
                </p>
                <Button
                  onClick={() => {
                    setIsWatchlistDialogOpen(false);
                    // Navigate to dashboard or show create watchlist dialog
                    window.location.href = '/dashboard';
                  }}
                  data-testid="button-go-to-dashboard"
                >
                  Go to Dashboard
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Trailer Modal */}
      <Dialog open={isTrailerModalOpen} onOpenChange={setIsTrailerModalOpen}>
        <DialogContent className="max-w-4xl w-full p-0" data-testid="trailer-modal">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>Watch Trailer</DialogTitle>
          </DialogHeader>
          <div className="p-6 pt-4">
            {trailerVideo && (
              <div className="aspect-video w-full">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${trailerVideo.key}?autoplay=1&rel=0`}
                  title="TV Show Trailer"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="rounded-lg"
                  data-testid="trailer-iframe"
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
}