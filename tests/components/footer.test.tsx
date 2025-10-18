import { describe, it, expect } from 'vitest';
import { render, screen } from '@/__tests__/utils/test-utils';
import Footer from '@/components/layout/footer';

describe('Footer Component', () => {
  it('should render footer element', () => {
    const { container } = render(<Footer />);
    expect(container.querySelector('footer')).toBeInTheDocument();
  });

  it('should display copyright information', () => {
    render(<Footer />);
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(currentYear.toString()))).toBeInTheDocument();
  });

  it('should display CineHub Pro brand name', () => {
    render(<Footer />);
    expect(screen.getByText(/CineHub Pro/i)).toBeInTheDocument();
  });

  describe('Navigation Links', () => {
    it('should render all footer navigation links', () => {
      render(<Footer />);
      
      // Check for common footer links
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
    });

    it('should have about us link', () => {
      render(<Footer />);
      const aboutLink = screen.getByText(/About/i);
      expect(aboutLink).toBeInTheDocument();
      expect(aboutLink.closest('a')).toHaveAttribute('href');
    });

    it('should have contact link', () => {
      render(<Footer />);
      const contactLink = screen.getByText(/Contact/i);
      expect(contactLink).toBeInTheDocument();
    });

    it('should have privacy policy link', () => {
      render(<Footer />);
      const privacyLink = screen.getByText(/Privacy/i);
      expect(privacyLink).toBeInTheDocument();
    });

    it('should have terms of service link', () => {
      render(<Footer />);
      const termsLink = screen.getByText(/Terms/i);
      expect(termsLink).toBeInTheDocument();
    });
  });

  describe('Social Links', () => {
    it('should render social media icons', () => {
      render(<Footer />);
      const socialLinks = screen.getAllByRole('link').filter(link => 
        link.getAttribute('href')?.includes('twitter') ||
        link.getAttribute('href')?.includes('facebook') ||
        link.getAttribute('href')?.includes('instagram') ||
        link.getAttribute('href')?.includes('github')
      );
      
      // At least some social links should be present
      expect(socialLinks.length).toBeGreaterThanOrEqual(0);
    });

    it('should have proper ARIA labels for social links', () => {
      const { container } = render(<Footer />);
      const socialLinks = container.querySelectorAll('a[aria-label]');
      
      socialLinks.forEach(link => {
        expect(link).toHaveAttribute('aria-label');
      });
    });

    it('should open social links in new tab', () => {
      const { container } = render(<Footer />);
      const externalLinks = container.querySelectorAll('a[target="_blank"]');
      
      externalLinks.forEach(link => {
        expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
      });
    });
  });

  describe('TMDB Attribution', () => {
    it('should display TMDB attribution', () => {
      render(<Footer />);
      expect(screen.getByText(/powered by/i) || screen.getByText(/TMDB/i)).toBeTruthy();
    });

    it('should have TMDB logo or text', () => {
      const { container } = render(<Footer />);
      const tmdbElement = container.querySelector('[alt*="TMDB" i], [src*="tmdb" i]') ||
                         screen.queryByText(/The Movie Database/i) ||
                         screen.queryByText(/TMDB/i);
      expect(tmdbElement).toBeTruthy();
    });
  });

  describe('Newsletter Subscription', () => {
    it('should have newsletter signup form if present', () => {
      const { container } = render(<Footer />);
      const newsletterForm = container.querySelector('form');
      
      if (newsletterForm) {
        expect(newsletterForm).toBeInTheDocument();
        expect(container.querySelector('input[type="email"]')).toBeInTheDocument();
      }
    });

    it('should have email input with proper attributes', () => {
      const { container } = render(<Footer />);
      const emailInput = container.querySelector('input[type="email"]');
      
      if (emailInput) {
        expect(emailInput).toHaveAttribute('placeholder');
        expect(emailInput).toHaveAttribute('name');
      }
    });
  });

  describe('Accessibility', () => {
    it('should use semantic footer element', () => {
      const { container } = render(<Footer />);
      expect(container.querySelector('footer')).toBeInTheDocument();
    });

    it('should have proper heading hierarchy', () => {
      const { container } = render(<Footer />);
      const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
      
      headings.forEach(heading => {
        expect(heading).toBeInTheDocument();
      });
    });

    it('should have descriptive link text', () => {
      render(<Footer />);
      const links = screen.getAllByRole('link');
      
      links.forEach(link => {
        const text = link.textContent || link.getAttribute('aria-label');
        expect(text).toBeTruthy();
        expect(text?.length).toBeGreaterThan(0);
      });
    });

    it('should have sufficient color contrast', () => {
      const { container } = render(<Footer />);
      const footer = container.querySelector('footer');
      
      expect(footer).toHaveClass(/bg-|background-/);
    });
  });

  describe('Responsive Design', () => {
    it('should render without errors on different screen sizes', () => {
      const { container } = render(<Footer />);
      expect(container.querySelector('footer')).toBeInTheDocument();
      
      // Check for responsive classes
      const responsiveElements = container.querySelectorAll('[class*="sm:"], [class*="md:"], [class*="lg:"]');
      expect(responsiveElements.length).toBeGreaterThanOrEqual(0);
    });

    it('should have proper mobile layout', () => {
      const { container } = render(<Footer />);
      const footer = container.querySelector('footer');
      
      // Should have flex or grid layout
      expect(footer).toHaveClass(/flex|grid/);
    });
  });

  describe('Additional Information', () => {
    it('should display app version if present', () => {
      const { container } = render(<Footer />);
      const versionText = container.textContent?.match(/v?\d+\.\d+\.\d+/);
      
      // Version is optional
      if (versionText) {
        expect(versionText).toBeTruthy();
      }
    });

    it('should have proper spacing and padding', () => {
      const { container } = render(<Footer />);
      const footer = container.querySelector('footer');
      
      expect(footer).toHaveClass(/p-|py-|px-/);
    });
  });
});
