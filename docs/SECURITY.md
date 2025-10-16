# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please report it responsibly.

### How to Report

**DO NOT** open a public GitHub issue for security vulnerabilities.

Instead, please email us at: **security@cinehubpro.com**

Include the following information:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### What to Expect

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 7 days
- **Fix Timeline**: Depending on severity
  - Critical: 24-48 hours
  - High: 1 week
  - Medium: 2 weeks
  - Low: 1 month

### Disclosure Policy

- We will notify you when the vulnerability is fixed
- We will credit you in the security advisory (unless you prefer to remain anonymous)
- Please allow us reasonable time to fix the issue before public disclosure

## Security Measures

### Authentication & Authorization

#### Password Security
- **Hashing**: bcrypt with salt rounds (cost factor: 10)
- **Password Requirements**:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character

```typescript
// Password validation schema
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Must contain uppercase letter')
  .regex(/[a-z]/, 'Must contain lowercase letter')
  .regex(/[0-9]/, 'Must contain number')
  .regex(/[^A-Za-z0-9]/, 'Must contain special character');
```

#### Token Management
- **Access Tokens**: 
  - JWT-based
  - Short-lived (15 minutes)
  - Signed with HS256
  - Contains minimal user info (id, isAdmin)

- **Refresh Tokens**:
  - Stored as hashed values in database
  - Long-lived (7 days)
  - Rotated on each use
  - Revocable

```typescript
// Token generation
const accessToken = jwt.sign(
  { id: user.id, isAdmin: user.isAdmin },
  process.env.JWT_SECRET,
  { expiresIn: '15m' }
);
```

#### Session Management
- **Session Storage**: PostgreSQL with connect-pg-simple
- **Session Security**:
  - HttpOnly cookies
  - Secure flag in production
  - SameSite: Strict
  - Session timeout: 7 days
  - Session rotation on privilege change

```typescript
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: 'strict',
  },
  store: new pgStore({ pool }),
}));
```

### Input Validation

#### Request Validation
All user inputs are validated using Zod schemas:

```typescript
// Example: User registration validation
const signupSchema = z.object({
  email: z.string().email('Invalid email'),
  password: passwordSchema,
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must not exceed 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
});

// Validate before processing
app.post('/api/auth/signup', async (req, res) => {
  try {
    const validatedData = signupSchema.parse(req.body);
    // Process validated data
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
  }
});
```

#### SQL Injection Prevention
- **ORM Usage**: Drizzle ORM with parameterized queries
- **No Raw SQL**: All queries use ORM methods

```typescript
// Safe query with Drizzle
const user = await db.select()
  .from(users)
  .where(eq(users.email, email))
  .limit(1);

// NEVER do this:
// const user = await db.execute(`SELECT * FROM users WHERE email = '${email}'`);
```

### Cross-Site Scripting (XSS) Protection

#### Content Security Policy
```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // For Tailwind
      imgSrc: ["'self'", "data:", "https://image.tmdb.org", "https://res.cloudinary.com"],
      connectSrc: ["'self'", "wss:"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'"],
    },
  },
}));
```

#### Output Encoding
- React automatically escapes output
- Manual escaping for dangerous content:

```typescript
// Safe rendering
<div>{userInput}</div> // Automatically escaped

// Dangerous (avoid unless necessary)
<div dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />
```

### Cross-Site Request Forgery (CSRF) Protection

#### CSRF Header Requirement
```typescript
// Require custom header for state-changing requests
const requireCSRFHeader = (req, res, next) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const csrfHeader = req.headers['x-requested-with'];
    if (csrfHeader !== 'XMLHttpRequest') {
      return res.status(403).json({ error: 'CSRF validation failed' });
    }
  }
  next();
};

app.use('/api', requireCSRFHeader);
```

#### SameSite Cookies
```typescript
cookie: {
  sameSite: 'strict', // Prevents CSRF via cookies
}
```

### Rate Limiting

#### API Rate Limits
```typescript
import rateLimit from 'express-rate-limit';

// General API rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth rate limit (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 login attempts per 15 minutes
  skipSuccessfulRequests: true,
});

app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter);
```

