import { db } from '../db.js';
import { 
  moviesCache, 
  tvShowsCache, 
  peopleCache, 
  mediaCredits, 
  tmdbReviewsCache,
  type InsertMovieCache,
  type InsertTvShowCache,
  type InsertPersonCache,
  type InsertMediaCredit,
  type InsertTmdbReviewCache,
  type MovieCache,
  type TvShowCache
} from '../../shared/schema.js';
import { eq, and } from 'drizzle-orm';
import { imageCacheService } from './imageCache.js';

// Cache expiration (24 hours for details, 1 hour for listings)
const CACHE_EXPIRY_DETAILS = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_EXPIRY_LISTINGS = 60 * 60 * 1000; // 1 hour

interface TMDBMovieData {
  id: number;
  title: string;
  overview?: string;
  release_date?: string;
  runtime?: number;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  budget?: number;
  revenue?: number;
  status?: string;
  tagline?: string;
  original_language?: string;
  original_title?: string;
  adult?: boolean;
  poster_path?: string;
  backdrop_path?: string;
  credits?: any;
  videos?: any;
  similar?: any;
  recommendations?: any;
}

interface TMDBTVData {
  id: number;
  name: string;
  overview?: string;
  first_air_date?: string;
  last_air_date?: string;
  number_of_seasons?: number;
  number_of_episodes?: number;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  status?: string;
  tagline?: string;
  type?: string;
  original_language?: string;
  original_name?: string;
  adult?: boolean;
  in_production?: boolean;
  poster_path?: string;
  backdrop_path?: string;
  credits?: any;
  videos?: any;
  similar?: any;
  recommendations?: any;
}

export class TMDBCacheService {
  /**
   * Get movie from cache or return null if not found/expired
   */
  async getMovieFromCache(movieId: number): Promise<MovieCache | null> {
    const cached = await db
      .select()
      .from(moviesCache)
      .where(eq(moviesCache.id, movieId))
      .limit(1);

    if (cached.length === 0) {
      return null;
    }

    const movie = cached[0];
    const now = new Date();
    const lastUpdated = new Date(movie.lastUpdated);
    const isExpired = (now.getTime() - lastUpdated.getTime()) > CACHE_EXPIRY_DETAILS;

    if (isExpired) {
      console.log(`Movie cache expired for ID ${movieId}`);
      return null;
    }

    return movie;
  }

  /**
   * Get TV show from cache or return null if not found/expired
   */
  async getTVShowFromCache(tvId: number): Promise<TvShowCache | null> {
    const cached = await db
      .select()
      .from(tvShowsCache)
      .where(eq(tvShowsCache.id, tvId))
      .limit(1);

    if (cached.length === 0) {
      return null;
    }

    const tvShow = cached[0];
    const now = new Date();
    const lastUpdated = new Date(tvShow.lastUpdated);
    const isExpired = (now.getTime() - lastUpdated.getTime()) > CACHE_EXPIRY_DETAILS;

    if (isExpired) {
      console.log(`TV show cache expired for ID ${tvId}`);
      return null;
    }

    return tvShow;
  }

