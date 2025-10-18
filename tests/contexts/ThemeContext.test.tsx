import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';

function createWrapper() {
  return ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider>{children}</ThemeProvider>
  );
}

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should provide default theme', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: createWrapper() });

    expect(result.current.theme).toBeDefined();
    expect(['light', 'dark', 'system']).toContain(result.current.theme);
  });

  it('should provide setTheme function', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: createWrapper() });

    expect(result.current.setTheme).toBeDefined();
    expect(typeof result.current.setTheme).toBe('function');
  });

  it('should update theme when setTheme is called', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: createWrapper() });

    act(() => {
      result.current.setTheme('dark');
    });

    expect(result.current.theme).toBe('dark');
  });

  it('should persist theme to localStorage', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: createWrapper() });

    act(() => {
      result.current.setTheme('dark');
    });

    const storedTheme = localStorage.getItem('theme');
    expect(storedTheme).toBe('dark');
  });

  it('should load theme from localStorage on mount', () => {
    localStorage.setItem('theme', 'dark');

    const { result } = renderHook(() => useTheme(), { wrapper: createWrapper() });

    expect(result.current.theme).toBe('dark');
  });

  it('should toggle between light and dark themes', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: createWrapper() });

    act(() => {
      result.current.setTheme('light');
    });
    expect(result.current.theme).toBe('light');

    act(() => {
      result.current.setTheme('dark');
    });
    expect(result.current.theme).toBe('dark');

    act(() => {
      result.current.setTheme('light');
    });
    expect(result.current.theme).toBe('light');
  });

  it('should support system theme', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: createWrapper() });

    act(() => {
      result.current.setTheme('system');
    });

    expect(result.current.theme).toBe('system');
  });

  it('should throw error when used outside provider', () => {
    expect(() => {
      renderHook(() => useTheme());
    }).toThrow();
  });
});
