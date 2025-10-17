import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useCacheStatus } from "@/hooks/useCacheStatus";
import { useOfflineDetection } from "@/hooks/useOfflineDetection";
import type { MovieDetails, TVShowDetails } from "@/types/movie";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, Plus, Star, Clock, Calendar, Play, Users, MessageSquare, Info, Images, Film, Tv } from "lucide-react";
import { getImageUrl, formatRuntime, formatCurrency } from "@/lib/tmdb";
import { CacheStatus } from "@/components/ui/cache-status";
import MovieCard from "@/components/movie/movie-card";
import MovieCardSkeleton from "@/components/movie/movie-card-skeleton";
import CastCardSkeleton from "@/components/movie/cast-card-skeleton";
import TrailerModal from "@/components/movie/trailer-modal";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

interface Review {
  id: string | number;
  username: string;
  rating: number;
  review: string;
  createdAt: string;
}

interface Watchlist {
  id: number;
  name: string;
}

interface DetailsLayoutProps {
  type: 'movie' | 'tv';
  data?: MovieDetails | TVShowDetails;
  isLoading: boolean;
  error?: Error | null;
  favoriteStatus?: { isFavorite: boolean };
  reviews?: Review[];
  reviewsLoading?: boolean;
  watchlists?: Watchlist[];
  onAddToFavorites: () => void;
  onRemoveFromFavorites: () => void;
  onAddToWatchlist: (watchlistId: string) => void;
  onSubmitReview: (rating: number, text: string) => void;
  addToFavoritesPending?: boolean;
  removeFromFavoritesPending?: boolean;
  addToWatchlistPending?: boolean;
  submitReviewPending?: boolean;
}

