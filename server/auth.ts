import bcrypt from "bcrypt";
import type { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { signInSchema, signUpSchema, type SignInData, type SignUpData } from "@shared/schema";
import { 
  verifyAccessToken, 
  extractBearerToken, 
  signAccessToken, 
  signRefreshToken, 
  verifyRefreshToken,
  hashRefreshToken,
  generateSessionId,
  type AccessTokenPayload 
} from "./jwt";

const SALT_ROUNDS = 12;

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET || "fallback-dev-secret",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: 'lax', // CSRF protection for session cookies
      maxAge: sessionTtl,
    },
  });
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(authenticateJWT); // Add JWT middleware to all routes
}

// Extend Request type to include user from JWT
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        isAdmin: boolean;
      };
    }
  }
}

// JWT Authentication Middleware
export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = extractBearerToken(authHeader);
  
  if (!token) {
    return next(); // Continue without user - let dual-mode handle it
  }
  
  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      isAdmin: payload.isAdmin,
    };
    next();
  } catch (error) {
    // Invalid JWT - don't set user but continue for dual-mode fallback
    next();
  }
};

// Dual-mode authentication: prefer JWT, fallback to session
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  // Check JWT first
  if (req.user) {
    return next();
  }
  
  // Fallback to session-based auth
  if (req.session && req.session.userId) {
    return next();
  }
  
  return res.status(401).json({ message: "Unauthorized" });
};

// Admin middleware - requires authentication and admin role
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  // First check if user is authenticated (using JWT)
  if (req.user) {
    if (req.user.isAdmin) {
      return next();
    } else {
      return res.status(403).json({ message: "Admin access required" });
    }
  }
  
  // Fallback to session-based auth - need to fetch user from database
  if (req.session && req.session.userId) {
    // This is async, so we need to handle it properly
    storage.getUser(req.session.userId)
      .then(user => {
        if (user?.isAdmin) {
          next();
        } else {
          res.status(403).json({ message: "Admin access required" });
        }
      })
      .catch(error => {
        console.error('Error checking admin status:', error);
        res.status(500).json({ message: "Internal server error" });
      });
    return; // Important: return here to prevent further execution
  }
  
  // Not authenticated at all
  return res.status(401).json({ message: "Unauthorized" });
};

// Initialize admin user - only runs in development or when explicitly enabled
export async function initializeAdminUser() {
  // Only run in development or when explicitly enabled
  const isDevelopment = process.env.NODE_ENV === 'development';
  const seedAdmin = process.env.SEED_ADMIN === 'true';
  
  if (!isDevelopment && !seedAdmin) {
    return null;
  }

  try {
    // Check if any admin user already exists (efficient query)
    const existingAdmin = await storage.findAdminUser();
    
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.username || existingAdmin.email);
      return existingAdmin;
    }

    // Get admin credentials from environment or use development defaults
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || (isDevelopment ? 'admin123' : null);
    
    if (!adminPassword) {
      console.log('No admin user exists. To create one, set ADMIN_PASSWORD environment variable.');
      return null;
    }

    // Check if user with admin username exists but isn't admin
    const existingUser = await storage.getUserByUsername(adminUsername);
    if (existingUser) {
      if (!existingUser.isAdmin) {
        // Promote existing user to admin
        const promotedUser = await storage.updateUser(existingUser.id, { 
          isAdmin: true, 
          isVerified: true 
        });
        console.log(`Promoted existing user '${adminUsername}' to admin`);
        return promotedUser;
      }
      return existingUser;
    }

    // Create new admin user
    const hashedPassword = await hashPassword(adminPassword);
    
    const adminUser = await storage.createUser({
      username: adminUsername,
      email: adminEmail,
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      isAdmin: true,
      isVerified: true,
    });

    if (isDevelopment) {
      console.log('\n=== ADMIN USER CREATED ===');
      console.log('Username:', adminUsername);
      console.log('Email:', adminEmail);
      console.log('Password: [Check ADMIN_PASSWORD env or use default: admin123]');
      console.log('Please change credentials after first login!');
      console.log('==========================\n');
    } else {
      console.log('Admin user created successfully');
    }
    
    return adminUser;
  } catch (error) {
    console.error('Error initializing admin user:', error);
    return null;
  }
}

