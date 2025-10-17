import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
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
import { cn } from "@/lib/utils";

export default function Header() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up');
  const [lastScrollY, setLastScrollY] = useState(0);

  // Enhanced scroll behavior for sticky header
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Determine if scrolled past threshold
      setIsScrolled(currentScrollY > 20);
      
      // Determine scroll direction
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setScrollDirection('down');
      } else {
        setScrollDirection('up');
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

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
      {/* Enhanced Fixed Top Header with Scroll Behavior */}
      <motion.header
        initial={{ y: 0 }}
        animate={{ 
          y: scrollDirection === 'down' && lastScrollY > 200 ? -100 : 0,
        }}
        transition={{ 
          duration: 0.3, 
          ease: [0.25, 0.1, 0.25, 1],
        }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          isScrolled 
            ? "border-b border-border/40 shadow-2xl backdrop-blur-xl bg-background/98 dark:bg-background/95"
            : "border-b border-border/20 shadow-lg backdrop-blur-lg bg-gradient-to-r from-background/90 via-card/85 to-background/90"
        )}
        data-testid="header"
        role="banner"
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={cn(
            "flex items-center justify-between transition-all duration-300",
            isScrolled ? "h-14" : "h-16"
          )}>
            {/* Enhanced Brand Section */}
            <div className="flex items-center gap-6">
              <Link href="/" data-testid="link-home" aria-label="CineHub Pro Home">
                <motion.div 
                  className="flex items-center gap-3 cursor-pointer group rounded-xl px-3 py-2 hover:bg-primary/10 transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.div 
                    className="relative w-10 h-10 primary-gradient rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-primary/50 transition-shadow duration-300"
                    whileHover={{ rotate: [0, -3, 3, -3, 0], scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Film className="w-5 h-5 text-white" aria-hidden="true" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                  </motion.div>
                  <div className="flex flex-col">
                    <span className="text-lg font-display font-extrabold bg-gradient-to-r from-primary via-primary-300 to-secondary bg-clip-text text-transparent">
                      CineHub Pro
                    </span>
                    <motion.span 
                      className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider"
                      initial={{ opacity: 0.6 }}
                      whileHover={{ opacity: 1 }}
                    >
                      Movie Discovery
                    </motion.span>
                  </div>
                </motion.div>
              </Link>

              {/* Enhanced Desktop Navigation */}
              <nav className="hidden nav:flex items-center space-x-2" role="navigation" aria-label="Primary navigation">
                {navItems.map((item, index) => {
                  const isActive = location === item.href;
                  return (
                    <Link key={item.href} href={item.href} aria-current={isActive ? 'page' : undefined}>
                      <motion.span
                        className={cn(
                          "relative inline-block px-5 py-2 rounded-lg text-sm font-medium cursor-pointer select-none transition-all duration-300",
                          isActive
                            ? "text-primary bg-primary/5 font-semibold"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent/20"
                        )}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        {item.label}
                        <AnimatePresence>
                          {isActive && (
                            <motion.span 
                              className="absolute left-1/2 bottom-[-12px] w-10 h-[2px] bg-gradient-to-r from-primary to-secondary rounded-full"
                              layoutId="activeNavIndicator"
                              initial={{ opacity: 0, scaleX: 0 }}
                              animate={{ opacity: 1, scaleX: 1, x: '-50%' }}
                              exit={{ opacity: 0, scaleX: 0 }}
                              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                              style={{ originX: 0.5 }}
                            />
                          )}
                        </AnimatePresence>
                      </motion.span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Enhanced Right Side Buttons */}
            <div className="flex items-center space-x-3">
              {/* Search Button with Animation */}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="glass"
                  size="icon"
                  onClick={() => setIsSearchOpen(true)}
                  className="hover:shadow-lg hover:shadow-primary/20 transition-all duration-300"
                  aria-label="Open search"
                >
                  <Search className="w-5 h-5" aria-hidden="true" />
                </Button>
              </motion.div>

              {/* Theme Toggle with Rotation Animation */}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="glass"
                  size="icon"
                  onClick={toggleTheme}
                  title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                  aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                  className="hover:shadow-lg hover:shadow-secondary/20 transition-all duration-300"
                >
                  <AnimatePresence mode="wait">
                    {theme === "dark" ? (
                      <motion.div
                        key="sun"
                        initial={{ rotate: -90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 90, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Sun className="w-5 h-5" aria-hidden="true" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="moon"
                        initial={{ rotate: 90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: -90, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Moon className="w-5 h-5" aria-hidden="true" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.div>

              {/* Mobile Menu Toggle with Icon Animation */}
              <motion.div 
                className="nav:hidden"
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="glass"
                  size="icon"
                  className="hover:shadow-lg transition-all duration-300"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                  aria-expanded={isMobileMenuOpen}
                >
                  <AnimatePresence mode="wait">
                    {isMobileMenuOpen ? (
                      <motion.div
                        key="close"
                        initial={{ rotate: -90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <X className="w-5 h-5" aria-hidden="true" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="menu"
                        initial={{ rotate: 90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: -90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Menu className="w-5 h-5" aria-hidden="true" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.div>

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

          {/* Enhanced Mobile Menu with Animations */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                className="nav:hidden border-t border-border/30 py-4 backdrop-blur-lg overflow-hidden"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <nav className="flex flex-col space-y-2" role="navigation" aria-label="Mobile navigation">
                  {navItems.map((item, index) => (
                    <Link key={item.href} href={item.href}>
                      <motion.a
                        className={cn(
                          "block px-5 py-3 rounded-lg cursor-pointer transition-all duration-300",
                          location === item.href
                            ? "bg-primary/10 text-primary font-semibold"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent/20"
                        )}
                        onClick={() => setIsMobileMenuOpen(false)}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        whileTap={{ scale: 0.98 }}
                        aria-current={location === item.href ? 'page' : undefined}
                      >
                        {item.label}
                      </motion.a>
                    </Link>
                  ))}
                </nav>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.header>

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