export default function DetailsLayout({
  type,
  data,
  isLoading,
  error,
  favoriteStatus,
  reviews = [],
  reviewsLoading = false,
  watchlists = [],
  onAddToFavorites,
  onRemoveFromFavorites,
  onAddToWatchlist,
  onSubmitReview,
  addToFavoritesPending,
  removeFromFavoritesPending,
  addToWatchlistPending,
  submitReviewPending,
}: DetailsLayoutProps) {
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const { isAuthenticated } = useAuth();
  const { isOnline } = useOfflineDetection();
  
  // Cache status for image optimization - always call this hook
  const cacheStatus = useCacheStatus(type, data?.id || 0);

  // Review form state - always initialize
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState<string>("");

  // Watchlist dialog state - always initialize
  const [isWatchlistDialogOpen, setIsWatchlistDialogOpen] = useState(false);
  const [selectedWatchlistId, setSelectedWatchlistId] = useState<string>("");
  
  // Trailer modal state - always initialize
  const [isTrailerModalOpen, setIsTrailerModalOpen] = useState(false);

  // Error state - check AFTER all hooks
  if (error) {
    return (
      <div className="min-h-screen" data-testid={`${type}-detail-error`}>
        <div className="relative min-h-[75vh] md:min-h-[80vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-background to-muted/20">
          <div className="text-center space-y-4 max-w-md px-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <MessageSquare className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold">Error Loading {type === 'movie' ? 'Movie' : 'TV Show'}</h2>
            <p className="text-muted-foreground">{error.message || 'An unexpected error occurred'}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading || !data) {
    return (
      <div className="min-h-screen" data-testid={`${type}-detail-loading`}>
        <div className="relative min-h-[75vh] md:min-h-[80vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-background to-muted/20">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto"></div>
            <p className="text-lg text-muted-foreground">Loading {type === 'movie' ? 'movie' : 'TV show'} details...</p>
          </div>
        </div>
      </div>
    );
  }

  // Normalize data structure between movie and TV
  const title = type === 'movie' ? (data as MovieDetails).title : (data as TVShowDetails).name;
  const releaseDate = type === 'movie' ? (data as MovieDetails).release_date : (data as TVShowDetails).first_air_date;
  const runtime = type === 'movie' 
    ? (data as MovieDetails).runtime 
    : (data as TVShowDetails).episode_run_time?.[0];

  const isFavorite = favoriteStatus?.isFavorite;
  
  // Get all trailers and videos for the modal
  const trailers = data?.videos?.results?.filter((video: any) => 
    video.site === "YouTube" && (video.type === "Trailer" || video.type === "Teaser")
  ) || [];
  
  const hasTrailer = trailers.length > 0;

  // Similar content - normalize between movie and TV
  const similarContent = type === 'movie' 
    ? (data as MovieDetails).similar?.results || []
    : (data as TVShowDetails).similar?.results || [];

  const recommendations = type === 'movie'
    ? (data as MovieDetails).recommendations?.results || []
    : (data as TVShowDetails).recommendations?.results || [];

  const handleSubmitReview = () => {
    if (!reviewText.trim() || !reviewRating) return;
    onSubmitReview(parseInt(reviewRating), reviewText.trim());
    setReviewText("");
    setReviewRating("");
  };

  const handleAddToWatchlist = () => {
    if (!selectedWatchlistId) return;
    onAddToWatchlist(selectedWatchlistId);
    setIsWatchlistDialogOpen(false);
    setSelectedWatchlistId("");
  };

  return (
    <>
      {/* Immersive Cinematic Hero Section */}
      <section className="relative min-h-[75vh] md:min-h-[80vh] flex items-end overflow-hidden" data-testid={`${type}-hero`}>
        {/* Enhanced Backdrop with Blur */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-background/20 backdrop-blur-3xl z-[1]" />
          <img
            src={getImageUrl(data?.backdrop_path, 'original')}
            alt={title}
            className="w-full h-full object-cover scale-110 blur-sm"
          />
          {/* Multi-layer gradient overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40 z-[2]"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-background/60 z-[3]"></div>
          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-background to-transparent z-[4]"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 md:pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-12 items-end">
            <div className="lg:col-span-1">
              <div className="relative group">
                {/* Enhanced glow effect */}
                <div className="absolute -inset-2 bg-gradient-to-r from-primary/40 via-primary/25 to-secondary/30 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700 motion-reduce:hidden" />
                <img
                  src={getImageUrl(data?.poster_path, 'w500')}
                  alt={title}
                  className="relative w-full max-w-sm mx-auto lg:mx-0 rounded-2xl shadow-2xl border border-border/30 group-hover:border-primary/50 transition-all duration-500 ring-1 ring-black/10 dark:ring-white/10"
                  data-testid={`${type}-poster`}
                />
                
                {/* Cache Status Indicator */}
                <div className="absolute top-4 left-4">
                  <CacheStatus
                    isOptimizing={cacheStatus.isOptimizing ?? false}
                    isCompleted={cacheStatus.isCompleted ?? false}
                    isFailed={cacheStatus.isFailed ?? false}
                    progress={cacheStatus.progress}
                    error={cacheStatus.error}
                    showDetails={false}
                  />
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-2 text-center lg:text-left space-y-6">
              <div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-display font-extrabold mb-4 tracking-tight leading-none bg-gradient-to-r from-foreground via-foreground to-foreground/90 bg-clip-text drop-shadow-2xl" data-testid={`${type}-title`}>
                  {title}
                </h1>
                {data?.tagline && (
                  <p className="text-xl sm:text-2xl text-muted-foreground/90 italic font-light tracking-wide" data-testid={`${type}-tagline`}>
                    "{data.tagline}"
                  </p>
                )}
              </div>
              
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-5 md:gap-6">
                <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 backdrop-blur-sm" data-testid={`${type}-rating`}>
                  <Star className="w-6 h-6 text-yellow-500 fill-current drop-shadow-[0_2px_8px_rgba(234,179,8,0.5)]" />
                  <span className="font-display font-bold text-lg">{data?.vote_average ? data.vote_average.toFixed(1) : 'N/A'}</span>
                  <span className="text-muted-foreground/80 text-sm">({data?.vote_count ? data.vote_count.toLocaleString() : '0'})</span>
                </div>
                
                {runtime && (
                  <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-card/60 border border-border/40 backdrop-blur-sm" data-testid={`${type}-runtime`}>
                    <Clock className="w-5 h-5 text-primary" />
                    <span className="font-semibold">{formatRuntime(runtime)}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-card/60 border border-border/40 backdrop-blur-sm" data-testid={`${type}-release-date`}>
                  <Calendar className="w-5 h-5 text-primary" />
                  <span className="font-semibold">{new Date(releaseDate).getFullYear()}</span>
                </div>

                {type === 'tv' && (data as TVShowDetails).number_of_seasons && (
                  <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-card/60 border border-border/40 backdrop-blur-sm" data-testid="tv-seasons">
                    <Tv className="w-5 h-5 text-primary" />
                    <span className="font-semibold">
                      {(data as TVShowDetails).number_of_seasons} Season{(data as TVShowDetails).number_of_seasons !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2.5" data-testid={`${type}-genres`}>
                {data?.genres?.map((genre: any) => (
                  <Link key={genre.id} href={`/genre/${genre.id}`}>
                    <Badge 
                      variant="secondary" 
                      className="px-4 py-1.5 text-sm font-semibold rounded-xl cursor-pointer bg-yellow-500/90 text-yellow-950 dark:text-yellow-950 border-yellow-600/50 hover:bg-red-500 hover:text-white dark:hover:text-white hover:border-red-600/50 transition-all duration-300 backdrop-blur-sm"
                      data-testid={`genre-${genre.id}`}
                    >
                      {genre.name}
                    </Badge>
                  </Link>
                ))}
              </div>
              
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start pt-2">
                {hasTrailer && (
                  <Button 
                    size="lg" 
                    className="flex items-center gap-2.5 px-8 py-6 text-base font-bold rounded-2xl shadow-lg hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary" 
                    onClick={() => setIsTrailerModalOpen(true)}
                    data-testid="button-watch-trailer"
                  >
                    <Play className="w-5 h-5" />
                    Watch Trailer
                  </Button>
                )}
                
                {isAuthenticated && (
                  <>
                    <Button
                      variant={isFavorite ? "destructive" : "outline"}
                      size="lg"
                      onClick={() => isFavorite ? onRemoveFromFavorites() : onAddToFavorites()}
                      disabled={addToFavoritesPending || removeFromFavoritesPending}
                      className="flex items-center gap-2.5 px-6 py-6 text-base font-semibold rounded-2xl backdrop-blur-sm transition-all duration-300"
                      data-testid="button-favorite"
                    >
                      <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                      {isFavorite ? 'Remove' : 'Favorite'}
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="flex items-center gap-2.5 px-6 py-6 text-base font-semibold rounded-2xl backdrop-blur-sm transition-all duration-300" 
                      onClick={() => setIsWatchlistDialogOpen(true)}
                      data-testid="button-add-to-watchlist"
                    >
                      <Plus className="w-5 h-5" />
                      Watchlist
                    </Button>
                  </>
                )}
              </div>
              
              {/* Detailed Cache Status */}
              <CacheStatus
                isOptimizing={cacheStatus.isOptimizing ?? false}
                isCompleted={cacheStatus.isCompleted ?? false}
                isFailed={cacheStatus.isFailed ?? false}
                progress={cacheStatus.progress}
                error={cacheStatus.error}
                showDetails={true}
                className="justify-center lg:justify-start"
              />
            </div>
          </div>
        </div>
      </section>
      
      {/* Content */}
      <section className="py-12" data-testid={`${type}-content`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Overview */}
          <div className="mb-8">
            <h2 className="text-2xl font-display font-bold mb-4" data-testid="overview-title">Overview</h2>
            <p className="text-lg text-muted-foreground leading-relaxed" data-testid={`${type}-overview`}>
              {data?.overview || `No overview available for this ${type}.`}
            </p>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="cast" className="w-full" data-testid={`${type}-tabs`}>
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
                {type === 'movie' ? <Images className="w-4 h-4" /> : <Film className="w-4 h-4" />}
                {type === 'movie' ? 'Movie' : 'TV'} Stills
              </TabsTrigger>
            </TabsList>

            {/* Cast & Crew Tab */}
            <TabsContent value="cast" className="mt-6" data-testid="content-cast">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Cast */}
                <div>
                  <h3 className="text-xl font-semibold mb-6" data-testid="cast-title">Cast</h3>
                  {isLoading || !data?.credits ? (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2" data-testid="cast-loading">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <CastCardSkeleton key={i} />
                      ))}
                    </div>
                  ) : data.credits.cast && data.credits.cast.length > 0 ? (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2" data-testid="cast-grid">
                      {data.credits.cast.slice(0, 12).map((actor: any) => (
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
                    <div className="text-center py-8" data-testid="no-cast">
                      <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No cast information available.</p>
                    </div>
                  )}
                </div>

                {/* Crew */}
                <div>
                  <h3 className="text-xl font-semibold mb-6" data-testid="crew-title">Key Crew</h3>
                  {isLoading || !data?.credits ? (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2" data-testid="crew-loading">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <CastCardSkeleton key={i} />
                      ))}
                    </div>
                  ) : data.credits.crew && data.credits.crew.filter((person: any) => ['Director', 'Producer', 'Writer', 'Executive Producer', 'Creator'].includes(person.job)).length > 0 ? (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2" data-testid="crew-grid">
                      {data.credits.crew
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
                    <div className="text-center py-8" data-testid="no-crew">
                      <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No crew information available.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Nested Tabs for Similar & Recommended below Cast & Crew */}
              <div className="mt-12">
                <Tabs defaultValue="similar" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 max-w-md">
                    <TabsTrigger value="similar" className="flex items-center gap-2" data-testid="tab-similar-nested">
                      <Film className="w-4 h-4" />
                      Similar {type === 'movie' ? 'Movies' : 'TV Shows'}
                    </TabsTrigger>
                    <TabsTrigger value="recommended" className="flex items-center gap-2" data-testid="tab-recommended-nested">
                      <Star className="w-4 h-4" />
                      Recommended
                    </TabsTrigger>
                  </TabsList>

                  {/* Similar Content Tab */}
                  <TabsContent value="similar" className="mt-6" data-testid="content-similar-nested">
                    {similarContent.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4" data-testid="similar-grid">
                        {similarContent.slice(0, 12).map((item: any) => (
                          <MovieCard key={item.id} movie={item} mediaType={type} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8" data-testid="no-similar">
                        <Film className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No similar {type === 'movie' ? 'movies' : 'TV shows'} available.</p>
                      </div>
                    )}
                  </TabsContent>

                  {/* Recommended Content Tab */}
                  <TabsContent value="recommended" className="mt-6" data-testid="content-recommended-nested">
                    {recommendations.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4" data-testid="recommendations-grid">
                        {recommendations.slice(0, 12).map((item: any) => (
                          <MovieCard key={item.id} movie={item} mediaType={type} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8" data-testid="no-recommendations">
                        <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No recommendations available.</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews" className="mt-6" data-testid="content-reviews">
              {/* Submit Review Form */}
              {isAuthenticated && (
                <Card className="mb-8" data-testid="review-form">
                  <CardContent className="pt-6">
                    <h3 className="text-xl font-semibold mb-4">Write a Review</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Rating</label>
                        <Select value={reviewRating} onValueChange={setReviewRating}>
                          <SelectTrigger data-testid="select-rating">
                            <SelectValue placeholder="Select a rating" />
                          </SelectTrigger>
                          <SelectContent>
                            {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((rating) => (
                              <SelectItem key={rating} value={rating.toString()} data-testid={`rating-option-${rating}`}>
                                {rating} {rating === 10 ? '★' : rating >= 8 ? '⭐' : '☆'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Your Review</label>
                        <Textarea
                          placeholder="Share your thoughts..."
                          value={reviewText}
                          onChange={(e) => setReviewText(e.target.value)}
                          rows={4}
                          data-testid="input-review-text"
                        />
                      </div>
                      <Button
                        onClick={handleSubmitReview}
                        disabled={!reviewText.trim() || !reviewRating || submitReviewPending}
                        data-testid="button-submit-review"
                      >
                        Submit Review
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Reviews List */}
              <div>
                <h3 className="text-xl font-semibold mb-6" data-testid="reviews-list-title">
                  {reviews.length} Review{reviews.length !== 1 ? 's' : ''}
                </h3>
                {reviewsLoading ? (
                  <div className="space-y-4" data-testid="reviews-loading">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse bg-card rounded-lg p-6">
                        <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                        <div className="h-4 bg-muted rounded w-full"></div>
                      </div>
                    ))}
                  </div>
                ) : reviews.length > 0 ? (
                  <div className="space-y-4" data-testid="reviews-list">
                    {reviews.map((review: any) => (
                      <Card key={review.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold" data-testid={`review-username-${review.id}`}>{review.username || 'Anonymous'}</span>
                                <div className="flex items-center gap-1">
                                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                  <span className="text-sm font-medium" data-testid={`review-rating-${review.id}`}>{review.rating}/10</span>
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground" data-testid={`review-date-${review.id}`}>
                                {new Date(review.createdAt).toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}
                              </p>
                            </div>
                          </div>
                          <p className="text-muted-foreground leading-relaxed" data-testid={`review-text-${review.id}`}>{review.review}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8" data-testid="no-reviews">
                    <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Details Tab */}
            <TabsContent value="details" className="mt-6" data-testid="content-details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-1">Status</h4>
                    <p className="text-lg" data-testid="detail-status">{data?.status || 'N/A'}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-1">Original Language</h4>
                    <p className="text-lg" data-testid="detail-language">{data?.original_language?.toUpperCase() || 'N/A'}</p>
                  </div>
                  {type === 'movie' && (
                    <>
                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-1">Budget</h4>
                        <p className="text-lg" data-testid="detail-budget">
                          {(data as MovieDetails).budget ? formatCurrency((data as MovieDetails).budget) : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-1">Revenue</h4>
                        <p className="text-lg" data-testid="detail-revenue">
                          {(data as MovieDetails).revenue ? formatCurrency((data as MovieDetails).revenue) : 'N/A'}
                        </p>
                      </div>
                    </>
                  )}
                </div>
                <div className="space-y-4">
                  {data?.production_companies && data.production_companies.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-3">Production Companies</h4>
                      <div className="space-y-2" data-testid="production-companies">
                        {data.production_companies.slice(0, 5).map((company: any) => (
                          <p key={company.id} className="text-sm">{company.name}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Stills Tab */}
            <TabsContent value="stills" className="mt-6" data-testid="content-stills">
              {data?.images?.backdrops && data.images.backdrops.length > 0 ? (
                <div>
                  <h3 className="text-xl font-semibold mb-6" data-testid="stills-title">
                    {type === 'movie' ? 'Movie' : 'TV'} Stills ({data.images.backdrops.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="stills-grid">
                    {data.images.backdrops.slice(0, 12).map((image, index) => (
                      <div key={index} className="relative group overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                        <img
                          src={getImageUrl(image.file_path, 'w780')}
                          alt={`${title} still ${index + 1}`}
                          className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
                          data-testid={`still-image-${index}`}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                          <div className="text-white text-sm">
                            <p className="font-semibold">{image.width} × {image.height}</p>
                            {image.vote_average > 0 && (
                              <p className="text-xs opacity-90">Rating: {image.vote_average.toFixed(1)}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12" data-testid="no-stills">
                  <Images className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No stills available for this {type === 'movie' ? 'movie' : 'TV show'}.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Watchlist Dialog */}
      <Dialog open={isWatchlistDialogOpen} onOpenChange={setIsWatchlistDialogOpen}>
        <DialogContent data-testid="watchlist-dialog">
          <DialogHeader>
            <DialogTitle>Add to Watchlist</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {watchlists && watchlists.length > 0 ? (
              <>
                <Select value={selectedWatchlistId} onValueChange={setSelectedWatchlistId}>
                  <SelectTrigger className="mb-4" data-testid="select-watchlist">
                    <SelectValue placeholder="Select a watchlist" />
                  </SelectTrigger>
                  <SelectContent>
                    {watchlists.map((watchlist: any) => (
                      <SelectItem key={watchlist.id} value={watchlist.id.toString()} data-testid={`watchlist-option-${watchlist.id}`}>
                        {watchlist.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setIsWatchlistDialogOpen(false)}
                    data-testid="button-cancel-watchlist"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddToWatchlist}
                    disabled={!selectedWatchlistId || addToWatchlistPending}
                    data-testid="button-add-to-selected-watchlist"
                  >
                    Add to Watchlist
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-4">
                  You don't have any watchlists yet. Create one first to add {type === 'movie' ? 'movies' : 'TV shows'}.
                </p>
                <Button
                  onClick={() => {
                    setIsWatchlistDialogOpen(false);
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
      <TrailerModal
        isOpen={isTrailerModalOpen}
        onClose={() => setIsTrailerModalOpen(false)}
        videos={trailers}
        title={title}
      />
    </>
  );
}
