import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TrailerModal from '../../client/src/components/movie/trailer-modal';

describe('TrailerModal Component', () => {
  const mockTrailer = {
    id: '123',
    key: 'abc123xyz',
    name: 'Official Trailer',
    type: 'Trailer',
    site: 'YouTube'
  };

  it('renders without crashing when open', () => {
    render(
      <TrailerModal 
        isOpen={true} 
        onClose={() => {}} 
        trailer={mockTrailer}
      />
    );
    expect(screen.getByTestId('trailer-modal')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <TrailerModal 
        isOpen={false} 
        onClose={() => {}} 
        trailer={mockTrailer}
      />
    );
    expect(screen.queryByTestId('trailer-modal')).not.toBeInTheDocument();
  });

  it('displays trailer name in the title', () => {
    render(
      <TrailerModal 
        isOpen={true} 
        onClose={() => {}} 
        trailer={mockTrailer}
      />
    );
    expect(screen.getByText(mockTrailer.name)).toBeInTheDocument();
  });

  it('renders YouTube iframe with correct src', () => {
    render(
      <TrailerModal 
        isOpen={true} 
        onClose={() => {}} 
        trailer={mockTrailer}
      />
    );
    const iframe = screen.getByTestId('trailer-iframe');
    expect(iframe).toHaveAttribute('src', expect.stringContaining(mockTrailer.key));
    expect(iframe).toHaveAttribute('src', expect.stringContaining('youtube.com'));
  });

  it('calls onClose when close button is clicked', () => {
    const mockOnClose = vi.fn();
    render(
      <TrailerModal 
        isOpen={true} 
        onClose={mockOnClose} 
        trailer={mockTrailer}
      />
    );
    
    const closeButton = screen.getByTestId('button-close-modal');
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('handles null trailer gracefully', () => {
    render(
      <TrailerModal 
        isOpen={true} 
        onClose={() => {}} 
        trailer={null}
      />
    );
    expect(screen.queryByTestId('trailer-iframe')).not.toBeInTheDocument();
  });

  it('includes iframe with correct attributes for accessibility', () => {
    render(
      <TrailerModal 
        isOpen={true} 
        onClose={() => {}} 
        trailer={mockTrailer}
      />
    );
    const iframe = screen.getByTestId('trailer-iframe');
    expect(iframe).toHaveAttribute('title', expect.any(String));
    expect(iframe).toHaveAttribute('allowfullscreen');
  });

  it('renders with correct modal overlay', () => {
    render(
      <TrailerModal 
        isOpen={true} 
        onClose={() => {}} 
        trailer={mockTrailer}
      />
    );
    const modal = screen.getByTestId('trailer-modal');
    expect(modal.parentElement).toHaveClass('fixed');
  });
});
