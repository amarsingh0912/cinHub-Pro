import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { createHash, randomBytes } from "crypto";

// JWT Configuration
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "30d";

// Get secrets from environment
function getJWTSecrets() {
  const accessSecret = process.env.JWT_ACCESS_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;
  
  if (!accessSecret || !refreshSecret) {
    throw new Error("JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be set in environment variables");
  }
  
  return { accessSecret, refreshSecret };
}

// JWT Token Types
export interface AccessTokenPayload {
  sub: string; // user ID
  isAdmin: boolean; // user role
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  sessionId: string;
  iat?: number;
  exp?: number;
}

// Access Token Operations
export function signAccessToken(user: { id: string; isAdmin: boolean }): string {
  const { accessSecret } = getJWTSecrets();
  
  const payload: AccessTokenPayload = {
    sub: user.id,
    isAdmin: user.isAdmin,
  };
  
  return jwt.sign(payload, accessSecret, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    algorithm: "HS256",
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const { accessSecret } = getJWTSecrets();
  
  try {
    return jwt.verify(token, accessSecret, { algorithms: ["HS256"] }) as AccessTokenPayload;
  } catch (error) {
    throw new Error("Invalid access token");
  }
}

// Refresh Token Operations
export function signRefreshToken(sessionId: string): string {
  const { refreshSecret } = getJWTSecrets();
  
  const payload: RefreshTokenPayload = {
    sessionId,
  };
  
  return jwt.sign(payload, refreshSecret, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
    algorithm: "HS256",
  });
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const { refreshSecret } = getJWTSecrets();
  
  try {
    return jwt.verify(token, refreshSecret, { algorithms: ["HS256"] }) as RefreshTokenPayload;
  } catch (error) {
    throw new Error("Invalid refresh token");
  }
}

// Hash refresh token for secure storage
export async function hashRefreshToken(token: string): Promise<string> {
  // Use SHA-256 for refresh token hashing (faster than bcrypt for tokens)
  return createHash('sha256').update(token).digest('hex');
}

// Verify refresh token against hash
export async function verifyRefreshTokenHash(token: string, hash: string): Promise<boolean> {
  const tokenHash = await hashRefreshToken(token);
  return tokenHash === hash;
}

// Generate secure session ID
export function generateSessionId(): string {
  return randomBytes(32).toString('hex');
}

// Token extraction utilities
export function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  return token.length > 0 ? token : null;
}