#### Brute Force Protection
- Failed login attempts tracking
- Account lockout after 5 failed attempts
- Exponential backoff

```typescript
// Track failed attempts
const failedAttempts = new Map();

app.post('/api/auth/signin', async (req, res) => {
  const { identifier } = req.body;
  const attempts = failedAttempts.get(identifier) || 0;
  
  if (attempts >= 5) {
    return res.status(429).json({ 
      error: 'Account locked due to too many failed attempts' 
    });
  }
  
  // Validate credentials
  const isValid = await validateCredentials(identifier, password);
  
  if (!isValid) {
    failedAttempts.set(identifier, attempts + 1);
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Success - reset attempts
  failedAttempts.delete(identifier);
  // ... proceed with login
});
```

### HTTPS & Transport Security

#### SSL/TLS Configuration
- **Production**: HTTPS only
- **Development**: HTTP allowed
- **Minimum TLS Version**: 1.2
- **Certificate**: Let's Encrypt

```nginx
# Nginx SSL configuration
server {
    listen 443 ssl http2;
    server_name cinehubpro.com;
    
    ssl_certificate /etc/letsencrypt/live/cinehubpro.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cinehubpro.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name cinehubpro.com;
    return 301 https://$server_name$request_uri;
}
```

#### Secure Headers
```typescript
app.use(helmet({
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
}));
```

### Data Protection

#### Sensitive Data Handling
- **Passwords**: Never stored in plain text
- **Tokens**: Never logged or exposed
- **API Keys**: Environment variables only
- **PII**: Encrypted at rest (if applicable)

```typescript
// Logging - redact sensitive data
const logRequest = (req, res) => {
  const safeData = { ...req.body };
  if (safeData.password) safeData.password = '[REDACTED]';
  if (safeData.accessToken) safeData.accessToken = '[REDACTED]';
  
  console.log(`${req.method} ${req.path}`, safeData);
};
```

#### Database Security
- **Connection**: SSL/TLS encrypted
- **Credentials**: Environment variables
- **Access Control**: Least privilege principle
- **Backups**: Encrypted, secure storage

```typescript
// Secure database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: true,
  } : false,
});
```

### OAuth Security

#### OAuth 2.0 Best Practices
- **State Parameter**: CSRF protection
- **PKCE**: For public clients (if applicable)
- **Redirect URI Validation**: Exact match only
- **Scope Limitation**: Request minimum necessary scopes

```typescript
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/api/auth/google/callback',
  scope: ['profile', 'email'], // Minimal scopes
  state: true, // CSRF protection
}, async (accessToken, refreshToken, profile, done) => {
  // Handle OAuth callback
}));
```

### API Security

#### API Key Management
- **Storage**: Environment variables
- **Rotation**: Regular key rotation
- **Exposure**: Never commit to repository
- **Access**: Server-side only

```typescript
// API key validation
const validateAPIKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || apiKey !== process.env.INTERNAL_API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  
  next();
};
```

#### Endpoint Protection
- **Authentication Required**: All user data endpoints
- **Authorization**: Role-based access control
- **Input Validation**: All endpoints
- **Output Filtering**: Remove sensitive fields

```typescript
// Protect sensitive endpoints
app.get('/api/admin/users', requireAuth, requireAdmin, async (req, res) => {
  const users = await storage.getAllUsers();
  
  // Filter sensitive data
  const safeUsers = users.map(u => ({
    id: u.id,
    email: u.email,
    username: u.username,
    // Exclude: password, refreshTokenHash, etc.
  }));
  
  res.json(safeUsers);
});
```

### File Upload Security

#### Cloudinary Security
- **Validation**: File type, size restrictions
- **Sanitization**: Remove EXIF data
- **Access Control**: Signed URLs for private content
- **Rate Limiting**: Upload frequency limits

```typescript
// Secure file upload
const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Invalid file type'));
    }
    cb(null, true);
  },
});

app.post('/api/upload/avatar', requireAuth, upload.single('avatar'), async (req, res) => {
  // Upload to Cloudinary with transformation
  const result = await cloudinary.uploader.upload(req.file.path, {
    folder: 'avatars',
    transformation: [
      { width: 200, height: 200, crop: 'fill' },
      { quality: 'auto' },
    ],
  });
  
  res.json({ url: result.secure_url });
});
```

