# CineHub Pro - Complete Setup Guide

This guide will walk you through setting up CineHub Pro from scratch on your local development environment or production server.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start (5 minutes)](#quick-start-5-minutes)
- [Detailed Setup](#detailed-setup)
  - [1. Clone and Install](#1-clone-and-install)
  - [2. Environment Configuration](#2-environment-configuration)
  - [3. Database Setup](#3-database-setup)
  - [4. External Services](#4-external-services)
  - [5. Running the Application](#5-running-the-application)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 20.x ([Download](https://nodejs.org/))
- **npm** >= 10.x (comes with Node.js)
- **PostgreSQL** >= 14.x ([Download](https://www.postgresql.org/download/))
- **Git** ([Download](https://git-scm.com/downloads))

### Optional (for production):
- **PM2** - Process manager for Node.js
- **Nginx** - Reverse proxy server
- **Docker** - Containerization (optional)

### External Services:
- **TMDB Account** - The Movie Database API
- **Cloudinary Account** - Image hosting and optimization
- **SendGrid Account** - Email delivery (optional)
- **Twilio Account** - SMS delivery (optional)

---

## Quick Start (5 minutes)

For a quick local development setup:

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/cinehub-pro.git
cd cinehub-pro

# 2. Install dependencies
npm install

# 3. Copy environment template
cp .env.example .env

# 4. Edit .env and add your TMDB API key (minimum requirement)
nano .env  # or use your preferred editor

# 5. Set up the database
npm run db:push

# 6. Start the development server
npm run dev
```

The application will be available at `http://localhost:5000`

---

## Detailed Setup

### 1. Clone and Install

#### Clone the Repository

```bash
git clone https://github.com/yourusername/cinehub-pro.git
cd cinehub-pro
```

#### Install Dependencies

```bash
npm install
```

This will install all required packages for both frontend and backend.

#### Verify Installation

```bash
npm run check
```

This runs TypeScript type checking to ensure everything is correctly installed.

---

### 2. Environment Configuration

#### Create Environment File

```bash
cp .env.example .env
```

#### Required Environment Variables

Edit `.env` and configure the following:

**Database Configuration:**
```env
DATABASE_URL="postgresql://username:password@localhost:5432/cinehub_pro"
```

**Session Configuration:**
```env
SESSION_SECRET="generate-a-strong-random-string-here"
```

**JWT Configuration:**
```env
JWT_ACCESS_SECRET="generate-another-strong-random-string"
JWT_REFRESH_SECRET="generate-yet-another-strong-random-string"
```

**TMDB API (Required):**
```env
TMDB_API_KEY="your-tmdb-api-key"
TMDB_ACCESS_TOKEN="your-tmdb-read-access-token"
```

#### Optional Environment Variables

**Cloudinary (for image optimization):**
```env
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

**SendGrid (for email):**
```env
SENDGRID_API_KEY="your-sendgrid-api-key"
SENDGRID_FROM_EMAIL="noreply@yourdomain.com"
SENDGRID_FROM_NAME="CineHub Pro"
```

**Twilio (for SMS):**
```env
TWILIO_ACCOUNT_SID="your-account-sid"
TWILIO_AUTH_TOKEN="your-auth-token"
TWILIO_PHONE_NUMBER="+1234567890"
```

**OAuth Providers (optional):**
```env
# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Facebook OAuth
FACEBOOK_APP_ID="your-facebook-app-id"
FACEBOOK_APP_SECRET="your-facebook-app-secret"

# GitHub OAuth
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Twitter/X OAuth
TWITTER_CLIENT_ID="your-twitter-client-id"
TWITTER_CLIENT_SECRET="your-twitter-client-secret"
```

#### Generate Secure Secrets

Use these commands to generate secure random strings:

```bash
# On Linux/macOS
openssl rand -base64 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

### 3. Database Setup

#### Option A: Local PostgreSQL

**Install PostgreSQL:**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS (using Homebrew)
brew install postgresql@14
brew services start postgresql@14

# Windows
# Download installer from https://www.postgresql.org/download/windows/
```

**Create Database:**
```bash
# Login to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE cinehub_pro;
CREATE USER cinehub_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE cinehub_pro TO cinehub_user;
\q
```

**Update DATABASE_URL in .env:**
```env
DATABASE_URL="postgresql://cinehub_user:your_password@localhost:5432/cinehub_pro"
```

#### Option B: Neon (Serverless PostgreSQL)

1. Go to [Neon Console](https://console.neon.tech/)
2. Create a new project
3. Copy the connection string
4. Update `.env`:

```env
DATABASE_URL="your-neon-connection-string"
```

#### Run Migrations

```bash
npm run db:push
```

This will create all necessary database tables and indexes.

#### Verify Database

```bash
# Connect to database
psql $DATABASE_URL

# List tables
\dt

# You should see tables like: users, favorites, watchlists, reviews, etc.
```

---

### 4. External Services

#### TMDB API (Required)

1. **Create Account:**
   - Go to [TMDB](https://www.themoviedb.org/signup)
   - Sign up for a free account

2. **Get API Key:**
   - Go to Settings → API
   - Request an API key
   - Fill out the form (choose "Developer" if unsure)
   
3. **Get Read Access Token:**
   - In the API settings, you'll also find your Read Access Token (v4 auth)

4. **Add to .env:**
```env
TMDB_API_KEY="your-api-key-here"
TMDB_ACCESS_TOKEN="your-read-access-token-here"
```

#### Cloudinary (Optional but Recommended)

1. **Create Account:**
   - Go to [Cloudinary](https://cloudinary.com/users/register/free)
   - Sign up for free plan

2. **Get Credentials:**
   - Go to Dashboard
   - Copy Cloud Name, API Key, and API Secret

3. **Add to .env:**
```env
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

#### SendGrid (Optional)

1. **Create Account:**
   - Go to [SendGrid](https://signup.sendgrid.com/)
   - Sign up for free plan (100 emails/day)

2. **Create API Key:**
   - Go to Settings → API Keys
   - Create API Key with "Full Access"

3. **Verify Sender:**
   - Go to Settings → Sender Authentication
   - Verify your email or domain

4. **Add to .env:**
```env
SENDGRID_API_KEY="your-api-key"
SENDGRID_FROM_EMAIL="noreply@yourdomain.com"
SENDGRID_FROM_NAME="CineHub Pro"
```

#### Twilio (Optional)

1. **Create Account:**
   - Go to [Twilio](https://www.twilio.com/try-twilio)
   - Sign up for free trial

2. **Get Phone Number:**
   - Get a Twilio phone number from console

3. **Get Credentials:**
   - Find Account SID and Auth Token in dashboard

4. **Add to .env:**
```env
TWILIO_ACCOUNT_SID="your-account-sid"
TWILIO_AUTH_TOKEN="your-auth-token"
TWILIO_PHONE_NUMBER="+1234567890"
```

#### OAuth Providers (Optional)

**Google OAuth:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:5000/api/auth/google/callback`

**Facebook OAuth:**
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Facebook Login product
4. Configure OAuth redirect URI: `http://localhost:5000/api/auth/facebook/callback`

**GitHub OAuth:**
1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Create a new OAuth App
3. Set callback URL: `http://localhost:5000/api/auth/github/callback`

**Twitter/X OAuth:**
1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create a new app
3. Enable OAuth 2.0
4. Set callback URL: `http://localhost:5000/api/auth/twitter/callback`

---

### 5. Running the Application

#### Development Mode

```bash
npm run dev
```

This starts:
- Backend server on port 5000
- Vite dev server with HMR
- WebSocket server for real-time updates

Access the application at: `http://localhost:5000`

#### Build for Production

```bash
npm run build
```

This creates optimized production builds:
- Frontend: `dist/public/`
- Backend: `dist/index.js`

#### Start Production Server

```bash
npm start
```

Or with PM2:

```bash
pm2 start npm --name "cinehub-pro" -- start
pm2 save
pm2 startup
```

---

## Production Deployment

### Option 1: EC2 Deployment (Automated)

The project includes GitHub Actions workflow for automated EC2 deployment.

**Prerequisites:**
- AWS EC2 instance (Ubuntu 20.04+ recommended)
- SSH access to the instance

**Setup GitHub Secrets:**
```
PRODUCTION_EC2_HOST="your-ec2-ip-or-domain"
PRODUCTION_EC2_USER="ubuntu"
PRODUCTION_EC2_SSH_KEY="your-private-ssh-key"
PRODUCTION_APP_DIR="/home/ubuntu/cinehub-pro"
PRODUCTION_URL="https://your-domain.com"
DATABASE_URL="your-production-db-url"
```

**Deploy:**
```bash
git push origin production
```

See [DEPLOYMENT_EC2.md](./DEPLOYMENT_EC2.md) for detailed instructions.

### Option 2: Manual Deployment

**1. Prepare Server:**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx
```

**2. Clone and Build:**
```bash
git clone https://github.com/yourusername/cinehub-pro.git
cd cinehub-pro
npm install
npm run build
```

**3. Configure Nginx:**

Create `/etc/nginx/sites-available/cinehub-pro`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /ws {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/cinehub-pro /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**4. Start with PM2:**
```bash
pm2 start npm --name "cinehub-pro" -- start
pm2 startup
pm2 save
```

**5. Set up SSL (Let's Encrypt):**
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Option 3: Docker Deployment

Create `Dockerfile` in project root:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
```

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - SESSION_SECRET=${SESSION_SECRET}
      - TMDB_API_KEY=${TMDB_API_KEY}
    depends_on:
      - db

  db:
    image: postgres:14-alpine
    environment:
      - POSTGRES_DB=cinehub_pro
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Deploy:
```bash
docker-compose up -d
```

---

## Troubleshooting

### Common Issues

**Port 5000 already in use:**
```bash
# Find process using port
lsof -i :5000

# Kill the process
kill -9 <PID>

# Or change port in .env
PORT=3000
```

**Database connection error:**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check connection string
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL
```

**TMDB API errors:**
- Verify your API key is correct
- Check you haven't exceeded rate limits (40 requests/10 seconds)
- Ensure TMDB_ACCESS_TOKEN is also set

**Build errors:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear build cache
rm -rf dist .vite
npm run build
```

For more troubleshooting help, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

---

## Next Steps

- Read [API Documentation](./API.md)
- Learn about [Testing](./TESTING.md)
- Review [Security Guidelines](./SECURITY.md)
- Check out [Contributing Guidelines](./CONTRIBUTING.md)

---

## Support

- **Documentation:** [docs/](../docs)
- **Issues:** [GitHub Issues](https://github.com/yourusername/cinehub-pro/issues)
- **Discussions:** [GitHub Discussions](https://github.com/yourusername/cinehub-pro/discussions)
