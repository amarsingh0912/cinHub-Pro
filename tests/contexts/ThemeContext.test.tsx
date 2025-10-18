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
    document.documentElement.className = '';
  });

  it('should provide theme state', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: createWrapper() });

    expect(result.current.theme).toBeDefined();
    expect(['light', 'dark']).toContain(result.current.theme);
  });

  it('should provide toggleTheme function', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: createWrapper() });

    expect(result.current.toggleTheme).toBeDefined();
    expect(typeof result.current.toggleTheme).toBe('function');
  });

  it('should default to dark theme', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: createWrapper() });

    expect(result.current.theme).toBe('dark');
  });

  it('should toggle theme from dark to light', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: createWrapper() });

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBe('light');
  });

  it('should toggle theme from light to dark', () => {
    localStorage.setItem('theme', 'light');
    
    const { result } = renderHook(() => useTheme(), { wrapper: createWrapper() });

    expect(result.current.theme).toBe('light');

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBe('dark');
  });

  it('should persist theme to localStorage', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: createWrapper() });

    act(() => {
      result.current.toggleTheme();
    });

    const storedTheme = localStorage.getItem('theme');
    expect(storedTheme).toBe('light');
  });

  it('should load theme from localStorage on mount', () => {
    localStorage.setItem('theme', 'light');

    const { result } = renderHook(() => useTheme(), { wrapper: createWrapper() });

    expect(result.current.theme).toBe('light');
  });

  it('should apply theme class to document element', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: createWrapper() });

    // Dark theme should be applied by default
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    act(() => {
      result.current.toggleTheme();
    });

    // Light theme should be applied
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('should return default values when used outside provider', () => {
    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe('dark');
    expect(result.current.toggleTheme).toBeDefined();
    expect(typeof result.current.toggleTheme).toBe('function');
  });
});
