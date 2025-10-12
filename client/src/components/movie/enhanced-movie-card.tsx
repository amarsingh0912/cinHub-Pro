import { Link } from "wouter";
import { Star, Play, Info } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import type { Movie, TVShow } from "@/types/movie";

interface EnhancedMovieCardProps {
  movie: Movie | TVShow;
  mediaType?: "movie" | "tv";
  watchProgress?: number;
  showProgress?: boolean;
}

export default function EnhancedMovieCard({ 
  movie, 
  mediaType = "movie",
  watchProgress,
  showProgress = false
}: EnhancedMovieCardProps) {
  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : "/placeholder-movie.png";

  const isMovie = 'title' in movie;
  const title = isMovie ? movie.title : (movie as TVShow).name;
  const releaseDate = isMovie ? movie.release_date : (movie as TVShow).first_air_date;
  const year = releaseDate ? new Date(releaseDate).getFullYear() : "N/A";

  const detailLink = `/${mediaType}/${movie.id}`;

  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild>
        <Link href={detailLink}>
          <div 
            className="group relative cursor-pointer transition-transform duration-300 hover:scale-105"
            data-testid={`enhanced-card-${movie.id}`}
          >
            <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-card">
              <img
                src={posterUrl}
                alt={title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
              
              {showProgress && watchProgress !== undefined && watchProgress > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-background/50">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${watchProgress}%` }}
                    data-testid={`progress-bar-${movie.id}`}
                  />
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <Play className="w-4 h-4" />
                    <span className="text-sm font-medium">Play Now</span>
                  </div>
                  {movie.vote_average > 0 && (
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="w-3 h-3 text-yellow-500" fill="currentColor" />
                      <span>{movie.vote_average.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-2">
              <h3 className="font-medium text-sm line-clamp-1" data-testid={`card-title-${movie.id}`}>
                {title}
              </h3>
              <p className="text-xs text-muted-foreground">{year}</p>
            </div>
          </div>
        </Link>
      </HoverCardTrigger>

      <HoverCardContent 
        side="right" 
        align="start" 
        className="w-80 p-4 bg-card/95 backdrop-blur-sm border-border"
        data-testid={`hover-card-${movie.id}`}
      >
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-base mb-1">{title}</h4>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>{year}</span>
              {movie.vote_average > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-500" fill="currentColor" />
                  <span>{movie.vote_average.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>

          {movie.overview && (
            <p className="text-sm text-muted-foreground line-clamp-4">
              {movie.overview}
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <Link href={detailLink} className="flex-1">
              <button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2">
                <Info className="w-4 h-4" />
                Details
              </button>
            </Link>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
