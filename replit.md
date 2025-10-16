# CineHub Pro - Movie Discovery Platform

## Overview

CineHub Pro is a full-stack movie discovery platform that allows users to browse, search, and manage their movie and TV show collections. The application provides features for creating personal watchlists, favoriting content, rating and reviewing movies, and discovering trending content through integration with The Movie Database (TMDB) API.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### Dashboard Quick Actions & Trending Enhancements (October 16, 2025)
Enhanced the dashboard page with clickable Quick Actions and functional trending item buttons for better user interaction.

**Quick Actions - Insights Section:**
- Fixed Quick Actions buttons to be properly clickable using the `asChild` pattern
- "Browse Movies" button now correctly navigates to /movies page
- "Browse TV" button now correctly navigates to /tv-shows page
- Maintained consistent button styling while enabling proper navigation

**Trending This Week - Interactive Buttons:**
- Added "Add to Favorites" button on hover for trending movies and TV shows
- Added "Add to Watchlist" button on hover for trending movies and TV shows
- Implemented proper event handling with `stopPropagation()` to prevent card navigation conflicts
- Created watchlist selection dialog for choosing which watchlist to add items to
- Added activity history tracking for favorite additions and watchlist updates
- Included proper error handling and success toast notifications

**Technical Implementation:**
- Added `addToFavoritesMutation` with full error handling and activity tracking
- Added `addToWatchlistMutation` with watchlist selection flow
- Created reusable watchlist selection dialog component
- Implemented proper state management for trending item selection
- All mutations follow the project's established patterns with proper cache invalidation

### UI Redesign - Movies & TV Shows Pages (October 16, 2025)
Redesigned the movies and TV shows pages with a modern, cleaner interface while maintaining all existing functionality.

**Visual Design Changes:**
- **Compact Hero Section**: Replaced large gradient header with streamlined design featuring icon badges and improved typography
- **Modern Stats Cards**: Added glass-morphism effect stats cards with subtle gradient hover animations showing results count and active filter count
- **Icon Badges**: Category icons now displayed in gradient-bordered cards next to page titles
- **Improved Spacing**: Reduced vertical spacing between header and content for better content density
- **Enhanced Layout**: Better responsive design with improved mobile and tablet layouts

**Bug Fixes:**
- Fixed nested button error in FilterChip component that was causing React hook violations
- Changed remove button from `motion.button` to accessible `motion.span` with proper ARIA roles
- Added keyboard support (Enter/Space) for filter chip removal for accessibility

**Technical Details:**
- All filtering, sorting, and infinite scroll functionality remains intact
- No changes to data fetching or state management logic
- Purely presentational layer updates
- Improved accessibility with proper keyboard navigation

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

### Comprehensive TMDB Discover API Implementation (October 2025)
Enhanced the TMDB Discover API integration to support ALL available filters for both movies and TV shows, enabling complex filtering combinations.

**Backend Enhancements:**
- **Enhanced TypeScript Interfaces**: Added comprehensive `MovieDiscoverParams` and `TVDiscoverParams` interfaces in `server/utils/tmdbDiscover.ts` covering all TMDB filter options
- **Bearer Token Authentication**: Updated `fetchFromTMDB` to support Bearer token authentication (TMDB_ACCESS_TOKEN) with fallback to API key
- **Comprehensive Discover Endpoints**: Enhanced `/api/movies/discover` and `/api/tv/discover` to accept all TMDB filter parameters:
  - **Movies**: genres, keywords, cast, crew, people, companies, release types, certifications (including .lte), date filters, runtime, ratings, language, region, streaming providers
  - **TV Shows**: genres, keywords, networks, companies, date filters, runtime, ratings, language, streaming providers, TV-specific filters (status, type, screened_theatrically, timezone)
- **Removed Duplicate Endpoints**: Cleaned up duplicate discover endpoints to ensure the comprehensive versions are used

**Frontend Enhancements:**
- **Enhanced Hooks**: Updated `useDiscoverMovies` and `useDiscoverTvShows` hooks with comprehensive filter support via `MovieDiscoverParams` and `TVDiscoverParams`
- **Custom Filter Hooks**: Added `useDiscoverMoviesCustom` and `useDiscoverTvShowsCustom` for full parameter control
- **Helper Functions**: Added `buildMovieFilters` and `buildTVFilters` for creating filter objects with sensible defaults
- **Example Page**: Created `/discover-examples` page demonstrating real-world filter combinations:
  * Upcoming Movies in India (region + date + release type filters)
  * Highly Rated Sci-Fi Movies (genre + rating + vote count filters)
  * Family-Friendly Animated Movies (genre OR logic + certification filters)
  * Currently Airing TV Shows (date range filters)
  * Top Rated Dramas (genre + rating + vote count filters)
  * Trending Netflix Originals (network + date filters)

**Filter Logic:**
- Supports OR logic with `|` (pipe) and AND logic with `,` (comma) as per TMDB API specification
- Example: `with_genres=16|10751` means Animation OR Family
- Example: `with_cast=500,190` means Leonardo DiCaprio AND Samuel L. Jackson

**Available Filters:**
- **Movies**: with_genres, without_genres, with_keywords, without_keywords, with_cast, with_crew, with_people, with_companies, with_release_type, certification, certification.gte, certification.lte, primary_release_date.gte/lte, release_date.gte/lte, vote_average.gte/lte, vote_count.gte/lte, with_runtime.gte/lte, with_original_language, region, watch_region, with_watch_providers, with_watch_monetization_types, include_adult, include_video
- **TV Shows**: with_genres, without_genres, with_keywords, without_keywords, with_networks, with_companies, with_status, with_type, first_air_date.gte/lte, air_date.gte/lte, vote_average.gte/lte, vote_count.gte/lte, with_runtime.gte/lte, with_original_language, watch_region, with_watch_providers, with_watch_monetization_types, include_adult, include_null_first_air_dates, screened_theatrically, timezone

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