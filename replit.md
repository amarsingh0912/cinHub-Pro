# CineHub Pro

## Overview

CineHub Pro is a modern, full-stack movie and TV show discovery platform built with React, Express, and PostgreSQL. The application provides users with comprehensive movie browsing, personalized collections, social features like reviews and ratings, and real-time updates. It integrates with The Movie Database (TMDB) API for content data and uses Cloudinary for optimized image delivery.

## Recent Changes

**October 29, 2025 (Local Recommendations Integration):**
- Integrated local SQLite-based recommendations database with CineHub Pro
  - **Home Page:** Authenticated users see trending movies from local DB via RecommendationCarousel component
  - **Movie Details Page:** 
    - Similar tab fetches genre-based recommendations from `/api/recs/similar/:movieId`
    - Recommended tab shows trending movies from `/api/recs/trending`
    - Non-authenticated users do not see the similar movies carousel section
  - **Background Sync Service:** Created `tmdb-sync.cjs` that syncs trending content from TMDB to local DB
    - Runs automatically every 6 hours (configurable via TMDB_SYNC_INTERVAL_HOURS env var)
    - Syncs both trending movies and TV shows
    - Updates existing entries and adds new ones
    - Initial sync completed successfully with 39 items
  - Created TypeScript declaration file for RecommendationCarousel to support TypeScript integration
  - All queries use proper TanStack Query array format with cache invalidation support
  - Zero TypeScript errors after implementation

**October 29, 2025 (Bug Fixes):**
- Fixed critical database integrity issues by adding foreign key constraints
  - Added cascading delete constraints to watchlists, favorites, reviews, viewingHistory, activityHistory, and searchHistory tables
  - Ensures data consistency when users are deleted (all related data is automatically removed)
  - Applied database migration successfully with `npm run db:push`
- Resolved TypeScript compilation errors
  - Fixed type safety in file upload MIME type validation
  - Corrected watchlist update schema validation
  - Added missing type definitions for cookie-parser and compression packages
- Code quality improvements
  - Removed duplicate `updateUser` method declaration in IStorage interface
  - All LSP diagnostics resolved (zero TypeScript errors)

**October 28, 2025 (Mobile Optimization):**
- Implemented comprehensive mobile and tablet optimizations across CineHub Pro
  - **Dialog & Modal Components:** Updated all dialogs with mobile-responsive widths, proper padding, and max-heights for small screens
  - **Touch Target Accessibility:** Ensured ALL interactive elements meet 44x44px minimum touch target requirement for mobile usability
    - Dialog close buttons: upgraded from 32px to 44px
    - Trailer modal controls (close, fullscreen, navigation): upgraded from 40px to 44px
    - Applied consistent min-w-[44px] min-h-[44px] sizing across all buttons
  - **Search Modal:** Enhanced with mobile-friendly input sizes, responsive max-heights, and better touch ergonomics
  - **Trailer Modal:** Optimized video player controls, navigation arrows, and fullscreen button for mobile devices
  - **PWA Optimizations:** Added mobile-friendly meta tags including:
    - viewport-fit=cover for notch/safe area support
    - mobile-web-app-capable and apple-mobile-web-app-capable for PWA installation
    - theme-color for browser UI customization
    - Improved viewport settings allowing user scaling up to 5x for accessibility
  - All changes verified by architect to maintain layout integrity without regressions
  - Mobile-first responsive design approach with progressive enhancement for larger screens

**October 28, 2025 (Recommendations):**
- Integrated zero-cost movie recommendations microservice into CineHub frontend
  - Added RecommendationCarousel component to home page showing trending movies from local database
  - Added similar movies carousel to movie detail pages using genre-based recommendations
  - Updated main README.md with comprehensive recommendations service documentation
  - Fixed navigation to use Wouter's SPA routing (replaced window.location.href with navigate())
  - All three recommendation endpoints verified working (trending, similar, personalized)
  - Service uses SQLite for zero-cost local storage with better-sqlite3

**October 20, 2025:**
- Major integration test infrastructure improvements
  - Fixed database cleanup to run before each test with TRUNCATE CASCADE
  - Moved user creation from beforeAll to beforeEach across all integration test files
  - Fixed auth-api.test.ts to use cookies for refresh tokens instead of request body
  - Updated signup route to return 409 (Conflict) for duplicate users instead of 400
  - Configured Vitest to run integration tests serially (fileParallelism: false) to prevent race conditions
  - Auth tests improved from 17 failures to 20/21 passing
  - Fixed 9 integration test files: auth-api, admin-api, preferences-api, user-collections, activity-history-api, watchlists-api, reviews-api, cloudinary-service, and setup

**October 19, 2025:**
- Fixed formatCurrency utility function to properly exclude cents
  - Added maximumFractionDigits: 0 to Intl.NumberFormat options
  - Currency values now display as whole dollars (e.g., $1,235 instead of $1,234.56)
  - All 31 utility tests now passing

**October 18, 2025:**
- Redesigned authentication modal with modern glassmorphism aesthetic
  - Implemented gradient backdrop overlay (purple/teal/blue) for visual depth
  - Added frosted glass effect with backdrop-blur and semi-transparent white/black panels
  - Simplified UI with clean typography and modern rounded corners
  - Maintained all existing authentication flows (signin, signup, OTP, password reset)
  - Preserved social auth integration (Google, Facebook, Twitter, GitHub)
  - Kept profile photo upload functionality for signup
  - Updated form styling with translucent inputs and improved visual hierarchy
  - Enhanced mobile responsiveness with touch-friendly button sizes

