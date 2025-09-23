import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import cookieParser from "cookie-parser";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, signUp, signIn, signInWithTokens, refreshAccessToken, logoutWithToken, hashPassword } from "./auth";
import passport from "./passport";
import { z } from "zod";
import {
  insertWatchlistSchema,
  insertWatchlistItemSchema,
  insertFavoriteSchema,
  insertReviewSchema,
  signInSchema,
  signUpSchema,
} from "@shared/schema";

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads', 'profiles');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration for profile photo uploads
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp + original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `profile-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: multerStorage,
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      const error = new Error('Only image files are allowed!') as any;
      error.code = 'INVALID_FILE_TYPE';
      cb(error, false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Cookie parser middleware for JWT refresh tokens
  app.use(cookieParser());
  
  // Serve uploaded images statically
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
  
  // Auth middleware
  await setupAuth(app);
  
  // Initialize passport for OAuth
  app.use(passport.initialize());
  app.use(passport.session());

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
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

  app.post('/api/auth/signup', async (req, res) => {
    try {
      const userData = signUpSchema.parse(req.body);
      const user = await signUp(userData);
      
      // Generate OTP for verification (email or phone)
      const verificationTarget = userData.email || userData.phoneNumber;
      if (!verificationTarget) {
        return res.status(400).json({ message: "Either email or phone number is required for verification" });
      }
      
      // Generate 6-digit OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      await storage.createOtp({
        target: verificationTarget,
        purpose: 'signup',
        code: otpCode,
        expiresAt,
      });
      
      // TODO: Send OTP via email/SMS
      console.log(`Signup verification OTP for ${verificationTarget}: ${otpCode}`);
      
      // Don't set session - user needs to verify first
      res.status(201).json({ 
        message: "Account created successfully. Please verify your account with the OTP sent to your email or phone.",
        verificationTarget,
        requiresVerification: true
      });
    } catch (error) {
      console.error("Signup error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(400).json({ message: error instanceof Error ? error.message : "Signup failed" });
    }
  });

  app.post('/api/auth/signin', async (req, res) => {
    try {
      const credentials = signInSchema.parse(req.body);
      const user = await signIn(credentials);
      
      // Check if user is verified - block unverified users
      if (!user.isVerified) {
        // Generate new OTP for verification
        const verificationTarget = user.email || user.phoneNumber;
        if (verificationTarget) {
          const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
          const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
          
          await storage.createOtp({
            target: verificationTarget,
            purpose: 'signup',
            code: otpCode,
            expiresAt,
          });
          
          console.log(`Account verification OTP for ${verificationTarget}: ${otpCode}`);
        }
        
        return res.status(403).json({ 
          message: "Please verify your account first. Check your email or phone for the verification code.",
          requiresVerification: true,
          verificationTarget: verificationTarget
        });
      }
      
      // Set session only for verified users
      req.session.userId = user.id;
      
      res.json({ user, message: "Signed in successfully" });
    } catch (error) {
      console.error("Signin error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(401).json({ message: error instanceof Error ? error.message : "Signin failed" });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie('connect.sid');
      res.json({ message: "Logged out successfully" });
    });
  });

  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { identifier } = req.body;
      
      if (!identifier) {
        return res.status(400).json({ message: "Email, username, or phone number is required" });
      }

      // Check if user exists
      let user = null;
      if (identifier.includes('@')) {
        user = await storage.getUserByEmail(identifier);
      } else if (identifier.startsWith('+')) {
        user = await storage.getUserByPhoneNumber(identifier);
      } else {
        user = await storage.getUserByUsername(identifier);
      }

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Generate 6-digit OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      const otp = await storage.createOtp({
        target: identifier,
        purpose: 'reset',
        code: otpCode,
        expiresAt,
      });
      
      // TODO: Send OTP via email/SMS
      console.log(`Password reset OTP for ${identifier}: ${otpCode}`);
      
      res.json({ message: "Password reset code sent successfully" });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Failed to send password reset code" });
    }
  });

  app.post('/api/auth/verify-otp', async (req, res) => {
    try {
      const { otp, identifier, purpose } = req.body;
      
      if (!otp || !identifier || !purpose) {
        return res.status(400).json({ message: "OTP, identifier, and purpose are required" });
      }

      // Verify OTP for the specified purpose
      const isValid = await storage.verifyOtp(identifier, otp, purpose);

      if (!isValid) {
        return res.status(401).json({ message: "Invalid or expired OTP" });
      }

      // If this is signup verification, log the user in and mark as verified
      if (purpose === 'signup') {
        const user = await storage.getUserByIdentifier(identifier);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // Mark user as verified
        await storage.updateUser(user.id, { isVerified: true });

        // Delete the OTP to prevent replay attacks
        await storage.deleteOtp(identifier, 'signup');

        // Set session to log user in
        req.session.userId = user.id;

        // Return updated user data
        const updatedUser = await storage.getUser(user.id);
        const { password, ...userWithoutPassword } = updatedUser!;

        res.json({ 
          message: "Account verified and signed in successfully",
          user: userWithoutPassword,
          type: 'signup'
        });
      } else {
        // For reset verification, just confirm verification (don't delete OTP yet - needed for password reset)
        res.json({ 
          message: "OTP verified successfully",
          type: purpose
        });
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      res.status(500).json({ message: "Failed to verify OTP" });
    }
  });

  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { identifier, newPassword, otpCode } = req.body;
      
      if (!identifier || !newPassword || !otpCode) {
        return res.status(400).json({ message: "Identifier, new password, and OTP code are required" });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      // Verify OTP for password reset first
      const isValidOtp = await storage.verifyOtp(identifier, otpCode, 'reset');
      if (!isValidOtp) {
        return res.status(400).json({ message: "Invalid or expired OTP code" });
      }

      // Find user by identifier
      const user = await storage.getUserByIdentifier(identifier);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Hash new password and update
      const hashedPassword = await hashPassword(newPassword);
      
      await storage.updateUser(user.id, { password: hashedPassword });
      
      // Invalidate the OTP after successful password reset
      await storage.deleteOtp(identifier, 'reset');
      
      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // JWT-based authentication routes
  app.post('/api/auth/signin-jwt', async (req, res) => {
    try {
      const credentials = signInSchema.parse(req.body);
      
      // First verify credentials (without creating tokens yet)
      const user = await signIn(credentials);
      
      // Check if user is verified - block unverified users
      if (!user.isVerified) {
        // Generate new OTP for verification
        const verificationTarget = user.email || user.phoneNumber;
        if (verificationTarget) {
          const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
          const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
          
          await storage.createOtp({
            target: verificationTarget,
            purpose: 'signup',
            code: otpCode,
            expiresAt,
          });
          
          console.log(`Account verification OTP for ${verificationTarget}: ${otpCode}`);
        }
        
        return res.status(403).json({ 
          message: "Please verify your account first. Check your email or phone for the verification code.",
          requiresVerification: true,
          verificationTarget: verificationTarget
        });
      }
      
      // Only create tokens for verified users
      const result = await signInWithTokens(credentials);
      
      // Set refresh token as httpOnly cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: '/api/auth'
      });
      
      res.json({ 
        user: result.user, 
        accessToken: result.accessToken,
        message: "Signed in successfully" 
      });
    } catch (error) {
      console.error("JWT signin error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(401).json({ message: error instanceof Error ? error.message : "Signin failed" });
    }
  });

  app.post('/api/auth/refresh', async (req, res) => {
    try {
      const refreshToken = req.cookies.refreshToken;
      
      if (!refreshToken) {
        return res.status(401).json({ message: "No refresh token provided" });
      }
      
      const result = await refreshAccessToken(refreshToken);
      
      // Set new refresh token as httpOnly cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: '/api/auth'
      });
      
      res.json({ accessToken: result.accessToken });
    } catch (error) {
      console.error("Token refresh error:", error);
      res.clearCookie('refreshToken', { 
        path: '/api/auth',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
      res.status(401).json({ message: "Failed to refresh token" });
    }
  });

  app.post('/api/auth/logout-jwt', async (req, res) => {
    try {
      const refreshToken = req.cookies.refreshToken;
      
      if (refreshToken) {
        await logoutWithToken(refreshToken);
      }
      
      res.clearCookie('refreshToken', { 
        path: '/api/auth',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("JWT logout error:", error);
      // Still clear cookie and succeed for security
      res.clearCookie('refreshToken', { 
        path: '/api/auth',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
      res.json({ message: "Logged out successfully" });
    }
  });

  // Social Authentication Routes

  // Google OAuth
  app.get('/api/auth/google', passport.authenticate('google'));
  
  app.get('/api/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/?auth=failed' }),
    (req: any, res) => {
      // Set session for authenticated user
      if (req.user) {
        req.session.userId = req.user.id;
        res.redirect('/?auth=success');
      } else {
        res.redirect('/?auth=failed');
      }
    }
  );

  // Facebook OAuth
  app.get('/api/auth/facebook', passport.authenticate('facebook'));
  
  app.get('/api/auth/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/?auth=failed' }),
    (req: any, res) => {
      if (req.user) {
        req.session.userId = req.user.id;
        res.redirect('/?auth=success');
      } else {
        res.redirect('/?auth=failed');
      }
    }
  );

  // GitHub OAuth
  app.get('/api/auth/github', passport.authenticate('github'));
  
  app.get('/api/auth/github/callback',
    passport.authenticate('github', { failureRedirect: '/?auth=failed' }),
    (req: any, res) => {
      if (req.user) {
        req.session.userId = req.user.id;
        res.redirect('/?auth=success');
      } else {
        res.redirect('/?auth=failed');
      }
    }
  );

  // Twitter OAuth  
  app.get('/api/auth/twitter', passport.authenticate('twitter'));
  
  app.get('/api/auth/twitter/callback',
    passport.authenticate('twitter', { failureRedirect: '/?auth=failed' }),
    (req: any, res) => {
      if (req.user) {
        req.session.userId = req.user.id;
        res.redirect('/?auth=success');
      } else {
        res.redirect('/?auth=failed');
      }
    }
  );

  // Simple rate limiting for uploads (in production, use proper rate limiter like express-rate-limit)
  const uploadAttempts = new Map<string, { count: number; resetTime: number }>();
  
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
      return res.status(429).json({ message: "Too many upload attempts. Please try again later." });
    }
    
    attempt.count++;
    next();
  };

  // Profile photo upload route with basic rate limiting
  app.post('/api/auth/upload-profile-photo', checkUploadRateLimit, upload.single('profilePhoto'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Generate the URL for the uploaded file
      const profileImageUrl = `/uploads/profiles/${req.file.filename}`;

      res.json({ 
        message: "Profile photo uploaded successfully",
        profileImageUrl 
      });
    } catch (error) {
      console.error("Profile photo upload error:", error);
      res.status(500).json({ message: "Failed to upload profile photo" });
    }
  });

  // Update user profile photo route (for authenticated users)
  app.post('/api/auth/update-profile-photo', isAuthenticated, upload.single('profilePhoto'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Support both JWT (req.user) and session-based auth (req.session.userId)
      const userId = req.user?.id || req.session?.userId;
      
      if (!userId) {
        return res.status(401).json({ message: "No user ID found" });
      }

      // Generate the URL for the uploaded file
      const profileImageUrl = `/uploads/profiles/${req.file.filename}`;

      // Update user's profile image in database
      await storage.updateUser(userId, { profileImageUrl });

      res.json({ 
        message: "Profile photo updated successfully",
        profileImageUrl 
      });
    } catch (error) {
      console.error("Profile photo update error:", error);
      res.status(500).json({ message: "Failed to update profile photo" });
    }
  });

  // TMDB proxy endpoints (to avoid CORS and secure API key)
  app.get('/api/movies/trending', async (req, res) => {
    try {
      const timeWindow = req.query.time_window || 'week';
      if (!process.env.TMDB_API_KEY) {
        return res.status(500).json({ message: 'TMDB API key not configured' });
      }
      const response = await fetch(
        `https://api.themoviedb.org/3/trending/movie/${timeWindow}?api_key=${process.env.TMDB_API_KEY}`
      );
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error fetching trending movies:', error);
      res.status(500).json({ message: 'Failed to fetch trending movies' });
    }
  });

  app.get('/api/tv/trending', async (req, res) => {
    try {
      const timeWindow = req.query.time_window || 'week';
      if (!process.env.TMDB_API_KEY) {
        return res.status(500).json({ message: 'TMDB API key not configured' });
      }
      const response = await fetch(
        `https://api.themoviedb.org/3/trending/tv/${timeWindow}?api_key=${process.env.TMDB_API_KEY}`
      );
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error fetching trending TV shows:', error);
      res.status(500).json({ message: 'Failed to fetch trending TV shows' });
    }
  });

  app.get('/api/tv/popular', async (req, res) => {
    try {
      if (!process.env.TMDB_API_KEY) {
        return res.status(500).json({ message: 'TMDB API key not configured' });
      }
      const page = req.query.page || 1;
      const response = await fetch(
        `https://api.themoviedb.org/3/tv/popular?api_key=${process.env.TMDB_API_KEY}&page=${page}`
      );
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error fetching popular TV shows:', error);
      res.status(500).json({ message: 'Failed to fetch popular TV shows' });
    }
  });

  app.get('/api/tv/top-rated', async (req, res) => {
    try {
      if (!process.env.TMDB_API_KEY) {
        return res.status(500).json({ message: 'TMDB API key not configured' });
      }
      const page = req.query.page || 1;
      const response = await fetch(
        `https://api.themoviedb.org/3/tv/top_rated?api_key=${process.env.TMDB_API_KEY}&page=${page}`
      );
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error fetching top rated TV shows:', error);
      res.status(500).json({ message: 'Failed to fetch top rated TV shows' });
    }
  });

  app.get('/api/tv/on-the-air', async (req, res) => {
    try {
      if (!process.env.TMDB_API_KEY) {
        return res.status(500).json({ message: 'TMDB API key not configured' });
      }
      const page = req.query.page || 1;
      const response = await fetch(
        `https://api.themoviedb.org/3/tv/on_the_air?api_key=${process.env.TMDB_API_KEY}&page=${page}`
      );
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error fetching on-the-air TV shows:', error);
      res.status(500).json({ message: 'Failed to fetch on-the-air TV shows' });
    }
  });

  // Add alias with underscore for frontend compatibility  
  app.get('/api/tv/airing_today', async (req, res) => {
    try {
      if (!process.env.TMDB_API_KEY) {
        return res.status(500).json({ message: 'TMDB API key not configured' });
      }
      const page = req.query.page || 1;
      const response = await fetch(
        `https://api.themoviedb.org/3/tv/airing_today?api_key=${process.env.TMDB_API_KEY}&page=${page}`
      );
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error fetching airing today TV shows:', error);
      res.status(500).json({ message: 'Failed to fetch airing today TV shows' });
    }
  });

  app.get('/api/tv/airing-today', async (req, res) => {
    try {
      if (!process.env.TMDB_API_KEY) {
        return res.status(500).json({ message: 'TMDB API key not configured' });
      }
      const page = req.query.page || 1;
      const response = await fetch(
        `https://api.themoviedb.org/3/tv/airing_today?api_key=${process.env.TMDB_API_KEY}&page=${page}`
      );
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error fetching airing today TV shows:', error);
      res.status(500).json({ message: 'Failed to fetch airing today TV shows' });
    }
  });

  // Comprehensive TV show discovery endpoint with all TMDB filters
  app.get('/api/tv/discover', async (req, res) => {
    try {
      if (!process.env.TMDB_API_KEY) {
        return res.status(500).json({ message: 'TMDB API key not configured' });
      }
      const {
        page = 1,
        sort_by = 'popularity.desc',
        with_genres,
        first_air_date_year,
        'vote_average.gte': minRating,
        'vote_average.lte': maxRating,
        // Removed runtime and vote count filters per requirements (TV shows don't support certification)
        'first_air_date.gte': airDateFrom,
        'first_air_date.lte': airDateTo,
        with_original_language,
        with_keywords,
        without_genres,
        with_networks,
        with_companies
      } = req.query;

      let url = `https://api.themoviedb.org/3/discover/tv?api_key=${process.env.TMDB_API_KEY}&page=${page}&sort_by=${sort_by}`;
      
      // Add optional parameters
      if (with_genres) url += `&with_genres=${with_genres}`;
      if (first_air_date_year) url += `&first_air_date_year=${first_air_date_year}`;
      if (minRating) url += `&vote_average.gte=${minRating}`;
      if (maxRating) url += `&vote_average.lte=${maxRating}`;
      // Runtime and minimum votes filters removed per user requirements
      // TV shows do not support certification filters
      if (airDateFrom) url += `&first_air_date.gte=${airDateFrom}`;
      if (airDateTo) url += `&first_air_date.lte=${airDateTo}`;
      if (with_original_language) url += `&with_original_language=${with_original_language}`;
      if (with_keywords) url += `&with_keywords=${with_keywords}`;
      if (without_genres) url += `&without_genres=${without_genres}`;
      if (with_networks) url += `&with_networks=${with_networks}`;
      if (with_companies) url += `&with_companies=${with_companies}`;

      const response = await fetch(url);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error discovering TV shows:', error);
      res.status(500).json({ message: 'Failed to discover TV shows' });
    }
  });

  app.get('/api/tv/search', async (req, res) => {
    try {
      if (!process.env.TMDB_API_KEY) {
        return res.status(500).json({ message: 'TMDB API key not configured' });
      }
      const query = req.query.query;
      const page = req.query.page || 1;
      if (!query) {
        return res.status(400).json({ message: 'Search query is required' });
      }
      const response = await fetch(
        `https://api.themoviedb.org/3/search/tv?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(query as string)}&page=${page}`
      );
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error searching TV shows:', error);
      res.status(500).json({ message: 'Failed to search TV shows' });
    }
  });

  app.get('/api/tv/:id', async (req, res) => {
    try {
      if (!process.env.TMDB_API_KEY) {
        return res.status(500).json({ message: 'TMDB API key not configured' });
      }
      const tvId = req.params.id;
      const response = await fetch(
        `https://api.themoviedb.org/3/tv/${tvId}?api_key=${process.env.TMDB_API_KEY}&append_to_response=credits,videos,similar,recommendations`
      );
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error fetching TV show details:', error);
      res.status(500).json({ message: 'Failed to fetch TV show details' });
    }
  });

  app.get('/api/movies/popular', async (req, res) => {
    try {
      if (!process.env.TMDB_API_KEY) {
        return res.status(500).json({ message: 'TMDB API key not configured' });
      }
      const page = req.query.page || 1;
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/popular?api_key=${process.env.TMDB_API_KEY}&page=${page}`
      );
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error fetching popular movies:', error);
      res.status(500).json({ message: 'Failed to fetch popular movies' });
    }
  });

  app.get('/api/movies/top-rated', async (req, res) => {
    try {
      if (!process.env.TMDB_API_KEY) {
        return res.status(500).json({ message: 'TMDB API key not configured' });
      }
      const page = req.query.page || 1;
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/top_rated?api_key=${process.env.TMDB_API_KEY}&page=${page}`
      );
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error fetching top rated movies:', error);
      res.status(500).json({ message: 'Failed to fetch top rated movies' });
    }
  });

  app.get('/api/movies/upcoming', async (req, res) => {
    try {
      if (!process.env.TMDB_API_KEY) {
        return res.status(500).json({ message: 'TMDB API key not configured' });
      }
      const page = req.query.page || 1;
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/upcoming?api_key=${process.env.TMDB_API_KEY}&page=${page}`
      );
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error fetching upcoming movies:', error);
      res.status(500).json({ message: 'Failed to fetch upcoming movies' });
    }
  });

  // Add alias with underscore for frontend compatibility
  app.get('/api/movies/now_playing', async (req, res) => {
    try {
      if (!process.env.TMDB_API_KEY) {
        return res.status(500).json({ message: 'TMDB API key not configured' });
      }
      const page = req.query.page || 1;
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/now_playing?api_key=${process.env.TMDB_API_KEY}&page=${page}`
      );
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error fetching now playing movies:', error);
      res.status(500).json({ message: 'Failed to fetch now playing movies' });
    }
  });

  app.get('/api/movies/now-playing', async (req, res) => {
    try {
      if (!process.env.TMDB_API_KEY) {
        return res.status(500).json({ message: 'TMDB API key not configured' });
      }
      const page = req.query.page || 1;
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/now_playing?api_key=${process.env.TMDB_API_KEY}&page=${page}`
      );
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error fetching now playing movies:', error);
      res.status(500).json({ message: 'Failed to fetch now playing movies' });
    }
  });

  // Comprehensive movie discovery endpoint with all TMDB filters
  app.get('/api/movies/discover', async (req, res) => {
    try {
      if (!process.env.TMDB_API_KEY) {
        return res.status(500).json({ message: 'TMDB API key not configured' });
      }
      const {
        page = 1,
        sort_by = 'popularity.desc',
        with_genres,
        primary_release_year,
        'vote_average.gte': minRating,
        'vote_average.lte': maxRating,
        // Removed runtime and vote count filters per requirements
        'primary_release_date.gte': releaseDateFrom,
        'primary_release_date.lte': releaseDateTo,
        with_original_language,
        region,
        with_keywords,
        without_genres,
        certification_country,
        'certification.lte': certification
      } = req.query;

      let url = `https://api.themoviedb.org/3/discover/movie?api_key=${process.env.TMDB_API_KEY}&page=${page}&sort_by=${sort_by}`;
      
      // Add optional parameters
      if (with_genres) url += `&with_genres=${with_genres}`;
      if (primary_release_year) url += `&primary_release_year=${primary_release_year}`;
      if (minRating) url += `&vote_average.gte=${minRating}`;
      if (maxRating) url += `&vote_average.lte=${maxRating}`;
      // Runtime and minimum votes filters removed per user requirements
      if (releaseDateFrom) url += `&primary_release_date.gte=${releaseDateFrom}`;
      if (releaseDateTo) url += `&primary_release_date.lte=${releaseDateTo}`;
      if (with_original_language) url += `&with_original_language=${with_original_language}`;
      if (region) url += `&region=${region}`;
      if (with_keywords) url += `&with_keywords=${with_keywords}`;
      if (without_genres) url += `&without_genres=${without_genres}`;
      if (certification_country) url += `&certification_country=${certification_country}`;
      if (certification) url += `&certification.lte=${certification}`;

      const response = await fetch(url);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error discovering movies:', error);
      res.status(500).json({ message: 'Failed to discover movies' });
    }
  });

  app.get('/api/movies/search', async (req, res) => {
    try {
      if (!process.env.TMDB_API_KEY) {
        return res.status(500).json({ message: 'TMDB API key not configured' });
      }
      const query = req.query.query;
      const page = req.query.page || 1;
      if (!query) {
        return res.status(400).json({ message: 'Search query is required' });
      }
      const response = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(query as string)}&page=${page}`
      );
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error searching movies:', error);
      res.status(500).json({ message: 'Failed to search movies' });
    }
  });

  app.get('/api/movies/:id', async (req, res) => {
    try {
      if (!process.env.TMDB_API_KEY) {
        return res.status(500).json({ message: 'TMDB API key not configured' });
      }
      const movieId = req.params.id;
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/${movieId}?api_key=${process.env.TMDB_API_KEY}&append_to_response=credits,videos,similar,recommendations`
      );
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error fetching movie details:', error);
      res.status(500).json({ message: 'Failed to fetch movie details' });
    }
  });

  app.get('/api/movies/discover/:category', async (req, res) => {
    try {
      if (!process.env.TMDB_API_KEY) {
        return res.status(500).json({ message: 'TMDB API key not configured' });
      }
      const category = req.params.category;
      const page = req.query.page || 1;
      let url = `https://api.themoviedb.org/3/discover/movie?api_key=${process.env.TMDB_API_KEY}&page=${page}`;
      
      // Map categories to genre IDs
      const genreMap: Record<string, string> = {
        action: '28',
        adventure: '12',
        animation: '16',
        comedy: '35',
        crime: '80',
        documentary: '99',
        drama: '18',
        family: '10751',
        fantasy: '14',
        history: '36',
        horror: '27',
        music: '10402',
        mystery: '9648',
        romance: '10749',
        'science-fiction': '878',
        'tv-movie': '10770',
        thriller: '53',
        war: '10752',
        western: '37'
      };

      if (genreMap[category]) {
        url += `&with_genres=${genreMap[category]}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error fetching movies by category:', error);
      res.status(500).json({ message: 'Failed to fetch movies by category' });
    }
  });

  // Watchlist endpoints
  app.get('/api/watchlists', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const watchlists = await storage.getUserWatchlists(userId);
      res.json(watchlists);
    } catch (error) {
      console.error('Error fetching watchlists:', error);
      res.status(500).json({ message: 'Failed to fetch watchlists' });
    }
  });

  app.post('/api/watchlists', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const data = insertWatchlistSchema.parse({ ...req.body, userId });
      const watchlist = await storage.createWatchlist(data);
      res.json(watchlist);
    } catch (error) {
      console.error('Error creating watchlist:', error);
      res.status(500).json({ message: 'Failed to create watchlist' });
    }
  });

  app.get('/api/watchlists/:id/items', isAuthenticated, async (req, res) => {
    try {
      const watchlistId = req.params.id;
      const items = await storage.getWatchlistItems(watchlistId);
      res.json(items);
    } catch (error) {
      console.error('Error fetching watchlist items:', error);
      res.status(500).json({ message: 'Failed to fetch watchlist items' });
    }
  });

  app.post('/api/watchlists/:id/items', isAuthenticated, async (req, res) => {
    try {
      const watchlistId = req.params.id;
      const data = insertWatchlistItemSchema.parse({ ...req.body, watchlistId });
      const item = await storage.addWatchlistItem(data);
      res.json(item);
    } catch (error) {
      console.error('Error adding watchlist item:', error);
      res.status(500).json({ message: 'Failed to add watchlist item' });
    }
  });

  app.delete('/api/watchlists/:id/items/:mediaType/:mediaId', isAuthenticated, async (req, res) => {
    try {
      const watchlistId = req.params.id;
      const mediaType = req.params.mediaType;
      const mediaId = parseInt(req.params.mediaId);
      await storage.removeWatchlistItem(watchlistId, mediaType, mediaId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error removing watchlist item:', error);
      res.status(500).json({ message: 'Failed to remove watchlist item' });
    }
  });

  // Favorites endpoints
  app.get('/api/favorites', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const favorites = await storage.getUserFavorites(userId);
      res.json(favorites);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      res.status(500).json({ message: 'Failed to fetch favorites' });
    }
  });

  app.post('/api/favorites', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const data = insertFavoriteSchema.parse({ ...req.body, userId });
      const favorite = await storage.addFavorite(data);
      res.json(favorite);
    } catch (error) {
      console.error('Error adding favorite:', error);
      res.status(500).json({ message: 'Failed to add favorite' });
    }
  });

  app.delete('/api/favorites/:mediaType/:mediaId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const mediaType = req.params.mediaType;
      const mediaId = parseInt(req.params.mediaId);
      await storage.removeFavorite(userId, mediaType, mediaId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error removing favorite:', error);
      res.status(500).json({ message: 'Failed to remove favorite' });
    }
  });

  app.get('/api/favorites/:mediaType/:mediaId/check', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const mediaType = req.params.mediaType;
      const mediaId = parseInt(req.params.mediaId);
      const isFavorite = await storage.isFavorite(userId, mediaType, mediaId);
      res.json({ isFavorite });
    } catch (error) {
      console.error('Error checking favorite status:', error);
      res.status(500).json({ message: 'Failed to check favorite status' });
    }
  });

  // Reviews endpoints
  app.get('/api/reviews/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const reviews = await storage.getUserReviews(userId);
      res.json(reviews);
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      res.status(500).json({ message: 'Failed to fetch user reviews' });
    }
  });

  // Get TMDB reviews for a movie or TV show
  app.get('/api/reviews/:mediaType/:mediaId/tmdb', async (req, res) => {
    try {
      if (!process.env.TMDB_API_KEY) {
        return res.status(500).json({ message: 'TMDB API key not configured' });
      }
      const mediaType = req.params.mediaType;
      const mediaId = req.params.mediaId;
      
      // Validate mediaType
      if (!['movie', 'tv'].includes(mediaType)) {
        return res.status(400).json({ message: 'Media type must be either "movie" or "tv"' });
      }
      
      // Validate mediaId
      if (isNaN(Number(mediaId))) {
        return res.status(400).json({ message: 'Media ID must be a valid number' });
      }
      
      const endpoint = mediaType === 'movie' ? 'movie' : 'tv';
      const response = await fetch(
        `https://api.themoviedb.org/3/${endpoint}/${mediaId}/reviews?api_key=${process.env.TMDB_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`TMDB API responded with status ${response.status}`);
      }
      
      const data = await response.json();
      
      // Transform TMDB reviews to match our expected format
      const tmdbReviews = data.results?.map((review: any) => ({
        id: `tmdb-${review.id}`,
        author_name: review.author,
        rating: review.author_details?.rating ? Math.round(review.author_details.rating) : null,
        content: review.content,
        created_at: review.created_at,
        source: 'tmdb'
      })) || [];
      
      res.json(tmdbReviews);
    } catch (error) {
      console.error('Error fetching TMDB reviews:', error);
      res.status(500).json({ message: 'Failed to fetch TMDB reviews' });
    }
  });

  // Get all reviews (both user and TMDB) for a movie or TV show
  app.get('/api/reviews/:mediaType/:mediaId', async (req, res) => {
    try {
      const mediaType = req.params.mediaType;
      const mediaIdParam = req.params.mediaId;
      
      // Validate mediaType
      if (!['movie', 'tv'].includes(mediaType)) {
        return res.status(400).json({ message: 'Media type must be either "movie" or "tv"' });
      }
      
      // Validate mediaId
      const mediaId = parseInt(mediaIdParam);
      if (isNaN(mediaId)) {
        return res.status(400).json({ message: 'Media ID must be a valid number' });
      }
      
      // Get user reviews from database
      const userReviews = await storage.getMediaReviews(mediaType, mediaId);
      const formattedUserReviews = userReviews.map((review: any) => ({
        id: review.id,
        author_name: 'User Review', // We could get actual usernames if we join with users table
        rating: review.rating,
        content: review.review,
        created_at: review.createdAt,
        source: 'user'
      }));
      
      // Get TMDB reviews
      let tmdbReviews: any[] = [];
      if (process.env.TMDB_API_KEY) {
        try {
          const endpoint = mediaType === 'movie' ? 'movie' : 'tv';
          const response = await fetch(
            `https://api.themoviedb.org/3/${endpoint}/${mediaId}/reviews?api_key=${process.env.TMDB_API_KEY}`
          );
          
          if (response.ok) {
            const data = await response.json();
            tmdbReviews = data.results?.map((review: any) => ({
              id: `tmdb-${review.id}`,
              author_name: review.author,
              rating: review.author_details?.rating ? Math.round(review.author_details.rating) : null,
              content: review.content,
              created_at: review.created_at,
              source: 'tmdb'
            })) || [];
          }
        } catch (tmdbError) {
          console.error('Error fetching TMDB reviews:', tmdbError);
          // Continue without TMDB reviews if there's an error
        }
      }
      
      // Combine and sort reviews by creation date (newest first)
      const allReviews = [...formattedUserReviews, ...tmdbReviews].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      res.json(allReviews);
    } catch (error) {
      console.error('Error fetching media reviews:', error);
      res.status(500).json({ message: 'Failed to fetch media reviews' });
    }
  });

  app.post('/api/reviews', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const data = insertReviewSchema.parse({ ...req.body, userId });
      const review = await storage.createReview(data);
      res.json(review);
    } catch (error) {
      console.error('Error creating review:', error);
      res.status(500).json({ message: 'Failed to create review' });
    }
  });

  // Admin endpoints
  app.get('/api/admin/users', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: 'Admin access required' });
      }
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  app.get('/api/admin/stats', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: 'Admin access required' });
      }
      const stats = await storage.getUserStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ message: 'Failed to fetch stats' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
