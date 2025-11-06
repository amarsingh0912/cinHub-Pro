# CineHub Pro - Movie Discovery Platform

## Project Overview
CineHub Pro is a full-stack movie and TV show discovery platform built with React, TypeScript, and Express. It features personalized collections, advanced filtering, social features, and a zero-cost recommendations engine.

**Current State**: ✅ Fully functional and running on Replit
- Frontend: React 18 with Vite
- Backend: Express.js with TypeScript
- Database: PostgreSQL (Neon Serverless)
- Server URL: http://localhost:5000

## Recent Changes
- **2025-11-06**: Implemented Server-Side Rendering (SSR) + Updated Deployment
  - Added Vite SSR support with dual builds (client + server)
  - Created SSR entry points (entry-client.tsx, entry-server.tsx)
  - Integrated SSR renderer module for production
  - Updated build scripts for SSR workflow
  - Development uses client-side rendering, production uses SSR
  - **Updated GitHub Actions workflow** for SSR deployment:
    - Added build verification step for SSR bundles
    - Enhanced deployment verification with SSR health checks
    - Updated PM2 restart to ensure NODE_ENV=production for SSR
    - Added server-rendered content validation
  - See `docs/SSR_IMPLEMENTATION.md` for SSR details
  
- **2025-11-03**: Migrated from GitHub import to Replit environment
  - Set up PostgreSQL database connection
  - Configured all required API secrets (TMDB, Cloudinary, JWT, Session)
  - Converted `server/recs-api.cjs` from CommonJS to ESM format for production build compatibility
  - Configured deployment settings for autoscale
  - All workflows running successfully

## Architecture

### Tech Stack
**Frontend:**
- React 18 with TypeScript
- Vite 5 with SSR support (Server-Side Rendering in production)
- Wouter for routing
- TanStack Query (React Query) for server state management
- Radix UI components
- Tailwind CSS 4 for styling
- Framer Motion for animations

**Backend:**
- Node.js 20+ with Express.js
- TypeScript with ES Modules
- PostgreSQL with Drizzle ORM
- JWT + Session-based dual authentication
- Cloudinary for image storage
- TMDB API for movie data
- Better-sqlite3 for local recommendations database

**DevOps:**
- Deployment: Replit Autoscale
- Database: PostgreSQL (Neon Serverless via Replit)
- Testing: Vitest + Cypress

### Key Features
1. **Movie & TV Discovery** - Browse trending, popular, and top-rated content
2. **Advanced Filtering** - Filter by genre, release date, rating, cast, crew
3. **User Authentication** - Email/password, OAuth (Google, Facebook, GitHub, X), OTP verification
4. **Personalized Collections** - Watchlists and favorites
5. **Reviews & Ratings** - User-generated content with moderation
6. **Smart Caching** - TMDB data caching with Cloudinary image optimization
7. **Zero-Cost Recommendations** - Local SQLite-based recommendation engine
8. **Real-time Updates** - WebSocket notifications
9. **Admin Dashboard** - User management and platform analytics

### Project Structure
```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom hooks
│   │   ├── lib/            # Utilities
│   │   ├── pages/          # Page components
│   │   └── types/          # TypeScript types
│   └── index.html
│
├── server/                 # Express backend
│   ├── services/           # Business logic
│   ├── auth.ts             # Authentication
│   ├── db.ts               # Database connection
│   ├── routes.ts           # API routes
│   ├── storage.ts          # Data access layer
│   ├── recs-api.ts         # Recommendations API (ESM)
│   ├── tmdb-sync.cjs       # TMDB sync service
│   ├── seed.cjs            # Database seeder
│   └── index.ts            # Server entry point
│
├── shared/                 # Shared types and schemas
│   └── schema.ts           # Drizzle database schema
│
├── tests/                  # Test files
│   ├── unit/
│   ├── integration/
│   └── components/
│
└── docs/                   # Comprehensive documentation
```

## Environment Configuration

### Required Secrets (Already Configured)
All secrets are stored in Replit Secrets and available as environment variables:
- `DATABASE_URL` - PostgreSQL connection (auto-configured by Replit)
- `TMDB_API_KEY` - The Movie Database API key
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret
- `JWT_ACCESS_SECRET` - JWT access token secret
- `JWT_REFRESH_SECRET` - JWT refresh token secret
- `SESSION_SECRET` - Express session secret

