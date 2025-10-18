import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import {
  setupAuth,
  isAuthenticated,
  isAdmin,
  signUp,
  signIn,
  signInWithTokens,
  refreshAccessToken,
  logoutWithToken,
  hashPassword,
} from "./auth";
import passport from "./passport";
import { z } from "zod";
import {
  insertWatchlistSchema,
  insertWatchlistItemSchema,
  insertFavoriteSchema,
  insertReviewSchema,
  insertViewingHistorySchema,
  insertActivityHistorySchema,
  insertSearchHistorySchema,
  signInSchema,
  signUpSchema,
} from "@shared/schema";
import { sendOTP, verifyOTP } from "./services/otpService";
import {
  generateUploadSignature,
  validateCloudinaryUrl,
  isCloudinaryConfigured,
  uploadToCloudinary,
  deleteFromCloudinary,
} from "./services/cloudinaryService";
import { tmdbCacheService } from "./services/tmdbCache.js";
import { websocketService } from "./services/websocketService.js";
import { cacheQueueService } from "./services/cacheQueue.js";
import { buildMovieDiscoverParams, buildTVDiscoverParams, shouldUseTrendingEndpoint, type MovieCategory, type TVCategory } from "./utils/tmdbDiscover.js";

// Robust TMDB API helper function with retry logic and Bearer token support
async function fetchFromTMDB(
  endpoint: string,
  params: Record<string, any> = {},
  options: { useBearer?: boolean } = {}
): Promise<any> {
  const { useBearer = false } = options;

  // Check for required authentication
  if (!useBearer && !process.env.TMDB_API_KEY) {
    throw new Error("TMDB API key not configured");
  }
  if (useBearer && !process.env.TMDB_ACCESS_TOKEN) {
    throw new Error("TMDB Access Token not configured");
  }

  // Build URL with parameters (filter out undefined values)
  const filteredParams: Record<string, string> = {};

  // Add API key only if not using Bearer token
  if (!useBearer && process.env.TMDB_API_KEY) {
    filteredParams.api_key = process.env.TMDB_API_KEY;
  }

  // Only add parameters that are not undefined, null, empty, or the string "undefined"
  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== "" &&
      value !== "undefined"
    ) {
      filteredParams[key] = String(value);
    }
  });

  const searchParams = new URLSearchParams(filteredParams);
  // TMDB API expects literal pipe characters for OR logic (genres, keywords), but commas for append_to_response
  // Replace %7C with | for OR logic, and %2C with , (comma) for lists like append_to_response
  const queryString = searchParams.toString().replace(/%7C/g, '|').replace(/%2C/g, ',');
  const url = `https://api.themoviedb.org/3${endpoint}?${queryString}`;

  // Debug URL construction - credentials redacted for security
  if (process.env.NODE_ENV === "development") {
    const debugUrl = url.replace(/api_key=[^&]+/, "api_key=***REDACTED***");
    console.log(`TMDB API URL: ${debugUrl} ${useBearer ? '(Bearer Auth)' : '(API Key)'}`);
  }

  // Retry configuration
  const maxRetries = 3;
  const baseDelay = 250; // 250ms base delay

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    try {
      const headers: Record<string, string> = {
        Accept: "application/json",
        "User-Agent": "CineHub/1.0",
      };

      // Add Bearer token if requested
      if (useBearer && process.env.TMDB_ACCESS_TOKEN) {
        headers.Authorization = `Bearer ${process.env.TMDB_ACCESS_TOKEN}`;
      }

      const response = await fetch(url, {
        signal: controller.signal,
        headers,
      });

      clearTimeout(timeoutId);

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After");
        const delay = retryAfter
          ? parseInt(retryAfter) * 1000
          : baseDelay * Math.pow(2, attempt);
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
      }

      // Handle server errors (5xx) with retry
      if (response.status >= 500 && attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 100; // Add jitter
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `TMDB API returned ${response.status}: ${response.statusText}. Body: ${errorText}`,
        );
      }

      const responseText = await response.text();
      if (!responseText.trim()) {
        throw new Error("TMDB API returned empty response");
      }

      try {
        return JSON.parse(responseText);
      } catch (parseError) {
        console.error(
          "Failed to parse TMDB response:",
          responseText.substring(0, 200),
        );
        throw new Error("TMDB API returned invalid JSON");
      }
    } catch (error: any) {
      clearTimeout(timeoutId);

      // Check for network errors that should be retried
      const isNetworkError =
        error.name === "AbortError" ||
        error.code === "ECONNRESET" ||
        error.code === "ETIMEDOUT" ||
        error.code === "ENOTFOUND" ||
        error.code === "EAI_AGAIN" ||
        error.cause?.code === "ECONNRESET" ||
        error.cause?.code === "ETIMEDOUT" ||
        error.message?.includes("UND_ERR_") ||
        error.message?.includes("network");

      if (isNetworkError && attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 100; // Add jitter
        console.warn(
          `TMDB API network error (attempt ${attempt + 1}/${maxRetries + 1}):`,
          error.message,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      // Final attempt failed or non-retryable error
      if (error.name === "AbortError") {
        throw new Error("TMDB API request timed out after 15 seconds");
      } else if (isNetworkError) {
        throw new Error("TMDB API connection failed after retries");
      } else {
        throw error;
      }
    }
  }
}

// Multer configuration for profile photo uploads
// Using memoryStorage to keep files in memory before uploading to Cloudinary
const multerStorage = multer.memoryStorage();

// Safe file extensions and MIME types
const allowedImageTypes = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
};

