import {
  users,
  watchlists,
  watchlistItems,
  favorites,
  reviews,
  otpVerifications,
  type User,
  type UpsertUser,
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
  createUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<UpsertUser>): Promise<User>;
  
  // Watchlist operations
  getUserWatchlists(userId: string): Promise<Watchlist[]>;
  createWatchlist(watchlist: InsertWatchlist): Promise<Watchlist>;
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
  
  // OTP operations
  createOtp(identifier: string, type: 'signup' | 'forgot-password'): Promise<string>;
  verifyOtp(identifier: string, otp: string, type: 'signup' | 'forgot-password'): Promise<boolean>;
  deleteOtp(identifier: string, type: 'signup' | 'forgot-password'): Promise<void>;
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

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<UpsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
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

  // OTP operations
  async createOtp(identifier: string, type: 'signup' | 'forgot-password'): Promise<string> {
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Delete any existing OTP for this identifier and type
    await this.deleteOtp(identifier, type);
    
    // Create new OTP with 10-minute expiration
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
    await db.insert(otpVerifications).values({
      identifier,
      otp,
      type,
      expiresAt,
    });
    
    return otp;
  }

  async verifyOtp(identifier: string, otp: string, type: 'signup' | 'forgot-password'): Promise<boolean> {
    const [verification] = await db
      .select()
      .from(otpVerifications)
      .where(
        and(
          eq(otpVerifications.identifier, identifier),
          eq(otpVerifications.otp, otp),
          eq(otpVerifications.type, type)
        )
      );

    if (!verification) {
      return false;
    }

    // Check if OTP has expired
    if (new Date() > verification.expiresAt) {
      await this.deleteOtp(identifier, type);
      return false;
    }

    // OTP is valid, delete it
    await this.deleteOtp(identifier, type);
    return true;
  }

  async deleteOtp(identifier: string, type: 'signup' | 'forgot-password'): Promise<void> {
    await db
      .delete(otpVerifications)
      .where(
        and(
          eq(otpVerifications.identifier, identifier),
          eq(otpVerifications.type, type)
        )
      );
  }
}

export const storage = new DatabaseStorage();
