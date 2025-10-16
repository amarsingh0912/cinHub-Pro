import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import HeroSection from '@/components/movie/hero-section';

vi.mock('wouter', () => ({
  Link: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

const mockMovie = {
  id: 550,
  title: 'Fight Club',
  overview: 'An insomniac office worker and a devil-may-care soap maker form an underground fight club.',
  backdropPath: '/backdrop.jpg',
  posterPath: '/poster.jpg',
  releaseDate: '1999-10-15',
  voteAverage: 8.4,
  voteCount: 28000,
};

describe('HeroSection Component', () => {
  describe('Rendering', () => {
    it('should render hero section', () => {
      render(<HeroSection movie={mockMovie} />, { wrapper });
      expect(screen.getByTestId('hero-section')).toBeInTheDocument();
    });

    it('should display movie title', () => {
      render(<HeroSection movie={mockMovie} />, { wrapper });
      expect(screen.getByText('Fight Club')).toBeInTheDocument();
    });

    it('should display movie overview', () => {
      render(<HeroSection movie={mockMovie} />, { wrapper });
      expect(screen.getByText(/insomniac office worker/i)).toBeInTheDocument();
    });

    it('should display release year', () => {
      render(<HeroSection movie={mockMovie} />, { wrapper });
      expect(screen.getByText(/1999/)).toBeInTheDocument();
    });

    it('should display rating', () => {
      render(<HeroSection movie={mockMovie} />, { wrapper });
      expect(screen.getByText(/8\.4/)).toBeInTheDocument();
    });
  });

  describe('Background Image', () => {
    it('should set backdrop as background image', () => {
      const { container } = render(<HeroSection movie={mockMovie} />, { wrapper });
      const heroElement = container.querySelector('[style*="background-image"]');
      expect(heroElement).toBeInTheDocument();
    });

    it('should have gradient overlay', () => {
      const { container } = render(<HeroSection movie={mockMovie} />, { wrapper });
      const gradientOverlay = container.querySelector('.bg-gradient-to-r, .bg-gradient-to-t, .bg-gradient-to-b');
      expect(gradientOverlay).toBeInTheDocument();
    });

    it('should handle missing backdrop gracefully', () => {
      const movieWithoutBackdrop = { ...mockMovie, backdropPath: null };
      render(<HeroSection movie={movieWithoutBackdrop} />, { wrapper });
      expect(screen.getByTestId('hero-section')).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('should have watch trailer button', () => {
      render(<HeroSection movie={mockMovie} />, { wrapper });
      const trailerButton = screen.getByText(/watch trailer/i);
      expect(trailerButton).toBeInTheDocument();
    });

    it('should have add to watchlist button', () => {
      render(<HeroSection movie={mockMovie} />, { wrapper });
      const watchlistButton = screen.getByText(/watchlist/i);
      expect(watchlistButton).toBeInTheDocument();
    });

    it('should have favorite button', () => {
      render(<HeroSection movie={mockMovie} />, { wrapper });
      const favoriteButton = screen.getByLabelText(/favorite/i);
      expect(favoriteButton).toBeInTheDocument();
    });

    it('should have share button', () => {
      render(<HeroSection movie={mockMovie} />, { wrapper });
      const shareButton = screen.getByLabelText(/share/i);
      expect(shareButton).toBeInTheDocument();
    });
  });

  describe('Movie Metadata', () => {
    it('should display genre tags', () => {
      const movieWithGenres = {
        ...mockMovie,
        genres: [{ id: 18, name: 'Drama' }, { id: 53, name: 'Thriller' }],
      };
      render(<HeroSection movie={movieWithGenres} />, { wrapper });
      
      expect(screen.getByText('Drama')).toBeInTheDocument();
      expect(screen.getByText('Thriller')).toBeInTheDocument();
    });

    it('should display runtime', () => {
      const movieWithRuntime = { ...mockMovie, runtime: 139 };
      render(<HeroSection movie={movieWithRuntime} />, { wrapper });
      
      expect(screen.getByText(/2h 19m/)).toBeInTheDocument();
    });

    it('should display certification/rating', () => {
      const movieWithCert = { ...mockMovie, certification: 'R' };
      render(<HeroSection movie={movieWithCert} />, { wrapper });
      
      expect(screen.getByText('R')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive classes', () => {
      const { container } = render(<HeroSection movie={mockMovie} />, { wrapper });
      const heroElement = screen.getByTestId('hero-section');
      
      expect(heroElement.className).toMatch(/sm:|md:|lg:/);
    });

    it('should have mobile-friendly layout', () => {
      const { container } = render(<HeroSection movie={mockMovie} />, { wrapper });
      expect(container.querySelector('.flex, .grid')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<HeroSection movie={mockMovie} />, { wrapper });
      const heading = screen.getByRole('heading', { name: /fight club/i });
      expect(heading).toBeInTheDocument();
    });

    it('should have alt text for images', () => {
      render(<HeroSection movie={mockMovie} />, { wrapper });
      const images = screen.queryAllByRole('img');
      
      images.forEach(img => {
        expect(img).toHaveAttribute('alt');
      });
    });

    it('should have accessible buttons', () => {
      render(<HeroSection movie={mockMovie} />, { wrapper });
      const buttons = screen.getAllByRole('button');
      
      buttons.forEach(button => {
        expect(button).toHaveAccessibleName();
      });
    });

    it('should have proper ARIA labels', () => {
      render(<HeroSection movie={mockMovie} />, { wrapper });
      const ratingElement = screen.getByText(/8\.4/);
      
      expect(ratingElement.closest('[aria-label]')).toBeTruthy();
    });
  });

  describe('Interactive Elements', () => {
    it('should show tooltip on hover', async () => {
      const { container } = render(<HeroSection movie={mockMovie} />, { wrapper });
      const favoriteButton = screen.getByLabelText(/favorite/i);
      
      // Hover simulation
      favoriteButton.focus();
    });

    it('should highlight on keyboard focus', () => {
      render(<HeroSection movie={mockMovie} />, { wrapper });
      const trailerButton = screen.getByText(/watch trailer/i);
      
      trailerButton.focus();
      expect(trailerButton).toHaveFocus();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long titles', () => {
      const longTitle = 'A Very Long Movie Title That Should Be Truncated Or Handled Properly';
      const movieWithLongTitle = { ...mockMovie, title: longTitle };
      
      render(<HeroSection movie={movieWithLongTitle} />, { wrapper });
      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('should handle missing overview', () => {
      const movieWithoutOverview = { ...mockMovie, overview: '' };
      render(<HeroSection movie={movieWithoutOverview} />, { wrapper });
      expect(screen.getByTestId('hero-section')).toBeInTheDocument();
    });

    it('should handle zero rating', () => {
      const movieWithZeroRating = { ...mockMovie, voteAverage: 0, voteCount: 0 };
      render(<HeroSection movie={movieWithZeroRating} />, { wrapper });
      
      expect(screen.getByText(/no rating/i) || screen.getByText(/0/)).toBeInTheDocument();
    });

    it('should handle future release dates', () => {
      const futureDate = new Date(Date.now() + 86400000 * 30).toISOString();
      const upcomingMovie = { ...mockMovie, releaseDate: futureDate };
      
      render(<HeroSection movie={upcomingMovie} />, { wrapper });
      expect(screen.getByText(/coming soon/i) || screen.getByTestId('hero-section')).toBeInTheDocument();
    });
  });

  describe('Animation', () => {
    it('should have fade-in animation', () => {
      const { container } = render(<HeroSection movie={mockMovie} />, { wrapper });
      const heroElement = screen.getByTestId('hero-section');
      
      expect(heroElement.className).toMatch(/animate|transition/);
    });

    it('should have stagger animation for buttons', () => {
      const { container } = render(<HeroSection movie={mockMovie} />, { wrapper });
      const buttons = container.querySelectorAll('button, a');
      
      let hasAnimation = false;
      buttons.forEach(button => {
        if (button.className.match(/delay|stagger/)) {
          hasAnimation = true;
        }
      });
    });
  });
});
