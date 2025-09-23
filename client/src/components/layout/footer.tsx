import { Link } from "wouter";
import { Film, Mail, MapPin, Phone, Heart, Star, Zap } from "lucide-react";
import { FaTwitter, FaInstagram, FaFacebook, FaGithub, FaDiscord, FaYoutube } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-card to-card/50 border-t border-border/50 relative overflow-hidden" data-testid="footer">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-20 h-20 border border-primary/20 rounded-full" />
        <div className="absolute bottom-20 right-20 w-32 h-32 border border-secondary/20 rounded-full" />
        <div className="absolute top-1/2 left-1/3 w-16 h-16 border border-accent/30 rounded-full" />
      </div>
      
      <div className="relative">
        {/* Newsletter Section */}
        <div className="border-b border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-4">
                <Mail className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Stay Updated</span>
              </div>
              <h3 className="text-2xl font-display font-bold mb-3">Never Miss a Great Movie</h3>
              <p className="text-muted-foreground mb-6">
                Get weekly recommendations, new releases, and exclusive content straight to your inbox.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <Input 
                  type="email" 
                  placeholder="Enter your email"
                  className="flex-1"
                  data-testid="input-newsletter-email"
                />
                <Button className="min-w-[120px]" data-testid="button-newsletter-subscribe">
                  <Mail className="w-4 h-4 mr-2" />
                  Subscribe
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Footer Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
            {/* Brand Section */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg">
                  <Film className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-display font-bold">CineHub Pro</span>
              </div>
              <p className="text-muted-foreground mb-6 text-lg leading-relaxed">
                Your ultimate destination for movie discovery. Find your next favorite film with our extensive database, personalized recommendations, and vibrant community of film enthusiasts.
              </p>
              
              {/* Key Features */}
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3 text-sm">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span>50K+ Movies & TV Shows</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Heart className="w-4 h-4 text-red-500" />
                  <span>Personalized Recommendations</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Zap className="w-4 h-4 text-blue-500" />
                  <span>Real-time Updates</span>
                </div>
              </div>
              
              {/* Social Media */}
              <div className="flex space-x-4">
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-background/50 hover:bg-primary/10 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                  data-testid="link-twitter"
                  aria-label="Follow us on Twitter"
                >
                  <FaTwitter className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-background/50 hover:bg-primary/10 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                  data-testid="link-instagram"
                  aria-label="Follow us on Instagram"
                >
                  <FaInstagram className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-background/50 hover:bg-primary/10 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                  data-testid="link-facebook"
                  aria-label="Follow us on Facebook"
                >
                  <FaFacebook className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                </a>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-background/50 hover:bg-primary/10 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                  data-testid="link-github"
                  aria-label="View our GitHub"
                >
                  <FaGithub className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                </a>
                <a
                  href="https://discord.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-background/50 hover:bg-primary/10 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                  data-testid="link-discord"
                  aria-label="Join our Discord"
                >
                  <FaDiscord className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-background/50 hover:bg-primary/10 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                  data-testid="link-youtube"
                  aria-label="Subscribe to our YouTube"
                >
                  <FaYoutube className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                </a>
              </div>
            </div>
            
            {/* Browse Section */}
            <div>
              <h4 className="font-semibold text-lg mb-6 text-foreground">Discover</h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/movies" data-testid="link-popular-movies">
                    <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer hover:translate-x-1 inline-block transition-transform">Popular Movies</span>
                  </Link>
                </li>
                <li>
                  <Link href="/tv-shows" data-testid="link-tv-shows">
                    <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer hover:translate-x-1 inline-block transition-transform">TV Shows</span>
                  </Link>
                </li>
                <li>
                  <Link href="/movies?filter=new" data-testid="link-new-releases">
                    <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer hover:translate-x-1 inline-block transition-transform">New Releases</span>
                  </Link>
                </li>
                <li>
                  <Link href="/movies?filter=top-rated" data-testid="link-top-rated">
                    <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer hover:translate-x-1 inline-block transition-transform">Top Rated</span>
                  </Link>
                </li>
                <li>
                  <Link href="/search" data-testid="link-search">
                    <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer hover:translate-x-1 inline-block transition-transform">Advanced Search</span>
                  </Link>
                </li>
                <li>
                  <Link href="/collection/action" data-testid="link-collections">
                    <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer hover:translate-x-1 inline-block transition-transform">Collections</span>
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* Community Section */}
            <div>
              <h4 className="font-semibold text-lg mb-6 text-foreground">Community</h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/dashboard" data-testid="link-dashboard">
                    <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer hover:translate-x-1 inline-block transition-transform">My Dashboard</span>
                  </Link>
                </li>
                <li>
                  <span className="text-muted-foreground cursor-not-allowed">Reviews (Coming Soon)</span>
                </li>
                <li>
                  <span className="text-muted-foreground cursor-not-allowed">Forums (Coming Soon)</span>
                </li>
                <li>
                  <span className="text-muted-foreground cursor-not-allowed">Groups (Coming Soon)</span>
                </li>
                <li>
                  <span className="text-muted-foreground cursor-not-allowed">Events (Coming Soon)</span>
                </li>
              </ul>
            </div>
            
            {/* Company Section */}
            <div>
              <h4 className="font-semibold text-lg mb-6 text-foreground">Company</h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/about" data-testid="link-about">
                    <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer hover:translate-x-1 inline-block transition-transform">About Us</span>
                  </Link>
                </li>
                <li>
                  <Link href="/contact" data-testid="link-contact">
                    <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer hover:translate-x-1 inline-block transition-transform">Contact Support</span>
                  </Link>
                </li>
                <li>
                  <span className="text-muted-foreground cursor-not-allowed">Careers (Coming Soon)</span>
                </li>
                <li>
                  <span className="text-muted-foreground cursor-not-allowed">Press Kit (Coming Soon)</span>
                </li>
                <li>
                  <span className="text-muted-foreground cursor-not-allowed">API Documentation</span>
                </li>
                <li>
                  <Link href="/privacy-policy" data-testid="link-privacy">
                    <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer hover:translate-x-1 inline-block transition-transform">Privacy Policy</span>
                  </Link>
                </li>
                <li>
                  <Link href="/terms-of-service" data-testid="link-terms">
                    <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer hover:translate-x-1 inline-block transition-transform">Terms of Service</span>
                  </Link>
                </li>
              </ul>
              
              {/* Contact Info */}
              <div className="mt-8 space-y-3">
                <h5 className="font-medium text-foreground mb-4">Get in Touch</h5>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span>hello@cinehubpro.com</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>San Francisco, CA</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="border-t border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <p className="text-muted-foreground text-sm">
                  &copy; 2024 CineHub Pro. All rights reserved.
                </p>
                <p className="text-muted-foreground/70 text-xs mt-1">
                  Movie data provided by <span className="font-medium">The Movie Database (TMDB)</span>
                </p>
              </div>
              
              <div className="flex items-center gap-6 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Heart className="w-3 h-3 text-red-400 fill-current" />
                  Made with love for movie enthusiasts
                </span>
                <span>Version 1.0.0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}