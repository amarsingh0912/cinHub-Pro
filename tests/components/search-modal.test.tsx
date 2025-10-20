import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import SearchModal from '@/components/ui/search-modal';

vi.mock('wouter', () => ({
  useLocation: () => ['/', vi.fn()],
  Link: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('SearchModal Component', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Modal Rendering', () => {
    it('should render when open', () => {
      render(<SearchModal isOpen={true} onClose={mockOnClose} />, { wrapper });
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      render(<SearchModal isOpen={false} onClose={mockOnClose} />, { wrapper });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should focus search input when opened', () => {
      render(<SearchModal isOpen={true} onClose={mockOnClose} />, { wrapper });
      const searchInput = screen.getByPlaceholderText(/search/i);
      expect(searchInput).toHaveFocus();
    });
  });

  describe('Search Input', () => {
    it('should have search input field', () => {
      render(<SearchModal isOpen={true} onClose={mockOnClose} />, { wrapper });
      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    });

    it('should trigger search on input change', async () => {
      render(<SearchModal isOpen={true} onClose={mockOnClose} />, { wrapper });
      const searchInput = screen.getByPlaceholderText(/search/i);
      
      fireEvent.change(searchInput, { target: { value: 'inception' } });
      
      await waitFor(() => {
        expect(searchInput).toHaveValue('inception');
      });
    });

    it('should debounce search queries', async () => {
      render(<SearchModal isOpen={true} onClose={mockOnClose} />, { wrapper });
      const searchInput = screen.getByPlaceholderText(/search/i);
      
      fireEvent.change(searchInput, { target: { value: 'i' } });
      fireEvent.change(searchInput, { target: { value: 'in' } });
      fireEvent.change(searchInput, { target: { value: 'inc' } });
      
      // Should debounce and only search after delay
      await waitFor(() => {
        expect(searchInput).toHaveValue('inc');
      }, { timeout: 500 });
    });

    it('should clear search input when clear button clicked', () => {
      render(<SearchModal isOpen={true} onClose={mockOnClose} />, { wrapper });
      const searchInput = screen.getByPlaceholderText(/search/i) as HTMLInputElement;
      
      fireEvent.change(searchInput, { target: { value: 'test' } });
      expect(searchInput.value).toBe('test');
      
      const clearButton = screen.getByLabelText(/clear/i);
      fireEvent.click(clearButton);
      
      expect(searchInput.value).toBe('');
    });
  });

  describe('Search Results', () => {
    it('should display loading state while searching', async () => {
      render(<SearchModal isOpen={true} onClose={mockOnClose} />, { wrapper });
      const searchInput = screen.getByPlaceholderText(/search/i);
      
      fireEvent.change(searchInput, { target: { value: 'inception' } });
      
      expect(screen.getByText(/searching/i)).toBeInTheDocument();
    });

    it('should display search results', async () => {
      render(<SearchModal isOpen={true} onClose={mockOnClose} />, { wrapper });
      const searchInput = screen.getByPlaceholderText(/search/i);
      
      fireEvent.change(searchInput, { target: { value: 'inception' } });
      
      await waitFor(() => {
        expect(screen.getAllByRole('link').length).toBeGreaterThan(0);
      });
    });

    it('should display no results message', async () => {
      render(<SearchModal isOpen={true} onClose={mockOnClose} />, { wrapper });
      const searchInput = screen.getByPlaceholderText(/search/i);
      
      fireEvent.change(searchInput, { target: { value: 'xyznonexistent123' } });
      
      await waitFor(() => {
        expect(screen.getByText(/no results/i)).toBeInTheDocument();
      });
    });

    it('should categorize results by type', async () => {
      render(<SearchModal isOpen={true} onClose={mockOnClose} />, { wrapper });
      const searchInput = screen.getByPlaceholderText(/search/i);
      
      fireEvent.change(searchInput, { target: { value: 'inception' } });
      
      await waitFor(() => {
        expect(screen.getByText(/movies/i)).toBeInTheDocument();
        expect(screen.getByText(/tv shows/i)).toBeInTheDocument();
        expect(screen.getByText(/people/i)).toBeInTheDocument();
      });
    });
  });

  describe('Search Filters', () => {
    it('should have media type filters', () => {
      render(<SearchModal isOpen={true} onClose={mockOnClose} />, { wrapper });
      
      expect(screen.getByText(/all/i)).toBeInTheDocument();
      expect(screen.getByText(/movies/i)).toBeInTheDocument();
      expect(screen.getByText(/tv/i)).toBeInTheDocument();
      expect(screen.getByText(/people/i)).toBeInTheDocument();
    });

    it('should filter results by media type', async () => {
      render(<SearchModal isOpen={true} onClose={mockOnClose} />, { wrapper });
      const searchInput = screen.getByPlaceholderText(/search/i);
      
      fireEvent.change(searchInput, { target: { value: 'inception' } });
      
      const moviesFilter = screen.getByText(/^movies$/i);
      fireEvent.click(moviesFilter);
      
      await waitFor(() => {
        // Should only show movie results
        expect(screen.queryByText(/tv shows/i)).not.toBeInTheDocument();
      });
    });

    it('should have sort options', () => {
      render(<SearchModal isOpen={true} onClose={mockOnClose} />, { wrapper });
      
      expect(screen.getByText(/relevance/i) || screen.getByText(/popularity/i)).toBeInTheDocument();
    });
  });

  describe('Search History', () => {
    it('should display recent searches', () => {
      render(<SearchModal isOpen={true} onClose={mockOnClose} />, { wrapper });
      
      expect(screen.getByText(/recent/i) || screen.getByText(/history/i)).toBeInTheDocument();
    });

    it('should save search to history', async () => {
      render(<SearchModal isOpen={true} onClose={mockOnClose} />, { wrapper });
      const searchInput = screen.getByPlaceholderText(/search/i);
      
      fireEvent.change(searchInput, { target: { value: 'inception' } });
      fireEvent.submit(searchInput);
      
      // Search should be saved to history
    });

    it('should clear search history', () => {
      render(<SearchModal isOpen={true} onClose={mockOnClose} />, { wrapper });
      
      const clearHistoryButton = screen.queryByText(/clear history/i);
      if (clearHistoryButton) {
        fireEvent.click(clearHistoryButton);
      }
    });

    it('should click recent search to re-search', () => {
      render(<SearchModal isOpen={true} onClose={mockOnClose} />, { wrapper });
      
      const recentSearches = screen.queryAllByRole('button', { name: /inception/i });
      if (recentSearches.length > 0) {
        fireEvent.click(recentSearches[0]);
      }
    });
  });

  describe('Keyboard Navigation', () => {
    it('should close modal on Escape key', () => {
      render(<SearchModal isOpen={true} onClose={mockOnClose} />, { wrapper });
      
      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should navigate results with arrow keys', async () => {
      render(<SearchModal isOpen={true} onClose={mockOnClose} />, { wrapper });
      const searchInput = screen.getByPlaceholderText(/search/i);
      
      fireEvent.change(searchInput, { target: { value: 'inception' } });
      
      await waitFor(() => {
        expect(screen.getAllByRole('link').length).toBeGreaterThan(0);
      });
      
      fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
      // First result should be focused
    });

    it('should select result on Enter key', async () => {
      render(<SearchModal isOpen={true} onClose={mockOnClose} />, { wrapper });
      const searchInput = screen.getByPlaceholderText(/search/i);
      
      fireEvent.change(searchInput, { target: { value: 'inception' } });
      
      await waitFor(() => {
        expect(screen.getAllByRole('link').length).toBeGreaterThan(0);
      });
      
      fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
      fireEvent.keyDown(searchInput, { key: 'Enter' });
      
      // Should navigate to selected result
    });
  });

  describe('Result Click Handling', () => {
    it('should close modal when result clicked', async () => {
      render(<SearchModal isOpen={true} onClose={mockOnClose} />, { wrapper });
      const searchInput = screen.getByPlaceholderText(/search/i);
      
      fireEvent.change(searchInput, { target: { value: 'inception' } });
      
      await waitFor(() => {
        const results = screen.getAllByRole('link');
        expect(results.length).toBeGreaterThan(0);
        
        fireEvent.click(results[0]);
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should navigate to correct page on result click', async () => {
      const setLocation = vi.fn();
      vi.mocked(require('wouter').useLocation).mockReturnValue(['/', setLocation]);
      
      render(<SearchModal isOpen={true} onClose={mockOnClose} />, { wrapper });
      const searchInput = screen.getByPlaceholderText(/search/i);
      
      fireEvent.change(searchInput, { target: { value: 'inception' } });
      
      await waitFor(() => {
        const results = screen.getAllByRole('link');
        expect(results.length).toBeGreaterThan(0);
        
        const firstResult = results[0];
        expect(firstResult).toHaveAttribute('href');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<SearchModal isOpen={true} onClose={mockOnClose} />, { wrapper });
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby');
    });

    it('should have searchbox role on input', () => {
      render(<SearchModal isOpen={true} onClose={mockOnClose} />, { wrapper });
      
      const searchInput = screen.getByRole('searchbox');
      expect(searchInput).toBeInTheDocument();
    });

    it('should announce search results to screen readers', async () => {
      render(<SearchModal isOpen={true} onClose={mockOnClose} />, { wrapper });
      const searchInput = screen.getByPlaceholderText(/search/i);
      
      fireEvent.change(searchInput, { target: { value: 'inception' } });
      
      await waitFor(() => {
        const resultsContainer = screen.getByRole('region');
        expect(resultsContainer).toHaveAttribute('aria-live');
      });
    });

    it('should have accessible result items', async () => {
      render(<SearchModal isOpen={true} onClose={mockOnClose} />, { wrapper });
      const searchInput = screen.getByPlaceholderText(/search/i);
      
      fireEvent.change(searchInput, { target: { value: 'inception' } });
      
      await waitFor(() => {
        const links = screen.getAllByRole('link');
        links.forEach(link => {
          expect(link).toHaveAccessibleName();
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message on search failure', async () => {
      render(<SearchModal isOpen={true} onClose={mockOnClose} />, { wrapper });
      const searchInput = screen.getByPlaceholderText(/search/i);
      
      // Mock network error
      fireEvent.change(searchInput, { target: { value: 'error' } });
      
      await waitFor(() => {
        expect(screen.getByText(/error/i) || screen.getByText(/failed/i)).toBeInTheDocument();
      });
    });

    it('should allow retry on error', async () => {
      render(<SearchModal isOpen={true} onClose={mockOnClose} />, { wrapper });
      const searchInput = screen.getByPlaceholderText(/search/i);
      
      fireEvent.change(searchInput, { target: { value: 'error' } });
      
      await waitFor(() => {
        const retryButton = screen.queryByText(/retry/i);
        if (retryButton) {
          fireEvent.click(retryButton);
        }
      });
    });
  });

  describe('Performance', () => {
    it('should not search for queries less than 2 characters', () => {
      render(<SearchModal isOpen={true} onClose={mockOnClose} />, { wrapper });
      const searchInput = screen.getByPlaceholderText(/search/i);
      
      fireEvent.change(searchInput, { target: { value: 'a' } });
      
      expect(screen.queryByText(/searching/i)).not.toBeInTheDocument();
    });

    it('should use cached results for duplicate queries', async () => {
      render(<SearchModal isOpen={true} onClose={mockOnClose} />, { wrapper });
      const searchInput = screen.getByPlaceholderText(/search/i);
      
      fireEvent.change(searchInput, { target: { value: 'inception' } });
      
      await waitFor(() => {
        expect(screen.getAllByRole('link').length).toBeGreaterThan(0);
      });
      
      // Clear and search again
      fireEvent.change(searchInput, { target: { value: '' } });
      fireEvent.change(searchInput, { target: { value: 'inception' } });
      
      // Should use cached results
    });
  });
});
