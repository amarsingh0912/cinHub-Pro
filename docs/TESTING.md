# Testing Guide

Comprehensive guide for writing and running tests in CineHub Pro.

## Table of Contents

- [Overview](#overview)
- [Testing Stack](#testing-stack)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Test Coverage](#test-coverage)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

CineHub Pro uses a comprehensive testing strategy with multiple test types:

- **Unit Tests**: Test individual functions and modules in isolation
- **Integration Tests**: Test API endpoints and service interactions
- **Component Tests**: Test React components with user interactions
- **E2E Tests**: Test complete user workflows and scenarios

## Testing Stack

### Core Testing Framework

- **Vitest**: Fast unit test framework (Jest alternative)
- **Testing Library**: React component testing utilities
- **Supertest**: HTTP assertion library for API testing
- **jsdom**: DOM implementation for Node.js

### Configuration

Test configuration is in `vitest.config.ts`:

```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./client/src/__tests__/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@shared': path.resolve(__dirname, './shared'),
    },
  },
});
```

## Running Tests

### All Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui
```

### Specific Test Suites

```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Component tests only
npm run test:components

# E2E tests only
npm run test:e2e
```

### Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View coverage in browser
open coverage/index.html
```

### Filtering Tests

```bash
# Run tests matching pattern
npm test -- auth

# Run specific test file
npm test -- tests/unit/auth.test.ts

# Run tests in specific folder
npm test -- tests/integration/
```

## Writing Tests

### Unit Tests

Unit tests focus on testing individual functions or modules in isolation.

**Location**: `tests/unit/`

**Example - Testing utility functions**:

```typescript
// tests/unit/auth.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { hashPassword, verifyPassword } from '../../server/auth';

describe('Password Hashing', () => {
  it('should hash a password', async () => {
    const password = 'testPassword123';
    const hashed = await hashPassword(password);
    
    expect(hashed).toBeTruthy();
    expect(hashed).not.toBe(password);
  });

  it('should verify correct password', async () => {
    const password = 'testPassword123';
    const hashed = await hashPassword(password);
    const isValid = await verifyPassword(password, hashed);
    
    expect(isValid).toBe(true);
  });

  it('should reject incorrect password', async () => {
    const password = 'testPassword123';
    const hashed = await hashPassword(password);
    const isValid = await verifyPassword('wrongPassword', hashed);
    
    expect(isValid).toBe(false);
  });
});
```

**Example - Testing services**:

```typescript
// tests/unit/tmdb-cache.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tmdbCacheService } from '../../server/services/tmdbCacheService';

// Mock external dependencies
vi.mock('../../server/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
  },
}));

describe('TMDB Cache Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return cached data if available and fresh', async () => {
    const cachedData = {
      id: '1',
      type: 'movie',
      tmdbId: 550,
      data: { title: 'Fight Club' },
      expiresAt: new Date(Date.now() + 3600000),
    };

    const result = await tmdbCacheService.get('movie', 550);
    
    expect(result).toEqual(cachedData.data);
  });

  it('should return null if cache is expired', async () => {
    const expiredData = {
      id: '1',
      type: 'movie',
      tmdbId: 550,
      data: { title: 'Fight Club' },
      expiresAt: new Date(Date.now() - 3600000), // 1 hour ago
    };

    const result = await tmdbCacheService.get('movie', 550);
    
    expect(result).toBeNull();
  });
});
```

### Integration Tests

Integration tests verify API endpoints and database interactions.

**Location**: `tests/integration/`

**Example - Testing API endpoints**:

```typescript
// tests/integration/movies-api.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import { registerRoutes } from '../../server/routes';

describe('Movies API', () => {
  let app: Express;
  let server: any;
  let authToken: string;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    server = await registerRoutes(app);

    // Get auth token for protected endpoints
    const response = await request(app)
      .post('/api/auth/signin')
      .send({
        identifier: 'test@example.com',
        password: 'testPassword123',
      });
    authToken = response.body.accessToken;
  });

  afterAll(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  describe('GET /api/movies/trending', () => {
    it('should return trending movies', async () => {
      const response = await request(app)
        .get('/api/movies/trending')
        .query({ page: 1 })
        .expect(200);

      expect(response.body).toHaveProperty('results');
      expect(Array.isArray(response.body.results)).toBe(true);
      expect(response.body.results.length).toBeGreaterThan(0);
    });

    it('should support pagination', async () => {
      const page1 = await request(app)
        .get('/api/movies/trending')
        .query({ page: 1 });

      const page2 = await request(app)
        .get('/api/movies/trending')
        .query({ page: 2 });

      expect(page1.body.results[0].id).not.toBe(page2.body.results[0].id);
    });
  });

  describe('POST /api/favorites', () => {
    it('should add movie to favorites (authenticated)', async () => {
      const response = await request(app)
        .post('/api/favorites')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          mediaType: 'movie',
          mediaId: 550,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.mediaId).toBe(550);
    });

    it('should reject unauthenticated requests', async () => {
      await request(app)
        .post('/api/favorites')
        .send({
          mediaType: 'movie',
          mediaId: 550,
        })
        .expect(401);
    });
  });
});
```

### Component Tests

Component tests verify React component behavior and user interactions.

**Location**: `tests/components/`

**Example - Testing components**:

```typescript
// tests/components/movie-card.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MovieCard from '../../client/src/components/movie/movie-card';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('MovieCard Component', () => {
  const mockMovie = {
    id: 550,
    title: 'Fight Club',
    overview: 'A ticking-time-bomb insomniac...',
    poster_path: '/path/to/poster.jpg',
    vote_average: 8.4,
    release_date: '1999-10-15',
  };

  it('renders movie title', () => {
    render(<MovieCard movie={mockMovie} />, { wrapper: createWrapper() });
    expect(screen.getByText('Fight Club')).toBeInTheDocument();
  });

  it('displays movie rating', () => {
    render(<MovieCard movie={mockMovie} />, { wrapper: createWrapper() });
    expect(screen.getByText(/8.4/)).toBeInTheDocument();
  });

  it('handles favorite button click', () => {
    const onFavoriteToggle = vi.fn();
    render(
      <MovieCard movie={mockMovie} onFavoriteToggle={onFavoriteToggle} />,
      { wrapper: createWrapper() }
    );

    const favoriteButton = screen.getByTestId('button-favorite-550');
    fireEvent.click(favoriteButton);

    expect(onFavoriteToggle).toHaveBeenCalledWith(550);
  });

  it('displays fallback image when poster is missing', () => {
    const movieWithoutPoster = { ...mockMovie, poster_path: null };
    render(<MovieCard movie={movieWithoutPoster} />, { wrapper: createWrapper() });
    
    const image = screen.getByAltText('Fight Club');
    expect(image).toHaveAttribute('src', expect.stringContaining('placeholder'));
  });
});
```

**Example - Testing forms**:

```typescript
// tests/components/login-form.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from '../../client/src/components/auth/login-form';

describe('LoginForm Component', () => {
  it('renders all form fields', () => {
    render(<LoginForm />);
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<LoginForm />);
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const onSubmit = vi.fn();
    render(<LoginForm onSubmit={onSubmit} />);
    
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });
});
```

### E2E Tests

End-to-end tests verify complete user workflows.

**Location**: `tests/e2e/`

**Example - Testing user flows**:

```typescript
// tests/e2e/authentication-flow.test.tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../client/src/App';

describe('Authentication Flow', () => {
  beforeEach(() => {
    // Clear local storage
    localStorage.clear();
  });

  it('allows user to sign up, login, and access protected content', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Navigate to signup
    await user.click(screen.getByText(/sign up/i));

    // Fill signup form
    await user.type(screen.getByLabelText(/email/i), 'newuser@example.com');
    await user.type(screen.getByLabelText(/password/i), 'SecurePass123!');
    await user.type(screen.getByLabelText(/confirm password/i), 'SecurePass123!');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    // Should redirect to email verification
    await waitFor(() => {
      expect(screen.getByText(/verify your email/i)).toBeInTheDocument();
    });

    // Simulate verification (in real test, would check email)
    // ... verification steps

    // Login
    await user.click(screen.getByText(/sign in/i));
    await user.type(screen.getByLabelText(/email/i), 'newuser@example.com');
    await user.type(screen.getByLabelText(/password/i), 'SecurePass123!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Should access dashboard
    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    });
  });
});
```

## Test Coverage

### Coverage Goals

- **Overall**: Minimum 80% coverage
- **Critical paths**: 95%+ coverage (auth, payments, data operations)
- **UI components**: 70%+ coverage

### Viewing Coverage

```bash
# Generate coverage report
npm run test:coverage

# Coverage files generated in:
# - coverage/index.html (visual report)
# - coverage/lcov.info (for CI tools)
```

### Coverage Reports

The coverage report shows:
- **Statements**: % of code statements executed
- **Branches**: % of conditional branches tested
- **Functions**: % of functions called
- **Lines**: % of code lines executed

### Improving Coverage

1. Identify uncovered code in coverage report
2. Add tests for missing scenarios
3. Focus on edge cases and error paths
4. Test both success and failure cases

## Best Practices

### General Guidelines

1. **Follow AAA Pattern**:
   ```typescript
   it('should do something', () => {
     // Arrange - Set up test data
     const data = { id: 1, name: 'Test' };
     
     // Act - Execute the code
     const result = processData(data);
     
     // Assert - Verify the result
     expect(result).toBe(expected);
   });
   ```

2. **One assertion concept per test**:
   ```typescript
   // Good
   it('should add user to database', async () => {
     const user = await createUser({ name: 'John' });
     expect(user.id).toBeDefined();
   });

   it('should hash user password', async () => {
     const user = await createUser({ password: 'secret' });
     expect(user.password).not.toBe('secret');
   });

   // Bad - multiple unrelated assertions
   it('should create user', async () => {
     const user = await createUser({ name: 'John', password: 'secret' });
     expect(user.id).toBeDefined();
     expect(user.password).not.toBe('secret');
     expect(user.email).toBeDefined();
   });
   ```

3. **Use descriptive test names**:
   ```typescript
   // Good
   it('should return 404 when movie does not exist', () => {});
   it('should add movie to watchlist for authenticated user', () => {});

   // Bad
   it('test movie', () => {});
   it('should work', () => {});
   ```

4. **Mock external dependencies**:
   ```typescript
   // Mock TMDB API
   vi.mock('../../server/services/tmdbService', () => ({
     getTrendingMovies: vi.fn().mockResolvedValue({
       results: [{ id: 1, title: 'Test Movie' }],
     }),
   }));
   ```

5. **Clean up after tests**:
   ```typescript
   afterEach(() => {
     vi.clearAllMocks();
     localStorage.clear();
   });
   ```

### Testing React Components

1. **Use Testing Library queries** (in order of preference):
   - `getByRole` - Most accessible
   - `getByLabelText` - For form fields
   - `getByText` - For text content
   - `getByTestId` - Last resort

2. **Test user behavior, not implementation**:
   ```typescript
   // Good - test what user sees/does
   it('should show error message when login fails', async () => {
     render(<LoginForm />);
     await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
     expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
   });

   // Bad - test implementation details
   it('should call setError when login fails', async () => {
     const setError = vi.fn();
     render(<LoginForm setError={setError} />);
     // ...
     expect(setError).toHaveBeenCalled();
   });
   ```

3. **Use userEvent over fireEvent**:
   ```typescript
   // Good - simulates real user interaction
   const user = userEvent.setup();
   await user.click(button);
   await user.type(input, 'text');

   // Bad - synthetic events
   fireEvent.click(button);
   fireEvent.change(input, { target: { value: 'text' } });
   ```

### Testing Async Code

1. **Use waitFor for async assertions**:
   ```typescript
   it('should load and display movies', async () => {
     render(<MovieList />);
     
     await waitFor(() => {
       expect(screen.getByText('Fight Club')).toBeInTheDocument();
     });
   });
   ```

2. **Test loading states**:
   ```typescript
   it('should show loading spinner while fetching', () => {
     render(<MovieList />);
     expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
   });
   ```

3. **Test error states**:
   ```typescript
   it('should display error message when fetch fails', async () => {
     vi.mocked(fetchMovies).mockRejectedValue(new Error('Network error'));
     
     render(<MovieList />);
     
     await waitFor(() => {
       expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
     });
   });
   ```

## Troubleshooting

### Common Issues

#### Tests Timing Out

**Problem**: Tests take too long or timeout

**Solutions**:
```typescript
// Increase timeout for specific test
it('should handle long operation', async () => {
  // ...
}, 10000); // 10 seconds

// Or configure globally in vitest.config.ts
test: {
  testTimeout: 10000
}
```

#### Mock Not Working

**Problem**: Mocked function still calls real implementation

**Solutions**:
```typescript
// Ensure mock is before imports
vi.mock('./module', () => ({
  myFunction: vi.fn(),
}));

// Or use vi.hoisted for setup
const mocks = vi.hoisted(() => ({
  myFunction: vi.fn(),
}));

vi.mock('./module', () => mocks);
```

#### Database Connection Errors

**Problem**: Tests fail due to database connection

**Solutions**:
```typescript
// Use test database URL
beforeAll(async () => {
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
  await setupTestDatabase();
});

afterAll(async () => {
  await teardownTestDatabase();
});
```

#### React Component Not Found

**Problem**: `Cannot find module` when importing component

**Solutions**:
```typescript
// Check path alias in vitest.config.ts
resolve: {
  alias: {
    '@': path.resolve(__dirname, './client/src'),
  },
}

// Use correct import
import Component from '@/components/Component';
```

### Debugging Tests

```bash
# Run single test file in debug mode
node --inspect-brk node_modules/.bin/vitest tests/unit/auth.test.ts

# Use console.log in tests
it('should work', () => {
  console.log('Debug value:', myValue);
  expect(myValue).toBe(expected);
});

# Use screen.debug() for component tests
it('should render', () => {
  render(<Component />);
  screen.debug(); // Prints current DOM
});
```

## CI/CD Integration

Tests automatically run in GitHub Actions:

```yaml
# .github/workflows/test.yml
- name: Run tests
  run: npm test
  env:
    DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
```

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Mock Service Worker](https://mswjs.io/) - API mocking

## Questions?

If you have questions about testing:
1. Check this documentation
2. Look at existing tests for examples
3. Ask in GitHub Discussions
4. Reach out on Discord
