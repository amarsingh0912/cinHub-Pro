import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CategoryGrid from '../../client/src/components/movie/category-grid';
import { CATEGORIES } from '../../client/src/types/movie';

describe('CategoryGrid Component', () => {
  it('renders without crashing', () => {
    render(<CategoryGrid />);
    expect(screen.getByTestId('category-grid-section')).toBeInTheDocument();
  });

  it('displays the correct title', () => {
    render(<CategoryGrid />);
    expect(screen.getByTestId('categories-title')).toHaveTextContent('Browse by Category');
  });

  it('renders all categories from CATEGORIES constant', () => {
    render(<CategoryGrid />);
    const categoriesGrid = screen.getByTestId('categories-grid');
    expect(categoriesGrid).toBeInTheDocument();
    
    CATEGORIES.forEach((category) => {
      expect(screen.getByTestId(`category-${category.slug}`)).toBeInTheDocument();
      expect(screen.getByTestId(`category-name-${category.slug}`)).toHaveTextContent(category.name);
    });
  });

  it('renders correct number of category items', () => {
    render(<CategoryGrid />);
    const categoryItems = screen.getAllByRole('link');
    expect(categoryItems.length).toBe(CATEGORIES.length);
  });

  it('each category has correct href link', () => {
    render(<CategoryGrid />);
    
    CATEGORIES.forEach((category) => {
      const link = screen.getByTestId(`category-${category.slug}`);
      expect(link).toHaveAttribute('href', `/collection/${category.slug}`);
    });
  });

  it('renders category icons', () => {
    render(<CategoryGrid />);
    
    CATEGORIES.forEach((category) => {
      const categoryElement = screen.getByTestId(`category-${category.slug}`);
      const icon = categoryElement.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  it('applies hover effects with correct classes', () => {
    render(<CategoryGrid />);
    
    const firstCategory = screen.getByTestId(`category-${CATEGORIES[0].slug}`);
    const interactiveDiv = firstCategory.querySelector('.group');
    expect(interactiveDiv).toBeInTheDocument();
    expect(interactiveDiv).toHaveClass('interactive');
  });
});
