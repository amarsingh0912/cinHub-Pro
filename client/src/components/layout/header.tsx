import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SearchModal from "@/components/ui/search-modal";
import SignInModal from "@/components/ui/sign-in-modal";
import { Search, Moon, Sun, Film, Menu, X } from "lucide-react";

export default function Header() {
  const [location] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/movies", label: "Movies" },
    { href: "/search", label: "Search" },
  ];

  if (isAuthenticated) {
    navItems.push({ href: "/dashboard", label: "Dashboard" });
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border" data-testid="header">
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
              
              {/* Auth Buttons */}
              {isAuthenticated ? (
                <div className="hidden md:flex items-center space-x-3">
                  <span className="text-sm text-muted-foreground" data-testid="text-welcome">
                    Welcome, {user?.firstName || 'User'}
                  </span>
                  <Button asChild data-testid="button-logout">
                    <a href="/api/logout">Sign Out</a>
                  </Button>
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
                    <div className="text-sm text-muted-foreground mb-2" data-testid="mobile-text-welcome">
                      Welcome, {user?.firstName || 'User'}
                    </div>
                    <Button asChild variant="outline" className="w-full" data-testid="mobile-button-logout">
                      <a href="/api/logout">Sign Out</a>
                    </Button>
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
      <SignInModal isOpen={isSignInOpen} onClose={() => setIsSignInOpen(false)} />
    </>
  );
}
