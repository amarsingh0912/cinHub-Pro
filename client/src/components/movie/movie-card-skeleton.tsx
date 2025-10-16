import { motion, useReducedMotion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

export default function MovieCardSkeleton() {
  const shouldReduceMotion = useReducedMotion();
  
  return (
    <motion.div 
      className="group relative" 
      data-testid="movie-card-skeleton"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1]
      }}
    >
      {/* Subtle glow effect */}
      <motion.div
        className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-primary/10 to-secondary/20 rounded-3xl blur-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: shouldReduceMotion ? 0.2 : [0, 0.3, 0] }}
        transition={{ duration: shouldReduceMotion ? 0 : 2, repeat: shouldReduceMotion ? 0 : Infinity, ease: "easeInOut", repeatType: "loop" }}
        aria-hidden="true"
      />
      
      {/* Enhanced Image skeleton with glassmorphism */}
      <div className="aspect-[2/3] relative overflow-hidden rounded-2xl bg-gradient-to-br from-card/90 to-card/60 border border-border/40 shadow-lg backdrop-blur-sm">
        <Skeleton className="w-full h-full rounded-2xl" />
        
        {/* Gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none" aria-hidden="true" />
        
        {/* Rating badge skeleton with animation */}
        <motion.div 
          className="absolute top-3 right-3"
          initial={{ opacity: 0, scale: 0.85, rotateX: shouldReduceMotion ? 0 : -90 }}
          animate={{ 
            opacity: shouldReduceMotion ? 1 : [0, 1, 1, 0],
            scale: shouldReduceMotion ? 1 : [0.85, 1, 1, 0.85],
            rotateX: shouldReduceMotion ? 0 : [-90, 0, 0, -90]
          }}
          transition={{ 
            duration: shouldReduceMotion ? 0.3 : 2,
            repeat: shouldReduceMotion ? 0 : Infinity,
            ease: "easeInOut",
            delay: 0.3
          }}
        >
          <Skeleton className="h-9 w-16 rounded-2xl shadow-2xl backdrop-blur-xl" />
        </motion.div>
        
        {/* Enhanced shimmer wave effect */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/15 to-transparent pointer-events-none"
          initial={{ x: shouldReduceMotion ? '0%' : '-100%' }}
          animate={{ x: shouldReduceMotion ? '0%' : '200%' }}
          transition={{ 
            duration: shouldReduceMotion ? 0 : 1.5,
            repeat: shouldReduceMotion ? 0 : Infinity,
            ease: "easeInOut",
            repeatDelay: 0.5,
            repeatType: "loop"
          }}
        />
        
        {/* Subtle ambient glow */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent"
          animate={{ opacity: shouldReduceMotion ? 0.4 : [0.3, 0.6, 0.3] }}
          transition={{ duration: shouldReduceMotion ? 0 : 2, repeat: shouldReduceMotion ? 0 : Infinity, ease: "easeInOut", repeatType: "loop" }}
        />
      </div>
      
      {/* Enhanced Title and metadata skeleton */}
      <motion.div 
        className="mt-4 space-y-2.5 px-0.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      >
        <Skeleton className="h-5 w-[85%] rounded-lg" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-3.5 w-12 rounded-md" />
          <Skeleton className="h-3.5 w-10 rounded-md" />
        </div>
      </motion.div>
    </motion.div>
  );
}