const upload = multer({
  storage: multerStorage,
  fileFilter: (req, file, cb) => {
    // Check MIME type and extension
    const allowedExtensions = allowedImageTypes[file.mimetype];
    const fileExt = path.extname(file.originalname).toLowerCase();

    if (allowedExtensions && allowedExtensions.includes(fileExt)) {
      cb(null, true);
    } else {
      const error = new Error(
        "Only JPEG, PNG, and WebP images are allowed!",
      ) as any;
      error.code = "INVALID_FILE_TYPE";
      cb(error, false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Create rate limiters
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 API requests per windowMs
  message: "Too many API requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 auth requests per windowMs
  message: "Too many authentication attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// CSRF protection middleware - require X-Requested-With header for all state-changing requests
const requireCSRFHeader = (req: any, res: any, next: any) => {
  // Skip CSRF check for GET requests (safe methods)
  if (
    req.method === "GET" ||
    req.method === "HEAD" ||
    req.method === "OPTIONS"
  ) {
    return next();
  }

  // Require CSRF header for ALL state-changing requests (authenticated or not)
  const csrfHeader = req.headers["x-requested-with"];
  if (!csrfHeader || csrfHeader !== "XMLHttpRequest") {
    return res
      .status(403)
      .json({ message: "CSRF protection: Invalid request" });
  }

  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Security headers - stricter CSP for production
  const isProduction = process.env.NODE_ENV === "production";
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            "https://fonts.googleapis.com",
            "https://cdnjs.cloudflare.com",
          ], // Keep for CSS-in-JS frameworks and external fonts
          scriptSrc: isProduction
            ? ["'self'"]
            : ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          imgSrc: [
            "'self'",
            "data:",
            "https://image.tmdb.org",
            "https://via.placeholder.com",
            "https://res.cloudinary.com",
            "https://i.ytimg.com",
          ],
          connectSrc: [
            "'self'",
            "wss:",
            "https://api.cloudinary.com",
            "https://upload.cloudinary.com",
            ...(isProduction ? [] : ["https://api.themoviedb.org"]),
          ], // Allow TMDB API in dev for debugging
          fontSrc: [
            "'self'",
            "data:",
            "https://fonts.gstatic.com",
            "https://cdnjs.cloudflare.com",
          ],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: [
            "'self'",
            "https://www.youtube.com",
            "https://www.youtube-nocookie.com",
          ],
          frameAncestors: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  // Enable compression
  app.use(compression());

  // Health check endpoint - before rate limiting for monitoring
  app.get("/health", (req, res) => {
    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development",
    });
  });

  // Apply rate limiting (excluding health check)
  app.use((req, res, next) => {
    if (req.path === "/health") {
      return next();
    }
    generalLimiter(req, res, next);
  });
  app.use("/api", apiLimiter);
  app.use("/api/auth", authLimiter);

  // Apply CSRF protection to ALL API routes (now that session is available)
  app.use("/api", requireCSRFHeader);

  // Cookie parser middleware for JWT refresh tokens
  app.use(cookieParser());

  // Serve uploaded images statically
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  // Auth middleware - MUST be before CSRF middleware so req.session is available
  await setupAuth(app);

  // Initialize passport for OAuth
  app.use(passport.initialize());
  app.use(passport.session());

  // Auth routes
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      // Support both JWT (req.user) and session-based auth (req.session.userId)
      const userId = req.user?.id || req.session?.userId;

      if (!userId) {
        return res.status(401).json({ message: "No user ID found" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post("/api/auth/signup", async (req, res) => {
    try {
      const userData = signUpSchema.parse(req.body);
      const user = await signUp(userData);

      // Get verification target (email or phone)
      const verificationTarget = userData.email || userData.phoneNumber;
      if (!verificationTarget) {
        return res.status(400).json({
          message: "Either email or phone number is required for verification",
        });
      }

      // Send OTP via Twilio Verify Service (automatically generates and sends OTP)
      const otpResult = await sendOTP(verificationTarget, "signup");
      if (!otpResult.success) {
        console.error(
          `Failed to send signup OTP to ${verificationTarget}:`,
          otpResult.error,
        );
        return res.status(500).json({
          message:
            "Account created but failed to send verification code. Please try signing in to resend the verification code.",
          error: `OTP delivery failed: ${otpResult.error}`,
        });
      }

      // Don't set session - user needs to verify first
      res.status(201).json({
        message:
          "Account created successfully. Please verify your account with the OTP sent to your email or phone.",
        verificationTarget,
        requiresVerification: true,
      });
    } catch (error) {
      console.error("Signup error:", error);
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid input", errors: error.errors });
      }
      res.status(400).json({
        message: error instanceof Error ? error.message : "Signup failed",
      });
    }
  });

  app.post("/api/auth/signin", async (req, res) => {
    try {
      const credentials = signInSchema.parse(req.body);
      const user = await signIn(credentials);

      // Check if user is verified - block unverified users
      if (!user.isVerified) {
        // Send OTP for verification
        const verificationTarget = user.email || user.phoneNumber;
        if (verificationTarget) {
          // Send OTP via Twilio Verify Service
          const otpResult = await sendOTP(verificationTarget, "signup");
          if (!otpResult.success) {
            console.error(
              `Failed to send signin verification OTP to ${verificationTarget}:`,
              otpResult.error,
            );
            return res.status(500).json({
              message:
                "Failed to send verification code. Please try again later.",
              error: `OTP delivery failed: ${otpResult.error}`,
            });
          }
        }

        return res.status(403).json({
          message:
            "Please verify your account first. Check your email or phone for the verification code.",
          requiresVerification: true,
          verificationTarget: verificationTarget,
        });
      }

      // Set session only for verified users with extended expiration if remember me is checked
      req.session.userId = user.id;

      // Update session cookie expiration based on remember me setting
      if (credentials.rememberMe) {
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      } else {
        req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days (default)
      }

      res.json({ user, message: "Signed in successfully" });
    } catch (error) {
      console.error("Signin error:", error);
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid input", errors: error.errors });
      }
      res.status(401).json({
        message: error instanceof Error ? error.message : "Signin failed",
      });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    let jwtRevoked = true;
    let sessionDestroyed = true;

    // Clear JWT refresh token if present
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      try {
        await logoutWithToken(refreshToken);
      } catch (error) {
        console.error("JWT logout error - refresh token revocation failed:", error);
        jwtRevoked = false;
      }
    }

    // Clear JWT refresh token cookie (always clear even if revocation failed)
    res.clearCookie("refreshToken", {
      path: "/api/auth",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    // Destroy session (only if session exists)
    if (req.session) {
      await new Promise<void>((resolve) => {
        req.session.destroy((err) => {
          if (err) {
            console.error("Session destroy error:", err);
            sessionDestroyed = false;
          }
          // Always resolve - we check sessionDestroyed flag later
          resolve();
        });
      });
    } else {
      // No session exists (e.g., JWT-only authentication) - this is not an error
      sessionDestroyed = true;
    }

    // Clear session cookie (always clear even if destroy failed)
    res.clearCookie("connect.sid");

    // Return appropriate status based on what succeeded
    if (!jwtRevoked && refreshToken) {
      // JWT revocation failed - this is a security issue
      console.error("CRITICAL: Logout failed to revoke JWT refresh token");
      return res.status(500).json({ 
        message: "Logout failed - please try again or contact support if the issue persists" 
      });
    }

    if (!sessionDestroyed) {
      console.error("WARNING: Logout failed to destroy session");
      return res.status(500).json({ 
        message: "Logout failed - please try again" 
      });
    }

    res.json({ message: "Logged out successfully" });
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { identifier } = req.body;

      if (!identifier) {
        return res
          .status(400)
          .json({ message: "Email, username, or phone number is required" });
      }

      // Check if user exists
      let user = null;
      if (identifier.includes("@")) {
        user = await storage.getUserByEmail(identifier);
      } else if (identifier.startsWith("+")) {
        user = await storage.getUserByPhoneNumber(identifier);
      } else {
        user = await storage.getUserByUsername(identifier);
      }

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get the user's email or phone number for OTP delivery
      const otpTarget = user.email || user.phoneNumber;
      if (!otpTarget) {
        return res.status(400).json({
          message: "User has no email or phone number for password reset",
        });
      }

      // Send OTP via Twilio Verify Service
      const otpResult = await sendOTP(otpTarget, "reset");
      if (!otpResult.success) {
        console.error(
          `Failed to send password reset OTP to ${otpTarget}:`,
          otpResult.error,
        );
        return res.status(500).json({
          message:
            "Failed to send password reset code. Please try again later.",
          error: `OTP delivery failed: ${otpResult.error}`,
        });
      }

      res.json({
        message: "Password reset code sent successfully",
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Failed to send password reset code" });
    }
  });

  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { otp, identifier, purpose } = req.body;

      if (!otp || !identifier || !purpose) {
        return res
          .status(400)
          .json({ message: "OTP, identifier, and purpose are required" });
      }

      // Verify OTP using Twilio Verify Service
      const verifyResult = await verifyOTP(identifier, otp);

      if (!verifyResult.success) {
        return res.status(401).json({ 
          message: verifyResult.error || "Invalid or expired OTP" 
        });
      }

      // If this is signup verification, log the user in and mark as verified
      if (purpose === "signup") {
        const user = await storage.getUserByIdentifier(identifier);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // Mark user as verified
        await storage.updateUser(user.id, { isVerified: true });

        // Set session to log user in
        req.session.userId = user.id;

        // Return updated user data
        const updatedUser = await storage.getUser(user.id);
        const { password, ...userWithoutPassword } = updatedUser!;

        res.json({
          message: "Account verified and signed in successfully",
          user: userWithoutPassword,
          type: "signup",
        });
      } else {
        // For reset verification, just confirm verification
        res.json({
          message: "OTP verified successfully",
          type: purpose,
        });
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      res.status(500).json({ message: "Failed to verify OTP" });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { identifier, newPassword, otpCode } = req.body;

      if (!identifier || !newPassword || !otpCode) {
        return res.status(400).json({
          message: "Identifier, new password, and OTP code are required",
        });
      }

      if (newPassword.length < 8) {
        return res
          .status(400)
          .json({ message: "Password must be at least 8 characters" });
      }

      // For password reset, we need to find the user first to get their actual contact info
      // since the identifier might be a username but OTP was sent to email/phone
      let user = null;
      if (identifier.includes("@")) {
        user = await storage.getUserByEmail(identifier);
      } else if (identifier.startsWith("+")) {
        user = await storage.getUserByPhoneNumber(identifier);
      } else {
        user = await storage.getUserByUsername(identifier);
      }

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get the actual target that was used for OTP (email or phone)
      const otpTarget = user.email || user.phoneNumber;
      if (!otpTarget) {
        return res.status(400).json({
          message: "User has no email or phone number for password reset",
        });
      }

      // Verify OTP using Twilio Verify Service
      const verifyResult = await verifyOTP(otpTarget, otpCode);
      if (!verifyResult.success) {
        return res.status(400).json({ 
          message: verifyResult.error || "Invalid or expired OTP code" 
        });
      }

      // Hash new password and update
      const hashedPassword = await hashPassword(newPassword);

      await storage.updateUser(user.id, { password: hashedPassword });

      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // JWT-based authentication routes
  app.post("/api/auth/signin-jwt", async (req, res) => {
    try {
      const credentials = signInSchema.parse(req.body);

      // First verify credentials (without creating tokens yet)
      const user = await signIn(credentials);

      // Check if user is verified - block unverified users
      if (!user.isVerified) {
        // Send OTP for verification
        const verificationTarget = user.email || user.phoneNumber;
        if (verificationTarget) {
          // Send OTP via Twilio Verify Service
          const otpResult = await sendOTP(
            verificationTarget,
            "signup",
          );
          if (!otpResult.success) {
            console.error(
              `Failed to send signin verification OTP to ${verificationTarget}:`,
              otpResult.error,
            );
            return res.status(500).json({
              message:
                "Failed to send verification code. Please try again later.",
              error: `OTP delivery failed: ${otpResult.error}`,
            });
          }
        }

        return res.status(403).json({
          message:
            "Please verify your account first. Check your email or phone for the verification code.",
          requiresVerification: true,
          verificationTarget: verificationTarget,
        });
      }

      // Only create tokens for verified users
      const result = await signInWithTokens(credentials);

      // Set refresh token as httpOnly cookie
      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: "/api/auth",
      });

      res.json({
        user: result.user,
        accessToken: result.accessToken,
        message: "Signed in successfully",
      });
    } catch (error) {
      console.error("JWT signin error:", error);
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid input", errors: error.errors });
      }
      res.status(401).json({
        message: error instanceof Error ? error.message : "Signin failed",
      });
    }
  });

  app.post("/api/auth/refresh", async (req, res) => {
    try {
      // CSRF protection: require custom header for token refresh
      const csrfHeader = req.headers["x-requested-with"];
      if (!csrfHeader || csrfHeader !== "XMLHttpRequest") {
        return res.status(403).json({ message: "Invalid request" });
      }

      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({ message: "No refresh token provided" });
      }

      const result = await refreshAccessToken(refreshToken);

      // Set new refresh token as httpOnly cookie
      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: "/api/auth",
      });

      res.json({ accessToken: result.accessToken });
    } catch (error) {
      console.error("Token refresh error:", error);
      res.clearCookie("refreshToken", {
        path: "/api/auth",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
      res.status(401).json({ message: "Failed to refresh token" });
    }
  });

  app.post("/api/auth/logout-jwt", async (req, res) => {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (refreshToken) {
        await logoutWithToken(refreshToken);
      }

      res.clearCookie("refreshToken", {
        path: "/api/auth",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("JWT logout error:", error);
      // Still clear cookie and succeed for security
      res.clearCookie("refreshToken", {
        path: "/api/auth",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
      res.json({ message: "Logged out successfully" });
    }
  });

  // Social Authentication Routes

  // Google OAuth
  app.get("/api/auth/google", passport.authenticate("google"));

  app.get(
    "/api/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/?auth=failed" }),
    (req: any, res) => {
      // Set session for authenticated user
      if (req.user) {
        req.session.userId = req.user.id;
        res.redirect("/?auth=success");
      } else {
        res.redirect("/?auth=failed");
      }
    },
  );

  // Facebook OAuth
  app.get("/api/auth/facebook", passport.authenticate("facebook"));

  app.get(
    "/api/auth/facebook/callback",
    passport.authenticate("facebook", { failureRedirect: "/?auth=failed" }),
    (req: any, res) => {
      if (req.user) {
        req.session.userId = req.user.id;
        res.redirect("/?auth=success");
      } else {
        res.redirect("/?auth=failed");
      }
    },
  );

  // GitHub OAuth
  app.get("/api/auth/github", passport.authenticate("github"));

  app.get(
    "/api/auth/github/callback",
    passport.authenticate("github", { failureRedirect: "/?auth=failed" }),
    (req: any, res) => {
      if (req.user) {
        req.session.userId = req.user.id;
        res.redirect("/?auth=success");
      } else {
        res.redirect("/?auth=failed");
      }
    },
  );

  // Twitter OAuth
  app.get("/api/auth/twitter", passport.authenticate("twitter"));

  app.get(
    "/api/auth/twitter/callback",
    passport.authenticate("twitter", { failureRedirect: "/?auth=failed" }),
    (req: any, res) => {
      if (req.user) {
        req.session.userId = req.user.id;
        res.redirect("/?auth=success");
      } else {
        res.redirect("/?auth=failed");
      }
    },
  );

  // Simple rate limiting for uploads (in production, use proper rate limiter like express-rate-limit)
  const uploadAttempts = new Map<
    string,
    { count: number; resetTime: number }
  >();

  const checkUploadRateLimit = (req: any, res: any, next: any) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const resetInterval = 15 * 60 * 1000; // 15 minutes
    const maxUploads = 5; // 5 uploads per 15 minutes per IP

    if (!uploadAttempts.has(ip)) {
      uploadAttempts.set(ip, { count: 1, resetTime: now + resetInterval });
      return next();
    }

    const attempt = uploadAttempts.get(ip)!;
    if (now > attempt.resetTime) {
      // Reset the counter
      uploadAttempts.set(ip, { count: 1, resetTime: now + resetInterval });
      return next();
    }

    if (attempt.count >= maxUploads) {
      return res
        .status(429)
        .json({ message: "Too many upload attempts. Please try again later." });
    }

    attempt.count++;
    next();
  };

  // Profile photo upload route with basic rate limiting
  app.post(
    "/api/auth/upload-profile-photo",
    checkUploadRateLimit,
    upload.single("profilePhoto"),
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "No file uploaded" });
        }

        // Check if Cloudinary is configured
        if (!isCloudinaryConfigured()) {
          return res.status(503).json({
            message: "Image upload service not configured. Please contact support.",
          });
        }

        // Upload to Cloudinary
        const result = await uploadToCloudinary(req.file.buffer);
        const profileImageUrl = result.secure_url;

        res.json({
          message: "Profile photo uploaded successfully",
          profileImageUrl,
        });
      } catch (error) {
        console.error("Profile photo upload error:", error);
        res.status(500).json({ message: "Failed to upload profile photo" });
      }
    },
  );

  // Update user profile photo route (for authenticated users)
  app.post(
    "/api/auth/update-profile-photo",
    isAuthenticated,
    upload.single("profilePhoto"),
    async (req: any, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "No file uploaded" });
        }

        // Support both JWT (req.user) and session-based auth (req.session.userId)
        const userId = req.user?.id || req.session?.userId;

        if (!userId) {
          return res.status(401).json({ message: "No user ID found" });
        }

        // Check if Cloudinary is configured
        if (!isCloudinaryConfigured()) {
          return res.status(503).json({
            message: "Image upload service not configured. Please contact support.",
          });
        }

        // Upload to Cloudinary with userId for organization
        const result = await uploadToCloudinary(req.file.buffer, userId);
        const profileImageUrl = result.secure_url;

        // Update user's profile image in database
        await storage.updateUser(userId, { profileImageUrl });

        res.json({
          message: "Profile photo updated successfully",
          profileImageUrl,
        });
      } catch (error) {
        console.error("Profile photo update error:", error);
        res.status(500).json({ message: "Failed to update profile photo" });
      }
    },
  );

  // Cloudinary signed upload endpoint
  app.post(
    "/api/profile/avatar/sign",
    isAuthenticated,
    async (req: any, res) => {
      try {
        if (!isCloudinaryConfigured()) {
          return res.status(503).json({
            message: "Image upload service not configured",
            useLocalUpload: true,
          });
        }

        // Support both JWT (req.user) and session-based auth (req.session.userId)
        const userId = req.user?.id || req.session?.userId;

        if (!userId) {
          return res.status(401).json({ message: "No user ID found" });
        }

        // Generate unique public_id for the user's avatar
        const publicId = `profile_pictures/${userId}_${Date.now()}`;

        const signatureData = generateUploadSignature({
          public_id: publicId,
          folder: "profile_pictures",
        });

        res.json(signatureData);
      } catch (error) {
        console.error("Cloudinary signature error:", error);
        res
          .status(500)
          .json({ message: "Failed to generate upload signature" });
      }
    },
  );

  // Update profile picture URL after Cloudinary upload
  app.patch("/api/profile/avatar", isAuthenticated, async (req: any, res) => {
    try {
      // Support both JWT (req.user) and session-based auth (req.session.userId)
      const userId = req.user?.id || req.session?.userId;

      if (!userId) {
        return res.status(401).json({ message: "No user ID found" });
      }

      const { secure_url, public_id } = req.body;

      if (!secure_url || typeof secure_url !== "string") {
        return res
          .status(400)
          .json({ message: "Valid secure_url is required" });
      }

      if (!public_id || typeof public_id !== "string") {
        return res
          .status(400)
          .json({ message: "Valid public_id is required" });
      }

      // Validate that the URL is from our configured Cloudinary account and belongs to this user
      const isValidUrl = validateCloudinaryUrl(secure_url, userId);
      if (!isValidUrl) {
        console.error('Cloudinary URL validation failed:', {
          url: secure_url,
          userId,
          cloudName: process.env.CLOUDINARY_CLOUD_NAME
        });
        return res
          .status(400)
          .json({ message: "Invalid image URL or unauthorized access" });
      }

      // SECURITY: Validate that public_id follows the expected pattern for user avatars
      // Must be in the format: profile_pictures/<userId>_<something>
      const expectedPrefix = `profile_pictures/${userId}_`;
      if (!public_id.startsWith(expectedPrefix)) {
        console.error('Public ID validation failed:', {
          publicId: public_id,
          userId,
          expectedPrefix
        });
        return res
          .status(400)
          .json({ message: "Invalid public_id - must belong to current user" });
      }

      // Get current user to check for existing avatar
      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Delete old avatar from Cloudinary if it exists
      if (currentUser.avatarPublicId && isCloudinaryConfigured()) {
        try {
          await deleteFromCloudinary(currentUser.avatarPublicId);
          console.log(`Deleted old avatar: ${currentUser.avatarPublicId}`);
        } catch (error) {
          console.error('Failed to delete old avatar from Cloudinary:', error);
          // Continue with update even if deletion fails
        }
      }

      // Update user's profile image and public_id in database
      await storage.updateUser(userId, { 
        profileImageUrl: secure_url,
        avatarPublicId: public_id
      });

      // Get updated user to return
      const updatedUser = await storage.getUser(userId);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        message: "Profile picture updated successfully",
        profileImageUrl: secure_url,
        user: updatedUser,
      });
    } catch (error) {
      console.error("Profile picture update error:", error);
      res.status(500).json({ message: "Failed to update profile picture" });
    }
  });

  // Delete profile avatar
  app.delete("/api/profile/avatar", isAuthenticated, async (req: any, res) => {
    try {
      // Support both JWT (req.user) and session-based auth (req.session.userId)
      const userId = req.user?.id || req.session?.userId;

      if (!userId) {
        return res.status(401).json({ message: "No user ID found" });
      }

      // Get current user to check for existing avatar
      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Delete avatar from Cloudinary if it exists
      if (currentUser.avatarPublicId && isCloudinaryConfigured()) {
        try {
          await deleteFromCloudinary(currentUser.avatarPublicId);
          console.log(`Deleted avatar: ${currentUser.avatarPublicId}`);
        } catch (error) {
          console.error('Failed to delete avatar from Cloudinary:', error);
          // Continue with database update even if Cloudinary deletion fails
        }
      }

      // Remove profile image URLs from database
      await storage.updateUser(userId, { 
        profileImageUrl: null,
        avatarPublicId: null
      });

      // Get updated user to return
      const updatedUser = await storage.getUser(userId);

      res.json({
        message: "Profile picture deleted successfully",
        user: updatedUser,
      });
    } catch (error) {
      console.error("Profile picture deletion error:", error);
      res.status(500).json({ message: "Failed to delete profile picture" });
    }
  });

  // Update user profile route (for authenticated users)
  app.put("/api/auth/profile", isAuthenticated, async (req: any, res) => {
    try {
      // Support both JWT (req.user) and session-based auth (req.session.userId)
      const userId = req.user?.id || req.session?.userId;

      if (!userId) {
        return res.status(401).json({ message: "No user ID found" });
      }

      // Validate the request body
      const { firstName, lastName, username, email } = req.body;

      if (!firstName || !lastName || !username || !email) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // Check if username/email is already taken by another user
      const existingUsers = await storage.getAllUsers();
      const existingUser = existingUsers.find(
        (u) =>
          u.id !== userId && (u.username === username || u.email === email),
      );

      if (existingUser) {
        const field = existingUser.username === username ? "username" : "email";
        return res
          .status(400)
          .json({ message: `This ${field} is already taken` });
      }

      // Update user profile in database
      const updatedUser = await storage.updateUser(userId, {
        firstName,
        lastName,
        username,
        email,
      });

      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;

      res.json({
        message: "Profile updated successfully",
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // TMDB proxy endpoints (to avoid CORS and secure API key)
  app.get("/api/movies/trending", async (req, res) => {
    try {
      const page = Number(req.query.page) || 1;
      
      // Use the original trending endpoint for most accurate trending results
      const timeWindow = req.query.time_window || "day";
      const data = await fetchFromTMDB(`/trending/movie/${timeWindow}`, {
        page,
      });
      
      res.json(data);
    } catch (error) {
      console.error("Error fetching trending movies:", error);
      res.status(500).json({ message: "Failed to fetch trending movies" });
    }
  });

  app.get("/api/tv/trending", async (req, res) => {
    try {
      const page = Number(req.query.page) || 1;
      
      // Use the original trending endpoint for most accurate trending results
      const timeWindow = req.query.time_window || "week";
      const data = await fetchFromTMDB(`/trending/tv/${timeWindow}`, { page });
      
      res.json(data);
    } catch (error) {
      console.error("Error fetching trending TV shows:", error);
      res.status(500).json({ message: "Failed to fetch trending TV shows" });
    }
  });

  app.get("/api/tv/popular", async (req, res) => {
    try {
      const page = Number(req.query.page) || 1;
      const params = buildTVDiscoverParams('popular', page);
      const data = await fetchFromTMDB("/discover/tv", params);
      res.json(data);
    } catch (error) {
      console.error("Error fetching popular TV shows:", error);
      res.status(500).json({ message: "Failed to fetch popular TV shows" });
    }
  });

  app.get("/api/tv/top-rated", async (req, res) => {
    try {
      const page = Number(req.query.page) || 1;
      const params = buildTVDiscoverParams('top_rated', page);
      const data = await fetchFromTMDB("/discover/tv", params);
      res.json(data);
    } catch (error) {
      console.error("Error fetching top rated TV shows:", error);
      res.status(500).json({ message: "Failed to fetch top rated TV shows" });
    }
  });

  app.get("/api/tv/on-the-air", async (req, res) => {
    try {
      const page = Number(req.query.page) || 1;
      const params = buildTVDiscoverParams('on_the_air', page);
      const data = await fetchFromTMDB("/discover/tv", params);
      res.json(data);
    } catch (error) {
      console.error("Error fetching on-the-air TV shows:", error);
      res.status(500).json({ message: "Failed to fetch on-the-air TV shows" });
    }
  });

  // Add alias with underscore for frontend compatibility
  app.get("/api/tv/on_the_air", async (req, res) => {
    try {
      const page = Number(req.query.page) || 1;
      const params = buildTVDiscoverParams('on_the_air', page);
      const data = await fetchFromTMDB("/discover/tv", params);
      res.json(data);
    } catch (error) {
      console.error("Error fetching on-the-air TV shows:", error);
      res.status(500).json({ message: "Failed to fetch on-the-air TV shows" });
    }
  });

  // Add alias with underscore for frontend compatibility
  app.get("/api/tv/airing_today", async (req, res) => {
    try {
      const page = Number(req.query.page) || 1;
      const params = buildTVDiscoverParams('airing_today', page);
      const data = await fetchFromTMDB("/discover/tv", params);
      res.json(data);
    } catch (error) {
      console.error("Error fetching airing today TV shows:", error);
      res
        .status(500)
        .json({ message: "Failed to fetch airing today TV shows" });
    }
  });

  app.get("/api/tv/airing-today", async (req, res) => {
    try {
      const page = Number(req.query.page) || 1;
      const params = buildTVDiscoverParams('airing_today', page);
      const data = await fetchFromTMDB("/discover/tv", params);
      res.json(data);
    } catch (error) {
      console.error("Error fetching airing today TV shows:", error);
      res
        .status(500)
        .json({ message: "Failed to fetch airing today TV shows" });
    }
  });


  app.get("/api/tv/search", async (req, res) => {
    try {
      const query = req.query.query;
      const page = req.query.page || 1;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      const data = await fetchFromTMDB(
        `https://api.themoviedb.org/3/search/tv?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(query as string)}&page=${page}`,
      );
      res.json(data);
    } catch (error) {
      console.error("Error searching TV shows:", error);
      res.status(500).json({ message: "Failed to search TV shows" });
    }
  });

  // Unified search endpoint for both movies and TV shows
  app.get("/api/search", async (req, res) => {
    try {
      const {
        query,
        page = 1,
        genre,
        year,
        rating,
        sort = "popularity.desc",
      } = req.query;

      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }

      // Check if any filters are applied - be explicit about what constitutes a real filter
      // Also check for literal string 'undefined' which can come from frontend
      const hasGenreFilter =
        genre && genre !== "all" && genre !== "" && genre !== "undefined";
      const hasYearFilter =
        year && year !== "all" && year !== "" && year !== "undefined";
      const hasRatingFilter =
        rating && rating !== "0" && rating !== "" && rating !== "undefined";
      // Only count sort as a filter if it's explicitly set to something other than default values
      const hasSortFilter =
        sort &&
        sort !== "relevance" &&
        sort !== "popularity.desc" &&
        sort !== "" &&
        sort !== "undefined";

      const hasFilters =
        hasGenreFilter || hasYearFilter || hasRatingFilter || hasSortFilter;

      if (!hasFilters) {
        // No filters, use simple search endpoint
        const data = await fetchFromTMDB("/search/multi", {
          query: query as string,
          page,
        });
        res.json(data);
        return;
      }

      // When filters are applied, we need to use discover endpoints
      // and merge results from movies and TV shows
      // Use the same page number for both endpoints to ensure proper pagination
      const currentPage = Number(page);

      const movieParams: Record<string, any> = {
        page: currentPage,
        sort_by:
          sort === "relevance" ? "popularity.desc" : sort || "popularity.desc",
      };

      const tvParams: Record<string, any> = {
        page: currentPage,
        sort_by:
          sort === "relevance" ? "popularity.desc" : sort || "popularity.desc",
      };

      // Add search query as keyword if provided
      if (query && query.toString().trim()) {
        const keywordResponse = await fetchFromTMDB("/search/keyword", {
          query: query as string,
        });
        if (keywordResponse.results && keywordResponse.results.length > 0) {
          const keywordIds = keywordResponse.results
            .slice(0, 5)
            .map((k: any) => k.id)
            .join(",");
          movieParams.with_keywords = keywordIds;
          tvParams.with_keywords = keywordIds;
        }
      }

      // Apply filters
      if (genre && genre !== "all") {
        movieParams.with_genres = genre;
        tvParams.with_genres = genre;
      }

      if (year && year !== "all") {
        movieParams.primary_release_year = year;
        tvParams.first_air_date_year = year;
      }

      if (rating && rating !== "0") {
        movieParams["vote_average.gte"] = rating;
        tvParams["vote_average.gte"] = rating;
      }

      // Fetch from both endpoints in parallel
      const [movieData, tvData] = await Promise.all([
        fetchFromTMDB("/discover/movie", movieParams).catch(() => ({
          results: [],
          total_results: 0,
          total_pages: 0,
        })),
        fetchFromTMDB("/discover/tv", tvParams).catch(() => ({
          results: [],
          total_results: 0,
          total_pages: 0,
        })),
      ]);

      // Merge results
      const combinedResults = [
        ...movieData.results.map((item: any) => ({
          ...item,
          media_type: "movie",
        })),
        ...tvData.results.map((item: any) => ({ ...item, media_type: "tv" })),
      ];

      // Sort combined results if needed
      if (sort === "vote_average.desc") {
        combinedResults.sort(
          (a, b) => (b.vote_average || 0) - (a.vote_average || 0),
        );
      } else if (
        sort === "primary_release_date.desc" ||
        sort === "first_air_date.desc"
      ) {
        combinedResults.sort((a, b) => {
          const dateA = new Date(
            a.release_date || a.first_air_date || "1900-01-01",
          );
          const dateB = new Date(
            b.release_date || b.first_air_date || "1900-01-01",
          );
          return dateB.getTime() - dateA.getTime();
        });
      }

      // Return merged response
      res.json({
        page: Number(page),
        results: combinedResults,
        total_results: movieData.total_results + tvData.total_results,
        total_pages: Math.max(movieData.total_pages, tvData.total_pages),
      });
    } catch (error) {
      console.error("Error searching movies and TV shows:", error);
      res.status(500).json({ message: "Failed to search movies and TV shows" });
    }
  });

  // Get TV genres from TMDB - MUST be before /api/tv/:id route
  app.get("/api/tv/genres", async (req, res) => {
    try {
      const data = await fetchFromTMDB("/genre/tv/list");
      res.json(data);
    } catch (error) {
      console.error("Error fetching TV genres:", error);
      res.status(500).json({ message: "Failed to fetch TV genres" });
    }
  });

  // Enhanced discover TV shows endpoint - MUST be before /api/tv/:id route
  app.get("/api/tv/discover", async (req, res) => {
    try {
      // Extract all TMDB discover parameters for TV shows
      const {
        page = 1,
        sort_by = "popularity.desc",
        language = "en-US",
        // Genre & Keywords
        with_genres,
        without_genres,
        with_keywords,
        without_keywords,
        // Date Filters
        "first_air_date.gte": firstAirDateGte,
        "first_air_date.lte": firstAirDateLte,
        "air_date.gte": airDateGte,
        "air_date.lte": airDateLte,
        first_air_date_year,
        timezone,
        // Runtime & Ratings
        "with_runtime.gte": withRuntimeGte,
        "with_runtime.lte": withRuntimeLte,
        "vote_average.gte": voteAverageGte,
        "vote_average.lte": voteAverageLte,
        "vote_count.gte": voteCountGte,
        "vote_count.lte": voteCountLte,
        // Networks & Production
        with_networks,
        with_companies,
        // Language & Region
        with_original_language,
        watch_region,
        // Streaming
        with_watch_providers,
        with_watch_monetization_types,
        // Content Filters
        include_adult,
        include_null_first_air_dates,
        screened_theatrically,
        // TV-Specific
        with_status,
        with_type,
        // Certification
        certification_country,
        certification,
      } = req.query;

      const params: Record<string, any> = {
        page,
        sort_by,
        language,
      };

      // Add all filter parameters if they exist (TMDB uses '|' for OR, ',' for AND)
      if (with_genres) params.with_genres = with_genres;
      if (without_genres) params.without_genres = without_genres;
      if (with_keywords) params.with_keywords = with_keywords;
      if (without_keywords) params.without_keywords = without_keywords;
      
      // Date filters
      if (firstAirDateGte) params["first_air_date.gte"] = firstAirDateGte;
      if (firstAirDateLte) params["first_air_date.lte"] = firstAirDateLte;
      if (airDateGte) params["air_date.gte"] = airDateGte;
      if (airDateLte) params["air_date.lte"] = airDateLte;
      if (first_air_date_year) params.first_air_date_year = first_air_date_year;
      if (timezone) params.timezone = timezone;
      
      // Runtime & Ratings
      if (withRuntimeGte) params["with_runtime.gte"] = withRuntimeGte;
      if (withRuntimeLte) params["with_runtime.lte"] = withRuntimeLte;
      if (voteAverageGte) params["vote_average.gte"] = voteAverageGte;
      if (voteAverageLte) params["vote_average.lte"] = voteAverageLte;
      if (voteCountGte) params["vote_count.gte"] = voteCountGte;
      if (voteCountLte) params["vote_count.lte"] = voteCountLte;
      
      // Networks & Production
      if (with_networks) params.with_networks = with_networks;
      if (with_companies) params.with_companies = with_companies;
      
      // Language & Region
      if (with_original_language) params.with_original_language = with_original_language;
      if (watch_region) params.watch_region = watch_region;
      
      // Streaming
      if (with_watch_providers) params.with_watch_providers = with_watch_providers;
      if (with_watch_monetization_types) params.with_watch_monetization_types = with_watch_monetization_types;
      
      // Content filters
      if (include_adult !== undefined) params.include_adult = include_adult;
      if (include_null_first_air_dates !== undefined) params.include_null_first_air_dates = include_null_first_air_dates;
      if (screened_theatrically !== undefined) params.screened_theatrically = screened_theatrically;
      
      // TV-Specific
      if (with_status) params.with_status = with_status;
      if (with_type) params.with_type = with_type;
      
      // Certification
      if (certification_country) params.certification_country = certification_country;
      if (certification) params.certification = certification;

      // Use Bearer token if available, otherwise fallback to API key
      const useBearer = !!process.env.TMDB_ACCESS_TOKEN;
      const data = await fetchFromTMDB("/discover/tv", params, { useBearer });
      res.json(data);
    } catch (error) {
      console.error("Error discovering TV shows:", error);
      res.status(500).json({ message: "Failed to discover TV shows" });
    }
  });

  app.get("/api/tv/:id", async (req, res) => {
    try {
      const tvId = parseInt(req.params.id);
      if (isNaN(tvId)) {
        return res.status(400).json({ message: "Invalid TV show ID" });
      }

      // Check cache first
      const cached = await tmdbCacheService.getTVShowFromCache(tvId);
      if (cached) {
        console.log(`Returning cached TV show: ${cached.name} (ID: ${tvId})`);
        const response = tmdbCacheService.buildTVShowResponse(cached);

        // Enqueue background caching with low priority for cache refresh if stale
        cacheQueueService.enqueueJob("tv", tvId, 1);

        return res.json(response);
      }

      // Fetch from TMDB if not cached
      console.log(`Fetching TV show from TMDB: ${tvId}`);
      const data = await fetchFromTMDB(`/tv/${tvId}`, {
        append_to_response: "credits,videos,images,similar,recommendations",
      });

      // Return data immediately and cache in background for better performance
      res.json(data);

      // Cache the TV show data and process images in the background (non-blocking)
      tmdbCacheService.cacheTVShow(data).catch(error => {
        console.error(`Background caching failed for TV show ${tvId}:`, error);
      });
    } catch (error: any) {
      console.error("Error fetching TV show details:", error);
      
      // Check if it's a 404 error from TMDB
      if (error.message && error.message.includes("404")) {
        return res.status(404).json({ message: "TV show not found" });
      }
      
      res.status(500).json({ message: "Failed to fetch TV show details" });
    }
  });

  app.get("/api/movies/popular", async (req, res) => {
    try {
      const page = Number(req.query.page) || 1;
      const params = buildMovieDiscoverParams('popular', page);
      const data = await fetchFromTMDB("/discover/movie", params);
      res.json(data);
    } catch (error) {
      console.error("Error fetching popular movies:", error);
      res.status(500).json({ message: "Failed to fetch popular movies" });
    }
  });

  app.get("/api/movies/top-rated", async (req, res) => {
    try {
      const page = Number(req.query.page) || 1;
      const params = buildMovieDiscoverParams('top_rated', page);
      const data = await fetchFromTMDB("/discover/movie", params);
      res.json(data);
    } catch (error) {
      console.error("Error fetching top rated movies:", error);
      res.status(500).json({ message: "Failed to fetch top rated movies" });
    }
  });

  app.get("/api/movies/upcoming", async (req, res) => {
    try {
      const page = Number(req.query.page) || 1;
      const params = buildMovieDiscoverParams('upcoming', page);
      const data = await fetchFromTMDB("/discover/movie", params);
      res.json(data);
    } catch (error) {
      console.error("Error fetching upcoming movies:", error);
      res.status(500).json({ message: "Failed to fetch upcoming movies" });
    }
  });

  // Add alias with underscore for frontend compatibility
  app.get("/api/movies/now_playing", async (req, res) => {
    try {
      const page = Number(req.query.page) || 1;
      const params = buildMovieDiscoverParams('now_playing', page);
      const data = await fetchFromTMDB("/discover/movie", params);
      res.json(data);
    } catch (error) {
      console.error("Error fetching now playing movies:", error);
      res.status(500).json({ message: "Failed to fetch now playing movies" });
    }
  });

  app.get("/api/movies/now-playing", async (req, res) => {
    try {
      const page = Number(req.query.page) || 1;
      const params = buildMovieDiscoverParams('now_playing', page);
      const data = await fetchFromTMDB("/discover/movie", params);
      res.json(data);
    } catch (error) {
      console.error("Error fetching now playing movies:", error);
      res.status(500).json({ message: "Failed to fetch now playing movies" });
    }
  });


  app.get("/api/movies/search", async (req, res) => {
    try {
      if (!process.env.TMDB_API_KEY) {
        return res.status(500).json({ message: "TMDB API key not configured" });
      }
      const query = req.query.query;
      const page = req.query.page || 1;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      const response = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(query as string)}&page=${page}`,
      );
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error searching movies:", error);
      res.status(500).json({ message: "Failed to search movies" });
    }
  });

  // Get movie genres from TMDB - MUST be before /api/movies/:id route
  app.get("/api/movies/genres", async (req, res) => {
    try {
      const data = await fetchFromTMDB("/genre/movie/list");
      res.json(data);
    } catch (error) {
      console.error("Error fetching movie genres:", error);
      res.status(500).json({ message: "Failed to fetch movie genres" });
    }
  });

  // Enhanced discover movies endpoint - Comprehensive TMDB Discover API support
  // MUST be before /api/movies/:id route
  app.get("/api/movies/discover", async (req, res) => {
    try {
      // Extract all TMDB discover parameters for movies
      const {
        page = 1,
        sort_by = "popularity.desc",
        language = "en-US",
        // Genre & Keywords
        with_genres,
        without_genres,
        with_keywords,
        without_keywords,
        // Date Filters
        "primary_release_date.gte": primaryReleaseDateGte,
        "primary_release_date.lte": primaryReleaseDateLte,
        "release_date.gte": releaseDateGte,
        "release_date.lte": releaseDateLte,
        primary_release_year,
        year,
        // Runtime & Ratings
        "with_runtime.gte": withRuntimeGte,
        "with_runtime.lte": withRuntimeLte,
        "vote_average.gte": voteAverageGte,
        "vote_average.lte": voteAverageLte,
        "vote_count.gte": voteCountGte,
        "vote_count.lte": voteCountLte,
        // People (Cast & Crew)
        with_cast,
        with_crew,
        with_people,
        // Production
        with_companies,
        // Language & Region
        with_original_language,
        region,
        watch_region,
        // Streaming
        with_watch_providers,
        with_watch_monetization_types,
        // Content Filters
        include_adult,
        include_video,
        // Certification
        certification_country,
        certification,
        "certification.gte": certificationGte,
        "certification.lte": certificationLte,
        with_release_type,
      } = req.query;

      const params: Record<string, any> = {
        page,
        sort_by,
        language,
      };

      // Add all filter parameters if they exist (TMDB uses '|' for OR, ',' for AND)
      if (with_genres) params.with_genres = with_genres;
      if (without_genres) params.without_genres = without_genres;
      if (with_keywords) params.with_keywords = with_keywords;
      if (without_keywords) params.without_keywords = without_keywords;
      
      // Date filters
      if (primaryReleaseDateGte) params["primary_release_date.gte"] = primaryReleaseDateGte;
      if (primaryReleaseDateLte) params["primary_release_date.lte"] = primaryReleaseDateLte;
      if (releaseDateGte) params["release_date.gte"] = releaseDateGte;
      if (releaseDateLte) params["release_date.lte"] = releaseDateLte;
      if (primary_release_year) params.primary_release_year = primary_release_year;
      if (year) params.year = year;
      
      // Runtime & Ratings
      if (withRuntimeGte) params["with_runtime.gte"] = withRuntimeGte;
      if (withRuntimeLte) params["with_runtime.lte"] = withRuntimeLte;
      if (voteAverageGte) params["vote_average.gte"] = voteAverageGte;
      if (voteAverageLte) params["vote_average.lte"] = voteAverageLte;
      if (voteCountGte) params["vote_count.gte"] = voteCountGte;
      if (voteCountLte) params["vote_count.lte"] = voteCountLte;
      
      // People filters
      if (with_cast) params.with_cast = with_cast;
      if (with_crew) params.with_crew = with_crew;
      if (with_people) params.with_people = with_people;
      
      // Production
      if (with_companies) params.with_companies = with_companies;
      
      // Language & Region
      if (with_original_language) params.with_original_language = with_original_language;
      if (region) params.region = region;
      if (watch_region) params.watch_region = watch_region;
      
      // Streaming
      if (with_watch_providers) params.with_watch_providers = with_watch_providers;
      if (with_watch_monetization_types) params.with_watch_monetization_types = with_watch_monetization_types;
      
      // Content filters
      if (include_adult !== undefined) params.include_adult = include_adult;
      if (include_video !== undefined) params.include_video = include_video;
      
      // Certification
      if (certification_country) params.certification_country = certification_country;
      if (certification) params.certification = certification;
      if (certificationGte) params["certification.gte"] = certificationGte;
      if (certificationLte) params["certification.lte"] = certificationLte;
      if (with_release_type) params.with_release_type = with_release_type;

      // Use Bearer token if available, otherwise fallback to API key
      const useBearer = !!process.env.TMDB_ACCESS_TOKEN;
      const data = await fetchFromTMDB("/discover/movie", params, { useBearer });
      res.json(data);
    } catch (error) {
      console.error("Error discovering movies:", error);
      res.status(500).json({ message: "Failed to discover movies" });
    }
  });

  app.get("/api/movies/:id", async (req, res) => {
    try {
      const movieId = parseInt(req.params.id);
      if (isNaN(movieId)) {
        return res.status(400).json({ message: "Invalid movie ID" });
      }

      // Check cache first
      const cached = await tmdbCacheService.getMovieFromCache(movieId);
      if (cached) {
        console.log(`Returning cached movie: ${cached.title} (ID: ${movieId})`);
        const response = tmdbCacheService.buildMovieResponse(cached);

        // Enqueue background caching with low priority for cache refresh if stale
        cacheQueueService.enqueueJob("movie", movieId, 1);

        return res.json(response);
      }

      // Fetch from TMDB if not cached
      console.log(`Fetching movie from TMDB: ${movieId}`);
      const data = await fetchFromTMDB(`/movie/${movieId}`, {
        append_to_response: "credits,videos,images,similar,recommendations",
      });

      // Return data immediately and cache in background for better performance
      res.json(data);

      // Cache the movie data and process images in the background (non-blocking)
      tmdbCacheService.cacheMovie(data).catch(error => {
        console.error(`Background caching failed for movie ${movieId}:`, error);
      });
    } catch (error: any) {
      console.error("Error fetching movie details:", error);
      
      // Check if it's a 404 error from TMDB
      if (error.message && error.message.includes("404")) {
        return res.status(404).json({ message: "Movie not found" });
      }
      
      res.status(500).json({ message: "Failed to fetch movie details" });
    }
  });

  app.get("/api/movies/discover/:category", async (req, res) => {
    try {
      if (!process.env.TMDB_API_KEY) {
        return res.status(500).json({ message: "TMDB API key not configured" });
      }
      const category = req.params.category;
      const page = req.query.page || 1;
      let url = `https://api.themoviedb.org/3/discover/movie?api_key=${process.env.TMDB_API_KEY}&page=${page}`;

      // Map categories to genre IDs
      const genreMap: Record<string, string> = {
        action: "28",
        adventure: "12",
        animation: "16",
        comedy: "35",
        crime: "80",
        documentary: "99",
        drama: "18",
        family: "10751",
        fantasy: "14",
        history: "36",
        horror: "27",
        music: "10402",
        mystery: "9648",
        romance: "10749",
        "science-fiction": "878",
        "tv-movie": "10770",
        thriller: "53",
        war: "10752",
        western: "37",
      };

      if (genreMap[category]) {
        url += `&with_genres=${genreMap[category]}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error fetching movies by category:", error);
      res.status(500).json({ message: "Failed to fetch movies by category" });
    }
  });

  // Movies by genre ID endpoint
  app.get("/api/movies/genre/:genreId", async (req, res) => {
    try {
      if (!process.env.TMDB_API_KEY) {
        return res.status(500).json({ message: "TMDB API key not configured" });
      }
      const genreId = req.params.genreId;
      const page = req.query.page || 1;
      const response = await fetch(
        `https://api.themoviedb.org/3/discover/movie?api_key=${process.env.TMDB_API_KEY}&with_genres=${genreId}&page=${page}&sort_by=popularity.desc`,
      );
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error fetching movies by genre:", error);
      res.status(500).json({ message: "Failed to fetch movies by genre" });
    }
  });

  // Advanced Filter API Endpoints for TMDB

  // Search people (cast/crew) - for People autocomplete filter
  app.get("/api/search/person", async (req, res) => {
    try {
      const { query, page = 1 } = req.query;

      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }

      const data = await fetchFromTMDB("/search/person", {
        query: query as string,
        page,
      });

      res.json(data);
    } catch (error) {
      console.error("Error searching people:", error);
      res.status(500).json({ message: "Failed to search people" });
    }
  });

  // Search keywords - for Keywords/Moods filter
  app.get("/api/search/keyword", async (req, res) => {
    try {
      const { query, page = 1 } = req.query;

      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }

      const data = await fetchFromTMDB("/search/keyword", {
        query: query as string,
        page,
      });

      res.json(data);
    } catch (error) {
      console.error("Error searching keywords:", error);
      res.status(500).json({ message: "Failed to search keywords" });
    }
  });

  // Multi-search - for global search bar (searches movies, TV, people)
  app.get("/api/search/multi", async (req, res) => {
    try {
      const { query, page = 1 } = req.query;

      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }

      const data = await fetchFromTMDB("/search/multi", {
        query: query as string,
        page,
      });

      res.json(data);
    } catch (error) {
      console.error("Error performing multi-search:", error);
      res.status(500).json({ message: "Failed to perform multi-search" });
    }
  });

  // Search production companies - for Companies filter
  app.get("/api/search/company", async (req, res) => {
    try {
      const { query, page = 1 } = req.query;

      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }

      const data = await fetchFromTMDB("/search/company", {
        query: query as string,
        page,
      });

      res.json(data);
    } catch (error) {
      console.error("Error searching companies:", error);
      res.status(500).json({ message: "Failed to search companies" });
    }
  });

  // Search TV networks - for Networks filter
  app.get("/api/search/network", async (req, res) => {
    try {
      const { query } = req.query;

      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }

      // TMDB doesn't have a direct network search endpoint, so we fetch all networks and filter
      const data = await fetchFromTMDB("/configuration/networks");
      
      // Filter networks based on query
      const searchTerm = (query as string).toLowerCase();
      const filteredResults = data.filter((network: any) =>
        network.name.toLowerCase().includes(searchTerm)
      );

      res.json({ results: filteredResults.slice(0, 20) });
    } catch (error) {
      console.error("Error searching networks:", error);
      res.status(500).json({ message: "Failed to search networks" });
    }
  });

  // Get watch providers by region - for Streaming Providers filter
  app.get("/api/watch/providers/:region", async (req, res) => {
    try {
      const { region } = req.params;
      const { type = "movie" } = req.query; // movie or tv

      if (type !== "movie" && type !== "tv") {
        return res.status(400).json({ message: "Type must be movie or tv" });
      }

      const data = await fetchFromTMDB(`/watch/providers/${type}`, {
        watch_region: region,
      });

      res.json(data);
    } catch (error) {
      console.error("Error fetching watch providers:", error);
      res.status(500).json({ message: "Failed to fetch watch providers" });
    }
  });

  // Get certifications by country - for Certification filter
  app.get("/api/certification/:type/:country", async (req, res) => {
    try {
      const { type, country } = req.params;

      if (type !== "movie" && type !== "tv") {
        return res.status(400).json({ message: "Type must be movie or tv" });
      }

      const endpoint =
        type === "movie"
          ? "/certification/movie/list"
          : "/certification/tv/list";
      const data = await fetchFromTMDB(endpoint);

      // Filter certifications for the specific country
      const certifications = data.certifications?.[country.toUpperCase()] || [];

      res.json({
        certifications,
        country: country.toUpperCase(),
      });
    } catch (error) {
      console.error("Error fetching certifications:", error);
      res.status(500).json({ message: "Failed to fetch certifications" });
    }
  });

  // Get languages from TMDB
  app.get("/api/languages", async (req, res) => {
    try {
      const data = await fetchFromTMDB("/configuration/languages");
      res.json(data);
    } catch (error) {
      console.error("Error fetching languages:", error);
      res.status(500).json({ message: "Failed to fetch languages" });
    }
  });

  // Get countries from TMDB
  app.get("/api/countries", async (req, res) => {
    try {
      const data = await fetchFromTMDB("/configuration/countries");
      res.json(data);
    } catch (error) {
      console.error("Error fetching countries:", error);
      res.status(500).json({ message: "Failed to fetch countries" });
    }
  });

  // TV shows by genre ID endpoint
  app.get("/api/tv/genre/:genreId", async (req, res) => {
    try {
      if (!process.env.TMDB_API_KEY) {
        return res.status(500).json({ message: "TMDB API key not configured" });
      }
      const genreId = req.params.genreId;
      const page = req.query.page || 1;
      const response = await fetch(
        `https://api.themoviedb.org/3/discover/tv?api_key=${process.env.TMDB_API_KEY}&with_genres=${genreId}&page=${page}&sort_by=popularity.desc`,
      );
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error fetching TV shows by genre:", error);
      res.status(500).json({ message: "Failed to fetch TV shows by genre" });
    }
  });

  // Person filmography endpoint
  app.get("/api/person/:personId/filmography", async (req, res) => {
    try {
      if (!process.env.TMDB_API_KEY) {
        return res.status(500).json({ message: "TMDB API key not configured" });
      }
      const personId = req.params.personId;
      const [movieCreditsResponse, tvCreditsResponse, personDetailsResponse] =
        await Promise.all([
          fetch(
            `https://api.themoviedb.org/3/person/${personId}/movie_credits?api_key=${process.env.TMDB_API_KEY}`,
          ),
          fetch(
            `https://api.themoviedb.org/3/person/${personId}/tv_credits?api_key=${process.env.TMDB_API_KEY}`,
          ),
          fetch(
            `https://api.themoviedb.org/3/person/${personId}?api_key=${process.env.TMDB_API_KEY}`,
          ),
        ]);

      const [movieCredits, tvCredits, personDetails] = await Promise.all([
        movieCreditsResponse.json(),
        tvCreditsResponse.json(),
        personDetailsResponse.json(),
      ]);

      res.json({
        person: personDetails,
        movieCredits,
        tvCredits,
      });
    } catch (error) {
      console.error("Error fetching person filmography:", error);
      res.status(500).json({ message: "Failed to fetch person filmography" });
    }
  });

  // Watchlist endpoints
  app.get("/api/watchlists", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const watchlists = await storage.getUserWatchlists(userId);
      res.json(watchlists);
    } catch (error) {
      console.error("Error fetching watchlists:", error);
      res.status(500).json({ message: "Failed to fetch watchlists" });
    }
  });

  app.post("/api/watchlists", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const data = insertWatchlistSchema.parse({ ...req.body, userId });
      const watchlist = await storage.createWatchlist(data);
      res.json(watchlist);
    } catch (error) {
      console.error("Error creating watchlist:", error);
      res.status(500).json({ message: "Failed to create watchlist" });
    }
  });

  app.put("/api/watchlists/:id", isAuthenticated, async (req: any, res) => {
    try {
      const watchlistId = req.params.id;
      const userId = req.session.userId;

      // First, get the existing watchlist to verify ownership
      const existingWatchlist = await storage.getWatchlistById(watchlistId);
      if (!existingWatchlist) {
        return res.status(404).json({ message: "Watchlist not found" });
      }

      // Check if the user owns this watchlist
      if (existingWatchlist.userId !== userId) {
        return res.status(403).json({
          message: "Unauthorized: You can only edit your own watchlists",
        });
      }

      // Validate request body, explicitly omitting protected fields
      const validatedData = insertWatchlistSchema
        .omit({ id: true, userId: true, createdAt: true, updatedAt: true })
        .partial()
        .parse(req.body);
      const watchlist = await storage.updateWatchlist(
        watchlistId,
        validatedData,
      );
      res.json(watchlist);
    } catch (error) {
      console.error("Error updating watchlist:", error);
      res.status(500).json({ message: "Failed to update watchlist" });
    }
  });

  app.delete("/api/watchlists/:id", isAuthenticated, async (req: any, res) => {
    try {
      const watchlistId = req.params.id;
      const userId = req.session.userId;

      // First, get the existing watchlist to verify ownership
      const existingWatchlist = await storage.getWatchlistById(watchlistId);
      if (!existingWatchlist) {
        return res.status(404).json({ message: "Watchlist not found" });
      }

      // Check if the user owns this watchlist
      if (existingWatchlist.userId !== userId) {
        return res.status(403).json({
          message: "Unauthorized: You can only delete your own watchlists",
        });
      }

      await storage.deleteWatchlist(watchlistId);
      res.json({ message: "Watchlist deleted successfully" });
    } catch (error) {
      console.error("Error deleting watchlist:", error);
      res.status(500).json({ message: "Failed to delete watchlist" });
    }
  });

  app.get("/api/watchlists/:id/items", isAuthenticated, async (req, res) => {
    try {
      const watchlistId = req.params.id;
      const items = await storage.getWatchlistItems(watchlistId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching watchlist items:", error);
      res.status(500).json({ message: "Failed to fetch watchlist items" });
    }
  });

  app.post("/api/watchlists/:id/items", isAuthenticated, async (req, res) => {
    try {
      const watchlistId = req.params.id;
      const userId = req.session.userId;

      // Verify user owns the watchlist before adding items
      const watchlist = await storage.getWatchlistById(watchlistId);
      if (!watchlist) {
        return res.status(404).json({ message: "Watchlist not found" });
      }

      if (watchlist.userId !== userId) {
        return res.status(403).json({
          message:
            "Unauthorized: You can only add items to your own watchlists",
        });
      }

      const data = insertWatchlistItemSchema.parse({
        ...req.body,
        watchlistId,
      });
      const item = await storage.addWatchlistItem(data);
      res.json(item);
    } catch (error) {
      console.error("Error adding watchlist item:", error);
      res.status(500).json({ message: "Failed to add watchlist item" });
    }
  });

  app.delete(
    "/api/watchlists/:id/items/:mediaType/:mediaId",
    isAuthenticated,
    async (req, res) => {
      try {
        const watchlistId = req.params.id;
        const userId = req.session.userId;
        const mediaType = req.params.mediaType;
        const mediaId = parseInt(req.params.mediaId);

        // Verify user owns the watchlist before removing items
        const watchlist = await storage.getWatchlistById(watchlistId);
        if (!watchlist) {
          return res.status(404).json({ message: "Watchlist not found" });
        }

        if (watchlist.userId !== userId) {
          return res.status(403).json({
            message:
              "Unauthorized: You can only remove items from your own watchlists",
          });
        }

        await storage.removeWatchlistItem(watchlistId, mediaType, mediaId);
        res.json({ success: true });
      } catch (error) {
        console.error("Error removing watchlist item:", error);
        res.status(500).json({ message: "Failed to remove watchlist item" });
      }
    },
  );

  // Favorites endpoints
  app.get("/api/favorites", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const favorites = await storage.getUserFavorites(userId);
      res.json(favorites);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });

  app.post("/api/favorites", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const data = insertFavoriteSchema.parse({ ...req.body, userId });
      const favorite = await storage.addFavorite(data);
      res.json(favorite);
    } catch (error) {
      console.error("Error adding favorite:", error);
      res.status(500).json({ message: "Failed to add favorite" });
    }
  });

  app.delete(
    "/api/favorites/:mediaType/:mediaId",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const mediaType = req.params.mediaType;
        const mediaId = parseInt(req.params.mediaId);
        await storage.removeFavorite(userId, mediaType, mediaId);
        res.json({ success: true });
      } catch (error) {
        console.error("Error removing favorite:", error);
        res.status(500).json({ message: "Failed to remove favorite" });
      }
    },
  );

  app.get(
    "/api/favorites/:mediaType/:mediaId/check",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const mediaType = req.params.mediaType;
        const mediaId = parseInt(req.params.mediaId);
        const isFavorite = await storage.isFavorite(userId, mediaType, mediaId);
        res.json({ isFavorite });
      } catch (error) {
        console.error("Error checking favorite status:", error);
        res.status(500).json({ message: "Failed to check favorite status" });
      }
    },
  );

  // Reviews endpoints
  app.get("/api/reviews/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const reviews = await storage.getUserReviews(userId);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching user reviews:", error);
      res.status(500).json({ message: "Failed to fetch user reviews" });
    }
  });

  // Get TMDB reviews for a movie or TV show
  app.get("/api/reviews/:mediaType/:mediaId/tmdb", async (req, res) => {
    try {
      if (!process.env.TMDB_API_KEY) {
        return res.status(500).json({ message: "TMDB API key not configured" });
      }
      const mediaType = req.params.mediaType;
      const mediaId = req.params.mediaId;

      // Validate mediaType
      if (!["movie", "tv"].includes(mediaType)) {
        return res
          .status(400)
          .json({ message: 'Media type must be either "movie" or "tv"' });
      }

      // Validate mediaId
      if (isNaN(Number(mediaId))) {
        return res
          .status(400)
          .json({ message: "Media ID must be a valid number" });
      }

      const endpoint = mediaType === "movie" ? "movie" : "tv";
      const response = await fetch(
        `https://api.themoviedb.org/3/${endpoint}/${mediaId}/reviews?api_key=${process.env.TMDB_API_KEY}`,
      );

      if (!response.ok) {
        throw new Error(`TMDB API responded with status ${response.status}`);
      }

      const data = await response.json();

      // Transform TMDB reviews to match our expected format
      const tmdbReviews =
        data.results?.map((review: any) => ({
          id: `tmdb-${review.id}`,
          author_name: review.author,
          rating: review.author_details?.rating
            ? Math.round(review.author_details.rating)
            : null,
          content: review.content,
          created_at: review.created_at,
          source: "tmdb",
        })) || [];

      res.json(tmdbReviews);
    } catch (error) {
      console.error("Error fetching TMDB reviews:", error);
      res.status(500).json({ message: "Failed to fetch TMDB reviews" });
    }
  });

  // Get all reviews (both user and TMDB) for a movie or TV show
  app.get("/api/reviews/:mediaType/:mediaId", async (req, res) => {
    try {
      const mediaType = req.params.mediaType;
      const mediaIdParam = req.params.mediaId;

      // Validate mediaType
      if (!["movie", "tv"].includes(mediaType)) {
        return res
          .status(400)
          .json({ message: 'Media type must be either "movie" or "tv"' });
      }

      // Validate mediaId
      const mediaId = parseInt(mediaIdParam);
      if (isNaN(mediaId)) {
        return res
          .status(400)
          .json({ message: "Media ID must be a valid number" });
      }

      // Get user reviews from database
      const userReviews = await storage.getMediaReviews(mediaType, mediaId);
      const formattedUserReviews = userReviews.map((review: any) => ({
        id: review.id,
        username: review.username || "Anonymous",
        rating: review.rating,
        review: review.review,
        createdAt: review.createdAt,
        source: "user",
      }));

      // Get TMDB reviews
      let tmdbReviews: any[] = [];
      if (process.env.TMDB_API_KEY) {
        try {
          const endpoint = mediaType === "movie" ? "movie" : "tv";

          // Add timeout and retry logic for TMDB API calls
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

          const response = await fetch(
            `https://api.themoviedb.org/3/${endpoint}/${mediaId}/reviews?api_key=${process.env.TMDB_API_KEY}`,
            {
              signal: controller.signal,
              headers: {
                Accept: "application/json",
                "User-Agent": "CineHub/1.0",
              },
            },
          );

          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            tmdbReviews =
              data.results?.map((review: any) => ({
                id: `tmdb-${review.id}`,
                username: review.author,
                rating: review.author_details?.rating
                  ? Math.round(review.author_details.rating)
                  : null,
                review: review.content,
                createdAt: review.created_at,
                source: "tmdb",
              })) || [];
          } else {
            console.warn(
              `TMDB API returned ${response.status}: ${response.statusText}`,
            );
          }
        } catch (tmdbError: any) {
          if (tmdbError.name === "AbortError") {
            console.warn("TMDB API request timed out");
          } else if (tmdbError.cause?.code === "ECONNRESET") {
            console.warn(
              "TMDB API connection was reset, continuing without external reviews",
            );
          } else {
            console.warn("Error fetching TMDB reviews:", tmdbError.message);
          }
          // Continue without TMDB reviews if there's an error
        }
      }

      // Combine and sort reviews by creation date (newest first)
      const allReviews = [...formattedUserReviews, ...tmdbReviews].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      res.json(allReviews);
    } catch (error) {
      console.error("Error fetching media reviews:", error);
      res.status(500).json({ message: "Failed to fetch media reviews" });
    }
  });

  app.post("/api/reviews", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const data = insertReviewSchema.parse({ ...req.body, userId });
      const review = await storage.createReview(data);
      res.json(review);
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  // User Preferences endpoints
  app.get("/api/preferences", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const preferences = await storage.getUserPreferences(userId);
      res.json(preferences);
    } catch (error) {
      console.error("Error fetching user preferences:", error);
      res.status(500).json({ message: "Failed to fetch user preferences" });
    }
  });

  app.put("/api/preferences", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const preferences = req.body;

      // Validate preferences object structure - updated to match frontend expectations
      const preferencesSchema = z.object({
        // Genre preferences
        genres: z.array(z.string()).optional(),

        // Viewing preferences
        includeAdultContent: z.boolean().optional(),
        autoPlayTrailers: z.boolean().optional(),

        // Notification preferences
        notifyNewReleases: z.boolean().optional(),
        notifyWatchlistUpdates: z.boolean().optional(),
        emailNotifications: z.boolean().optional(),

        // Display preferences
        theme: z.enum(["light", "dark", "system"]).optional(),
        language: z.string().optional(),
        region: z.string().optional(),

        // Legacy support for nested structure (backward compatibility)
        notifications: z
          .object({
            email: z.boolean().optional(),
            push: z.boolean().optional(),
            newReleases: z.boolean().optional(),
            watchlistUpdates: z.boolean().optional(),
          })
          .optional(),
        privacy: z
          .object({
            showProfile: z.boolean().optional(),
            showWatchlists: z.boolean().optional(),
            showReviews: z.boolean().optional(),
            showActivity: z.boolean().optional(),
          })
          .optional(),
        display: z
          .object({
            language: z.string().optional(),
            region: z.string().optional(),
            adultContent: z.boolean().optional(),
          })
          .optional(),
      });

      const validatedPreferences = preferencesSchema.parse(preferences);
      const updatedUser = await storage.updateUserPreferences(
        userId,
        validatedPreferences,
      );
      res.json(updatedUser.preferences);
    } catch (error) {
      console.error("Error updating user preferences:", error);
      res.status(500).json({ message: "Failed to update user preferences" });
    }
  });

  // Viewing History endpoints
  app.get("/api/viewing-history", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const viewingHistory = await storage.getUserViewingHistory(userId, limit);
      res.json(viewingHistory);
    } catch (error) {
      console.error("Error fetching viewing history:", error);
      res.status(500).json({ message: "Failed to fetch viewing history" });
    }
  });

  app.post("/api/viewing-history", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const data = insertViewingHistorySchema.parse({ ...req.body, userId });
      const viewingEntry = await storage.addViewingHistory(data);
      res.json(viewingEntry);
    } catch (error) {
      console.error("Error adding viewing history:", error);
      res.status(500).json({ message: "Failed to add viewing history" });
    }
  });

  app.delete(
    "/api/viewing-history/:mediaType/:mediaId",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const mediaType = req.params.mediaType;
        const mediaId = parseInt(req.params.mediaId);
        await storage.removeViewingHistory(userId, mediaType, mediaId);
        res.json({ success: true });
      } catch (error) {
        console.error("Error removing viewing history:", error);
        res.status(500).json({ message: "Failed to remove viewing history" });
      }
    },
  );

  app.delete("/api/viewing-history", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      await storage.clearUserViewingHistory(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error clearing viewing history:", error);
      res.status(500).json({ message: "Failed to clear viewing history" });
    }
  });

  // Activity History endpoints
  app.get("/api/activity-history", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const activityHistory = await storage.getUserActivityHistory(
        userId,
        limit,
      );
      res.json(activityHistory);
    } catch (error) {
      console.error("Error fetching activity history:", error);
      res.status(500).json({ message: "Failed to fetch activity history" });
    }
  });

  app.post("/api/activity-history", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const data = insertActivityHistorySchema.parse({ ...req.body, userId });
      const activity = await storage.addActivityHistory(data);
      res.json(activity);
    } catch (error) {
      console.error("Error adding activity history:", error);
      res.status(500).json({ message: "Failed to add activity history" });
    }
  });

  app.delete(
    "/api/activity-history",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        await storage.clearUserActivityHistory(userId);
        res.json({ success: true });
      } catch (error) {
        console.error("Error clearing activity history:", error);
        res.status(500).json({ message: "Failed to clear activity history" });
      }
    },
  );

  // Search History endpoints
  app.get("/api/search-history", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const searchHistory = await storage.getUserSearchHistory(userId, limit);
      res.json(searchHistory);
    } catch (error) {
      console.error("Error fetching search history:", error);
      res.status(500).json({ message: "Failed to fetch search history" });
    }
  });

  app.post("/api/search-history", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const data = insertSearchHistorySchema.parse({ ...req.body, userId });
      const search = await storage.addSearchHistory(data);
      res.json(search);
    } catch (error) {
      console.error("Error adding search history:", error);
      res.status(500).json({ message: "Failed to add search history" });
    }
  });

  app.delete("/api/search-history", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      await storage.clearUserSearchHistory(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error clearing search history:", error);
      res.status(500).json({ message: "Failed to clear search history" });
    }
  });

  // Admin endpoints
  app.get("/api/admin/users", isAdmin, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/stats", isAdmin, async (req: any, res) => {
    try {
      const stats = await storage.getUserStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.patch("/api/admin/users/:userId/role", isAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { isAdmin: newIsAdmin } = req.body;

      if (typeof newIsAdmin !== "boolean") {
        return res.status(400).json({ message: "isAdmin must be a boolean" });
      }

      // Prevent admin from removing their own admin status
      if (req.session.userId === userId && !newIsAdmin) {
        return res
          .status(400)
          .json({ message: "Cannot remove your own admin privileges" });
      }

      const updatedUser = await storage.updateUser(userId, {
        isAdmin: newIsAdmin,
      });
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  app.patch(
    "/api/admin/users/:userId/status",
    isAdmin,
    async (req: any, res) => {
      try {
        const { userId } = req.params;
        const { isVerified } = req.body;

        if (typeof isVerified !== "boolean") {
          return res
            .status(400)
            .json({ message: "isVerified must be a boolean" });
        }

        const updatedUser = await storage.updateUser(userId, { isVerified });
        res.json(updatedUser);
      } catch (error) {
        console.error("Error updating user status:", error);
        res.status(500).json({ message: "Failed to update user status" });
      }
    },
  );

  app.delete("/api/admin/users/:userId", isAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;

      // Prevent admin from deleting themselves
      if (req.session.userId === userId) {
        return res
          .status(400)
          .json({ message: "Cannot delete your own account" });
      }

      // Check if user exists before deletion
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      await storage.deleteUser(userId);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  const httpServer = createServer(app);

  // Cache status API endpoints
  app.get("/api/cache-status/:type/:id", async (req, res) => {
    try {
      const { type, id } = req.params;
      const mediaId = parseInt(id);

      if (isNaN(mediaId)) {
        return res.status(400).json({ message: "Invalid ID parameter" });
      }

      if (type !== "movie" && type !== "tv") {
        return res
          .status(400)
          .json({ message: 'Invalid type parameter. Must be "movie" or "tv"' });
      }

      const status = cacheQueueService.getJobStatusByMedia(
        type as "movie" | "tv",
        mediaId,
      );

      if (!status) {
        return res.json({
          jobId: null,
          status: "not_found",
          message: "No caching job found for this item",
        });
      }

      res.json(status);
    } catch (error) {
      console.error("Error getting cache status:", error);
      res.status(500).json({ message: "Failed to get cache status" });
    }
  });

  app.get("/api/cache-stats", async (req, res) => {
    try {
      const queueStats = cacheQueueService.getQueueStats();
      const wsStats = websocketService.getStats();

      res.json({
        queue: queueStats,
        websocket: wsStats,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error getting cache stats:", error);
      res.status(500).json({ message: "Failed to get cache stats" });
    }
  });

  // Initialize WebSocket service for real-time cache status updates
  websocketService.initialize(httpServer);

  return httpServer;
}