  /**
   * Cache movie data from TMDB response
   */
  async cacheMovie(tmdbData: TMDBMovieData): Promise<void> {
    try {
      // Process images in parallel
      let posterUrl: string | null = null;
      let backdropUrl: string | null = null;

      const imagePromises: Promise<void>[] = [];

      if (tmdbData.poster_path) {
        imagePromises.push(
          imageCacheService.getCachedImageUrl(tmdbData.poster_path, 'poster')
            .then(url => { posterUrl = url; })
        );
      }

      if (tmdbData.backdrop_path) {
        imagePromises.push(
          imageCacheService.getCachedImageUrl(tmdbData.backdrop_path, 'backdrop')
            .then(url => { backdropUrl = url; })
        );
      }

      // Wait for all images to process
      await Promise.all(imagePromises);

      // Prepare movie cache entry
      const movieCache: InsertMovieCache = {
        id: tmdbData.id,
        title: tmdbData.title,
        overview: tmdbData.overview || null,
        releaseDate: tmdbData.release_date || null,
        runtime: tmdbData.runtime || null,
        voteAverage: tmdbData.vote_average ? Math.round(tmdbData.vote_average * 10) : null,
        voteCount: tmdbData.vote_count || null,
        popularity: tmdbData.popularity ? Math.round(tmdbData.popularity * 100) : null,
        budget: tmdbData.budget || null,
        revenue: tmdbData.revenue || null,
        status: tmdbData.status || null,
        tagline: tmdbData.tagline || null,
        originalLanguage: tmdbData.original_language || null,
        originalTitle: tmdbData.original_title || null,
        adult: tmdbData.adult || false,
        posterUrl,
        backdropUrl,
        tmdbData: tmdbData // Store complete TMDB response
      };

      // Insert or update movie cache
      await db
        .insert(moviesCache)
        .values(movieCache)
        .onConflictDoUpdate({
          target: moviesCache.id,
          set: {
            ...movieCache,
            lastUpdated: new Date()
          }
        });

      // Cache credits if available
      if (tmdbData.credits) {
        await this.cacheCredits('movie', tmdbData.id, tmdbData.credits);
      }

      console.log(`Cached movie: ${tmdbData.title} (ID: ${tmdbData.id})`);
    } catch (error) {
      console.error(`Failed to cache movie ${tmdbData.id}:`, error);
    }
  }

  /**
   * Cache TV show data from TMDB response
   */
  async cacheTVShow(tmdbData: TMDBTVData): Promise<void> {
    try {
      // Process images in parallel
      let posterUrl: string | null = null;
      let backdropUrl: string | null = null;

      const imagePromises: Promise<void>[] = [];

      if (tmdbData.poster_path) {
        imagePromises.push(
          imageCacheService.getCachedImageUrl(tmdbData.poster_path, 'poster')
            .then(url => { posterUrl = url; })
        );
      }

      if (tmdbData.backdrop_path) {
        imagePromises.push(
          imageCacheService.getCachedImageUrl(tmdbData.backdrop_path, 'backdrop')
            .then(url => { backdropUrl = url; })
        );
      }

      // Wait for all images to process
      await Promise.all(imagePromises);

      // Prepare TV show cache entry
      const tvCache: InsertTvShowCache = {
        id: tmdbData.id,
        name: tmdbData.name,
        overview: tmdbData.overview || null,
        firstAirDate: tmdbData.first_air_date || null,
        lastAirDate: tmdbData.last_air_date || null,
        numberOfSeasons: tmdbData.number_of_seasons || null,
        numberOfEpisodes: tmdbData.number_of_episodes || null,
        voteAverage: tmdbData.vote_average ? Math.round(tmdbData.vote_average * 10) : null,
        voteCount: tmdbData.vote_count || null,
        popularity: tmdbData.popularity ? Math.round(tmdbData.popularity * 100) : null,
        status: tmdbData.status || null,
        tagline: tmdbData.tagline || null,
        type: tmdbData.type || null,
        originalLanguage: tmdbData.original_language || null,
        originalName: tmdbData.original_name || null,
        adult: tmdbData.adult || false,
        inProduction: tmdbData.in_production || false,
        posterUrl,
        backdropUrl,
        tmdbData: tmdbData // Store complete TMDB response
      };

      // Insert or update TV show cache
      await db
        .insert(tvShowsCache)
        .values(tvCache)
        .onConflictDoUpdate({
          target: tvShowsCache.id,
          set: {
            ...tvCache,
            lastUpdated: new Date()
          }
        });

      // Cache credits if available
      if (tmdbData.credits) {
        await this.cacheCredits('tv', tmdbData.id, tmdbData.credits);
      }

      console.log(`Cached TV show: ${tmdbData.name} (ID: ${tmdbData.id})`);
    } catch (error) {
      console.error(`Failed to cache TV show ${tmdbData.id}:`, error);
    }
  }

