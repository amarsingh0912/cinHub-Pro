import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CastCardSkeleton from '../../client/src/components/movie/cast-card-skeleton';

describe('CastCardSkeleton Component', () => {
  it('renders without crashing', () => {
    render(<CastCardSkeleton />);
    expect(screen.getByTestId('cast-card-skeleton')).toBeInTheDocument();
  });

  it('renders default number of skeleton cards (6)', () => {
    render(<CastCardSkeleton />);
    const skeletonCards = screen.getAllByTestId(/^cast-skeleton-/);
    expect(skeletonCards).toHaveLength(6);
  });

  it('renders custom number of skeleton cards', () => {
    const customCount = 4;
    render(<CastCardSkeleton count={customCount} />);
    const skeletonCards = screen.getAllByTestId(/^cast-skeleton-/);
    expect(skeletonCards).toHaveLength(customCount);
  });

  it('applies loading animation to skeleton elements', () => {
    render(<CastCardSkeleton count={2} />);
    const skeletonCards = screen.getAllByTestId(/^cast-skeleton-/);
    
    skeletonCards.forEach(card => {
      expect(card.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });

  it('renders circular avatar placeholders', () => {
    render(<CastCardSkeleton count={3} />);
    const skeletonCards = screen.getAllByTestId(/^cast-skeleton-/);
    
    skeletonCards.forEach(card => {
      const avatar = card.querySelector('.rounded-full');
      expect(avatar).toBeInTheDocument();
    });
  });

  it('handles zero count gracefully', () => {
    render(<CastCardSkeleton count={0} />);
    const skeletonCards = screen.queryAllByTestId(/^cast-skeleton-/);
    expect(skeletonCards).toHaveLength(0);
  });

  it('renders text placeholders for name and character', () => {
    render(<CastCardSkeleton count={2} />);
    const skeletonCards = screen.getAllByTestId(/^cast-skeleton-/);
    
    skeletonCards.forEach(card => {
      const textPlaceholders = card.querySelectorAll('.h-4, .h-3');
      expect(textPlaceholders.length).toBeGreaterThan(0);
    });
  });
});
