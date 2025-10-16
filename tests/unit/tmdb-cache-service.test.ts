import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the database and storage
const mockStorage = {
  getTMDBCache: vi.fn(),
  saveTMDBCache: vi.fn(),
  deleteTMDBCache: vi.fn(),
};

// Mock TMDB API
const mockTMDBApi = {
  getTrending: vi.fn(),
  getPopular: vi.fn(),
  getMovieDetails: vi.fn(),
  searchMovies: vi.fn(),
};

vi.mock('../../server/storage', () => ({
  storage: mockStorage,
}));

vi.mock('../../server/utils/tmdbApi', () => ({
  tmdbApi: mockTMDBApi,
}));

describe('TMDB Cache Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Cache Hit Scenarios', () => {
    it('should return cached data when available and not expired', async () => {
      const now = new Date('2024-01-15T10:00:00Z');
      vi.setSystemTime(now);

      const cachedData = {
        id: '1',
        type: 'movie',
        category: 'trending',
        tmdbId: null,
        page: 1,
        data: {
          results: [
            { id: 550, title: 'Fight Club' },
            { id: 551, title: 'The Matrix' },
          ],
          page: 1,
          total_pages: 100,
        },
        expiresAt: new Date('2024-01-15T12:00:00Z'), // 2 hours in future
        createdAt: new Date('2024-01-15T09:00:00Z'),
      };

      mockStorage.getTMDBCache.mockResolvedValue([cachedData]);

      // Import after mocks are set up
      const { tmdbCacheService } = await import('../../server/services/tmdbCache');
      
      const result = await tmdbCacheService.getTrending('movie', 1);

      expect(result).toEqual(cachedData.data);
      expect(mockStorage.getTMDBCache).toHaveBeenCalledWith({
        type: 'movie',
        category: 'trending',
        page: 1,
      });
      expect(mockTMDBApi.getTrending).not.toHaveBeenCalled();
    });

    it('should return cached movie details when available', async () => {
      const now = new Date('2024-01-15T10:00:00Z');
      vi.setSystemTime(now);

      const cachedMovie = {
        id: '2',
        type: 'movie',
        category: 'detail',
        tmdbId: 550,
        page: null,
        data: {
          id: 550,
          title: 'Fight Club',
          overview: 'A ticking-time-bomb insomniac...',
          vote_average: 8.4,
        },
        expiresAt: new Date('2024-01-16T10:00:00Z'), // 24 hours
        createdAt: new Date('2024-01-15T10:00:00Z'),
      };

      mockStorage.getTMDBCache.mockResolvedValue([cachedMovie]);

      const { tmdbCacheService } = await import('../../server/services/tmdbCache');
      
      const result = await tmdbCacheService.getMovieDetails(550);

      expect(result).toEqual(cachedMovie.data);
      expect(mockStorage.getTMDBCache).toHaveBeenCalledWith({
        type: 'movie',
        category: 'detail',
        tmdbId: 550,
      });
    });
  });

  describe('Cache Miss Scenarios', () => {
    it('should fetch from TMDB when cache is empty', async () => {
      mockStorage.getTMDBCache.mockResolvedValue([]);

      const tmdbData = {
        results: [{ id: 550, title: 'Fight Club' }],
        page: 1,
        total_pages: 100,
      };

      mockTMDBApi.getTrending.mockResolvedValue(tmdbData);
      mockStorage.saveTMDBCache.mockResolvedValue({ id: '1' });

      const { tmdbCacheService } = await import('../../server/services/tmdbCache');
      
      const result = await tmdbCacheService.getTrending('movie', 1);

      expect(result).toEqual(tmdbData);
      expect(mockTMDBApi.getTrending).toHaveBeenCalledWith('movie', 1);
      expect(mockStorage.saveTMDBCache).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'movie',
          category: 'trending',
          page: 1,
          data: tmdbData,
        })
      );
    });

    it('should fetch from TMDB when cache is expired', async () => {
      const now = new Date('2024-01-15T10:00:00Z');
      vi.setSystemTime(now);

      const expiredCache = {
        id: '1',
        type: 'movie',
        category: 'trending',
        page: 1,
        data: { results: [{ id: 550, title: 'Old Data' }] },
        expiresAt: new Date('2024-01-15T09:00:00Z'), // Expired 1 hour ago
        createdAt: new Date('2024-01-14T10:00:00Z'),
      };

      mockStorage.getTMDBCache.mockResolvedValue([expiredCache]);

      const freshData = {
        results: [{ id: 551, title: 'Fresh Data' }],
        page: 1,
      };

      mockTMDBApi.getTrending.mockResolvedValue(freshData);
      mockStorage.saveTMDBCache.mockResolvedValue({ id: '2' });

      const { tmdbCacheService } = await import('../../server/services/tmdbCache');
      
      const result = await tmdbCacheService.getTrending('movie', 1);

      expect(result).toEqual(freshData);
      expect(mockTMDBApi.getTrending).toHaveBeenCalled();
      expect(mockStorage.saveTMDBCache).toHaveBeenCalled();
    });
  });

  describe('Cache Expiration', () => {
    it('should set correct expiration for movie lists (1 hour)', async () => {
      const now = new Date('2024-01-15T10:00:00Z');
      vi.setSystemTime(now);

      mockStorage.getTMDBCache.mockResolvedValue([]);
      mockTMDBApi.getTrending.mockResolvedValue({ results: [] });
      mockStorage.saveTMDBCache.mockResolvedValue({ id: '1' });

      const { tmdbCacheService } = await import('../../server/services/tmdbCache');
      await tmdbCacheService.getTrending('movie', 1);

      const saveCall = mockStorage.saveTMDBCache.mock.calls[0][0];
      const expectedExpiry = new Date('2024-01-15T11:00:00Z'); // 1 hour later

      expect(saveCall.expiresAt).toEqual(expectedExpiry);
    });

    it('should set correct expiration for movie details (24 hours)', async () => {
      const now = new Date('2024-01-15T10:00:00Z');
      vi.setSystemTime(now);

      mockStorage.getTMDBCache.mockResolvedValue([]);
      mockTMDBApi.getMovieDetails.mockResolvedValue({ id: 550, title: 'Fight Club' });
      mockStorage.saveTMDBCache.mockResolvedValue({ id: '1' });

      const { tmdbCacheService } = await import('../../server/services/tmdbCache');
      await tmdbCacheService.getMovieDetails(550);

      const saveCall = mockStorage.saveTMDBCache.mock.calls[0][0];
      const expectedExpiry = new Date('2024-01-16T10:00:00Z'); // 24 hours later

      expect(saveCall.expiresAt).toEqual(expectedExpiry);
    });
  });

  describe('Error Handling', () => {
    it('should handle TMDB API errors gracefully', async () => {
      mockStorage.getTMDBCache.mockResolvedValue([]);
      mockTMDBApi.getTrending.mockRejectedValue(new Error('TMDB API error'));

      const { tmdbCacheService } = await import('../../server/services/tmdbCache');

      await expect(tmdbCacheService.getTrending('movie', 1)).rejects.toThrow('TMDB API error');
      expect(mockStorage.saveTMDBCache).not.toHaveBeenCalled();
    });

    it('should handle cache save errors', async () => {
      mockStorage.getTMDBCache.mockResolvedValue([]);
      mockTMDBApi.getTrending.mockResolvedValue({ results: [] });
      mockStorage.saveTMDBCache.mockRejectedValue(new Error('Database error'));

      const { tmdbCacheService } = await import('../../server/services/tmdbCache');

      // Should still return data even if cache save fails
      const result = await tmdbCacheService.getTrending('movie', 1);
      expect(result).toEqual({ results: [] });
    });
  });

  describe('Different Content Types', () => {
    it('should handle TV shows separately from movies', async () => {
      mockStorage.getTMDBCache.mockResolvedValue([]);
      mockTMDBApi.getTrending.mockResolvedValue({ results: [] });
      mockStorage.saveTMDBCache.mockResolvedValue({ id: '1' });

      const { tmdbCacheService } = await import('../../server/services/tmdbCache');
      await tmdbCacheService.getTrending('tv', 1);

      expect(mockStorage.getTMDBCache).toHaveBeenCalledWith({
        type: 'tv',
        category: 'trending',
        page: 1,
      });

      expect(mockStorage.saveTMDBCache).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'tv',
          category: 'trending',
        })
      );
    });

    it('should handle search results', async () => {
      mockStorage.getTMDBCache.mockResolvedValue([]);
      mockTMDBApi.searchMovies.mockResolvedValue({ results: [] });
      mockStorage.saveTMDBCache.mockResolvedValue({ id: '1' });

      const { tmdbCacheService } = await import('../../server/services/tmdbCache');
      await tmdbCacheService.searchMovies('fight club', 1);

      expect(mockTMDBApi.searchMovies).toHaveBeenCalledWith('fight club', 1);
      expect(mockStorage.saveTMDBCache).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'search',
        })
      );
    });
  });

  describe('Cache Invalidation', () => {
    it('should delete expired cache entries', async () => {
      const { tmdbCacheService } = await import('../../server/services/tmdbCache');
      
      await tmdbCacheService.clearExpiredCache();

      expect(mockStorage.deleteTMDBCache).toHaveBeenCalled();
    });

    it('should delete cache by type and id', async () => {
      const { tmdbCacheService } = await import('../../server/services/tmdbCache');
      
      await tmdbCacheService.invalidateCache('movie', 550);

      expect(mockStorage.deleteTMDBCache).toHaveBeenCalledWith({
        type: 'movie',
        tmdbId: 550,
      });
    });
  });
});
