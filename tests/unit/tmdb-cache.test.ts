import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TMDBCacheService } from '../../server/services/tmdbCache';

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
        onConflictDoUpdate: vi.fn(() => Promise.resolve()),
        onConflictDoNothing: vi.fn(() => Promise.resolve()),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => Promise.resolve()),
    })),
  },
}));

// Mock image cache service
vi.mock('../../server/services/imageCache', () => ({
  imageCacheService: {
    getCachedImageUrl: vi.fn(() => Promise.resolve('https://cloudinary.com/test.jpg')),
  },
}));

describe('TMDBCacheService', () => {
  let service: TMDBCacheService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TMDBCacheService();
  });

  describe('getMovieFromCache', () => {
    it('should return null when movie is not cached', async () => {
      const result = await service.getMovieFromCache(123);
      expect(result).toBeNull();
    });

    it('should return null when cache is expired', async () => {
      const mockDb = await import('../../server/db');
      const expiredMovie = {
        id: 123,
        title: 'Test Movie',
        lastUpdated: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
      };

      vi.mocked(mockDb.db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([expiredMovie])),
          })),
        })),
      } as any);

      const result = await service.getMovieFromCache(123);
      expect(result).toBeNull();
    });
  });

  describe('cacheMovie', () => {
    it('should cache movie data with Cloudinary URLs', async () => {
      const tmdbData = {
        id: 550,
        title: 'Fight Club',
        overview: 'A ticking-time-bomb insomniac...',
        release_date: '1999-10-15',
        vote_average: 8.4,
        poster_path: '/poster.jpg',
        backdrop_path: '/backdrop.jpg',
      };

      await service.cacheMovie(tmdbData);

      const mockDb = await import('../../server/db');
      expect(mockDb.db.insert).toHaveBeenCalled();
    });

    it('should handle movies without images', async () => {
      const tmdbData = {
        id: 551,
        title: 'Test Movie',
        overview: 'Test overview',
      };

      await service.cacheMovie(tmdbData);

      const mockDb = await import('../../server/db');
      expect(mockDb.db.insert).toHaveBeenCalled();
    });
  });

  describe('buildMovieResponse', () => {
    it('should build response with Cloudinary URLs', () => {
      const cachedMovie = {
        id: 550,
        title: 'Fight Club',
        voteAverage: 84,
        popularity: 5000,
        posterUrl: 'https://cloudinary.com/poster.jpg',
        backdropUrl: 'https://cloudinary.com/backdrop.jpg',
        tmdbData: {
          id: 550,
          title: 'Fight Club',
          vote_average: 8.4,
        },
      } as any;

      const response = service.buildMovieResponse(cachedMovie);

      expect(response.poster_path).toBe('https://cloudinary.com/poster.jpg');
      expect(response.backdrop_path).toBe('https://cloudinary.com/backdrop.jpg');
      expect(response.vote_average).toBe(8.4);
    });
  });
});
