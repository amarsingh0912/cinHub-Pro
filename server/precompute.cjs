// CineHub Recommendations Precompute Script
// Generates and caches precomputed recommendations for faster API response times

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'cinehub.db');
const db = new Database(dbPath);

console.log('🔄 Starting recommendations precomputation...\n');

/**
 * Calculate trending score for a movie
 * Formula: (likes * 2 + views) / (age_hours + 2)
 */
function calculateTrendingScore(movie, popularity) {
  const likes = popularity?.likes || 0;
  const views = popularity?.views || 0;
  const createdAt = new Date(movie.created_at);
  const ageHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
  
  const score = (likes * 2 + views) / (ageHours + 2);
  return score;
}

/**
 * Check if two movies share genres
 */
function hasOverlappingGenres(genres1, genres2) {
  if (!genres1 || !genres2) return false;
  const g1 = genres1.split(',').map(g => g.trim().toLowerCase());
  const g2 = genres2.split(',').map(g => g.trim().toLowerCase());
  return g1.some(genre => g2.includes(genre));
}

// ==================== PRECOMPUTE TRENDING ====================

console.log('🔥 Computing trending movies...');

const moviesWithPopularity = db.prepare(`
  SELECT m.*, p.views, p.likes, p.avg_rating
  FROM movies m
  LEFT JOIN movie_popularity p ON m.id = p.movie_id
  ORDER BY m.id
`).all();

const scored = moviesWithPopularity.map(movie => {
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

const topTrending = scored.slice(0, 20);
const trendingIds = topTrending.map(m => m.id).join(',');

// Store trending recommendations
const upsertPrecomputed = db.prepare(`
  INSERT INTO precomputed_recs (key, movie_ids, last_updated)
  VALUES (?, ?, CURRENT_TIMESTAMP)
  ON CONFLICT(key) DO UPDATE SET
    movie_ids = excluded.movie_ids,
    last_updated = CURRENT_TIMESTAMP
`);

upsertPrecomputed.run('trending', trendingIds);
console.log(`✓ Stored top ${topTrending.length} trending movies`);

// ==================== PRECOMPUTE SIMILAR MOVIES ====================

console.log('\n🎯 Computing similar movies for each movie...');

const allMovies = db.prepare(`
  SELECT m.*, p.views, p.likes, p.avg_rating
  FROM movies m
  LEFT JOIN movie_popularity p ON m.id = p.movie_id
`).all();

let similarCount = 0;

for (const movie of allMovies) {
  if (!movie.genres) {
    continue;
  }
  
  // Find similar movies
  const similar = allMovies
    .filter(m => m.id !== movie.id && hasOverlappingGenres(movie.genres, m.genres))
    .map(m => ({
      ...m,
      popularity_score: (m.likes || 0) + (m.views || 0)
    }))
    .sort((a, b) => b.popularity_score - a.popularity_score)
    .slice(0, 12);
  
  if (similar.length > 0) {
    const similarIds = similar.map(m => m.id).join(',');
    upsertPrecomputed.run(`similar_${movie.id}`, similarIds);
    similarCount++;
    console.log(`   ✓ ${movie.title}: ${similar.length} similar movies`);
  }
}

console.log(`\n✓ Precomputed similar recommendations for ${similarCount} movies`);

// ==================== SUMMARY ====================

console.log('\n📊 Precomputation Summary:');
const precomputedCount = db.prepare('SELECT COUNT(*) as count FROM precomputed_recs').get();
console.log(`   Total precomputed entries: ${precomputedCount.count}`);

const precomputedRecs = db.prepare('SELECT key FROM precomputed_recs ORDER BY key').all();
console.log('\n   Cached recommendations:');
precomputedRecs.forEach(rec => {
  console.log(`   - ${rec.key}`);
});

console.log('\n✅ Precomputation complete!');
console.log('💡 API endpoints will now use cached recommendations for faster responses');

db.close();
