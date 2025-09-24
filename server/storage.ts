import {
  users,
  watchlists,
  watchlistItems,
  favorites,
  reviews,
  otpVerifications,
  authSessions,
  socialAccounts,
  type User,
  type UpsertUser,
  type InsertUser,
  type AuthSession,
  type InsertAuthSession,
  type OtpVerification,
  type InsertOtpVerification,
  type SocialAccount,
  type InsertSocialAccount,
  type Watchlist,
  type InsertWatchlist,
  type WatchlistItem,
  type InsertWatchlistItem,
  type Favorite,
  type InsertFavorite,
  type Review,
  type InsertReview,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations for custom authentication
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByPhoneNumber(phoneNumber: string): Promise<User | undefined>;
  getUserByIdentifier(identifier: string): Promise<User | undefined>; // For email/username/phone lookup
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>; // For social account linking
  
  // Auth Session operations
  createAuthSession(session: InsertAuthSession): Promise<AuthSession>;
  getAuthSession(refreshTokenHash: string): Promise<AuthSession | undefined>;
  getUserAuthSessions(userId: string): Promise<AuthSession[]>;
  updateAuthSession(id: string, updates: Partial<InsertAuthSession>): Promise<AuthSession>;
  deleteAuthSession(id: string): Promise<void>;
  deleteUserAuthSessions(userId: string): Promise<void>;
  cleanupExpiredSessions(): Promise<void>;
  
  // OTP operations
  createOtp(otp: InsertOtpVerification): Promise<OtpVerification>;
  getOtp(target: string, purpose: 'signup' | 'reset' | 'login'): Promise<OtpVerification | undefined>;
  verifyOtp(target: string, code: string, purpose: 'signup' | 'reset' | 'login'): Promise<boolean>;
  consumeOtp(id: string): Promise<void>;
  incrementOtpAttempts(id: string): Promise<void>;
  deleteOtp(target: string, purpose: 'signup' | 'reset' | 'login'): Promise<void>;
  cleanupExpiredOtps(): Promise<void>;
  
  // Social Account operations
  createSocialAccount(account: InsertSocialAccount): Promise<SocialAccount>;
  getSocialAccount(provider: string, providerUserId: string): Promise<SocialAccount | undefined>;
  getSocialAccountByProvider(provider: string, providerUserId: string): Promise<SocialAccount | undefined>;
  getUserSocialAccounts(userId: string): Promise<SocialAccount[]>;
  getUserSocialAccount(userId: string, provider: string): Promise<SocialAccount | undefined>;
  deleteSocialAccount(userId: string, provider: string): Promise<void>;
  
  // Backwards compatibility methods for passport
  getUserById(id: string): Promise<User | undefined>;
  
  // Watchlist operations
  getUserWatchlists(userId: string): Promise<Watchlist[]>;
  createWatchlist(watchlist: InsertWatchlist): Promise<Watchlist>;
  getWatchlistById(watchlistId: string): Promise<Watchlist | undefined>;
  updateWatchlist(watchlistId: string, updates: Partial<InsertWatchlist>): Promise<Watchlist>;
  deleteWatchlist(watchlistId: string): Promise<void>;
  getWatchlistItems(watchlistId: string): Promise<WatchlistItem[]>;
  addWatchlistItem(item: InsertWatchlistItem): Promise<WatchlistItem>;
  removeWatchlistItem(watchlistId: string, mediaType: string, mediaId: number): Promise<void>;
  
  // Favorites operations
  getUserFavorites(userId: string): Promise<Favorite[]>;
  addFavorite(favorite: InsertFavorite): Promise<Favorite>;
  removeFavorite(userId: string, mediaType: string, mediaId: number): Promise<void>;
  isFavorite(userId: string, mediaType: string, mediaId: number): Promise<boolean>;
  
  // Review operations
  getUserReviews(userId: string): Promise<Review[]>;
  getMediaReviews(mediaType: string, mediaId: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  updateReview(reviewId: string, updates: Partial<InsertReview>): Promise<Review>;
  deleteReview(reviewId: string): Promise<void>;
  
  // Admin operations
  getAllUsers(): Promise<User[]>;
  getUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    totalReviews: number;
    totalWatchlists: number;
  }>;
  findAdminUser(): Promise<User | undefined>;
  updateUser(userId: string, updates: Partial<InsertUser>): Promise<User>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByPhoneNumber(phoneNumber: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phoneNumber, phoneNumber));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getUserByIdentifier(identifier: string): Promise<User | undefined> {
    // Try to find user by email, username, or phone number
    const [user] = await db
      .select()
      .from(users)
      .where(
        sql`${users.email} = ${identifier} OR ${users.username} = ${identifier} OR ${users.phoneNumber} = ${identifier}`
      );
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Auth Session operations
  async createAuthSession(sessionData: InsertAuthSession): Promise<AuthSession> {
    const [session] = await db
      .insert(authSessions)
      .values(sessionData)
      .returning();
    return session;
  }

  async getAuthSession(refreshTokenHash: string): Promise<AuthSession | undefined> {
    const [session] = await db
      .select()
      .from(authSessions)
      .where(eq(authSessions.refreshTokenHash, refreshTokenHash));
    return session;
  }

  async getUserAuthSessions(userId: string): Promise<AuthSession[]> {
    return await db
      .select()
      .from(authSessions)
      .where(eq(authSessions.userId, userId))
      .orderBy(desc(authSessions.createdAt));
  }

  async updateAuthSession(id: string, updates: Partial<InsertAuthSession>): Promise<AuthSession> {
    const [session] = await db
      .update(authSessions)
      .set(updates)
      .where(eq(authSessions.id, id))
      .returning();
    return session;
  }

  async deleteAuthSession(id: string): Promise<void> {
    await db
      .delete(authSessions)
      .where(eq(authSessions.id, id));
  }

  async deleteUserAuthSessions(userId: string): Promise<void> {
    await db
      .delete(authSessions)
      .where(eq(authSessions.userId, userId));
  }

  async cleanupExpiredSessions(): Promise<void> {
    await db
      .delete(authSessions)
      .where(sql`expires_at < NOW()`);
  }

  // Watchlist operations
  async getUserWatchlists(userId: string): Promise<Watchlist[]> {
    return await db
      .select()
      .from(watchlists)
      .where(eq(watchlists.userId, userId))
      .orderBy(desc(watchlists.createdAt));
  }

  async createWatchlist(watchlist: InsertWatchlist): Promise<Watchlist> {
    const [newWatchlist] = await db
      .insert(watchlists)
      .values(watchlist)
      .returning();
    return newWatchlist;
  }

  async getWatchlistById(watchlistId: string): Promise<Watchlist | undefined> {
    const [watchlist] = await db
      .select()
      .from(watchlists)
      .where(eq(watchlists.id, watchlistId))
      .limit(1);
    return watchlist;
  }

  async updateWatchlist(watchlistId: string, updates: Partial<InsertWatchlist>): Promise<Watchlist> {
    const [updatedWatchlist] = await db
      .update(watchlists)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(watchlists.id, watchlistId))
      .returning();
    return updatedWatchlist;
  }

  async deleteWatchlist(watchlistId: string): Promise<void> {
    // First delete all watchlist items
    await db
      .delete(watchlistItems)
      .where(eq(watchlistItems.watchlistId, watchlistId));
    
    // Then delete the watchlist itself
    await db
      .delete(watchlists)
      .where(eq(watchlists.id, watchlistId));
  }

  async getWatchlistItems(watchlistId: string): Promise<WatchlistItem[]> {
    return await db
      .select()
      .from(watchlistItems)
      .where(eq(watchlistItems.watchlistId, watchlistId))
      .orderBy(desc(watchlistItems.addedAt));
  }

  async addWatchlistItem(item: InsertWatchlistItem): Promise<WatchlistItem> {
    const [newItem] = await db
      .insert(watchlistItems)
      .values(item)
      .returning();
    return newItem;
  }

  async removeWatchlistItem(watchlistId: string, mediaType: string, mediaId: number): Promise<void> {
    await db
      .delete(watchlistItems)
      .where(
        and(
          eq(watchlistItems.watchlistId, watchlistId),
          eq(watchlistItems.mediaType, mediaType),
          eq(watchlistItems.mediaId, mediaId)
        )
      );
  }

  // Favorites operations
  async getUserFavorites(userId: string): Promise<Favorite[]> {
    return await db
      .select()
      .from(favorites)
      .where(eq(favorites.userId, userId))
      .orderBy(desc(favorites.addedAt));
  }

  async addFavorite(favorite: InsertFavorite): Promise<Favorite> {
    const [newFavorite] = await db
      .insert(favorites)
      .values(favorite)
      .returning();
    return newFavorite;
  }

  async removeFavorite(userId: string, mediaType: string, mediaId: number): Promise<void> {
    await db
      .delete(favorites)
      .where(
        and(
          eq(favorites.userId, userId),
          eq(favorites.mediaType, mediaType),
          eq(favorites.mediaId, mediaId)
        )
      );
  }

  async isFavorite(userId: string, mediaType: string, mediaId: number): Promise<boolean> {
    const [favorite] = await db
      .select()
      .from(favorites)
      .where(
        and(
          eq(favorites.userId, userId),
          eq(favorites.mediaType, mediaType),
          eq(favorites.mediaId, mediaId)
        )
      );
    return !!favorite;
  }

  // Review operations
  async getUserReviews(userId: string): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.userId, userId))
      .orderBy(desc(reviews.createdAt));
  }

  async getMediaReviews(mediaType: string, mediaId: number): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(
        and(
          eq(reviews.mediaType, mediaType),
          eq(reviews.mediaId, mediaId)
        )
      )
      .orderBy(desc(reviews.createdAt));
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db
      .insert(reviews)
      .values(review)
      .returning();
    return newReview;
  }

  async updateReview(reviewId: string, updates: Partial<InsertReview>): Promise<Review> {
    const [updatedReview] = await db
      .update(reviews)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(reviews.id, reviewId))
      .returning();
    return updatedReview;
  }

  async deleteReview(reviewId: string): Promise<void> {
    await db
      .delete(reviews)
      .where(eq(reviews.id, reviewId));
  }

  // Admin operations
  async getAllUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt));
  }

  async getUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    totalReviews: number;
    totalWatchlists: number;
  }> {
    const [totalUsersResult] = await db
      .select({ count: sql`count(*)` })
      .from(users);

    const [activeUsersResult] = await db
      .select({ count: sql`count(*)` })
      .from(users)
      .where(sql`updated_at > NOW() - INTERVAL '30 days'`);

    const [totalReviewsResult] = await db
      .select({ count: sql`count(*)` })
      .from(reviews);

    const [totalWatchlistsResult] = await db
      .select({ count: sql`count(*)` })
      .from(watchlists);

    return {
      totalUsers: Number(totalUsersResult.count),
      activeUsers: Number(activeUsersResult.count),
      totalReviews: Number(totalReviewsResult.count),
      totalWatchlists: Number(totalWatchlistsResult.count),
    };
  }

  async findAdminUser(): Promise<User | undefined> {
    const [adminUser] = await db
      .select()
      .from(users)
      .where(eq(users.isAdmin, true))
      .limit(1);
    return adminUser;
  }

  // OTP operations with new schema
  async createOtp(otpData: InsertOtpVerification): Promise<OtpVerification> {
    // Delete any existing active OTP for this target and purpose
    await this.deleteOtp(otpData.target, otpData.purpose as 'signup' | 'reset' | 'login');
    
    const [otp] = await db
      .insert(otpVerifications)
      .values(otpData)
      .returning();
    return otp;
  }

  async getOtp(target: string, purpose: 'signup' | 'reset' | 'login'): Promise<OtpVerification | undefined> {
    const [otp] = await db
      .select()
      .from(otpVerifications)
      .where(
        and(
          eq(otpVerifications.target, target),
          eq(otpVerifications.purpose, purpose),
          sql`consumed_at IS NULL`,
          sql`expires_at > NOW()`
        )
      );
    return otp;
  }

  async verifyOtp(target: string, code: string, purpose: 'signup' | 'reset' | 'login'): Promise<boolean> {
    const otp = await this.getOtp(target, purpose);
    
    if (!otp) {
      return false;
    }

    // Check if too many attempts already made
    const currentAttempts = otp.attempts ?? 0;
    if (currentAttempts >= 3) {
      await this.deleteOtp(target, purpose);
      return false;
    }

    // Check if code matches
    if (otp.code !== code) {
      const nextAttempts = currentAttempts + 1;
      if (nextAttempts >= 3) {
        // Too many attempts, delete the OTP
        await this.deleteOtp(target, purpose);
      } else {
        // Increment attempts
        await this.incrementOtpAttempts(otp.id);
      }
      return false;
    }

    // Code matches and attempts are valid, consume the OTP
    await this.consumeOtp(otp.id);
    return true;
  }

  async consumeOtp(id: string): Promise<void> {
    await db
      .update(otpVerifications)
      .set({ consumedAt: new Date() })
      .where(eq(otpVerifications.id, id));
  }

  async incrementOtpAttempts(id: string): Promise<void> {
    await db
      .update(otpVerifications)
      .set({ attempts: sql`attempts + 1` })
      .where(eq(otpVerifications.id, id));
  }

  async deleteOtp(target: string, purpose: 'signup' | 'reset' | 'login'): Promise<void> {
    await db
      .delete(otpVerifications)
      .where(
        and(
          eq(otpVerifications.target, target),
          eq(otpVerifications.purpose, purpose)
        )
      );
  }

  async cleanupExpiredOtps(): Promise<void> {
    await db
      .delete(otpVerifications)
      .where(sql`expires_at < NOW()`);
  }

  // Social Account operations
  async createSocialAccount(accountData: InsertSocialAccount): Promise<SocialAccount> {
    try {
      const [account] = await db
        .insert(socialAccounts)
        .values(accountData)
        .returning();
      return account;
    } catch (error: any) {
      // Handle unique constraint violations gracefully
      if (error.code === '23505') { // PostgreSQL unique constraint violation
        // Check if account already exists and return it
        const existing = await this.getSocialAccount(accountData.provider, accountData.providerUserId);
        if (existing) {
          return existing;
        }
        // If we can't find it, re-throw the error
      }
      throw error;
    }
  }

  async getSocialAccount(provider: string, providerUserId: string): Promise<SocialAccount | undefined> {
    const [account] = await db
      .select()
      .from(socialAccounts)
      .where(
        and(
          eq(socialAccounts.provider, provider),
          eq(socialAccounts.providerUserId, providerUserId)
        )
      );
    return account;
  }

  async getUserSocialAccounts(userId: string): Promise<SocialAccount[]> {
    return await db
      .select()
      .from(socialAccounts)
      .where(eq(socialAccounts.userId, userId))
      .orderBy(desc(socialAccounts.createdAt));
  }

  async getUserSocialAccount(userId: string, provider: string): Promise<SocialAccount | undefined> {
    const [account] = await db
      .select()
      .from(socialAccounts)
      .where(
        and(
          eq(socialAccounts.userId, userId),
          eq(socialAccounts.provider, provider)
        )
      );
    return account;
  }

  async deleteSocialAccount(userId: string, provider: string): Promise<void> {
    await db
      .delete(socialAccounts)
      .where(
        and(
          eq(socialAccounts.userId, userId),
          eq(socialAccounts.provider, provider)
        )
      );
  }

  // Additional social account methods
  async getSocialAccountByProvider(provider: string, providerUserId: string): Promise<SocialAccount | undefined> {
    return this.getSocialAccount(provider, providerUserId);
  }

  // Backwards compatibility for passport
  async getUserById(id: string): Promise<User | undefined> {
    return this.getUser(id);
  }
}

export const storage = new DatabaseStorage();
