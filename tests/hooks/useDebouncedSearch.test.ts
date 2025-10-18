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

  it('should initialize with empty search query', () => {
    const { result } = renderHook(() => useDebouncedSearch());

    expect(result.current.searchQuery).toBe('');
    expect(result.current.debouncedQuery).toBe('');
  });

  it('should update search query immediately', () => {
    const { result } = renderHook(() => useDebouncedSearch());

    act(() => {
      result.current.updateQuery('test');
    });

    expect(result.current.searchQuery).toBe('test');
  });

  it('should debounce query updates', async () => {
    const { result } = renderHook(() => useDebouncedSearch(500));

    act(() => {
      result.current.updateQuery('test');
    });

    // Debounced value should not update immediately
    expect(result.current.debouncedQuery).toBe('');

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.debouncedQuery).toBe('test');
    });
  });

  it('should cancel previous debounce on new input', async () => {
    const { result } = renderHook(() => useDebouncedSearch(500));

    act(() => {
      result.current.updateQuery('test');
    });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    act(() => {
      result.current.updateQuery('testing');
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.debouncedQuery).toBe('testing');
    });
  });

  it('should use custom delay', async () => {
    const customDelay = 1000;
    const { result } = renderHook(() => useDebouncedSearch(customDelay));

    act(() => {
      result.current.updateQuery('test');
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current.debouncedQuery).toBe('');

    act(() => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.debouncedQuery).toBe('test');
    });
  });

  it('should clear search query', () => {
    const { result } = renderHook(() => useDebouncedSearch());

    act(() => {
      result.current.updateQuery('test');
    });

    act(() => {
      result.current.clearQuery();
    });

    expect(result.current.searchQuery).toBe('');
    expect(result.current.debouncedQuery).toBe('');
  });

  it('should indicate when debouncing', async () => {
    const { result } = renderHook(() => useDebouncedSearch(300));

    act(() => {
      result.current.updateQuery('test');
    });

    expect(result.current.isDebouncing).toBe(true);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(result.current.isDebouncing).toBe(false);
    });
  });

  it('should handle empty strings correctly', async () => {
    const { result } = renderHook(() => useDebouncedSearch(300));

    act(() => {
      result.current.updateQuery('test');
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    act(() => {
      result.current.updateQuery('');
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(result.current.debouncedQuery).toBe('');
    });
  });
});