### Error Handling & Information Disclosure

#### Secure Error Responses
```typescript
// Production error handling
app.use((err, req, res, next) => {
  // Log detailed error server-side
  console.error({
    error: err.message,
    stack: err.stack,
    url: req.url,
    user: req.user?.id,
  });
  
  // Send generic error to client
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    error: isDevelopment ? err.message : 'Internal server error',
    ...(isDevelopment && { stack: err.stack }),
  });
});
```

#### Information Leakage Prevention
- No stack traces in production
- Generic error messages
- No database error details
- No system information exposure

### Dependency Security

#### Regular Updates
```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Update dependencies
npm update
```

#### Security Scanning
- **Dependabot**: Automated dependency updates
- **Snyk**: Vulnerability scanning
- **npm audit**: Regular audits

### Monitoring & Logging

#### Security Logging
```typescript
// Log security events
const logSecurityEvent = (event, details) => {
  console.log({
    type: 'SECURITY',
    event,
    details,
    timestamp: new Date().toISOString(),
  });
};

// Failed login
logSecurityEvent('FAILED_LOGIN', {
  identifier: req.body.identifier,
  ip: req.ip,
});

// Account locked
logSecurityEvent('ACCOUNT_LOCKED', {
  userId: user.id,
  reason: 'Too many failed attempts',
});
```

#### Anomaly Detection
- Monitor failed login attempts
- Track unusual activity patterns
- Alert on suspicious behavior

### Incident Response

#### Response Plan
1. **Detection**: Identify the security incident
2. **Containment**: Isolate affected systems
3. **Investigation**: Determine scope and impact
4. **Remediation**: Fix the vulnerability
5. **Recovery**: Restore normal operations
6. **Post-Incident**: Review and improve

#### Incident Checklist
- [ ] Identify affected users
- [ ] Assess data exposure
- [ ] Notify affected parties
- [ ] Document incident
- [ ] Implement fixes
- [ ] Review and update security measures

## Security Checklist

### Development
- [ ] All inputs validated with Zod schemas
- [ ] Passwords hashed with bcrypt
- [ ] SQL queries use parameterized statements
- [ ] No sensitive data in logs
- [ ] No secrets in code
- [ ] Security headers configured
- [ ] HTTPS enforced in production

### Authentication
- [ ] Strong password requirements
- [ ] Account lockout after failed attempts
- [ ] Session timeout configured
- [ ] JWT tokens properly signed
- [ ] Refresh token rotation
- [ ] OAuth state parameter used

### API
- [ ] Rate limiting implemented
- [ ] CSRF protection enabled
- [ ] Authentication required for sensitive endpoints
- [ ] Authorization checks in place
- [ ] Input validation on all endpoints
- [ ] Output sanitization

### Infrastructure
- [ ] SSL/TLS certificates valid
- [ ] Firewall configured
- [ ] Database access restricted
- [ ] Backup encryption enabled
- [ ] Monitoring alerts configured
- [ ] Incident response plan documented

## Security Tools

### Recommended Tools
- **Helmet.js**: Security headers
- **express-rate-limit**: Rate limiting
- **bcrypt**: Password hashing
- **jsonwebtoken**: JWT tokens
- **Zod**: Schema validation
- **npm audit**: Dependency scanning

### Security Testing
- **OWASP ZAP**: Penetration testing
- **Burp Suite**: Security assessment
- **Snyk**: Vulnerability scanning
- **SonarQube**: Code quality & security

## Security Resources

### Standards & Guidelines
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

### Training
- [Web Security Academy](https://portswigger.net/web-security)
- [OWASP WebGoat](https://owasp.org/www-project-webgoat/)
- [Secure Code Warrior](https://www.securecodewarrior.com/)

## Contact

For security concerns, contact:
- **Email**: security@cinehubpro.com
- **Response Time**: Within 48 hours
- **Emergency**: Critical vulnerabilities prioritized

## Acknowledgments

We thank the security researchers who responsibly disclose vulnerabilities to us.

### Hall of Fame
- [Your name could be here!]

---

Last Updated: January 2024
