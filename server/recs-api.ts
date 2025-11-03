// CineHub Recommendations API
// Zero-cost, rule-based movie recommendations using SQLite
// Uses better-sqlite3 for synchronous, fast local database access

import express from 'express';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// ==================== TMDB FALLBACK & BACKGROUND SYNC ====================

// Initialize SQLite database
const dbPath = path.join(import.meta.dirname, 'cinehub.db');
const db = new Database(dbPath);

/**
 * Add a movie to the local database in the background
 */
function syncMovieToDatabase(movie: any) {
  try {
    // Check if movie already exists
    const existing = db.prepare('SELECT id FROM movies WHERE id = ?').get(movie.id);
    if (existing) {
      return; // Already in database
    }

    // Insert movie into local database
    const stmt = db.prepare(`
      INSERT INTO movies (id, title, year, genres, description, poster_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `);
    
    stmt.run(
      movie.id,
      movie.title,
      movie.year,
      movie.genres,
      movie.description,
      movie.poster_url
    );

    console.log(`✓ Synced movie to local DB: ${movie.title} (${movie.id})`);
  } catch (error) {
    console.error('Error syncing movie to database:', error);
  }
}

/**
 * Fetch movie details from TMDB and sync to local database
 */
async function fetchAndSyncMovieFromTMDB(movieId: number) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return null;
  }

  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}&language=en-US`
    );
    
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    const movie = {
      id: data.id,
      title: data.title,
      poster_url: data.poster_path 
        ? `https://image.tmdb.org/t/p/w500${data.poster_path}`
        : null,
      year: data.release_date ? new Date(data.release_date).getFullYear() : null,
      genres: (data.genres || []).map((g: any) => g.name).join(','),
      description: data.overview || '',
      views: 0,
      likes: 0,
      avg_rating: data.vote_average || null
    };

    // Sync to database in background (non-blocking)
    setImmediate(() => syncMovieToDatabase(movie));

    return movie;
  } catch (error) {
    console.error('Error fetching movie from TMDB:', error);
    return null;
  }
}

/**
 * Fetch similar movies from TMDB API as fallback
 */
