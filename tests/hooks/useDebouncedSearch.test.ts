import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDebouncedSearch } from '@/hooks/use-debounced-search';

describe('useDebouncedSearch hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with empty search term', () => {
    const { result } = renderHook(() => useDebouncedSearch());

    expect(result.current.searchTerm).toBe('');
    expect(result.current.debouncedSearchTerm).toBe('');
  });

  it('should update search term immediately', () => {
    const { result } = renderHook(() => useDebouncedSearch());

    act(() => {
      result.current.setSearchTerm('test');
    });

    expect(result.current.searchTerm).toBe('test');
  });

  it('should debounce search term updates', async () => {
    const { result } = renderHook(() => useDebouncedSearch({ delay: 500 }));

    act(() => {
      result.current.setSearchTerm('test');
    });

    // Debounced value should not update immediately
    expect(result.current.debouncedSearchTerm).toBe('');

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.debouncedSearchTerm).toBe('test');
    });
  });

  it('should cancel previous debounce on new input', async () => {
    const { result } = renderHook(() => useDebouncedSearch({ delay: 500 }));

    act(() => {
      result.current.setSearchTerm('test');
    });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    act(() => {
      result.current.setSearchTerm('testing');
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.debouncedSearchTerm).toBe('testing');
    });
  });

  it('should use custom delay', async () => {
    const customDelay = 1000;
    const { result } = renderHook(() => useDebouncedSearch({ delay: customDelay }));

    act(() => {
      result.current.setSearchTerm('test');
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current.debouncedSearchTerm).toBe('');

    act(() => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.debouncedSearchTerm).toBe('test');
    });
  });

  it('should clear search term', () => {
    const { result } = renderHook(() => useDebouncedSearch());

    act(() => {
      result.current.setSearchTerm('test');
    });

    act(() => {
      result.current.clearSearchTerm();
    });

    expect(result.current.searchTerm).toBe('');
  });

  it('should handle empty strings correctly', async () => {
    const { result } = renderHook(() => useDebouncedSearch({ delay: 300 }));

    act(() => {
      result.current.setSearchTerm('test');
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    act(() => {
      result.current.setSearchTerm('');
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(result.current.debouncedSearchTerm).toBe('');
    });
  });
});
