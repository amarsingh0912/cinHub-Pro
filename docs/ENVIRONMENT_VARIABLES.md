# Environment Variables Documentation

Complete reference for all environment variables used in CineHub Pro.

## Table of Contents

- [Overview](#overview)
- [Core Environment Variables](#core-environment-variables)
- [Database Configuration](#database-configuration)
- [Authentication & Security](#authentication--security)
- [Third-Party Services](#third-party-services)
- [OAuth Providers](#oauth-providers)
- [Email & SMS Services](#email--sms-services)
- [Development & Testing](#development--testing)
- [Production Configuration](#production-configuration)
- [Optional Variables](#optional-variables)

## Overview

CineHub Pro uses environment variables for configuration. These variables control database connections, API integrations, authentication, and more.

### Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Update values in `.env` with your credentials
3. Never commit `.env` to version control (it's in `.gitignore`)

### Loading Environment Variables

Environment variables are loaded using `dotenv` package:
- Development: Automatically loaded in `server/index.ts`
- Production: Must be set in the deployment environment
- Tests: Loaded via test setup files

---

## Core Environment Variables

### NODE_ENV
- **Required**: Yes (in production)
- **Default**: `development`
- **Values**: `development | production | test`
- **Description**: Determines the application environment
- **Example**: `NODE_ENV=production`
- **Impact**: 
  - Changes logging behavior
  - Enables/disables development tools
  - Affects cookie security settings
  - Controls error message verbosity

### PORT
- **Required**: No
- **Default**: `5000`
- **Type**: Number
- **Description**: Port number for the Express server
- **Example**: `PORT=5000`
- **Note**: In production, Replit/cloud platforms may override this

---

## Database Configuration

### DATABASE_URL
- **Required**: Yes
- **Type**: PostgreSQL connection string
- **Description**: PostgreSQL database connection URL
- **Format**: `postgresql://user:password@host:port/database?sslmode=require`
- **Example**: `DATABASE_URL=postgresql://user:pass@neon.tech:5432/cinehub?sslmode=require`
- **Security**: 
  - Always use SSL in production (`sslmode=require`)
  - Store securely, never expose in logs
  - Use connection pooling for performance

#### For Development (Local PostgreSQL):
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/cinehub_dev
```

#### For Production (Neon, Supabase, etc.):
```env
DATABASE_URL=postgresql://username:password@host.region.provider.com:5432/database?sslmode=require
```

### TEST_DATABASE_URL
- **Required**: Only for testing
- **Type**: PostgreSQL connection string
- **Description**: Separate database for running tests
- **Example**: `TEST_DATABASE_URL=postgresql://postgres:password@localhost:5432/cinehub_test`
- **Note**: Tests will create/drop tables, use a separate database

---

## Authentication & Security

### SESSION_SECRET
- **Required**: Yes (critical in production)
- **Type**: String (minimum 32 characters)
- **Description**: Secret key for signing session cookies
- **Example**: `SESSION_SECRET=your-super-secret-key-min-32-chars-long`
- **Generation**: 
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- **Security**:
  - MUST be strong and random in production
  - Never reuse across environments
  - Changing this invalidates all existing sessions

### JWT_ACCESS_SECRET
- **Required**: Yes (if using JWT auth)
- **Type**: String (minimum 32 characters)
- **Description**: Secret for signing JWT access tokens
- **Example**: `JWT_ACCESS_SECRET=your-jwt-access-secret-key`
- **Note**: Separate from SESSION_SECRET for security isolation

### JWT_REFRESH_SECRET
- **Required**: Yes (if using JWT auth)
- **Type**: String (minimum 32 characters)
- **Description**: Secret for signing JWT refresh tokens
- **Example**: `JWT_REFRESH_SECRET=your-jwt-refresh-secret-key`
- **Security**: Should be different from JWT_ACCESS_SECRET

### JWT_ACCESS_EXPIRY
- **Required**: No
- **Default**: `15m`
- **Type**: String (time format)
- **Description**: Access token expiration time
- **Example**: `JWT_ACCESS_EXPIRY=15m`
- **Values**: `15m`, `1h`, `24h`, etc.

### JWT_REFRESH_EXPIRY
- **Required**: No
- **Default**: `7d`
- **Type**: String (time format)
- **Description**: Refresh token expiration time
- **Example**: `JWT_REFRESH_EXPIRY=7d`
- **Values**: `7d`, `30d`, `90d`, etc.

---

## Third-Party Services

### The Movie Database (TMDB)

#### TMDB_API_KEY
- **Required**: Yes
- **Type**: String
- **Description**: TMDB API key for movie/TV data
- **Obtain**: [https://www.themoviedb.org/settings/api](https://www.themoviedb.org/settings/api)
- **Example**: `TMDB_API_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`
- **Usage**: Required for all movie/TV data fetching

#### TMDB_ACCESS_TOKEN
- **Required**: Yes
- **Type**: String (Bearer token)
- **Description**: TMDB API read access token
- **Obtain**: Same as API key, on TMDB settings page
- **Example**: `TMDB_ACCESS_TOKEN=eyJhbGciOiJIUzI1NiJ9...`
- **Usage**: Alternative to API key, used for v4 API endpoints

### Cloudinary (Image Hosting)

#### CLOUDINARY_CLOUD_NAME
- **Required**: For image uploads
- **Type**: String
- **Description**: Your Cloudinary cloud name
- **Obtain**: [https://cloudinary.com/console](https://cloudinary.com/console)
- **Example**: `CLOUDINARY_CLOUD_NAME=your-cloud-name`

#### CLOUDINARY_API_KEY
- **Required**: For image uploads
- **Type**: String
- **Description**: Cloudinary API key
- **Example**: `CLOUDINARY_API_KEY=123456789012345`

#### CLOUDINARY_API_SECRET
- **Required**: For image uploads
- **Type**: String
- **Description**: Cloudinary API secret
- **Example**: `CLOUDINARY_API_SECRET=your-cloudinary-secret`
- **Security**: Keep this secret, used for signed uploads

---

## OAuth Providers

### Google OAuth

#### GOOGLE_CLIENT_ID
- **Required**: For Google Sign-In
- **Type**: String
- **Description**: Google OAuth 2.0 Client ID
- **Obtain**: [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- **Example**: `GOOGLE_CLIENT_ID=123456789-abcdef.apps.googleusercontent.com`

#### GOOGLE_CLIENT_SECRET
- **Required**: For Google Sign-In
- **Type**: String
- **Description**: Google OAuth 2.0 Client Secret
- **Example**: `GOOGLE_CLIENT_SECRET=GOCSPX-abc123def456`

#### GOOGLE_CALLBACK_URL
- **Required**: No
- **Default**: `http://localhost:5000/api/auth/google/callback`
- **Type**: URL
- **Description**: OAuth callback URL (must match Google Console)
- **Production Example**: `GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/google/callback`

### Facebook OAuth

#### FACEBOOK_APP_ID
- **Required**: For Facebook Sign-In
- **Type**: String
- **Description**: Facebook App ID
- **Obtain**: [Facebook Developers](https://developers.facebook.com/)
- **Example**: `FACEBOOK_APP_ID=123456789012345`

#### FACEBOOK_APP_SECRET
- **Required**: For Facebook Sign-In
- **Type**: String
- **Description**: Facebook App Secret
- **Example**: `FACEBOOK_APP_SECRET=abcdef1234567890abcdef1234567890`

#### FACEBOOK_CALLBACK_URL
- **Required**: No
- **Default**: `http://localhost:5000/api/auth/facebook/callback`
- **Type**: URL
- **Description**: OAuth callback URL
- **Production Example**: `FACEBOOK_CALLBACK_URL=https://yourdomain.com/api/auth/facebook/callback`

### GitHub OAuth

#### GITHUB_CLIENT_ID
- **Required**: For GitHub Sign-In
- **Type**: String
- **Description**: GitHub OAuth App Client ID
- **Obtain**: [GitHub Developer Settings](https://github.com/settings/developers)
- **Example**: `GITHUB_CLIENT_ID=Iv1.a1b2c3d4e5f6g7h8`

#### GITHUB_CLIENT_SECRET
- **Required**: For GitHub Sign-In
- **Type**: String
- **Description**: GitHub OAuth App Client Secret
- **Example**: `GITHUB_CLIENT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0`

#### GITHUB_CALLBACK_URL
- **Required**: No
- **Default**: `http://localhost:5000/api/auth/github/callback`
- **Type**: URL
- **Description**: OAuth callback URL
- **Production Example**: `GITHUB_CALLBACK_URL=https://yourdomain.com/api/auth/github/callback`

### X (Twitter) OAuth

#### TWITTER_CLIENT_ID
- **Required**: For X/Twitter Sign-In
- **Type**: String
- **Description**: X OAuth 2.0 Client ID
- **Obtain**: [X Developer Portal](https://developer.twitter.com/)
- **Example**: `TWITTER_CLIENT_ID=abc123def456`

#### TWITTER_CLIENT_SECRET
- **Required**: For X/Twitter Sign-In
- **Type**: String
- **Description**: X OAuth 2.0 Client Secret
- **Example**: `TWITTER_CLIENT_SECRET=xyz789uvw456`

---

## Email & SMS Services

### SendGrid (Email)

#### SENDGRID_API_KEY
- **Required**: For email functionality
- **Type**: String
- **Description**: SendGrid API key for sending emails
- **Obtain**: [SendGrid Dashboard](https://app.sendgrid.com/settings/api_keys)
- **Example**: `SENDGRID_API_KEY=SG.abc123def456.xyz789uvw456`
- **Usage**: OTP emails, password reset, notifications

#### SENDGRID_FROM_EMAIL
- **Required**: For email functionality
- **Type**: Email address
- **Description**: Verified sender email address
- **Example**: `SENDGRID_FROM_EMAIL=noreply@yourdomain.com`
- **Note**: Must be verified in SendGrid

#### SENDGRID_FROM_NAME
- **Required**: No
- **Default**: `CineHub Pro`
- **Type**: String
- **Description**: Sender name for emails
- **Example**: `SENDGRID_FROM_NAME=CineHub Pro`

### Twilio (SMS)

#### TWILIO_ACCOUNT_SID
- **Required**: For SMS functionality
- **Type**: String
- **Description**: Twilio Account SID
- **Obtain**: [Twilio Console](https://console.twilio.com/)
- **Example**: `TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

#### TWILIO_AUTH_TOKEN
- **Required**: For SMS functionality
- **Type**: String
- **Description**: Twilio Auth Token
- **Example**: `TWILIO_AUTH_TOKEN=your-auth-token`
- **Security**: Keep secure, used for API authentication

#### TWILIO_PHONE_NUMBER
- **Required**: For SMS functionality
- **Type**: Phone number (E.164 format)
- **Description**: Twilio phone number for sending SMS
- **Example**: `TWILIO_PHONE_NUMBER=+15551234567`
- **Format**: Must include country code with +

---

## Development & Testing

### VITE_API_URL
- **Required**: No (frontend only)
- **Default**: `/api`
- **Type**: URL
- **Description**: API base URL for frontend
- **Development**: `VITE_API_URL=/api`
- **Production**: `VITE_API_URL=https://yourdomain.com/api`

### ENABLE_API_LOGGING
- **Required**: No
- **Default**: `false`
- **Type**: Boolean
- **Description**: Enable detailed API request/response logging
- **Example**: `ENABLE_API_LOGGING=true`
- **Usage**: Debugging only, disable in production

### DISABLE_RATE_LIMITING
- **Required**: No
- **Default**: `false`
- **Type**: Boolean
- **Description**: Disable rate limiting (development only)
- **Example**: `DISABLE_RATE_LIMITING=true`
- **Warning**: Never enable in production

---

## Production Configuration

### Required for Production Deployment

```env
# Core
NODE_ENV=production
PORT=5000

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require

# Security
SESSION_SECRET=<64-char-random-string>
JWT_ACCESS_SECRET=<64-char-random-string>
JWT_REFRESH_SECRET=<64-char-random-string>

# TMDB
TMDB_API_KEY=<your-api-key>
TMDB_ACCESS_TOKEN=<your-access-token>

# Cloudinary (if using image uploads)
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>

# Email (if using email features)
SENDGRID_API_KEY=<your-sendgrid-key>
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# SMS (if using SMS features)
TWILIO_ACCOUNT_SID=<your-account-sid>
TWILIO_AUTH_TOKEN=<your-auth-token>
TWILIO_PHONE_NUMBER=<your-twilio-number>
```

---

## Optional Variables

### ADMIN_EMAIL
- **Required**: No
- **Description**: Default admin user email (auto-created on startup)
- **Example**: `ADMIN_EMAIL=admin@example.com`

### ADMIN_PASSWORD
- **Required**: No (auto-generated if not provided)
- **Description**: Default admin user password
- **Example**: `ADMIN_PASSWORD=SecurePassword123!`
- **Security**: Change immediately after first login

### CACHE_TTL
- **Required**: No
- **Default**: `3600` (1 hour)
- **Type**: Number (seconds)
- **Description**: TMDB data cache TTL
- **Example**: `CACHE_TTL=7200`

### MAX_CACHE_SIZE
- **Required**: No
- **Default**: `1000`
- **Type**: Number
- **Description**: Maximum number of cached TMDB entries
- **Example**: `MAX_CACHE_SIZE=5000`

### ENABLE_WEBSOCKET
- **Required**: No
- **Default**: `true`
- **Type**: Boolean
- **Description**: Enable WebSocket for real-time updates
- **Example**: `ENABLE_WEBSOCKET=false`

---

## Environment Variable Validation

The application validates critical environment variables on startup. Missing required variables will cause the application to fail with clear error messages.

### Validation Checklist

- [ ] DATABASE_URL is set and valid
- [ ] SESSION_SECRET is set (production)
- [ ] TMDB_API_KEY is set
- [ ] OAuth secrets match respective client IDs
- [ ] Email/SMS credentials are valid (if features enabled)
- [ ] All URLs use HTTPS in production

### Testing Configuration

```bash
# Check if all required variables are set
npm run check:env

# Validate database connection
npm run db:test

# Test email configuration
npm run test:email

# Test SMS configuration
npm run test:sms
```

---

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use different secrets** for each environment
3. **Rotate secrets regularly** in production
4. **Use strong, random values** for all secrets (min 32 characters)
5. **Enable SSL/TLS** for all external connections
6. **Restrict API keys** to necessary permissions only
7. **Monitor API usage** and set up alerts
8. **Use environment-specific** OAuth callback URLs

---

## Troubleshooting

### Common Issues

#### Database Connection Fails
- Check DATABASE_URL format
- Verify database server is running
- Confirm SSL mode requirements
- Check firewall/network settings

#### OAuth Not Working
- Verify callback URLs match OAuth provider settings
- Check client ID and secret are correct
- Ensure redirect URIs are allowlisted
- Confirm OAuth app is in production mode

#### Email/SMS Not Sending
- Verify API keys are active
- Check sender email/phone is verified
- Review rate limits and quotas
- Check network/firewall rules

---

## References

- [Neon Database Documentation](https://neon.tech/docs)
- [TMDB API Documentation](https://developers.themoviedb.org/3)
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [SendGrid Documentation](https://docs.sendgrid.com/)
- [Twilio Documentation](https://www.twilio.com/docs)
- [OAuth 2.0 Guide](https://oauth.net/2/)

---

## Support

For issues related to environment configuration:
1. Check this documentation
2. Review example `.env.example` file
3. Check application logs for specific errors
4. Consult service provider documentation
5. Open an issue on GitHub with sanitized error logs (never include secrets)
