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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Heart, Plus, Star, Trash2, Edit, Eye, EyeOff, Play, Save, Upload, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getImageUrl } from "@/lib/tmdb";
import { Link } from "wouter";
import { ExpandableText } from "@/components/ui/expandable-text";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Component to display watchlist item count
function WatchlistItemCount({ watchlistId }: { watchlistId: string }) {
  const { data: items, isLoading } = useQuery<any[]>({
    queryKey: ["/api/watchlists", watchlistId, "items"],
    enabled: !!watchlistId,
    retry: false,
  });

  if (isLoading) {
    return (
      <Badge variant="secondary" data-testid={`watchlist-count-${watchlistId}`}>
        Loading...
      </Badge>
    );
  }

  const count = items?.length || 0;
  return (
    <Badge variant="secondary" data-testid={`watchlist-count-${watchlistId}`}>
      {count} {count === 1 ? 'item' : 'items'}
    </Badge>
  );
}

export default function Dashboard() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateWatchlistOpen, setIsCreateWatchlistOpen] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState("");
  const [newWatchlistDescription, setNewWatchlistDescription] = useState("");
  const [newWatchlistIsPublic, setNewWatchlistIsPublic] = useState(false);
  const [editingWatchlist, setEditingWatchlist] = useState<any>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditWatchlistOpen, setIsEditWatchlistOpen] = useState(false);
  const [watchlistToDelete, setWatchlistToDelete] = useState<any>(null);
  const [viewingWatchlist, setViewingWatchlist] = useState<any>(null);
  const [isViewWatchlistOpen, setIsViewWatchlistOpen] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Profile form schema
  const profileFormSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z.string().email("Please enter a valid email address"),
  });

  // Profile form initialization
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      username: user?.username || "",
      email: user?.email || "",
    },
  });

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      profileForm.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        username: user.username || "",
        email: user.email || "",
      });
    }
  }, [user, profileForm]);

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

  const { data: watchlistItems, isLoading: watchlistItemsLoading } = useQuery<any[]>({
    queryKey: ["/api/watchlists", viewingWatchlist?.id, "items"],
    enabled: isAuthenticated && !!viewingWatchlist?.id,
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

  const editWatchlistMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string; description?: string; isPublic: boolean } }) => {
      await apiRequest("PUT", `/api/watchlists/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlists"] });
      setIsEditWatchlistOpen(false);
      setEditingWatchlist(null);
      toast({
        title: "Watchlist Updated",
        description: "Your watchlist has been updated successfully.",
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
        description: "Failed to update watchlist.",
        variant: "destructive",
      });
    },
  });

  const deleteWatchlistMutation = useMutation({
    mutationFn: async (watchlistId: string) => {
      await apiRequest("DELETE", `/api/watchlists/${watchlistId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlists"] });
      toast({
        title: "Watchlist Deleted",
        description: "Your watchlist has been deleted successfully.",
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
        description: "Failed to delete watchlist.",
        variant: "destructive",
      });
    },
  });

  const removeWatchlistItemMutation = useMutation({
    mutationFn: async ({watchlistId, mediaType, mediaId}: {watchlistId: string, mediaType: string, mediaId: number}) => {
      await apiRequest("DELETE", `/api/watchlists/${watchlistId}/items/${mediaType}/${mediaId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlists", viewingWatchlist?.id, "items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/watchlists"] });
      toast({
        title: "Removed from Watchlist",
        description: "Item has been removed from your watchlist.",
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
        description: "Failed to remove from watchlist.",
        variant: "destructive",
      });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof profileFormSchema>) => {
      const result = await apiRequest("PUT", "/api/auth/profile", data);
      return result;
    },
    onSuccess: (data) => {
      // Update the auth context/user data - invalidate the correct query key
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setIsEditingProfile(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error: any) => {
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
      const errorMessage = error?.message || "Failed to update profile.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Profile picture upload mutations
  const getCloudinarySignatureMutation = useMutation({
    mutationFn: async () => {
      const result = await apiRequest("POST", "/api/profile/avatar/sign", {});
      return result;
    },
  });

  const updateAvatarMutation = useMutation({
    mutationFn: async (data: { secure_url: string }) => {
      const result = await apiRequest("PATCH", "/api/profile/avatar", data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setIsUploadingAvatar(false);
      setUploadProgress(0);
      toast({
        title: "Profile Picture Updated",
        description: "Your profile picture has been updated successfully.",
      });
    },
    onError: (error: any) => {
      setIsUploadingAvatar(false);
      setUploadProgress(0);
      const errorMessage = error?.message || "Failed to update profile picture.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Handle profile picture upload
  const handleAvatarUpload = async (file: File) => {
    if (!file) return;

    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please select a JPEG, PNG, or WebP image.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingAvatar(true);
    setUploadProgress(0);

    try {
      // Get signed upload parameters
      const signatureData = await getCloudinarySignatureMutation.mutateAsync();
      
      // Prepare form data for Cloudinary upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', (signatureData as any).api_key);
      formData.append('timestamp', (signatureData as any).timestamp.toString());
      formData.append('signature', (signatureData as any).signature);
      if ((signatureData as any).public_id) formData.append('public_id', (signatureData as any).public_id);
      if ((signatureData as any).folder) formData.append('folder', (signatureData as any).folder);
      if ((signatureData as any).transformation) formData.append('transformation', (signatureData as any).transformation);

      // Upload to Cloudinary with progress tracking
      const uploadResponse = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(progress);
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error('Upload failed'));
          }
        };

        xhr.onerror = () => reject(new Error('Upload failed'));
        
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${(signatureData as any).cloud_name}/image/upload`);
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.send(formData);
      });

      // Update profile picture URL in backend
      await updateAvatarMutation.mutateAsync({ secure_url: uploadResponse.secure_url });

    } catch (error: any) {
      setIsUploadingAvatar(false);
      setUploadProgress(0);
      
      // Check if this is a Cloudinary configuration issue
      if (error?.message?.includes('not configured')) {
        toast({
          title: "Service Unavailable", 
          description: "Profile picture upload is currently unavailable. Please try again later.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Upload Failed",
          description: error?.message || "Failed to upload profile picture. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
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

  const handleEditWatchlist = () => {
    if (!newWatchlistName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a watchlist name.",
        variant: "destructive",
      });
      return;
    }

    editWatchlistMutation.mutate({
      id: editingWatchlist.id,
      data: {
        name: newWatchlistName.trim(),
        description: newWatchlistDescription.trim() || undefined,
        isPublic: newWatchlistIsPublic,
      }
    });
  };

  const openEditWatchlist = (watchlist: any) => {
    setEditingWatchlist(watchlist);
    setNewWatchlistName(watchlist.name);
    setNewWatchlistDescription(watchlist.description || "");
    setNewWatchlistIsPublic(watchlist.isPublic);
    setIsEditWatchlistOpen(true);
  };

  const handleDeleteWatchlist = (watchlist: any) => {
    setWatchlistToDelete(watchlist);
  };

  const confirmDeleteWatchlist = () => {
    if (watchlistToDelete) {
      deleteWatchlistMutation.mutate(watchlistToDelete.id);
      setWatchlistToDelete(null);
    }
  };

  const openViewWatchlist = (watchlist: any) => {
    setViewingWatchlist(watchlist);
    setIsViewWatchlistOpen(true);
  };

  const handleProfileSubmit = (data: z.infer<typeof profileFormSchema>) => {
    updateProfileMutation.mutate(data);
  };

  const handleEditProfile = () => {
    setIsEditingProfile(true);
  };

  const handleCancelEditProfile = () => {
    setIsEditingProfile(false);
    profileForm.reset({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      username: user?.username || "",
      email: user?.email || "",
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
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="favorites" data-testid="tab-favorites">Favorites</TabsTrigger>
                <TabsTrigger value="watchlists" data-testid="tab-watchlists">Watchlists</TabsTrigger>
                <TabsTrigger value="reviews" data-testid="tab-reviews">Reviews</TabsTrigger>
                <TabsTrigger value="profile" data-testid="tab-profile">Profile</TabsTrigger>
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
                    ) : (favorites?.filter(f => f.mediaType === 'movie')?.length ?? 0) > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6" data-testid="favorites-movies-grid">
                        {favorites?.filter(f => f.mediaType === 'movie')?.map((favorite) => (
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
                    ) : (favorites?.filter(f => f.mediaType === 'tv')?.length ?? 0) > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6" data-testid="favorites-tv-grid">
                        {favorites?.filter(f => f.mediaType === 'tv')?.map((favorite) => (
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
                  
                  {/* Edit Watchlist Dialog */}
                  <Dialog open={isEditWatchlistOpen} onOpenChange={setIsEditWatchlistOpen}>
                    <DialogContent data-testid="edit-watchlist-dialog">
                      <DialogHeader>
                        <DialogTitle>Edit Watchlist</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="edit-watchlist-name">Name *</Label>
                          <Input
                            id="edit-watchlist-name"
                            value={newWatchlistName}
                            onChange={(e) => setNewWatchlistName(e.target.value)}
                            placeholder="Enter watchlist name"
                            data-testid="input-edit-watchlist-name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-watchlist-description">Description</Label>
                          <Textarea
                            id="edit-watchlist-description"
                            value={newWatchlistDescription}
                            onChange={(e) => setNewWatchlistDescription(e.target.value)}
                            placeholder="Enter watchlist description (optional)"
                            data-testid="input-edit-watchlist-description"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="edit-watchlist-public"
                            checked={newWatchlistIsPublic}
                            onChange={(e) => setNewWatchlistIsPublic(e.target.checked)}
                            data-testid="checkbox-edit-watchlist-public"
                          />
                          <Label htmlFor="edit-watchlist-public">Make this watchlist public</Label>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setIsEditWatchlistOpen(false);
                              setEditingWatchlist(null);
                            }}
                            data-testid="button-cancel-edit-watchlist"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleEditWatchlist}
                            disabled={editWatchlistMutation.isPending}
                            data-testid="button-save-edit-watchlist"
                          >
                            Update Watchlist
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
                    ) : (watchlists?.length ?? 0) > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="watchlists-movies-grid">
                        {watchlists?.map((watchlist) => (
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
                                <WatchlistItemCount watchlistId={watchlist.id} />
                                <div className="flex items-center gap-2">
                                  <Button variant="ghost" size="sm" onClick={() => openViewWatchlist(watchlist)} data-testid={`view-watchlist-${watchlist.id}`}>
                                    <Eye className="w-4 h-4 text-primary" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => openEditWatchlist(watchlist)} data-testid={`edit-watchlist-${watchlist.id}`}>
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => handleDeleteWatchlist(watchlist)} data-testid={`delete-watchlist-${watchlist.id}`}>
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
                    ) : (watchlists?.length ?? 0) > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="watchlists-tv-grid">
                        {watchlists?.map((watchlist) => (
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
                                <WatchlistItemCount watchlistId={watchlist.id} />
                                <div className="flex items-center gap-2">
                                  <Button variant="ghost" size="sm" onClick={() => openViewWatchlist(watchlist)} data-testid={`view-watchlist-${watchlist.id}`}>
                                    <Eye className="w-4 h-4 text-primary" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => openEditWatchlist(watchlist)} data-testid={`edit-watchlist-${watchlist.id}`}>
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => handleDeleteWatchlist(watchlist)} data-testid={`delete-watchlist-${watchlist.id}`}>
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
                    ) : (userReviews?.filter(r => r.mediaType === 'movie')?.length ?? 0) > 0 ? (
                      <div className="space-y-4" data-testid="reviews-movies-list">
                        {userReviews?.filter(r => r.mediaType === 'movie')?.map((review) => (
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
                    ) : (userReviews?.filter(r => r.mediaType === 'tv')?.length ?? 0) > 0 ? (
                      <div className="space-y-4" data-testid="reviews-tv-list">
                        {userReviews?.filter(r => r.mediaType === 'tv')?.map((review) => (
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

              <TabsContent value="profile" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-display font-bold" data-testid="profile-title">
                    Profile & Settings
                  </h2>
                </div>

                <Tabs defaultValue="account" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 max-w-lg">
                    <TabsTrigger value="account" data-testid="profile-tab-account">Account</TabsTrigger>
                    <TabsTrigger value="preferences" data-testid="profile-tab-preferences">Preferences</TabsTrigger>
                    <TabsTrigger value="history" data-testid="profile-tab-history">History</TabsTrigger>
                  </TabsList>

                  <TabsContent value="account" className="mt-6">
                    <Card data-testid="profile-account-card">
                      <CardHeader>
                        <CardTitle>Account Information</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Manage your account details and security settings
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Form {...profileForm}>
                          <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-4">
                            {/* Profile Picture Section */}
                            <div className="flex flex-col items-center space-y-4 pb-6 border-b">
                              <div className="relative">
                                <Avatar className="w-24 h-24">
                                  <AvatarImage 
                                    src={user?.profileImageUrl} 
                                    alt={user?.displayName || user?.username || "Profile picture"}
                                    data-testid="profile-avatar-image"
                                  />
                                  <AvatarFallback className="text-lg" data-testid="profile-avatar-fallback">
                                    <User className="w-8 h-8" />
                                  </AvatarFallback>
                                </Avatar>
                                {isUploadingAvatar && (
                                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                                    <div className="text-white text-sm font-medium">
                                      {uploadProgress}%
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              <div className="text-center">
                                <h3 className="font-medium text-sm">Profile Picture</h3>
                                <p className="text-xs text-muted-foreground">
                                  Upload a picture to personalize your profile
                                </p>
                              </div>

                              {isEditingProfile && (
                                <div className="flex flex-col items-center space-y-2">
                                  <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        handleAvatarUpload(file);
                                      }
                                    }}
                                    disabled={isUploadingAvatar}
                                    className="hidden"
                                    id="avatar-upload"
                                    data-testid="input-avatar-upload"
                                  />
                                  <label
                                    htmlFor="avatar-upload"
                                    className={`
                                      inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer
                                      ${isUploadingAvatar ? 'opacity-50 cursor-not-allowed' : ''}
                                    `}
                                    data-testid="button-upload-avatar"
                                  >
                                    <Upload className="w-4 h-4 mr-2" />
                                    {isUploadingAvatar ? 'Uploading...' : 'Change Picture'}
                                  </label>
                                  <p className="text-xs text-muted-foreground">
                                    JPEG, PNG, or WebP. Max 5MB.
                                  </p>
                                </div>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={profileForm.control}
                                name="firstName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>First Name</FormLabel>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        placeholder="Enter your first name"
                                        data-testid="input-first-name"
                                        disabled={!isEditingProfile}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={profileForm.control}
                                name="lastName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Last Name</FormLabel>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        placeholder="Enter your last name"
                                        data-testid="input-last-name"
                                        disabled={!isEditingProfile}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={profileForm.control}
                                name="email"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        type="email"
                                        placeholder="Enter your email"
                                        data-testid="input-email"
                                        disabled={!isEditingProfile}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={profileForm.control}
                                name="username"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Username</FormLabel>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        placeholder="Enter your username"
                                        data-testid="input-username"
                                        disabled={!isEditingProfile}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <div className="pt-4 border-t flex justify-between items-center">
                              {!isEditingProfile ? (
                                <Button 
                                  type="button" 
                                  onClick={handleEditProfile}
                                  data-testid="button-edit-profile"
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit Profile
                                </Button>
                              ) : (
                                <div className="flex gap-2">
                                  <Button 
                                    type="submit" 
                                    disabled={updateProfileMutation.isPending}
                                    data-testid="button-save-profile"
                                  >
                                    <Save className="w-4 h-4 mr-2" />
                                    {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                                  </Button>
                                  <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={handleCancelEditProfile}
                                    disabled={updateProfileMutation.isPending}
                                    data-testid="button-cancel-profile"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              )}
                            </div>
                          </form>
                        </Form>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="preferences" className="mt-6">
                    <div className="space-y-6">
                      <Card data-testid="profile-preferences-card">
                        <CardHeader>
                          <CardTitle>Recommendation Preferences</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Customize your movie and TV show recommendations
                          </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-3">
                            <h4 className="font-medium">Preferred Genres</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {[
                                "Action", "Adventure", "Animation", "Biography", "Comedy", "Crime",
                                "Documentary", "Drama", "Fantasy", "History", "Horror", "Music",
                                "Mystery", "Romance", "Sci-Fi", "Sport", "Thriller", "War", "Western"
                              ].map((genre) => (
                                <div key={genre} className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id={`genre-${genre.toLowerCase()}`}
                                    className="rounded"
                                    data-testid={`checkbox-genre-${genre.toLowerCase()}`}
                                    disabled
                                  />
                                  <Label htmlFor={`genre-${genre.toLowerCase()}`} className="text-sm">
                                    {genre}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card data-testid="profile-viewing-preferences-card">
                        <CardHeader>
                          <CardTitle>Viewing Preferences</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Set your content preferences and restrictions
                          </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <Label htmlFor="adult-content">Include Adult Content</Label>
                              <p className="text-sm text-muted-foreground">Show adult/mature content in recommendations</p>
                            </div>
                            <input
                              type="checkbox"
                              id="adult-content"
                              className="rounded"
                              data-testid="checkbox-adult-content"
                              disabled
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <Label htmlFor="auto-play">Auto-play Trailers</Label>
                              <p className="text-sm text-muted-foreground">Automatically play trailers when browsing</p>
                            </div>
                            <input
                              type="checkbox"
                              id="auto-play"
                              className="rounded"
                              data-testid="checkbox-auto-play"
                              disabled
                            />
                          </div>
                        </CardContent>
                      </Card>

                      <Card data-testid="profile-notification-preferences-card">
                        <CardHeader>
                          <CardTitle>Notification Preferences</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Choose what notifications you want to receive
                          </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <Label htmlFor="new-releases">New Releases</Label>
                              <p className="text-sm text-muted-foreground">Get notified about new movies and shows</p>
                            </div>
                            <input
                              type="checkbox"
                              id="new-releases"
                              className="rounded"
                              data-testid="checkbox-new-releases"
                              disabled
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <Label htmlFor="watchlist-updates">Watchlist Updates</Label>
                              <p className="text-sm text-muted-foreground">Notifications when watchlist items become available</p>
                            </div>
                            <input
                              type="checkbox"
                              id="watchlist-updates"
                              className="rounded"
                              data-testid="checkbox-watchlist-updates"
                              disabled
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="history" className="mt-6">
                    <Card data-testid="profile-history-card">
                      <CardHeader>
                        <CardTitle>Viewing History</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Keep track of what you've watched recently
                        </p>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
                            <Play className="w-8 h-8 text-muted-foreground" />
                          </div>
                          <h3 className="text-xl font-semibold mb-2">No viewing history yet</h3>
                          <p className="text-muted-foreground mb-4">
                            Your viewing history will appear here as you watch movies and TV shows
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Viewing history tracking will be available in a future update
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>

      {/* Delete Watchlist Confirmation Dialog */}
      <AlertDialog open={!!watchlistToDelete} onOpenChange={() => setWatchlistToDelete(null)}>
        <AlertDialogContent data-testid="delete-watchlist-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Watchlist</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{watchlistToDelete?.name}"? This will permanently remove the watchlist and all its items. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cancel-delete-watchlist">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteWatchlist}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="confirm-delete-watchlist"
            >
              Delete Watchlist
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Watchlist Dialog */}
      <Dialog open={isViewWatchlistOpen} onOpenChange={setIsViewWatchlistOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" data-testid="view-watchlist-dialog">
          <DialogHeader>
            <DialogTitle>
              {viewingWatchlist?.name} ({watchlistItems?.length || 0} items)
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {watchlistItemsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2 text-muted-foreground">Loading watchlist items...</span>
              </div>
            ) : watchlistItems && watchlistItems.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {watchlistItems.map((item) => (
                  <div key={item.id} className="group" data-testid={`watchlist-item-${item.id}`}>
                    <Link href={`/${item.mediaType}/${item.mediaId}`}>
                      <div className="aspect-[2/3] relative overflow-hidden rounded-lg bg-accent cursor-pointer">
                        <img
                          src={getImageUrl(item.mediaPosterPath)}
                          alt={item.mediaTitle}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                    </Link>
                    <div className="mt-2 space-y-1">
                      <h3 className="font-medium text-sm line-clamp-2" data-testid={`watchlist-item-title-${item.id}`}>
                        {item.mediaTitle}
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        {item.mediaType === 'movie' ? 'Movie' : 'TV Show'}
                      </Badge>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {item.mediaReleaseDate ? new Date(item.mediaReleaseDate).getFullYear() : 'TBA'}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeWatchlistItemMutation.mutate({
                            watchlistId: viewingWatchlist.id,
                            mediaType: item.mediaType,
                            mediaId: item.mediaId
                          })}
                          disabled={removeWatchlistItemMutation.isPending}
                          data-testid={`remove-watchlist-item-${item.id}`}
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Plus className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No items in this watchlist</h3>
                <p className="text-muted-foreground">
                  Start adding movies and TV shows to see them here
                </p>
              </div>
            )}
          </div>
          <div className="flex justify-end mt-6">
            <Button 
              variant="outline" 
              onClick={() => setIsViewWatchlistOpen(false)}
              data-testid="close-view-watchlist"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
}
