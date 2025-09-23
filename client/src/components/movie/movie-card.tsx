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
      <div className="movie-card group cursor-pointer">
        <div className="aspect-[2/3] relative overflow-hidden rounded-lg bg-accent">
          {movie.poster_path ? (
            <img
              src={getImageUrl(movie.poster_path)}
              alt={movie.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <Film className="w-16 h-16 text-muted-foreground" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex items-center gap-2 text-white">
                <Star className="w-4 h-4 text-secondary fill-current" />
                <span data-testid={`rating-${movie.id}`}>{movie.vote_average.toFixed(1)}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-3">
          <h3 className="font-semibold truncate" data-testid={`title-${movie.id}`}>
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
