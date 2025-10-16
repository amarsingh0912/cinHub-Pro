import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import FeaturedCollections from '../../client/src/components/movie/featured-collections';

describe('FeaturedCollections Component', () => {
  const collections = [
    {
      title: "Action Movies",
      description: "Explosive action and thrilling adventures",
      href: "/collection/action",
      count: "500+ Movies"
    },
    {
      title: "Classic Movies",
      description: "Timeless films from cinema history",
      href: "/collection/drama",
      count: "200+ Movies"
    },
    {
      title: "Award Winners",
      description: "Oscar and Emmy winning films",
      href: "/movies?filter=top-rated",
      count: "150+ Movies"
    }
  ];

  it('renders without crashing', () => {
    render(<FeaturedCollections />);
    expect(screen.getByTestId('featured-collections-section')).toBeInTheDocument();
  });

  it('displays the correct title', () => {
    render(<FeaturedCollections />);
    expect(screen.getByTestId('collections-title')).toHaveTextContent('Featured Collections');
  });

  it('renders all three collections', () => {
    render(<FeaturedCollections />);
    expect(screen.getByTestId('collections-grid')).toBeInTheDocument();
    
    collections.forEach((collection) => {
      const slug = collection.title.toLowerCase().replace(/\s+/g, '-');
      expect(screen.getByTestId(`collection-${slug}`)).toBeInTheDocument();
    });
  });

  it('displays collection titles correctly', () => {
    render(<FeaturedCollections />);
    
    collections.forEach((collection) => {
      const slug = collection.title.toLowerCase().replace(/\s+/g, '-');
      expect(screen.getByTestId(`collection-title-${slug}`)).toHaveTextContent(collection.title);
    });
  });

  it('displays collection descriptions and counts', () => {
    render(<FeaturedCollections />);
    
    collections.forEach((collection) => {
      const slug = collection.title.toLowerCase().replace(/\s+/g, '-');
      const description = screen.getByTestId(`collection-description-${slug}`);
      expect(description).toHaveTextContent(collection.count);
      expect(description).toHaveTextContent(collection.description);
    });
  });

  it('has correct href links for each collection', () => {
    render(<FeaturedCollections />);
    
    collections.forEach((collection) => {
      const slug = collection.title.toLowerCase().replace(/\s+/g, '-');
      const link = screen.getByTestId(`collection-${slug}`);
      expect(link).toHaveAttribute('href', collection.href);
    });
  });

  it('renders collection images with correct attributes', () => {
    render(<FeaturedCollections />);
    
    collections.forEach((collection) => {
      const images = screen.getAllByRole('img', { name: collection.title });
      expect(images.length).toBeGreaterThan(0);
      const img = images[0];
      expect(img).toHaveAttribute('alt', collection.title);
    });
  });

  it('applies hover effects with group classes', () => {
    render(<FeaturedCollections />);
    
    const firstCollectionSlug = collections[0].title.toLowerCase().replace(/\s+/g, '-');
    const firstCollection = screen.getByTestId(`collection-${firstCollectionSlug}`);
    const groupDiv = firstCollection.querySelector('.group');
    expect(groupDiv).toBeInTheDocument();
  });
});
