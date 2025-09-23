import { Link } from "wouter";
import { Film } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border py-12" data-testid="footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Film className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-display font-bold">CineHub Pro</span>
            </div>
            <p className="text-muted-foreground mb-6 max-w-md">
              Your ultimate destination for movie discovery. Find your next favorite film with our extensive database and personalized recommendations.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
                data-testid="link-twitter"
              >
                <i className="fab fa-twitter text-xl"></i>
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
                data-testid="link-instagram"
              >
                <i className="fab fa-instagram text-xl"></i>
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
                data-testid="link-facebook"
              >
                <i className="fab fa-facebook text-xl"></i>
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Browse</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <Link href="/movies" data-testid="link-popular-movies">
                  <span className="hover:text-foreground transition-colors cursor-pointer">Popular Movies</span>
                </Link>
              </li>
              <li>
                <Link href="/movies?filter=new" data-testid="link-new-releases">
                  <span className="hover:text-foreground transition-colors cursor-pointer">New Releases</span>
                </Link>
              </li>
              <li>
                <Link href="/movies?filter=top-rated" data-testid="link-top-rated">
                  <span className="hover:text-foreground transition-colors cursor-pointer">Top Rated</span>
                </Link>
              </li>
              <li>
                <Link href="/collection/action" data-testid="link-collections">
                  <span className="hover:text-foreground transition-colors cursor-pointer">Collections</span>
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <Link href="/about" data-testid="link-about">
                  <span className="hover:text-foreground transition-colors cursor-pointer">About Us</span>
                </Link>
              </li>
              <li>
                <Link href="/contact" data-testid="link-contact">
                  <span className="hover:text-foreground transition-colors cursor-pointer">Contact</span>
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" data-testid="link-privacy">
                  <span className="hover:text-foreground transition-colors cursor-pointer">Privacy Policy</span>
                </Link>
              </li>
              <li>
                <Link href="/terms-of-service" data-testid="link-terms">
                  <span className="hover:text-foreground transition-colors cursor-pointer">Terms of Service</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
          <p>&copy; 2024 CineHub Pro. All rights reserved. | Data provided by TMDB</p>
        </div>
      </div>
    </footer>
  );
}
