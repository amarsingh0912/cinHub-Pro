import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import SearchModal from "@/components/ui/search-modal";
import AuthModal from "@/components/ui/auth-modal";
import { Search, Moon, Sun, Film, Menu, X, User, LogOut, Settings, Shield, ChevronDown } from "lucide-react";

export default function Header() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/movies", label: "Movies" },
    { href: "/tv-shows", label: "TV Shows" },
    { href: "/about", label: "About Us" },
    { href: "/contact", label: "Contact Us" },
  ];

  if (isAuthenticated) {
    navItems.push({ href: "/dashboard", label: "Dashboard" });
    if (user?.isAdmin) {
      navItems.push({ href: "/admin", label: "Admin" });
    }
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border/50 shadow-sm" data-testid="header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/" data-testid="link-home">
                <div className="flex items-center space-x-3 cursor-pointer">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <Film className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl font-display font-bold">CineHub Pro</span>
                </div>
              </Link>
              
              <nav className="hidden md:flex items-center space-x-6">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href} data-testid={`link-${item.label.toLowerCase()}`}>
                    <span
                      className={`transition-colors cursor-pointer ${
                        location === item.href
                          ? "text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {item.label}
                    </span>
                  </Link>
                ))}
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Search Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSearchOpen(true)}
                data-testid="button-search"
              >
                <Search className="w-5 h-5" />
              </Button>
              
              {/* Theme Toggle */}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleTheme}
                data-testid="button-theme"
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </Button>
              
              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                data-testid="button-mobile-menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
              
              {/* Auth Section */}
              {isAuthenticated ? (
                <div className="hidden md:flex items-center space-x-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center space-x-2 h-10" data-testid="button-user-menu">
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
                      <DropdownMenuItem onSelect={() => window.location.href = '/api/auth/logout'} data-testid="link-logout">
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
                  data-testid="button-signin"
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
          
          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-border py-4" data-testid="mobile-menu">
              <nav className="flex flex-col space-y-2">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href} data-testid={`mobile-link-${item.label.toLowerCase()}`}>
                    <span
                      className={`block px-3 py-2 rounded-md transition-colors cursor-pointer ${
                        location === item.href
                          ? "bg-accent text-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.label}
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
                        onClick={() => window.location.href = '/api/auth/logout'} 
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
    </>
  );
}
