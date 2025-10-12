import { Variants } from "framer-motion";

// Animation presets for filter components
export const filterMotion = {
  // Dock animations
  dockSlideRight: {
    initial: { x: '100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '100%', opacity: 0 },
    transition: { type: 'spring', damping: 25, stiffness: 300 }
  },
  
  dockSlideBottom: {
    initial: { y: '100%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: '100%', opacity: 0 },
    transition: { type: 'spring', damping: 25, stiffness: 300 }
  },

  // Lab modal animations
  labScale: {
    initial: { scale: 0.95, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.95, opacity: 0 },
    transition: { type: 'spring', damping: 20, stiffness: 300 }
  },

  // Chip animations
  chipPop: {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.9, opacity: 0 },
    transition: { type: 'spring', damping: 15, stiffness: 500 }
  },

  // Stagger children
  staggerContainer: {
    animate: {
      transition: {
        staggerChildren: 0.05
      }
    }
  } as Variants,

  // Ribbon animations
  ribbonSlide: {
    initial: { y: -20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -20, opacity: 0 },
    transition: { type: 'spring', damping: 20, stiffness: 300 }
  },

  // Facet panel animations
  facetExpand: {
    initial: { height: 0, opacity: 0 },
    animate: { height: 'auto', opacity: 1 },
    exit: { height: 0, opacity: 0 },
    transition: { type: 'spring', damping: 25, stiffness: 300 }
  },

  // Metric pill pulse
  metricPulse: {
    initial: { scale: 1 },
    animate: { 
      scale: [1, 1.05, 1],
      transition: { duration: 0.3 }
    }
  }
};

// Gesture configurations
export const swipeConfig = {
  threshold: 50,
  velocity: 500
};
