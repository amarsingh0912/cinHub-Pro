import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for custom authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  username: varchar("username").unique(),
  password: varchar("password"), // Hashed password - nullable for social-only users
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  phoneNumber: varchar("phone_number").unique(),
  profileImageUrl: varchar("profile_image_url"),
  displayName: varchar("display_name"), // Full display name
  providers: text("providers").array().default(sql`'{}'`), // Array of auth providers used
  isAdmin: boolean("is_admin").default(false),
  isVerified: boolean("is_verified").default(false), // Account verification status
  preferences: jsonb("preferences"), // Store movie preferences as JSON
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Refresh token sessions for JWT authentication
export const authSessions = pgTable("auth_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  refreshTokenHash: varchar("refresh_token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("auth_sessions_user_id_idx").on(table.userId),
]);

// OTP verification table for password reset and account verification
export const otpVerifications = pgTable("otp_verifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  target: varchar("target").notNull(), // email or phone number
  purpose: varchar("purpose").notNull(), // 'signup', 'reset', or 'login'
  code: varchar("code").notNull(), // 6-digit OTP code
  attempts: integer("attempts").default(0), // Number of verification attempts
  consumedAt: timestamp("consumed_at"), // When the OTP was successfully used
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  // Index for efficient OTP lookups
  index("otp_target_purpose_code_idx").on(table.target, table.purpose, table.code),
  index("otp_target_purpose_idx").on(table.target, table.purpose),
]);

// Social accounts for OAuth providers
export const socialAccounts = pgTable("social_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: varchar("provider").notNull(), // 'google', 'facebook', 'github', 'x'
  providerUserId: varchar("provider_user_id").notNull(),
  emailVerified: boolean("email_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  // Ensure one social account per provider per user
  unique("social_accounts_user_provider_unique").on(table.userId, table.provider),
  // Ensure one user per social identity  
  unique("social_accounts_provider_user_unique").on(table.provider, table.providerUserId),
  // Index for efficient lookups
  index("social_accounts_user_idx").on(table.userId),
]);

// User movie watchlists
export const watchlists = pgTable("watchlists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Individual watchlist items
export const watchlistItems = pgTable("watchlist_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  watchlistId: varchar("watchlist_id").notNull(),
  mediaType: varchar("media_type").notNull(), // 'movie' or 'tv'
  mediaId: integer("media_id").notNull(), // TMDB movie or TV ID
  mediaTitle: varchar("media_title").notNull(),
  mediaPosterPath: varchar("media_poster_path"),
  mediaReleaseDate: varchar("media_release_date"), // release_date for movies, first_air_date for TV shows
  addedAt: timestamp("added_at").defaultNow(),
});

// User media favorites
export const favorites = pgTable("favorites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  mediaType: varchar("media_type").notNull(), // 'movie' or 'tv'
  mediaId: integer("media_id").notNull(), // TMDB movie or TV ID
  mediaTitle: varchar("media_title").notNull(),
  mediaPosterPath: varchar("media_poster_path"),
  mediaReleaseDate: varchar("media_release_date"), // release_date for movies, first_air_date for TV shows
  addedAt: timestamp("added_at").defaultNow(),
});

// User media ratings and reviews
export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  mediaType: varchar("media_type").notNull(), // 'movie' or 'tv'
  mediaId: integer("media_id").notNull(), // TMDB movie or TV ID
  rating: integer("rating").notNull(), // 1-10 scale
  review: text("review"),
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  watchlists: many(watchlists),
  favorites: many(favorites),
  reviews: many(reviews),
  authSessions: many(authSessions),
  socialAccounts: many(socialAccounts),
}));

export const authSessionsRelations = relations(authSessions, ({ one }) => ({
  user: one(users, {
    fields: [authSessions.userId],
    references: [users.id],
  }),
}));

export const socialAccountsRelations = relations(socialAccounts, ({ one }) => ({
  user: one(users, {
    fields: [socialAccounts.userId],
    references: [users.id],
  }),
}));

