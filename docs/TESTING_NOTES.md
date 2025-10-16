# Testing Notes and Recommendations

## Current Test Coverage

### ✅ Completed Test Suites

**Integration Tests:**
- `tests/integration/auth-api.test.ts` - Authentication endpoints (signup, signin, logout, OTP)
- `tests/integration/movies-api.test.ts` - Movie discovery endpoints
- `tests/integration/reviews-api.test.ts` - Review system endpoints
- `tests/integration/tmdb-api.test.ts` - TMDB proxy endpoints
- `tests/integration/user-collections.test.ts` - Favorites and watchlists
- `tests/integration/watchlists-api.test.ts` - Watchlist management
- **NEW:** `tests/integration/admin-api.test.ts` - Admin panel endpoints
- **NEW:** `tests/integration/preferences-api.test.ts` - User preferences
- **NEW:** `tests/integration/activity-history-api.test.ts` - Activity/viewing/search history
- **NEW:** `tests/integration/websocket-integration.test.ts` - WebSocket connections
- **NEW:** `tests/integration/cloudinary-service.test.ts` - Image upload service

**E2E Tests:**
- **NEW:** `tests/e2e/authentication-flow.test.ts` - Complete authentication workflows
- **NEW:** `tests/e2e/watchlist-management.test.ts` - Full watchlist lifecycle
- **NEW:** `tests/e2e/review-posting.test.ts` - Review posting and management

**Unit Tests:**
- `tests/unit/auth.test.ts` - Authentication utilities
- `tests/unit/image-cache.test.ts` - Image caching service
- `tests/unit/otp-service.test.ts` - OTP delivery (email/SMS)
- `tests/unit/tmdb-cache.test.ts` - TMDB caching service
- `tests/unit/websocket.test.ts` - WebSocket service

**Component Tests:**
- `tests/components/filter-components.test.tsx` - Filter UI components
- `tests/components/movie-card.test.tsx` - Movie card component

---

## Test Environment Setup

### Prerequisites for Running Tests

**Required Environment Variables:**
```bash
# Minimum required for tests to run
DATABASE_URL="postgresql://test:test@localhost:5432/test_db"
SESSION_SECRET="test-secret-key"
TMDB_API_KEY="your-tmdb-api-key"  # Required for API tests
TMDB_ACCESS_TOKEN="your-tmdb-token"
```

**Optional (for full test coverage):**
```bash
CLOUDINARY_CLOUD_NAME="test-cloud"
CLOUDINARY_API_KEY="test-key"
CLOUDINARY_API_SECRET="test-secret"
SENDGRID_API_KEY="test-sendgrid-key"  # Already mocked in tests
TWILIO_ACCOUNT_SID="test-sid"  # Already mocked in tests
TWILIO_AUTH_TOKEN="test-token"
```

### Running Tests

```bash
# All tests
npm test

# Specific suites
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests only
npm run test:components     # Component tests only
npm run test:e2e            # E2E tests only

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

---

## Known Limitations and Recommendations

### 1. External Service Dependencies

**Current State:**
- Integration and E2E tests call actual API endpoints (`/api/movies/popular`, etc.)
- These endpoints proxy to real TMDB API
- Tests require valid TMDB credentials to pass
- Cloudinary tests require valid Cloudinary credentials

**Recommendation:**
```typescript
// Option 1: Mock at HTTP level
vi.mock('../../server/services/tmdbService', () => ({
  fetchPopularMovies: vi.fn().mockResolvedValue({
    results: [/* mock data */]
  })
}));

// Option 2: Use test fixtures
const mockMovieData = JSON.parse(
  fs.readFileSync('tests/fixtures/popular-movies.json', 'utf-8')
);
```

**Action Items:**
- [ ] Create test fixtures in `tests/fixtures/` directory
- [ ] Mock TMDB service calls at the service layer
- [ ] Mock Cloudinary uploads to avoid external dependencies
- [ ] Use `nock` or `msw` for HTTP mocking if needed

### 2. Database State Management

**Current State:**
- Tests create real database records
- Some cleanup is done in `afterAll`/`afterEach` hooks
- Potential for test pollution between runs

**Recommendation:**
```typescript
// Use transactions for test isolation
beforeEach(async () => {
  await db.transaction(async (tx) => {
    // Test runs within transaction
    // Auto-rollback after test
  });
});

// Or use separate test database
DATABASE_URL="postgresql://test:test@localhost:5432/cinehub_test"
```

**Action Items:**
- [ ] Implement transaction-based test isolation
- [ ] Add database seeding scripts for consistent test data
- [ ] Consider using `@testcontainers/postgresql` for isolated DB per test suite

### 3. Component Testing Coverage

**Current State:**
- Only 2 real component tests (`movie-card`, `filter-components`)
- Many UI components are not tested

**Recommendation:**
Add component tests for:
- [ ] Navigation components (main nav, breadcrumbs, tabs)
- [ ] Search components (search bar, filters, results)
- [ ] Movie/TV detail pages
- [ ] User profile components
- [ ] Admin dashboard components
- [ ] Form components (login, signup, review forms)

**Testing Pattern:**
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import ActualComponent from '@/components/ActualComponent';

describe('ActualComponent', () => {
  it('should render correctly', () => {
    render(<ActualComponent {...props} />, { 
      wrapper: createTestWrapper() 
    });
    
    expect(screen.getByTestId('component-element')).toBeInTheDocument();
  });
});
```

### 4. Test Data and Fixtures

**Missing:**
- Mock TMDB API responses
- Sample movie/TV show data
- User test data
- Review test data

**Recommendation:**
Create `tests/fixtures/` with:
```
tests/fixtures/
├── movies/
│   ├── popular.json
│   ├── movie-details.json
│   └── search-results.json
├── users/
│   ├── user-profiles.json
│   └── auth-tokens.json
└── reviews/
    └── sample-reviews.json
```

