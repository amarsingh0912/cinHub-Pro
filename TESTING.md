# Testing Documentation

This document provides comprehensive information about the testing setup and best practices for the CineHub project.

## Table of Contents

- [Overview](#overview)
- [Test Stack](#test-stack)
- [Project Structure](#project-structure)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Coverage Requirements](#coverage-requirements)
- [CI/CD Pipeline](#cicd-pipeline)
- [Best Practices](#best-practices)

## Overview

The CineHub project implements a comprehensive testing strategy that includes:
- **Unit Tests**: Testing individual components, hooks, and utility functions
- **Integration Tests**: Testing interactions between different parts of the application
- **End-to-End (E2E) Tests**: Testing complete user flows using Cypress
- **Accessibility Tests**: Ensuring the application is accessible to all users

## Test Stack

### Core Testing Libraries

- **Vitest**: Fast unit test framework with native ESM support
- **React Testing Library**: Component testing with focus on user behavior
- **Cypress**: E2E testing framework for complete user flows
- **MSW (Mock Service Worker)**: API mocking for consistent test data
- **@testing-library/jest-dom**: Custom matchers for DOM assertions
- **cypress-axe**: Accessibility testing with axe-core

### Development Tools

- **@faker-js/faker**: Generate realistic test data
- **@vitest/coverage-v8**: Code coverage reporting
- **@vitest/ui**: Interactive test UI

## Project Structure

```
├── client/src/__tests__/          # Test utilities and setup
│   ├── fixtures/                  # Test data fixtures
│   │   ├── factories.ts          # Data factories for generating test data
│   │   └── movies.ts             # Movie and TV show fixtures
│   ├── mocks/                    # MSW handlers
│   │   ├── browser.ts            # Browser MSW setup
│   │   ├── handlers.ts           # API mock handlers
│   │   └── server.ts             # Node MSW setup
│   ├── utils/                    # Test utilities
│   │   └── test-utils.tsx        # Custom render functions
│   └── setup.ts                  # Global test setup
├── tests/                        # Test files
│   ├── components/               # Component tests
│   ├── hooks/                    # Hook tests
│   ├── pages/                    # Page tests
│   ├── unit/                     # Unit tests
│   ├── integration/              # Integration tests
│   └── e2e/                      # E2E tests
├── cypress/                      # Cypress configuration
│   ├── e2e/                      # E2E test specs
│   ├── support/                  # Cypress support files
│   │   ├── commands.ts           # Custom commands
│   │   └── e2e.ts               # E2E setup
│   └── fixtures/                 # Cypress fixtures
└── vitest.config.ts              # Vitest configuration
```

## Running Tests

### All Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui
```

### Specific Test Suites

```bash
# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run only component tests
npm run test:components

# Run only E2E tests
npm run test:e2e
```

### Coverage

```bash
# Run tests with coverage
npm run test:coverage

# Run tests for CI with coverage
npm run test:ci
```

### Cypress E2E Tests

```bash
# Open Cypress Test Runner (interactive)
npm run cypress

# Run Cypress tests headlessly
npm run cypress:headless

# Run E2E tests with server
npm run e2e
```

### Quick Tests

```bash
# Run only changed tests
npm run test:quick

# Run tests in debug mode
npm run test:debug
```

## Writing Tests

### Component Tests

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/__tests__/utils/test-utils';
import { MovieCard } from '@/components/movie/movie-card';
import { createMovie } from '@/__tests__/fixtures/factories';

describe('MovieCard', () => {
  it('should render movie title', () => {
    const movie = createMovie({ title: 'Test Movie' });
    render(<MovieCard movie={movie} />);
    
    expect(screen.getByText('Test Movie')).toBeInTheDocument();
  });

  it('should be keyboard accessible', () => {
    const movie = createMovie();
    render(<MovieCard movie={movie} />);
    
    const card = screen.getByTestId(`card-movie-${movie.id}`);
    card.focus();
    expect(document.activeElement).toBe(card);
  });
});
```

### Hook Tests

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';

describe('useAuth', () => {
  it('should return user when authenticated', async () => {
    const { result } = renderHook(() => useAuth());
    
    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });
  });
});
```

### E2E Tests (Cypress)

```typescript
describe('Movie Details Flow', () => {
  it('should display movie details and allow adding to favorites', () => {
    cy.visit('/movie/550');
    cy.waitForPageLoad();
    
    cy.get('[data-testid="text-movie-title"]').should('be.visible');
    cy.get('[data-testid="button-favorite"]').click();
    cy.get('[data-testid="toast-success"]').should('be.visible');
  });
});
```

### Using Test Utilities

```typescript
// Use custom render with all providers
import { render, waitFor } from '@/__tests__/utils/test-utils';

// Use test data factories
import { createMovie, createMovies } from '@/__tests__/fixtures/factories';

// Use mock fixtures
import { mockMovie, mockUser } from '@/__tests__/fixtures/movies';
```

### Accessibility Testing

```typescript
import { checkAccessibility } from '@/__tests__/utils/test-utils';

it('should be accessible', async () => {
  const { container } = render(<MyComponent />);
  await checkAccessibility(container);
});
```

## Coverage Requirements

The project enforces a minimum code coverage of **90%** for all metrics:

- **Statements**: 90%
- **Branches**: 90%
- **Functions**: 90%
- **Lines**: 90%

### Coverage Reports

Coverage reports are generated in multiple formats:
- **Terminal**: Text summary in console
- **HTML**: Interactive report at `coverage/index.html`
- **JSON**: Machine-readable at `coverage/coverage-final.json`
- **LCOV**: For CI tools at `coverage/lcov.info`

### Viewing Coverage

```bash
# Generate and open HTML coverage report
npm run test:coverage
open coverage/index.html
```

## CI/CD Pipeline

### GitHub Actions Workflow

The project uses GitHub Actions for continuous integration with multiple parallel jobs:

1. **Lint and Type Check**: TypeScript type checking
2. **Unit and Integration Tests**: Runs all unit/integration tests with coverage
3. **E2E Tests**: Runs Cypress tests in headless mode
4. **Accessibility Tests**: Runs accessibility-focused tests
5. **Build**: Builds the application if all tests pass

### Workflow Triggers

- **Push**: Runs on `main` and `develop` branches
- **Pull Request**: Runs on PRs targeting `main` and `develop`

### Coverage Enforcement

The CI pipeline will **fail** if coverage falls below 90% for any metric.

## Best Practices

### General Guidelines

1. **Write tests first** (TDD) or immediately after implementing features
2. **Test behavior, not implementation** - Focus on what users see and do
3. **Use descriptive test names** - Test names should explain what's being tested
4. **Keep tests focused** - One assertion per test when possible
5. **Avoid test interdependence** - Each test should run independently

### Component Testing

1. **Test user interactions** - Click, type, hover, etc.
2. **Test accessibility** - Keyboard navigation, ARIA attributes, screen readers
3. **Test edge cases** - Empty states, error states, loading states
4. **Use data-testid** - Add data-testid to all interactive and meaningful elements
5. **Test responsive behavior** - Test different screen sizes when relevant

### Mock Data

1. **Use factories** for generating test data with realistic values
2. **Use fixtures** for consistent, predefined test data
3. **Use MSW** for mocking API calls instead of mocking fetch directly

### Async Testing

1. **Use waitFor** for async operations
2. **Set appropriate timeouts** for slow operations
3. **Clean up** after tests to prevent memory leaks

### E2E Testing

1. **Test complete user flows** - Login → Browse → Add to favorites → Logout
2. **Use custom commands** for repeated actions (login, search, etc.)
3. **Test critical paths** - Focus on user journeys that must work
4. **Keep E2E tests stable** - Use reliable selectors (data-testid)

### Accessibility

1. **Test keyboard navigation** on all interactive components
2. **Check ARIA attributes** for semantic meaning
3. **Verify color contrast** meets WCAG standards
4. **Test with screen readers** when possible

### Performance

1. **Use parallel test execution** when tests are independent
2. **Mock expensive operations** (API calls, heavy computations)
3. **Clean up resources** (timers, event listeners, etc.)
4. **Optimize test data** - Use minimal data needed for tests

## Troubleshooting

### Tests Failing Locally

1. Clear test cache: `npm run test -- --clearCache`
2. Update snapshots: `npm run test -- -u`
3. Check for port conflicts (default: 5000)
4. Ensure dependencies are installed: `npm ci`

### Coverage Issues

1. Check which files are missing coverage: Review HTML report
2. Add tests for uncovered branches and functions
3. Exclude generated or config files from coverage

### Updating Snapshots

If component snapshots need to be updated:

```bash
# Update all snapshots
npm run test -- -u

# Update snapshots for a specific file
npm run test path/to/test.test.tsx -- -u

# Review snapshot changes before committing
git diff -- '*.snap'
```

### Interpreting Coverage Reports

When viewing the HTML coverage report (`coverage/index.html`):

- **Green**: Well-tested code (>90% coverage)
- **Yellow**: Partially tested code (50-90% coverage)
- **Red**: Untested code (<50% coverage)

Click on any file to see:
- Line-by-line coverage
- Uncovered branches (if statements, ternaries)
- Uncovered functions

**Common issues:**
- **Uncovered branches**: Add tests for both `true` and `false` cases
- **Uncovered functions**: Ensure functions are called in tests
- **Uncovered lines**: Add tests that execute those lines

### Cypress Issues

1. Clear Cypress cache: `npx cypress cache clear`
2. Reinstall Cypress: `npx cypress install`
3. Check baseUrl in `cypress.config.ts`
4. Ensure app is running on port 5000

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Cypress Documentation](https://docs.cypress.io/)
- [MSW Documentation](https://mswjs.io/)
- [Testing Library Best Practices](https://testing-library.com/docs/guiding-principles/)

## Contributing

When adding new features:

1. Write tests alongside your code
2. Ensure all tests pass: `npm test`
3. Verify coverage requirements: `npm run test:coverage`
4. Run E2E tests: `npm run e2e`
5. Check accessibility: Add accessibility tests for new components

## Questions?

If you have questions about testing or need help writing tests, please:
1. Review this documentation
2. Check existing tests for examples
3. Reach out to the team
