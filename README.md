# CineHub Pro - Movie Discovery Platform

A modern, full-stack movie and TV show discovery platform with advanced filtering, personalized collections, and social features.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Environment Setup](#environment-setup)
- [Database Setup](#database-setup)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Architecture](#architecture)
- [Contributing](#contributing)

## ✨ Features

### Core Features
- **Movie & TV Show Discovery** - Browse trending, popular, upcoming, and top-rated content
- **Advanced Filtering** - Filter by genre, release date, rating, runtime, cast, crew, and more
- **Infinite Scroll** - Smooth infinite scrolling with skeleton loading states
- **Smart Caching** - TMDB data caching with Cloudinary image optimization
- **Search** - Powerful search with filters and sorting options

### User Features
- **Authentication** - Email/password, social login (Google, Facebook, GitHub, X), OTP verification
- **Personalized Collections** - Create and manage watchlists
- **Favorites** - Mark movies and TV shows as favorites
- **Reviews** - Write and read reviews with ratings
- **Viewing History** - Track watched content
- **Activity Feed** - See your recent activities
- **Profile Management** - Update profile, avatar, preferences, and settings

### Admin Features
- **User Management** - View and manage users
- **Platform Analytics** - Track platform statistics
- **Content Moderation** - Review and moderate user-generated content

### Technical Features
- **Real-time Updates** - WebSocket notifications for cache job status
- **Image Processing** - Automatic image upload and optimization to Cloudinary
- **Background Jobs** - Queue-based image caching with priority system
- **Responsive Design** - Mobile-first, fully responsive UI
- **Dark Mode** - Complete dark mode support
- **Accessibility** - WCAG 2.1 compliant with keyboard navigation

## 🚀 Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **Routing**: Wouter (lightweight alternative to React Router)
- **State Management**: TanStack Query (React Query v5) for server state
- **UI Components**: Radix UI primitives
- **Styling**: Tailwind CSS 4 with custom design system
- **Forms**: React Hook Form with Zod validation
- **Animations**: Framer Motion

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES Modules
- **Database**: PostgreSQL (Neon serverless)
- **ORM**: Drizzle ORM with Drizzle Kit for migrations
- **Authentication**: JWT + Session-based (dual mode)
- **File Upload**: Multer + Cloudinary
- **Email**: SendGrid
- **SMS**: Twilio
- **API Integration**: The Movie Database (TMDB) API

### DevOps & Tools
- **Package Manager**: npm
- **Testing**: Vitest with Testing Library
- **Code Quality**: TypeScript strict mode
- **Version Control**: Git

## 🎯 Quick Start

### Prerequisites
- Node.js 20+ and npm
- PostgreSQL database (local or Neon)
- TMDB API key ([Get it here](https://www.themoviedb.org/settings/api))

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd cinehub-pro
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Configure your `.env` file (see [Environment Setup](#environment-setup))

5. Set up the database:
```bash
npm run db:push
```

6. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## 🔧 Environment Setup

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/cinehub

# Session
SESSION_SECRET=your-secret-key-here

# TMDB API
TMDB_API_KEY=your-tmdb-api-key
TMDB_ACCESS_TOKEN=your-tmdb-access-token

# Cloudinary (for image hosting)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# SendGrid (optional - for email)
SENDGRID_API_KEY=your-sendgrid-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# Twilio (optional - for SMS)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=your-phone-number

# OAuth (optional - for social login)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Application
NODE_ENV=development
PORT=5000
```

### Required Services Setup

#### TMDB API
1. Sign up at [themoviedb.org](https://www.themoviedb.org/signup)
2. Go to Settings > API
3. Request an API key
4. Copy both the API Key and Access Token to your `.env`

#### Cloudinary
1. Sign up at [cloudinary.com](https://cloudinary.com/)
2. Get your Cloud Name, API Key, and API Secret from the dashboard
3. Add them to your `.env`

#### SendGrid (Optional)
1. Sign up at [sendgrid.com](https://sendgrid.com/)
2. Create an API key with Mail Send permissions
3. Verify a sender email address
4. Add credentials to your `.env`

#### Twilio (Optional)
1. Sign up at [twilio.com](https://www.twilio.com/)
2. Get a phone number
3. Copy Account SID and Auth Token
4. Add credentials to your `.env`

## 🗄️ Database Setup

### Using PostgreSQL Locally

1. Install PostgreSQL on your system
2. Create a database:
```sql
CREATE DATABASE cinehub;
```

3. Update `DATABASE_URL` in `.env`:
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/cinehub
```

### Using Neon (Recommended)

1. Sign up at [neon.tech](https://neon.tech/)
2. Create a new project
3. Copy the connection string
4. Update `DATABASE_URL` in `.env`

### Run Migrations

```bash
npm run db:push
```

This will create all necessary tables and initial data.

## 📚 API Documentation

Comprehensive API documentation is available in [API.md](./docs/API.md)

### Key Endpoints

#### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signin` - Sign in with credentials
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

#### Movies & TV Shows
- `GET /api/movies/trending` - Get trending movies
- `GET /api/movies/popular` - Get popular movies
- `GET /api/movies/:id` - Get movie details
- `GET /api/movies/discover` - Advanced movie search with filters
- `GET /api/tv/trending` - Get trending TV shows
- `GET /api/tv/:id` - Get TV show details

#### User Collections
- `GET /api/favorites` - Get user favorites
- `POST /api/favorites` - Add to favorites
- `DELETE /api/favorites/:type/:id` - Remove from favorites
- `GET /api/watchlists` - Get user watchlists
- `POST /api/watchlists` - Create watchlist
- `POST /api/watchlists/:id/items` - Add item to watchlist

#### Reviews
- `GET /api/reviews/:type/:id` - Get reviews for media
- `POST /api/reviews` - Create review
- `DELETE /api/reviews/:id` - Delete review

See [API.md](./docs/API.md) for complete documentation.

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Test Structure

```
tests/
├── unit/           # Unit tests for utilities and services
├── integration/    # API integration tests
├── components/     # Component tests
└── e2e/           # End-to-end tests
```

### Writing Tests

Example test:
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MovieCard from '@/components/movie/movie-card';

describe('MovieCard', () => {
  it('renders movie title', () => {
    const movie = { id: 1, title: 'Test Movie' };
    render(<MovieCard movie={movie} />);
    expect(screen.getByText('Test Movie')).toBeInTheDocument();
  });
});
```

## 🚢 Deployment

### Build for Production

```bash
npm run build
```

This creates:
- `dist/client` - Frontend static files
- `dist/index.js` - Backend server bundle

### Run Production Server

```bash
npm start
```

### Deploy to EC2

See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for detailed EC2 deployment instructions with GitHub Actions.

### Environment Variables for Production

Ensure all required environment variables are set:
- Set `NODE_ENV=production`
- Use secure `SESSION_SECRET` (32+ random characters)
- Configure database connection string
- Set up all API keys and OAuth credentials

## 🏗️ Architecture

### Project Structure

```
cinehub-pro/
├── client/                 # Frontend application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities and helpers
│   │   ├── pages/          # Page components
│   │   └── types/          # TypeScript types
│   └── index.html
│
├── server/                 # Backend application
│   ├── services/           # Business logic services
│   │   ├── tmdbCache.ts    # TMDB caching service
│   │   ├── imageCache.ts   # Image processing service
│   │   ├── cacheQueue.ts   # Background job queue
│   │   └── websocket.ts    # WebSocket service
│   ├── utils/              # Utility functions
│   ├── auth.ts             # Authentication logic
│   ├── db.ts               # Database connection
│   ├── routes.ts           # API routes
│   ├── storage.ts          # Data access layer
│   └── index.ts            # Server entry point
│
├── shared/                 # Shared code between client and server
│   └── schema.ts           # Database schema and types
│
├── docs/                   # Documentation
│   ├── API.md              # API documentation
│   └── DEPLOYMENT.md       # Deployment guide
│
├── tests/                  # Test files
│   ├── unit/
│   ├── integration/
│   └── components/
│
└── .github/                # GitHub configuration
    └── workflows/
        └── deploy.yml      # CI/CD workflow
```

### Data Flow

1. **Client Request** → React component triggers query
2. **TanStack Query** → Manages caching and request state
3. **API Routes** → Express handles request
4. **TMDB Cache Check** → Check if data exists in cache
5. **TMDB API Call** → Fetch from TMDB if not cached
6. **Background Caching** → Queue image processing job
7. **Response** → Send data to client immediately
8. **WebSocket** → Notify client when caching completes

### Caching Strategy

1. **TMDB Data Cache** (PostgreSQL)
   - Movies, TV shows, and people cached for 24 hours
   - Listings cached for 1 hour
   - Automatic background refresh

2. **Image Cache** (Cloudinary)
   - Images uploaded to Cloudinary on first request
   - Cloudinary URLs stored in database
   - Subsequent requests use optimized Cloudinary URLs

3. **Browser Cache** (TanStack Query)
   - API responses cached in browser memory
   - Configurable stale time and cache time
   - Automatic background refetching

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript strict mode
- Write tests for new features
- Update documentation as needed
- Follow the existing code style
- Keep components small and focused
- Use semantic commit messages

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [The Movie Database (TMDB)](https://www.themoviedb.org/) for the amazing API
- [Radix UI](https://www.radix-ui.com/) for accessible components
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Cloudinary](https://cloudinary.com/) for image hosting and optimization

## 📧 Support

For support, email support@cinehubpro.com or join our [Discord community](https://discord.gg/cinehubpro).

## 🔗 Links

- [Live Demo](https://cinehubpro.com)
- [Documentation](./docs)
- [API Reference](./docs/API.md)
- [Changelog](./CHANGELOG.md)
