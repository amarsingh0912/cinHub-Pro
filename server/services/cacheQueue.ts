import { EventEmitter } from 'events';
import { tmdbCacheService } from './tmdbCache.js';
import { TMDBService } from './tmdb.js';

export interface CacheJob {
  id: string;
  mediaType: 'movie' | 'tv';
  mediaId: number;
  priority: number;
  retryCount: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export interface CacheJobStatus {
  id: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  mediaType: 'movie' | 'tv';
  mediaId: number;
  progress?: string;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export class CacheQueueService extends EventEmitter {
  private queue: CacheJob[] = [];
  private activeJobs: Set<string> = new Set();
  private retryingJobs: Set<string> = new Set();
  private jobStatus: Map<string, CacheJobStatus> = new Map();
  private isProcessing = false;
  private maxRetries = 3;
  private baseDelay = 1000; // 1 second base delay for retries
  private processingDelay = 500; // 500ms delay between jobs to avoid rate limiting

  constructor() {
    super();
    this.startWorker();
  }

  /**
   * Generate unique job ID from media type and ID
   */
  private generateJobId(mediaType: 'movie' | 'tv', mediaId: number): string {
    return `${mediaType}-${mediaId}`;
  }

  /**
   * Add a caching job to the queue
   */
  enqueueJob(mediaType: 'movie' | 'tv', mediaId: number, priority: number = 0): string {
    const jobId = this.generateJobId(mediaType, mediaId);
    
    // Check if job already exists (active, pending, or retrying)
    if (this.activeJobs.has(jobId) || 
        this.retryingJobs.has(jobId) || 
        this.queue.some(job => job.id === jobId)) {
      console.log(`Cache job already exists for ${mediaType} ${mediaId}`);
      return jobId;
    }

    // Check if recently completed (within last 5 minutes)
    const existingStatus = this.jobStatus.get(jobId);
    if (existingStatus && existingStatus.status === 'completed') {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      if (existingStatus.completedAt && existingStatus.completedAt > fiveMinutesAgo) {
        console.log(`Cache job recently completed for ${mediaType} ${mediaId}`);
        return jobId;
      }
    }

    const job: CacheJob = {
      id: jobId,
      mediaType,
      mediaId,
      priority,
      retryCount: 0,
      createdAt: new Date()
    };

    // Insert job based on priority (higher priority first)
    const insertIndex = this.queue.findIndex(existingJob => existingJob.priority < priority);
    if (insertIndex === -1) {
      this.queue.push(job);
    } else {
      this.queue.splice(insertIndex, 0, job);
    }

    // Update status
    this.updateJobStatus(jobId, 'pending');
    
    console.log(`Enqueued cache job: ${jobId} (priority: ${priority})`);
    this.emit('job-enqueued', { jobId, mediaType, mediaId });
    
    return jobId;
  }

  /**
   * Get job status
   */
  getJobStatus(jobId: string): CacheJobStatus | null {
    return this.jobStatus.get(jobId) || null;
  }

  /**
   * Get job status by media info
   */
  getJobStatusByMedia(mediaType: 'movie' | 'tv', mediaId: number): CacheJobStatus | null {
    const jobId = this.generateJobId(mediaType, mediaId);
    return this.getJobStatus(jobId);
  }

  /**
   * Get queue statistics
   */
  getQueueStats() {
    return {
      pending: this.queue.length,
      active: this.activeJobs.size,
      total: this.jobStatus.size
    };
  }

  /**
   * Update job status and emit event
   */
  private updateJobStatus(jobId: string, status: CacheJobStatus['status'], progress?: string, error?: string) {
    const job = this.queue.find(j => j.id === jobId) || 
                Array.from(this.jobStatus.values()).find(j => j.id === jobId);
    
    if (!job) return;

    const statusEntry: CacheJobStatus = this.jobStatus.get(jobId) || {
      id: jobId,
      status: 'pending',
      mediaType: job.mediaType,
      mediaId: job.mediaId,
      createdAt: job.createdAt
    };

    statusEntry.status = status;
    if (progress) statusEntry.progress = progress;
    if (error) statusEntry.error = error;
    if (status === 'completed' || status === 'failed') {
      statusEntry.completedAt = new Date();
    }

    this.jobStatus.set(jobId, statusEntry);
    
    // Emit status change event
    this.emit('job-status-changed', statusEntry);
  }

  /**
   * Start the worker process
   */
  private startWorker() {
    console.log('Cache queue worker started');
    this.processQueue();
  }

  /**
   * Main worker loop
   */
  private async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (true) {
      try {
        if (this.queue.length === 0) {
          // No jobs to process, wait and check again
          await this.delay(1000);
          continue;
        }

        const job = this.queue.shift();
        if (!job) continue;

        // Mark job as active
        this.activeJobs.add(job.id);
        this.updateJobStatus(job.id, 'active', 'Starting cache process...');
        
        console.log(`Processing cache job: ${job.id}`);
        job.startedAt = new Date();

        try {
          await this.processCacheJob(job);
          
          // Job completed successfully
          job.completedAt = new Date();
          this.activeJobs.delete(job.id);
          this.updateJobStatus(job.id, 'completed', 'Caching completed successfully');
          
          console.log(`Cache job completed: ${job.id}`);
          this.emit('job-completed', {
            jobId: job.id,
            mediaType: job.mediaType,
            mediaId: job.mediaId
          });

        } catch (error) {
          console.error(`Cache job failed: ${job.id}`, error);
          
          // Handle job failure and potential retry
          await this.handleJobFailure(job, error as Error);
        }

        // Add delay between jobs to avoid overwhelming APIs
        await this.delay(this.processingDelay);

      } catch (error) {
        console.error('Error in cache queue worker:', error);
        await this.delay(5000); // Wait 5 seconds before retrying on worker error
      }
    }
  }

  /**
   * Process a single cache job
   */
  private async processCacheJob(job: CacheJob) {
    const tmdbService = new TMDBService();
    
    if (job.mediaType === 'movie') {
      this.updateJobStatus(job.id, 'active', 'Fetching movie data from TMDB...');
      const movieData = await tmdbService.getMovieDetails(job.mediaId);
      
      this.updateJobStatus(job.id, 'active', 'Processing and caching images...');
      await tmdbCacheService.cacheMovie(movieData);
      
    } else if (job.mediaType === 'tv') {
      this.updateJobStatus(job.id, 'active', 'Fetching TV show data from TMDB...');
      const tvData = await tmdbService.getTVShowDetails(job.mediaId);
      
      this.updateJobStatus(job.id, 'active', 'Processing and caching images...');
      await tmdbCacheService.cacheTVShow(tvData);
    }
  }

  /**
   * Handle job failure and retry logic
   */
  private async handleJobFailure(job: CacheJob, error: Error) {
    this.activeJobs.delete(job.id);
    job.retryCount++;
    job.error = error.message;

    if (job.retryCount <= this.maxRetries) {
      // Mark as retrying to prevent duplicates
      this.retryingJobs.add(job.id);
      
      // Calculate exponential backoff delay
      const retryDelay = this.baseDelay * Math.pow(2, job.retryCount - 1);
      
      console.log(`Retrying cache job ${job.id} in ${retryDelay}ms (attempt ${job.retryCount}/${this.maxRetries})`);
      this.updateJobStatus(job.id, 'pending', `Retrying in ${Math.round(retryDelay/1000)}s (attempt ${job.retryCount}/${this.maxRetries})`);
      
      // Wait for retry delay, then re-enqueue
      setTimeout(() => {
        this.retryingJobs.delete(job.id); // Remove from retrying set
        this.queue.unshift(job); // Add to front of queue for retry
      }, retryDelay);

    } else {
      // Max retries reached, mark as failed
      console.log(`Cache job failed permanently: ${job.id}`);
      this.updateJobStatus(job.id, 'failed', `Failed after ${this.maxRetries} attempts`, error.message);
      
      this.emit('job-failed', {
        jobId: job.id,
        mediaType: job.mediaType,
        mediaId: job.mediaId,
        error: error.message
      });
    }
  }

  /**
   * Utility function for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clean up old job status entries (older than 1 hour)
   */
  private cleanupOldJobs() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    for (const [jobId, status] of this.jobStatus.entries()) {
      if (status.completedAt && status.completedAt < oneHourAgo) {
        this.jobStatus.delete(jobId);
      }
    }
  }

  /**
   * Start periodic cleanup (run every 30 minutes)
   */
  startCleanup() {
    setInterval(() => {
      this.cleanupOldJobs();
    }, 30 * 60 * 1000);
  }
}

// Export singleton instance
export const cacheQueueService = new CacheQueueService();

// Start cleanup process
cacheQueueService.startCleanup();