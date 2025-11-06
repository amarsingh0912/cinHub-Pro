# Architecture Documentation

Comprehensive architecture documentation for CineHub Pro.

## Table of Contents

- [System Overview](#system-overview)
- [Technology Stack](#technology-stack)
- [Application Architecture](#application-architecture)
- [Data Flow](#data-flow)
- [Database Schema](#database-schema)
- [Caching Strategy](#caching-strategy)
- [Authentication & Authorization](#authentication--authorization)
- [API Design](#api-design)
- [Frontend Architecture](#frontend-architecture)
- [Backend Architecture](#backend-architecture)
- [Security](#security)
- [Performance Optimization](#performance-optimization)
- [Scalability](#scalability)

## System Overview

CineHub Pro is a full-stack movie and TV show discovery platform built with modern web technologies. The application follows a client-server architecture with clear separation of concerns.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client (Browser)                      │
│  ┌──────────────────────────────────────────────────┐   │
│  │     React App (Vite + TypeScript + SSR)          │   │
│  │  ┌────────────┐  ┌────────────┐  ┌───────────┐  │   │
│  │  │   Pages    │  │ Components │  │   Hooks   │  │   │
│  │  └────────────┘  └────────────┘  └───────────┘  │   │
│  │  ┌─────────────────────────────────────────────┐│   │
│  │  │    TanStack Query (State Management)        ││   │
│  │  └─────────────────────────────────────────────┘│   │
│  │  SSR: Hydration | Dev: Client-side rendering    │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                           │
                  HTTPS / WebSocket
                           │
┌─────────────────────────────────────────────────────────┐
│         Express.js Server (Node.js + SSR Renderer)       │
│  ┌──────────────────────────────────────────────────┐   │
│  │                  API Routes                       │   │
│  │  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │   │
│  │  │   Auth   │  │  Movies  │  │  Collections   │  │   │
│  │  └──────────┘  └──────────┘  └────────────────┘  │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Business Logic Layer                 │   │
│  │  ┌────────────┐  ┌──────────────┐  ┌──────────┐  │   │
│  │  │  Services  │  │    Utils     │  │  Cache   │  │   │
│  │  └────────────┘  └──────────────┘  └──────────┘  │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Data Access Layer                    │   │
│  │  ┌────────────────────────────────────────────┐  │   │
│  │  │    Drizzle ORM (Storage Interface)         │  │   │
│  │  └────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────┐
│                 External Services                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │PostgreSQL│  │   TMDB   │  │Cloudinary│  │ SendGrid│ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend

| Technology | Purpose | Version |
|------------|---------|---------|
| **React** | UI framework | 18.x |
| **TypeScript** | Type safety | 5.x |
| **Vite** | Build tool with SSR | 5.x |
| **TanStack Query** | Server state management | 5.x |
| **Wouter** | Routing | 3.x |
| **Tailwind CSS** | Styling | 4.x |
| **Radix UI** | Accessible components | Latest |
| **Framer Motion** | Animations | 11.x |
| **React Hook Form** | Form management | 7.x |
| **Zod** | Schema validation | 3.x |

### Backend

| Technology | Purpose | Version |
|------------|---------|---------|
| **Node.js** | Runtime | 20.x |
| **Express.js** | Web framework | 4.x |
| **TypeScript** | Type safety | 5.x |
| **Drizzle ORM** | Database ORM | Latest |
| **PostgreSQL** | Database | 14+ |
| **JWT** | Authentication | 9.x |
| **bcrypt** | Password hashing | 6.x |
| **Passport.js** | OAuth strategies | Latest |
| **WebSocket (ws)** | Real-time updates | 8.x |

### Infrastructure & Services

| Service | Purpose |
|---------|---------|
| **Neon** | Serverless PostgreSQL |
| **TMDB API** | Movie/TV data |
| **Cloudinary** | Image hosting & optimization |
| **SendGrid** | Email service |
| **Twilio** | SMS service |
| **PM2** | Process management |
| **Nginx** | Reverse proxy |

## Application Architecture

### Layered Architecture

CineHub Pro follows a layered architecture pattern:

#### 1. Presentation Layer (Client)
- React components
- UI/UX logic
- Client-side routing
- State management
- SSR hydration (production)
- Client-side rendering (development)

#### 2. API Layer (Server Routes)
- Request validation
- Response formatting
- Error handling
- Middleware

#### 3. Business Logic Layer (Services)
- Core business rules
- Data transformations
- External API integration
- Caching logic

#### 4. Data Access Layer (Storage)
- Database operations (CRUD)
- Query building
- Transaction management
- Data mapping

#### 5. Database Layer
- PostgreSQL database
- Schema definitions
- Indexes and constraints

### Module Organization

```
Project Structure:
├── client/                 # Frontend modules
│   ├── components/         # UI components (atomic design)
│   │   ├── ui/            # Base UI components
│   │   ├── movie/         # Movie-specific components
│   │   ├── filters/       # Filter components
│   │   └── layout/        # Layout components
│   ├── contexts/          # React contexts
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Utilities
│   ├── pages/             # Page components
│   └── types/             # TypeScript types
│
├── server/                # Backend modules
│   ├── services/          # Business logic
│   │   ├── tmdbCacheService.ts
│   │   ├── imageCacheService.ts
│   │   ├── websocketService.ts
│   │   └── otpService.ts
│   ├── utils/             # Utilities
│   ├── auth.ts            # Authentication
│   ├── jwt.ts             # JWT utilities
│   ├── db.ts              # Database connection
│   ├── routes.ts          # API routes
│   └── storage.ts         # Data access layer
│
└── shared/                # Shared between client/server
    └── schema.ts          # Database schema & types
```

## Data Flow

### Request Flow

1. **Client Request**
   ```typescript
   // User interacts with UI
   const { data } = useQuery({
     queryKey: ['/api/movies/trending'],
   });
   ```

2. **TanStack Query Layer**
   - Checks cache
   - Makes HTTP request if needed
   - Updates UI with loading/error states

3. **API Route Handler**
   ```typescript
   app.get('/api/movies/trending', async (req, res) => {
     // Validate request
     const { page } = req.query;
     
     // Call service
     const movies = await tmdbCacheService.getTrending('movie', page);
     
     // Return response
     res.json(movies);
   });
   ```

4. **Service Layer**
   ```typescript
   async getTrending(type: 'movie' | 'tv', page: number) {
     // Check cache
     const cached = await this.getFromCache(type, 'trending', page);
     if (cached) return cached;
     
     // Fetch from TMDB
     const data = await tmdbApi.getTrending(type, page);
     
     // Cache result
     await this.saveToCache(type, 'trending', page, data);
     
     // Queue background tasks
     await imageCacheQueue.add(data);
     
     return data;
   }
   ```

5. **Data Access Layer**
   ```typescript
   async getFromCache(type, category, page) {
     return db.select()
       .from(tmdbCache)
       .where(
         and(
           eq(tmdbCache.type, type),
           eq(tmdbCache.category, category),
           eq(tmdbCache.page, page),
           gt(tmdbCache.expiresAt, new Date())
         )
       )
       .limit(1);
   }
   ```

### WebSocket Flow

1. Client connects to WebSocket server
2. Server sends cache job status updates
3. Client updates UI in real-time

```typescript
// Server
websocketService.broadcast({
  type: 'CACHE_UPDATE',
  payload: {
    mediaType: 'movie',
    mediaId: 550,
    status: 'completed',
  },
});

// Client
useEffect(() => {
  const ws = new WebSocket(wsUrl);
  
  ws.onmessage = (event) => {
    const { type, payload } = JSON.parse(event.data);
    if (type === 'CACHE_UPDATE') {
      queryClient.invalidateQueries(['/api/cache-status', payload.mediaId]);
    }
  };
}, []);
```

## Database Schema

### Core Tables

#### Users
```typescript
users {
  id: uuid (PK)
  email: string (unique)
  username: string (unique)
  password: string (hashed)
  firstName: string
  lastName: string
  phoneNumber: string (unique)
  profileImageUrl: string
  displayName: string
  providers: string[] (auth providers)
  isAdmin: boolean
  isVerified: boolean
  preferences: jsonb
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### Auth Sessions
```typescript
authSessions {
  id: uuid (PK)
  userId: uuid (FK → users.id)
  refreshTokenHash: string (unique)
  expiresAt: timestamp
  createdAt: timestamp
}
```

#### Social Accounts
```typescript
socialAccounts {
  id: uuid (PK)
  userId: uuid (FK → users.id)
  provider: string (google, facebook, etc.)
  providerUserId: string
  createdAt: timestamp
}
```

#### Favorites
```typescript
favorites {
  id: uuid (PK)
  userId: uuid (FK → users.id)
  mediaType: string (movie, tv)
  mediaId: integer
  createdAt: timestamp
}
```

#### Watchlists
```typescript
watchlists {
  id: uuid (PK)
  userId: uuid (FK → users.id)
  name: string
  description: string
  isPublic: boolean
  createdAt: timestamp
  updatedAt: timestamp
}

watchlistItems {
  id: uuid (PK)
  watchlistId: uuid (FK → watchlists.id)
  mediaType: string
  mediaId: integer
  notes: string
  addedAt: timestamp
}
```

#### Reviews
```typescript
reviews {
  id: uuid (PK)
  userId: uuid (FK → users.id)
  mediaType: string
  mediaId: integer
  rating: decimal
  content: text
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### Cache Tables
```typescript
tmdbCache {
  id: uuid (PK)
  type: string (movie, tv, person)
  category: string (trending, popular, etc.)
  tmdbId: integer
  page: integer
  data: jsonb
  expiresAt: timestamp
  createdAt: timestamp
}

imagesCache {
  id: uuid (PK)
  type: string
  mediaId: integer
  originalUrl: string
  cloudinaryUrl: string
  publicId: string
  createdAt: timestamp
}
```

### Indexes

```sql
-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- Auth Sessions
CREATE INDEX idx_auth_sessions_user_id ON authSessions(userId);
CREATE INDEX idx_auth_sessions_refresh_token ON authSessions(refreshTokenHash);

-- Favorites
CREATE INDEX idx_favorites_user_media ON favorites(userId, mediaType, mediaId);

-- Reviews
CREATE INDEX idx_reviews_media ON reviews(mediaType, mediaId);
CREATE INDEX idx_reviews_user ON reviews(userId);

-- TMDB Cache
CREATE INDEX idx_tmdb_cache_lookup ON tmdbCache(type, category, page, expiresAt);
CREATE INDEX idx_tmdb_cache_media ON tmdbCache(type, tmdbId);

-- Images Cache
CREATE INDEX idx_images_cache_media ON imagesCache(type, mediaId);
```

## Caching Strategy

### Three-Layer Caching

#### 1. Browser Cache (TanStack Query)
```typescript
// Client-side cache configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,        // 5 minutes
      gcTime: 10 * 60 * 1000,          // 10 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
```

**Purpose**: Minimize network requests, instant UI updates

**TTL**: 
- Movie/TV details: 5 minutes
- Lists (trending, popular): 2 minutes
- User data: 1 minute

#### 2. Database Cache (PostgreSQL)
```typescript
// Server-side TMDB data cache
const CACHE_DURATION = {
  movie: 24 * 60 * 60 * 1000,     // 24 hours
  tv: 24 * 60 * 60 * 1000,        // 24 hours
  person: 7 * 24 * 60 * 60 * 1000, // 7 days
  list: 1 * 60 * 60 * 1000,        // 1 hour
};
```

**Purpose**: Reduce TMDB API calls, faster response times

**Strategy**:
- Cache hit → Return immediately
- Cache miss → Fetch from TMDB, cache, return
- Expired → Fetch new data, update cache

#### 3. CDN Cache (Cloudinary)
```typescript
// Image optimization and caching
const uploadToCloudinary = async (imageUrl) => {
  return cloudinary.uploader.upload(imageUrl, {
    folder: 'cinehub',
    transformation: [
      { width: 500, crop: 'limit' },
      { quality: 'auto' },
      { fetch_format: 'auto' },
    ],
  });
};
```

**Purpose**: Fast image delivery, automatic optimization

**Features**:
- Automatic format selection (WebP, AVIF)
- Responsive images
- Global CDN delivery

### Cache Invalidation

```typescript
// Invalidate on user action
await queryClient.invalidateQueries(['/api/favorites']);

// Invalidate on mutation
useMutation({
  mutationFn: addToWatchlist,
  onSuccess: () => {
    queryClient.invalidateQueries(['/api/watchlists']);
  },
});

// Automatic background refresh
useQuery({
  queryKey: ['/api/movies/trending'],
  staleTime: 5 * 60 * 1000,
  refetchInterval: 10 * 60 * 1000, // Refresh every 10 minutes
});
```

## Authentication & Authorization

### Dual Authentication Mode

#### 1. Session-Based (Default for web)
```typescript
// Express session with PostgreSQL store
app.use(session({
  store: new pgStore({ pool }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
}));
```

#### 2. JWT-Based (For mobile/API clients)
```typescript
// Access token (short-lived)
const accessToken = signAccessToken({
  id: user.id,
  isAdmin: user.isAdmin,
});
// Expires: 15 minutes

// Refresh token (long-lived)
const refreshToken = signRefreshToken({
  id: user.id,
  sessionId: session.id,
});
// Expires: 7 days
```

### OAuth Integration

Supported providers:
- Google (OAuth 2.0)
- Facebook
- GitHub
- Twitter/X

```typescript
// OAuth flow
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/api/auth/google/callback',
}, async (accessToken, refreshToken, profile, done) => {
  // Find or create user
  let user = await storage.getUserByEmail(profile.email);
  
  if (!user) {
    user = await storage.createUser({
      email: profile.email,
      firstName: profile.name.givenName,
      providers: ['google'],
      isVerified: true,
    });
  }
  
  return done(null, user);
}));
```

### Authorization Middleware

```typescript
// Authentication check
const requireAuth = (req, res, next) => {
  if (req.user || req.headers.authorization) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
};

// Admin check
const requireAdmin = (req, res, next) => {
  if (req.user?.isAdmin) {
    return next();
  }
  res.status(403).json({ error: 'Forbidden' });
};

// Usage
app.get('/api/admin/users', requireAuth, requireAdmin, async (req, res) => {
  // Admin-only route
});
```

## API Design

### RESTful Principles

- **Resources**: Nouns (movies, users, watchlists)
- **HTTP Methods**: GET, POST, PUT, DELETE
- **Status Codes**: 200, 201, 400, 401, 404, 500
- **Versioning**: URL-based (/api/v1/) if needed

### Endpoint Patterns

```
GET    /api/movies              # List movies
GET    /api/movies/:id          # Get movie
POST   /api/movies              # Create movie (admin)
PUT    /api/movies/:id          # Update movie (admin)
DELETE /api/movies/:id          # Delete movie (admin)

GET    /api/users/:id/favorites # User's favorites
POST   /api/favorites           # Add favorite
DELETE /api/favorites/:id       # Remove favorite
```

### Request/Response Format

**Request**:
```json
POST /api/reviews
{
  "mediaType": "movie",
  "mediaId": 550,
  "rating": 9.0,
  "content": "Amazing film!"
}
```

**Success Response**:
```json
{
  "id": "uuid",
  "userId": "uuid",
  "mediaType": "movie",
  "mediaId": 550,
  "rating": 9.0,
  "content": "Amazing film!",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

**Error Response**:
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "rating",
      "message": "Rating must be between 0 and 10"
    }
  ]
}
```

### API Documentation

See [API.md](./API.md) for complete API reference.

## Frontend Architecture

### Component Organization

**Atomic Design Pattern**:

1. **Atoms**: Basic UI elements
   - Button, Input, Label, Card

2. **Molecules**: Simple component groups
   - FormField, SearchBar, FilterChip

3. **Organisms**: Complex components
   - MovieCard, FilterSheet, Header

4. **Templates**: Page layouts
   - DashboardLayout, ContentLayout

5. **Pages**: Complete pages
   - Home, MovieDetail, Dashboard

### State Management

**TanStack Query for Server State**:
```typescript
// Server state (API data)
const { data, isLoading } = useQuery({
  queryKey: ['/api/movies/trending'],
  staleTime: 5 * 60 * 1000,
});

// Mutations
const { mutate } = useMutation({
  mutationFn: addToFavorites,
  onSuccess: () => {
    queryClient.invalidateQueries(['/api/favorites']);
  },
});
```

**React Context for UI State**:
```typescript
// UI state (theme, filters)
const { theme, setTheme } = useTheme();
const { filters, updateFilters } = useFilters();
```

**Local State for Component State**:
```typescript
// Component-specific state
const [isOpen, setIsOpen] = useState(false);
const [selectedGenres, setSelectedGenres] = useState([]);
```

### Routing Strategy

```typescript
// Client-side routing with Wouter
function App() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/movies" component={Movies} />
      <Route path="/movies/:id" component={MovieDetail} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/admin" component={AdminDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}
```

## Backend Architecture

### Service Layer Pattern

Services encapsulate business logic:

```typescript
// tmdbCacheService.ts
class TMDBCacheService {
  async getTrending(type: 'movie' | 'tv', page: number) {
    // 1. Check cache
    const cached = await this.getFromCache(type, 'trending', page);
    if (cached && !this.isExpired(cached)) {
      return cached.data;
    }
    
    // 2. Fetch from TMDB
    const data = await tmdbApi.getTrending(type, page);
    
    // 3. Save to cache
    await this.saveToCache(type, 'trending', page, data);
    
    // 4. Queue image caching
    imageCacheQueue.add(data.results);
    
    return data;
  }
  
  private async getFromCache(type, category, page) {
    return storage.getTMDBCache({ type, category, page });
  }
  
  private isExpired(cache) {
    return new Date(cache.expiresAt) < new Date();
  }
}
```

### Error Handling

```typescript
// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  if (err instanceof ValidationError) {
    return res.status(400).json({ error: err.message });
  }
  
  if (err instanceof AuthenticationError) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  res.status(500).json({ error: 'Internal server error' });
});
```

### Middleware Stack

```typescript
// Security middleware
app.use(helmet());                    // Security headers
app.use(compression());               // Response compression
app.use(express.json());              // JSON parsing
app.use(cookieParser());              // Cookie parsing
app.use(rateLimiter);                 // Rate limiting
app.use(requireCSRFHeader);           // CSRF protection

// Authentication middleware
app.use(session(sessionConfig));      // Session management
app.use(passport.initialize());       // Passport.js
app.use(passport.session());          // Passport sessions
```

## Security

### Security Measures

1. **Input Validation**: Zod schemas
2. **Output Encoding**: Automatic JSON encoding
3. **Authentication**: JWT + Sessions
4. **Authorization**: Role-based access control
5. **HTTPS**: Enforced in production
6. **CSRF Protection**: Custom header requirement
7. **Rate Limiting**: Express rate limit
8. **SQL Injection**: Parameterized queries (Drizzle ORM)
9. **XSS Protection**: Content Security Policy
10. **Password Hashing**: bcrypt with salt

### Security Headers

```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https://image.tmdb.org", "https://res.cloudinary.com"],
      connectSrc: ["'self'", "wss:"],
    },
  },
}));
```

## Performance Optimization

### Frontend Optimization

1. **Code Splitting**: Route-based lazy loading
2. **Image Optimization**: Cloudinary transformations
3. **Bundle Optimization**: Vite tree-shaking
4. **Memoization**: React.memo, useMemo, useCallback
5. **Virtual Scrolling**: For long lists
6. **Debouncing**: Search inputs

### Backend Optimization

1. **Database Indexing**: Optimized queries
2. **Connection Pooling**: PostgreSQL pool
3. **Response Caching**: TMDB data cache
4. **Compression**: gzip/brotli
5. **Query Optimization**: Efficient Drizzle queries

### Database Optimization

```sql
-- Compound indexes for common queries
CREATE INDEX idx_favorites_user_media 
  ON favorites(userId, mediaType, mediaId);

CREATE INDEX idx_tmdb_cache_lookup 
  ON tmdbCache(type, category, page, expiresAt);

-- Partial indexes for active data
CREATE INDEX idx_active_sessions 
  ON authSessions(userId) 
  WHERE expiresAt > NOW();
```

## Scalability

### Horizontal Scaling

- **Load Balancing**: Nginx reverse proxy
- **Stateless API**: JWT tokens
- **Session Store**: PostgreSQL (can move to Redis)
- **File Storage**: Cloudinary CDN

### Vertical Scaling

- **Database**: Neon autoscaling
- **PM2 Cluster Mode**: Multi-core utilization
- **Memory Management**: Node.js optimization

### Future Considerations

1. **Microservices**: Split into services (auth, media, user)
2. **Message Queue**: RabbitMQ/Redis for async tasks
3. **Caching Layer**: Redis for session/cache
4. **CDN**: CloudFront for static assets
5. **Database Replication**: Read replicas

## Deployment Architecture

```
Internet
   │
   ↓
AWS Route 53 (DNS)
   │
   ↓
Nginx (Reverse Proxy + SSL)
   │
   ↓
PM2 (Process Manager)
   ├── App Instance 1
   ├── App Instance 2
   └── App Instance 3 (cluster mode)
   │
   ↓
External Services
   ├── Neon PostgreSQL
   ├── Cloudinary CDN
   ├── SendGrid
   └── Twilio
```

## Monitoring & Logging

### Application Monitoring

```typescript
// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});
```

### Error Tracking

```typescript
// Error logging
app.use((err, req, res, next) => {
  console.error({
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    user: req.user?.id,
  });
  
  // Send to error tracking service (e.g., Sentry)
  // errorTracker.captureException(err);
  
  res.status(500).json({ error: 'Internal server error' });
});
```

### Performance Monitoring

```bash
# PM2 monitoring
pm2 monit

# Database query performance
EXPLAIN ANALYZE SELECT ...
```

## Diagrams

### Authentication Flow
```
User → Login Form → API (/api/auth/signin)
                         ↓
                    Validate Credentials
                         ↓
                    Create Session/JWT
                         ↓
                    Return Token
                         ↓
User ← Access Token ← API Response
```

### Data Caching Flow
```
Request → TanStack Query Cache?
          ├── Yes → Return Cached Data
          └── No → API Request
                   ↓
                   Database Cache?
                   ├── Yes → Return + Update Browser Cache
                   └── No → TMDB API
                           ↓
                           Save to DB Cache
                           ↓
                           Queue Image Cache Job
                           ↓
                           Return Data
```

## Additional Resources

- [API Documentation](./API.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Testing Guide](./TESTING.md)
- [Contributing Guidelines](./CONTRIBUTING.md)
