# Troubleshooting Guide

This guide helps you diagnose and fix common issues with CineHub Pro.

## Table of Contents

- [Quick Diagnostics](#quick-diagnostics)
- [Common Issues](#common-issues)
  - [Installation & Setup](#installation--setup)
  - [Database Issues](#database-issues)
  - [API & Backend](#api--backend)
  - [Frontend Issues](#frontend-issues)
  - [Authentication](#authentication)
  - [External Services](#external-services)
  - [Performance Issues](#performance-issues)
  - [Deployment Issues](#deployment-issues)
- [Debug Mode](#debug-mode)
- [Logs](#logs)
- [Getting Help](#getting-help)

---

## Quick Diagnostics

Run these commands to quickly diagnose common issues:

```bash
# Check Node.js version
node --version  # Should be >= 20.x

# Check npm version
npm --version  # Should be >= 10.x

# Check PostgreSQL connection
psql $DATABASE_URL -c "SELECT version();"

# Test API connectivity
curl http://localhost:5000/health

# Run TypeScript checks
npm run check

# Run tests
npm test
```

---

## Common Issues

### Installation & Setup

#### Issue: `npm install` fails

**Symptoms:**
- Errors during `npm install`
- Missing dependencies
- Version conflicts

**Solutions:**

1. **Clear cache and reinstall:**
   ```bash
   rm -rf node_modules package-lock.json
   npm cache clean --force
   npm install
   ```

2. **Check Node.js version:**
   ```bash
   node --version
   # Should be >= 20.x
   ```

3. **Update npm:**
   ```bash
   npm install -g npm@latest
   ```

4. **Install with legacy peer deps (if needed):**
   ```bash
   npm install --legacy-peer-deps
   ```

#### Issue: `Cannot find module` errors

**Solutions:**

1. **Install missing dependency:**
   ```bash
   npm install <module-name>
   ```

2. **Rebuild node modules:**
   ```bash
   npm rebuild
   ```

3. **Check imports:**
   - Ensure import paths use correct aliases (`@/`, `@shared/`)
   - Verify file extensions are included where needed

#### Issue: TypeScript errors

**Solutions:**

1. **Run type check:**
   ```bash
   npm run check
   ```

2. **Check tsconfig.json:**
   - Ensure `moduleResolution` is set to `"bundler"`
   - Verify `paths` are correctly configured

3. **Restart TypeScript server in VSCode:**
   - Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"

---

### Database Issues

#### Issue: Cannot connect to database

**Symptoms:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
Error: password authentication failed for user
```

**Solutions:**

1. **Verify PostgreSQL is running:**
   ```bash
   # Linux/macOS
   sudo systemctl status postgresql
   
   # macOS (Homebrew)
   brew services list
   ```

2. **Start PostgreSQL if stopped:**
   ```bash
   # Linux
   sudo systemctl start postgresql
   
   # macOS
   brew services start postgresql@14
   ```

3. **Check DATABASE_URL:**
   ```bash
   echo $DATABASE_URL
   # Should be: postgresql://user:pass@host:5432/dbname
   ```

4. **Test connection manually:**
   ```bash
   psql $DATABASE_URL
   ```

5. **Check PostgreSQL logs:**
   ```bash
   # Linux
   sudo tail -f /var/log/postgresql/postgresql-14-main.log
   
   # macOS
   tail -f /usr/local/var/postgres/server.log
   ```

#### Issue: Database migration errors

**Symptoms:**
```
Error: relation "users" does not exist
Error: column "email" does not exist
```

**Solutions:**

1. **Push schema to database:**
   ```bash
   npm run db:push
   ```

2. **Force push if data loss warning:**
   ```bash
   npm run db:push -- --force
   ```

3. **Drop and recreate database (⚠️ DATA LOSS):**
   ```bash
   dropdb cinehub_pro
   createdb cinehub_pro
   npm run db:push
   ```

4. **Check schema file:**
   - Verify `shared/schema.ts` is correct
   - Ensure all relations are properly defined

#### Issue: Database performance issues

**Solutions:**

1. **Check slow queries:**
   ```sql
   -- Enable slow query logging
   ALTER DATABASE cinehub_pro SET log_min_duration_statement = 1000;
   
   -- View slow queries
   SELECT query, calls, total_time, mean_time
   FROM pg_stat_statements
   ORDER BY mean_time DESC
   LIMIT 10;
   ```

2. **Add indexes:**
   ```sql
   -- Common indexes (already in schema.ts)
   CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
   CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
   ```

3. **Vacuum database:**
   ```bash
   psql $DATABASE_URL -c "VACUUM ANALYZE;"
   ```

4. **Check connection pool:**
   - Ensure you're not creating too many connections
   - Use connection pooling in production (PgBouncer)

---

### API & Backend

#### Issue: Server won't start

**Symptoms:**
```
Error: Port 5000 is already in use
Error: Cannot start server
```

**Solutions:**

1. **Kill process on port 5000:**
   ```bash
   # Find process
   lsof -i :5000
   
   # Kill it
   kill -9 <PID>
   ```

2. **Use different port:**
   ```bash
   PORT=3000 npm run dev
   ```

3. **Check environment variables:**
   ```bash
   # Print all env vars
   printenv | grep -E 'DATABASE_URL|TMDB|SESSION'
   ```

#### Issue: API returns 500 errors

**Solutions:**

1. **Check server logs:**
   ```bash
   # Development
   tail -f logs/error.log
   
   # Production (PM2)
   pm2 logs cinehub-pro
   ```

2. **Enable debug mode:**
   ```bash
   NODE_ENV=development DEBUG=* npm run dev
   ```

3. **Check error response:**
   ```bash
   curl -X POST http://localhost:5000/api/auth/signin \
     -H "Content-Type: application/json" \
     -H "X-CSRF-Token: test" \
     -d '{"identifier":"test@test.com","password":"test"}' \
     -v
   ```

#### Issue: CORS errors

**Symptoms:**
```
Access to fetch blocked by CORS policy
No 'Access-Control-Allow-Origin' header present
```

**Solutions:**

1. **Check Vite proxy configuration:**
   - Ensure `server/vite.ts` is properly configured
   - Vite should serve both frontend and backend

2. **Verify request headers:**
   ```javascript
   // All requests should include:
   headers: {
     'Content-Type': 'application/json',
     'X-CSRF-Token': 'test' // or actual token
   }
   ```

3. **Check Helmet CSP:**
   - Review `server/routes.ts` CSP configuration
   - Ensure your domain is allowed in `connectSrc`

#### Issue: Rate limiting

**Symptoms:**
```
429 Too Many Requests
Error: Rate limit exceeded
```

**Solutions:**

1. **Wait and retry:**
   - Auth endpoints: 5 requests per 15 minutes
   - API endpoints: 100 requests per 15 minutes

2. **Disable in development:**
   ```javascript
   // In server/routes.ts, comment out rate limiters
   // app.use(apiLimiter);
   ```

3. **Increase limits for testing:**
   ```javascript
   const testLimiter = rateLimit({
     windowMs: 15 * 60 * 1000,
     max: 1000 // Higher limit for testing
   });
   ```

---

### Frontend Issues

#### Issue: White screen / blank page

**Solutions:**

1. **Check browser console:**
   - Press F12 → Console tab
   - Look for JavaScript errors

2. **Clear browser cache:**
   - Hard reload: Ctrl+Shift+R (Cmd+Shift+R on Mac)
   - Clear all cache in browser settings

3. **Check Vite build:**
   ```bash
   rm -rf dist
   npm run build
   ```

4. **Verify index.html:**
   - Check `client/index.html` loads correctly
   - Ensure script tags are present

#### Issue: UI not updating / Hot reload not working

**Solutions:**

1. **Restart dev server:**
   ```bash
   # Kill and restart
   pkill -f "vite"
   npm run dev
   ```

2. **Clear Vite cache:**
   ```bash
   rm -rf node_modules/.vite
   npm run dev
   ```

3. **Check file watchers:**
   ```bash
   # Linux: Increase inotify watchers
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

#### Issue: Images not loading

**Solutions:**

1. **Check image URLs:**
   - TMDB images: `https://image.tmdb.org/t/p/w500/...`
   - Cloudinary images: `https://res.cloudinary.com/...`

2. **Verify CSP allows image sources:**
   ```javascript
   // In server/routes.ts
   imgSrc: [
     "'self'",
     "https://image.tmdb.org",
     "https://res.cloudinary.com"
   ]
   ```

3. **Check network tab:**
   - F12 → Network tab
   - Look for failed image requests

4. **Test image URL directly:**
   ```bash
   curl -I https://image.tmdb.org/t/p/w500/path.jpg
   ```

#### Issue: Infinite scroll not working

**Solutions:**

1. **Check scroll container:**
   - Ensure container has `overflow-y: auto`
   - Container must have fixed height

2. **Verify Intersection Observer:**
   ```javascript
   // Check browser support
   if ('IntersectionObserver' in window) {
     console.log('Supported');
   }
   ```

3. **Check API pagination:**
   - Verify `page` parameter is incrementing
   - Check `hasNextPage` is calculated correctly

---

### Authentication

#### Issue: Cannot log in

**Solutions:**

1. **Check credentials:**
   - Verify email/username exists in database
   - Test password is correct

2. **Check password hash:**
   ```sql
   SELECT id, email, password FROM users WHERE email = 'user@example.com';
   -- password should be a bcrypt hash
   ```

3. **Test login API directly:**
   ```bash
   curl -X POST http://localhost:5000/api/auth/signin-jwt \
     -H "Content-Type: application/json" \
     -H "X-CSRF-Token: test" \
     -d '{
       "identifier": "user@example.com",
       "password": "yourpassword"
     }'
   ```

4. **Check session/JWT:**
   - Clear cookies and local storage
   - Check JWT secrets are set in `.env`

#### Issue: JWT token expired

**Solutions:**

1. **Refresh token:**
   ```bash
   curl -X POST http://localhost:5000/api/auth/refresh \
     -H "Content-Type: application/json" \
     -H "X-CSRF-Token: test" \
     -d '{"refreshToken": "your-refresh-token"}'
   ```

2. **Adjust token expiry:**
   ```javascript
   // In server/jwt.ts
   const ACCESS_TOKEN_EXPIRY = "1h"; // Increase from 15m
   ```

#### Issue: OAuth login not working

**Solutions:**

1. **Check OAuth credentials:**
   ```bash
   echo $GOOGLE_CLIENT_ID
   echo $GOOGLE_CLIENT_SECRET
   ```

2. **Verify callback URL:**
   - Must match exactly in OAuth provider settings
   - Example: `http://localhost:5000/api/auth/google/callback`

3. **Check OAuth redirect:**
   ```bash
   # Should redirect to provider
   curl -v http://localhost:5000/api/auth/google
   ```

4. **Review provider console:**
   - Google: https://console.cloud.google.com
   - Facebook: https://developers.facebook.com
   - GitHub: https://github.com/settings/developers

#### Issue: OTP not received

**Solutions:**

1. **Check SendGrid/Twilio configuration:**
   ```bash
   echo $SENDGRID_API_KEY
   echo $TWILIO_ACCOUNT_SID
   ```

2. **Check spam folder:**
   - Email might be in spam
   - Add sender to contacts

3. **Test email sending:**
   ```bash
   curl -X POST http://localhost:5000/api/auth/request-otp \
     -H "Content-Type: application/json" \
     -H "X-CSRF-Token: test" \
     -d '{
       "target": "your@email.com",
       "purpose": "signup"
     }'
   ```

4. **Check service logs:**
   ```javascript
   // Check logs for SendGrid/Twilio errors
   tail -f logs/error.log | grep -i "sendgrid\|twilio"
   ```

---

### External Services

#### Issue: TMDB API errors

**Symptoms:**
```
Error: Request failed with status code 401
Error: Invalid API key
Error: Rate limit exceeded
```

**Solutions:**

1. **Verify API key:**
   ```bash
   echo $TMDB_API_KEY
   echo $TMDB_ACCESS_TOKEN
   ```

2. **Test API key:**
   ```bash
   curl "https://api.themoviedb.org/3/movie/550?api_key=$TMDB_API_KEY"
   ```

3. **Check rate limits:**
   - TMDB allows 40 requests per 10 seconds
   - Use caching to reduce API calls

4. **Check TMDB status:**
   - Visit [TMDB Status](https://www.themoviedb.org/talk/category/5047958519c29526b50017d6)

#### Issue: Cloudinary upload fails

**Solutions:**

1. **Verify credentials:**
   ```bash
   echo $CLOUDINARY_CLOUD_NAME
   echo $CLOUDINARY_API_KEY
   echo $CLOUDINARY_API_SECRET
   ```

2. **Test upload manually:**
   ```bash
   curl -X POST "https://api.cloudinary.com/v1_1/$CLOUDINARY_CLOUD_NAME/image/upload" \
     -F "file=@test-image.jpg" \
     -F "upload_preset=unsigned_preset"
   ```

3. **Check file size limits:**
   - Free plan: 10MB per file
   - Check image size before upload

4. **Review Cloudinary dashboard:**
   - Check usage limits
   - View upload logs

#### Issue: Email not sending (SendGrid)

**Solutions:**

1. **Verify API key:**
   ```bash
   curl --request POST \
     --url https://api.sendgrid.com/v3/mail/send \
     --header "Authorization: Bearer $SENDGRID_API_KEY" \
     --header 'Content-Type: application/json' \
     --data '{
       "personalizations": [{"to": [{"email": "test@example.com"}]}],
       "from": {"email": "'"$SENDGRID_FROM_EMAIL"'"},
       "subject": "Test",
       "content": [{"type": "text/plain", "value": "Test"}]
     }'
   ```

2. **Check sender verification:**
   - Single Sender Verification (free plan)
   - Domain Authentication (paid plans)

3. **Review SendGrid activity:**
   - https://app.sendgrid.com/email_activity

#### Issue: SMS not sending (Twilio)

**Solutions:**

1. **Verify credentials:**
   ```bash
   curl -X POST "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages.json" \
     --data-urlencode "From=$TWILIO_PHONE_NUMBER" \
     --data-urlencode "Body=Test message" \
     --data-urlencode "To=+1234567890" \
     -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN"
   ```

2. **Check phone number format:**
   - Must include country code: `+1234567890`

3. **Review Twilio console:**
   - Check message logs
   - Verify phone number is verified (trial account)

---

### Performance Issues

#### Issue: Slow page load

**Solutions:**

1. **Check Network tab:**
   - F12 → Network tab
   - Look for slow requests
   - Check total load time

2. **Enable caching:**
   - Verify TMDB cache is working
   - Check image caching via Cloudinary

3. **Optimize queries:**
   ```sql
   -- Add indexes for common queries
   CREATE INDEX idx_movies_cache_last_updated ON movies_cache(last_updated);
   CREATE INDEX idx_favorites_user_media ON favorites(user_id, media_type, media_id);
   ```

4. **Enable gzip compression:**
   ```javascript
   // Already enabled in server/routes.ts
   app.use(compression());
   ```

#### Issue: High memory usage

**Solutions:**

1. **Check PM2 memory:**
   ```bash
   pm2 monit
   ```

2. **Restart application:**
   ```bash
   pm2 restart cinehub-pro
   ```

3. **Increase memory limit:**
   ```bash
   pm2 start npm --name "cinehub-pro" --max-memory-restart 1G -- start
   ```

4. **Check for memory leaks:**
   ```bash
   node --inspect dist/index.js
   # Use Chrome DevTools to profile
   ```

#### Issue: Slow database queries

**Solutions:**

1. **Analyze slow queries:**
   ```sql
   EXPLAIN ANALYZE 
   SELECT * FROM favorites 
   WHERE user_id = 'some-id' 
   AND media_type = 'movie';
   ```

2. **Add missing indexes:**
   ```sql
   CREATE INDEX idx_custom ON table_name(column_name);
   ```

3. **Optimize N+1 queries:**
   - Use Drizzle `.with()` to eager load relations
   - Batch similar queries

---

### Deployment Issues

#### Issue: EC2 deployment fails

**Solutions:**

1. **Check GitHub Actions logs:**
   - Go to repository → Actions tab
   - Click on failed workflow
   - Review each step's output

2. **Verify SSH connection:**
   ```bash
   ssh -i ~/.ssh/deploy_key ubuntu@your-ec2-ip
   ```

3. **Check EC2 security groups:**
   - Port 22 (SSH) open for GitHub Actions IP
   - Port 80/443 (HTTP/HTTPS) open publicly

4. **Verify secrets:**
   - All required secrets set in GitHub
   - Secrets have correct values

#### Issue: PM2 process crashes

**Solutions:**

1. **Check PM2 logs:**
   ```bash
   pm2 logs cinehub-pro --lines 100
   ```

2. **Check error logs:**
   ```bash
   pm2 logs cinehub-pro --err
   ```

3. **Restart with increased memory:**
   ```bash
   pm2 stop cinehub-pro
   pm2 start npm --name "cinehub-pro" --max-memory-restart 2G -- start
   pm2 save
   ```

4. **Enable auto-restart:**
   ```bash
   pm2 startup
   pm2 save
   ```

#### Issue: Nginx 502 Bad Gateway

**Solutions:**

1. **Check if backend is running:**
   ```bash
   curl http://localhost:5000/health
   ```

2. **Check Nginx error logs:**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

3. **Verify Nginx configuration:**
   ```bash
   sudo nginx -t
   ```

4. **Restart Nginx:**
   ```bash
   sudo systemctl restart nginx
   ```

---

## Debug Mode

Enable comprehensive debugging:

```bash
# Full debug output
DEBUG=* NODE_ENV=development npm run dev

# Specific modules
DEBUG=express:*,drizzle:* npm run dev

# Database queries
DEBUG=drizzle:query npm run dev
```

---

## Logs

### Application Logs

**Development:**
```bash
# All logs
tail -f logs/combined.log

# Errors only
tail -f logs/error.log
```

**Production (PM2):**
```bash
# All logs
pm2 logs cinehub-pro

# Last 100 lines
pm2 logs cinehub-pro --lines 100

# Errors only
pm2 logs cinehub-pro --err

# Real-time with grep
pm2 logs cinehub-pro | grep ERROR
```

### Database Logs

**PostgreSQL:**
```bash
# Linux
sudo tail -f /var/log/postgresql/postgresql-14-main.log

# macOS
tail -f /usr/local/var/postgres/server.log
```

### Nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

---

## Getting Help

If you can't resolve an issue:

1. **Search existing issues:**
   - [GitHub Issues](https://github.com/yourusername/cinehub-pro/issues)

2. **Create a new issue:**
   - Include error messages
   - Provide steps to reproduce
   - Share relevant logs
   - Mention OS and Node version

3. **Community support:**
   - [GitHub Discussions](https://github.com/yourusername/cinehub-pro/discussions)

4. **Documentation:**
   - [Setup Guide](./SETUP.md)
   - [API Documentation](./API.md)
   - [Security Guide](./SECURITY.md)

---

## Diagnostic Checklist

Before asking for help, please provide:

- [ ] Node.js version: `node --version`
- [ ] npm version: `npm --version`
- [ ] OS and version
- [ ] Error message (full stack trace)
- [ ] Steps to reproduce
- [ ] Relevant logs
- [ ] Environment variables (without sensitive values)
- [ ] What you've already tried

---

**Last Updated:** October 16, 2025
