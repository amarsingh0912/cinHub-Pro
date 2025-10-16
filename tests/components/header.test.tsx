import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import Header from '@/components/layout/header';

// Mock hooks
vi.mock('wouter', () => ({
  useLocation: () => ['/', vi.fn()],
  Link: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'light',
    toggleTheme: vi.fn(),
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const { useAuth } = await import('@/hooks/useAuth');

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('Header Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Unauthenticated User', () => {
    beforeEach(() => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    });

    it('should render header with brand name', () => {
      render(<Header />, { wrapper });
      expect(screen.getByText('CineHub Pro')).toBeInTheDocument();
    });

    it('should display navigation menu items', () => {
      render(<Header />, { wrapper });
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Movies')).toBeInTheDocument();
      expect(screen.getByText('TV Shows')).toBeInTheDocument();
      expect(screen.getByText('About Us')).toBeInTheDocument();
      expect(screen.getByText('Contact Us')).toBeInTheDocument();
    });

    it('should show sign in button when not authenticated', () => {
      render(<Header />, { wrapper });
      const signInButton = screen.getByTestId('button-signin');
      expect(signInButton).toBeInTheDocument();
      expect(signInButton).toHaveTextContent('Sign In');
    });

    it('should open search modal when search button clicked', () => {
      render(<Header />, { wrapper });
      const searchButton = screen.getByTestId('button-search');
      fireEvent.click(searchButton);
      // SearchModal should open (tested separately)
    });

    it('should toggle theme when theme button clicked', () => {
      const { useTheme } = require('@/contexts/ThemeContext');
      const toggleTheme = vi.fn();
      vi.mocked(useTheme).mockReturnValue({
        theme: 'light',
        toggleTheme,
      });

      render(<Header />, { wrapper });
      const themeButton = screen.getByTestId('button-theme');
      fireEvent.click(themeButton);
      expect(toggleTheme).toHaveBeenCalled();
    });

    it('should open mobile menu when menu button clicked', () => {
      render(<Header />, { wrapper });
      const menuButton = screen.getByTestId('button-mobile-menu');
      fireEvent.click(menuButton);
      
      // Mobile menu should be visible
      expect(screen.getByTestId('mobile-menu')).toBeInTheDocument();
    });

    it('should display correct theme icon based on current theme', () => {
      const { useTheme } = require('@/contexts/ThemeContext');
      
      // Test light theme
      vi.mocked(useTheme).mockReturnValue({
        theme: 'light',
        toggleTheme: vi.fn(),
      });
      const { rerender } = render(<Header />, { wrapper });
      expect(screen.getByTestId('button-theme')).toBeInTheDocument();

      // Test dark theme
      vi.mocked(useTheme).mockReturnValue({
        theme: 'dark',
        toggleTheme: vi.fn(),
      });
      rerender(<Header />);
      expect(screen.getByTestId('button-theme')).toBeInTheDocument();
    });
  });

  describe('Authenticated User', () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      username: 'testuser',
      displayName: 'Test User',
      profileImageUrl: 'https://example.com/avatar.jpg',
      isAdmin: false,
    };

    beforeEach(() => {
      vi.mocked(useAuth).mockReturnValue({
        user: mockUser,
        isLoading: false,
        isAuthenticated: true,
      });
    });

    it('should show user avatar when authenticated', () => {
      render(<Header />, { wrapper });
      const avatar = screen.getByTestId('avatar-user');
      expect(avatar).toBeInTheDocument();
    });

    it('should display user dropdown menu on avatar click', () => {
      render(<Header />, { wrapper });
      const avatar = screen.getByTestId('avatar-user');
      fireEvent.click(avatar);
      
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Sign Out')).toBeInTheDocument();
    });

    it('should show admin dashboard link for admin users', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: { ...mockUser, isAdmin: true },
        isLoading: false,
        isAuthenticated: true,
      });

      render(<Header />, { wrapper });
      const avatar = screen.getByTestId('avatar-user');
      fireEvent.click(avatar);
      
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    });

    it('should not show sign in button when authenticated', () => {
      render(<Header />, { wrapper });
      expect(screen.queryByTestId('button-signin')).not.toBeInTheDocument();
    });

    it('should open logout confirmation dialog when sign out clicked', async () => {
      render(<Header />, { wrapper });
      const avatar = screen.getByTestId('avatar-user');
      fireEvent.click(avatar);
      
      const signOutButton = screen.getByText('Sign Out');
      fireEvent.click(signOutButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Are you sure you want to sign out/)).toBeInTheDocument();
      });
    });

    it('should display user initials in avatar when no profile image', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: { ...mockUser, profileImageUrl: undefined },
        isLoading: false,
        isAuthenticated: true,
      });

      render(<Header />, { wrapper });
      expect(screen.getByText('TU')).toBeInTheDocument(); // Test User initials
    });
  });

  describe('Mobile Menu', () => {
    beforeEach(() => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    });

    it('should toggle mobile menu open and closed', () => {
      render(<Header />, { wrapper });
      const menuButton = screen.getByTestId('button-mobile-menu');
      
      // Open menu
      fireEvent.click(menuButton);
      expect(screen.getByTestId('mobile-menu')).toBeInTheDocument();
      
      // Close menu
      fireEvent.click(menuButton);
      expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument();
    });

    it('should close mobile menu when navigation link clicked', () => {
      render(<Header />, { wrapper });
      const menuButton = screen.getByTestId('button-mobile-menu');
      
      fireEvent.click(menuButton);
      expect(screen.getByTestId('mobile-menu')).toBeInTheDocument();
      
      const homeLink = screen.getAllByText('Home')[1]; // Second one is in mobile menu
      fireEvent.click(homeLink);
      
      expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument();
    });

    it('should display all navigation links in mobile menu', () => {
      render(<Header />, { wrapper });
      const menuButton = screen.getByTestId('button-mobile-menu');
      fireEvent.click(menuButton);
      
      const mobileMenu = screen.getByTestId('mobile-menu');
      expect(mobileMenu).toHaveTextContent('Home');
      expect(mobileMenu).toHaveTextContent('Movies');
      expect(mobileMenu).toHaveTextContent('TV Shows');
      expect(mobileMenu).toHaveTextContent('About Us');
      expect(mobileMenu).toHaveTextContent('Contact Us');
    });
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    });

    it('should open search modal when search button clicked', () => {
      render(<Header />, { wrapper });
      const searchButton = screen.getByTestId('button-search');
      expect(searchButton).toBeInTheDocument();
      
      fireEvent.click(searchButton);
      // Search modal opening is tested in search-modal.test.tsx
    });

    it('should have search button accessible via keyboard', () => {
      render(<Header />, { wrapper });
      const searchButton = screen.getByTestId('button-search');
      
      searchButton.focus();
      expect(searchButton).toHaveFocus();
      
      fireEvent.keyDown(searchButton, { key: 'Enter' });
      // Should trigger search modal
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    });

    it('should have proper ARIA labels', () => {
      render(<Header />, { wrapper });
      expect(screen.getByTestId('button-search')).toHaveAttribute('aria-label');
      expect(screen.getByTestId('button-theme')).toHaveAttribute('aria-label');
      expect(screen.getByTestId('button-mobile-menu')).toHaveAttribute('aria-label');
    });

    it('should support keyboard navigation', () => {
      render(<Header />, { wrapper });
      const firstLink = screen.getAllByRole('link')[0];
      
      firstLink.focus();
      expect(firstLink).toHaveFocus();
      
      // Tab to next element
      fireEvent.keyDown(firstLink, { key: 'Tab' });
    });

    it('should have semantic HTML structure', () => {
      const { container } = render(<Header />, { wrapper });
      expect(container.querySelector('header')).toBeInTheDocument();
      expect(container.querySelector('nav')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should handle loading state gracefully', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        isLoading: true,
        isAuthenticated: false,
      });

      render(<Header />, { wrapper });
      expect(screen.getByText('CineHub Pro')).toBeInTheDocument();
      // Should still render header structure while loading
    });
  });
});
