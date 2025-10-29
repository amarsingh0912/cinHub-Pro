// TMDB Background Sync Service
// Automatically syncs trending movies and TV shows from TMDB to local recommendations database

const Database = require('better-sqlite3');
const path = require('path');

// Initialize database connection
const dbPath = path.join(__dirname, 'cinehub.db');
let db;

try {
  db = new Database(dbPath);
  console.log('📊 TMDB Sync Service connected to database');
} catch (error) {
  console.error('Failed to connect to database:', error);
  process.exit(1);
}

/**
 * Add a movie to the local database
 */
function syncMovieToDatabase(movie) {
  try {
    // Check if movie already exists
    const existing = db.prepare('SELECT id FROM movies WHERE id = ?').get(movie.id);
    if (existing) {
      // Update existing movie with latest data
      const updateStmt = db.prepare(`
        UPDATE movies 
        SET title = ?, year = ?, genres = ?, description = ?, poster_url = ?
        WHERE id = ?
      `);
      
      updateStmt.run(
        movie.title,
        movie.year,
        movie.genres,
        movie.description,
        movie.poster_url,
        movie.id
      );
      return false; // Movie was updated, not inserted
    }

    // Insert new movie into local database
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

    return true; // New movie was inserted
  } catch (error) {
    console.error('Error syncing movie to database:', error);
    return false;
  }
}

/**
 * Initialize movie popularity data for a newly synced movie
 */
function initializeMoviePopularity(movieId, voteAverage) {
  try {
    const existing = db.prepare('SELECT movie_id FROM movie_popularity WHERE movie_id = ?').get(movieId);
    if (!existing) {
      const stmt = db.prepare(`
        INSERT INTO movie_popularity (movie_id, views, likes, avg_rating)
        VALUES (?, 0, 0, ?)
      `);
      stmt.run(movieId, voteAverage);
    }
  } catch (error) {
    console.error('Error initializing movie popularity:', error);
  }
}

/**
 * Fetch trending movies from TMDB
 */
async function fetchTrendingMoviesFromTMDB(timeWindow = 'week') {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    console.warn('⚠️  TMDB_API_KEY not configured, skipping sync');
    return [];
  }

  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/trending/movie/${timeWindow}?api_key=${apiKey}&language=en-US`
    );
    
    if (!response.ok) {
      console.error(`TMDB API error: ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Error fetching trending movies from TMDB:', error);
    return [];
  }
}

/**
 * Fetch trending TV shows from TMDB
 */
async function fetchTrendingTVShowsFromTMDB(timeWindow = 'week') {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    console.warn('⚠️  TMDB_API_KEY not configured, skipping sync');
    return [];
  }

  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/trending/tv/${timeWindow}?api_key=${apiKey}&language=en-US`
    );
    
    if (!response.ok) {
      console.error(`TMDB API error: ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Error fetching trending TV shows from TMDB:', error);
    return [];
  }
}

/**
 * Transform TMDB movie data to our local format
 */
function transformMovieData(tmdbMovie) {
  return {
    id: tmdbMovie.id,
    title: tmdbMovie.title,
    poster_url: tmdbMovie.poster_path 
      ? `https://image.tmdb.org/t/p/w500${tmdbMovie.poster_path}`
      : null,
    year: tmdbMovie.release_date ? new Date(tmdbMovie.release_date).getFullYear() : null,
    genres: '', // Will be populated with genre IDs, could be enhanced with actual genre names
    description: tmdbMovie.overview || '',
    avg_rating: tmdbMovie.vote_average || null
  };
}

/**
 * Sync trending movies to local database
 */
