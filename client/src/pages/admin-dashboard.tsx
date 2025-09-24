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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Users, Activity, Star, List, BarChart3, Settings, Shield, Trash2 } from "lucide-react";
import type { User } from "@shared/schema";

// Type definitions for admin data
interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalReviews: number;
  totalWatchlists: number;
}

export default function AdminDashboard() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const { data: adminStats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    enabled: !!isAuthenticated && !!user?.isAdmin,
    retry: false,
  });

  const { data: allUsers, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: !!isAuthenticated && !!user?.isAdmin,
    retry: false,
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: async ({userId, isAdmin}: {userId: string, isAdmin: boolean}) => {
      await apiRequest("PATCH", `/api/admin/users/${userId}/role`, { isAdmin });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User Role Updated",
        description: "The user's role has been updated successfully.",
      });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You don't have permission to perform this action.",
          variant: "destructive",
        });
        return;
      }
      const errorMessage = error?.message || "Failed to update user role.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const updateUserStatusMutation = useMutation({
    mutationFn: async ({userId, isVerified}: {userId: string, isVerified: boolean}) => {
      await apiRequest("PATCH", `/api/admin/users/${userId}/status`, { isVerified });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User Status Updated",
        description: "The user's status has been updated successfully.",
      });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You don't have permission to perform this action.",
          variant: "destructive",
        });
        return;
      }
      const errorMessage = error?.message || "Failed to update user status.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("DELETE", `/api/admin/users/${userId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setUserToDelete(null);
      toast({
        title: "User Deleted",
        description: "The user has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You don't have permission to perform this action.",
          variant: "destructive",
        });
        return;
      }
      const errorMessage = error?.message || "Failed to delete user.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Redirect to home if not authenticated or not admin
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || (user && !user.isAdmin))) {
      toast({
        title: "Unauthorized",
        description: "Admin access required. Redirecting...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
      return;
    }
  }, [isAuthenticated, authLoading, user, toast]);

  if (authLoading || (isAuthenticated && !user)) {
    return (
      <div className="min-h-screen bg-background text-foreground" data-testid="admin-loading">
        <Header />
        <div className="pt-16 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading admin dashboard...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated || !user?.isAdmin) {
    return (
      <div className="min-h-screen bg-background text-foreground" data-testid="admin-unauthorized">
        <Header />
        <div className="pt-16 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Shield className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-muted-foreground mb-6">You don't have permission to access the admin dashboard.</p>
            <Button onClick={() => window.location.href = "/"}>Go Home</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="admin-dashboard-page">
      <Header />
      
      <main className="pt-16">
        {/* Admin Header */}
        <section className="py-8 border-b border-border bg-card/20" data-testid="admin-header">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-display font-bold" data-testid="admin-title">
                    Admin Dashboard
                  </h1>
                  <p className="text-muted-foreground" data-testid="admin-welcome">
                    Welcome back, {user.firstName || 'Admin'}
                  </p>
                </div>
              </div>
              <Badge variant="destructive" className="px-3 py-1">
                <Shield className="w-4 h-4 mr-1" />
                Admin Access
              </Badge>
            </div>
          </div>
        </section>

        {/* Stats Overview */}
        <section className="py-8" data-testid="admin-stats">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="w-4 h-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="stat-total-users">
                    {statsLoading ? "..." : adminStats?.totalUsers?.toLocaleString() || "0"}
                  </div>
                  <p className="text-xs text-muted-foreground">Registered users</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <Activity className="w-4 h-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="stat-active-users">
                    {statsLoading ? "..." : adminStats?.activeUsers?.toLocaleString() || "0"}
                  </div>
                  <p className="text-xs text-muted-foreground">Last 30 days</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
                  <Star className="w-4 h-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="stat-total-reviews">
                    {statsLoading ? "..." : adminStats?.totalReviews?.toLocaleString() || "0"}
                  </div>
                  <p className="text-xs text-muted-foreground">User reviews</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Watchlists</CardTitle>
                  <List className="w-4 h-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="stat-total-watchlists">
                    {statsLoading ? "..." : adminStats?.totalWatchlists?.toLocaleString() || "0"}
                  </div>
                  <p className="text-xs text-muted-foreground">Created watchlists</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Admin Tabs */}
        <section className="py-8" data-testid="admin-content">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Tabs defaultValue="users" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="users" data-testid="tab-users">
                  <Users className="w-4 h-4 mr-2" />
                  User Management
                </TabsTrigger>
                <TabsTrigger value="analytics" data-testid="tab-analytics">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger value="settings" data-testid="tab-settings">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </TabsTrigger>
              </TabsList>

              <TabsContent value="users" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-display font-bold" data-testid="users-title">
                    User Management
                  </h2>
                  <div className="text-sm text-muted-foreground">
                    Total: {allUsers?.length ?? 0} users
                  </div>
                </div>

                {usersLoading ? (
                  <div className="flex items-center justify-center py-12" data-testid="users-loading">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-2 text-muted-foreground">Loading users...</span>
                  </div>
                ) : (allUsers?.length ?? 0) > 0 ? (
                  <Card data-testid="users-table-card">
                    <CardHeader>
                      <CardTitle>Recent Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody data-testid="users-table-body">
                          {allUsers?.slice(0, 10).map((user) => (
                            <TableRow key={user.id} data-testid={`user-row-${user.id}`}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  {user.profileImageUrl ? (
                                    <img
                                      src={user.profileImageUrl}
                                      alt={`${user.firstName || 'User'}'s profile`}
                                      className="w-8 h-8 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                                      <Users className="w-4 h-4" />
                                    </div>
                                  )}
                                  <div>
                                    <div className="font-medium" data-testid={`user-name-${user.id}`}>
                                      {user.firstName && user.lastName 
                                        ? `${user.firstName} ${user.lastName}` 
                                        : user.firstName || user.email?.split('@')[0] || 'Anonymous'
                                      }
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell data-testid={`user-email-${user.id}`}>
                                {user.email || 'Not provided'}
                              </TableCell>
                              <TableCell data-testid={`user-joined-${user.id}`}>
                                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={user.isAdmin ? "admin" : "user"}
                                  onValueChange={(value) => {
                                    const isAdmin = value === "admin";
                                    updateUserRoleMutation.mutate({ userId: user.id, isAdmin });
                                  }}
                                  disabled={updateUserRoleMutation.isPending}
                                >
                                  <SelectTrigger className="w-24" data-testid={`user-role-${user.id}`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="user">User</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={user.isVerified ? "verified" : "unverified"}
                                  onValueChange={(value) => {
                                    const isVerified = value === "verified";
                                    updateUserStatusMutation.mutate({ userId: user.id, isVerified });
                                  }}
                                  disabled={updateUserStatusMutation.isPending}
                                >
                                  <SelectTrigger className="w-28" data-testid={`user-status-${user.id}`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="unverified">Unverified</SelectItem>
                                    <SelectItem value="verified">Verified</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setUserToDelete(user)}
                                  disabled={deleteUserMutation.isPending}
                                  data-testid={`delete-user-${user.id}`}
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="text-center py-12" data-testid="users-empty">
                    <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold mb-2">No users found</h3>
                    <p className="text-muted-foreground">No users have registered yet.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <h2 className="text-2xl font-display font-bold" data-testid="analytics-title">
                  Platform Analytics
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card data-testid="analytics-overview-card">
                    <CardHeader>
                      <CardTitle>Platform Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">User Growth Rate</span>
                          <Badge variant="default">+12.5%</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Daily Active Users</span>
                          <span className="font-semibold" data-testid="daily-active-users">
                            {adminStats?.activeUsers || 0}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Avg. Reviews per User</span>
                          <span className="font-semibold">
                            {adminStats?.totalUsers && adminStats?.totalReviews 
                              ? (adminStats.totalReviews / adminStats.totalUsers).toFixed(1)
                              : "0"
                            }
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card data-testid="analytics-engagement-card">
                    <CardHeader>
                      <CardTitle>User Engagement</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Total Favorites</span>
                          <span className="font-semibold">Coming Soon</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Public Watchlists</span>
                          <span className="font-semibold">Coming Soon</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Public Reviews</span>
                          <span className="font-semibold">Coming Soon</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card data-testid="analytics-placeholder">
                  <CardContent className="pt-6">
                    <div className="text-center py-12">
                      <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <h3 className="text-xl font-semibold mb-2">Advanced Analytics Coming Soon</h3>
                      <p className="text-muted-foreground">
                        Detailed charts and metrics will be available in the next update.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                <h2 className="text-2xl font-display font-bold" data-testid="settings-title">
                  Platform Settings
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card data-testid="settings-general-card">
                    <CardHeader>
                      <CardTitle>General Settings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Platform Name</span>
                          <span className="font-semibold">CineHub Pro</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Version</span>
                          <Badge variant="secondary">v2.0.0</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">TMDB Integration</span>
                          <Badge variant="default">Active</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card data-testid="settings-features-card">
                    <CardHeader>
                      <CardTitle>Feature Flags</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">User Registration</span>
                          <Badge variant="default">Enabled</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Public Reviews</span>
                          <Badge variant="default">Enabled</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Watchlist Sharing</span>
                          <Badge variant="default">Enabled</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card data-testid="settings-placeholder">
                  <CardContent className="pt-6">
                    <div className="text-center py-12">
                      <Settings className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <h3 className="text-xl font-semibold mb-2">Advanced Settings Coming Soon</h3>
                      <p className="text-muted-foreground">
                        More configuration options will be available in future updates.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>
      
      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent data-testid="delete-user-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{userToDelete?.firstName && userToDelete?.lastName 
                ? `${userToDelete.firstName} ${userToDelete.lastName}` 
                : userToDelete?.firstName || userToDelete?.email?.split('@')[0] || 'this user'
              }"? This action cannot be undone and will permanently remove the user and all their data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cancel-delete-user">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => userToDelete && deleteUserMutation.mutate(userToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="confirm-delete-user"
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Footer />
    </div>
  );
}
