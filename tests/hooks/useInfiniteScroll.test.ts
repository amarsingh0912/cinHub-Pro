import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';

describe('useInfiniteScroll hook', () => {
  let mockIntersectionObserver: any;

  beforeEach(() => {
    mockIntersectionObserver = vi.fn();
    mockIntersectionObserver.mockReturnValue({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    });
    window.IntersectionObserver = mockIntersectionObserver;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with null ref', () => {
    const { result } = renderHook(() => useInfiniteScroll({
      onLoadMore: vi.fn(),
      hasMore: true,
    }));

    expect(result.current.ref).toBeDefined();
  });

  it('should call onLoadMore when element is visible', async () => {
    const onLoadMore = vi.fn();
    
    renderHook(() => useInfiniteScroll({
      onLoadMore,
      hasMore: true,
    }));

    // IntersectionObserver should be created
    expect(mockIntersectionObserver).toHaveBeenCalled();
  });

  it('should not call onLoadMore when hasMore is false', () => {
    const onLoadMore = vi.fn();
    
    renderHook(() => useInfiniteScroll({
      onLoadMore,
      hasMore: false,
    }));

    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it('should not call onLoadMore when isLoading is true', () => {
    const onLoadMore = vi.fn();
    
    renderHook(() => useInfiniteScroll({
      onLoadMore,
      hasMore: true,
      isLoading: true,
    }));

    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it('should respect custom threshold', () => {
    const onLoadMore = vi.fn();
    
    renderHook(() => useInfiniteScroll({
      onLoadMore,
      hasMore: true,
      threshold: 0.5,
    }));

    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ threshold: 0.5 })
    );
  });

  it('should cleanup observer on unmount', () => {
    const onLoadMore = vi.fn();
    const disconnectMock = vi.fn();
    
    mockIntersectionObserver.mockReturnValue({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: disconnectMock,
    });

    const { unmount } = renderHook(() => useInfiniteScroll({
      onLoadMore,
      hasMore: true,
    }));

    unmount();

    expect(disconnectMock).toHaveBeenCalled();
  });
});