### 5. WebSocket Testing

**Current State:**
- Basic WebSocket connection tests exist
- Tests create real WebSocket connections
- May be flaky depending on server state

**Recommendation:**
- [ ] Use `ws` mock or test server
- [ ] Test reconnection logic
- [ ] Test message handling with fixtures
- [ ] Test error scenarios

### 6. E2E Test Improvements

**Current State:**
- E2E tests cover happy paths
- Limited error scenario coverage

**Recommendation:**
Add tests for:
- [ ] Network failures
- [ ] Session expiration mid-workflow
- [ ] Concurrent user actions
- [ ] Rate limiting behavior
- [ ] Invalid input handling
- [ ] Browser compatibility

### 7. Performance Testing

**Missing:**
- Load testing
- Stress testing
- Response time benchmarks

**Recommendation:**
```bash
# Use k6 for load testing
npm install --save-dev k6

# Create load test script
tests/performance/load-test.js
```

Example k6 script:
```javascript
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
};

export default function () {
  const res = http.get('http://localhost:5000/api/movies/popular');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

---

## CI/CD Test Integration

The GitHub Actions workflow (`.github/workflows/test.yml`) runs:
- TypeScript type checking
- Unit tests
- Integration tests
- Component tests
- Coverage report

**Current Gaps:**
- [ ] E2E tests not run in CI (require full environment)
- [ ] Performance tests not run
- [ ] Visual regression tests not implemented

**Recommendations:**
1. Add E2E tests to CI with mocked services
2. Set up separate staging environment for full E2E
3. Add Playwright or Cypress for browser automation
4. Implement visual regression with Percy or Chromatic

---

## Test Metrics and Goals

### Current Coverage
Run `npm run test:coverage` to see current metrics.

### Coverage Goals
- **Overall:** 80%+ (target for comprehensive coverage)
- **Critical paths:** 95%+ (auth, data operations, payment flows)
- **UI components:** 70%+ (acceptable for UI-heavy apps)
- **Utilities:** 90%+ (pure functions should be well tested)

### Quality Metrics
- **Test reliability:** 99%+ (tests should not be flaky)
- **Test speed:** <5 minutes for full suite
- **Coverage trend:** Increasing over time
- **Bug detection:** Tests should catch regressions

---

## Recommended Test Additions

### High Priority
1. **Complete Component Coverage**
   - Navigation components
   - Search functionality
   - Movie/TV detail pages
   - User forms

2. **Error Scenario Testing**
   - Network failures
   - Invalid data
   - Edge cases
   - Race conditions

3. **Security Testing**
   - CSRF protection
   - XSS prevention
   - SQL injection
   - Authentication bypass attempts

### Medium Priority
1. **Performance Tests**
   - Load testing
   - Concurrent user simulation
   - Cache effectiveness

2. **Accessibility Tests**
   - WCAG compliance
   - Keyboard navigation
   - Screen reader compatibility

3. **Mobile Testing**
   - Responsive design
   - Touch interactions
   - Mobile-specific flows

### Low Priority
1. **Visual Regression Tests**
   - Screenshot comparison
   - Layout consistency
   - Cross-browser rendering

2. **Localization Tests**
   - Multi-language support
   - Date/time formatting
   - Currency handling

---

## Best Practices

### Writing Tests
1. **Follow AAA pattern** (Arrange, Act, Assert)
2. **One assertion per test** (when possible)
3. **Use descriptive test names**
4. **Avoid test interdependence**
5. **Clean up after tests**

### Test Organization
1. **Group related tests** with `describe` blocks
2. **Use `beforeEach`/`afterEach`** for setup/cleanup
3. **Share test utilities** in `tests/__helpers__/`
4. **Keep tests close** to code they test

### Mocking Strategy
1. **Mock external services** (TMDB, Cloudinary, SendGrid, Twilio)
2. **Mock network calls** with `nock` or `msw`
3. **Use test doubles** for complex dependencies
4. **Avoid over-mocking** - test real code paths when possible

---

## Running Tests in Different Environments

### Local Development
```bash
npm test
```

### CI/CD (GitHub Actions)
```bash
npm ci
npm run test:coverage
```

### Pre-commit Hook
```bash
# Add to .husky/pre-commit
npm run test:unit
```

### Pre-push Hook
```bash
# Add to .husky/pre-push
npm test
```

---

## Troubleshooting Test Issues

### Tests Failing Locally

**Database Connection:**
```bash
# Ensure PostgreSQL is running
sudo systemctl status postgresql

# Check DATABASE_URL
echo $DATABASE_URL
```

**Missing Dependencies:**
```bash
npm install
npm run db:push
```

**Stale Test Data:**
```bash
# Reset test database
dropdb cinehub_test
createdb cinehub_test
npm run db:push
```

### Tests Passing Locally, Failing in CI

**Environment Differences:**
- Check environment variables are set in CI
- Verify database is available in CI
- Check for timezone issues
- Look for file path differences

**Timing Issues:**
- Increase timeouts for slow operations
- Add `waitFor` for async operations
- Use proper async/await

### Flaky Tests

**Common Causes:**
- Race conditions
- External service dependencies
- Insufficient waits for async operations
- Test order dependencies

**Solutions:**
- Add deterministic waits
- Mock external services
- Ensure test isolation
- Use transaction-based cleanup

---

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Docs](https://testing-library.com/)
- [Test Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [CI/CD Testing Guide](https://github.com/actions/starter-workflows)

---

**Note:** This document should be updated as the test suite evolves. Consider it a living document that grows with the project.

**Last Updated:** October 16, 2025
