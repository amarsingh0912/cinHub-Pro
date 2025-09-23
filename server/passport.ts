import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as TwitterStrategy } from '@superfaceai/passport-twitter-oauth2';
import { storage } from './storage';
import type { User } from '@shared/schema.js';

// Serialize user for sessions
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from sessions
passport.deserializeUser(async (userId: string, done) => {
  try {
    const user = await storage.getUserById(userId);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/auth/google/callback',
    scope: ['profile', 'email'],
    state: true
  }, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
    try {
      // Check if user exists by email or social account
      let user = await storage.getUserByEmail(profile.emails?.[0]?.value || '');
      
      if (user) {
        // User exists, link social account if not already linked
        const existingSocialAccount = await storage.getUserSocialAccount(user.id, 'google');
        if (!existingSocialAccount) {
          await storage.createSocialAccount({
            userId: user.id,
            provider: 'google',
            providerUserId: profile.id
          });
          // Update user's providers array
          const currentProviders = user.providers || [];
          if (!currentProviders.includes('google')) {
            await storage.updateUser(user.id, { 
              providers: [...currentProviders, 'google'] 
            });
          }
        }
      } else {
        // Create new user
        const userData = {
          email: profile.emails?.[0]?.value,
          firstName: profile.name?.givenName,
          lastName: profile.name?.familyName,
          displayName: profile.displayName,
          profileImageUrl: profile.photos?.[0]?.value,
          providers: ['google'],
          isVerified: true // OAuth accounts are considered verified
        };
        
        user = await storage.createUser(userData);
        
        // Create social account link
        await storage.createSocialAccount({
          userId: user.id,
          provider: 'google',
          providerUserId: profile.id
        });
      }
      
      return done(null, user);
    } catch (error) {
      console.error('Google OAuth error:', error);
      return done(error, null);
    }
  }));
}

// Facebook OAuth Strategy
if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    callbackURL: '/api/auth/facebook/callback',
    profileFields: ['id', 'displayName', 'photos', 'email', 'name'],
    enableProof: true
  }, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
    try {
      let user = await storage.getUserByEmail(profile.emails?.[0]?.value || '');
      
      if (user) {
        const existingSocialAccount = await storage.getUserSocialAccount(user.id, 'facebook');
        if (!existingSocialAccount) {
          await storage.createSocialAccount({
            userId: user.id,
            provider: 'facebook',
            providerUserId: profile.id
          });
        }
      } else {
        const userData = {
          email: profile.emails?.[0]?.value,
          firstName: profile.name?.givenName,
          lastName: profile.name?.familyName,
          displayName: profile.displayName,
          profileImageUrl: profile.photos?.[0]?.value,
          providers: ['facebook'],
          isVerified: true
        };
        
        user = await storage.createUser(userData);
        
        await storage.createSocialAccount({
          userId: user.id,
          provider: 'facebook',
          providerUserId: profile.id
        });
      }
      
      return done(null, user);
    } catch (error) {
      console.error('Facebook OAuth error:', error);
      return done(error, null);
    }
  }));
}

// GitHub OAuth Strategy
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: '/api/auth/github/callback',
    scope: ['user:email'],
    state: true
  }, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
    try {
      let user = await storage.getUserByEmail(profile.emails?.[0]?.value || '');
      
      if (user) {
        const existingSocialAccount = await storage.getUserSocialAccount(user.id, 'github');
        if (!existingSocialAccount) {
          await storage.createSocialAccount({
            userId: user.id,
            provider: 'github',
            providerUserId: profile.id
          });
        }
      } else {
        const userData = {
          email: profile.emails?.[0]?.value,
          username: profile.username,
          displayName: profile.displayName || profile.username,
          profileImageUrl: profile.photos?.[0]?.value,
          providers: ['github'],
          isVerified: true
        };
        
        user = await storage.createUser(userData);
        
        await storage.createSocialAccount({
          userId: user.id,
          provider: 'github',
          providerUserId: profile.id
        });
      }
      
      return done(null, user);
    } catch (error) {
      console.error('GitHub OAuth error:', error);
      return done(error, null);
    }
  }));
}

// Twitter OAuth Strategy
if (process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET) {
  passport.use(new TwitterStrategy({
    clientID: process.env.TWITTER_CLIENT_ID,
    clientSecret: process.env.TWITTER_CLIENT_SECRET,
    callbackURL: '/api/auth/twitter/callback',
    clientType: 'confidential',
    scope: ['tweet.read', 'users.read']
  }, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
    try {
      // Twitter OAuth 2.0 doesn't provide email by default
      // We'll need to handle users without email
      let user = null;
      
      // Try to find existing user by social account first
      const existingSocialAccount = await storage.getSocialAccountByProvider('twitter', profile.id);
      if (existingSocialAccount) {
        user = await storage.getUserById(existingSocialAccount.userId);
      }
      
      if (!user) {
        // Create new user without email (Twitter doesn't provide it easily)
        const userData = {
          username: profile.username,
          displayName: profile.displayName,
          profileImageUrl: profile.photos?.[0]?.value,
          providers: ['twitter'],
          isVerified: true
        };
        
        user = await storage.createUser(userData);
      }
      
      // Create or update social account link
      if (!existingSocialAccount) {
        await storage.createSocialAccount({
          userId: user.id,
          provider: 'twitter',
          providerUserId: profile.id
        });
      }
      
      return done(null, user);
    } catch (error) {
      console.error('Twitter OAuth error:', error);
      return done(error, null);
    }
  }));
}

export default passport;