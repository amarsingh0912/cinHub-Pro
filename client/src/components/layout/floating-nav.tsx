import { Home, Search, Heart, User } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import SearchModal from "@/components/ui/search-modal";

export default function FloatingNav() {
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const navItems = [
    { 
      icon: Home, 
      label: "Home", 
      href: "/",
      active: location === "/"
    },
    { 
      icon: Search, 
      label: "Search", 
      onClick: () => setIsSearchOpen(true),
      active: false
    },
    { 
      icon: Heart, 
      label: "Watchlist", 
      href: isAuthenticated ? "/dashboard?tab=watchlists" : "/",
      active: location.includes("/dashboard")
    },
    { 
      icon: User, 
      label: "Profile", 
      href: isAuthenticated ? "/dashboard" : "/",
      active: location === "/dashboard"
    },
  ];

  return (
    <>
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border shadow-2xl"
        data-testid="floating-nav"
      >
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const content = (
              <button
                onClick={item.onClick}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all duration-300",
                  item.active 
                    ? "text-primary bg-primary/10 scale-110" 
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
                aria-label={item.label}
                data-testid={`floating-nav-${item.label.toLowerCase()}`}
              >
                <Icon className={cn("w-5 h-5", item.active && "drop-shadow-glow")} />
                <span className="text-xs font-medium">{item.label}</span>
                {item.active && (
                  <div className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full" />
                )}
              </button>
            );

            return item.href ? (
              <Link key={item.label} href={item.href}>
                {content}
              </Link>
            ) : (
              <div key={item.label}>{content}</div>
            );
          })}
        </div>
      </nav>
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
