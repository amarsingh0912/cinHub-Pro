# CineHub Pro

## Overview

CineHub Pro is a modern, full-stack movie and TV show discovery platform built with React, Express, and PostgreSQL. The application provides users with comprehensive movie browsing, personalized collections, social features like reviews and ratings, and real-time updates. It integrates with The Movie Database (TMDB) API for content data and uses Cloudinary for optimized image delivery.

## Recent Changes

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