export async function signUp(userData: SignUpData) {
  // Check if user already exists
  const existingUserByEmail = userData.email ? await storage.getUserByEmail(userData.email) : null;
  if (existingUserByEmail) {
    throw new Error("User with this email already exists");
  }

  const existingUserByUsername = await storage.getUserByUsername(userData.username);
  if (existingUserByUsername) {
    throw new Error("Username already taken");
  }

  if (userData.phoneNumber) {
    const existingUserByPhone = await storage.getUserByPhoneNumber(userData.phoneNumber);
    if (existingUserByPhone) {
      throw new Error("User with this phone number already exists");
    }
  }

  // Hash password
  const hashedPassword = await hashPassword(userData.password);

  // Create user
  const user = await storage.createUser({
    email: userData.email,
    username: userData.username,
    phoneNumber: userData.phoneNumber,
    password: hashedPassword,
    firstName: userData.firstName,
    lastName: userData.lastName,
  });

  // Return user without password
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export async function signIn(credentials: SignInData) {
  // Use the new getUserByIdentifier method that handles email/username/phone
  const user = await storage.getUserByIdentifier(credentials.identifier);

  if (!user) {
    throw new Error("Invalid credentials");
  }

  // Check if user has a password (some users might be social-only)
  if (!user.password) {
    throw new Error("Please sign in using your social account");
  }

  // Verify password
  const isValidPassword = await verifyPassword(credentials.password, user.password);
  if (!isValidPassword) {
    throw new Error("Invalid credentials");
  }

  // Return user without password
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

// JWT-based signin with token generation
export async function signInWithTokens(credentials: SignInData) {
  // Get user and verify password (reuse existing logic)
  const user = await signIn(credentials);
  
  // Generate session ID and tokens
  const sessionId: string = generateSessionId();
  const refreshToken = signRefreshToken(sessionId);
  const accessToken = signAccessToken({ id: user.id, isAdmin: user.isAdmin || false });
  const refreshTokenHash = await hashRefreshToken(refreshToken);
  
  // Store refresh token session in database
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  await storage.createAuthSession({
    userId: user.id,
    refreshTokenHash,
    expiresAt,
  });
  
  return {
    user,
    accessToken,
    refreshToken,
  };
}

// Refresh access token using refresh token
export async function refreshAccessToken(refreshToken: string) {
  try {
    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);
    const refreshTokenHash = await hashRefreshToken(refreshToken);
    
    // Find session in database
    const session = await storage.getAuthSession(refreshTokenHash);
    if (!session) {
      throw new Error("Invalid refresh token - session not found");
    }
    
    // Check if session is expired
    if (new Date() > session.expiresAt) {
      await storage.deleteAuthSession(session.id);
      throw new Error("Refresh token expired");
    }
    
    // Get user for new access token
    const user = await storage.getUser(session.userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Generate new tokens (rotate refresh token)
    const newSessionId: string = generateSessionId();
    const newRefreshToken = signRefreshToken(newSessionId);
    const newAccessToken = signAccessToken({ id: user.id, isAdmin: user.isAdmin || false });
    const newRefreshTokenHash = await hashRefreshToken(newRefreshToken);
    
    // Update session with new refresh token hash
    await storage.updateAuthSession(session.id, {
      refreshTokenHash: newRefreshTokenHash,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Extend expiry
    });
    
    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  } catch (error) {
    throw new Error("Failed to refresh token");
  }
}

// Logout and invalidate refresh token
export async function logoutWithToken(refreshToken: string) {
  try {
    const refreshTokenHash = await hashRefreshToken(refreshToken);
    const session = await storage.getAuthSession(refreshTokenHash);
    
    if (session) {
      await storage.deleteAuthSession(session.id);
    }
    
    return true;
  } catch (error) {
    // Even if logout fails, we should succeed silently for security
    return true;
  }
}

// Extend session type to include userId
declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}