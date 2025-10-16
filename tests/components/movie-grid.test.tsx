import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MovieGrid from '../../client/src/components/movie/movie-grid';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('MovieGrid Component', () => {
  const mockMovies = [
    {
      id: 1,
      title: 'Test Movie 1',
      posterPath: '/test1.jpg',
      releaseDate: '2024-01-01',
      voteAverage: 8.5,
      overview: 'Test overview 1'
    },
    {
      id: 2,
      title: 'Test Movie 2',
      posterPath: '/test2.jpg',
      releaseDate: '2024-01-02',
      voteAverage: 7.5,
      overview: 'Test overview 2'
    }
  ];

  it('renders without crashing with movies', () => {
    render(
      <MovieGrid movies={mockMovies} />,
      { wrapper: createWrapper() }
    );
    expect(screen.getByTestId('movie-grid')).toBeInTheDocument();
  });

  it('renders all provided movies', () => {
    render(
      <MovieGrid movies={mockMovies} />,
      { wrapper: createWrapper() }
    );
    
    mockMovies.forEach((movie) => {
      expect(screen.getByTestId(`movie-card-${movie.id}`)).toBeInTheDocument();
    });
  });

  it('displays empty state when no movies provided', () => {
    render(
      <MovieGrid movies={[]} />,
      { wrapper: createWrapper() }
    );
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  it('renders correct number of movie cards', () => {
    render(
      <MovieGrid movies={mockMovies} />,
      { wrapper: createWrapper() }
    );
    
    const movieCards = screen.getAllByTestId(/^movie-card-/);
    expect(movieCards).toHaveLength(mockMovies.length);
  });

  it('applies responsive grid classes', () => {
    render(
      <MovieGrid movies={mockMovies} />,
      { wrapper: createWrapper() }
    );
    
    const grid = screen.getByTestId('movie-grid');
    expect(grid).toHaveClass('grid');
  });

  it('handles undefined movies gracefully', () => {
    render(
      <MovieGrid movies={undefined as any} />,
      { wrapper: createWrapper() }
    );
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });
});
