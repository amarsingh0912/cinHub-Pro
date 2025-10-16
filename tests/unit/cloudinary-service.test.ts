import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  generateUploadSignature, 
  validateCloudinaryUrl, 
  isCloudinaryConfigured 
} from '../../server/services/cloudinaryService';

describe('CloudinaryService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      CLOUDINARY_CLOUD_NAME: 'test-cloud',
      CLOUDINARY_API_KEY: 'test-api-key',
      CLOUDINARY_API_SECRET: 'test-api-secret'
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('isCloudinaryConfigured', () => {
    it('returns true when all env variables are set', () => {
      expect(isCloudinaryConfigured()).toBe(true);
    });

    it('returns false when cloud name is missing', () => {
      delete process.env.CLOUDINARY_CLOUD_NAME;
      expect(isCloudinaryConfigured()).toBe(false);
    });

    it('returns false when API key is missing', () => {
      delete process.env.CLOUDINARY_API_KEY;
      expect(isCloudinaryConfigured()).toBe(false);
    });

    it('returns false when API secret is missing', () => {
      delete process.env.CLOUDINARY_API_SECRET;
      expect(isCloudinaryConfigured()).toBe(false);
    });
  });

  describe('generateUploadSignature', () => {
    it('generates signature with default parameters', () => {
      const result = generateUploadSignature();
      
      expect(result).toHaveProperty('signature');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('api_key', 'test-api-key');
      expect(result).toHaveProperty('cloud_name', 'test-cloud');
      expect(result).toHaveProperty('folder', 'profile_pictures');
    });

    it('uses custom folder when provided', () => {
      const result = generateUploadSignature({ folder: 'custom_folder' });
      expect(result.folder).toBe('custom_folder');
    });

    it('throws error when API secret is missing', () => {
      delete process.env.CLOUDINARY_API_SECRET;
      expect(() => generateUploadSignature()).toThrow('Cloudinary not configured');
    });

    it('includes custom transformation parameter', () => {
      const result = generateUploadSignature({ transformation: 'w_200,h_200' });
      expect(result.transformation).toBe('w_200,h_200');
    });

    it('removes undefined parameters', () => {
      const result = generateUploadSignature({ upload_preset: undefined });
      expect(result).not.toHaveProperty('upload_preset');
    });
  });

  describe('validateCloudinaryUrl', () => {
    const validUrl = 'https://res.cloudinary.com/test-cloud/image/upload/v1234567890/profile_pictures/user123_avatar.jpg';

    it('validates correct Cloudinary URL', () => {
      expect(validateCloudinaryUrl(validUrl)).toBe(true);
    });

    it('rejects non-HTTPS URLs', () => {
      const httpUrl = 'http://res.cloudinary.com/test-cloud/image/upload/test.jpg';
      expect(validateCloudinaryUrl(httpUrl)).toBe(false);
    });

    it('rejects URLs from different cloud', () => {
      const wrongCloudUrl = 'https://res.cloudinary.com/other-cloud/image/upload/test.jpg';
      expect(validateCloudinaryUrl(wrongCloudUrl)).toBe(false);
    });

    it('rejects non-Cloudinary URLs', () => {
      const externalUrl = 'https://example.com/image.jpg';
      expect(validateCloudinaryUrl(externalUrl)).toBe(false);
    });

    it('validates URL with user ID verification', () => {
      const userUrl = 'https://res.cloudinary.com/test-cloud/image/upload/v1234567890/profile_pictures/user123_avatar.jpg';
      expect(validateCloudinaryUrl(userUrl, 'user123')).toBe(true);
    });

    it('rejects URL with wrong user ID', () => {
      const userUrl = 'https://res.cloudinary.com/test-cloud/image/upload/v1234567890/profile_pictures/user456_avatar.jpg';
      expect(validateCloudinaryUrl(userUrl, 'user123')).toBe(false);
    });

    it('returns false when cloud name not configured', () => {
      delete process.env.CLOUDINARY_CLOUD_NAME;
      expect(validateCloudinaryUrl(validUrl)).toBe(false);
    });

    it('handles malformed URLs gracefully', () => {
      expect(validateCloudinaryUrl('not a url')).toBe(false);
    });

    it('validates URL with transformations and version', () => {
      const transformedUrl = 'https://res.cloudinary.com/test-cloud/image/upload/c_fill,w_400,h_400/v1234567890/profile_pictures/user123_photo.jpg';
      expect(validateCloudinaryUrl(transformedUrl, 'user123')).toBe(true);
    });
  });
});
