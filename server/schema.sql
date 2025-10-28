-- CineHub Recommendations Database Schema
-- SQLite database for rule-based movie recommendations

-- Movies table: core movie data
CREATE TABLE IF NOT EXISTS movies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  year INTEGER,
  genres TEXT, -- comma-separated genres (e.g., "Action,Thriller,Drama")
  directors TEXT, -- comma-separated directors
  cast TEXT, -- comma-separated cast members
  description TEXT,
  poster_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Interactions table: user engagement events
-- event_type: 'view', 'like', 'rating', 'watchlist_add'
CREATE TABLE IF NOT EXISTS interactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  movie_id INTEGER NOT NULL,
  event_type TEXT NOT NULL, -- 'view', 'like', 'rating', 'watchlist_add'
  rating INTEGER, -- 1-10 scale, NULL for non-rating events
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (movie_id) REFERENCES movies(id)
);

-- Movie popularity metrics: aggregated engagement data
-- Updated periodically or after interactions
CREATE TABLE IF NOT EXISTS movie_popularity (
  movie_id INTEGER PRIMARY KEY,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  avg_rating REAL, -- average user rating
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (movie_id) REFERENCES movies(id)
);

-- Precomputed recommendations: cached similarity results
-- key format: "similar_<movie_id>" or "trending"
-- movie_ids: comma-separated list of movie IDs
CREATE TABLE IF NOT EXISTS precomputed_recs (
  key TEXT PRIMARY KEY,
  movie_ids TEXT NOT NULL, -- comma-separated movie IDs
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_interactions_user ON interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_movie ON interactions(movie_id);
CREATE INDEX IF NOT EXISTS idx_interactions_type ON interactions(event_type);
CREATE INDEX IF NOT EXISTS idx_interactions_created ON interactions(created_at);
CREATE INDEX IF NOT EXISTS idx_movies_genres ON movies(genres);
