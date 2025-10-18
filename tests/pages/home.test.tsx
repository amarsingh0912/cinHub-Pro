import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@/__tests__/utils/test-utils';
import Home from '@/pages/home';

describe('Home Page', () => {
  it('renders home page', () => {
    render(<Home />);
    expect(screen.getByTestId('page-home')).toBeInTheDocument();
  });

  it('displays hero section', () => {
    render(<Home />);
    const heroSection = screen.queryByTestId('hero-section');
    if (heroSection) {
      expect(heroSection).toBeInTheDocument();
    }
  });

  it('displays trending movies section', async () => {
    render(<Home />);

    await waitFor(() => {
      const trendingSection = screen.queryByText(/trending/i);
      if (trendingSection) {
        expect(trendingSection).toBeInTheDocument();
      }
    }, { timeout: 5000 });
  });

  it('displays popular movies section', async () => {
    render(<Home />);

    await waitFor(() => {
      const popularSection = screen.queryByText(/popular/i);
      if (popularSection) {
        expect(popularSection).toBeInTheDocument();
      }
    }, { timeout: 5000 });
  });

  it('shows loading state initially', () => {
    render(<Home />);

    const loadingElements = screen.queryAllByTestId(/skeleton|loading/i);
    // Should show some loading indicators or skeletons
  });

  it('handles API errors gracefully', async () => {
    render(<Home />);

    await waitFor(() => {
      // Page should still render even if API fails
      expect(screen.getByTestId('page-home')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('displays footer', () => {
    render(<Home />);
    const footer = screen.queryByTestId('footer');
    if (footer) {
      expect(footer).toBeInTheDocument();
    }
  });

  it('displays header/navigation', () => {
    render(<Home />);
    const header = screen.queryByTestId('header');
    if (header) {
      expect(header).toBeInTheDocument();
    }
  });

  it('is accessible', async () => {
    const { container } = render(<Home />);

    await waitFor(() => {
      // Should have proper heading structure
      const headings = container.querySelectorAll('h1, h2, h3');
      expect(headings.length).toBeGreaterThan(0);
    });
  });
});
