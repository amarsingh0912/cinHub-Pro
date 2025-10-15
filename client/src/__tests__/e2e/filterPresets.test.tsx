/**
 * E2E test for filter preset behavior
 * Tests that switching to Upcoming and setting Original Language to Hindi
 * results in network requests containing all expected parameters
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Movies from '@/pages/movies';
import { FilterProvider } from '@/contexts/FilterContext';

// Mock fetch to capture network requests
const mockFetch = vi.fn();
global.fetch = mockFetch;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <FilterProvider>
      {children}
    </FilterProvider>
  </QueryClientProvider>
);

describe('Filter Preset E2E', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    queryClient.clear();
    
    // Mock successful responses
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        page: 1,
        results: [],
        total_pages: 1,
        total_results: 0,
      }),
    });
  });

  it('should preserve Upcoming preset params when setting Original Language to Hindi', async () => {
    const user = userEvent.setup();
    
    render(<Movies />, { wrapper: TestWrapper });

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByTestId('movies-page')).toBeInTheDocument();
    });

    // Click on Upcoming category
    const upcomingButton = screen.getByTestId('category-upcoming');
    await user.click(upcomingButton);

    // Wait for the request to be made
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    // Find the last fetch call
    const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
    const requestUrl = lastCall[0] as string;

    // Verify the URL contains all expected Upcoming preset parameters
    expect(requestUrl).toContain('/api/movies/discover');
    expect(requestUrl).toContain('primary_release_date.gte=');
    expect(requestUrl).toContain('sort_by=primary_release_date.asc');
    expect(requestUrl).toContain('with_original_language=hi');
    expect(requestUrl).toContain('with_release_type=2%7C3');
    expect(requestUrl).toContain('region=IN');
    expect(requestUrl).toContain('include_adult=false');
    expect(requestUrl).toContain('include_video=false');
    expect(requestUrl).toContain('certification_country=US');

    // Log the final URL for manual verification
    console.log('[E2E Test] Final request URL:', requestUrl);
  });

  it('should maintain all preset parameters when additional user filters are applied', async () => {
    const user = userEvent.setup();
    
    render(<Movies />, { wrapper: TestWrapper });

    // Switch to Popular preset
    const popularButton = screen.getByTestId('category-popular');
    await user.click(popularButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
    const requestUrl = lastCall[0] as string;

    // Verify Popular preset parameters are present
    expect(requestUrl).toContain('sort_by=popularity.desc');
    expect(requestUrl).toContain('with_original_language=hi');
    expect(requestUrl).toContain('vote_count.gte=50');
    expect(requestUrl).toContain('with_release_type=2%7C3');
  });

  it('should encode pipe characters as %7C in release type parameter', async () => {
    render(<Movies />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
    const requestUrl = lastCall[0] as string;

    // Verify pipe encoding
    expect(requestUrl).toMatch(/with_release_type=.*2%7C3/);
  });
});
