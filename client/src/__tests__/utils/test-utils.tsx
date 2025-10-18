/**
 * Custom render functions and test utilities
 * These provide consistent test setup across the test suite
 */

import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { FilterProvider } from '@/components/filter-kit';

// Create a custom render function that includes all providers
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: console.log,
      warn: console.warn,
      error: () => {}, // Suppress error logs in tests
    },
  });
}

interface AllTheProvidersProps {
  children: React.ReactNode;
}

function AllTheProviders({ children }: AllTheProvidersProps) {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <FilterProvider>
          {children}
        </FilterProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { customRender as render };

// Utility to create a mock router context for wouter
export function createMockRouter(initialRoute = '/') {
  const routes: string[] = [initialRoute];
  let currentRoute = initialRoute;

  return {
    location: currentRoute,
    navigate: (to: string, replace?: boolean) => {
      currentRoute = to;
      if (!replace) {
        routes.push(to);
      }
    },
    routes,
    getCurrentRoute: () => currentRoute,
  };
}

// Wait for async operations to complete
export async function waitForLoadingToFinish() {
  const { waitFor } = await import('@testing-library/react');
  await waitFor(() => {
    const loadingElements = document.querySelectorAll('[data-testid*="loading"]');
    expect(loadingElements.length).toBe(0);
  }, { timeout: 3000 });
}

// Helper to simulate user interactions
export async function typeIntoInput(element: HTMLElement, text: string) {
  const { default: userEvent } = await import('@testing-library/user-event');
  const user = userEvent.setup();
  await user.clear(element);
  await user.type(element, text);
}

// Helper to wait for element to appear
export async function waitForElement(testId: string, timeout = 3000) {
  const { waitFor } = await import('@testing-library/react');
  return waitFor(
    () => {
      const element = document.querySelector(`[data-testid="${testId}"]`);
      if (!element) throw new Error(`Element with testId "${testId}" not found`);
      return element;
    },
    { timeout }
  );
}

// Accessibility testing helper
export async function checkAccessibility(container: HTMLElement) {
  // This would use axe-core when available
  // For now, it's a placeholder that can be expanded
  const links = container.querySelectorAll('a');
  links.forEach(link => {
    // Check if interactive elements have accessible names
    const hasText = link.textContent?.trim();
    const hasAriaLabel = link.getAttribute('aria-label');
    const hasTitle = link.getAttribute('title');
    
    if (!hasText && !hasAriaLabel && !hasTitle) {
      console.warn('Link without accessible name found:', link);
    }
  });

  const buttons = container.querySelectorAll('button');
  buttons.forEach(button => {
    const hasText = button.textContent?.trim();
    const hasAriaLabel = button.getAttribute('aria-label');
    
    if (!hasText && !hasAriaLabel) {
      console.warn('Button without accessible name found:', button);
    }
  });

  const images = container.querySelectorAll('img');
  images.forEach(img => {
    const hasAlt = img.getAttribute('alt');
    if (!hasAlt) {
      console.warn('Image without alt text found:', img);
    }
  });
}
