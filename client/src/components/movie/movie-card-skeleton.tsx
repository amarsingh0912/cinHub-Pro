import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

export default function MovieCardSkeleton() {
  return (
    <motion.div 
      className="movie-card group relative" 
      data-testid="movie-card-skeleton"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Enhanced Image skeleton with glassmorphism */}
      <div className="aspect-[2/3] relative overflow-hidden rounded-2xl bg-card/60 border border-border/30 shadow-lg backdrop-blur-sm">
        <Skeleton className="w-full h-full rounded-2xl" />
        
        {/* Rating badge skeleton with animation */}
        <motion.div 
          className="absolute top-4 right-4"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <Skeleton className="h-7 w-14 rounded-xl shadow-md" />
        </motion.div>
        
        {/* Enhanced loading wave effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent -translate-x-full animate-wave rounded-2xl pointer-events-none" />
        
        {/* Subtle shimmer overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-50" />
      </div>
      
      {/* Enhanced Title and year skeleton */}
      <motion.div 
        className="mt-4 space-y-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <Skeleton className="h-5 w-full rounded-md" />
        <Skeleton className="h-4 w-16 rounded-md" />
      </motion.div>
      
      {/* Pulsing glow effect for premium feel */}
      <div className="absolute inset-0 rounded-2xl opacity-0 animate-glow-pulse pointer-events-none" style={{ animationDelay: '0.5s' }} />
    </motion.div>
  );
}