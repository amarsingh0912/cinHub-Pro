import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { ThemeProvider } from "@/contexts/ThemeContext";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Movies from "@/pages/movies";
import TVShows from "@/pages/tv-shows";
import MovieDetail from "@/pages/movie-detail";
import TVDetail from "@/pages/tv-detail";
import Search from "@/pages/search";
import Collection from "@/pages/collection";
import Genre from "@/pages/genre";
import Person from "@/pages/person";
import Dashboard from "@/pages/dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import About from "@/pages/about";
import Contact from "@/pages/contact";
import PrivacyPolicy from "@/pages/privacy-policy";
import TermsOfService from "@/pages/terms-of-service";
import NotificationsDemo from "@/pages/notifications-demo";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();

  // Scroll to top when location changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location]);

  // OAuth success/failure query param cleanup
  useEffect(() => {
    // Check for OAuth success/failure query params and clean them up
    if (!isLoading && location === '/') {
      const urlParams = new URLSearchParams(window.location.search);
      const authParam = urlParams.get('auth');
      
      if (authParam === 'success' || authParam === 'failed') {
        // Clear the query parameter
        window.history.replaceState({}, document.title, '/');
      }
    }
  }, [isLoading, location]);

  return (
    <Switch>
      {/* Routes available to everyone */}
      <Route path="/movies" component={Movies} />
      <Route path="/tv-shows" component={TVShows} />
      <Route path="/movie/:id" component={MovieDetail} />
      <Route path="/tv/:id" component={TVDetail} />
      <Route path="/search" component={Search} />
      <Route path="/collection/:category" component={Collection} />
      <Route path="/genre/:genreId" component={Genre} />
      <Route path="/person/:personId" component={Person} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms-of-service" component={TermsOfService} />
      <Route path="/notifications-demo" component={NotificationsDemo} />
      
      {/* Conditional home page based on authentication */}
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/admin" component={AdminDashboard} />
        </>
      )}
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
