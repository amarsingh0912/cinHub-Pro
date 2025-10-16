import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MovieGridSkeleton from '../../client/src/components/movie/movie-grid-skeleton';

describe('MovieGridSkeleton Component', () => {
  it('renders without crashing', () => {
    render(<MovieGridSkeleton />);
    expect(screen.getByTestId('movie-grid-skeleton')).toBeInTheDocument();
  });

  it('renders default number of skeleton cards (12)', () => {
    render(<MovieGridSkeleton />);
    const skeletonCards = screen.getAllByTestId(/^skeleton-card-/);
    expect(skeletonCards).toHaveLength(12);
  });

  it('renders custom number of skeleton cards', () => {
    const customCount = 6;
    render(<MovieGridSkeleton count={customCount} />);
    const skeletonCards = screen.getAllByTestId(/^skeleton-card-/);
    expect(skeletonCards).toHaveLength(customCount);
  });

  it('applies responsive grid layout classes', () => {
    render(<MovieGridSkeleton />);
    const skeleton = screen.getByTestId('movie-grid-skeleton');
    expect(skeleton).toHaveClass('grid');
  });

  it('renders skeleton elements with loading animation', () => {
    render(<MovieGridSkeleton count={3} />);
    const skeletonCards = screen.getAllByTestId(/^skeleton-card-/);
    
    skeletonCards.forEach(card => {
      expect(card.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });

  it('handles zero count gracefully', () => {
    render(<MovieGridSkeleton count={0} />);
    const skeletonCards = screen.queryAllByTestId(/^skeleton-card-/);
    expect(skeletonCards).toHaveLength(0);
  });

  it('renders with correct aspect ratio placeholders', () => {
    render(<MovieGridSkeleton count={2} />);
    const skeletonCards = screen.getAllByTestId(/^skeleton-card-/);
    
    skeletonCards.forEach(card => {
      const posterPlaceholder = card.querySelector('.aspect-\\[2\\/3\\]');
      expect(posterPlaceholder).toBeInTheDocument();
    });
  });
});
