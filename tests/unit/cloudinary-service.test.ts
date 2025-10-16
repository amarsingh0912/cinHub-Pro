import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Cloudinary
const mockCloudinary = {
  config: vi.fn(),
  uploader: {
    upload: vi.fn(),
    destroy: vi.fn(),
    upload_stream: vi.fn(),
  },
  api: {
    resources: vi.fn(),
    resource: vi.fn(),
    delete_resources: vi.fn(),
  },
};

vi.mock('cloudinary', () => ({
  v2: mockCloudinary,
}));

describe('Cloudinary Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Configuration', () => {
    it('should configure Cloudinary with environment variables', async () => {
      process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
      process.env.CLOUDINARY_API_KEY = 'test-key';
      process.env.CLOUDINARY_API_SECRET = 'test-secret';

      const { cloudinaryService } = await import('../../server/services/cloudinaryService');
      
      await cloudinaryService.init();

      expect(mockCloudinary.config).toHaveBeenCalledWith({
        cloud_name: 'test-cloud',
        api_key: 'test-key',
        api_secret: 'test-secret',
        secure: true,
      });
    });

    it('should throw error if credentials are missing', async () => {
      delete process.env.CLOUDINARY_CLOUD_NAME;

      const { cloudinaryService } = await import('../../server/services/cloudinaryService');

      expect(() => cloudinaryService.init()).toThrow(/cloudinary.*credentials/i);
    });
  });

  describe('Image Upload', () => {
    it('should upload image from URL', async () => {
      const uploadResult = {
        secure_url: 'https://res.cloudinary.com/test/image/upload/v123/test.jpg',
        public_id: 'folder/test',
        format: 'jpg',
        width: 800,
        height: 600,
        bytes: 50000,
      };

      mockCloudinary.uploader.upload.mockResolvedValue(uploadResult);

      const { cloudinaryService } = await import('../../server/services/cloudinaryService');
      
      const result = await cloudinaryService.uploadFromUrl(
        'https://example.com/image.jpg',
        { folder: 'folder' }
      );

      expect(result).toEqual(uploadResult);
      expect(mockCloudinary.uploader.upload).toHaveBeenCalledWith(
        'https://example.com/image.jpg',
        expect.objectContaining({ folder: 'folder' })
      );
    });

    it('should upload image from buffer', async () => {
      const buffer = Buffer.from('fake image data');
      const uploadResult = {
        secure_url: 'https://res.cloudinary.com/test/avatar.jpg',
        public_id: 'avatars/user123',
      };

      mockCloudinary.uploader.upload_stream.mockImplementation((options, callback) => {
        callback(null, uploadResult);
        return { end: vi.fn() };
      });

      const { cloudinaryService } = await import('../../server/services/cloudinaryService');
      
      const result = await cloudinaryService.uploadFromBuffer(buffer, {
        folder: 'avatars',
        public_id: 'user123',
      });

      expect(result).toEqual(uploadResult);
    });

    it('should apply transformations during upload', async () => {
      mockCloudinary.uploader.upload.mockResolvedValue({
        secure_url: 'https://cloudinary.com/transformed.jpg',
        public_id: 'test',
      });

      const { cloudinaryService } = await import('../../server/services/cloudinaryService');
      
      await cloudinaryService.uploadFromUrl('https://example.com/image.jpg', {
        folder: 'posters',
        transformation: [
          { width: 500, crop: 'fill' },
          { quality: 'auto' },
        ],
      });

      expect(mockCloudinary.uploader.upload).toHaveBeenCalledWith(
        'https://example.com/image.jpg',
        expect.objectContaining({
          transformation: expect.arrayContaining([
            expect.objectContaining({ width: 500 }),
            expect.objectContaining({ quality: 'auto' }),
          ]),
        })
      );
    });

    it('should handle upload errors', async () => {
      mockCloudinary.uploader.upload.mockRejectedValue(new Error('Upload failed'));

      const { cloudinaryService } = await import('../../server/services/cloudinaryService');

      await expect(
        cloudinaryService.uploadFromUrl('https://example.com/image.jpg')
      ).rejects.toThrow('Upload failed');
    });
  });

  describe('Image Deletion', () => {
    it('should delete image by public_id', async () => {
      mockCloudinary.uploader.destroy.mockResolvedValue({ result: 'ok' });

      const { cloudinaryService } = await import('../../server/services/cloudinaryService');
      
      const result = await cloudinaryService.deleteImage('folder/test');

      expect(result).toEqual({ result: 'ok' });
      expect(mockCloudinary.uploader.destroy).toHaveBeenCalledWith('folder/test');
    });

    it('should handle deletion errors', async () => {
      mockCloudinary.uploader.destroy.mockRejectedValue(new Error('Not found'));

      const { cloudinaryService } = await import('../../server/services/cloudinaryService');

      await expect(cloudinaryService.deleteImage('nonexistent')).rejects.toThrow('Not found');
    });

    it('should delete multiple images', async () => {
      mockCloudinary.api.delete_resources.mockResolvedValue({
        deleted: { 'img1': 'deleted', 'img2': 'deleted' },
      });

      const { cloudinaryService } = await import('../../server/services/cloudinaryService');
      
      const result = await cloudinaryService.deleteImages(['img1', 'img2']);

      expect(mockCloudinary.api.delete_resources).toHaveBeenCalledWith(['img1', 'img2']);
      expect(result.deleted).toHaveProperty('img1');
    });
  });

  describe('Image Transformations', () => {
    it('should generate poster transformation', () => {
      const { cloudinaryService } = await import('../../server/services/cloudinaryService');
      
      const transformation = cloudinaryService.getPosterTransformation();

      expect(transformation).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ width: 500, crop: 'limit' }),
          expect.objectContaining({ quality: 'auto' }),
          expect.objectContaining({ fetch_format: 'auto' }),
        ])
      );
    });

    it('should generate backdrop transformation', () => {
      const { cloudinaryService } = await import('../../server/services/cloudinaryService');
      
      const transformation = cloudinaryService.getBackdropTransformation();

      expect(transformation).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ width: 1280, crop: 'limit' }),
          expect.objectContaining({ quality: 'auto' }),
        ])
      );
    });

    it('should generate avatar transformation', () => {
      const { cloudinaryService } = await import('../../server/services/cloudinaryService');
      
      const transformation = cloudinaryService.getAvatarTransformation();

      expect(transformation).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ width: 200, height: 200, crop: 'fill', gravity: 'face' }),
          expect.objectContaining({ quality: 'auto' }),
        ])
      );
    });

    it('should generate thumbnail transformation', () => {
      const { cloudinaryService } = await import('../../server/services/cloudinaryService');
      
      const transformation = cloudinaryService.getThumbnailTransformation(150);

      expect(transformation).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ width: 150, height: 150, crop: 'fill' }),
        ])
      );
    });
  });

  describe('Image URLs', () => {
    it('should generate optimized URL for existing image', () => {
      const { cloudinaryService } = await import('../../server/services/cloudinaryService');
      
      const url = cloudinaryService.getOptimizedUrl('folder/test', {
        width: 400,
        quality: 'auto',
      });

      expect(url).toContain('res.cloudinary.com');
      expect(url).toContain('w_400');
      expect(url).toContain('q_auto');
      expect(url).toContain('folder/test');
    });

    it('should generate responsive URLs', () => {
      const { cloudinaryService } = await import('../../server/services/cloudinaryService');
      
      const urls = cloudinaryService.getResponsiveUrls('folder/test', [400, 800, 1200]);

      expect(urls).toHaveLength(3);
      expect(urls[0]).toContain('w_400');
      expect(urls[1]).toContain('w_800');
      expect(urls[2]).toContain('w_1200');
    });
  });

  describe('Resource Management', () => {
    it('should list resources in folder', async () => {
      mockCloudinary.api.resources.mockResolvedValue({
        resources: [
          { public_id: 'folder/img1', format: 'jpg', bytes: 10000 },
          { public_id: 'folder/img2', format: 'png', bytes: 20000 },
        ],
      });

      const { cloudinaryService } = await import('../../server/services/cloudinaryService');
      
      const result = await cloudinaryService.listResources('folder');

      expect(result.resources).toHaveLength(2);
      expect(mockCloudinary.api.resources).toHaveBeenCalledWith({
        type: 'upload',
        prefix: 'folder',
        max_results: 100,
      });
    });

    it('should get resource details', async () => {
      mockCloudinary.api.resource.mockResolvedValue({
        public_id: 'folder/test',
        format: 'jpg',
        width: 800,
        height: 600,
        bytes: 50000,
        created_at: '2024-01-15T10:00:00Z',
      });

      const { cloudinaryService } = await import('../../server/services/cloudinaryService');
      
      const result = await cloudinaryService.getResourceDetails('folder/test');

      expect(result).toHaveProperty('width', 800);
      expect(result).toHaveProperty('format', 'jpg');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors during upload', async () => {
      mockCloudinary.uploader.upload.mockRejectedValue(new Error('Network error'));

      const { cloudinaryService } = await import('../../server/services/cloudinaryService');

      await expect(
        cloudinaryService.uploadFromUrl('https://example.com/image.jpg')
      ).rejects.toThrow('Network error');
    });

    it('should handle invalid image format', async () => {
      mockCloudinary.uploader.upload.mockRejectedValue(new Error('Invalid image format'));

      const { cloudinaryService } = await import('../../server/services/cloudinaryService');

      await expect(
        cloudinaryService.uploadFromUrl('https://example.com/invalid.txt')
      ).rejects.toThrow('Invalid image format');
    });

    it('should handle quota exceeded errors', async () => {
      mockCloudinary.uploader.upload.mockRejectedValue(new Error('Storage limit exceeded'));

      const { cloudinaryService } = await import('../../server/services/cloudinaryService');

      await expect(
        cloudinaryService.uploadFromUrl('https://example.com/image.jpg')
      ).rejects.toThrow('Storage limit exceeded');
    });
  });
});
