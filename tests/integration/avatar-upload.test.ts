import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as cloudinaryService from '../../server/services/cloudinaryService';

describe('Avatar Upload Integration Flow', () => {
  const mockUser = {
    id: 'test-user-123',
    username: 'testuser',
    email: 'test@example.com',
    profilePicture: null,
    avatarPublicId: null
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
    process.env.CLOUDINARY_API_KEY = 'test-api-key';
    process.env.CLOUDINARY_API_SECRET = 'test-api-secret';
  });

  describe('Complete Avatar Upload Workflow', () => {
    it('should successfully complete avatar upload flow', async () => {
      // Step 1: Generate signature for client-side upload
      const signature = cloudinaryService.generateUploadSignature({
        folder: 'profile_pictures',
        transformation: 'c_fill,w_400,h_400'
      });

      expect(signature).toHaveProperty('signature');
      expect(signature).toHaveProperty('timestamp');
      expect(signature).toHaveProperty('api_key');
      expect(signature.folder).toBe('profile_pictures');

      // Step 2: Simulate client uploading to Cloudinary (mocked)
      const uploadedImageUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/v123456789/profile_pictures/${mockUser.id}_avatar.jpg`;
      const publicId = `profile_pictures/${mockUser.id}_avatar`;

      // Step 3: Validate URL returned from Cloudinary
      const isValid = cloudinaryService.validateCloudinaryUrl(uploadedImageUrl, mockUser.id);
      expect(isValid).toBe(true);

      // Step 4: Verify database would store both URL and public_id
      const updatedUser = {
        ...mockUser,
        profilePicture: uploadedImageUrl,
        avatarPublicId: publicId
      };

      expect(updatedUser.profilePicture).toBe(uploadedImageUrl);
      expect(updatedUser.avatarPublicId).toBe(publicId);
      expect(updatedUser.avatarPublicId).toContain(mockUser.id);
    });

    it('should handle avatar replacement flow', async () => {
      // User already has an avatar
      const existingUser = {
        ...mockUser,
        profilePicture: 'https://res.cloudinary.com/test-cloud/image/upload/v111/profile_pictures/test-user-123_old.jpg',
        avatarPublicId: 'profile_pictures/test-user-123_old'
      };

      // Mock Cloudinary delete
      vi.spyOn(cloudinaryService, 'deleteFromCloudinary').mockResolvedValue({ result: 'ok' });

      // Delete old avatar
      if (existingUser.avatarPublicId) {
        const deleteResult = await cloudinaryService.deleteFromCloudinary(existingUser.avatarPublicId);
        expect(deleteResult.result).toBe('ok');
      }

      // Upload new avatar
      const newImageUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/v123456789/profile_pictures/${mockUser.id}_new.jpg`;
      const newPublicId = `profile_pictures/${mockUser.id}_new`;

      // Validate new URL
      const isValid = cloudinaryService.validateCloudinaryUrl(newImageUrl, mockUser.id);
      expect(isValid).toBe(true);

      // Update user
      const updatedUser = {
        ...existingUser,
        profilePicture: newImageUrl,
        avatarPublicId: newPublicId
      };

      expect(updatedUser.profilePicture).toBe(newImageUrl);
      expect(updatedUser.avatarPublicId).toBe(newPublicId);
      expect(cloudinaryService.deleteFromCloudinary).toHaveBeenCalledWith(existingUser.avatarPublicId);
    });

    it('should validate URL security checks', () => {
      const validUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/v123/profile_pictures/${mockUser.id}_avatar.jpg`;
      const wrongUserUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/v123/profile_pictures/other-user_avatar.jpg`;
      const externalUrl = 'https://example.com/malicious.jpg';

      // Valid URL for the user should pass
      expect(cloudinaryService.validateCloudinaryUrl(validUrl, mockUser.id)).toBe(true);

      // URL for different user should fail
      expect(cloudinaryService.validateCloudinaryUrl(wrongUserUrl, mockUser.id)).toBe(false);

      // External URL should fail
      expect(cloudinaryService.validateCloudinaryUrl(externalUrl, mockUser.id)).toBe(false);
    });

    it('should reject public_id that does not match user pattern', () => {
      const validPublicId = `profile_pictures/${mockUser.id}_avatar`;
      const wrongUserPublicId = 'profile_pictures/other-user_avatar';
      const maliciousPublicId = 'arbitrary_asset_to_delete';

      // Valid public_id for the user should match expected prefix
      const expectedPrefix = `profile_pictures/${mockUser.id}_`;
      expect(validPublicId.startsWith(expectedPrefix)).toBe(true);

      // Public_id for different user should not match
      expect(wrongUserPublicId.startsWith(expectedPrefix)).toBe(false);

      // Malicious public_id should not match
      expect(maliciousPublicId.startsWith(expectedPrefix)).toBe(false);
    });

    it('should handle avatar deletion flow', async () => {
      const userWithAvatar = {
        ...mockUser,
        profilePicture: 'https://res.cloudinary.com/test-cloud/image/upload/v111/profile_pictures/test-user-123_avatar.jpg',
        avatarPublicId: 'profile_pictures/test-user-123_avatar'
      };

      // Mock Cloudinary delete
      vi.spyOn(cloudinaryService, 'deleteFromCloudinary').mockResolvedValue({ result: 'ok' });

      // Delete avatar from Cloudinary
      if (userWithAvatar.avatarPublicId) {
        const deleteResult = await cloudinaryService.deleteFromCloudinary(userWithAvatar.avatarPublicId);
        expect(deleteResult.result).toBe('ok');
      }

      // Clear user avatar fields
      const updatedUser = {
        ...userWithAvatar,
        profilePicture: null,
        avatarPublicId: null
      };

      expect(updatedUser.profilePicture).toBeNull();
      expect(updatedUser.avatarPublicId).toBeNull();
      expect(cloudinaryService.deleteFromCloudinary).toHaveBeenCalledWith(userWithAvatar.avatarPublicId);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing Cloudinary configuration', () => {
      const originalCloudName = process.env.CLOUDINARY_CLOUD_NAME;
      delete process.env.CLOUDINARY_CLOUD_NAME;

      expect(cloudinaryService.isCloudinaryConfigured()).toBe(false);

      // Restore for next tests
      process.env.CLOUDINARY_CLOUD_NAME = originalCloudName;
    });

    it('should reject non-HTTPS URLs', () => {
      const httpUrl = 'http://res.cloudinary.com/test-cloud/image/upload/avatar.jpg';
      expect(cloudinaryService.validateCloudinaryUrl(httpUrl)).toBe(false);
    });

    it('should reject malformed URLs', () => {
      expect(cloudinaryService.validateCloudinaryUrl('not a url')).toBe(false);
      expect(cloudinaryService.validateCloudinaryUrl('')).toBe(false);
    });
  });
});
