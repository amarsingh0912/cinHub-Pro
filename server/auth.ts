import bcrypt from "bcrypt";
import type { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { signInSchema, signUpSchema, type SignInData, type SignUpData } from "@shared/schema";

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
}

export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};

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
  let user = null;

  // Find user by login type
  switch (credentials.loginType) {
    case "email":
      user = await storage.getUserByEmail(credentials.loginValue);
      break;
    case "username":
      user = await storage.getUserByUsername(credentials.loginValue);
      break;
    case "phone":
      user = await storage.getUserByPhoneNumber(credentials.loginValue);
      break;
  }

  if (!user) {
    throw new Error("Invalid credentials");
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

// Extend session type to include userId
declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}