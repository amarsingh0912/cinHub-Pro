# CineHub Pro - Movie Discovery Platform

## Overview

CineHub Pro is a full-stack movie discovery platform that allows users to browse, search, and manage their movie and TV show collections. The application provides features for creating personal watchlists, favoriting content, rating and reviewing movies, and discovering trending content through integration with The Movie Database (TMDB) API.

## User Preferences

Preferred communication style: Simple, everyday language.

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
- **Styling**: Tailwind CSS with custom design tokens and Font Awesome icons
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
   Create a `.env` file in the root directory with the following variables:
   ```env
   DATABASE_URL=your_postgresql_connection_string
   TMDB_API_KEY=your_tmdb_api_key
   REPLIT_ID=your_replit_id
   SESSION_SECRET=your_session_secret_key
   NODE_ENV=development
   ```

4. **Database Setup:**
   ```bash
   # Push the database schema
   npm run db:push
   
   # Optional: Seed the database with initial data
   npm run db:seed
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
- `npm run preview` - Preview the production build locally
- `npm run db:studio` - Open Drizzle Studio for database management
- `npm run lint` - Run ESLint for code quality checks
- `npm run type-check` - Run TypeScript type checking

### External Services Setup
- **TMDB API**: Register at [The Movie Database](https://www.themoviedb.org/settings/api) to get your API key
- **PostgreSQL**: Use a local PostgreSQL instance or services like Neon, Supabase, or PlanetScale

### Troubleshooting
- If you encounter build issues, clear node_modules and reinstall dependencies
- Ensure your PostgreSQL database is accessible and the connection string is correct
- Check that all environment variables are properly set
- For development, the app runs on port 5000 by default