async function fetchSimilarFromTMDB(movieId: number) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return [];
  }

  try {
    // First, sync the source movie to database
    await fetchAndSyncMovieFromTMDB(movieId);

    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${movieId}/similar?api_key=${apiKey}&language=en-US&page=1`
    );
    
    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    
    // Transform TMDB results to match our format
    const movies = (data.results || []).slice(0, 12).map((movie: any) => ({
      id: movie.id,
      title: movie.title,
      poster_url: movie.poster_path 
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : null,
      year: movie.release_date ? new Date(movie.release_date).getFullYear() : null,
      genres: movie.genre_ids ? movie.genre_ids.join(',') : '',
      description: movie.overview || '',
      views: 0,
      likes: 0,
      avg_rating: movie.vote_average || null
    }));

    // Sync similar movies to database in background (non-blocking)
    setImmediate(() => {
      movies.forEach((movie: any) => syncMovieToDatabase(movie));
    });

    return movies;
  } catch (error) {
    console.error('Error fetching from TMDB:', error);
    return [];
  }
}

// Initialize schema if database is new
function initializeDatabase() {
  const schemaPath = path.join(import.meta.dirname, 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema);
    console.log('📊 Recommendations database initialized');
  }
}

initializeDatabase();

// ==================== HELPER FUNCTIONS ====================

/**
 * Calculate trending score for a movie
 * Formula: (likes * 2 + views) / (age_hours + 2)
 * Adjust weights here: likes=2, views=1, age decay with +2 smoothing
 */
function calculateTrendingScore(movie: any, popularity: any) {
  const likes = popularity?.likes || 0;
  const views = popularity?.views || 0;
  const createdAt = new Date(movie.created_at);
  const ageHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
  
  // Scoring formula - tune these weights for different behavior
  const score = (likes * 2 + views) / (ageHours + 2);
  return score;
}

/**
 * Check if two movies share genres
 * Simple CSV overlap check
 */
function hasOverlappingGenres(genres1: string, genres2: string) {
  if (!genres1 || !genres2) return false;
  const g1 = genres1.split(',').map(g => g.trim().toLowerCase());
  const g2 = genres2.split(',').map(g => g.trim().toLowerCase());
  return g1.some(genre => g2.includes(genre));
}

/**
 * Get movie with full details
 */
function getMovieDetails(movieId: number) {
  const stmt = db.prepare(`
    SELECT m.*, p.views, p.likes, p.avg_rating
    FROM movies m
    LEFT JOIN movie_popularity p ON m.id = p.movie_id
    WHERE m.id = ?
  `);
  return stmt.get(movieId);
}

/**
 * Format movie object for API response
 */
function formatMovie(movie: any) {
  return {
    id: movie.id,
    title: movie.title,
    poster_url: movie.poster_url,
    year: movie.year,
    genres: movie.genres,
    description: movie.description,
    directors: movie.directors,
    cast: movie.cast,
    views: movie.views || 0,
    likes: movie.likes || 0,
    avg_rating: movie.avg_rating || null
  };
}

// ==================== API ENDPOINTS ====================

/**
 * GET /api/recs/trending
 * Returns top 20 movies by trending score
 * Trending score = (likes*2 + views) / (age_hours + 2)
 */
router.get('/trending', (req, res) => {
  try {
    // Check for precomputed trending recommendations
    const precomputed = db.prepare('SELECT movie_ids FROM precomputed_recs WHERE key = ?').get('trending');
    
    if (precomputed) {
      const movieIds = (precomputed as any).movie_ids.split(',').map((id: string) => parseInt(id.trim()));
      const movies = movieIds
        .map((id: number) => getMovieDetails(id))
        .filter(Boolean)
        .map(formatMovie);
      
      return res.json(movies);
    }
    
    // Compute trending on-the-fly
    const movies = db.prepare(`
      SELECT m.*, p.views, p.likes, p.avg_rating
      FROM movies m
      LEFT JOIN movie_popularity p ON m.id = p.movie_id
      ORDER BY m.id
    `).all();
    
    // Calculate trending scores and sort
    const scored = (movies as any[]).map(movie => {
      const popularity = {
        views: movie.views || 0,
        likes: movie.likes || 0
      };
      return {
        ...movie,
        trending_score: calculateTrendingScore(movie, popularity)
      };
    });
    
    scored.sort((a, b) => b.trending_score - a.trending_score);
    
    // Return top 20
    const topMovies = scored.slice(0, 20).map(formatMovie);
    res.json(topMovies);
    
  } catch (error) {
    console.error('Error in /trending:', error);
    res.status(500).json({ error: 'Failed to fetch trending movies' });
  }
});

/**
 * GET /api/recs/similar/:movieId
 * Returns top 12 movies with overlapping genres
 * Excludes the source movie, ordered by popularity (likes + views)
 * Falls back to TMDB if movie not found in local database
 */
router.get('/similar/:movieId', async (req, res) => {
  try {
    const movieId = parseInt(req.params.movieId);
    
    if (isNaN(movieId)) {
      return res.status(400).json({ error: 'Invalid movie ID' });
    }
    
    // Check for precomputed similar movies
    const precomputed = db.prepare('SELECT movie_ids FROM precomputed_recs WHERE key = ?')
      .get(`similar_${movieId}`);
    
    if (precomputed) {
      const movieIds = (precomputed as any).movie_ids.split(',').map((id: string) => parseInt(id.trim()));
      const movies = movieIds
        .map((id: number) => getMovieDetails(id))
        .filter(Boolean)
        .map(formatMovie);
      
      return res.json(movies);
    }
    
    // Compute similar on-the-fly
    const sourceMovie = getMovieDetails(movieId) as any;
    
    // If movie not in local database, use TMDB fallback
    if (!sourceMovie) {
      const tmdbSimilar = await fetchSimilarFromTMDB(movieId);
      return res.json(tmdbSimilar);
    }
    
    if (!sourceMovie.genres) {
      // Still try TMDB fallback if no genres in local DB
      const tmdbSimilar = await fetchSimilarFromTMDB(movieId);
      return res.json(tmdbSimilar);
    }
    
    // Find movies with overlapping genres using LIKE
    // This is a simple implementation - can be optimized with better indexing
    const allMovies = db.prepare(`
      SELECT m.*, p.views, p.likes, p.avg_rating
      FROM movies m
      LEFT JOIN movie_popularity p ON m.id = p.movie_id
      WHERE m.id != ?
    `).all(movieId);
    
    // Filter by genre overlap and calculate popularity
    const similar = (allMovies as any[])
      .filter(movie => hasOverlappingGenres(sourceMovie.genres, movie.genres))
      .map(movie => ({
        ...movie,
        popularity_score: (movie.likes || 0) + (movie.views || 0)
      }))
      .sort((a, b) => b.popularity_score - a.popularity_score)
      .slice(0, 12)
      .map(formatMovie);
    
    // If no similar movies found in local DB, use TMDB fallback
    if (similar.length === 0) {
      const tmdbSimilar = await fetchSimilarFromTMDB(movieId);
      return res.json(tmdbSimilar);
    }
    
    res.json(similar);
    
  } catch (error) {
    console.error('Error in /similar:', error);
    res.status(500).json({ error: 'Failed to fetch similar movies' });
  }
});

/**
 * GET /api/recs/because/:userId
 * Personalized recommendations based on user's viewing history
 * Returns movies similar to the user's most recently viewed movie
 * Excludes movies the user has already watched
 */
router.get('/because/:userId', (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Get user's most recent view
    const lastView = db.prepare(`
      SELECT movie_id
      FROM interactions
      WHERE user_id = ? AND event_type = 'view'
      ORDER BY created_at DESC
      LIMIT 1
    `).get(userId);
    
    if (!lastView) {
      return res.json([]);
    }
    
    const lastMovieId = (lastView as any).movie_id;
    const sourceMovie = getMovieDetails(lastMovieId) as any;
    
    if (!sourceMovie || !sourceMovie.genres) {
      return res.json([]);
    }
    
    // Get all movies the user has watched
    const watchedMovies = db.prepare(`
      SELECT DISTINCT movie_id
      FROM interactions
      WHERE user_id = ? AND event_type = 'view'
    `).all(userId);
    
    const watchedIds = (watchedMovies as any[]).map(row => row.movie_id);
    
    // Find similar movies excluding watched ones
    const allMovies = db.prepare(`
      SELECT m.*, p.views, p.likes, p.avg_rating
      FROM movies m
      LEFT JOIN movie_popularity p ON m.id = p.movie_id
    `).all();
    
    const recommendations = (allMovies as any[])
      .filter(movie => 
        !watchedIds.includes(movie.id) && 
        hasOverlappingGenres(sourceMovie.genres, movie.genres)
      )
      .map(movie => ({
        ...movie,
        popularity_score: (movie.likes || 0) + (movie.views || 0)
      }))
      .sort((a, b) => b.popularity_score - a.popularity_score)
      .slice(0, 12)
      .map(formatMovie);
    
    res.json(recommendations);
    
  } catch (error) {
    console.error('Error in /because:', error);
    res.status(500).json({ error: 'Failed to fetch personalized recommendations' });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  try {
    const movieCount = db.prepare('SELECT COUNT(*) as count FROM movies').get();
    const interactionCount = db.prepare('SELECT COUNT(*) as count FROM interactions').get();
    
    res.json({
      status: 'ok',
      database: dbPath,
      movies: (movieCount as any).count,
      interactions: (interactionCount as any).count
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: (error as Error).message });
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close();
  process.exit(0);
});

export default router;
