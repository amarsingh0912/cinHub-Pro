import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ImageCacheService } from '../../server/services/imageCache';

// Mock Cloudinary
vi.mock('cloudinary', () => ({
  v2: {
    uploader: {
      upload: vi.fn(),
      destroy: vi.fn(),
    },
  },
}));

// Mock the database
vi.mock('../../server/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([])),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        onConflictDoNothing: vi.fn(() => Promise.resolve()),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => Promise.resolve()),
    })),
  },
}));

describe('ImageCacheService', () => {
  let service: ImageCacheService;
  let mockUpload: any;
  let mockDestroy: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const cloudinary = await import('cloudinary');
    mockUpload = vi.mocked(cloudinary.v2.uploader.upload);
    mockDestroy = vi.mocked(cloudinary.v2.uploader.destroy);
    service = new ImageCacheService();
  });

  describe('getCachedImageUrl', () => {
    it('should return null for invalid paths', async () => {
      const result = await service.getCachedImageUrl('invalid', 'poster');
      expect(result).toBeNull();
    });

    it('should return cached URL when image exists', async () => {
      const mockDb = await import('../../server/db');
      const cachedImage = {
        tmdbPath: '/abc123.jpg',
        cloudinaryUrl: 'https://cloudinary.com/cached.jpg',
      };

      vi.mocked(mockDb.db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([cachedImage])),
          })),
        })),
      } as any);

      const result = await service.getCachedImageUrl('/abc123.jpg', 'poster');
      expect(result).toBe('https://cloudinary.com/cached.jpg');
    });

    it('should process and cache new image', async () => {
      mockUpload.mockResolvedValue({
        secure_url: 'https://cloudinary.com/new.jpg',
        public_id: 'cinehub/posters/test',
        width: 500,
        height: 750,
        bytes: 50000,
        format: 'jpg',
      });

      const result = await service.getCachedImageUrl('/new.jpg', 'poster');
      
      expect(mockUpload).toHaveBeenCalled();
      expect(result).toBe('https://cloudinary.com/new.jpg');
    });
  });

  describe('processBatchImages', () => {
    it('should process multiple images in batches', async () => {
      mockUpload.mockResolvedValue({
        secure_url: 'https://cloudinary.com/batch.jpg',
        public_id: 'test',
        width: 500,
        height: 750,
        bytes: 50000,
        format: 'jpg',
      });

      const images = [
        { tmdbPath: '/img1.jpg', imageType: 'poster' as const },
        { tmdbPath: '/img2.jpg', imageType: 'backdrop' as const },
      ];

      const results = await service.processBatchImages(images);

      expect(Object.keys(results)).toHaveLength(2);
      expect(results['/img1.jpg']).toBeTruthy();
      expect(results['/img2.jpg']).toBeTruthy();
    });
  });

  describe('error handling', () => {
    it('should return TMDB URL on Cloudinary error', async () => {
      mockUpload.mockRejectedValue(new Error('Cloudinary error'));

      const result = await service.getCachedImageUrl('/fallback.jpg', 'poster');
      
      expect(result).toContain('image.tmdb.org');
      expect(result).toContain('/fallback.jpg');
    });
  });
});
