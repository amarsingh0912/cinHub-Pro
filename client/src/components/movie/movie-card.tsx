import { Link } from "wouter";
import { Star, Film } from "lucide-react";
import { Movie } from "@/types/movie";
import { getImageUrl } from "@/lib/tmdb";

interface MovieCardProps {
  movie: Movie;
}

export default function MovieCard({ movie }: MovieCardProps) {
  return (
    <Link href={`/movie/${movie.id}`} data-testid={`movie-card-${movie.id}`}>
      <div className="movie-card group cursor-pointer interactive">
        <div className="aspect-[2/3] relative overflow-hidden rounded-xl bg-accent/50 border border-border/20 backdrop-blur-sm hover:border-primary/30 transition-all duration-500 hover:shadow-xl hover:shadow-primary/10 hover:scale-[1.02]">
          {movie.poster_path ? (
            <img
              src={getImageUrl(movie.poster_path)}
              alt={movie.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors duration-300">
              <Film className="w-16 h-16 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
            </div>
          )}
          
          {/* Rating Badge */}
          <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-sm rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 transform translate-y-[-20px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 delay-100">
            <Star className="w-3.5 h-3.5 text-secondary fill-current" />
            <span className="text-white text-xs font-semibold" data-testid={`rating-${movie.id}`}>
              {movie.vote_average.toFixed(1)}
            </span>
          </div>
          
          {/* Enhanced Hover Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500">
            <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-150">
              <div className="space-y-2">
                <h4 className="text-white font-semibold text-sm leading-tight line-clamp-2" data-testid={`hover-title-${movie.id}`}>
                  {movie.title}
                </h4>
                <p className="text-gray-300 text-xs" data-testid={`hover-year-${movie.id}`}>
                  {movie.release_date ? new Date(movie.release_date).getFullYear() : 'TBA'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Glassmorphism shine effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        </div>
        
        <div className="mt-4 space-y-1 group-hover:translate-y-[-2px] transition-transform duration-300">
          <h3 className="font-semibold truncate text-foreground group-hover:text-primary transition-colors duration-200" data-testid={`title-${movie.id}`}>
            {movie.title}
          </h3>
          <p className="text-sm text-muted-foreground" data-testid={`year-${movie.id}`}>
            {movie.release_date ? new Date(movie.release_date).getFullYear() : 'TBA'}
          </p>
        </div>
      </div>
    </Link>
  );
}