export const watchlistsRelations = relations(watchlists, ({ one, many }) => ({
  user: one(users, {
    fields: [watchlists.userId],
    references: [users.id],
  }),
  items: many(watchlistItems),
}));

export const watchlistItemsRelations = relations(watchlistItems, ({ one }) => ({
  watchlist: one(watchlists, {
    fields: [watchlistItems.watchlistId],
    references: [watchlists.id],
  }),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
}));

// Zod schemas for validation
export const insertWatchlistSchema = createInsertSchema(watchlists).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWatchlistItemSchema = createInsertSchema(watchlistItems).omit({
  id: true,
  addedAt: true,
});

export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  addedAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Authentication schemas
// Base schema that can be extended by frontend
export const baseSignUpSchema = z.object({
  email: z.string().email("Please enter a valid email address").optional(),
  username: z.string().min(3, "Username must be at least 3 characters").max(20, "Username must be less than 20 characters").regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  phoneNumber: z.string().regex(/^\+[1-9]\d{1,14}$/, "Phone number must be in E.164 format (e.g., +15551234567)").optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  displayName: z.string().min(1, "Display name is required").optional(),
});

// Validated schema with cross-field validation for backend
export const signUpSchema = baseSignUpSchema.refine(
  (data) => data.email || data.phoneNumber,
  {
    message: "Either email or phone number is required for verification",
    path: ["email"], // Show error on email field
  }
);

export const signInSchema = z.object({
  identifier: z.string().min(1, "Email, username, or phone number is required"), // Single field for email/username/phone
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional().default(false),
});

export const forgotPasswordSchema = z.object({
  identifier: z.string().min(1, "Email, username, or phone number is required"),
});