async function syncTrendingMovies() {
  console.log('🔄 Starting trending movies sync...');
  
  const trendingMovies = await fetchTrendingMoviesFromTMDB('week');
  
  if (trendingMovies.length === 0) {
    console.log('No trending movies to sync');
    return { synced: 0, updated: 0 };
  }

  let syncedCount = 0;
  let updatedCount = 0;

  for (const tmdbMovie of trendingMovies) {
    const movie = transformMovieData(tmdbMovie);
    const isNew = syncMovieToDatabase(movie);
    
    if (isNew) {
      syncedCount++;
      initializeMoviePopularity(movie.id, movie.avg_rating);
      console.log(`✓ Synced new movie: ${movie.title} (${movie.id})`);
    } else {
      updatedCount++;
    }
  }

  console.log(`✅ Trending movies sync complete: ${syncedCount} new, ${updatedCount} updated`);
  return { synced: syncedCount, updated: updatedCount };
}

/**
 * Sync trending TV shows to local database (using movies table for simplicity)
 */
async function syncTrendingTVShows() {
  console.log('🔄 Starting trending TV shows sync...');
  
  const trendingShows = await fetchTrendingTVShowsFromTMDB('week');
  
  if (trendingShows.length === 0) {
    console.log('No trending TV shows to sync');
    return { synced: 0, updated: 0 };
  }

  let syncedCount = 0;
  let updatedCount = 0;

  for (const tmdbShow of trendingShows) {
    // Transform TV show data to movie format
    const movie = {
      id: tmdbShow.id,
      title: tmdbShow.name,
      poster_url: tmdbShow.poster_path 
        ? `https://image.tmdb.org/t/p/w500${tmdbShow.poster_path}`
        : null,
      year: tmdbShow.first_air_date ? new Date(tmdbShow.first_air_date).getFullYear() : null,
      genres: '',
      description: tmdbShow.overview || '',
      avg_rating: tmdbShow.vote_average || null
    };
    
    const isNew = syncMovieToDatabase(movie);
    
    if (isNew) {
      syncedCount++;
      initializeMoviePopularity(movie.id, movie.avg_rating);
      console.log(`✓ Synced new TV show: ${movie.title} (${movie.id})`);
    } else {
      updatedCount++;
    }
  }

  console.log(`✅ Trending TV shows sync complete: ${syncedCount} new, ${updatedCount} updated`);
  return { synced: syncedCount, updated: updatedCount };
}

/**
 * Main sync function - syncs both movies and TV shows
 */
async function syncTrendingContent() {
  try {
    console.log('🚀 Starting TMDB trending content sync...');
    
    const movieStats = await syncTrendingMovies();
    const tvStats = await syncTrendingTVShows();
    
    const totalSynced = movieStats.synced + tvStats.synced;
    const totalUpdated = movieStats.updated + tvStats.updated;
    
    console.log(`🎬 Total sync complete: ${totalSynced} new items, ${totalUpdated} updated`);
    
    return {
      success: true,
      movies: movieStats,
      tvShows: tvStats,
      total: { synced: totalSynced, updated: totalUpdated }
    };
  } catch (error) {
    console.error('❌ Error during trending content sync:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Schedule periodic sync
 */
function startPeriodicSync(intervalHours = 6) {
  const intervalMs = intervalHours * 60 * 60 * 1000;
  
  console.log(`⏰ Scheduled trending content sync every ${intervalHours} hours`);
  
  // Run initial sync immediately
  syncTrendingContent();
  
  // Then run periodically
  setInterval(async () => {
    console.log(`\n⏰ Scheduled sync triggered (every ${intervalHours} hours)`);
    await syncTrendingContent();
  }, intervalMs);
}

// Export functions for use in other modules
module.exports = {
  syncTrendingContent,
  syncTrendingMovies,
  syncTrendingTVShows,
  startPeriodicSync
};

// If run directly, start periodic sync
if (require.main === module) {
  const syncIntervalHours = parseInt(process.env.TMDB_SYNC_INTERVAL_HOURS || '6');
  startPeriodicSync(syncIntervalHours);
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n👋 Shutting down TMDB sync service...');
    if (db) {
      db.close();
    }
    process.exit(0);
  });
}
