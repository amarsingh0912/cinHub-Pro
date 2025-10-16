# CineHub Pro - Movie Discovery Platform

## Overview

CineHub Pro is a full-stack movie discovery platform designed for browsing, searching, and managing movie and TV show collections. It enables users to create watchlists, favorite content, rate and review media, and discover trending content through integration with The Movie Database (TMDB) API. The project aims to provide a comprehensive and engaging experience for media enthusiasts.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, built using Vite
- **Routing**: Wouter for client-side routing
- **UI Framework**: Radix UI components with Tailwind CSS for styling
- **State Management**: TanStack Query (React Query) for server state and caching
- **Design System**: shadcn/ui component library with dark theme support
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with proxy endpoints for TMDB integration
- **Authentication**: Replit Auth with OpenID Connect (OIDC)
- **Session Management**: Express sessions with PostgreSQL storage using connect-pg-simple
- **Error Handling**: Centralized error handling middleware

### Data Storage Solutions
- **Primary Database**: PostgreSQL with Neon serverless hosting
- **ORM**: Drizzle ORM for type-safe database operations and schema management
- **Schema Design**: Relational database with tables for users, watchlists, favorites, reviews, and sessions
- **Migrations**: Drizzle Kit for database schema migrations

### Authentication and Authorization
- **Provider**: Replit Auth integration
- **Session Storage**: PostgreSQL-backed session store
- **User Management**: Support for user profiles, preferences, and admin roles
- **Security**: HTTP-only cookies, CSRF protection, and secure session handling

### UI/UX Decisions
- Modern, clean interface with compact hero sections, glass-morphism effect stats cards, and icon badges.
- Responsive design with custom Tailwind breakpoints for optimal viewing on various devices.
- Client-side sorting for search results to reduce API calls.
- Viewport-aware skeleton loading for improved perceived performance during infinite scroll.
- Enhanced accessibility with keyboard support for interactive elements.

### Technical Implementations & Feature Specifications
- **TMDB Discover API Refactoring**: Unified data fetching using TMDB Discover API for both movies and TV shows, replacing category-specific endpoints.
- **Comprehensive TMDB Filter Support**: Implementation of all available TMDB filters for complex movie and TV show searches, supporting both OR (`|`) and AND (`,`) logic.
- **Dashboard Enhancements**: Clickable Quick Actions and interactive "Add to Favorites"/"Add to Watchlist" buttons on trending items.
- **Activity Tracking**: Implemented activity history for favorite additions and watchlist updates.
- **Infinite Scroll Skeleton Optimization** (October 2025): Fixed movie-grid skeleton rendering to fill incomplete rows during infinite scroll loading instead of starting new rows. Skeletons now calculate based on grid columns (responsive breakpoints: 2 on mobile, 3 on sm, 4 on md, 6 on lg) and render the correct number to complete the current row or show a full new row when the previous row is complete. All skeleton cards include proper accessibility attributes (role="status", aria-hidden="true").

## External Dependencies

- **Movie Data**: The Movie Database (TMDB) API
- **Database Hosting**: Neon serverless PostgreSQL
- **Authentication**: Replit's OIDC authentication service
- **UI Components**: Radix UI primitives, shadcn/ui
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Development**: Vite