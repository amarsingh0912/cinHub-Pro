import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MovieCard from '../../client/src/components/movie/movie-card';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('MovieCard Component', () => {
  const mockMovie = {
    id: 550,
    title: 'Fight Club',
    overview: 'A ticking-time-bomb insomniac and a slippery soap salesman...',
    poster_path: '/path/to/poster.jpg',
    backdrop_path: '/path/to/backdrop.jpg',
    vote_average: 8.4,
    release_date: '1999-10-15',
    genre_ids: [18, 53]
  };

  it('renders movie title', () => {
    render(<MovieCard movie={mockMovie} />, { wrapper: createWrapper() });
    expect(screen.getByText('Fight Club')).toBeInTheDocument();
  });

  it('displays movie rating', () => {
    render(<MovieCard movie={mockMovie} />, { wrapper: createWrapper() });
    expect(screen.getByText(/8.4/)).toBeInTheDocument();
  });

  it('displays release year', () => {
    render(<MovieCard movie={mockMovie} />, { wrapper: createWrapper() });
    expect(screen.getByText(/1999/)).toBeInTheDocument();
  });

  it('renders poster image with correct alt text', () => {
    render(<MovieCard movie={mockMovie} />, { wrapper: createWrapper() });
    const image = screen.getByAltText('Fight Club');
    expect(image).toBeInTheDocument();
  });

  it('applies correct data-testid', () => {
    render(<MovieCard movie={mockMovie} />, { wrapper: createWrapper() });
    const card = screen.getByTestId('card-movie-550');
    expect(card).toBeInTheDocument();
  });

  it('handles missing poster gracefully', () => {
    const movieWithoutPoster = { ...mockMovie, poster_path: null };
    render(<MovieCard movie={movieWithoutPoster} />, { wrapper: createWrapper() });
    
    // Should still render the card
    expect(screen.getByText('Fight Club')).toBeInTheDocument();
  });

  it('truncates long overview text', () => {
    const longOverview = 'A '.repeat(200);
    const movieWithLongOverview = { ...mockMovie, overview: longOverview };
    
    render(<MovieCard movie={movieWithLongOverview} />, { wrapper: createWrapper() });
    
    const overviewElement = screen.queryByText(longOverview);
    // Overview should be truncated (not fully visible)
    expect(overviewElement).not.toBeInTheDocument();
  });
});