export const resetPasswordSchema = z.object({
  target: z.string().min(1, "Email or phone number is required"),
  purpose: z.literal("reset"),
  code: z.string().length(6, "OTP must be 6 digits"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export const verifyOtpSchema = z.object({
  target: z.string().min(1, "Email or phone number is required"),
  code: z.string().length(6, "OTP must be 6 digits"),
  purpose: z.enum(["signup", "reset", "login"]),
});

// Insert schemas for new tables
export const insertAuthSessionSchema = createInsertSchema(authSessions).omit({
  id: true,
  createdAt: true,
});

export const insertOtpVerificationSchema = createInsertSchema(otpVerifications).omit({
  id: true,
  createdAt: true,
  attempts: true,
});

export const insertSocialAccountSchema = createInsertSchema(socialAccounts).omit({
  id: true,
  createdAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type AuthSession = typeof authSessions.$inferSelect;
export type InsertAuthSession = z.infer<typeof insertAuthSessionSchema>;

export type OtpVerification = typeof otpVerifications.$inferSelect;
export type InsertOtpVerification = z.infer<typeof insertOtpVerificationSchema>;

export type SocialAccount = typeof socialAccounts.$inferSelect;
export type InsertSocialAccount = z.infer<typeof insertSocialAccountSchema>;

export type BaseSignUpData = z.infer<typeof baseSignUpSchema>;
export type SignUpData = z.infer<typeof signUpSchema>;
export type SignInData = z.infer<typeof signInSchema>;
export type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordData = z.infer<typeof resetPasswordSchema>;
export type VerifyOtpData = z.infer<typeof verifyOtpSchema>;

export type Watchlist = typeof watchlists.$inferSelect;
export type InsertWatchlist = z.infer<typeof insertWatchlistSchema>;
export type WatchlistItem = typeof watchlistItems.$inferSelect;
export type InsertWatchlistItem = z.infer<typeof insertWatchlistItemSchema>;
export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

// TMDB Data Cache Tables
// Movies cache - stores complete TMDB movie data
export const moviesCache = pgTable("movies_cache", {
  id: integer("id").primaryKey(), // TMDB movie ID
  title: varchar("title").notNull(),
  overview: text("overview"),
  releaseDate: varchar("release_date"),
  runtime: integer("runtime"),
  voteAverage: integer("vote_average"), // Store as integer (multiply by 10)
  voteCount: integer("vote_count"),
  popularity: integer("popularity"), // Store as integer (multiply by 100)
  budget: integer("budget"),
  revenue: integer("revenue"),
  status: varchar("status"),
  tagline: text("tagline"),
  originalLanguage: varchar("original_language"),
  originalTitle: varchar("original_title"),
  adult: boolean("adult"),
  // Image paths (Cloudinary URLs after processing)
  posterUrl: varchar("poster_url"), // Processed Cloudinary URL
  backdropUrl: varchar("backdrop_url"), // Processed Cloudinary URL
  // Raw TMDB data for additional fields
  tmdbData: jsonb("tmdb_data"), // Complete TMDB response
  // Cache metadata
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// TV Shows cache - stores complete TMDB TV show data  
export const tvShowsCache = pgTable("tv_shows_cache", {
  id: integer("id").primaryKey(), // TMDB TV show ID
  name: varchar("name").notNull(),
  overview: text("overview"),
  firstAirDate: varchar("first_air_date"),
  lastAirDate: varchar("last_air_date"),
  numberOfSeasons: integer("number_of_seasons"),
  numberOfEpisodes: integer("number_of_episodes"),
  voteAverage: integer("vote_average"), // Store as integer (multiply by 10)
  voteCount: integer("vote_count"),
  popularity: integer("popularity"), // Store as integer (multiply by 100)
  status: varchar("status"),
  tagline: text("tagline"),
  type: varchar("type"),
  originalLanguage: varchar("original_language"),
  originalName: varchar("original_name"),
  adult: boolean("adult"),
  inProduction: boolean("in_production"),
  // Image paths (Cloudinary URLs after processing)
  posterUrl: varchar("poster_url"), // Processed Cloudinary URL
  backdropUrl: varchar("backdrop_url"), // Processed Cloudinary URL
  // Raw TMDB data for additional fields
  tmdbData: jsonb("tmdb_data"), // Complete TMDB response
  // Cache metadata
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Cast and Crew cache - stores person details
export const peopleCache = pgTable("people_cache", {
  id: integer("id").primaryKey(), // TMDB person ID
  name: varchar("name").notNull(),
  biography: text("biography"),
  birthday: varchar("birthday"),
  deathday: varchar("deathday"),
  placeOfBirth: varchar("place_of_birth"),
  popularity: integer("popularity"), // Store as integer (multiply by 100)
  knownForDepartment: varchar("known_for_department"),
  adult: boolean("adult"),
  // Image paths (Cloudinary URLs after processing)
  profileUrl: varchar("profile_url"), // Processed Cloudinary URL
  // Raw TMDB data for additional fields
  tmdbData: jsonb("tmdb_data"), // Complete TMDB response
  // Cache metadata
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Cast/Crew relationships for movies and TV shows
export const mediaCredits = pgTable("media_credits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mediaType: varchar("media_type").notNull(), // 'movie' or 'tv'
  mediaId: integer("media_id").notNull(), // TMDB movie or TV ID
  personId: integer("person_id").notNull(), // TMDB person ID
  creditType: varchar("credit_type").notNull(), // 'cast' or 'crew'
  character: varchar("character"), // For cast members
  job: varchar("job"), // For crew members
  department: varchar("department"), // For crew members
  order: integer("order"), // Cast order
  // Cache metadata
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// TMDB Reviews cache (separate from user reviews)
export const tmdbReviewsCache = pgTable("tmdb_reviews_cache", {
  id: varchar("id").primaryKey(), // TMDB review ID
  mediaType: varchar("media_type").notNull(), // 'movie' or 'tv'
  mediaId: integer("media_id").notNull(), // TMDB movie or TV ID
  author: varchar("author").notNull(),
  authorUsername: varchar("author_username"),
  content: text("content").notNull(),
  rating: integer("rating"), // Author's rating if provided
  url: varchar("url"), // TMDB review URL
  // Raw TMDB data
  tmdbData: jsonb("tmdb_data"), // Complete TMDB review response
  // Cache metadata
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Images cache - tracks processed Cloudinary URLs
export const imagesCache = pgTable("images_cache", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tmdbPath: varchar("tmdb_path").unique().notNull(), // Original TMDB image path
  imageType: varchar("image_type").notNull(), // 'poster', 'backdrop', 'profile'
  cloudinaryUrl: varchar("cloudinary_url").notNull(), // Full Cloudinary URL
  publicId: varchar("public_id").notNull(), // Cloudinary public ID
  width: integer("width"),
  height: integer("height"),
  fileSize: integer("file_size"), // In bytes
  format: varchar("format"), // 'jpg', 'png', 'webp'
  // Cache metadata
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("images_cache_tmdb_path_idx").on(table.tmdbPath),
  index("images_cache_type_idx").on(table.imageType),
]);

// Add relations for the new cache tables
export const moviesCacheRelations = relations(moviesCache, ({ many }) => ({
  credits: many(mediaCredits),
  reviews: many(tmdbReviewsCache),
}));

export const tvShowsCacheRelations = relations(tvShowsCache, ({ many }) => ({
  credits: many(mediaCredits),
  reviews: many(tmdbReviewsCache),
}));

export const peopleCacheRelations = relations(peopleCache, ({ many }) => ({
  credits: many(mediaCredits),
}));

export const mediaCreditsRelations = relations(mediaCredits, ({ one }) => ({
  person: one(peopleCache, {
    fields: [mediaCredits.personId],
    references: [peopleCache.id],
  }),
}));

export const tmdbReviewsCacheRelations = relations(tmdbReviewsCache, ({ one }) => ({
  movie: one(moviesCache, {
    fields: [tmdbReviewsCache.mediaId],
    references: [moviesCache.id],
  }),
  tvShow: one(tvShowsCache, {
    fields: [tmdbReviewsCache.mediaId],
    references: [tvShowsCache.id],
  }),
}));

// Cache table insert schemas
export const insertMovieCacheSchema = createInsertSchema(moviesCache).omit({
  lastUpdated: true,
  createdAt: true,
});

export const insertTvShowCacheSchema = createInsertSchema(tvShowsCache).omit({
  lastUpdated: true,
  createdAt: true,
});

export const insertPersonCacheSchema = createInsertSchema(peopleCache).omit({
  lastUpdated: true,
  createdAt: true,
});

export const insertMediaCreditSchema = createInsertSchema(mediaCredits).omit({
  id: true,
  lastUpdated: true,
  createdAt: true,
});

export const insertTmdbReviewCacheSchema = createInsertSchema(tmdbReviewsCache).omit({
  lastUpdated: true,
  createdAt: true,
});

export const insertImageCacheSchema = createInsertSchema(imagesCache).omit({
  id: true,
  createdAt: true,
});

// Cache table types
export type MovieCache = typeof moviesCache.$inferSelect;
export type InsertMovieCache = z.infer<typeof insertMovieCacheSchema>;

export type TvShowCache = typeof tvShowsCache.$inferSelect;
export type InsertTvShowCache = z.infer<typeof insertTvShowCacheSchema>;

export type PersonCache = typeof peopleCache.$inferSelect;
export type InsertPersonCache = z.infer<typeof insertPersonCacheSchema>;

export type MediaCredit = typeof mediaCredits.$inferSelect;
export type InsertMediaCredit = z.infer<typeof insertMediaCreditSchema>;

export type TmdbReviewCache = typeof tmdbReviewsCache.$inferSelect;
export type InsertTmdbReviewCache = z.infer<typeof insertTmdbReviewCacheSchema>;

export type ImageCache = typeof imagesCache.$inferSelect;
export type InsertImageCache = z.infer<typeof insertImageCacheSchema>;
