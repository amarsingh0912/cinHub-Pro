# CineHub Pro - Movie Discovery Platform

## Overview

CineHub Pro is a full-stack movie discovery platform that allows users to browse, search, and manage their movie and TV show collections. The application provides features for creating personal watchlists, favoriting content, rating and reviewing movies, and discovering trending content through integration with The Movie Database (TMDB) API.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### Codebase Cleanup (October 2025)
The following unused code and files were removed to improve maintainability and reduce bundle size:

**Frontend:**
- Removed 15 unused filter component files from `client/src/components/filters/` directory (kept only `PeopleAutocomplete.tsx` which is actively used)
- Removed 3 unused filter hooks: `use-filter-presets.ts`, `use-filter-result-count.ts`, `use-undo-reset.ts`

**Backend:**
- Removed unused `imageCache` service from `server/services/`
- Cleaned up corresponding imports in `server/routes.ts`
- Fixed security issue: Removed plaintext TMDB API key logging in development mode

**Other Files:**
- Removed development/testing files: `cookies.txt`, `trailer_modal.png`
- Cleaned up pasted design documents from `attached_assets/` directory

**Note:** All schema tables, active services (tmdbCache, cacheQueue, websocketService, cloudinaryService, otpService), and core functionality remain intact and fully operational.

### TMDB Discover API Refactoring (October 2025)
Refactored data fetching logic to use the unified TMDB Discover API for both Movies and TV Shows, replacing category-specific endpoints with dynamic, reusable API functions.

**Backend Changes:**
- Created `server/utils/tmdbDiscover.ts` with utility functions (`buildMovieDiscoverParams`, `buildTVDiscoverParams`) to generate discover API parameters for each category
- Refactored all movie endpoints (popular, upcoming, now_playing, top-rated) to use `/discover/movie` with category-specific parameters
- Refactored all TV endpoints (popular, airing_today, on-the-air, top-rated) to use `/discover/tv` with category-specific parameters
- Trending endpoints intentionally kept using original `/trending/` API for more accurate trending data

**Frontend Changes:**
- Created TypeScript types for discover parameters and categories in `client/src/types/tmdb.ts`
- Created React Query hooks (`useDiscoverMovies`, `useDiscoverTvShows`) for simplified data fetching
- All hooks properly typed with category-specific return types

**Key Implementation Details:**
- All discover endpoints include standard filters: `language=en-US`, `region=IN`, `include_adult=false`
- Movies include `with_release_type=2|3` for theatrical releases
- Upcoming uses `primary_release_date.gte` with current date
- Now playing uses 30-day date range with `primary_release_date.lte/gte`
- Top-rated uses `vote_count.gte` (500 for movies, 200 for TV) with `sort_by=vote_average.desc`
- Airing today uses 7-day forward date range with `air_date.gte/lte`

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, built using Vite
- **Routing**: Wouter for client-side routing with conditional rendering based on authentication
- **UI Framework**: Radix UI components with Tailwind CSS for styling
- **State Management**: TanStack Query (React Query) for server state and caching
- **Design System**: shadcn/ui component library with dark theme support
- **Forms**: React Hook Form with Zod validation for type-safe form handling

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with proxy endpoints for TMDB integration
- **Authentication**: Replit Auth with OpenID Connect (OIDC) for secure user authentication
- **Session Management**: Express sessions with PostgreSQL storage using connect-pg-simple
- **Error Handling**: Centralized error handling middleware with structured logging

### Data Storage Solutions
- **Primary Database**: PostgreSQL with Neon serverless hosting
- **ORM**: Drizzle ORM for type-safe database operations and schema management
- **Schema Design**: Relational database with tables for users, watchlists, favorites, reviews, and sessions
- **Migrations**: Drizzle Kit for database schema migrations and versioning

### Authentication and Authorization
- **Provider**: Replit Auth integration with mandatory user operations
- **Session Storage**: PostgreSQL-backed session store with configurable TTL
- **User Management**: Support for user profiles, preferences, and admin roles
- **Security**: HTTP-only cookies, CSRF protection, and secure session handling

### External Dependencies
- **Movie Data**: The Movie Database (TMDB) API for movie and TV show information
- **Database Hosting**: Neon serverless PostgreSQL
- **Authentication**: Replit's OIDC authentication service
- **UI Components**: Radix UI primitives for accessible components
- **Styling**: Tailwind CSS with custom design tokens and Lucide React icons
- **Development**: Vite with hot module replacement and TypeScript support

The architecture follows a modern full-stack pattern with clear separation of concerns, type safety throughout the stack, and scalable data management. The application supports both authenticated and unauthenticated users with different feature sets, and includes admin functionality for user management and analytics.

## Local Development Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn package manager
- PostgreSQL database (local or remote)

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd cinehub-pro
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Configuration:**
   Create a `.env` file in the root directory with the required variables:
   ```env
   # Required
   DATABASE_URL=your_postgresql_connection_string
   TMDB_API_KEY=your_tmdb_api_key
   
   # Required for JWT authentication
   JWT_ACCESS_SECRET=your_jwt_access_secret
   JWT_REFRESH_SECRET=your_jwt_refresh_secret
   
   # Required in production
   SESSION_SECRET=your_session_secret_key
   
   # Optional OAuth providers (leave blank if not using)
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   
   # Development only
   NODE_ENV=development
   ```

4. **Database Setup:**
   ```bash
   # Push the database schema to your PostgreSQL database
   npm run db:push
   ```

5. **Start Development Server:**
   ```bash
   npm run dev
   ```
   This starts both the Express backend and Vite frontend on port 5000.

6. **Access the Application:**
   Open your browser and navigate to `http://localhost:5000`

### Additional Commands
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run check` - Run TypeScript type checking
- `npm run db:push` - Push database schema changes

### External Services Setup
- **TMDB API**: Register at [The Movie Database](https://www.themoviedb.org/settings/api) to get your API key
- **PostgreSQL**: Use a local PostgreSQL instance or services like Neon, Supabase, or PlanetScale

### Troubleshooting
- If you encounter build issues, clear node_modules and reinstall dependencies
- Ensure your PostgreSQL database is accessible and the connection string is correct
- Check that all environment variables are properly set
- For development, the app runs on port 5000 by default