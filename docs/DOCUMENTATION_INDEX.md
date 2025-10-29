# CineHub Pro - Documentation Index

Complete guide to all project documentation.

## 📚 Quick Start

- **[README](../README.md)** - Project overview, features, and quick start guide
- **[Setup Guide](SETUP.md)** - Detailed installation and configuration instructions
- **[Developer Guide](DEVELOPER_GUIDE.md)** - Developer workflow and best practices

## 🏗️ Architecture & Design

- **[Architecture](ARCHITECTURE.md)** - System architecture, data flow, and design patterns
- **[API Documentation](API.md)** - Complete REST API reference with examples
- **[Database Schema](DATABASE_SCHEMA.md)** - Complete database documentation with ERD diagrams
- **[Folder Structure](FOLDER_STRUCTURE.md)** - Project organization and file structure guide
- **[Shared Schema](../shared/schema.ts)** - Database models and TypeScript types

## 🧪 Testing

- **[Testing Guide](TESTING.md)** - Testing strategy, stack, and how to write tests
- **[Testing Notes](TESTING_NOTES.md)** - Testing recommendations and coverage goals

### Test Suites

- **Unit Tests** (`tests/unit/`)
  - `auth.test.ts` - Authentication utilities
  - `image-cache.test.ts` - Image caching service
  - `otp-service.test.ts` - OTP generation and verification
  - `tmdb-cache.test.ts` - TMDB data caching
  - `tmdb-discover.test.ts` - TMDB discovery endpoints
  - `websocket.test.ts` - WebSocket service
  - `cloudinary-service.test.ts` - Cloudinary integration (NEW)
  - `cache-queue.test.ts` - Background job queue (NEW)

- **Integration Tests** (`tests/integration/`)
  - `auth-api.test.ts` - Authentication endpoints
  - `movies-api.test.ts` - Movie endpoints
  - `reviews-api.test.ts` - Review system
  - `user-collections.test.ts` - User collections
  - `watchlists-api.test.ts` - Watchlist functionality
  - `websocket-integration.test.ts` - Real-time features
  - `cloudinary-service.test.ts` - Image upload integration
  - `admin-api.test.ts` - Admin endpoints
  - `activity-history-api.test.ts` - Activity tracking
  - `tmdb-api.test.ts` - TMDB integration

- **Component Tests** (`tests/components/`)
  - `auth-modal.test.tsx` - Authentication modal
  - `filter-components.test.tsx` - Filter UI components
  - `footer.test.tsx` - Footer component
  - `header.test.tsx` - Header/navigation
  - `hero-section.test.tsx` - Hero section
  - `movie-card.test.tsx` - Movie card component
  - `search-modal.test.tsx` - Search modal
  - `category-grid.test.tsx` - Category grid (NEW)
  - `featured-collections.test.tsx` - Featured collections (NEW)
  - `trailer-modal.test.tsx` - Trailer modal (NEW)
  - `movie-grid.test.tsx` - Movie grid (NEW)
  - `movie-grid-skeleton.test.tsx` - Loading skeletons (NEW)
  - `cast-card-skeleton.test.tsx` - Cast card skeletons (NEW)

- **E2E Tests** (`tests/e2e/`)
  - `authentication-flow.test.ts` - Full auth flow
  - `review-posting.test.ts` - Review creation
  - `watchlist-management.test.ts` - Watchlist operations

## 🚀 Deployment

- **[Deployment Guide](DEPLOYMENT.md)** - Complete deployment guide for production
- **[EC2 Deployment](DEPLOYMENT_EC2.md)** - Amazon EC2 deployment specifics
- **[Amazon Linux Deployment](DEPLOY_AMAZON_LINUX.md)** - Amazon Linux 2 setup
- **[GitHub Actions](GITHUB_ACTIONS.md)** - CI/CD workflow configuration
- **[Environment Variables](ENVIRONMENT_VARIABLES.md)** - All environment configuration (NEW)

### Deployment Scripts

- **[Health Check Script](../scripts/health-check.sh)** - Production health verification (NEW)
- **[Deployment Verify](../scripts/deployment-verify.sh)** - Comprehensive deployment validation (NEW)

### GitHub Workflows

- `.github/workflows/deploy-ec2.yml` - EC2 deployment automation
- `.github/workflows/deploy-amazon-linux-ec2.yml` - Amazon Linux specific
- `.github/workflows/test.yml` - Automated testing

## 📝 Development Guidelines

- **[Code Documentation Standards](CODE_DOCUMENTATION.md)** - JSDoc and inline documentation guide (NEW)
- **[Contributing Guidelines](CONTRIBUTING.md)** - How to contribute to the project
- **[Security Policy](SECURITY.md)** - Security guidelines and reporting

## 👥 User Documentation

- **[User Guide](USER_GUIDE.md)** - Complete end-user guide
- **[FAQ](FAQ.md)** - Frequently asked questions
- **[Troubleshooting](TROUBLESHOOTING.md)** - Common issues and solutions

## 🔧 Configuration Files

### Environment Configuration
- `.env.example` - Example environment variables
- `drizzle.config.ts` - Database configuration
- `vite.config.ts` - Frontend build configuration
- `vitest.config.ts` - Test runner configuration
- `tailwind.config.ts` - Styling configuration

