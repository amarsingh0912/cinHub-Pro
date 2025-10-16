# Code Documentation Standards

Comprehensive guide for inline code documentation in CineHub Pro.

## Table of Contents

- [Overview](#overview)
- [Documentation Philosophy](#documentation-philosophy)
- [JSDoc Standards](#jsdoc-standards)
- [TypeScript Type Documentation](#typescript-type-documentation)
- [Component Documentation](#component-documentation)
- [API Documentation](#api-documentation)
- [Database Schema Documentation](#database-schema-documentation)
- [Examples](#examples)
- [Tools and Automation](#tools-and-automation)

---

## Overview

Code documentation serves multiple purposes:
1. **Knowledge Transfer**: Help team members understand code quickly
2. **API Reference**: Generate automatic API documentation
3. **IDE Support**: Enable better autocomplete and type hints
4. **Maintenance**: Make future updates easier

### Documentation Principles

- **Write self-documenting code** first (clear naming, simple logic)
- **Document the "why"**, not the "what" (code shows what, comments explain why)
- **Keep docs close to code** (inline documentation, not separate wiki)
- **Update docs with code** (outdated docs are worse than no docs)
- **Be concise but complete** (every word counts)

---

## JSDoc Standards

We use JSDoc for all JavaScript/TypeScript documentation.

### Basic JSDoc Template

```typescript
/**
 * Brief one-line description of the function
 * 
 * Detailed explanation of what the function does, including:
 * - Key behavior and side effects
 * - Important assumptions or constraints
 * - Performance considerations if relevant
 * 
 * @param {Type} paramName - Description of parameter
 * @param {Type} [optionalParam] - Optional parameter description
 * @returns {Type} Description of return value
 * @throws {ErrorType} When this error occurs
 * @example
 * // Example usage
 * functionName(param1, param2);
 */
```

### Function Documentation

#### Required Elements
- Brief description (one line)
- `@param` for each parameter with type and description
- `@returns` for return value (unless void)
- `@throws` for any exceptions thrown

#### Optional Elements
- Detailed description for complex functions
- `@example` for usage examples
- `@see` for related functions
- `@deprecated` for deprecated code

#### Example

```typescript
/**
 * Validates a Cloudinary URL and optionally checks user ownership
 * 
 * Performs security checks to ensure:
 * 1. URL uses HTTPS protocol
 * 2. URL is from configured Cloudinary account
 * 3. If userId provided, URL belongs to that user's folder
 * 
 * @param {string} url - The Cloudinary URL to validate
 * @param {string} [userId] - Optional user ID to verify ownership
 * @returns {boolean} True if URL is valid and authorized
 * @throws {Error} If Cloudinary configuration is missing
 * 
 * @example
 * // Basic validation
 * validateCloudinaryUrl('https://res.cloudinary.com/demo/image/upload/sample.jpg');
 * 
 * @example
 * // With user ownership check
 * validateCloudinaryUrl(imageUrl, user.id);
 */
export function validateCloudinaryUrl(url: string, userId?: string): boolean {
  // Implementation
}
```

### Class Documentation

```typescript
/**
 * Manages background cache jobs for TMDB data
 * 
 * This service provides a priority queue for caching movie and TV show
 * data from TMDB. It handles:
 * - Job prioritization based on user interaction
 * - Automatic retry with exponential backoff
 * - Rate limiting to respect API quotas
 * - Real-time status updates via WebSocket
 * 
 * @extends EventEmitter
 * @emits job-enqueued When a new job is added to queue
 * @emits job-started When job processing begins
 * @emits job-completed When job finishes successfully
 * @emits job-failed When job fails after retries
 */
export class CacheQueueService extends EventEmitter {
  /**
   * Creates a new cache queue service
   * Automatically starts the background worker
   */
  constructor() {
    // Implementation
  }
}
```

### Method Documentation

```typescript
/**
 * Adds a caching job to the priority queue
 * 
 * Jobs are inserted based on priority, with higher priority jobs
 * processed first. Duplicate jobs (same media type and ID) are
 * prevented to avoid redundant API calls.
 * 
 * @param {'movie' | 'tv'} mediaType - Type of media to cache
 * @param {number} mediaId - TMDB ID of the media
 * @param {number} [priority=0] - Job priority (higher = sooner)
 * @returns {string} Unique job ID for status tracking
 * 
 * @example
 * // Add high-priority movie cache job
 * const jobId = queue.enqueueJob('movie', 550, 10);
 * 
 * @example
 * // Add normal priority TV show cache job
 * const jobId = queue.enqueueJob('tv', 1396);
 */
enqueueJob(mediaType: 'movie' | 'tv', mediaId: number, priority: number = 0): string {
  // Implementation
}
```

---

## TypeScript Type Documentation

### Interface Documentation

```typescript
/**
 * User authentication session data
 * 
 * Stores refresh token information for JWT-based authentication.
 * Sessions automatically expire after the refresh token TTL.
 * 
 * @interface
 */
export interface AuthSession {
  /** Unique session identifier (UUID) */
  id: string;
  
  /** ID of the user who owns this session */
  userId: string;
  
  /** Hashed refresh token (SHA-256) */
  refreshTokenHash: string;
  
  /** Browser/device user agent string */
  userAgent: string | null;
  
  /** Client IP address */
  ipAddress: string | null;
  
  /** Timestamp when session expires */
  expiresAt: Date;
  
  /** Session creation timestamp */
  createdAt: Date;
  
  /** Last activity timestamp */
  lastUsedAt: Date | null;
}
```

### Type Alias Documentation

```typescript
/**
 * User activity types for activity history
 * 
 * @typedef {'review' | 'watchlist' | 'favorite' | 'rating'} ActivityType
 */
export type ActivityType = 'review' | 'watchlist' | 'favorite' | 'rating';

/**
 * Media content types supported by the platform
 * 
 * @typedef {'movie' | 'tv'} MediaType
 */
export type MediaType = 'movie' | 'tv';
```

### Enum Documentation

```typescript
/**
 * User role levels for authorization
 * 
 * @enum {string}
 */
export enum UserRole {
  /** Regular user with standard permissions */
  USER = 'user',
  
  /** Admin user with elevated permissions */
  ADMIN = 'admin',
  
  /** Moderator with content moderation permissions */
  MODERATOR = 'moderator'
}
```

---

## Component Documentation

### React Component Documentation

```typescript
/**
 * Movie card component displaying poster, title, rating, and metadata
 * 
 * Features:
 * - Lazy-loaded poster images
 * - Hover effects for interactivity
 * - Rating display with star visualization
 * - Add to watchlist quick action
 * - Responsive layout for all screen sizes
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Movie} props.movie - Movie data from TMDB
 * @param {boolean} [props.showActions=true] - Show action buttons
 * @param {Function} [props.onClick] - Click handler for card
 * 
 * @example
 * <MovieCard 
 *   movie={movieData} 
 *   showActions={true}
 *   onClick={() => navigate(`/movie/${movie.id}`)}
 * />
 */
export function MovieCard({ movie, showActions = true, onClick }: MovieCardProps) {
  // Component implementation
}
```

### Props Interface Documentation

```typescript
/**
 * Props for MovieCard component
 * 
 * @interface
 */
interface MovieCardProps {
  /** Movie data object from TMDB API */
  movie: {
    id: number;
    title: string;
    poster_path: string | null;
    vote_average: number;
    release_date: string;
  };
  
  /** Whether to display action buttons (default: true) */
  showActions?: boolean;
  
  /** Click handler for the entire card */
  onClick?: () => void;
  
  /** Additional CSS classes to apply */
  className?: string;
}
```

### Hook Documentation

```typescript
/**
 * Custom hook for managing user authentication state
 * 
 * Provides current user data, loading state, and authentication
 * status. Automatically refetches on mount and after auth changes.
 * 
 * @hook
 * @returns {Object} Authentication state
 * @returns {User | null} user - Current authenticated user or null
 * @returns {boolean} isLoading - Loading state
 * @returns {boolean} isAuthenticated - Whether user is logged in
 * @returns {Function} refetch - Manually refetch user data
 * 
 * @example
 * function MyComponent() {
 *   const { user, isLoading, isAuthenticated } = useAuth();
 *   
 *   if (isLoading) return <Spinner />;
 *   if (!isAuthenticated) return <LoginPrompt />;
 *   
 *   return <div>Welcome, {user.username}!</div>;
 * }
 */
export function useAuth() {
  // Hook implementation
}
```

---

## API Documentation

### Route/Endpoint Documentation

```typescript
/**
 * GET /api/movies/trending
 * 
 * Fetches trending movies from TMDB API with caching
 * 
 * Query Parameters:
 * @queryparam {number} [page=1] - Page number (1-1000)
 * @queryparam {'day'|'week'} [time_window='day'] - Trending time window
 * 
 * Response:
 * @returns {Object} Trending movies data
 * @returns {Movie[]} results - Array of movie objects
 * @returns {number} page - Current page number
 * @returns {number} total_pages - Total available pages
 * @returns {number} total_results - Total number of results
 * 
 * @throws {400} Invalid page number or time window
 * @throws {500} TMDB API error or server error
 * 
 * @example
 * GET /api/movies/trending?page=1&time_window=week
 * 
 * Response:
 * {
 *   "results": [...],
 *   "page": 1,
 *   "total_pages": 100,
 *   "total_results": 2000
 * }
 */
app.get('/api/movies/trending', async (req, res) => {
  // Implementation
});
```

### Middleware Documentation

```typescript
/**
 * JWT authentication middleware
 * 
 * Verifies JWT token from Authorization header and attaches
 * user data to request object. Does not block request if token
 * is missing or invalid (allows dual-mode auth with session).
 * 
 * @middleware
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 * 
 * @modifies {Request} req.user - Attaches user data if token valid
 * 
 * @example
 * app.use(authenticateJWT);
 * 
 * app.get('/api/profile', (req, res) => {
 *   if (req.user) {
 *     // User authenticated via JWT
 *   }
 * });
 */
export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  // Implementation
};
```

---

## Database Schema Documentation

### Table/Model Documentation

```typescript
/**
 * User accounts table
 * 
 * Stores user authentication and profile information.
 * Supports both email/password and social OAuth authentication.
 * 
 * Indexes:
 * - email (unique, for login)
 * - username (unique, for profile URL)
 * - phoneNumber (unique, for SMS auth)
 * 
 * Relations:
 * - One to Many: authSessions, watchlists, favorites, reviews
 * - One to Many: socialAccounts (for OAuth)
 * 
 * @table users
 */
export const users = pgTable('users', {
  /**
   * Unique user identifier (UUID v4)
   * @primary
   */
  id: text('id').primaryKey().notNull(),
  
  /**
   * User's email address (unique, indexed)
   * Used for login and notifications
   * @unique
   */
  email: text('email').unique().notNull(),
  
  /**
   * Bcrypt-hashed password (nullable for OAuth-only users)
   * Hashed with 12 rounds
   */
  passwordHash: text('password_hash'),
  
  /**
   * Display username (unique, indexed)
   * 3-30 characters, alphanumeric and underscores
   * @unique
   */
  username: text('username').unique().notNull(),
  
  /**
   * Whether user has admin privileges
   * @default false
   */
  isAdmin: boolean('is_admin').default(false).notNull(),
  
  /**
   * Cloudinary profile picture URL
   * Must be HTTPS and from configured Cloudinary account
   */
  profilePicture: text('profile_picture'),
  
  /**
   * Account creation timestamp
   * @default now()
   */
  createdAt: timestamp('created_at').defaultNow().notNull(),
  
  /**
   * Last update timestamp
   * Auto-updated on any user data change
   * @default now()
   */
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});
```

---

## Examples

### Complete Function Example

```typescript
/**
 * Generates a signed upload signature for Cloudinary
 * 
 * Creates a cryptographically signed request for client-side
 * direct uploads to Cloudinary. The signature ensures uploads
 * can only be made with approved parameters.
 * 
 * Security features:
 * - Time-bound signatures (expires with timestamp)
 * - Folder restrictions for user uploads
 * - Automatic image transformations
 * 
 * @param {CloudinarySignatureParams} [params={}] - Upload parameters
 * @param {string} [params.folder='profile_pictures'] - Destination folder
 * @param {string} [params.public_id] - Custom public ID for image
 * @param {string} [params.transformation='c_fill,w_400,h_400,q_auto,f_auto'] - Image transformation string
 * 
 * @returns {Object} Signed upload parameters
 * @returns {string} signature - HMAC SHA-256 signature
 * @returns {number} timestamp - Unix timestamp
 * @returns {string} api_key - Cloudinary API key
 * @returns {string} cloud_name - Cloudinary cloud name
 * @returns {string} folder - Upload destination folder
 * @returns {string} transformation - Applied transformations
 * 
 * @throws {Error} If Cloudinary API secret is not configured
 * 
 * @example
 * // Generate signature for profile picture upload
 * const uploadParams = generateUploadSignature({
 *   folder: `profile_pictures/${user.id}`,
 *   transformation: 'c_fill,w_200,h_200,g_face'
 * });
 * 
 * // Use in client-side upload
 * const formData = new FormData();
 * formData.append('file', imageFile);
 * Object.keys(uploadParams).forEach(key => {
 *   formData.append(key, uploadParams[key]);
 * });
 * 
 * @see {@link validateCloudinaryUrl} for URL validation
 * @see {@link https://cloudinary.com/documentation/upload_images#signed_uploads|Cloudinary Signed Uploads}
 */
export function generateUploadSignature(params: CloudinarySignatureParams = {}) {
  if (!process.env.CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary not configured - missing API secret');
  }

  const timestamp = Math.round(Date.now() / 1000);
  
  const uploadParams = {
    timestamp,
    folder: params.folder || 'profile_pictures',
    transformation: params.transformation || 'c_fill,w_400,h_400,q_auto,f_auto',
    ...params
  };

  const cleanParams = Object.fromEntries(
    Object.entries(uploadParams).filter(([_, value]) => value !== undefined)
  );

  const signature = cloudinary.utils.api_sign_request(
    cleanParams, 
    process.env.CLOUDINARY_API_SECRET
  );

  return {
    signature,
    timestamp,
    api_key: process.env.CLOUDINARY_API_KEY,
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    ...cleanParams
  };
}
```

---

## Tools and Automation

### Documentation Generation

```bash
# Generate API documentation from JSDoc
npm run docs:generate

# Validate JSDoc syntax
npm run docs:lint

# Check documentation coverage
npm run docs:coverage
```

### IDE Configuration

#### VS Code Settings
```json
{
  "typescript.suggest.jsdoc": true,
  "javascript.suggest.jsdoc": true,
  "editor.quickSuggestions": {
    "comments": true
  }
}
```

### ESLint Rules for Documentation

```json
{
  "rules": {
    "jsdoc/require-jsdoc": ["error", {
      "require": {
        "FunctionDeclaration": true,
        "MethodDefinition": true,
        "ClassDeclaration": true
      }
    }],
    "jsdoc/require-param": "error",
    "jsdoc/require-returns": "error",
    "jsdoc/require-param-type": "error",
    "jsdoc/require-returns-type": "error"
  }
}
```

---

## Documentation Checklist

Before committing code, ensure:

- [ ] All public functions have JSDoc comments
- [ ] All parameters are documented with types
- [ ] Return values are documented
- [ ] Exceptions/errors are documented
- [ ] Complex logic has explanatory comments
- [ ] Examples provided for non-obvious usage
- [ ] Types/interfaces have descriptions
- [ ] API endpoints documented with request/response
- [ ] Database changes documented in schema
- [ ] README updated if public API changed

---

## Additional Resources

- [JSDoc Official Documentation](https://jsdoc.app/)
- [TypeScript JSDoc Reference](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html)
- [TSDoc Standard](https://tsdoc.org/)
- [Documentation Best Practices](https://google.github.io/styleguide/jsguide.html#jsdoc)

---

## Contributing

When adding new documentation:
1. Follow the templates provided in this guide
2. Be concise but complete
3. Include examples for complex functionality
4. Update related docs when changing behavior
5. Review docs as part of code review process
