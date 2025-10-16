import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CacheQueueService } from '../../server/services/cacheQueue';

// Mock tmdbCache service
vi.mock('../../server/services/tmdbCache', () => ({
  tmdbCacheService: {
    cacheMovieDetails: vi.fn().mockResolvedValue({}),
    cacheTVDetails: vi.fn().mockResolvedValue({})
  }
}));

describe('CacheQueueService', () => {
  let queueService: CacheQueueService;

  beforeEach(() => {
    queueService = new CacheQueueService();
    // Stop the automatic worker to control test execution
    (queueService as any).isProcessing = false;
  });

  describe('enqueueJob', () => {
    it('enqueues a new cache job', () => {
      const jobId = queueService.enqueueJob('movie', 123);
      expect(jobId).toBe('movie-123');
      
      const status = queueService.getJobStatus(jobId);
      expect(status).toBeDefined();
      expect(status?.mediaType).toBe('movie');
      expect(status?.mediaId).toBe(123);
      expect(status?.status).toBe('pending');
    });

    it('prevents duplicate jobs from being enqueued', () => {
      const jobId1 = queueService.enqueueJob('movie', 123);
      const jobId2 = queueService.enqueueJob('movie', 123);
      
      expect(jobId1).toBe(jobId2);
      const stats = queueService.getQueueStats();
      expect(stats.pending).toBe(1);
    });

    it('prioritizes jobs correctly', () => {
      queueService.enqueueJob('movie', 1, 1);
      queueService.enqueueJob('movie', 2, 5);
      queueService.enqueueJob('movie', 3, 3);
      
      const queue = (queueService as any).queue;
      expect(queue[0].priority).toBe(5);
      expect(queue[1].priority).toBe(3);
      expect(queue[2].priority).toBe(1);
    });

    it('generates unique job IDs for different media', () => {
      const movieJobId = queueService.enqueueJob('movie', 123);
      const tvJobId = queueService.enqueueJob('tv', 123);
      
      expect(movieJobId).toBe('movie-123');
      expect(tvJobId).toBe('tv-123');
      expect(movieJobId).not.toBe(tvJobId);
    });

    it('emits job-enqueued event', () => {
      const listener = vi.fn();
      queueService.on('job-enqueued', listener);
      
      queueService.enqueueJob('movie', 456);
      
      expect(listener).toHaveBeenCalledWith({
        jobId: 'movie-456',
        mediaType: 'movie',
        mediaId: 456
      });
    });

    it('does not re-enqueue recently completed jobs', async () => {
      const jobId = queueService.enqueueJob('movie', 789);
      
      // Simulate job completion
      (queueService as any).updateJobStatus(jobId, 'completed');
      const status = queueService.getJobStatus(jobId);
      if (status) {
        status.completedAt = new Date();
      }
      
      // Try to enqueue the same job again
      const newJobId = queueService.enqueueJob('movie', 789);
      
      expect(newJobId).toBe(jobId);
      const stats = queueService.getQueueStats();
      expect(stats.pending).toBe(0);
    });
  });

  describe('getJobStatus', () => {
    it('returns job status for existing job', () => {
      const jobId = queueService.enqueueJob('tv', 999);
      const status = queueService.getJobStatus(jobId);
      
      expect(status).toBeDefined();
      expect(status?.mediaId).toBe(999);
      expect(status?.mediaType).toBe('tv');
    });

    it('returns null for non-existent job', () => {
      const status = queueService.getJobStatus('non-existent');
      expect(status).toBeNull();
    });
  });

  describe('getJobStatusByMedia', () => {
    it('retrieves job status by media type and ID', () => {
      queueService.enqueueJob('movie', 555);
      const status = queueService.getJobStatusByMedia('movie', 555);
      
      expect(status).toBeDefined();
      expect(status?.mediaId).toBe(555);
      expect(status?.mediaType).toBe('movie');
    });

    it('returns null when no job exists for media', () => {
      const status = queueService.getJobStatusByMedia('tv', 999);
      expect(status).toBeNull();
    });
  });

  describe('getQueueStats', () => {
    it('returns correct queue statistics', () => {
      queueService.enqueueJob('movie', 1);
      queueService.enqueueJob('movie', 2);
      queueService.enqueueJob('tv', 3);
      
      const stats = queueService.getQueueStats();
      expect(stats.pending).toBe(3);
      expect(stats.active).toBe(0);
      expect(stats.total).toBe(3);
    });

    it('returns zero stats for empty queue', () => {
      const stats = queueService.getQueueStats();
      expect(stats.pending).toBe(0);
      expect(stats.active).toBe(0);
      expect(stats.total).toBe(0);
    });
  });

  describe('job ID generation', () => {
    it('generates consistent IDs for same media', () => {
      const id1 = (queueService as any).generateJobId('movie', 123);
      const id2 = (queueService as any).generateJobId('movie', 123);
      expect(id1).toBe(id2);
      expect(id1).toBe('movie-123');
    });

    it('generates different IDs for different media types', () => {
      const movieId = (queueService as any).generateJobId('movie', 123);
      const tvId = (queueService as any).generateJobId('tv', 123);
      expect(movieId).not.toBe(tvId);
    });

    it('generates different IDs for different media IDs', () => {
      const id1 = (queueService as any).generateJobId('movie', 123);
      const id2 = (queueService as any).generateJobId('movie', 456);
      expect(id1).not.toBe(id2);
    });
  });
});
