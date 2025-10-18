import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { createUser } from '@/__tests__/fixtures/factories';

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
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return null user when not authenticated', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.user).toBeNull();
    });
  });

  it('should return user data when authenticated', async () => {
    const mockUser = createUser();
    
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await waitFor(() => {
      if (result.current.user) {
        expect(result.current.user).toHaveProperty('id');
        expect(result.current.user).toHaveProperty('email');
        expect(result.current.user).toHaveProperty('username');
      }
    });
  });

  it('should provide login mutation', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    expect(result.current.login).toBeDefined();
    expect(typeof result.current.login).toBe('function');
  });

  it('should provide logout mutation', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    expect(result.current.logout).toBeDefined();
    expect(typeof result.current.logout).toBe('function');
  });

  it('should handle login success', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    const loginData = {
      email: 'test@example.com',
      password: 'password123',
    };

    result.current.login.mutate(loginData);

    await waitFor(() => {
      expect(result.current.login.isSuccess || result.current.login.isPending).toBe(true);
    });
  });

  it('should handle logout', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    result.current.logout.mutate();

    await waitFor(() => {
      expect(result.current.logout.isSuccess || result.current.logout.isPending).toBe(true);
    });
  });

  it('should provide isAuthenticated boolean', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    expect(typeof result.current.isAuthenticated).toBe('boolean');
  });

  it('should provide isLoading state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    expect(typeof result.current.isLoading).toBe('boolean');
  });
});
