# CineHub Pro - Developer Guide

Complete guide for developers working on CineHub Pro. This document covers development workflow, coding standards, architecture decisions, and contribution guidelines.

## Table of Contents

1. [Development Setup](#development-setup)
2. [Project Architecture](#project-architecture)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-standards)
5. [Testing Guidelines](#testing-guidelines)
6. [API Development](#api-development)
7. [Frontend Development](#frontend-development)
8. [Database Management](#database-management)
9. [Performance Optimization](#performance-optimization)
10. [Security Best Practices](#security-best-practices)
11. [Deployment](#deployment)
12. [Troubleshooting](#troubleshooting)

## Development Setup

### Prerequisites

- Node.js 20+ and npm
- PostgreSQL 14+ (or Neon account)
- Git
- Code editor (VS Code recommended)
- TMDB API key

### Initial Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd cinehub-pro
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment configuration:**
   ```bash
   cp .env.example .env
   ```
   Update `.env` with your credentials

4. **Database setup:**
   ```bash
   npm run db:push
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

### VS Code Setup

Recommended extensions:
- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- Tailwind CSS IntelliSense
- GitLens
- Thunder Client (API testing)

### VS Code Settings

Create `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}
```

## Project Architecture

### Directory Structure

```
cinehub-pro/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── ui/         # Base UI components (shadcn)
│   │   │   ├── movie/      # Movie-specific components
│   │   │   ├── layout/     # Layout components (header, footer)
│   │   │   └── filter-kit/ # Advanced filter system
│   │   ├── pages/          # Page components (routes)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities and helpers
│   │   ├── contexts/       # React contexts
│   │   └── types/          # TypeScript type definitions
│   └── index.html          # HTML entry point
│
├── server/                 # Backend Express application
│   ├── services/           # Business logic services
│   │   ├── tmdbCache.ts    # TMDB caching logic
│   │   ├── imageCache.ts   # Image optimization
│   │   ├── cacheQueue.ts   # Background job queue
│   │   ├── websocketService.ts # Real-time updates
│   │   ├── otpService.ts   # OTP generation/verification
│   │   └── cloudinaryService.ts # Image upload
│   ├── utils/              # Utility functions
│   │   └── tmdbDiscover.ts # TMDB query builder
│   ├── auth.ts             # Authentication logic
│   ├── jwt.ts              # JWT utilities
│   ├── passport.ts         # OAuth strategies
│   ├── db.ts               # Database connection
│   ├── routes.ts           # API route definitions
│   ├── storage.ts          # Data access layer
│   ├── vite.ts             # Vite integration
│   └── index.ts            # Server entry point
│
├── shared/                 # Shared code (client + server)
│   └── schema.ts           # Database schema & Zod validation
│
├── tests/                  # Test suites
│   ├── unit/               # Unit tests
│   ├── integration/        # Integration tests
│   ├── components/         # Component tests
│   └── e2e/                # End-to-end tests
│
├── docs/                   # Documentation
│   ├── API.md              # API reference
│   ├── ARCHITECTURE.md     # Architecture overview
│   ├── DEPLOYMENT.md       # Deployment guide
│   ├── TESTING.md          # Testing guide
│   └── DEVELOPER_GUIDE.md  # This file
│
└── .github/                # GitHub configuration
    └── workflows/          # CI/CD workflows
```

### Technology Stack

#### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Wouter** - Routing
- **TanStack Query v5** - Server state management
- **Radix UI** - Headless components
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **Framer Motion** - Animations

#### Backend
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Drizzle ORM** - Database ORM
- **PostgreSQL** - Database
- **Passport.js** - OAuth
- **JWT** - Authentication tokens
- **Multer** - File uploads
- **ws** - WebSockets

#### Services
- **TMDB API** - Movie data
- **Cloudinary** - Image hosting
- **SendGrid** - Email delivery
- **Twilio** - SMS delivery

## Development Workflow

### Git Workflow

We follow **Git Flow** branching strategy:

```
main                # Production-ready code
├── develop        # Integration branch
    ├── feature/*  # New features
    ├── bugfix/*   # Bug fixes
    ├── hotfix/*   # Production hotfixes
    └── release/*  # Release preparation
```

### Creating a Feature

1. **Create feature branch:**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. **Develop and commit:**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

3. **Push and create PR:**
   ```bash
   git push origin feature/your-feature-name
   ```
   Create pull request to `develop` branch

4. **After approval and merge:**
   ```bash
   git checkout develop
   git pull origin develop
   git branch -d feature/your-feature-name
   ```

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding/updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements

**Examples:**
```bash
git commit -m "feat(auth): add Google OAuth integration"
git commit -m "fix(api): resolve TMDB caching issue"
git commit -m "docs(readme): update installation instructions"
git commit -m "test(components): add MovieCard test suite"
```

## Coding Standards

### TypeScript

#### Type Safety
```typescript
// ✅ Good - Explicit types
interface Movie {
  id: number;
  title: string;
  releaseDate: string;
}

function getMovie(id: number): Promise<Movie> {
  // implementation
}

// ❌ Bad - Implicit any
function getMovie(id) {
  // implementation
}
```

#### Use Zod for Runtime Validation
```typescript
import { z } from 'zod';

const movieSchema = z.object({
  id: z.number(),
  title: z.string(),
  releaseDate: z.string(),
});

type Movie = z.infer<typeof movieSchema>;
```

### React Components

#### Component Structure
```typescript
// ✅ Good - Clean component structure
interface MovieCardProps {
  movie: Movie;
  onFavorite?: (id: number) => void;
}

export function MovieCard({ movie, onFavorite }: MovieCardProps) {
  const handleFavorite = () => {
    onFavorite?.(movie.id);
  };

  return (
    <div data-testid={`movie-card-${movie.id}`}>
      <h3>{movie.title}</h3>
      <button onClick={handleFavorite}>Favorite</button>
    </div>
  );
}
```

#### Hooks Best Practices
```typescript
// ✅ Good - Custom hook
function useMovieDetails(movieId: number) {
  return useQuery({
    queryKey: ['/api/movies', movieId],
    enabled: !!movieId,
  });
}

// Use in component
const { data: movie, isLoading } = useMovieDetails(movieId);
```

### Backend Patterns

#### Route Handlers
```typescript
// ✅ Good - Lean route handlers
app.get('/api/movies/:id', isAuthenticated, async (req, res) => {
  try {
    const movieId = parseInt(req.params.id);
    const movie = await storage.getMovie(movieId);
    
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    
    res.json(movie);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});
```

#### Service Layer
```typescript
// ✅ Good - Business logic in services
export class TMDBCacheService {
  async getMovieFromCache(movieId: number): Promise<MovieCache | null> {
    const cached = await db
      .select()
      .from(moviesCache)
      .where(eq(moviesCache.id, movieId))
      .limit(1);

    if (cached.length === 0) return null;

    const movie = cached[0];
    const isExpired = this.isExpired(movie.lastUpdated);

    return isExpired ? null : movie;
  }

  private isExpired(lastUpdated: Date): boolean {
    const now = new Date();
    const expiryMs = 24 * 60 * 60 * 1000; // 24 hours
    return (now.getTime() - lastUpdated.getTime()) > expiryMs;
  }
}
```

### Styling with Tailwind

```typescript
// ✅ Good - Use CVA for variants
import { cva } from 'class-variance-authority';

const buttonVariants = cva(
  'rounded font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary text-white hover:bg-primary/90',
        outline: 'border border-primary text-primary hover:bg-primary/10',
      },
      size: {
        sm: 'px-3 py-1 text-sm',
        md: 'px-4 py-2',
        lg: 'px-6 py-3 text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

// Use in component
<button className={buttonVariants({ variant: 'outline', size: 'lg' })}>
  Click me
</button>
```

## Testing Guidelines

### Unit Tests

```typescript
// tests/unit/tmdb-cache.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TMDBCacheService } from '@/server/services/tmdbCache';

describe('TMDBCacheService', () => {
  let service: TMDBCacheService;

  beforeEach(() => {
    service = new TMDBCacheService();
  });

  it('should return null for expired cache', async () => {
    const expiredDate = new Date(Date.now() - 25 * 60 * 60 * 1000);
    vi.spyOn(service as any, 'isExpired').mockReturnValue(true);
    
    const result = await service.getMovieFromCache(123);
    
    expect(result).toBeNull();
  });
});
```

### Integration Tests

```typescript
// tests/integration/movies-api.test.ts
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '@/server';

describe('Movies API', () => {
  it('GET /api/movies/:id should return movie details', async () => {
    const response = await request(app)
      .get('/api/movies/550')
      .expect(200);

    expect(response.body).toHaveProperty('title');
    expect(response.body).toHaveProperty('id', 550);
  });

  it('GET /api/movies/:id should return 404 for invalid ID', async () => {
    await request(app)
      .get('/api/movies/999999999')
      .expect(404);
  });
});
```

### Component Tests

```typescript
// tests/components/movie-card.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MovieCard } from '@/components/movie/movie-card';

describe('MovieCard', () => {
  const mockMovie = {
    id: 1,
    title: 'Test Movie',
    posterPath: '/test.jpg',
  };

  it('should render movie title', () => {
    render(<MovieCard movie={mockMovie} />);
    expect(screen.getByText('Test Movie')).toBeInTheDocument();
  });

  it('should call onFavorite when favorite button clicked', () => {
    const onFavorite = vi.fn();
    render(<MovieCard movie={mockMovie} onFavorite={onFavorite} />);
    
    fireEvent.click(screen.getByTestId('button-favorite'));
    expect(onFavorite).toHaveBeenCalledWith(1);
  });
});
```

### E2E Tests

```typescript
// tests/e2e/authentication-flow.test.ts
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '@/server';

describe('Authentication Flow', () => {
  it('should complete full signup and login flow', async () => {
    // 1. Sign up
    const signupResponse = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'test@example.com',
        username: 'testuser',
        password: 'Test123!@#',
      })
      .expect(201);

    expect(signupResponse.body).toHaveProperty('userId');

    // 2. Login
    const loginResponse = await request(app)
      .post('/api/auth/signin')
      .send({
        identifier: 'test@example.com',
        password: 'Test123!@#',
      })
      .expect(200);

    expect(loginResponse.body).toHaveProperty('accessToken');
    expect(loginResponse.body).toHaveProperty('user');
  });
});
```

## API Development

### Adding a New Endpoint

1. **Define Schema** (`shared/schema.ts`):
```typescript
export const reviews = pgTable('reviews', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar('user_id').notNull().references(() => users.id),
  mediaType: varchar('media_type').notNull(),
  mediaId: integer('media_id').notNull(),
  rating: integer('rating').notNull(),
  content: text('content'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const insertReviewSchema = createInsertSchema(reviews).omit({ 
  id: true, 
  createdAt: true 
});

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
```

2. **Add Storage Method** (`server/storage.ts`):
```typescript
export interface IStorage {
  createReview(data: InsertReview): Promise<Review>;
  getReviews(mediaType: string, mediaId: number): Promise<Review[]>;
  deleteReview(reviewId: string, userId: string): Promise<boolean>;
}

// Implementation
async createReview(data: InsertReview): Promise<Review> {
  const [review] = await db.insert(reviews).values(data).returning();
  return review;
}
```

3. **Add Route** (`server/routes.ts`):
```typescript
app.post('/api/reviews', isAuthenticated, async (req, res) => {
  try {
    const validated = insertReviewSchema.parse(req.body);
    const review = await storage.createReview({
      ...validated,
      userId: req.user!.id,
    });
    res.status(201).json(review);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid input', errors: error.errors });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});
```

4. **Add Frontend Hook** (`client/src/hooks/useReviews.ts`):
```typescript
export function useCreateReview() {
  return useMutation({
    mutationFn: async (data: InsertReview) => {
      return apiRequest('POST', '/api/reviews', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reviews'] });
    },
  });
}
```

## Frontend Development

### Page Structure

```typescript
// client/src/pages/movies.tsx
export default function MoviesPage() {
  const [filters, setFilters] = useState<FilterState>({});
  const { data, isLoading } = useMovies(filters);

  if (isLoading) return <MovieGridSkeleton />;

  return (
    <div>
      <Header />
      <FilterDock filters={filters} onChange={setFilters} />
      <MovieGrid movies={data?.results} />
      <Footer />
    </div>
  );
}
```

### State Management

Use TanStack Query for server state:
```typescript
// Query
const { data, isLoading, error } = useQuery({
  queryKey: ['/api/movies', filters],
  staleTime: 5 * 60 * 1000, // 5 minutes
});

// Mutation
const mutation = useMutation({
  mutationFn: (data) => apiRequest('POST', '/api/favorites', data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
  },
});
```

## Database Management

### Schema Updates

1. **Update schema** (`shared/schema.ts`)
2. **Push to database:**
   ```bash
   npm run db:push
   ```
3. **For production, use `--force` if needed:**
   ```bash
   npm run db:push -- --force
   ```

### Querying with Drizzle

```typescript
// Select
const movies = await db
  .select()
  .from(moviesCache)
  .where(eq(moviesCache.id, movieId))
  .limit(1);

// Insert
const [movie] = await db
  .insert(moviesCache)
  .values(movieData)
  .returning();

// Update
await db
  .update(users)
  .set({ isVerified: true })
  .where(eq(users.id, userId));

// Delete
await db
  .delete(reviews)
  .where(and(
    eq(reviews.id, reviewId),
    eq(reviews.userId, userId)
  ));
```

## Performance Optimization

### Frontend Optimization

1. **Code Splitting:**
   ```typescript
   const AdminDashboard = lazy(() => import('@/pages/admin-dashboard'));
   ```

2. **Memoization:**
   ```typescript
   const expensiveCalculation = useMemo(() => {
     return processMovies(movies);
   }, [movies]);
   ```

3. **Debouncing:**
   ```typescript
   const debouncedSearch = useDebouncedValue(searchQuery, 300);
   ```

### Backend Optimization

1. **Database Indexes:**
   ```typescript
   index('idx_movies_cache_id').on(moviesCache.id),
   index('idx_reviews_media').on(reviews.mediaType, reviews.mediaId),
   ```

2. **Query Optimization:**
   ```typescript
   // Use select only needed fields
   const users = await db
     .select({ id: users.id, email: users.email })
     .from(users);
   ```

3. **Caching Strategy:**
   - Browser cache: TanStack Query (5min stale time)
   - Database cache: TMDB data (24h for details, 1h for listings)
   - CDN cache: Cloudinary images

## Security Best Practices

### Input Validation

```typescript
// Always validate with Zod
const validated = insertReviewSchema.parse(req.body);
```

### Authentication

```typescript
// Protect routes
app.post('/api/reviews', isAuthenticated, handler);
app.delete('/api/users/:id', isAdmin, handler);
```

### Sanitization

```typescript
// Prevent XSS
import { escape } from 'html-escaper';
const safeContent = escape(userInput);
```

### Rate Limiting

```typescript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

## Deployment

### Production Build

```bash
# Build frontend and backend
npm run build

# Start production server
npm start
```

### Environment Variables

Ensure all required variables are set:
```bash
NODE_ENV=production
DATABASE_URL=postgresql://...
SESSION_SECRET=<32-char-random-string>
JWT_ACCESS_SECRET=<secret>
JWT_REFRESH_SECRET=<secret>
```

### Health Checks

```typescript
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});
```

## Troubleshooting

### Common Issues

**Database Connection Error:**
```bash
# Check DATABASE_URL
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL
```

**Build Failures:**
```bash
# Clear cache
rm -rf node_modules dist
npm install
npm run build
```

**Type Errors:**
```bash
# Run type check
npm run check

# Generate types
npm run db:push
```

## Additional Resources

- [Architecture Documentation](ARCHITECTURE.md)
- [API Reference](API.md)
- [Testing Guide](TESTING.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Security Guidelines](SECURITY.md)

## Getting Help

- Discord: [discord.gg/cinehubpro](https://discord.gg/cinehubpro)
- GitHub Issues: [github.com/yourusername/cinehub-pro/issues](https://github.com/yourusername/cinehub-pro/issues)
- Email: dev@cinehubpro.com

---

**Happy Coding! 🚀**
