import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import SearchModal from "@/components/ui/search-modal";
import AuthModal from "@/components/ui/auth-modal";
import {
  Search,
  Moon,
  Sun,
  Film,
  Menu,
  X,
  User,
  LogOut,
  Settings,
  Shield,
  ChevronDown,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Header() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/movies", label: "Movies" },
    { href: "/tv-shows", label: "TV Shows" },
    { href: "/about", label: "About Us" },
    { href: "/contact", label: "Contact Us" },
  ];

  const handleLogoutClick = () => setIsLogoutConfirmOpen(true);

  const handleLogoutConfirm = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout", {});
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      window.location.href = "/";
    } catch (error) {
      toast({
        title: "Logout Failed",
        description: "There was an error logging you out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLogoutConfirmOpen(false);
    }
  };

  return (
    <>
      {/* Fixed Top Header */}
      <header
        className="fixed top-0 left-0 right-0 z-50 border-b border-border/25 shadow-xl backdrop-blur-2xl bg-gradient-to-r from-background/95 via-card/90 to-background/95"
        data-testid="header"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Section */}
            <div className="flex items-center gap-6">
              <Link href="/" data-testid="link-home">
                <div className="flex items-center gap-3 cursor-pointer group rounded-xl px-3 py-2 hover:bg-primary/5 transition-all duration-300">
                  <div className="relative w-10 h-10 primary-gradient rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-primary/40 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                    <Film className="w-5 h-5 text-white" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-lg font-display font-extrabold bg-gradient-to-r from-primary via-primary-300 to-secondary bg-clip-text text-transparent">
                      CineHub Pro
                    </span>
                    <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                      Movie Discovery
                    </span>
                  </div>
                </div>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden nav:flex items-center space-x-2">
                {navItems.map((item) => {
                  const isActive = location === item.href;
                  return (
                    <Link key={item.href} href={item.href}>
                      <span
                        className={`relative px-5 py-2 rounded-lg text-sm font-medium cursor-pointer select-none transition-all duration-300 ${
                          isActive
                            ? "text-primary bg-transparent font-semibold"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent/10"
                        }`}
                      >
                        {item.label}
                        {isActive && (
                          <span className="absolute left-1/2 -bottom-[3px] w-10 h-[2px] bg-gradient-to-r from-primary to-secondary rounded-full transform -translate-x-1/2 animate-pulse-glow" />
                        )}
                      </span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Right Side Buttons */}
            <div className="flex items-center space-x-3">
              {/* Search */}
              <Button
                variant="glass"
                size="icon"
                onClick={() => setIsSearchOpen(true)}
                className="hover:scale-105 hover:shadow-lg transition-all duration-300"
              >
                <Search className="w-5 h-5" />
              </Button>

              {/* Theme Toggle */}
              <Button
                variant="glass"
                size="icon"
                onClick={toggleTheme}
                title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                className="hover:scale-105 hover:shadow-lg transition-all duration-300"
              >
                {theme === "dark" ? (
                  <Sun className="w-5 h-5 hover:rotate-12 transition-transform duration-300" />
                ) : (
                  <Moon className="w-5 h-5 hover:-rotate-12 transition-transform duration-300" />
                )}
              </Button>

              {/* Mobile Menu Toggle */}
              <Button
                variant="glass"
                size="icon"
                className="nav:hidden hover:scale-105 hover:shadow-lg transition-all duration-300"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </Button>

              {/* Auth Section */}
              {isAuthenticated ? (
                <div className="hidden nav:flex items-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="glass" className="flex items-center gap-2 h-10">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={user?.profileImageUrl || ""} />
                          <AvatarFallback className="bg-primary text-white text-sm">
                            {(user?.firstName?.[0] || user?.displayName?.[0] || "U").toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">
                          {user?.firstName || user?.displayName || "User"}
                        </span>
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <div className="px-2 py-1.5">
                        <p className="text-sm font-medium">
                          {user?.displayName || `${user?.firstName || ""} ${user?.lastName || ""}`.trim()}
                        </p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => setLocation("/dashboard")}>
                        <User className="w-4 h-4 mr-2" /> Profile & Dashboard
                      </DropdownMenuItem>
                      {user?.isAdmin && (
                        <DropdownMenuItem onSelect={() => setLocation("/admin")}>
                          <Shield className="w-4 h-4 mr-2" /> Admin Panel
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onSelect={() => setLocation("/settings")}>
                        <Settings className="w-4 h-4 mr-2" /> Settings
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={handleLogoutClick}>
                        <LogOut className="w-4 h-4 mr-2" /> Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <Button
                  onClick={() => setIsSignInOpen(true)}
                  className="hidden nav:inline-flex"
                  variant="gradient"
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="nav:hidden border-t border-border/30 py-4 backdrop-blur-lg">
              <nav className="flex flex-col space-y-2">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <span
                      className={`block px-5 py-3 rounded-lg cursor-pointer transition-all duration-300 ${
                        location === item.href
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/20"
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.label}
                    </span>
                  </Link>
                ))}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Modals */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <AuthModal isOpen={isSignInOpen} onClose={() => setIsSignInOpen(false)} />

      {/* Logout Confirmation */}
      <AlertDialog open={isLogoutConfirmOpen} onOpenChange={setIsLogoutConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to sign out? You will need to sign in again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogoutConfirm}>Sign Out</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
