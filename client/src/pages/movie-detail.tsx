import { useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { MovieDetails } from "@/types/movie";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { useMediaDetails } from "@/hooks/useMediaDetails";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import DetailsLayout from "@/components/media/details-layout";

export default function MovieDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { data: movie, isLoading: movieLoading, error: movieError, isError: isMovieError } = useMediaDetails('movie', id);

  const { data: favoriteStatus } = useQuery<{ isFavorite: boolean }>({
    queryKey: ["/api/favorites", "movie", id, "check"],
    enabled: !!id && isAuthenticated,
    retry: false,
  });

  const { data: reviews, isLoading: reviewsLoading } = useQuery<any[]>({
    queryKey: ["/api/reviews", "movie", id],
    enabled: !!id,
    retry: false,
  });

  const { data: watchlists } = useQuery<any[]>({
    queryKey: ["/api/watchlists"],
    enabled: isAuthenticated,
    retry: false,
  });

  const submitReviewMutation = useMutation({
    mutationFn: async ({ rating, text }: { rating: number; text: string }) => {
      if (!movie || !text.trim() || !rating) return;
      await apiRequest("POST", "/api/reviews", {
        mediaType: 'movie',
        mediaId: movie.id,
        rating,
        review: text.trim(),
        isPublic: true
      });
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reviews", "movie", id] });
      
      try {
        await apiRequest("POST", "/api/activity-history", {
          activityType: "review_posted",
          entityType: "movie",
          entityId: movie?.id?.toString(),
          entityTitle: (movie as MovieDetails)?.title,
          description: `Posted a review for "${(movie as MovieDetails)?.title}"`
        });
      } catch (error) {
        console.log("Failed to track activity history:", error);
      }
      
      toast({
        title: "Review Submitted",
        description: "Your review has been submitted successfully.",
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
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    },
  });

  const addToFavoritesMutation = useMutation({
    mutationFn: async () => {
      if (!movie) return;
      await apiRequest("POST", "/api/favorites", {
        mediaType: "movie",
        mediaId: movie.id,
        mediaTitle: (movie as MovieDetails).title,
        mediaPosterPath: movie.poster_path,
        mediaReleaseDate: (movie as MovieDetails).release_date,
      });
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/favorites", "movie", id, "check"] });
      
      try {
        await apiRequest("POST", "/api/activity-history", {
          activityType: "favorite_added",
          entityType: "movie",
          entityId: movie?.id?.toString(),
          entityTitle: (movie as MovieDetails)?.title,
          description: `Added "${(movie as MovieDetails)?.title}" to favorites`
        });
      } catch (error) {
        console.log("Failed to track activity history:", error);
      }
      
      toast({
        title: "Added to Favorites",
        description: `${(movie as MovieDetails)?.title} has been added to your favorites.`,
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
      await apiRequest("DELETE", `/api/favorites/movie/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/favorites", "movie", id, "check"] });
      toast({
        title: "Removed from Favorites",
        description: `${(movie as MovieDetails)?.title} has been removed from your favorites.`,
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

  const addToWatchlistMutation = useMutation({
    mutationFn: async (watchlistId: string) => {
      if (!movie || !watchlistId) return;
      await apiRequest("POST", `/api/watchlists/${watchlistId}/items`, {
        mediaType: "movie",
        mediaId: movie.id,
        mediaTitle: (movie as MovieDetails).title,
        mediaPosterPath: movie.poster_path,
        mediaReleaseDate: (movie as MovieDetails).release_date,
      });
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlists"] });
      
      try {
        await apiRequest("POST", "/api/activity-history", {
          activityType: "watchlist_item_added",
          entityType: "movie",
          entityId: movie?.id?.toString(),
          entityTitle: (movie as MovieDetails)?.title,
          description: `Added "${(movie as MovieDetails)?.title}" to watchlist`
        });
      } catch (error) {
        console.log("Failed to track activity history:", error);
      }
      
      toast({
        title: "Added to Watchlist",
        description: `${(movie as MovieDetails)?.title} has been added to your watchlist.`,
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
        description: "Failed to add movie to watchlist.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (movie) {
      document.title = `${(movie as MovieDetails).title} - CineHub Pro`;
    }
  }, [movie]);

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="movie-detail-page">
      <Header />
      <DetailsLayout
        type="movie"
        data={movie}
        isLoading={movieLoading}
        error={isMovieError ? movieError : null}
        favoriteStatus={favoriteStatus}
        reviews={reviews}
        reviewsLoading={reviewsLoading}
        watchlists={watchlists}
        onAddToFavorites={() => addToFavoritesMutation.mutate()}
        onRemoveFromFavorites={() => removeFromFavoritesMutation.mutate()}
        onAddToWatchlist={(watchlistId) => addToWatchlistMutation.mutate(watchlistId)}
        onSubmitReview={(rating, text) => submitReviewMutation.mutate({ rating, text })}
        addToFavoritesPending={addToFavoritesMutation.isPending}
        removeFromFavoritesPending={removeFromFavoritesMutation.isPending}
        addToWatchlistPending={addToWatchlistMutation.isPending}
        submitReviewPending={submitReviewMutation.isPending}
      />
      <Footer />
    </div>
  );
}