### Project Metadata
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration

## 📊 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout
- `POST /api/auth/request-otp` - Request OTP code
- `POST /api/auth/verify-otp` - Verify OTP code

### Movies & TV Shows
- `GET /api/movies/trending` - Trending movies
- `GET /api/movies/popular` - Popular movies
- `GET /api/movies/upcoming` - Upcoming releases
- `GET /api/movies/top-rated` - Top rated movies
- `GET /api/movies/:id` - Movie details
- `GET /api/movies/discover` - Advanced search/filter
- `GET /api/tv/trending` - Trending TV shows
- `GET /api/tv/popular` - Popular TV shows

### User Collections
- `GET /api/watchlists` - User watchlists
- `POST /api/watchlists` - Create watchlist
- `POST /api/watchlists/:id/items` - Add to watchlist
- `GET /api/favorites` - User favorites
- `POST /api/favorites` - Add favorite
- `GET /api/reviews` - User reviews
- `POST /api/reviews` - Create review

### Admin
- `GET /api/admin/users` - List all users
- `GET /api/admin/stats` - Platform statistics
- `GET /api/admin/reviews` - All reviews (moderation)

## 🔐 Security

### Authentication Methods
- Email/Password with bcrypt hashing
- JWT-based access tokens
- Refresh token rotation
- Session-based fallback
- OAuth 2.0 (Google, Facebook, GitHub, X)
- OTP verification (email/SMS)

### Security Features
- HTTPS enforcement in production
- Secure session cookies (httpOnly, sameSite)
- Rate limiting on API endpoints
- CORS configuration
- SQL injection prevention (Drizzle ORM)
- XSS protection (React escaping)
- CSRF protection (session cookies)

## 📈 Performance

### Caching Strategy
- TMDB data caching (1 hour TTL)
- Cloudinary image optimization
- Background job queue for image caching
- Database query optimization
- API response compression

### Monitoring
- PM2 process management
- Health check endpoints
- Error logging
- Performance metrics
- WebSocket status monitoring

## 🛠️ Development Tools

### Scripts
```bash
# Development
npm run dev          # Start dev server
npm run check        # TypeScript check
npm run build        # Build for production

# Testing
npm test             # Run all tests
npm run test:watch   # Watch mode
npm run test:unit    # Unit tests only
npm run test:integration  # Integration tests
npm run test:components   # Component tests
npm run test:e2e     # E2E tests
npm run test:coverage     # Coverage report

# Database
npm run db:push      # Push schema changes
npm run db:studio    # Open Drizzle Studio

# Deployment
npm start            # Start production server
```

### VSCode Extensions
- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- Tailwind CSS IntelliSense
- GitLens
- Thunder Client (API testing)

## 📦 Tech Stack

### Frontend
- React 18 with TypeScript
- Vite 5 (build tool)
- Wouter (routing)
- TanStack Query (state management)
- Radix UI (component primitives)
- Tailwind CSS 4 (styling)
- Framer Motion (animations)

### Backend
- Node.js with Express.js
- TypeScript with ES Modules
- PostgreSQL (Neon serverless)
- Drizzle ORM
- JWT + Session authentication
- Multer + Cloudinary (file uploads)
- SendGrid (email)
- Twilio (SMS)

### DevOps
- GitHub Actions (CI/CD)
- PM2 (process management)
- Nginx (reverse proxy)
- Docker (optional)
- AWS EC2 (hosting)

## 🔗 External Services

### Required
- [TMDB API](https://www.themoviedb.org/settings/api) - Movie/TV data
- [Neon](https://neon.tech/) - PostgreSQL database

### Optional
- [Cloudinary](https://cloudinary.com/) - Image hosting
- [SendGrid](https://sendgrid.com/) - Email delivery
- [Twilio](https://www.twilio.com/) - SMS delivery
- OAuth providers (Google, Facebook, GitHub, X)

## 📞 Support & Community

- **GitHub Issues**: [Report bugs and request features](https://github.com/yourusername/cinehub-pro/issues)
- **GitHub Discussions**: [Ask questions and share ideas](https://github.com/yourusername/cinehub-pro/discussions)
- **Discord**: [Join our community](https://discord.gg/cinehubpro)
- **Email**: support@cinehubpro.com

## 📝 Change Log & Roadmap

- **[Changelog](../CHANGELOG.md)** - Version history and release notes
- **[Future Enhancements](FUTURE_ENHANCEMENTS.md)** - Roadmap and planned features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

---

## Recent Updates

### Latest Additions (Current Release)

**Testing Enhancements:**
- ✅ Added 6 new component tests (category-grid, featured-collections, trailer-modal, movie-grid, skeletons)
- ✅ Added 2 new unit tests (cloudinary-service, cache-queue)
- ✅ Improved test coverage across UI components and services

**Documentation:**
- ✅ Created comprehensive Environment Variables guide
- ✅ Created Code Documentation Standards guide
- ✅ This Documentation Index for easy navigation

**Deployment:**
- ✅ Added production health check script
- ✅ Added deployment verification script
- ✅ Enhanced EC2 workflow documentation

---

**Last Updated**: October 16, 2025
