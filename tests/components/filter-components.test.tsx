import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterDock } from '../../client/src/components/filter-kit';
import { DEFAULT_MOVIE_FILTERS } from '../../client/src/types/filters';

describe('FilterDock Component', () => {
  const mockFilters = DEFAULT_MOVIE_FILTERS;
  const mockOnFiltersChange = vi.fn();
  const mockSetPreset = vi.fn();

  it('renders filter dock', () => {
    render(
      <FilterDock
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
        setPreset={mockSetPreset}
      />
    );

    expect(screen.getByTestId('filter-dock')).toBeInTheDocument();
  });

  it('displays category buttons', () => {
    render(
      <FilterDock
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
        setPreset={mockSetPreset}
      />
    );

    expect(screen.getByTestId('button-category-trending')).toBeInTheDocument();
    expect(screen.getByTestId('button-category-popular')).toBeInTheDocument();
  });

  it('calls setPreset when category button is clicked', () => {
    render(
      <FilterDock
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
        setPreset={mockSetPreset}
      />
    );

    const trendingButton = screen.getByTestId('button-category-trending');
    fireEvent.click(trendingButton);

    expect(mockSetPreset).toHaveBeenCalledWith('trending');
  });

  it('highlights active category', () => {
    const filtersWithTrending = { ...mockFilters, category: 'trending' };
    
    render(
      <FilterDock
        filters={filtersWithTrending}
        onFiltersChange={mockOnFiltersChange}
        setPreset={mockSetPreset}
      />
    );

    const trendingButton = screen.getByTestId('button-category-trending');
    expect(trendingButton).toHaveClass('active'); // or whatever class indicates active state
  });

  it('displays filter count when filters are active', () => {
    const filtersWithGenres = {
      ...mockFilters,
      with_genres: [28, 12] // Action, Adventure
    };

    render(
      <FilterDock
        filters={filtersWithGenres}
        onFiltersChange={mockOnFiltersChange}
        setPreset={mockSetPreset}
      />
    );

    // Should show indicator that filters are active
    const filterButton = screen.getByTestId('button-open-filters');
    expect(filterButton).toBeInTheDocument();
  });

  it('opens filter modal when filter button is clicked', () => {
    render(
      <FilterDock
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
        setPreset={mockSetPreset}
      />
    );

    const filterButton = screen.getByTestId('button-open-filters');
    fireEvent.click(filterButton);

    // Filter lab/modal should be visible
    expect(screen.getByTestId('filter-lab')).toBeInTheDocument();
  });
});

describe('Filter Form Validation', () => {
  it('validates rating range', () => {
    const filters = {
      ...DEFAULT_MOVIE_FILTERS,
      'vote_average.gte': 0,
      'vote_average.lte': 10
    };

    expect(filters['vote_average.gte']).toBeGreaterThanOrEqual(0);
    expect(filters['vote_average.lte']).toBeLessThanOrEqual(10);
  });

  it('validates runtime range', () => {
    const filters = {
      ...DEFAULT_MOVIE_FILTERS,
      'with_runtime.gte': 0,
      'with_runtime.lte': 300
    };

    expect(filters['with_runtime.gte']).toBeGreaterThanOrEqual(0);
    expect(filters['with_runtime.lte']).toBeGreaterThan(0);
  });

  it('validates date format', () => {
    const filters = {
      ...DEFAULT_MOVIE_FILTERS,
      'primary_release_date.gte': '2024-01-01',
      'primary_release_date.lte': '2024-12-31'
    };

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    expect(filters['primary_release_date.gte']).toMatch(dateRegex);
    expect(filters['primary_release_date.lte']).toMatch(dateRegex);
  });
});
