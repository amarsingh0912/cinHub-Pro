import { describe, it, expect } from 'vitest';
import { isUnauthorizedError } from '@/lib/authUtils';

describe('Auth Utilities', () => {
  describe('isUnauthorizedError', () => {
    it('should return true for 401 Unauthorized errors', () => {
      const error = new Error('401: Unauthorized');
      expect(isUnauthorizedError(error)).toBe(true);
    });

    it('should return true for 401 errors with "Unauthorized" in message', () => {
      const error = new Error('401: User Unauthorized');
      expect(isUnauthorizedError(error)).toBe(true);
    });

    it('should return false for 401 errors without "Unauthorized" keyword', () => {
      const error = new Error('401: User not authenticated');
      expect(isUnauthorizedError(error)).toBe(false);
    });

    it('should return false for other HTTP errors', () => {
      const error404 = new Error('404: Not Found');
      const error500 = new Error('500: Internal Server Error');
      
      expect(isUnauthorizedError(error404)).toBe(false);
      expect(isUnauthorizedError(error500)).toBe(false);
    });

    it('should return false for non-HTTP errors', () => {
      const error = new Error('Something went wrong');
      expect(isUnauthorizedError(error)).toBe(false);
    });

    it('should return false for empty error messages', () => {
      const error = new Error('');
      expect(isUnauthorizedError(error)).toBe(false);
    });

    it('should match the regex pattern exactly: /^401: .*Unauthorized/', () => {
      expect(isUnauthorizedError(new Error('401: Unauthorized'))).toBe(true);
      expect(isUnauthorizedError(new Error('401: Request Unauthorized'))).toBe(true);
      expect(isUnauthorizedError(new Error('401: Access Unauthorized by policy'))).toBe(true);
      expect(isUnauthorizedError(new Error('401: Not authenticated'))).toBe(false);
      expect(isUnauthorizedError(new Error('Unauthorized'))).toBe(false);
      expect(isUnauthorizedError(new Error('401unauthorized'))).toBe(false);
    });
  });
});
