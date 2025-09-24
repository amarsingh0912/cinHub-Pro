import { v2 as cloudinary } from 'cloudinary';
import { db } from '../db.js';
import { imagesCache, type InsertImageCache } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';

// TMDB image configuration
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';
const IMAGE_SIZES = {
  poster: 'w500',    // 500px wide posters
  backdrop: 'w1280', // 1280px wide backdrops  
  profile: 'w185'    // 185px wide profile photos
} as const;

interface ImageProcessResult {
  cloudinaryUrl: string;
  publicId: string;
  width: number;
  height: number;
  fileSize: number;
  format: string;
}

export class ImageCacheService {
  /**
   * Get or create cached image URL from TMDB path
   */
  async getCachedImageUrl(tmdbPath: string, imageType: 'poster' | 'backdrop' | 'profile'): Promise<string | null> {
    if (!tmdbPath || !tmdbPath.startsWith('/')) {
      return null;
    }

    // Check if image is already cached
    const cached = await db
      .select()
      .from(imagesCache)
      .where(eq(imagesCache.tmdbPath, tmdbPath))
      .limit(1);

    if (cached.length > 0) {
      return cached[0].cloudinaryUrl;
    }

    // Process and cache new image
    return await this.processAndCacheImage(tmdbPath, imageType);
  }

  /**
   * Process TMDB image and upload to Cloudinary
   */
  private async processAndCacheImage(tmdbPath: string, imageType: 'poster' | 'backdrop' | 'profile'): Promise<string | null> {
    try {
      // Build TMDB image URL
      const size = IMAGE_SIZES[imageType];
      const tmdbImageUrl = `${TMDB_IMAGE_BASE_URL}/${size}${tmdbPath}`;
      
      console.log(`Processing TMDB image: ${tmdbImageUrl}`);

      // Generate unique public ID for Cloudinary
      const publicId = `cinehub/${imageType}s/${tmdbPath.replace('/', '').replace(/\./g, '_')}`;

      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(tmdbImageUrl, {
        public_id: publicId,
        folder: `cinehub/${imageType}s`,
        format: 'auto', // Auto-optimize format
        quality: 'auto', // Auto-optimize quality
        fetch_format: 'auto', // Auto-deliver best format
        transformation: [
          {
            quality: 'auto:good',
            fetch_format: 'auto'
          }
        ],
        overwrite: false // Don't overwrite existing images
      });

      // Prepare cache entry
      const imageCache: InsertImageCache = {
        tmdbPath,
        imageType,
        cloudinaryUrl: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        fileSize: result.bytes,
        format: result.format
      };

      // Save to cache
      await db.insert(imagesCache).values(imageCache).onConflictDoNothing();

      console.log(`Cached image: ${tmdbPath} -> ${result.secure_url}`);
      return result.secure_url;

    } catch (error) {
      console.error(`Failed to process image ${tmdbPath}:`, error);
      // Return fallback TMDB URL on error
      const size = IMAGE_SIZES[imageType];
      return `${TMDB_IMAGE_BASE_URL}/${size}${tmdbPath}`;
    }
  }

  /**
   * Process multiple images in parallel
   */
  async processBatchImages(images: Array<{tmdbPath: string, imageType: 'poster' | 'backdrop' | 'profile'}>): Promise<Record<string, string | null>> {
    const results: Record<string, string | null> = {};
    
    // Process in parallel with limit to avoid overwhelming Cloudinary
    const BATCH_SIZE = 5;
    for (let i = 0; i < images.length; i += BATCH_SIZE) {
      const batch = images.slice(i, i + BATCH_SIZE);
      const promises = batch.map(async ({ tmdbPath, imageType }) => {
        const url = await this.getCachedImageUrl(tmdbPath, imageType);
        results[tmdbPath] = url;
      });
      
      await Promise.all(promises);
    }

    return results;
  }

  /**
   * Clean up orphaned images (optional maintenance method)
   */
  async cleanupOrphanedImages(): Promise<number> {
    try {
      // Get all cached images
      const cachedImages = await db.select().from(imagesCache);
      let deletedCount = 0;

      // Check if images are still referenced (this is a simplified version)
      // In production, you'd want more sophisticated cleanup logic
      for (const image of cachedImages) {
        try {
          // Try to delete from Cloudinary
          await cloudinary.uploader.destroy(image.publicId);
          
          // Remove from cache
          await db
            .delete(imagesCache)
            .where(eq(imagesCache.id, image.id));
          
          deletedCount++;
        } catch (error) {
          // Image might not exist in Cloudinary anymore, that's ok
        }
      }

      console.log(`Cleaned up ${deletedCount} orphaned images`);
      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up orphaned images:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const imageCacheService = new ImageCacheService();