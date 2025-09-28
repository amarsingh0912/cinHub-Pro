import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import SearchModal from "@/components/ui/search-modal";
import AuthModal from "@/components/ui/auth-modal";
import { Search, Moon, Sun, Film, Menu, X, User, LogOut, Settings, Shield, ChevronDown } from "lucide-react";
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


  const handleLogoutClick = () => {
    setIsLogoutConfirmOpen(true);
  };

  const handleLogoutConfirm = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout", {});
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      // Redirect to home page
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
      <header className="fixed top-0 left-0 right-0 z-50 glassmorphism border-b border-border/25 shadow-2xl backdrop-blur-2xl bg-gradient-to-r from-background/98 via-card/95 to-background/98" data-testid="header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/" data-testid="link-home">
                <div className="interactive flex items-center space-x-3 cursor-pointer group rounded-xl px-3 py-2 -ml-3 hover:bg-primary/5 transition-all duration-300">
                  <div className="relative w-12 h-12 primary-gradient rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-primary/50 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                    <Film className="w-6 h-6 text-white drop-shadow-md" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xl font-display font-black bg-gradient-to-r from-primary via-primary-300 to-secondary bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">CineHub Pro</span>
                    <span className="text-xs font-medium text-muted-foreground/60 tracking-widest uppercase">Movie Discovery</span>
                  </div>
                </div>
              </Link>
              
              <nav className="hidden md:flex items-center space-x-2">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href} data-testid={`link-${item.label.toLowerCase()}`}>
                    <span
                      className={`interactive px-5 py-3 rounded-xl cursor-pointer relative group backdrop-blur-sm border-2 transition-all duration-300 font-medium text-sm tracking-tight focus:ring-2 focus:ring-primary/30 focus:outline-none ${
                        location === item.href
                          ? "text-primary bg-gradient-to-br from-primary/15 to-primary/5 border-primary/40 shadow-lg shadow-primary/10 ring-2 ring-primary/20"
                          : "text-muted-foreground hover:text-foreground hover:bg-gradient-to-br hover:from-accent/50 hover:to-accent/20 border-transparent hover:border-accent/50 hover:shadow-lg hover:shadow-accent/10 hover:ring-2 hover:ring-accent/20"
                      }`}
                    >
                      {item.label}
                      {location === item.href && (
                        <>
                          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-primary to-secondary rounded-full animate-scale-in" />
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/10 via-transparent to-secondary/10 opacity-50 -z-10" />
                        </>
                      )}
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/8 via-transparent to-secondary/8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
                    </span>
                  </Link>
                ))}
              </nav>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Search Toggle */}
              <Button
                variant="glass"
                size="icon"
                onClick={() => setIsSearchOpen(true)}
                data-testid="button-search"
                className="hover:scale-105 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 hover:border-primary/30"
              >
                <Search className="w-5 h-5 transition-transform duration-200" />
              </Button>
              
              {/* Theme Toggle */}
              <Button 
                variant="glass" 
                size="icon" 
                onClick={toggleTheme}
                data-testid="button-theme"
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                className="hover:scale-105 hover:shadow-lg hover:shadow-secondary/20 transition-all duration-300 hover:border-secondary/30"
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5 hover:rotate-12 transition-transform duration-300" />
                ) : (
                  <Moon className="w-5 h-5 hover:-rotate-12 transition-transform duration-300" />
                )}
              </Button>
              
              {/* Mobile Menu Toggle */}
              <Button
                variant="glass"
                size="icon"
                className="md:hidden hover:scale-105 hover:shadow-lg hover:shadow-accent/20 transition-all duration-300"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                data-testid="button-mobile-menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5 hover:rotate-90 transition-transform duration-300" />
                ) : (
                  <Menu className="w-5 h-5 transition-transform duration-200" />
                )}
              </Button>
              
              {/* Auth Section */}
              {isAuthenticated ? (
                <div className="hidden md:flex items-center space-x-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="glass" className="flex items-center space-x-2 h-10 hover:shadow-glow" data-testid="button-user-menu">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={user?.profileImageUrl || ''} alt={user?.displayName || user?.firstName || 'User'} />
                          <AvatarFallback className="bg-primary text-white text-sm">
                            {(user?.firstName?.[0] || user?.displayName?.[0] || 'U').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{user?.firstName || user?.displayName || 'User'}</span>
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56" data-testid="user-dropdown">
                      <div className="px-2 py-1.5">
                        <p className="text-sm font-medium">{user?.displayName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User'}</p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => setLocation('/dashboard')} data-testid="link-profile">
                        <User className="w-4 h-4 mr-2" />
                        Profile & Dashboard
                      </DropdownMenuItem>
                      {user?.isAdmin && (
                        <DropdownMenuItem onSelect={() => setLocation('/admin')} data-testid="link-admin">
                          <Shield className="w-4 h-4 mr-2" />
                          Admin Panel
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onSelect={() => setLocation('/dashboard')} data-testid="link-settings">
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={handleLogoutClick} data-testid="link-logout">
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <Button
                  onClick={() => setIsSignInOpen(true)}
                  className="hidden md:inline-flex"
                  variant="gradient"
                  data-testid="button-signin"
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
          
          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-border/30 py-6 animate-slide-down backdrop-blur-lg" data-testid="mobile-menu">
              <nav className="flex flex-col space-y-3 animate-stagger-in">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href} data-testid={`mobile-link-${item.label.toLowerCase()}`}>
                    <span
                      className={`block px-5 py-4 rounded-xl cursor-pointer transition-all duration-300 backdrop-blur-sm border ${
                        location === item.href
                          ? "bg-primary/15 text-primary font-semibold border-primary/30 shadow-sm scale-[1.02]"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/60 hover:translate-x-2 hover:shadow-md border-transparent hover:border-accent/30"
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.label}
                      {location === item.href && (
                        <div className="w-2 h-2 bg-primary rounded-full ml-auto animate-pulse" />
                      )}
                    </span>
                  </Link>
                ))}
                
                {isAuthenticated ? (
                  <div className="px-3 py-2 border-t border-border mt-2 pt-4">
                    <div className="flex items-center space-x-3 mb-4">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={user?.profileImageUrl || ''} alt={user?.displayName || user?.firstName || 'User'} />
                        <AvatarFallback className="bg-primary text-white">
                          {(user?.firstName?.[0] || user?.displayName?.[0] || 'U').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium" data-testid="mobile-text-welcome">
                          {user?.displayName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User'}
                        </div>
                        <div className="text-xs text-muted-foreground">{user?.email}</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {user?.isAdmin && (
                          <Button 
                          onClick={() => {
                            setLocation('/admin');
                            setIsMobileMenuOpen(false);
                          }} 
                          variant="outline" 
                          size="sm" 
                          className="w-full justify-start" 
                          data-testid="mobile-button-admin"
                        >
                          <Shield className="w-4 h-4 mr-2" />
                          Admin Panel
                        </Button>
                      )}
                      <Button 
                        onClick={() => {
                          setLocation('/dashboard');
                          setIsMobileMenuOpen(false);
                        }} 
                        variant="outline" 
                        size="sm" 
                        className="w-full justify-start" 
                        data-testid="mobile-button-settings"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </Button>
                      <Button 
                        onClick={handleLogoutClick}
                        variant="outline" 
                        size="sm" 
                        className="w-full justify-start" 
                        data-testid="mobile-button-logout"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="px-3 py-2 border-t border-border mt-2 pt-4">
                    <Button
                      onClick={() => {
                        setIsSignInOpen(true);
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full"
                      variant="gradient"
                      data-testid="mobile-button-signin"
                    >
                      Sign In
                    </Button>
                  </div>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>
      
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <AuthModal isOpen={isSignInOpen} onClose={() => setIsSignInOpen(false)} />
      
      {/* Logout Confirmation Dialog */}
      <AlertDialog open={isLogoutConfirmOpen} onOpenChange={setIsLogoutConfirmOpen}>
        <AlertDialogContent data-testid="logout-confirmation-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to sign out? You will need to sign in again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cancel-logout">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleLogoutConfirm}
              data-testid="confirm-logout"
            >
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
