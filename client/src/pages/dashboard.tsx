import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Plus, Star, Trash2, Edit, Eye, EyeOff } from "lucide-react";
import { getImageUrl } from "@/lib/tmdb";
import { Link } from "wouter";
import { ExpandableText } from "@/components/ui/expandable-text";

export default function Dashboard() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateWatchlistOpen, setIsCreateWatchlistOpen] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState("");
  const [newWatchlistDescription, setNewWatchlistDescription] = useState("");
  const [newWatchlistIsPublic, setNewWatchlistIsPublic] = useState(false);

  const { data: favorites, isLoading: favoritesLoading } = useQuery<any[]>({
    queryKey: ["/api/favorites"],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: watchlists, isLoading: watchlistsLoading } = useQuery<any[]>({
    queryKey: ["/api/watchlists"],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: userReviews, isLoading: reviewsLoading } = useQuery<any[]>({
    queryKey: ["/api/reviews/user"],
    enabled: isAuthenticated,
    retry: false,
  });

  const createWatchlistMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; isPublic: boolean }) => {
      await apiRequest("POST", "/api/watchlists", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlists"] });
      setIsCreateWatchlistOpen(false);
      setNewWatchlistName("");
      setNewWatchlistDescription("");
      setNewWatchlistIsPublic(false);
      toast({
        title: "Watchlist Created",
        description: "Your new watchlist has been created successfully.",
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
          window.location.href = "/";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create watchlist.",
        variant: "destructive",
      });
    },
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: async ({mediaType, mediaId}: {mediaType: string, mediaId: number}) => {
      await apiRequest("DELETE", `/api/favorites/${mediaType}/${mediaId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      toast({
        title: "Removed from Favorites",
        description: "Item has been removed from your favorites.",
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
          window.location.href = "/";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to remove from favorites.",
        variant: "destructive",
      });
    },
  });

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
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
  }, [isAuthenticated, authLoading, toast]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground" data-testid="dashboard-loading">
        <Header />
        <div className="pt-16 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your dashboard...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const handleCreateWatchlist = () => {
    if (!newWatchlistName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a watchlist name.",
        variant: "destructive",
      });
      return;
    }

    createWatchlistMutation.mutate({
      name: newWatchlistName.trim(),
      description: newWatchlistDescription.trim() || undefined,
      isPublic: newWatchlistIsPublic,
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="dashboard-page">
      <Header />
      
      <main className="pt-16">
        {/* Dashboard Header */}
        <section className="py-12 border-b border-border" data-testid="dashboard-header">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-display font-bold mb-4" data-testid="dashboard-title">
                Welcome back, {user?.firstName || 'Movie Lover'}!
              </h1>
              <p className="text-xl text-muted-foreground" data-testid="dashboard-description">
                Manage your movie collection and discover new favorites
              </p>
            </div>
          </div>
        </section>

        {/* Dashboard Stats */}
        <section className="py-8" data-testid="dashboard-stats">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Favorites</CardTitle>
                  <Heart className="w-4 h-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="stat-favorites">
                    {favorites?.length || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Watchlists</CardTitle>
                  <Plus className="w-4 h-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="stat-watchlists">
                    {watchlists?.length || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Reviews Written</CardTitle>
                  <Star className="w-4 h-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="stat-reviews">
                    {userReviews?.length || 0}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Dashboard Content */}
        <section className="py-8" data-testid="dashboard-content">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Tabs defaultValue="favorites" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="favorites" data-testid="tab-favorites">Favorites</TabsTrigger>
                <TabsTrigger value="watchlists" data-testid="tab-watchlists">Watchlists</TabsTrigger>
                <TabsTrigger value="reviews" data-testid="tab-reviews">Reviews</TabsTrigger>
              </TabsList>

              <TabsContent value="favorites" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-display font-bold" data-testid="favorites-title">
                    Your Favorites
                  </h2>
                </div>

                <Tabs defaultValue="movies" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 max-w-md">
                    <TabsTrigger value="movies" data-testid="favorites-tab-movies">Movies</TabsTrigger>
                    <TabsTrigger value="tv" data-testid="favorites-tab-tv">TV Shows</TabsTrigger>
                  </TabsList>

                  <TabsContent value="movies" className="mt-6">
                    {favoritesLoading ? (
                      <div className="flex items-center justify-center py-12" data-testid="favorites-movies-loading">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <span className="ml-2 text-muted-foreground">Loading favorites...</span>
                      </div>
                    ) : favorites?.filter(f => f.mediaType === 'movie').length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6" data-testid="favorites-movies-grid">
                        {favorites.filter(f => f.mediaType === 'movie').map((favorite) => (
                          <div key={favorite.id} className="group">
                            <Link href={`/${favorite.mediaType}/${favorite.mediaId}`}>
                              <div className="aspect-[2/3] relative overflow-hidden rounded-lg bg-accent cursor-pointer">
                                <img
                                  src={getImageUrl(favorite.mediaPosterPath)}
                                  alt={favorite.mediaTitle}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                              </div>
                            </Link>
                            <div className="mt-2 space-y-1">
                              <h3 className="font-semibold truncate text-sm" data-testid={`favorite-title-${favorite.id}`}>
                                {favorite.mediaTitle}
                              </h3>
                              <div className="flex items-center justify-between">
                                <p className="text-xs text-muted-foreground">
                                  {favorite.mediaReleaseDate ? new Date(favorite.mediaReleaseDate).getFullYear() : 'TBA'}
                                </p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFavoriteMutation.mutate({mediaType: favorite.mediaType, mediaId: favorite.mediaId})}
                                  disabled={removeFavoriteMutation.isPending}
                                  data-testid={`remove-favorite-${favorite.id}`}
                                >
                                  <Trash2 className="w-3 h-3 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12" data-testid="favorites-movies-empty">
                        <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <h3 className="text-xl font-semibold mb-2">No favorite movies yet</h3>
                        <p className="text-muted-foreground mb-4">
                          Start adding movies to your favorites to see them here
                        </p>
                        <Link href="/movies">
                          <Button>Browse Movies</Button>
                        </Link>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="tv" className="mt-6">
                    {favoritesLoading ? (
                      <div className="flex items-center justify-center py-12" data-testid="favorites-tv-loading">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <span className="ml-2 text-muted-foreground">Loading favorites...</span>
                      </div>
                    ) : favorites?.filter(f => f.mediaType === 'tv').length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6" data-testid="favorites-tv-grid">
                        {favorites.filter(f => f.mediaType === 'tv').map((favorite) => (
                          <div key={favorite.id} className="group">
                            <Link href={`/${favorite.mediaType}/${favorite.mediaId}`}>
                              <div className="aspect-[2/3] relative overflow-hidden rounded-lg bg-accent cursor-pointer">
                                <img
                                  src={getImageUrl(favorite.mediaPosterPath)}
                                  alt={favorite.mediaTitle}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                              </div>
                            </Link>
                            <div className="mt-2 space-y-1">
                              <h3 className="font-semibold truncate text-sm" data-testid={`favorite-title-${favorite.id}`}>
                                {favorite.mediaTitle}
                              </h3>
                              <div className="flex items-center justify-between">
                                <p className="text-xs text-muted-foreground">
                                  {favorite.mediaReleaseDate ? new Date(favorite.mediaReleaseDate).getFullYear() : 'TBA'}
                                </p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFavoriteMutation.mutate({mediaType: favorite.mediaType, mediaId: favorite.mediaId})}
                                  disabled={removeFavoriteMutation.isPending}
                                  data-testid={`remove-favorite-${favorite.id}`}
                                >
                                  <Trash2 className="w-3 h-3 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12" data-testid="favorites-tv-empty">
                        <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <h3 className="text-xl font-semibold mb-2">No favorite TV shows yet</h3>
                        <p className="text-muted-foreground mb-4">
                          Start adding TV shows to your favorites to see them here
                        </p>
                        <Button disabled>Browse TV Shows (Coming Soon)</Button>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </TabsContent>

              <TabsContent value="watchlists" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-display font-bold" data-testid="watchlists-title">
                    Your Watchlists
                  </h2>
                  <Dialog open={isCreateWatchlistOpen} onOpenChange={setIsCreateWatchlistOpen}>
                    <DialogTrigger asChild>
                      <Button data-testid="button-create-watchlist">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Watchlist
                      </Button>
                    </DialogTrigger>
                    <DialogContent data-testid="create-watchlist-dialog">
                      <DialogHeader>
                        <DialogTitle>Create New Watchlist</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="watchlist-name">Name *</Label>
                          <Input
                            id="watchlist-name"
                            value={newWatchlistName}
                            onChange={(e) => setNewWatchlistName(e.target.value)}
                            placeholder="Enter watchlist name"
                            data-testid="input-watchlist-name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="watchlist-description">Description</Label>
                          <Textarea
                            id="watchlist-description"
                            value={newWatchlistDescription}
                            onChange={(e) => setNewWatchlistDescription(e.target.value)}
                            placeholder="Enter watchlist description (optional)"
                            data-testid="input-watchlist-description"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="watchlist-public"
                            checked={newWatchlistIsPublic}
                            onChange={(e) => setNewWatchlistIsPublic(e.target.checked)}
                            data-testid="checkbox-watchlist-public"
                          />
                          <Label htmlFor="watchlist-public">Make this watchlist public</Label>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => setIsCreateWatchlistOpen(false)}
                            data-testid="button-cancel-watchlist"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleCreateWatchlist}
                            disabled={createWatchlistMutation.isPending}
                            data-testid="button-save-watchlist"
                          >
                            Create Watchlist
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <Tabs defaultValue="movies" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 max-w-md">
                    <TabsTrigger value="movies" data-testid="watchlists-tab-movies">Movies</TabsTrigger>
                    <TabsTrigger value="tv" data-testid="watchlists-tab-tv">TV Shows</TabsTrigger>
                  </TabsList>

                  <TabsContent value="movies" className="mt-6">
                    {watchlistsLoading ? (
                      <div className="flex items-center justify-center py-12" data-testid="watchlists-movies-loading">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <span className="ml-2 text-muted-foreground">Loading watchlists...</span>
                      </div>
                    ) : watchlists?.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="watchlists-movies-grid">
                        {watchlists.map((watchlist) => (
                          <Card key={watchlist.id} data-testid={`watchlist-card-${watchlist.id}`}>
                            <CardHeader>
                              <div className="flex items-start justify-between">
                                <div>
                                  <CardTitle className="text-lg" data-testid={`watchlist-name-${watchlist.id}`}>
                                    {watchlist.name}
                                  </CardTitle>
                                  {watchlist.description && (
                                    <p className="text-sm text-muted-foreground mt-1" data-testid={`watchlist-description-${watchlist.id}`}>
                                      {watchlist.description}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {watchlist.isPublic ? (
                                    <Eye className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                                  )}
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="flex items-center justify-between">
                                <Badge variant="secondary" data-testid={`watchlist-count-${watchlist.id}`}>
                                  0 items
                                </Badge>
                                <div className="flex items-center gap-2">
                                  <Button variant="ghost" size="sm" data-testid={`edit-watchlist-${watchlist.id}`}>
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" data-testid={`delete-watchlist-${watchlist.id}`}>
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12" data-testid="watchlists-movies-empty">
                        <Plus className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <h3 className="text-xl font-semibold mb-2">No movie watchlists yet</h3>
                        <p className="text-muted-foreground mb-4">
                          Create your first watchlist to organize your movies
                        </p>
                        <Button onClick={() => setIsCreateWatchlistOpen(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Watchlist
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="tv" className="mt-6">
                    {watchlistsLoading ? (
                      <div className="flex items-center justify-center py-12" data-testid="watchlists-tv-loading">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <span className="ml-2 text-muted-foreground">Loading watchlists...</span>
                      </div>
                    ) : watchlists?.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="watchlists-tv-grid">
                        {watchlists.map((watchlist) => (
                          <Card key={watchlist.id} data-testid={`watchlist-card-${watchlist.id}`}>
                            <CardHeader>
                              <div className="flex items-start justify-between">
                                <div>
                                  <CardTitle className="text-lg" data-testid={`watchlist-name-${watchlist.id}`}>
                                    {watchlist.name}
                                  </CardTitle>
                                  {watchlist.description && (
                                    <p className="text-sm text-muted-foreground mt-1" data-testid={`watchlist-description-${watchlist.id}`}>
                                      {watchlist.description}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {watchlist.isPublic ? (
                                    <Eye className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                                  )}
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="flex items-center justify-between">
                                <Badge variant="secondary" data-testid={`watchlist-count-${watchlist.id}`}>
                                  0 items
                                </Badge>
                                <div className="flex items-center gap-2">
                                  <Button variant="ghost" size="sm" data-testid={`edit-watchlist-${watchlist.id}`}>
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" data-testid={`delete-watchlist-${watchlist.id}`}>
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12" data-testid="watchlists-tv-empty">
                        <Plus className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <h3 className="text-xl font-semibold mb-2">No TV show watchlists yet</h3>
                        <p className="text-muted-foreground mb-4">
                          Create your first watchlist to organize your TV shows
                        </p>
                        <Button onClick={() => setIsCreateWatchlistOpen(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Watchlist
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </TabsContent>

              <TabsContent value="reviews" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-display font-bold" data-testid="reviews-title">
                    Your Reviews
                  </h2>
                </div>

                <Tabs defaultValue="movies" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 max-w-md">
                    <TabsTrigger value="movies" data-testid="reviews-tab-movies">Movies</TabsTrigger>
                    <TabsTrigger value="tv" data-testid="reviews-tab-tv">TV Shows</TabsTrigger>
                  </TabsList>

                  <TabsContent value="movies" className="mt-6">
                    {reviewsLoading ? (
                      <div className="flex items-center justify-center py-12" data-testid="reviews-movies-loading">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <span className="ml-2 text-muted-foreground">Loading reviews...</span>
                      </div>
                    ) : userReviews?.filter(r => r.mediaType === 'movie').length > 0 ? (
                      <div className="space-y-4" data-testid="reviews-movies-list">
                        {userReviews.filter(r => r.mediaType === 'movie').map((review) => (
                          <Card key={review.id} data-testid={`review-card-${review.id}`}>
                            <CardContent className="pt-6">
                              <div className="flex items-start gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-semibold" data-testid={`review-media-${review.id}`}>
                                      Movie #{review.mediaId}
                                    </h3>
                                    <div className="flex items-center gap-1">
                                      {[...Array(5)].map((_, i) => (
                                        <Star
                                          key={i}
                                          className={`w-4 h-4 ${
                                            i < review.rating / 2 ? "text-yellow-500 fill-current" : "text-muted-foreground"
                                          }`}
                                        />
                                      ))}
                                      <span className="text-sm text-muted-foreground ml-1" data-testid={`review-rating-${review.id}`}>
                                        {review.rating}/10
                                      </span>
                                    </div>
                                  </div>
                                  {review.review && (
                                    <ExpandableText 
                                      text={review.review}
                                      testId={`review-text-${review.id}`}
                                    />
                                  )}
                                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                    <span data-testid={`review-date-${review.id}`}>
                                      {new Date(review.createdAt).toLocaleDateString()}
                                    </span>
                                    <Badge variant={review.isPublic ? "default" : "secondary"}>
                                      {review.isPublic ? "Public" : "Private"}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button variant="ghost" size="sm" data-testid={`edit-review-${review.id}`}>
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" data-testid={`delete-review-${review.id}`}>
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12" data-testid="reviews-movies-empty">
                        <Star className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <h3 className="text-xl font-semibold mb-2">No movie reviews yet</h3>
                        <p className="text-muted-foreground mb-4">
                          Start reviewing movies to share your thoughts with others
                        </p>
                        <Link href="/movies">
                          <Button>Browse Movies</Button>
                        </Link>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="tv" className="mt-6">
                    {reviewsLoading ? (
                      <div className="flex items-center justify-center py-12" data-testid="reviews-tv-loading">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <span className="ml-2 text-muted-foreground">Loading reviews...</span>
                      </div>
                    ) : userReviews?.filter(r => r.mediaType === 'tv').length > 0 ? (
                      <div className="space-y-4" data-testid="reviews-tv-list">
                        {userReviews.filter(r => r.mediaType === 'tv').map((review) => (
                          <Card key={review.id} data-testid={`review-card-${review.id}`}>
                            <CardContent className="pt-6">
                              <div className="flex items-start gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-semibold" data-testid={`review-media-${review.id}`}>
                                      TV Show #{review.mediaId}
                                    </h3>
                                    <div className="flex items-center gap-1">
                                      {[...Array(5)].map((_, i) => (
                                        <Star
                                          key={i}
                                          className={`w-4 h-4 ${
                                            i < review.rating / 2 ? "text-yellow-500 fill-current" : "text-muted-foreground"
                                          }`}
                                        />
                                      ))}
                                      <span className="text-sm text-muted-foreground ml-1" data-testid={`review-rating-${review.id}`}>
                                        {review.rating}/10
                                      </span>
                                    </div>
                                  </div>
                                  {review.review && (
                                    <ExpandableText 
                                      text={review.review}
                                      testId={`review-text-${review.id}`}
                                    />
                                  )}
                                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                    <span data-testid={`review-date-${review.id}`}>
                                      {new Date(review.createdAt).toLocaleDateString()}
                                    </span>
                                    <Badge variant={review.isPublic ? "default" : "secondary"}>
                                      {review.isPublic ? "Public" : "Private"}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button variant="ghost" size="sm" data-testid={`edit-review-${review.id}`}>
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" data-testid={`delete-review-${review.id}`}>
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12" data-testid="reviews-tv-empty">
                        <Star className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <h3 className="text-xl font-semibold mb-2">No TV show reviews yet</h3>
                        <p className="text-muted-foreground mb-4">
                          Start reviewing TV shows to share your thoughts with others
                        </p>
                        <Button disabled>Browse TV Shows (Coming Soon)</Button>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
