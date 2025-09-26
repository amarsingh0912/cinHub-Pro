import { useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  rootMargin?: string;
  threshold?: number;
  disabled?: boolean;
}

/**
 * Custom hook for implementing infinite scroll using Intersection Observer API
 * Automatically triggers fetchNextPage when the trigger element comes into view
 */
export function useInfiniteScroll({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  rootMargin = '100px',
  threshold = 0.1,
  disabled = false
}: UseInfiniteScrollOptions) {
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      
      if (
        target?.isIntersecting &&
        hasNextPage &&
        !isFetchingNextPage &&
        !disabled
      ) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage, disabled]
  );

  useEffect(() => {
    const trigger = triggerRef.current;
    
    if (!trigger) return;

    // Clean up previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Create new intersection observer
    observerRef.current = new IntersectionObserver(handleIntersection, {
      rootMargin,
      threshold,
    });

    observerRef.current.observe(trigger);

    // Cleanup function
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleIntersection, rootMargin, threshold]);

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return triggerRef;
}