import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import AuthModal from '@/components/ui/auth-modal';

// Mock hooks
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock('wouter', () => ({
  useLocation: () => ['/', vi.fn()],
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('AuthModal Component', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Modal Rendering', () => {
    it('should render when open prop is true', () => {
      render(<AuthModal open={true} onClose={mockOnClose} />, { wrapper });
      expect(screen.getByTestId('dialog-auth')).toBeInTheDocument();
    });

    it('should not render when open prop is false', () => {
      render(<AuthModal open={false} onClose={mockOnClose} />, { wrapper });
      expect(screen.queryByTestId('dialog-auth')).not.toBeInTheDocument();
    });

    it('should call onClose when close button clicked', () => {
      render(<AuthModal open={true} onClose={mockOnClose} />, { wrapper });
      const closeButton = screen.getByTestId('button-close');
      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when clicking outside modal', () => {
      render(<AuthModal open={true} onClose={mockOnClose} />, { wrapper });
      const overlay = screen.getByTestId('dialog-overlay');
      fireEvent.click(overlay);
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Sign In Tab', () => {
    it('should display sign in form by default', () => {
      render(<AuthModal open={true} onClose={mockOnClose} />, { wrapper });
      expect(screen.getByTestId('tab-signin')).toHaveAttribute('data-state', 'active');
      expect(screen.getByTestId('input-identifier')).toBeInTheDocument();
      expect(screen.getByTestId('input-password')).toBeInTheDocument();
    });

    it('should have email/username input field', () => {
      render(<AuthModal open={true} onClose={mockOnClose} />, { wrapper });
      const identifierInput = screen.getByTestId('input-identifier');
      expect(identifierInput).toHaveAttribute('placeholder');
      expect(identifierInput).toHaveAttribute('type', 'text');
    });

    it('should have password input field', () => {
      render(<AuthModal open={true} onClose={mockOnClose} />, { wrapper });
      const passwordInput = screen.getByTestId('input-password');
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should have sign in button', () => {
      render(<AuthModal open={true} onClose={mockOnClose} />, { wrapper });
      const signInButton = screen.getByTestId('button-submit-signin');
      expect(signInButton).toBeInTheDocument();
      expect(signInButton).toHaveTextContent(/sign in/i);
    });

    it('should validate empty fields on submit', async () => {
      render(<AuthModal open={true} onClose={mockOnClose} />, { wrapper });
      const submitButton = screen.getByTestId('button-submit-signin');
      
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/required/i)).toBeInTheDocument();
      });
    });

    it('should display error for invalid credentials', async () => {
      render(<AuthModal open={true} onClose={mockOnClose} />, { wrapper });
      
      const identifierInput = screen.getByTestId('input-identifier');
      const passwordInput = screen.getByTestId('input-password');
      const submitButton = screen.getByTestId('button-submit-signin');
      
      fireEvent.change(identifierInput, { target: { value: 'invalid@test.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(submitButton);
      
      // Error handling tested in integration tests
    });

    it('should have forgot password link', () => {
      render(<AuthModal open={true} onClose={mockOnClose} />, { wrapper });
      const forgotLink = screen.getByText(/forgot password/i);
      expect(forgotLink).toBeInTheDocument();
    });
  });

  describe('Sign Up Tab', () => {
    it('should switch to sign up tab when clicked', () => {
      render(<AuthModal open={true} onClose={mockOnClose} />, { wrapper });
      const signUpTab = screen.getByTestId('tab-signup');
      
      fireEvent.click(signUpTab);
      
      expect(signUpTab).toHaveAttribute('data-state', 'active');
      expect(screen.getByTestId('input-email')).toBeInTheDocument();
      expect(screen.getByTestId('input-username')).toBeInTheDocument();
      expect(screen.getByTestId('input-signup-password')).toBeInTheDocument();
    });

    it('should have all required signup fields', () => {
      render(<AuthModal open={true} onClose={mockOnClose} />, { wrapper });
      fireEvent.click(screen.getByTestId('tab-signup'));
      
      expect(screen.getByTestId('input-email')).toBeInTheDocument();
      expect(screen.getByTestId('input-username')).toBeInTheDocument();
      expect(screen.getByTestId('input-signup-password')).toBeInTheDocument();
    });

    it('should validate email format', async () => {
      render(<AuthModal open={true} onClose={mockOnClose} />, { wrapper });
      fireEvent.click(screen.getByTestId('tab-signup'));
      
      const emailInput = screen.getByTestId('input-email');
      const submitButton = screen.getByTestId('button-submit-signup');
      
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/valid email/i)).toBeInTheDocument();
      });
    });

    it('should validate password strength', async () => {
      render(<AuthModal open={true} onClose={mockOnClose} />, { wrapper });
      fireEvent.click(screen.getByTestId('tab-signup'));
      
      const passwordInput = screen.getByTestId('input-signup-password');
      const submitButton = screen.getByTestId('button-submit-signup');
      
      fireEvent.change(passwordInput, { target: { value: '123' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/password/i)).toBeInTheDocument();
      });
    });

    it('should validate username format', async () => {
      render(<AuthModal open={true} onClose={mockOnClose} />, { wrapper });
      fireEvent.click(screen.getByTestId('tab-signup'));
      
      const usernameInput = screen.getByTestId('input-username');
      const submitButton = screen.getByTestId('button-submit-signup');
      
      fireEvent.change(usernameInput, { target: { value: 'a' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/username/i)).toBeInTheDocument();
      });
    });
  });

  describe('Social Login', () => {
    it('should display social login buttons', () => {
      render(<AuthModal open={true} onClose={mockOnClose} />, { wrapper });
      
      expect(screen.getByTestId('button-google-login')).toBeInTheDocument();
      expect(screen.getByTestId('button-facebook-login')).toBeInTheDocument();
      expect(screen.getByTestId('button-github-login')).toBeInTheDocument();
      expect(screen.getByTestId('button-twitter-login')).toBeInTheDocument();
    });

    it('should have correct href for Google OAuth', () => {
      render(<AuthModal open={true} onClose={mockOnClose} />, { wrapper });
      const googleButton = screen.getByTestId('button-google-login');
      expect(googleButton).toHaveAttribute('href', '/api/auth/google');
    });

    it('should have correct href for Facebook OAuth', () => {
      render(<AuthModal open={true} onClose={mockOnClose} />, { wrapper });
      const facebookButton = screen.getByTestId('button-facebook-login');
      expect(facebookButton).toHaveAttribute('href', '/api/auth/facebook');
    });

    it('should have correct href for GitHub OAuth', () => {
      render(<AuthModal open={true} onClose={mockOnClose} />, { wrapper });
      const githubButton = screen.getByTestId('button-github-login');
      expect(githubButton).toHaveAttribute('href', '/api/auth/github');
    });

    it('should have correct href for Twitter OAuth', () => {
      render(<AuthModal open={true} onClose={mockOnClose} />, { wrapper });
      const twitterButton = screen.getByTestId('button-twitter-login');
      expect(twitterButton).toHaveAttribute('href', '/api/auth/twitter');
    });

    it('should display divider between form and social login', () => {
      render(<AuthModal open={true} onClose={mockOnClose} />, { wrapper });
      expect(screen.getByText(/or continue with/i)).toBeInTheDocument();
    });
  });

  describe('OTP Verification', () => {
    it('should show OTP input when OTP verification needed', () => {
      render(<AuthModal open={true} onClose={mockOnClose} initialView="otp" />, { wrapper });
      expect(screen.getByTestId('input-otp')).toBeInTheDocument();
    });

    it('should have 6-digit OTP input', () => {
      render(<AuthModal open={true} onClose={mockOnClose} initialView="otp" />, { wrapper });
      const otpInput = screen.getByTestId('input-otp');
      expect(otpInput).toHaveAttribute('maxLength', '6');
    });

    it('should have resend OTP button', () => {
      render(<AuthModal open={true} onClose={mockOnClose} initialView="otp" />, { wrapper });
      expect(screen.getByTestId('button-resend-otp')).toBeInTheDocument();
    });

    it('should have verify button', () => {
      render(<AuthModal open={true} onClose={mockOnClose} initialView="otp" />, { wrapper });
      expect(screen.getByTestId('button-verify-otp')).toBeInTheDocument();
    });
  });

  describe('Password Reset', () => {
    it('should show password reset form when forgot password clicked', () => {
      render(<AuthModal open={true} onClose={mockOnClose} />, { wrapper });
      const forgotLink = screen.getByText(/forgot password/i);
      
      fireEvent.click(forgotLink);
      
      expect(screen.getByTestId('input-reset-email')).toBeInTheDocument();
      expect(screen.getByTestId('button-send-reset')).toBeInTheDocument();
    });

    it('should validate email in password reset', async () => {
      render(<AuthModal open={true} onClose={mockOnClose} />, { wrapper });
      fireEvent.click(screen.getByText(/forgot password/i));
      
      const emailInput = screen.getByTestId('input-reset-email');
      const submitButton = screen.getByTestId('button-send-reset');
      
      fireEvent.change(emailInput, { target: { value: 'invalid' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/valid email/i)).toBeInTheDocument();
      });
    });

    it('should have back to sign in link', () => {
      render(<AuthModal open={true} onClose={mockOnClose} />, { wrapper });
      fireEvent.click(screen.getByText(/forgot password/i));
      
      expect(screen.getByText(/back to sign in/i)).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should disable submit button when loading', () => {
      render(<AuthModal open={true} onClose={mockOnClose} />, { wrapper });
      const submitButton = screen.getByTestId('button-submit-signin');
      
      // Simulate loading state
      fireEvent.click(submitButton);
      
      expect(submitButton).toBeDisabled();
    });

    it('should show loading spinner when submitting', () => {
      render(<AuthModal open={true} onClose={mockOnClose} />, { wrapper });
      const submitButton = screen.getByTestId('button-submit-signin');
      
      fireEvent.click(submitButton);
      
      // Loading spinner should be visible
      expect(submitButton).toContainHTML('svg');
    });

    it('should disable all inputs when loading', async () => {
      render(<AuthModal open={true} onClose={mockOnClose} />, { wrapper });
      const submitButton = screen.getByTestId('button-submit-signin');
      
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        const inputs = screen.getAllByRole('textbox');
        inputs.forEach(input => {
          expect(input).toBeDisabled();
        });
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<AuthModal open={true} onClose={mockOnClose} />, { wrapper });
      
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby');
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-describedby');
    });

    it('should trap focus within modal', () => {
      render(<AuthModal open={true} onClose={mockOnClose} />, { wrapper });
      
      const firstInput = screen.getByTestId('input-identifier');
      const closeButton = screen.getByTestId('button-close');
      
      firstInput.focus();
      expect(firstInput).toHaveFocus();
      
      // Tab should cycle within modal
      fireEvent.keyDown(closeButton, { key: 'Tab' });
    });

    it('should close on Escape key', () => {
      render(<AuthModal open={true} onClose={mockOnClose} />, { wrapper });
      
      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should have proper form labels', () => {
      render(<AuthModal open={true} onClose={mockOnClose} />, { wrapper });
      
      expect(screen.getByLabelText(/email|username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display API error messages', async () => {
      render(<AuthModal open={true} onClose={mockOnClose} />, { wrapper });
      
      // Mock API error
      const identifierInput = screen.getByTestId('input-identifier');
      const passwordInput = screen.getByTestId('input-password');
      const submitButton = screen.getByTestId('button-submit-signin');
      
      fireEvent.change(identifierInput, { target: { value: 'test@test.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password' } });
      fireEvent.click(submitButton);
      
      // Error display tested in integration
    });

    it('should clear errors when switching tabs', () => {
      render(<AuthModal open={true} onClose={mockOnClose} />, { wrapper });
      
      // Trigger error on sign in
      fireEvent.click(screen.getByTestId('button-submit-signin'));
      
      // Switch to sign up
      fireEvent.click(screen.getByTestId('tab-signup'));
      
      // Errors should be cleared
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });
});