**October 17, 2025:**
- Updated OTP service to use email-only delivery via Twilio Verify (removed SMS support)
- Added user reminders to check spam/junk folders for OTP emails in UI and notifications
- Migrated profile photo uploads from local storage to Cloudinary
  - Profile photos are now stored in Cloudinary's `profile_pictures` folder
  - Images are automatically optimized (400x400, quality auto, format auto)
  - Changed multer configuration from diskStorage to memoryStorage
  - Updated both `/api/auth/upload-profile-photo` and `/api/auth/update-profile-photo` endpoints

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System:**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server for fast hot module replacement
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management and caching

**UI & Styling:**
- Tailwind CSS with custom dark theme configuration
- Radix UI components for accessible, unstyled primitives
- shadcn/ui component system built on Radix UI
- Custom theme context for dark mode support
- Responsive design with mobile-first breakpoints

**State Management Strategy:**
- TanStack Query handles all server state (API responses, caching, invalidation)
- React Context for global UI state (theme, authentication status)
- Local component state for transient UI interactions
- Filter state managed through dedicated FilterProvider context

### Backend Architecture

**Server Framework:**
- Express.js with TypeScript for type-safe API development
- Modular route structure separating concerns (auth, movies, admin, collections)
- Middleware chain: helmet for security, compression for responses, rate limiting for API protection

**Database Layer:**
- PostgreSQL as the primary database
- Drizzle ORM for type-safe database queries and schema management
- Neon serverless driver for connection pooling
- Schema-first design with migrations managed through drizzle-kit

**Authentication & Authorization:**
- Dual authentication system:
  1. Session-based auth using express-session with PostgreSQL store
  2. JWT-based auth with access tokens (15min) and refresh tokens (30 days)
- Passport.js for OAuth social login (Google, Facebook, GitHub, Twitter)
- bcrypt for password hashing (12 salt rounds)
- Role-based access control (admin vs regular users)
- OTP verification via email (SendGrid) and SMS (Twilio) for account verification

**Caching Strategy:**
- Three-tier caching approach:
  1. TMDB data cached in PostgreSQL (24hr expiry for details, 1hr for listings)
  2. Cloudinary image optimization with permanent URL caching
  3. Background job queue for deferred image processing
- tmdbCacheService handles TMDB API response caching
- imageCacheService manages Cloudinary uploads and URL mapping
- cacheQueueService implements priority-based job processing with retry logic

**Background Jobs:**
- Event-driven queue system using Node.js EventEmitter
- Priority-based job scheduling for image caching operations
- Exponential backoff retry mechanism (max 3 retries)
- WebSocket notifications for real-time job status updates

**Real-time Communication:**
- WebSocket server for live updates (cache job progress, notifications)
- Connected clients tracked in memory Set
- Ping/pong heartbeat mechanism for connection health
- Event listeners bridging cache queue to WebSocket broadcasts

### Data Flow

**Content Discovery Flow:**
1. User requests movies/TV shows with filters
2. Backend checks PostgreSQL cache for TMDB data
3. If cache miss or expired, fetch from TMDB API
4. Transform and cache response in database
5. Queue background jobs for image optimization
6. Return cached URLs to frontend
7. WebSocket updates notify of image processing completion

**Authentication Flow (JWT):**
1. User submits credentials to `/api/auth/signin-jwt`
2. Server validates credentials and generates access + refresh tokens
3. Access token (short-lived) sent in response body
4. Refresh token stored hashed in database, sent as httpOnly cookie
5. Client includes access token in Authorization header
6. On expiry, client uses refresh token to get new access token
7. Refresh token rotation on each refresh for security

**User Collection Management:**
- Watchlists stored with many-to-many relationship (user → watchlist → items)
- Favorites use simple user-media mapping table
- Activity history tracks all user actions with timestamps
- Viewing history records watch progress and completion

### External Dependencies

**Primary APIs:**
- **TMDB (The Movie Database):** Core content provider for movies, TV shows, cast, crew, trailers, and reviews. Requires API key and access token. Used for all media discovery and detail endpoints.

**Image & Media:**
- **Cloudinary:** Image hosting, optimization, and transformation. Handles profile pictures and cached movie posters. Requires cloud name, API key, and secret. Optional but recommended for production.

**Communication Services:**
- **SendGrid:** Transactional email delivery for OTP verification and notifications. Requires API key. Optional - system works without email OTP.
- **Twilio:** SMS delivery for phone-based OTP verification. Requires account SID, auth token, and phone number/messaging service. Optional - system works without SMS OTP.

**OAuth Providers (Optional):**
- **Google OAuth 2.0:** Social login via Google accounts (client ID + secret)
- **Facebook Login:** Social login via Facebook (app ID + secret)
- **GitHub OAuth:** Social login via GitHub (client ID + secret)
- **Twitter OAuth 2.0:** Social login via Twitter/X (client ID + secret)

**Database:**
- **PostgreSQL 14+:** Primary data store. Can use Neon (serverless), Supabase, AWS RDS, or self-hosted. Requires connection string in DATABASE_URL.

**Security & Sessions:**
- **JWT Secrets:** Separate secrets for access and refresh tokens (JWT_ACCESS_SECRET, JWT_REFRESH_SECRET)
- **Session Secret:** Used for express-session cookie signing (SESSION_SECRET)
- All secrets should be cryptographically random 32+ character strings

**Development Tools:**
- **Drizzle Kit:** Database schema management and migrations
- **Vitest:** Testing framework for unit, integration, and E2E tests
- **Vite:** Development server with HMR for frontend

**Deployment Considerations:**
- Application can run on any Node.js 20+ environment
- Configured for EC2 deployment with GitHub Actions workflows
- Supports PM2 for process management in production
- Environment variables required for all external services
- TMDB API is the only truly required external dependency