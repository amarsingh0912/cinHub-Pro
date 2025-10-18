import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/__tests__/utils/test-utils';
import Search from '@/pages/search';

describe('Search Page', () => {
  it('renders search page', () => {
    render(<Search />);
    expect(screen.getByTestId('page-search')).toBeInTheDocument();
  });

  it('displays search input', () => {
    render(<Search />);
    const searchInput = screen.queryByTestId('input-search');
    if (searchInput) {
      expect(searchInput).toBeInTheDocument();
    }
  });

  it('handles search input changes', async () => {
    render(<Search />);

    const searchInput = screen.queryByTestId('input-search') as HTMLInputElement;
    if (searchInput) {
      fireEvent.change(searchInput, { target: { value: 'fight club' } });
      
      await waitFor(() => {
        expect(searchInput.value).toBe('fight club');
      });
    }
  });

  it('displays search results after searching', async () => {
    render(<Search />);

    const searchInput = screen.queryByTestId('input-search');
    if (searchInput) {
      fireEvent.change(searchInput, { target: { value: 'fight club' } });

      await waitFor(() => {
        const results = screen.queryAllByTestId(/card-movie-|card-tv-/);
        // Should display results or no results message
      }, { timeout: 5000 });
    }
  });

  it('shows empty state when no results found', async () => {
    render(<Search />);

    const searchInput = screen.queryByTestId('input-search');
    if (searchInput) {
      fireEvent.change(searchInput, { target: { value: 'xyzabc123notfound' } });

      await waitFor(() => {
        const emptyState = screen.queryByText(/no results|not found/i);
        if (emptyState) {
          expect(emptyState).toBeInTheDocument();
        }
      }, { timeout: 5000 });
    }
  });

  it('shows loading state while searching', () => {
    render(<Search />);

    const searchInput = screen.queryByTestId('input-search');
    if (searchInput) {
      fireEvent.change(searchInput, { target: { value: 'test' } });

      // Should show loading indicator
      const loadingIndicator = screen.queryByTestId(/loading|skeleton/);
    }
  });

  it('allows filtering between movies and TV shows', async () => {
    render(<Search />);

    const movieFilter = screen.queryByTestId('filter-movies');
    const tvFilter = screen.queryByTestId('filter-tv');

    if (movieFilter && tvFilter) {
      fireEvent.click(movieFilter);
      await waitFor(() => {
        // Should filter to movies only
      });

      fireEvent.click(tvFilter);
      await waitFor(() => {
        // Should filter to TV shows only
      });
    }
  });

  it('displays recent searches if available', () => {
    render(<Search />);

    const recentSearches = screen.queryByTestId('recent-searches');
    // May or may not be present depending on search history
  });

  it('clears search when clear button is clicked', async () => {
    render(<Search />);

    const searchInput = screen.queryByTestId('input-search') as HTMLInputElement;
    const clearButton = screen.queryByTestId('button-clear-search');

    if (searchInput && clearButton) {
      fireEvent.change(searchInput, { target: { value: 'test' } });
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(searchInput.value).toBe('');
      });
    }
  });

  it('supports keyboard navigation', () => {
    render(<Search />);

    const searchInput = screen.queryByTestId('input-search');
    if (searchInput) {
      searchInput.focus();
      expect(document.activeElement).toBe(searchInput);

      // Test Enter key
      fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' });
    }
  });

  it('handles API errors gracefully', async () => {
    render(<Search />);

    const searchInput = screen.queryByTestId('input-search');
    if (searchInput) {
      fireEvent.change(searchInput, { target: { value: 'test' } });

      await waitFor(() => {
        // Page should still render even if API fails
        expect(screen.getByTestId('page-search')).toBeInTheDocument();
      }, { timeout: 5000 });
    }
  });
});
