import { describe, it, expect, beforeEach } from 'vitest';
import { hashPassword, verifyPassword } from '../../server/auth';
import { 
  signAccessToken, 
  verifyAccessToken, 
  signRefreshToken, 
  verifyRefreshToken,
  hashRefreshToken,
  verifyRefreshTokenHash,
  generateSessionId,
  extractBearerToken
} from '../../server/jwt';

describe('Password Hashing', () => {
  it('should hash a password', async () => {
    const password = 'testPassword123';
    const hashed = await hashPassword(password);
    
    expect(hashed).toBeTruthy();
    expect(hashed).not.toBe(password);
    expect(hashed.length).toBeGreaterThan(0);
  });

  it('should verify correct password', async () => {
    const password = 'testPassword123';
    const hashed = await hashPassword(password);
    const isValid = await verifyPassword(password, hashed);
    
    expect(isValid).toBe(true);
  });

  it('should reject incorrect password', async () => {
    const password = 'testPassword123';
    const hashed = await hashPassword(password);
    const isValid = await verifyPassword('wrongPassword', hashed);
    
    expect(isValid).toBe(false);
  });

  it('should produce different hashes for the same password', async () => {
    const password = 'testPassword123';
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);
    
    expect(hash1).not.toBe(hash2); // bcrypt uses salt
  });
});

describe('JWT Access Token', () => {
  it('should sign and verify access token', () => {
    const payload = { id: 'user-123', isAdmin: false };
    const token = signAccessToken(payload);
    
    expect(token).toBeTruthy();
    
    const decoded = verifyAccessToken(token);
    expect(decoded.sub).toBe(payload.id);
    expect(decoded.isAdmin).toBe(payload.isAdmin);
  });

  it('should include admin flag in token', () => {
    const payload = { id: 'admin-123', isAdmin: true };
    const token = signAccessToken(payload);
    
    const decoded = verifyAccessToken(token);
    expect(decoded.isAdmin).toBe(true);
  });

  it('should throw on invalid token', () => {
    expect(() => verifyAccessToken('invalid-token')).toThrow();
  });

  it('should throw on expired token', () => {
    const payload = { id: 'user-123', isAdmin: false };
    
    // Mock Date to create expired token
    const originalNow = Date.now;
    Date.now = () => originalNow() - (2 * 60 * 60 * 1000); // 2 hours ago
    
    const token = signAccessToken(payload);
    
    Date.now = originalNow; // Restore
    
    expect(() => verifyAccessToken(token)).toThrow();
  });
});

describe('JWT Refresh Token', () => {
  it('should sign and verify refresh token', () => {
    const sessionId = 'session-123';
    const token = signRefreshToken(sessionId);
    
    expect(token).toBeTruthy();
    
    const decoded = verifyRefreshToken(token);
    expect(decoded.sessionId).toBe(sessionId);
  });

  it('should throw on invalid refresh token', () => {
    expect(() => verifyRefreshToken('invalid-token')).toThrow();
  });
});

describe('Refresh Token Hashing', () => {
  it('should hash refresh token', async () => {
    const token = 'refresh-token-123';
    const hashed = await hashRefreshToken(token);
    
    expect(hashed).toBeTruthy();
    expect(hashed).not.toBe(token);
  });

  it('should verify refresh token hash', async () => {
    const token = 'refresh-token-123';
    const hashed = await hashRefreshToken(token);
    const isValid = await verifyRefreshTokenHash(token, hashed);
    
    expect(isValid).toBe(true);
  });

  it('should reject incorrect refresh token', async () => {
    const token = 'refresh-token-123';
    const hashed = await hashRefreshToken(token);
    const isValid = await verifyRefreshTokenHash('wrong-token', hashed);
    
    expect(isValid).toBe(false);
  });
});

describe('Session ID Generation', () => {
  it('should generate unique session IDs', () => {
    const id1 = generateSessionId();
    const id2 = generateSessionId();
    
    expect(id1).toBeTruthy();
    expect(id2).toBeTruthy();
    expect(id1).not.toBe(id2);
  });

  it('should generate valid format session ID', () => {
    const id = generateSessionId();
    
    // Should be a non-empty string
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });
});

describe('Bearer Token Extraction', () => {
  it('should extract token from Bearer authorization header', () => {
    const token = 'test-token-123';
    const authHeader = `Bearer ${token}`;
    
    const extracted = extractBearerToken(authHeader);
    expect(extracted).toBe(token);
  });

  it('should return null for missing authorization header', () => {
    const extracted = extractBearerToken(undefined);
    expect(extracted).toBeNull();
  });

  it('should return null for invalid authorization format', () => {
    const extracted = extractBearerToken('InvalidFormat token');
    expect(extracted).toBeNull();
  });

  it('should return null for Bearer without token', () => {
    const extracted = extractBearerToken('Bearer ');
    expect(extracted).toBeNull();
  });

  it('should handle case-sensitive Bearer keyword', () => {
    const token = 'test-token-123';
    const extracted = extractBearerToken(`bearer ${token}`);
    expect(extracted).toBeNull(); // Should be case-sensitive
  });
});
