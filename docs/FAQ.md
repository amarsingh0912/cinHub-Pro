# Frequently Asked Questions (FAQ)

Common questions and answers about CineHub Pro.

## Table of Contents

- [General](#general)
- [Getting Started](#getting-started)
- [Features](#features)
- [Technical](#technical)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## General

### What is CineHub Pro?

CineHub Pro is a modern, full-stack movie and TV show discovery platform that allows users to browse, search, and manage their favorite content. It features advanced filtering, personalized collections, reviews, and social features.

### What technologies does CineHub Pro use?

**Frontend:**
- React 18 with TypeScript
- Vite for build tooling
- TanStack Query for state management
- Tailwind CSS for styling

**Backend:**
- Node.js with Express
- PostgreSQL database
- Drizzle ORM
- JWT & Session-based authentication

### Is CineHub Pro free to use?

CineHub Pro is an open-source project. You can use, modify, and deploy it for personal or commercial use under the MIT License.

### Where does the movie data come from?

Movie and TV show data comes from [The Movie Database (TMDB)](https://www.themoviedb.org/) API. You'll need to sign up for a free TMDB API key to use CineHub Pro.

## Getting Started

### How do I install CineHub Pro?

```bash
# Clone the repository
git clone <repository-url>
cd cinehub-pro

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Set up database
npm run db:push

# Start development server
npm run dev
```

See the [README](../README.md) for detailed instructions.

### What are the prerequisites?

- Node.js 20 or higher
- PostgreSQL database (local or Neon)
- TMDB API key (free from themoviedb.org)
- npm package manager

### How do I get a TMDB API key?

1. Sign up at [themoviedb.org](https://www.themoviedb.org/signup)
2. Go to Settings → API
3. Request an API key (it's free!)
4. Copy the API Key and Access Token to your `.env` file

### Do I need Cloudinary?

Cloudinary is used for image hosting and optimization. While recommended for production, it's optional for development. Without it, images will be served directly from TMDB.

To set up Cloudinary:
1. Sign up at [cloudinary.com](https://cloudinary.com/)
2. Get your Cloud Name, API Key, and API Secret
3. Add them to your `.env` file

## Features

### What features does CineHub Pro have?

**Core Features:**
- Browse trending, popular, and upcoming movies/TV shows
- Advanced filtering by genre, rating, date, cast, crew, and more
- Powerful search with filters
- Infinite scroll with smooth loading

**User Features:**
- Authentication (email/password + social login)
- Personalized watchlists
- Favorites collection
- Reviews and ratings
- Viewing history
- Activity feed
- Profile management

**Admin Features:**
- User management
- Platform analytics
- Content moderation

**Technical Features:**
- Smart TMDB data caching
- Image optimization via Cloudinary
- Real-time updates via WebSockets
- Responsive design with dark mode
- Full accessibility support

### How does authentication work?

CineHub Pro supports multiple authentication methods:

1. **Email/Password**: Traditional registration and login
2. **OAuth**: Social login with Google, Facebook, GitHub, X/Twitter
3. **OTP**: One-time password via email or SMS

Both session-based (for web) and JWT-based (for mobile/API) authentication are supported.

### Can I use social login without configuring all providers?

Yes! OAuth providers are optional. You can configure only the ones you need:
- Google OAuth
- Facebook OAuth
- GitHub OAuth
- Twitter/X OAuth

If a provider isn't configured, its login button won't appear.

### How does the caching system work?

CineHub Pro uses a three-layer caching strategy:

1. **Browser Cache (TanStack Query)**: Minimizes network requests, instant UI updates
2. **Database Cache (PostgreSQL)**: Reduces TMDB API calls, faster responses
3. **CDN Cache (Cloudinary)**: Fast image delivery with automatic optimization

### What's the difference between watchlists and favorites?

- **Favorites**: Simple list of movies/TV shows you like
- **Watchlists**: Organized collections with names, descriptions, and notes. You can create multiple watchlists (e.g., "Summer Movies", "Must Watch").

## Technical

### Why Vite instead of Create React App?

Vite offers:
- Much faster dev server startup
- Lightning-fast Hot Module Replacement (HMR)
- Optimized production builds
- Better TypeScript support
- Modern ES modules

### Why Drizzle ORM instead of Prisma?

Drizzle was chosen for:
- TypeScript-first design
- Better performance (closer to raw SQL)
- Smaller bundle size
- Flexible schema definitions
- Excellent TypeScript inference

### Can I use a different database?

The code is designed for PostgreSQL, but Drizzle ORM supports:
- MySQL
- SQLite
- PostgreSQL

You'll need to update the Drizzle configuration and connection setup.

### How do I add a new API endpoint?

1. Define route in `server/routes.ts`:
   ```typescript
   app.get('/api/my-endpoint', async (req, res) => {
     const data = await myService.getData();
     res.json(data);
   });
   ```

2. Create service in `server/services/`:
   ```typescript
   export const myService = {
     async getData() {
       return storage.getMyData();
     },
   };
   ```

3. Update storage interface in `server/storage.ts`

4. Add tests in `tests/integration/`

5. Document in `docs/API.md`

### How do I add a new database table?

1. Update schema in `shared/schema.ts`:
   ```typescript
   export const myTable = pgTable('my_table', {
     id: varchar('id').primaryKey(),
     name: varchar('name'),
   });
   ```

2. Create Zod schemas:
   ```typescript
   export const insertMyTableSchema = createInsertSchema(myTable);
   export type InsertMyTable = z.infer<typeof insertMyTableSchema>;
   ```

3. Run migration:
   ```bash
   npm run db:push
   ```

4. Update storage interface

### How does WebSocket work?

WebSockets provide real-time updates for cache job status:

1. Client connects to WebSocket server
2. When images are cached, server sends update
3. Client invalidates queries and updates UI

```typescript
// Server
websocketService.broadcast({
  type: 'CACHE_UPDATE',
  payload: { mediaId: 550, status: 'completed' },
});

// Client
ws.onmessage = (event) => {
  const { type, payload } = JSON.parse(event.data);
  if (type === 'CACHE_UPDATE') {
    queryClient.invalidateQueries(['/api/cache-status']);
  }
};
```

## Deployment

### How do I deploy to production?

See the [Deployment Guide](./DEPLOYMENT.md) for detailed instructions.

Quick steps:
1. Build the application: `npm run build`
2. Set up PostgreSQL database
3. Configure environment variables
4. Deploy to your hosting platform
5. Set up SSL/HTTPS

### What hosting platforms are supported?

CineHub Pro can be deployed to:
- **AWS EC2** (recommended, includes GitHub Actions workflow)
- **Vercel** (frontend + serverless backend)
- **Heroku**
- **DigitalOcean**
- **Railway**
- Any VPS with Node.js support

### Do I need a dedicated server?

No, but it's recommended for production:
- **Development**: Any Node.js hosting
- **Production**: VPS or dedicated server recommended for:
  - Better performance
  - More control
  - WebSocket support
  - Background jobs

### How do I set up SSL/HTTPS?

Using Let's Encrypt (free):
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal is configured automatically
```

See [Deployment Guide](./DEPLOYMENT.md) for details.

### How does the GitHub Actions deployment work?

The deployment workflow:
1. Runs tests on push to main/production
2. Builds the application
3. Creates deployment package
4. Transfers to EC2 via SSH
5. Extracts and installs on server
6. Runs database migrations
7. Restarts application with PM2
8. Performs health check

See [GitHub Actions Guide](./GITHUB_ACTIONS.md) for setup.

## Troubleshooting

### The application won't start

**Check these common issues:**

1. **Environment variables missing**:
   ```bash
   # Verify .env file exists and has required variables
   cat .env
   ```

2. **Database connection failed**:
   ```bash
   # Test database connection
   psql $DATABASE_URL -c "SELECT version();"
   ```

3. **Port already in use**:
   ```bash
   # Check what's using port 5000
   lsof -i :5000
   # Kill the process or use a different port
   ```

4. **Dependencies not installed**:
   ```bash
   # Reinstall dependencies
   rm -rf node_modules package-lock.json
   npm install
   ```

### I'm getting CORS errors

If you're running frontend and backend separately:

1. Ensure the backend allows your frontend origin
2. Check if the API URL is correct in frontend
3. Verify the Vite proxy configuration

CineHub Pro serves frontend and backend on the same port (5000) to avoid CORS issues.

### Images aren't loading

**Possible causes:**

1. **TMDB images not loading**: Check CSP headers allow `https://image.tmdb.org`
2. **Cloudinary not configured**: Images fall back to TMDB URLs
3. **Cache not working**: Check WebSocket connection for real-time updates

### Database migrations fail

```bash
# Force push schema changes (⚠️ can cause data loss)
npm run db:push -- --force

# Or manually inspect what changed
npm run db:push
```

### OAuth login not working

1. **Check credentials**: Verify CLIENT_ID and CLIENT_SECRET in `.env`
2. **Callback URL**: Must match exactly in OAuth provider settings
3. **Redirect URI**: Should be `/api/auth/[provider]/callback`
4. **HTTPS required**: Some providers require HTTPS (not HTTP)

### Rate limiting errors

If you're hitting rate limits:

1. **TMDB API**: Free tier allows 40 requests/10 seconds
   - Solution: Caching reduces API calls
   
2. **Application rate limits**: Configured in `server/routes.ts`
   - Increase limits for development
   - Keep limits for production security

### Tests are failing

```bash
# Run tests in isolation
npm test -- --no-coverage

# Clear cache
npm test -- --clearCache

# Run single test file
npm test -- auth.test.ts

# Enable verbose output
npm test -- --reporter=verbose
```

### WebSocket connection drops

1. **Check firewall**: Ensure WebSocket port is open
2. **Reverse proxy**: Configure Nginx for WebSocket support
3. **Timeout settings**: Increase timeout in production

### Build fails

```bash
# Clear build cache
rm -rf dist

# Rebuild
npm run build

# Check for TypeScript errors
npm run check
```

## Contributing

### How can I contribute?

We welcome contributions! See [Contributing Guide](./CONTRIBUTING.md) for:
- Code of conduct
- Development workflow
- Coding standards
- Pull request process

### I found a bug, what should I do?

1. Check if it's already reported in [GitHub Issues](https://github.com/yourusername/cinehub-pro/issues)
2. If not, create a new issue with:
   - Description of the bug
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots (if applicable)
   - Your environment (OS, Node.js version, etc.)

### I have a feature request

1. Check existing feature requests in GitHub Issues
2. Create a new issue with "Feature Request" label
3. Describe the feature and use case
4. Explain how it benefits users

### How do I set up the development environment?

See [Contributing Guide](./CONTRIBUTING.md) for detailed setup instructions.

Quick start:
```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/cinehub-pro.git
cd cinehub-pro

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env

# Start development
npm run dev

# Run tests
npm test
```

### What's the code style?

- **TypeScript**: Strict mode
- **Formatting**: Prettier (if configured)
- **Linting**: ESLint (if configured)
- **Naming**:
  - Components: PascalCase
  - Functions: camelCase
  - Constants: UPPER_SNAKE_CASE

See [Contributing Guide](./CONTRIBUTING.md) for detailed standards.

### How do I run tests?

```bash
# All tests
npm test

# Specific test suites
npm run test:unit
npm run test:integration
npm run test:components
npm run test:e2e

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

See [Testing Guide](./TESTING.md) for comprehensive testing documentation.

## Still Have Questions?

- **Documentation**: Check the `/docs` folder
- **GitHub Issues**: Search existing issues
- **GitHub Discussions**: Ask the community
- **Discord**: Join our Discord server (link in README)
- **Email**: support@cinehubpro.com

## Additional Resources

- [README](../README.md) - Project overview
- [API Documentation](./API.md) - API reference
- [Architecture Guide](./ARCHITECTURE.md) - System architecture
- [Deployment Guide](./DEPLOYMENT.md) - Deployment instructions
- [Testing Guide](./TESTING.md) - Testing documentation
- [Contributing Guide](./CONTRIBUTING.md) - Contribution guidelines
- [Security Policy](./SECURITY.md) - Security information

---

**Can't find your question?** Open an issue or discussion on GitHub!
