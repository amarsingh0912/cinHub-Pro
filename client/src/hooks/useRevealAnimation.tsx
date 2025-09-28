import { useEffect, useRef, useState } from 'react';

export interface RevealAnimationOptions {
  /**
   * Animation type to apply when element becomes visible
   */
  animation?: 'fade-in' | 'fade-in-up' | 'slide-up' | 'slide-in-left' | 'slide-in-right' | 'scale-in' | 'bounce-in';
  
  /**
   * Delay before animation starts (in milliseconds)
   */
  delay?: number;
  
  /**
   * How much of the element needs to be visible before triggering (0.0 to 1.0)
   */
  threshold?: number;
  
  /**
   * Animation duration in milliseconds
   */
  duration?: number;
  
  /**
   * Whether animation should only happen once or repeat when scrolling
   */
  once?: boolean;
  
  /**
   * Root margin for intersection observer (useful for triggering earlier/later)
   */
  rootMargin?: string;
  
  /**
   * Whether to apply staggered animation for child elements
   */
  stagger?: boolean;
  
  /**
   * Stagger delay between child elements (in milliseconds)
   */
  staggerDelay?: number;
}

/**
 * Universal reveal animation hook that applies animations when elements enter viewport
 */
export function useRevealAnimation(options: RevealAnimationOptions = {}) {
  const {
    animation = 'fade-in-up',
    delay = 0,
    threshold = 0.1,
    once = true,
    rootMargin = '0px 0px -50px 0px',
    stagger = false,
    staggerDelay = 100
  } = options;

  const elementRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Don't re-animate if it should only happen once and has already animated
    if (once && hasAnimated) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Apply delay if specified
          const timeoutId = setTimeout(() => {
            setIsVisible(true);
            setHasAnimated(true);
            
            // If stagger is enabled, animate child elements with delays
            if (stagger) {
              const children = element.children;
              Array.from(children).forEach((child, index) => {
                const childElement = child as HTMLElement;
                childElement.style.animationDelay = `${delay + (index * staggerDelay)}ms`;
              });
            }
          }, delay);

          return () => clearTimeout(timeoutId);
        } else if (!once) {
          // Allow re-animation if once is false
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [delay, threshold, once, rootMargin, hasAnimated, stagger, staggerDelay]);

  // Generate the appropriate CSS classes
  const getAnimationClasses = () => {
    const baseClasses = [];
    
    if (!isVisible && !hasAnimated) {
      // Initial state - element is hidden
      baseClasses.push('opacity-0');
      
      switch (animation) {
        case 'fade-in-up':
          baseClasses.push('translate-y-8');
          break;
        case 'slide-up':
          baseClasses.push('translate-y-12');
          break;
        case 'slide-in-left':
          baseClasses.push('-translate-x-12');
          break;
        case 'slide-in-right':
          baseClasses.push('translate-x-12');
          break;
        case 'scale-in':
          baseClasses.push('scale-95');
          break;
        case 'bounce-in':
          baseClasses.push('scale-95');
          break;
      }
    }
    
    if (isVisible) {
      // Animate to visible state
      switch (animation) {
        case 'fade-in':
          baseClasses.push('animate-fade-in');
          break;
        case 'fade-in-up':
          baseClasses.push('animate-fade-in-up');
          break;
        case 'slide-up':
          baseClasses.push('animate-slide-up');
          break;
        case 'slide-in-left':
          baseClasses.push('animate-slide-in-left');
          break;
        case 'slide-in-right':
          baseClasses.push('animate-slide-in-right');
          break;
        case 'scale-in':
          baseClasses.push('animate-scale-in');
          break;
        case 'bounce-in':
          baseClasses.push('animate-bounce-in');
          break;
      }
    }

    // Add stagger classes for children
    if (stagger && isVisible) {
      baseClasses.push('animate-stagger-in');
    }

    // Always add transition classes for smooth animations
    baseClasses.push('transition-all duration-700 ease-out');

    return baseClasses.join(' ');
  };

  return {
    ref: elementRef,
    className: getAnimationClasses(),
    isVisible,
    hasAnimated
  };
}

/**
 * Higher-order component that wraps elements with reveal animations
 */
export function RevealOnScroll({ 
  children, 
  options = {},
  className = '',
  as: Component = 'div',
  ...props 
}: {
  children: React.ReactNode;
  options?: RevealAnimationOptions;
  className?: string;
  as?: React.ElementType;
} & React.HTMLAttributes<HTMLDivElement>) {
  const { ref, className: animationClassName } = useRevealAnimation(options);
  
  return (
    <Component
      ref={ref}
      className={`${animationClassName} ${className}`.trim()}
      {...props}
    >
      {children}
    </Component>
  );
}

/**
 * Predefined animation presets for common use cases
 */
export const REVEAL_PRESETS = {
  // Fast entrance animations
  fadeIn: { animation: 'fade-in' as const, duration: 400 },
  slideUp: { animation: 'fade-in-up' as const, duration: 500 },
  scaleIn: { animation: 'scale-in' as const, duration: 300 },
  
  // Staggered animations for lists/grids
  staggeredFadeIn: { animation: 'fade-in-up' as const, stagger: true, staggerDelay: 100 },
  staggeredSlideUp: { animation: 'fade-in-up' as const, stagger: true, staggerDelay: 150 },
  
  // Hero section animations
  heroTitle: { animation: 'fade-in-up' as const, delay: 200, duration: 800 },
  heroSubtitle: { animation: 'fade-in-up' as const, delay: 400, duration: 600 },
  heroButtons: { animation: 'fade-in-up' as const, delay: 600, duration: 500 },
  
  // Card animations
  cardReveal: { animation: 'fade-in-up' as const, threshold: 0.2, duration: 500 },
  cardHover: { animation: 'scale-in' as const, threshold: 0.3, duration: 300 },
  
  // Section animations
  sectionHeader: { animation: 'fade-in-up' as const, delay: 100, threshold: 0.3 },
  sectionContent: { animation: 'fade-in-up' as const, delay: 300, threshold: 0.2 },
} as const;