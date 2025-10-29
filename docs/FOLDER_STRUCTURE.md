# Folder Structure Documentation

Complete guide to CineHub Pro's project organization and file structure.

## Table of Contents

- [Project Root](#project-root)
- [Frontend Structure](#frontend-structure)
- [Backend Structure](#backend-structure)
- [Shared Code](#shared-code)
- [Testing Structure](#testing-structure)
- [Documentation](#documentation)
- [Configuration Files](#configuration-files)
- [Scripts](#scripts)

## Project Root

```
cinehub-pro/
├── client/                 # Frontend React application
├── server/                 # Backend Express API
├── shared/                 # Shared TypeScript types and schemas
├── tests/                  # Test suites
├── docs/                   # Documentation
├── scripts/                # Utility scripts
├── cypress/                # E2E test specs
├── uploads/                # User uploaded files
├── attached_assets/        # Static assets
├── .github/                # GitHub workflows and config
├── node_modules/           # Dependencies (gitignored)
├── dist/                   # Production build output (gitignored)
├── coverage/               # Test coverage reports (gitignored)
├── package.json            # Project dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite build configuration
├── vitest.config.ts        # Vitest test configuration
├── tailwind.config.ts      # Tailwind CSS configuration
├── drizzle.config.ts       # Database ORM configuration
├── .env                    # Environment variables (gitignored)
├── .env.example            # Example environment variables
├── .gitignore              # Git ignore rules
├── README.md               # Project overview
├── CHANGELOG.md            # Version history
├── LICENSE                 # MIT License
└── replit.md               # Replit-specific documentation
```

## Frontend Structure

### `/client` - React Application

```
client/
├── src/
│   ├── components/         # Reusable React components
│   │   ├── ui/             # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── form.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ...         # Other UI primitives
│   │   ├── auth/           # Authentication components
│   │   │   ├── AuthModal.tsx
│   │   │   ├── LoginForm.tsx
│   │   │   ├── SignupForm.tsx
│   │   │   └── OTPVerification.tsx
│   │   ├── movie/          # Movie-specific components
│   │   │   ├── MovieCard.tsx
│   │   │   ├── MovieGrid.tsx
│   │   │   ├── MovieDetails.tsx
│   │   │   ├── TrailerModal.tsx
│   │   │   └── FilterPanel.tsx
│   │   ├── layout/         # Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Navigation.tsx
│   │   ├── profile/        # User profile components
│   │   │   ├── ProfileCard.tsx
│   │   │   ├── AvatarUpload.tsx
│   │   │   └── SettingsForm.tsx
│   │   ├── watchlist/      # Watchlist components
│   │   │   ├── WatchlistCard.tsx
│   │   │   ├── WatchlistGrid.tsx
│   │   │   └── CreateWatchlist.tsx
│   │   ├── review/         # Review components
│   │   │   ├── ReviewCard.tsx
│   │   │   ├── ReviewForm.tsx
│   │   │   └── RatingDisplay.tsx
│   │   └── common/         # Common shared components
│   │       ├── LoadingSkeleton.tsx
│   │       ├── ErrorBoundary.tsx
│   │       ├── InfiniteScroll.tsx
│   │       └── SearchModal.tsx
│   │
│   ├── pages/              # Page components (routes)
│   │   ├── HomePage.tsx
│   │   ├── MovieDetailsPage.tsx
│   │   ├── TVShowDetailsPage.tsx
│   │   ├── SearchPage.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── WatchlistsPage.tsx
│   │   ├── FavoritesPage.tsx
│   │   ├── ReviewsPage.tsx
│   │   ├── HistoryPage.tsx
│   │   ├── AdminDashboard.tsx
│   │   ├── NotFoundPage.tsx
│   │   └── ...
│   │
│   ├── hooks/              # Custom React hooks
│   │   ├── useAuth.ts              # Authentication hook
│   │   ├── useDebounce.ts          # Debounce utility hook
│   │   ├── useInfiniteScroll.ts    # Infinite scroll hook
│   │   ├── useLocalStorage.ts      # Local storage hook
│   │   ├── useMediaQuery.ts        # Responsive design hook
│   │   ├── useWebSocket.ts         # WebSocket connection hook
│   │   ├── use-toast.ts            # Toast notification hook
│   │   └── useTMDB.ts              # TMDB data fetching hooks
│   │
│   ├── lib/                # Utility libraries
│   │   ├── queryClient.ts          # TanStack Query setup
│   │   ├── utils.ts                # General utilities
│   │   ├── cn.ts                   # Tailwind class name merger
│   │   ├── auth-utils.ts           # Auth helper functions
│   │   └── validators.ts           # Form validation schemas
│   │
│   ├── types/              # TypeScript type definitions
│   │   ├── movie.ts                # Movie types
│   │   ├── user.ts                 # User types
│   │   ├── api.ts                  # API response types
│   │   └── tmdb.ts                 # TMDB API types
│   │
│   ├── contexts/           # React Context providers
│   │   ├── AuthContext.tsx         # Auth state management
│   │   ├── ThemeContext.tsx        # Dark mode theme
│   │   └── ToastContext.tsx        # Toast notifications
│   │
│   ├── styles/             # Global styles
│   │   └── index.css               # Global CSS + Tailwind
│   │
│   ├── App.tsx             # Main app component with routes
│   ├── main.tsx            # React app entry point
│   └── vite-env.d.ts       # Vite type definitions
│
├── public/                 # Static public assets
│   ├── favicon.ico
│   ├── robots.txt
│   └── ...
│
└── index.html              # HTML entry point
```

### Component Organization

**UI Components (`/components/ui/`)**
- Atomic, reusable UI primitives from shadcn/ui
- Button, Input, Card, Dialog, Form, etc.
- No business logic, purely presentational
- Styled with Tailwind CSS using design tokens

**Feature Components (`/components/{feature}/`)**
- Domain-specific components (auth, movie, profile)
- May contain business logic
- Use UI components as building blocks
- Connect to backend via TanStack Query

**Page Components (`/pages/`)**
- Route-level components
- Compose feature and UI components
- Handle page-level state and data fetching
- Registered in `App.tsx` with Wouter routing

**Custom Hooks (`/hooks/`)**
- Reusable stateful logic
- Abstract complex functionality
- No UI rendering
- Export typed hooks with clear interfaces

## Backend Structure

### `/server` - Express API

```
server/
├── services/               # Business logic services
│   ├── tmdbCache.ts                # TMDB API caching service
│   ├── imageCache.ts               # Cloudinary image optimization
│   ├── cacheQueue.ts               # Background job queue
│   ├── websocket.ts                # WebSocket real-time updates
│   ├── otpService.ts               # OTP generation/verification
│   ├── emailService.ts             # SendGrid email delivery
│   ├── smsService.ts               # Twilio SMS delivery
│   └── cloudinaryService.ts        # Cloudinary upload service
│
├── utils/                  # Utility functions
│   ├── logger.ts                   # Logging utility
│   ├── validators.ts               # Request validation
│   ├── errorHandler.ts             # Global error handler
│   └── helpers.ts                  # General helpers
│
├── middleware/             # Express middleware
│   ├── auth.ts                     # Authentication middleware
│   ├── errorHandler.ts             # Error handling middleware
│   ├── rateLimiter.ts              # Rate limiting
│   └── validator.ts                # Request validation
│
├── routes/                 # API route handlers (or routes.ts)
│   ├── auth.ts                     # Authentication routes
│   ├── movies.ts                   # Movie endpoints
│   ├── tv.ts                       # TV show endpoints
│   ├── users.ts                    # User management
│   ├── watchlists.ts               # Watchlist operations
│   ├── favorites.ts                # Favorites management
│   ├── reviews.ts                  # Review system
│   ├── admin.ts                    # Admin endpoints
│   └── recommendations.ts          # Recommendations API
│
├── auth.ts                 # Authentication logic
├── db.ts                   # Database connection
├── storage.ts              # Data access layer (repository pattern)
├── routes.ts               # All routes in single file
├── vite.ts                 # Vite SSR integration
├── index.ts                # Express server entry point
├── cinehub.db              # SQLite recommendations database
├── schema.sql              # SQLite schema
├── seed.cjs                # Database seeding script
├── precompute.cjs          # Recommendation precomputation
└── recs-api.cjs            # Recommendations API endpoints
```

### Backend File Purposes

**`index.ts` - Server Entry Point**
- Initialize Express app
- Configure middleware (helmet, cors, compression, rate limiting)
- Set up session management
- Register API routes
- Start WebSocket server
- Error handling
- Server startup

**`db.ts` - Database Connection**
- PostgreSQL connection using Drizzle ORM
- Connection pooling configuration
- Database query utilities
- Transaction helpers

**`auth.ts` - Authentication Logic**
- Passport.js configuration
- JWT token generation/verification
- Password hashing with bcrypt
- OAuth strategies (Google, Facebook, GitHub, X)
- Session management

**`storage.ts` - Data Access Layer**
- Abstraction layer over database
- CRUD operations for all entities
- Repository pattern implementation
- Keeps routes thin and testable

**`routes.ts` - API Routes**
- All API endpoint definitions
- Request/response handling
- Route-specific middleware
- Input validation with Zod schemas
- Uses storage layer for data operations

**Services (`/services/`)**
- External API integrations (TMDB, Cloudinary, SendGrid, Twilio)
- Caching strategies
- Background jobs
- WebSocket real-time updates
- Business logic that doesn't fit in routes

## Shared Code

### `/shared` - Shared TypeScript Code

```
shared/
└── schema.ts               # Database schema and types
    ├── Table definitions (Drizzle ORM)
    ├── Zod validation schemas
    ├── TypeScript type exports
    └── Shared between frontend and backend
```

**Purpose:**
- Single source of truth for data models
- Ensures type consistency between frontend and backend
- Drizzle ORM table definitions
- Zod schemas for runtime validation
- TypeScript types for compile-time safety

**Example Usage:**
```typescript
// Define schema
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  username: varchar('username', { length: 50 }).unique().notNull(),
});

// Export insert schema
export const insertUserSchema = createInsertSchema(users).omit({ id: true });

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
```

## Testing Structure

### `/tests` - Test Suites

```
tests/
├── __mocks__/              # Mock implementations
│   ├── tmdb-service.ts             # TMDB API mocks
│   └── ...
│
├── fixtures/               # Test data fixtures
│   ├── factories.ts                # Data factories
│   ├── users.json                  # Sample user data
│   ├── movies.json                 # Sample movie data
│   └── static/                     # Static test assets
│
├── unit/                   # Unit tests
│   ├── auth.test.ts                # Auth utilities
│   ├── tmdb-cache.test.ts          # TMDB caching
│   ├── image-cache.test.ts         # Image processing
│   ├── otp-service.test.ts         # OTP service
│   ├── cloudinary-service.test.ts  # Cloudinary integration
│   ├── cache-queue.test.ts         # Job queue
│   └── websocket.test.ts           # WebSocket service
│
├── integration/            # Integration tests
│   ├── mocks/                      # MSW handlers
│   │   └── tmdb-handlers.ts
│   ├── auth-api.test.ts            # Auth endpoints
│   ├── movies-api.test.ts          # Movie endpoints
│   ├── reviews-api.test.ts         # Review system
│   ├── watchlists-api.test.ts      # Watchlist functionality
│   ├── user-collections.test.ts    # User collections
│   ├── admin-api.test.ts           # Admin endpoints
│   ├── tmdb-api.test.ts            # TMDB integration
│   └── websocket-integration.test.ts
│
├── components/             # Component tests
│   ├── auth-modal.test.tsx         # Auth modal
│   ├── movie-card.test.tsx         # Movie card
│   ├── header.test.tsx             # Header/nav
│   ├── filter-components.test.tsx  # Filters
│   ├── movie-grid.test.tsx         # Movie grid
│   └── ...
│
├── hooks/                  # Hook tests
│   ├── useAuth.test.ts
│   ├── useInfiniteScroll.test.ts
│   └── useDebouncedSearch.test.ts
│
├── pages/                  # Page tests
│   ├── home.test.tsx
│   └── search.test.tsx
│
├── e2e/                    # E2E tests (Vitest)
│   ├── authentication-flow.test.ts
│   ├── review-posting.test.ts
│   └── watchlist-management.test.ts
│
├── contexts/               # Context tests
│   └── ThemeContext.test.tsx
│
├── utils/                  # Utility tests
│   ├── auth-utils.test.ts
│   ├── cn-utils.test.ts
│   └── tmdb.test.ts
│
└── setup.ts                # Global test setup
```

### `/cypress` - Cypress E2E Tests

```
cypress/
├── e2e/                    # E2E test specs
│   ├── auth-flow.cy.ts             # Authentication flow
│   ├── movie-details.cy.ts         # Movie details page
│   ├── search-and-filters.cy.ts    # Search functionality
│   ├── infinite-scroll.cy.ts       # Infinite scroll
│   └── ...
│
├── support/                # Support files
│   ├── commands.ts                 # Custom commands
│   └── e2e.ts                      # E2E setup
│
└── fixtures/               # Test fixtures
    ├── movies.json
    └── users.json
```

## Documentation

### `/docs` - Project Documentation

```
docs/
├── API.md                          # Complete API reference
├── ARCHITECTURE.md                 # System architecture
├── SETUP.md                        # Setup instructions
├── TESTING.md                      # Testing guide
├── DEPLOYMENT.md                   # Deployment guide
├── DEPLOYMENT_EC2.md               # EC2 specific deployment
├── DEPLOY_AMAZON_LINUX.md          # Amazon Linux setup
├── CONTRIBUTING.md                 # Contribution guidelines
├── USER_GUIDE.md                   # End-user documentation
├── DEVELOPER_GUIDE.md              # Developer workflow
├── SECURITY.md                     # Security policy
├── FAQ.md                          # Frequently asked questions
├── TROUBLESHOOTING.md              # Common issues
├── GITHUB_ACTIONS.md               # CI/CD workflows
├── ENVIRONMENT_VARIABLES.md        # Environment config
├── CODE_DOCUMENTATION.md           # Code standards
├── TESTING_NOTES.md                # Testing best practices
├── DOCUMENTATION_INDEX.md          # Documentation index
├── DATABASE_SCHEMA.md              # Database documentation
├── FOLDER_STRUCTURE.md             # This file
└── FUTURE_ENHANCEMENTS.md          # Roadmap
```

## Configuration Files

### Root Configuration

```
project-root/
├── package.json                    # Dependencies and npm scripts
├── tsconfig.json                   # TypeScript compiler config
├── vite.config.ts                  # Vite build configuration
├── vitest.config.ts                # Unit/integration test config
├── vitest.integration.config.ts    # Integration test specific config
├── cypress.config.ts               # Cypress E2E test config
├── tailwind.config.ts              # Tailwind CSS configuration
├── postcss.config.js               # PostCSS configuration
├── drizzle.config.ts               # Drizzle ORM database config
├── components.json                 # shadcn/ui components config
├── .env.example                    # Example environment variables
├── .gitignore                      # Git ignore rules
└── .prettierrc                     # Code formatting rules (optional)
```

### TypeScript Configuration

**`tsconfig.json`** - Shared TypeScript configuration
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "paths": {
      "@/*": ["./client/src/*"],
      "@shared/*": ["./shared/*"],
      "@assets/*": ["./attached_assets/*"]
    }
  }
}
```

**Path Aliases:**
- `@/*` - Frontend source files
- `@shared/*` - Shared schemas and types
- `@assets/*` - Static assets

## Scripts

### `/scripts` - Utility Scripts

```
scripts/
├── health-check.sh                 # Production health verification
├── deployment-verify.sh            # Deployment validation
└── ...                             # Other utility scripts
```

### npm Scripts

Defined in `package.json`:

```json
{
  "scripts": {
    "dev": "Start development server",
    "build": "Build for production",
    "start": "Start production server",
    "test": "Run all tests",
    "test:watch": "Run tests in watch mode",
    "test:coverage": "Run tests with coverage",
    "test:unit": "Run unit tests only",
    "test:integration": "Run integration tests",
    "test:components": "Run component tests",
    "test:e2e": "Run E2E tests",
    "cypress": "Open Cypress Test Runner",
    "db:push": "Push schema changes to database",
    "check": "TypeScript type checking"
  }
}
```

## File Naming Conventions

### React Components
- **PascalCase** for component files: `MovieCard.tsx`, `AuthModal.tsx`
- **camelCase** for utilities: `queryClient.ts`, `authUtils.ts`
- **kebab-case** for CSS: `index.css`

### Tests
- Match source file name + `.test`: `MovieCard.test.tsx`
- E2E tests use `.cy`: `auth-flow.cy.ts`

### Exports
- **Named exports** for components: `export function MovieCard() {}`
- **Default exports** for pages: `export default HomePage`

## Import Organization

Follow this import order:

```typescript
// 1. External libraries
import React from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Internal components
import { Button } from '@/components/ui/button';
import { MovieCard } from '@/components/movie/MovieCard';

// 3. Hooks and utilities
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

// 4. Types
import type { Movie } from '@/types/movie';

// 5. Styles (if any)
import './styles.css';
```

## Best Practices

### Component Files
- One component per file
- Co-locate related components in feature folders
- Keep components under 200 lines
- Extract complex logic into custom hooks

### Backend Files
- Thin routes, thick services
- Use storage layer for all database operations
- Validate inputs with Zod schemas
- Return consistent error responses

### Shared Code
- Only share types, schemas, and constants
- No business logic in `/shared`
- Keep `/shared` dependency-free

### Testing Files
- Place tests next to source or in `/tests`
- Use factories for test data
- Mock external dependencies
- Follow Arrange-Act-Assert pattern

## Additional Resources

- [React File Structure Best Practices](https://react.dev/learn/thinking-in-react)
- [Node.js Project Structure](https://blog.logrocket.com/organizing-express-js-project-structure-better-productivity/)
- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)

---

**Last Updated:** October 29, 2025
