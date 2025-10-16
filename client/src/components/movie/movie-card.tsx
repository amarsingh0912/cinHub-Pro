import { Link } from "wouter";
import { Star, Film, Play, Heart } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Movie, TVShow } from "@/types/movie";
import { getImageUrl } from "@/lib/tmdb";
import { useRevealAnimation } from "@/hooks/useRevealAnimation";
import { cn } from "@/lib/utils";

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
  const [isHovered, setIsHovered] = useState(false);
  
  // Use reveal animation for each individual card
  const { ref, className } = useRevealAnimation({
    animation: 'fade-in-up',
    threshold: 0.1,
    delay: 0,
    duration: 500,
    once: true
  });
  
  return (
    <motion.div 
      ref={ref as React.RefObject<HTMLDivElement>} 
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <Link href={href} data-testid={`${isMovie ? 'movie' : 'tv'}-card-${movie.id}`}>
        <a aria-label={`View details for ${title}`}>
          <motion.div 
            className={cn(
              "movie-card group cursor-pointer relative",
              size === 'compact' ? 'movie-card-compact' : ''
            )}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            whileHover={{ y: -8 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="aspect-[2/3] relative overflow-hidden rounded-2xl glassmorphism-card bg-card/80 border border-border/30 hover:border-primary/50 transition-all duration-500 shadow-lg hover:shadow-2xl hover:shadow-primary/20">
              {movie.poster_path ? (
                <motion.img
                  src={getImageUrl(movie.poster_path)}
                  alt={title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  initial={{ scale: 1 }}
                  whileHover={{ scale: 1.08 }}
                  transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors duration-300">
                  <Film className="w-16 h-16 text-muted-foreground group-hover:text-primary transition-colors duration-300" aria-hidden="true" />
                </div>
              )}
              
              {/* Animated Rating Badge */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div 
                    className="absolute top-4 right-4 glassmorphism backdrop-blur-md rounded-xl px-3 py-2 flex items-center gap-2 border border-white/20 shadow-lg"
                    initial={{ y: -20, opacity: 0, scale: 0.8 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: -20, opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                  >
                    <Star className="w-4 h-4 text-secondary fill-current drop-shadow-lg" aria-hidden="true" />
                    <span className="text-white text-sm font-bold tracking-wide" data-testid={`rating-${movie.id}`}>
                      {movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Enhanced Hover Overlay with Play Icon */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <motion.div
                      className="w-16 h-16 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center shadow-2xl shadow-primary/50"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                      whileHover={{ scale: 1.1 }}
                    >
                      <Play className="w-7 h-7 text-white fill-current ml-1" aria-hidden="true" />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Glassmorphism shine effect */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: isHovered ? 1 : 0 }}
                transition={{ duration: 0.5 }}
              />
            </div>
            
            {/* Enhanced Title Section */}
            <motion.div 
              className="mt-4 space-y-2"
              animate={{ y: isHovered ? -2 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <h3 
                className="font-display font-bold text-[0.95rem] leading-tight truncate text-foreground group-hover:text-primary transition-colors duration-200" 
                data-testid={`title-${movie.id}`}
                title={title}
              >
                {title}
              </h3>
              <p className="text-xs font-medium text-muted-foreground/80 tracking-wide uppercase" data-testid={`year-${movie.id}`}>
                {releaseDate ? new Date(releaseDate).getFullYear() : 'TBA'}
              </p>
            </motion.div>
          </motion.div>
        </a>
      </Link>
    </motion.div>
  );
}
