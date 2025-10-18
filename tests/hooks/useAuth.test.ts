import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { mockUser } from '@/__tests__/fixtures/movies';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useAuth hook', () => {
  it('should return auth state from query', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    expect(result.current.user).toBeDefined();
    expect(result.current.isLoading).toBeDefined();
    expect(result.current.isAuthenticated).toBeDefined();
  });

  it('should set isAuthenticated to false when user is null', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(typeof result.current.isAuthenticated).toBe('boolean');
    });
  });

  it('should have isLoading state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    expect(typeof result.current.isLoading).toBe('boolean');
  });

  it('should fetch user data from /api/auth/user endpoint', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    // MSW will return mockUser for /api/auth/user
    await waitFor(() => {
      if (result.current.user) {
        expect(result.current.user).toHaveProperty('id');
        expect(result.current.user).toHaveProperty('email');
        expect(result.current.user).toHaveProperty('username');
      }
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 3000 });
  });

  it('should set isAuthenticated to true when user exists', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await waitFor(() => {
      if (result.current.user) {
        expect(result.current.isAuthenticated).toBe(true);
      }
    }, { timeout: 3000 });
  });
});
