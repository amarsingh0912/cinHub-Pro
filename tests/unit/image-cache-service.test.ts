import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
const mockStorage = {
  getImageCache: vi.fn(),
  saveImageCache: vi.fn(),
};

const mockCloudinary = {
  uploader: {
    upload: vi.fn(),
    destroy: vi.fn(),
  },
};

const mockCacheQueue = {
  add: vi.fn(),
  process: vi.fn(),
};

vi.mock('../../server/storage', () => ({
  storage: mockStorage,
}));

vi.mock('cloudinary', () => ({
  v2: mockCloudinary,
}));

vi.mock('../../server/services/cacheQueue', () => ({
  cacheQueue: mockCacheQueue,
}));

describe('Image Cache Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Image URL Retrieval', () => {
    it('should return Cloudinary URL when image is cached', async () => {
      const cachedImage = {
        id: '1',
        type: 'poster',
        mediaId: 550,
        originalUrl: 'https://image.tmdb.org/t/p/original/poster.jpg',
        cloudinaryUrl: 'https://res.cloudinary.com/cinehub/image/upload/poster_123.jpg',
        publicId: 'poster_123',
        createdAt: new Date(),
      };

      mockStorage.getImageCache.mockResolvedValue([cachedImage]);

      const { imageCacheService } = await import('../../server/services/imageCache');
      
      const result = await imageCacheService.getImageUrl('poster', 550);

      expect(result).toBe(cachedImage.cloudinaryUrl);
      expect(mockStorage.getImageCache).toHaveBeenCalledWith({
        type: 'poster',
        mediaId: 550,
      });
    });

    it('should return original TMDB URL when not cached', async () => {
      mockStorage.getImageCache.mockResolvedValue([]);

      const { imageCacheService } = await import('../../server/services/imageCache');
      
      const originalUrl = 'https://image.tmdb.org/t/p/original/poster.jpg';
      const result = await imageCacheService.getImageUrl('poster', 550, originalUrl);

      expect(result).toBe(originalUrl);
    });

    it('should queue caching job for uncached images', async () => {
      mockStorage.getImageCache.mockResolvedValue([]);

      const { imageCacheService } = await import('../../server/services/imageCache');
      
      const originalUrl = 'https://image.tmdb.org/t/p/original/poster.jpg';
      await imageCacheService.getImageUrl('poster', 550, originalUrl);

      expect(mockCacheQueue.add).toHaveBeenCalledWith({
        type: 'poster',
        mediaId: 550,
        originalUrl,
      });
    });
  });

  describe('Image Upload to Cloudinary', () => {
    it('should upload image to Cloudinary successfully', async () => {
      const uploadResult = {
        secure_url: 'https://res.cloudinary.com/cinehub/image/upload/v123/poster_abc.jpg',
        public_id: 'poster_abc',
        format: 'jpg',
        width: 500,
        height: 750,
      };

      mockCloudinary.uploader.upload.mockResolvedValue(uploadResult);
      mockStorage.saveImageCache.mockResolvedValue({ id: '1' });

      const { imageCacheService } = await import('../../server/services/imageCache');
      
      const result = await imageCacheService.uploadToCloudinary(
        'https://image.tmdb.org/t/p/original/poster.jpg',
        'poster',
        550
      );

      expect(result).toBe(uploadResult.secure_url);
      expect(mockCloudinary.uploader.upload).toHaveBeenCalledWith(
        'https://image.tmdb.org/t/p/original/poster.jpg',
        expect.objectContaining({
          folder: 'cinehub/posters',
          transformation: expect.any(Array),
        })
      );
      expect(mockStorage.saveImageCache).toHaveBeenCalledWith({
        type: 'poster',
        mediaId: 550,
        originalUrl: 'https://image.tmdb.org/t/p/original/poster.jpg',
        cloudinaryUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id,
      });
    });

    it('should apply correct transformations for posters', async () => {
      mockCloudinary.uploader.upload.mockResolvedValue({
        secure_url: 'https://cloudinary.com/image.jpg',
        public_id: 'test',
      });
      mockStorage.saveImageCache.mockResolvedValue({ id: '1' });

      const { imageCacheService } = await import('../../server/services/imageCache');
      
      await imageCacheService.uploadToCloudinary(
        'https://image.tmdb.org/poster.jpg',
        'poster',
        550
      );

      const uploadCall = mockCloudinary.uploader.upload.mock.calls[0][1];
      expect(uploadCall.transformation).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ width: 500, crop: 'limit' }),
          expect.objectContaining({ quality: 'auto' }),
          expect.objectContaining({ fetch_format: 'auto' }),
        ])
      );
    });

    it('should apply correct transformations for backdrops', async () => {
      mockCloudinary.uploader.upload.mockResolvedValue({
        secure_url: 'https://cloudinary.com/image.jpg',
        public_id: 'test',
      });
      mockStorage.saveImageCache.mockResolvedValue({ id: '1' });

      const { imageCacheService } = await import('../../server/services/imageCache');
      
      await imageCacheService.uploadToCloudinary(
        'https://image.tmdb.org/backdrop.jpg',
        'backdrop',
        550
      );

      const uploadCall = mockCloudinary.uploader.upload.mock.calls[0][1];
      expect(uploadCall.transformation).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ width: 1280, crop: 'limit' }),
        ])
      );
    });

    it('should handle upload errors gracefully', async () => {
      mockCloudinary.uploader.upload.mockRejectedValue(new Error('Upload failed'));

      const { imageCacheService } = await import('../../server/services/imageCache');
      
      await expect(
        imageCacheService.uploadToCloudinary('https://image.tmdb.org/poster.jpg', 'poster', 550)
      ).rejects.toThrow('Upload failed');

      expect(mockStorage.saveImageCache).not.toHaveBeenCalled();
    });
  });

  describe('Batch Image Processing', () => {
    it('should queue multiple images for processing', async () => {
      const movies = [
        {
          id: 550,
          poster_path: '/poster1.jpg',
          backdrop_path: '/backdrop1.jpg',
        },
        {
          id: 551,
          poster_path: '/poster2.jpg',
          backdrop_path: '/backdrop2.jpg',
        },
      ];

      const { imageCacheService } = await import('../../server/services/imageCache');
      
      await imageCacheService.queueBatchImages(movies, 'movie');

      expect(mockCacheQueue.add).toHaveBeenCalledTimes(4); // 2 posters + 2 backdrops
      expect(mockCacheQueue.add).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'poster',
          mediaId: 550,
        })
      );
    });

    it('should skip null or undefined image paths', async () => {
      const movies = [
        {
          id: 550,
          poster_path: '/poster1.jpg',
          backdrop_path: null,
        },
        {
          id: 551,
          poster_path: null,
          backdrop_path: null,
        },
      ];

      const { imageCacheService } = await import('../../server/services/imageCache');
      
      await imageCacheService.queueBatchImages(movies, 'movie');

      expect(mockCacheQueue.add).toHaveBeenCalledTimes(1); // Only 1 valid poster
    });
  });

  describe('Cache Management', () => {
    it('should delete image from Cloudinary and database', async () => {
      const cachedImage = {
        id: '1',
        publicId: 'poster_123',
        cloudinaryUrl: 'https://cloudinary.com/poster_123.jpg',
      };

      mockStorage.getImageCache.mockResolvedValue([cachedImage]);
      mockCloudinary.uploader.destroy.mockResolvedValue({ result: 'ok' });

      const { imageCacheService } = await import('../../server/services/imageCache');
      
      await imageCacheService.deleteImage('poster', 550);

      expect(mockCloudinary.uploader.destroy).toHaveBeenCalledWith('poster_123');
    });

    it('should handle deletion errors', async () => {
      const cachedImage = {
        id: '1',
        publicId: 'poster_123',
      };

      mockStorage.getImageCache.mockResolvedValue([cachedImage]);
      mockCloudinary.uploader.destroy.mockRejectedValue(new Error('Deletion failed'));

      const { imageCacheService } = await import('../../server/services/imageCache');
      
      await expect(imageCacheService.deleteImage('poster', 550)).rejects.toThrow('Deletion failed');
    });
  });

  describe('Image Types', () => {
    it('should handle poster images', async () => {
      mockStorage.getImageCache.mockResolvedValue([]);
      
      const { imageCacheService } = await import('../../server/services/imageCache');
      
      await imageCacheService.getImageUrl('poster', 550, 'https://tmdb.org/poster.jpg');

      expect(mockCacheQueue.add).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'poster' })
      );
    });

    it('should handle backdrop images', async () => {
      mockStorage.getImageCache.mockResolvedValue([]);
      
      const { imageCacheService } = await import('../../server/services/imageCache');
      
      await imageCacheService.getImageUrl('backdrop', 550, 'https://tmdb.org/backdrop.jpg');

      expect(mockCacheQueue.add).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'backdrop' })
      );
    });

    it('should handle profile images', async () => {
      mockStorage.getImageCache.mockResolvedValue([]);
      
      const { imageCacheService } = await import('../../server/services/imageCache');
      
      await imageCacheService.getImageUrl('profile', 123, 'https://tmdb.org/profile.jpg');

      expect(mockCacheQueue.add).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'profile' })
      );
    });
  });

  describe('Queue Status', () => {
    it('should return cache status for media', async () => {
      mockStorage.getImageCache.mockResolvedValue([
        { id: '1', type: 'poster', mediaId: 550, cloudinaryUrl: 'url1' },
        { id: '2', type: 'backdrop', mediaId: 550, cloudinaryUrl: 'url2' },
      ]);

      const { imageCacheService } = await import('../../server/services/imageCache');
      
      const status = await imageCacheService.getCacheStatus('movie', 550);

      expect(status).toEqual({
        poster: 'completed',
        backdrop: 'completed',
      });
    });

    it('should return pending status for uncached images', async () => {
      mockStorage.getImageCache.mockResolvedValue([]);

      const { imageCacheService } = await import('../../server/services/imageCache');
      
      const status = await imageCacheService.getCacheStatus('movie', 550);

      expect(status).toEqual({
        poster: 'pending',
        backdrop: 'pending',
      });
    });
  });
});
