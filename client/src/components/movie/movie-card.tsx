import { Link } from "wouter";
import { Star, Film } from "lucide-react";
import { Movie, TVShow } from "@/types/movie";
import { getImageUrl } from "@/lib/tmdb";
import { useRevealAnimation, REVEAL_PRESETS } from "@/hooks/useRevealAnimation";

interface MovieCardProps {
  movie: Movie | TVShow;
  size?: 'normal' | 'compact';
  mediaType?: 'movie' | 'tv';
}

export default function MovieCard({ movie, size = 'normal', mediaType }: MovieCardProps) {
  // Determine if it's a movie or TV show
  const isMovie = mediaType === 'movie' || ('title' in movie && !mediaType);
  const title = isMovie ? (movie as Movie).title : (movie as TVShow).name;
  const releaseDate = isMovie ? (movie as Movie).release_date : (movie as TVShow).first_air_date;
  const href = isMovie ? `/movie/${movie.id}` : `/tv/${movie.id}`;
  
  // Use reveal animation for each individual card
  const { ref, className } = useRevealAnimation({
    animation: 'fade-in-up',
    threshold: 0.1,
    delay: 0,
    duration: 500,
    once: true
  });
  
  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className={className}>
      <Link href={href} data-testid={`${isMovie ? 'movie' : 'tv'}-card-${movie.id}`}>
        <div className={`movie-card ${size === 'compact' ? 'movie-card-compact' : ''} group cursor-pointer interactive`}>
        <div className="aspect-[2/3] relative overflow-hidden rounded-2xl glassmorphism-card bg-card/80 border border-border/30 hover:border-primary/40 transition-all duration-700 hover:shadow-2xl hover:shadow-primary/15 hover:scale-[1.03]">
          {movie.poster_path ? (
            <img
              src={getImageUrl(movie.poster_path)}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors duration-300">
              <Film className="w-16 h-16 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
            </div>
          )}
          
          {/* Rating Badge */}
          <div className="absolute top-4 right-4 glassmorphism backdrop-blur-md rounded-xl px-3 py-2 flex items-center gap-2 transform translate-y-[-24px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-150 border border-white/20">
            <Star className="w-4 h-4 text-secondary fill-current drop-shadow-lg" />
            <span className="text-white text-sm font-bold tracking-wide" data-testid={`rating-${movie.id}`}>
              {movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}
            </span>
          </div>
          
          {/* Enhanced Hover Overlay - Removed duplicate title and year */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700 ease-out">
          </div>
          
          {/* Glassmorphism shine effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        </div>
        
        <div className="mt-4 space-y-2 group-hover:translate-y-[-2px] transition-transform duration-300">
          <h3 className="font-display font-bold text-[0.95rem] leading-tight truncate text-foreground group-hover:text-primary transition-colors duration-200" data-testid={`title-${movie.id}`}>
            {title}
          </h3>
          <p className="text-xs font-medium text-muted-foreground/80 tracking-wide uppercase" data-testid={`year-${movie.id}`}>
            {releaseDate ? new Date(releaseDate).getFullYear() : 'TBA'}
          </p>
        </div>
        </div>
      </Link>
    </div>
  );
}
