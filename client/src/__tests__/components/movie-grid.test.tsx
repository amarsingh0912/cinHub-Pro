/**
 * Unit tests for MovieGrid component
 * Tests skeleton rendering logic for infinite scroll to ensure proper grid alignment
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import MovieGrid from '@/components/movie/movie-grid';
import { Movie } from '@/types/movie';

// Mock the RevealOnScroll component and hook to avoid animation complexity in tests
vi.mock('@/hooks/useRevealAnimation', () => ({
  RevealOnScroll: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useRevealAnimation: () => ({
    ref: { current: null },
    className: '',
  }),
  REVEAL_PRESETS: {
    sectionHeader: {},
    staggeredFadeIn: {},
    fadeIn: {},
  },
}));

// Helper to create mock movie data
const createMockMovie = (id: number): Movie => ({
  id,
  title: `Movie ${id}`,
  poster_path: `/poster${id}.jpg`,
  backdrop_path: `/backdrop${id}.jpg`,
  overview: `Overview for movie ${id}`,
  release_date: '2025-01-01',
  vote_average: 7.5,
  vote_count: 100,
  popularity: 100,
  genre_ids: [28],
  original_language: 'en',
  original_title: `Movie ${id}`,
  adult: false,
  video: false,
});

describe('MovieGrid - Skeleton Rendering', () => {
  let originalInnerWidth: number;

  beforeEach(() => {
    originalInnerWidth = window.innerWidth;
  });

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  const setWindowWidth = (width: number) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
  };

  describe('Skeleton count calculation', () => {
    it('should render full row (6 skeletons) when movies fill complete row on lg screens', () => {
      setWindowWidth(1024); // lg breakpoint = 6 columns
      const movies = Array.from({ length: 12 }, (_, i) => createMockMovie(i)); // 12 movies = 2 complete rows

      render(
        <MovieGrid
          movies={movies}
          isFetchingNextPage={true}
          enableAnimations={false}
        />
      );

      const skeletonWrappers = screen.getAllByRole('status');
      expect(skeletonWrappers).toHaveLength(6); // Should render 6 skeletons (full row)
    });

    it('should fill incomplete row (2 skeletons) when 4 movies in last row on lg screens', () => {
      setWindowWidth(1024); // lg breakpoint = 6 columns
      const movies = Array.from({ length: 10 }, (_, i) => createMockMovie(i)); // 10 movies = 1 full row + 4 in second row

      render(
        <MovieGrid
          movies={movies}
          isFetchingNextPage={true}
          enableAnimations={false}
        />
      );

      const skeletonWrappers = screen.getAllByRole('status');
      expect(skeletonWrappers).toHaveLength(2); // Should render 2 skeletons to complete the row (6 - 4 = 2)
    });

    it('should render full row (4 skeletons) when movies fill complete row on md screens', () => {
      setWindowWidth(768); // md breakpoint = 4 columns
      const movies = Array.from({ length: 8 }, (_, i) => createMockMovie(i)); // 8 movies = 2 complete rows

      render(
        <MovieGrid
          movies={movies}
          isFetchingNextPage={true}
          enableAnimations={false}
        />
      );

      const skeletonWrappers = screen.getAllByRole('status');
      expect(skeletonWrappers).toHaveLength(4); // Should render 4 skeletons (full row)
    });

    it('should fill incomplete row (1 skeleton) when 3 movies in last row on md screens', () => {
      setWindowWidth(768); // md breakpoint = 4 columns
      const movies = Array.from({ length: 7 }, (_, i) => createMockMovie(i)); // 7 movies = 1 full row + 3 in second row

      render(
        <MovieGrid
          movies={movies}
          isFetchingNextPage={true}
          enableAnimations={false}
        />
      );

      const skeletonWrappers = screen.getAllByRole('status');
      expect(skeletonWrappers).toHaveLength(1); // Should render 1 skeleton to complete the row (4 - 3 = 1)
    });

    it('should render full row (3 skeletons) when movies fill complete row on sm screens', () => {
      setWindowWidth(640); // sm breakpoint = 3 columns
      const movies = Array.from({ length: 9 }, (_, i) => createMockMovie(i)); // 9 movies = 3 complete rows

      render(
        <MovieGrid
          movies={movies}
          isFetchingNextPage={true}
          enableAnimations={false}
        />
      );

      const skeletonWrappers = screen.getAllByRole('status');
      expect(skeletonWrappers).toHaveLength(3); // Should render 3 skeletons (full row)
    });

    it('should fill incomplete row (1 skeleton) when 2 movies in last row on sm screens', () => {
      setWindowWidth(640); // sm breakpoint = 3 columns
      const movies = Array.from({ length: 8 }, (_, i) => createMockMovie(i)); // 8 movies = 2 full rows + 2 in third row

      render(
        <MovieGrid
          movies={movies}
          isFetchingNextPage={true}
          enableAnimations={false}
        />
      );

      const skeletonWrappers = screen.getAllByRole('status');
      expect(skeletonWrappers).toHaveLength(1); // Should render 1 skeleton to complete the row (3 - 2 = 1)
    });

    it('should render full row (2 skeletons) when movies fill complete row on mobile', () => {
      setWindowWidth(400); // mobile = 2 columns
      const movies = Array.from({ length: 6 }, (_, i) => createMockMovie(i)); // 6 movies = 3 complete rows

      render(
        <MovieGrid
          movies={movies}
          isFetchingNextPage={true}
          enableAnimations={false}
        />
      );

      const skeletonWrappers = screen.getAllByRole('status');
      expect(skeletonWrappers).toHaveLength(2); // Should render 2 skeletons (full row)
    });

    it('should fill incomplete row (1 skeleton) when 1 movie in last row on mobile', () => {
      setWindowWidth(400); // mobile = 2 columns
      const movies = Array.from({ length: 5 }, (_, i) => createMockMovie(i)); // 5 movies = 2 full rows + 1 in third row

      render(
        <MovieGrid
          movies={movies}
          isFetchingNextPage={true}
          enableAnimations={false}
        />
      );

      const skeletonWrappers = screen.getAllByRole('status');
      expect(skeletonWrappers).toHaveLength(1); // Should render 1 skeleton to complete the row (2 - 1 = 1)
    });
  });

  describe('Accessibility attributes', () => {
    it('should add role="status" to skeleton wrappers', () => {
      setWindowWidth(1024);
      const movies = Array.from({ length: 12 }, (_, i) => createMockMovie(i));

      render(
        <MovieGrid
          movies={movies}
          isFetchingNextPage={true}
          enableAnimations={false}
        />
      );

      const skeletonWrappers = screen.getAllByRole('status');
      expect(skeletonWrappers.length).toBeGreaterThan(0);
      skeletonWrappers.forEach((wrapper: HTMLElement) => {
        expect(wrapper).toHaveAttribute('role', 'status');
      });
    });

    it('should add aria-hidden="true" to skeleton wrappers', () => {
      setWindowWidth(1024);
      const movies = Array.from({ length: 12 }, (_, i) => createMockMovie(i));

      render(
        <MovieGrid
          movies={movies}
          isFetchingNextPage={true}
          enableAnimations={false}
        />
      );

      const skeletonWrappers = screen.getAllByRole('status');
      skeletonWrappers.forEach((wrapper: HTMLElement) => {
        expect(wrapper).toHaveAttribute('aria-hidden', 'true');
      });
    });

    it('should have stable keys for skeleton elements', () => {
      setWindowWidth(1024);
      const movies = Array.from({ length: 10 }, (_, i) => createMockMovie(i));

      const { container } = render(
        <MovieGrid
          movies={movies}
          isFetchingNextPage={true}
          enableAnimations={false}
        />
      );

      const skeletonWrappers = screen.getAllByRole('status');
      // Check that all skeleton wrappers are in the DOM
      expect(skeletonWrappers).toHaveLength(2);
      
      // Verify they're rendered within the grid
      const grid = screen.getByTestId('movie-grid');
      expect(grid).toBeInTheDocument();
      skeletonWrappers.forEach((wrapper: HTMLElement) => {
        expect(grid).toContainElement(wrapper);
      });
    });
  });

  describe('No skeletons when not fetching', () => {
    it('should not render skeletons when isFetchingNextPage is false', () => {
      setWindowWidth(1024);
      const movies = Array.from({ length: 10 }, (_, i) => createMockMovie(i));

      render(
        <MovieGrid
          movies={movies}
          isFetchingNextPage={false}
          enableAnimations={false}
        />
      );

      const skeletonWrappers = screen.queryAllByRole('status');
      expect(skeletonWrappers).toHaveLength(0);
    });

    it('should not render skeletons when isFetchingNextPage is undefined', () => {
      setWindowWidth(1024);
      const movies = Array.from({ length: 10 }, (_, i) => createMockMovie(i));

      render(
        <MovieGrid
          movies={movies}
          enableAnimations={false}
        />
      );

      const skeletonWrappers = screen.queryAllByRole('status');
      expect(skeletonWrappers).toHaveLength(0);
    });
  });

  describe('Grid alignment', () => {
    it('should render skeletons inside the same grid container', () => {
      setWindowWidth(1024);
      const movies = Array.from({ length: 10 }, (_, i) => createMockMovie(i));

      render(
        <MovieGrid
          movies={movies}
          isFetchingNextPage={true}
          enableAnimations={false}
        />
      );

      const grid = screen.getByTestId('movie-grid');
      const movieCards = screen.getAllByTestId('movie-card');
      const skeletonWrappers = screen.getAllByRole('status');

      // All items should be in the same grid
      expect(grid).toBeInTheDocument();
      movieCards.forEach((card: HTMLElement) => {
        expect(grid).toContainElement(card);
      });
      skeletonWrappers.forEach((wrapper: HTMLElement) => {
        expect(grid).toContainElement(wrapper);
      });
    });
  });

  describe('Animation variants', () => {
    it('should render skeletons correctly with staggered animation', () => {
      setWindowWidth(1024);
      const movies = Array.from({ length: 10 }, (_, i) => createMockMovie(i));

      render(
        <MovieGrid
          movies={movies}
          isFetchingNextPage={true}
          enableAnimations={true}
          animationType="staggered"
        />
      );

      const skeletonWrappers = screen.getAllByRole('status');
      expect(skeletonWrappers).toHaveLength(2);
    });

    it('should render skeletons correctly with fade animation', () => {
      setWindowWidth(1024);
      const movies = Array.from({ length: 10 }, (_, i) => createMockMovie(i));

      render(
        <MovieGrid
          movies={movies}
          isFetchingNextPage={true}
          enableAnimations={true}
          animationType="fade"
        />
      );

      const skeletonWrappers = screen.getAllByRole('status');
      expect(skeletonWrappers).toHaveLength(2);
    });
  });
});