### Optional Secrets (Not Required for Basic Functionality)
- `SENDGRID_API_KEY` - For email OTP verification
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` - For SMS OTP
- OAuth credentials for Google, Facebook, GitHub, Twitter

### Default Admin User
- Username: `admin`
- Email: `admin@example.com`
- Password: `admin123`

## Development Workflow

### Running the Application
The development server is already configured and running:
- Command: `npm run dev`
- Port: 5000 (frontend + backend)
- Workflow: `dev-server` (auto-restarts on changes)

### Database Management
```bash
# Push schema changes to database
npm run db:push

# Force push (if schema conflicts)
npm run db:push --force
```

**Important**: Database schema is defined in `shared/schema.ts` using Drizzle ORM. Never write manual SQL migrations - always use `npm run db:push`.

### Testing
```bash
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # With coverage report
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests
npm run cypress            # E2E tests
```

### Build for Production
```bash
npm run build              # Build client + SSR server + backend
npm run build:client       # Build client bundle only
npm run build:server       # Build SSR server bundle only
npm run build:backend      # Build backend only
npm start                  # Run production server with SSR
```

## Important Notes

### ESM Conversion
The recommendations API (`server/recs-api.ts`) was converted from CommonJS to ES Modules to ensure production builds work correctly. This fixes the "Dynamic require of express is not supported" error that occurs when bundling with esbuild.

**Migration Pattern:**
- `const express = require('express')` → `import express from 'express'`
- `module.exports = router` → `export default router`
- `__dirname` → `import.meta.dirname`

### Vite Configuration
The Vite dev server is configured with `allowedHosts: true` to work with Replit's proxy environment. This allows the frontend to be accessible through Replit's web preview.

### Port Configuration
- **Frontend/Backend**: Port 5000 (required for Replit webview)
- **Host**: 0.0.0.0 (binds to all interfaces for Replit access)

### Database Schema Updates
When modifying the database:
1. Update `shared/schema.ts` with new Drizzle models
2. Run `npm run db:push` to sync changes
3. If conflicts occur, use `npm run db:push --force`
4. Never change existing ID column types (serial ↔ varchar)

## Deployment

### Replit Deployment (Configured)
The project is configured for Replit Autoscale deployment:
- Build: `npm run build`
- Run: `npm start`
- Type: Autoscale (stateless web application)

To deploy:
1. Click the "Deploy" button in Replit
2. All environment secrets are already configured
3. The build process will bundle both frontend and backend

### Environment Variables in Production
All required secrets are automatically available in production through Replit Secrets.

## Troubleshooting

### Common Issues

**Server won't start:**
- Check logs for missing environment variables
- Verify database connection with `env | grep DATABASE_URL`
- Ensure all required secrets are configured

**Build fails:**
- Ensure all `.cjs` files in server/ are converted to ESM
- Check for CommonJS `require()` statements in bundled code
- Verify TypeScript compilation with `npm run check`

**Database errors:**
- Run `npm run db:push` to sync schema
- Check PostgreSQL connection in Replit database panel
- Verify DATABASE_URL is correctly set

**Frontend not loading:**
- Verify workflow is running on port 5000
- Check Vite config has `allowedHosts: true`
- Clear browser cache and hard reload

## Resources

### Documentation
- **Complete Docs**: `/docs` directory
- **API Reference**: `/docs/API.md`
- **Database Schema**: `/docs/DATABASE_SCHEMA.md`
- **Architecture**: `/docs/ARCHITECTURE.md`
- **SSR Implementation**: `/docs/SSR_IMPLEMENTATION.md`
- **Testing Guide**: `TESTING.md`

### External Services
- **TMDB API**: https://www.themoviedb.org/settings/api
- **Cloudinary**: https://console.cloudinary.com/
- **Neon Database**: https://console.neon.tech/

### Support
For issues or questions:
1. Check the comprehensive `/docs` folder
2. Review application flow diagrams in `/docs/APPLICATION_FLOW.md`
3. Check GitHub issues or README.md

## Quick Commands
```bash
# Development
npm run dev                 # Start dev server
npm run db:push            # Sync database schema

# Testing
npm test                   # Run tests
npm run test:coverage      # With coverage

# Production
npm run build              # Build for production
npm start                  # Run production server

# Database Seeding (Optional)
cd server
node seed.cjs              # Seed recommendations DB
node precompute.cjs        # Precompute recommendations
```

---

**Last Updated**: 2025-11-06
**Status**: ✅ Production Ready with SSR
**Deployed**: Replit Environment
