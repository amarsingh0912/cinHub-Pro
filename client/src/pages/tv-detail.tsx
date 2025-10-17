import { useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { TVShowDetails } from "@/types/movie";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { useMediaDetails } from "@/hooks/useMediaDetails";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import DetailsLayout from "@/components/media/details-layout";

export default function TVDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { data: tvShow, isLoading: tvLoading, error: tvError, isError: isTVError } = useMediaDetails('tv', id);

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

  const submitReviewMutation = useMutation({
    mutationFn: async ({ rating, text }: { rating: number; text: string }) => {
      if (!tvShow || !text.trim() || !rating) return;
      await apiRequest("POST", "/api/reviews", {
        mediaType: 'tv',
        mediaId: tvShow.id,
        rating,
        review: text.trim(),
        isPublic: true
      });
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reviews", "tv", id] });
      
      try {
        await apiRequest("POST", "/api/activity-history", {
          activityType: "review_posted",
          entityType: "tv",
          entityId: tvShow?.id?.toString(),
          entityTitle: (tvShow as TVShowDetails)?.name,
          description: `Posted a review for "${(tvShow as TVShowDetails)?.name}"`
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
      if (!tvShow) return;
      await apiRequest("POST", "/api/favorites", {
        mediaType: 'tv',
        mediaId: tvShow.id,
        mediaTitle: (tvShow as TVShowDetails).name,
        mediaPosterPath: tvShow.poster_path,
        mediaReleaseDate: (tvShow as TVShowDetails).first_air_date
      });
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/favorites", "tv", id, "check"] });
      
      try {
        await apiRequest("POST", "/api/activity-history", {
          activityType: 'favorite_added',
          entityType: 'tv',
          entityId: tvShow?.id?.toString(),
          entityTitle: (tvShow as TVShowDetails)?.name,
          description: `Added "${(tvShow as TVShowDetails)?.name}" to favorites`
        });
      } catch (error) {
        console.log('Failed to track activity history:', error);
      }
      
      toast({
        title: "Added to Favorites",
        description: `${(tvShow as TVShowDetails)?.name} has been added to your favorites.`,
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
        description: `${(tvShow as TVShowDetails)?.name} has been removed from your favorites.`,
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
    mutationFn: async (watchlistId: string) => {
      if (!tvShow || !watchlistId) return;
      await apiRequest("POST", `/api/watchlists/${watchlistId}/items`, {
        mediaType: "tv",
        mediaId: tvShow.id,
        mediaTitle: (tvShow as TVShowDetails).name,
        mediaPosterPath: tvShow.poster_path,
        mediaReleaseDate: (tvShow as TVShowDetails).first_air_date,
      });
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlists"] });
      
      try {
        await apiRequest("POST", "/api/activity-history", {
          activityType: "watchlist_item_added",
          entityType: "tv",
          entityId: tvShow?.id?.toString(),
          entityTitle: (tvShow as TVShowDetails)?.name,
          description: `Added "${(tvShow as TVShowDetails)?.name}" to watchlist`
        });
      } catch (error) {
        console.log("Failed to track activity history:", error);
      }
      
      toast({
        title: "Added to Watchlist",
        description: `${(tvShow as TVShowDetails)?.name} has been added to your watchlist.`,
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
      document.title = `${(tvShow as TVShowDetails).name} - CineHub Pro`;
    }
  }, [tvShow]);

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="tv-detail-page">
      <Header />
      <DetailsLayout
        type="tv"
        data={tvShow}
        isLoading={tvLoading}
        error={isTVError ? tvError : null}
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
