import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';

describe('useInfiniteScroll hook', () => {
  let mockIntersectionObserver: any;
  let mockObserve: any;
  let mockDisconnect: any;

  beforeEach(() => {
    mockObserve = vi.fn();
    mockDisconnect = vi.fn();
    
    mockIntersectionObserver = vi.fn().mockImplementation((callback) => ({
      observe: mockObserve,
      unobserve: vi.fn(),
      disconnect: mockDisconnect,
    }));
    
    window.IntersectionObserver = mockIntersectionObserver;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return a ref', () => {
    const fetchNextPage = vi.fn();
    
    const { result } = renderHook(() => useInfiniteScroll({
      hasNextPage: true,
      isFetchingNextPage: false,
      fetchNextPage,
    }));

    expect(result.current).toBeDefined();
    expect(result.current.current).toBeNull(); // Ref initially null
  });

  it('should create IntersectionObserver when ref is attached', () => {
    const fetchNextPage = vi.fn();
    
    renderHook(() => useInfiniteScroll({
      hasNextPage: true,
      isFetchingNextPage: false,
      fetchNextPage,
    }));

    // Observer should be created
    expect(mockIntersectionObserver).toHaveBeenCalled();
  });

  it('should not fetch when hasNextPage is false', () => {
    const fetchNextPage = vi.fn();
    
    renderHook(() => useInfiniteScroll({
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage,
    }));

    expect(fetchNextPage).not.toHaveBeenCalled();
  });

  it('should not fetch when isFetchingNextPage is true', () => {
    const fetchNextPage = vi.fn();
    
    renderHook(() => useInfiniteScroll({
      hasNextPage: true,
      isFetchingNextPage: true,
      fetchNextPage,
    }));

    expect(fetchNextPage).not.toHaveBeenCalled();
  });

  it('should not fetch when disabled is true', () => {
    const fetchNextPage = vi.fn();
    
    renderHook(() => useInfiniteScroll({
      hasNextPage: true,
      isFetchingNextPage: false,
      fetchNextPage,
      disabled: true,
    }));

    expect(fetchNextPage).not.toHaveBeenCalled();
  });

  it('should use custom rootMargin', () => {
    const fetchNextPage = vi.fn();
    
    renderHook(() => useInfiniteScroll({
      hasNextPage: true,
      isFetchingNextPage: false,
      fetchNextPage,
      rootMargin: '200px',
    }));

    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ rootMargin: '200px' })
    );
  });

  it('should use custom threshold', () => {
    const fetchNextPage = vi.fn();
    
    renderHook(() => useInfiniteScroll({
      hasNextPage: true,
      isFetchingNextPage: false,
      fetchNextPage,
      threshold: 0.5,
    }));

    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ threshold: 0.5 })
    );
  });

  it('should disconnect observer on unmount', () => {
    const fetchNextPage = vi.fn();
    
    const { unmount } = renderHook(() => useInfiniteScroll({
      hasNextPage: true,
      isFetchingNextPage: false,
      fetchNextPage,
    }));

    unmount();

    expect(mockDisconnect).toHaveBeenCalled();
  });
});
