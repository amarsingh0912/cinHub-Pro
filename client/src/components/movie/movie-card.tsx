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
      <Link href={href} data-testid={`${isMovie ? 'movie' : 'tv'}-card-${movie.id}`} aria-label={`View details for ${title}`}>
        <motion.div 
          className={cn(
            "group cursor-pointer relative",
            size === 'compact' ? 'scale-95' : ''
          )}
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
          whileHover={{ y: -12, scale: size === 'compact' ? 0.97 : 1.02 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        >
            {/* Enhanced glow effect on hover */}
            <motion.div
              className="absolute -inset-1 bg-gradient-to-r from-primary/30 via-primary/20 to-secondary/30 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 motion-reduce:hidden"
              aria-hidden="true"
            />
            
            <div className="aspect-[2/3] relative overflow-hidden rounded-2xl bg-gradient-to-br from-card/90 to-card/60 backdrop-blur-sm border border-border/40 group-hover:border-primary/60 transition-all duration-500 shadow-lg group-hover:shadow-2xl group-hover:shadow-primary/25 card-elevated-1">
              {/* Gradient overlay for depth */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none" aria-hidden="true" />
              
              {movie.poster_path ? (
                <motion.img
                  src={getImageUrl(movie.poster_path)}
                  alt={title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  initial={{ scale: 1 }}
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center group-hover:from-primary/20 group-hover:to-primary/5 transition-all duration-500">
                  <Film className="w-16 h-16 text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all duration-500" aria-hidden="true" />
                </div>
              )}
              
              {/* Animated Rating Badge */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div 
                    className="absolute top-3 right-3 backdrop-blur-xl bg-black/60 dark:bg-white/10 rounded-2xl px-3 py-2 flex items-center gap-2 border border-white/30 dark:border-white/20 shadow-2xl z-20"
                    initial={{ y: -24, opacity: 0, scale: 0.85, rotateX: -90 }}
                    animate={{ y: 0, opacity: 1, scale: 1, rotateX: 0 }}
                    exit={{ y: -24, opacity: 0, scale: 0.85, rotateX: -90 }}
                    transition={{ 
                      type: "spring",
                      stiffness: 400,
                      damping: 25
                    }}
                  >
                    <motion.div
                      initial={{ rotate: 0 }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    >
                      <Star className="w-4 h-4 text-secondary fill-current drop-shadow-[0_2px_8px_rgba(251,191,36,0.5)]" aria-hidden="true" />
                    </motion.div>
                    <span className="text-white font-bold text-sm tracking-tight" data-testid={`rating-${movie.id}`}>
                      {movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Enhanced Hover Overlay with Play Icon */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent flex items-center justify-center z-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                  >
                    <motion.div
                      className="relative group/play"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                      transition={{ 
                        type: "spring",
                        stiffness: 300,
                        damping: 20
                      }}
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {/* Glow effect behind play button */}
                      <div className="absolute inset-0 bg-primary/40 rounded-full blur-2xl opacity-75 group-hover/play:opacity-100 transition-opacity" aria-hidden="true" />
                      
                      <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary via-primary to-primary/80 backdrop-blur-md flex items-center justify-center shadow-2xl shadow-primary/60 border border-white/20">
                        <Play className="w-8 h-8 text-white fill-current ml-1 drop-shadow-lg" aria-hidden="true" />
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Shimmer effect on hover */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/8 to-transparent pointer-events-none"
                initial={{ x: '-100%', opacity: 0 }}
                animate={{ 
                  x: isHovered ? '100%' : '-100%',
                  opacity: isHovered ? 1 : 0
                }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
              />
            </div>
            
            {/* Enhanced Title Section */}
            <motion.div 
              className="mt-4 space-y-2 px-0.5"
              animate={{ y: isHovered ? -4 : 0 }}
              transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <motion.h3 
                className="font-display font-bold text-[0.95rem] leading-tight truncate bg-gradient-to-r from-foreground to-foreground group-hover:from-primary group-hover:to-primary/80 bg-clip-text group-hover:text-transparent transition-all duration-300" 
                data-testid={`title-${movie.id}`}
                title={title}
                animate={{ letterSpacing: isHovered ? '0.01em' : '0em' }}
                transition={{ duration: 0.3 }}
              >
                {title}
              </motion.h3>
              <div className="flex items-center gap-2">
                <motion.p 
                  className="text-xs font-semibold text-muted-foreground/70 tracking-wider uppercase"
                  data-testid={`year-${movie.id}`}
                  animate={{ 
                    color: isHovered ? 'hsl(var(--muted-foreground))' : 'hsl(var(--muted-foreground) / 0.7)',
                    scale: isHovered ? 1.05 : 1
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {releaseDate ? new Date(releaseDate).getFullYear() : 'TBA'}
                </motion.p>
                {movie.vote_average && !isHovered && (
                  <motion.div 
                    className="flex items-center gap-1"
                    initial={{ opacity: 1, scale: 1 }}
                    animate={{ opacity: isHovered ? 0 : 1, scale: isHovered ? 0.9 : 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Star className="w-3 h-3 text-secondary/80 fill-current" aria-hidden="true" />
                    <span className="text-xs font-bold text-secondary/90">{movie.vote_average.toFixed(1)}</span>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
      </Link>
    </motion.div>
  );
}