  /**
   * Cache credits (cast and crew) for a movie or TV show
   */
  private async cacheCredits(mediaType: 'movie' | 'tv', mediaId: number, credits: any): Promise<void> {
    try {
      // Clear existing credits for this media
      await db
        .delete(mediaCredits)
        .where(
          and(
            eq(mediaCredits.mediaType, mediaType),
            eq(mediaCredits.mediaId, mediaId)
          )
        );

      const creditsToInsert: InsertMediaCredit[] = [];

      // Process cast
      if (credits.cast && Array.isArray(credits.cast)) {
        for (const castMember of credits.cast) {
          creditsToInsert.push({
            mediaType,
            mediaId,
            personId: castMember.id,
            creditType: 'cast',
            character: castMember.character || null,
            order: castMember.order || null
          });

          // Cache person details
          await this.cachePerson(castMember);
        }
      }

      // Process crew
      if (credits.crew && Array.isArray(credits.crew)) {
        for (const crewMember of credits.crew) {
          creditsToInsert.push({
            mediaType,
            mediaId,
            personId: crewMember.id,
            creditType: 'crew',
            job: crewMember.job || null,
            department: crewMember.department || null
          });

          // Cache person details
          await this.cachePerson(crewMember);
        }
      }

      // Insert all credits
      if (creditsToInsert.length > 0) {
        // Insert in batches to avoid overwhelming the database
        const BATCH_SIZE = 50;
        for (let i = 0; i < creditsToInsert.length; i += BATCH_SIZE) {
          const batch = creditsToInsert.slice(i, i + BATCH_SIZE);
          await db.insert(mediaCredits).values(batch).onConflictDoNothing();
        }
      }

      console.log(`Cached ${creditsToInsert.length} credits for ${mediaType} ${mediaId}`);
    } catch (error) {
      console.error(`Failed to cache credits for ${mediaType} ${mediaId}:`, error);
    }
  }

  /**
   * Cache person (cast/crew member) details
   */
  private async cachePerson(personData: any): Promise<void> {
    try {
      // Process profile image
      let profileUrl: string | null = null;
      if (personData.profile_path) {
        profileUrl = await imageCacheService.getCachedImageUrl(personData.profile_path, 'profile');
      }

      const person: InsertPersonCache = {
        id: personData.id,
        name: personData.name,
        biography: personData.biography || null,
        birthday: personData.birthday || null,
        deathday: personData.deathday || null,
        placeOfBirth: personData.place_of_birth || null,
        popularity: personData.popularity ? Math.round(personData.popularity * 100) : null,
        knownForDepartment: personData.known_for_department || null,
        adult: personData.adult || false,
        profileUrl,
        tmdbData: personData
      };

      // Insert or update person (only if we don't have recent data)
      await db
        .insert(peopleCache)
        .values(person)
        .onConflictDoUpdate({
          target: peopleCache.id,
          set: {
            name: person.name,
            profileUrl: person.profileUrl,
            lastUpdated: new Date()
          }
        });

    } catch (error) {
      console.error(`Failed to cache person ${personData.id}:`, error);
    }
  }

  /**
   * Build response with cached Cloudinary URLs
   */
  buildMovieResponse(movie: MovieCache): any {
    const tmdbData = movie.tmdbData as any; // Cast to any since it's JSON from database
    const response = {
      ...tmdbData,
      // Override with cached Cloudinary URLs
      poster_path: movie.posterUrl || tmdbData?.poster_path,
      backdrop_path: movie.backdropUrl || tmdbData?.backdrop_path,
      // Convert back from stored integers
      vote_average: movie.voteAverage ? movie.voteAverage / 10 : tmdbData?.vote_average,
      popularity: movie.popularity ? movie.popularity / 100 : tmdbData?.popularity,
    };

    return response;
  }

  /**
   * Build TV show response with cached Cloudinary URLs
   */
  buildTVShowResponse(tvShow: TvShowCache): any {
    const tmdbData = tvShow.tmdbData as any; // Cast to any since it's JSON from database
    const response = {
      ...tmdbData,
      // Override with cached Cloudinary URLs  
      poster_path: tvShow.posterUrl || tmdbData?.poster_path,
      backdrop_path: tvShow.backdropUrl || tmdbData?.backdrop_path,
      // Convert back from stored integers
      vote_average: tvShow.voteAverage ? tvShow.voteAverage / 10 : tmdbData?.vote_average,
      popularity: tvShow.popularity ? tvShow.popularity / 100 : tmdbData?.popularity,
    };

    return response;
  }
}

// Export singleton instance
export const tmdbCacheService = new TMDBCacheService();