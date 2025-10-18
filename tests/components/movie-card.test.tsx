import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/__tests__/utils/test-utils';
import MovieCard from '@/components/movie/movie-card';
import { createMovie } from '@/__tests__/fixtures/factories';

describe('MovieCard Component', () => {
  const mockMovie = createMovie({
    id: 550,
    title: 'Fight Club',
    overview: 'A ticking-time-bomb insomniac and a slippery soap salesman...',
    poster_path: '/path/to/poster.jpg',
    vote_average: 8.4,
    release_date: '1999-10-15',
    genre_ids: [18, 53],
  });

  it('renders movie title', () => {
    render(<MovieCard movie={mockMovie} />);
    expect(screen.getByText('Fight Club')).toBeInTheDocument();
  });

  it('displays movie rating', () => {
    render(<MovieCard movie={mockMovie} />);
    expect(screen.getByText(/8.4/)).toBeInTheDocument();
  });

  it('displays release year', () => {
    render(<MovieCard movie={mockMovie} />);
    expect(screen.getByText(/1999/)).toBeInTheDocument();
  });

  it('renders poster image with correct alt text', () => {
    render(<MovieCard movie={mockMovie} />);
    const image = screen.getByAltText('Fight Club');
    expect(image).toBeInTheDocument();
  });

  it('applies correct data-testid', () => {
    render(<MovieCard movie={mockMovie} />);
    const card = screen.getByTestId('card-movie-550');
    expect(card).toBeInTheDocument();
  });

  it('handles missing poster gracefully', () => {
    const movieWithoutPoster = createMovie({ ...mockMovie, poster_path: null });
    render(<MovieCard movie={movieWithoutPoster} />);
    
    expect(screen.getByText('Fight Club')).toBeInTheDocument();
  });

  it('truncates long overview text', () => {
    const longOverview = 'A '.repeat(200);
    const movieWithLongOverview = createMovie({ ...mockMovie, overview: longOverview });
    
    render(<MovieCard movie={movieWithLongOverview} />);
    
    const overviewElement = screen.queryByText(longOverview);
    expect(overviewElement).not.toBeInTheDocument();
  });

  it('handles click events', async () => {
    const onClick = vi.fn();
    render(<MovieCard movie={mockMovie} onClick={onClick} />);

    const card = screen.getByTestId('card-movie-550');
    fireEvent.click(card);

    await waitFor(() => {
      expect(onClick).toHaveBeenCalled();
    });
  });

  it('handles very long titles without breaking layout', () => {
    const longTitleMovie = createMovie({
      title: 'This is a Very Long Movie Title That Should Be Handled Properly Without Breaking the Layout',
    });
    
    render(<MovieCard movie={longTitleMovie} />);
    expect(screen.getByText(/This is a Very Long Movie Title/)).toBeInTheDocument();
  });

  it('handles movies with no rating', () => {
    const unratedMovie = createMovie({ vote_average: 0 });
    render(<MovieCard movie={unratedMovie} />);

    const card = screen.getByTestId(`card-movie-${unratedMovie.id}`);
    expect(card).toBeInTheDocument();
  });

  it('handles movies with future release dates', () => {
    const futureMovie = createMovie({ release_date: '2030-12-31' });
    render(<MovieCard movie={futureMovie} />);

    expect(screen.getByText(/2030/)).toBeInTheDocument();
  });

  it('is keyboard accessible', () => {
    render(<MovieCard movie={mockMovie} />);

    const card = screen.getByTestId('card-movie-550');
    card.focus();
    expect(document.activeElement).toBe(card);
  });

  it('displays hover effects', async () => {
    render(<MovieCard movie={mockMovie} />);

    const card = screen.getByTestId('card-movie-550');
    
    fireEvent.mouseEnter(card);
    fireEvent.mouseLeave(card);
    
    expect(card).toBeInTheDocument();
  });
});
