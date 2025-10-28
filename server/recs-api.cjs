// CineHub Recommendations API
// Zero-cost, rule-based movie recommendations using SQLite
// Uses better-sqlite3 for synchronous, fast local database access

const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Initialize SQLite database
const dbPath = path.join(__dirname, 'cinehub.db');
const db = new Database(dbPath);

// Initialize schema if database is new
function initializeDatabase() {
  const schemaPath = path.join(__dirname, 'schema.sql');
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
function calculateTrendingScore(movie, popularity) {
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
function hasOverlappingGenres(genres1, genres2) {
  if (!genres1 || !genres2) return false;
  const g1 = genres1.split(',').map(g => g.trim().toLowerCase());
  const g2 = genres2.split(',').map(g => g.trim().toLowerCase());
  return g1.some(genre => g2.includes(genre));
}

/**
 * Get movie with full details
 */
function getMovieDetails(movieId) {
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
function formatMovie(movie) {
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
      const movieIds = precomputed.movie_ids.split(',').map(id => parseInt(id.trim()));
      const movies = movieIds
        .map(id => getMovieDetails(id))
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
    const scored = movies.map(movie => {
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
 */
router.get('/similar/:movieId', (req, res) => {
  try {
    const movieId = parseInt(req.params.movieId);
    
    if (isNaN(movieId)) {
      return res.status(400).json({ error: 'Invalid movie ID' });
    }
    
    // Check for precomputed similar movies
    const precomputed = db.prepare('SELECT movie_ids FROM precomputed_recs WHERE key = ?')
      .get(`similar_${movieId}`);
    
    if (precomputed) {
      const movieIds = precomputed.movie_ids.split(',').map(id => parseInt(id.trim()));
      const movies = movieIds
        .map(id => getMovieDetails(id))
        .filter(Boolean)
        .map(formatMovie);
      
      return res.json(movies);
    }
    
    // Compute similar on-the-fly
    const sourceMovie = getMovieDetails(movieId);
    
    if (!sourceMovie) {
      return res.status(404).json({ error: 'Movie not found' });
    }
    
    if (!sourceMovie.genres) {
      return res.json([]);
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
    const similar = allMovies
      .filter(movie => hasOverlappingGenres(sourceMovie.genres, movie.genres))
      .map(movie => ({
        ...movie,
        popularity_score: (movie.likes || 0) + (movie.views || 0)
      }))
      .sort((a, b) => b.popularity_score - a.popularity_score)
      .slice(0, 12)
      .map(formatMovie);
    
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
    
    const lastMovieId = lastView.movie_id;
    const sourceMovie = getMovieDetails(lastMovieId);
    
    if (!sourceMovie || !sourceMovie.genres) {
      return res.json([]);
    }
    
    // Get all movies the user has watched
    const watchedMovies = db.prepare(`
      SELECT DISTINCT movie_id
      FROM interactions
      WHERE user_id = ? AND event_type = 'view'
    `).all(userId);
    
    const watchedIds = watchedMovies.map(row => row.movie_id);
    
    // Find similar movies excluding watched ones
    const allMovies = db.prepare(`
      SELECT m.*, p.views, p.likes, p.avg_rating
      FROM movies m
      LEFT JOIN movie_popularity p ON m.id = p.movie_id
    `).all();
    
    const recommendations = allMovies
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
      movies: movieCount.count,
      interactions: interactionCount.count
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close();
  process.exit(0);
});

module.exports = router;
