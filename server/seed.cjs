// CineHub Recommendations Database Seeder
// Populates the database with sample movies and interactions for testing

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'cinehub.db');
const db = new Database(dbPath);

// Initialize schema
const schemaPath = path.join(__dirname, 'schema.sql');
if (fs.existsSync(schemaPath)) {
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);
  console.log('✓ Schema initialized');
}

// Sample movie data - 10 movies covering Action, Drama, Comedy, Sci-Fi genres
const movies = [
  {
    title: 'The Dark Knight',
    year: 2008,
    genres: 'Action,Crime,Drama',
    directors: 'Christopher Nolan',
    cast: 'Christian Bale,Heath Ledger,Aaron Eckhart',
    description: 'When the menace known as the Joker wreaks havoc on Gotham, Batman must accept one of the greatest tests.',
    poster_url: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg'
  },
  {
    title: 'Inception',
    year: 2010,
    genres: 'Action,Sci-Fi,Thriller',
    directors: 'Christopher Nolan',
    cast: 'Leonardo DiCaprio,Joseph Gordon-Levitt,Ellen Page',
    description: 'A thief who steals corporate secrets through dream-sharing technology is given the inverse task.',
    poster_url: 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg'
  },
  {
    title: 'The Shawshank Redemption',
    year: 1994,
    genres: 'Drama,Crime',
    directors: 'Frank Darabont',
    cast: 'Tim Robbins,Morgan Freeman,Bob Gunton',
    description: 'Two imprisoned men bond over years, finding solace and eventual redemption through acts of common decency.',
    poster_url: 'https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg'
  },
  {
    title: 'The Matrix',
    year: 1999,
    genres: 'Action,Sci-Fi',
    directors: 'Lana Wachowski,Lilly Wachowski',
    cast: 'Keanu Reeves,Laurence Fishburne,Carrie-Anne Moss',
    description: 'A computer hacker learns about the true nature of reality and his role in the war against its controllers.',
    poster_url: 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg'
  },
  {
    title: 'Forrest Gump',
    year: 1994,
    genres: 'Drama,Romance',
    directors: 'Robert Zemeckis',
    cast: 'Tom Hanks,Robin Wright,Gary Sinise',
    description: 'The presidencies of Kennedy and Johnson unfold through the perspective of an Alabama man.',
    poster_url: 'https://image.tmdb.org/t/p/w500/saHP97rTPS5eLmrLQEcANmKrsFl.jpg'
  },
  {
    title: 'The Grand Budapest Hotel',
    year: 2014,
    genres: 'Comedy,Drama',
    directors: 'Wes Anderson',
    cast: 'Ralph Fiennes,F. Murray Abraham,Mathieu Amalric',
    description: 'A writer encounters the owner of an aging high-class hotel, who tells of his early years.',
    poster_url: 'https://image.tmdb.org/t/p/w500/eWdyYQreja6JGCzqHWXpWHDrrPo.jpg'
  },
  {
    title: 'Interstellar',
    year: 2014,
    genres: 'Sci-Fi,Drama,Adventure',
    directors: 'Christopher Nolan',
    cast: 'Matthew McConaughey,Anne Hathaway,Jessica Chastain',
    description: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.',
    poster_url: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg'
  },
  {
    title: 'Pulp Fiction',
    year: 1994,
    genres: 'Crime,Drama',
    directors: 'Quentin Tarantino',
    cast: 'John Travolta,Uma Thurman,Samuel L. Jackson',
    description: 'The lives of two mob hitmen, a boxer, a gangster and his wife intertwine in four tales of violence.',
    poster_url: 'https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg'
  },
  {
    title: 'The Hangover',
    year: 2009,
    genres: 'Comedy',
    directors: 'Todd Phillips',
    cast: 'Bradley Cooper,Ed Helms,Zach Galifianakis',
    description: 'Three buddies wake up from a bachelor party in Las Vegas with no memory of the previous night.',
    poster_url: 'https://image.tmdb.org/t/p/w500/uluhlXubGu1VxU63X9YLYASXD46.jpg'
  },
  {
    title: 'Blade Runner 2049',
    year: 2017,
    genres: 'Sci-Fi,Thriller,Mystery',
    directors: 'Denis Villeneuve',
    cast: 'Ryan Gosling,Harrison Ford,Ana de Armas',
    description: 'A young blade runner discovers a secret that leads him to track down former blade runner Rick Deckard.',
    poster_url: 'https://image.tmdb.org/t/p/w500/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg'
  }
];

// Sample user interactions - 3 users with various engagement patterns
const interactions = [
  // user_1: Action/Sci-Fi fan
  { user_id: 'user_1', movie_id: 1, event_type: 'view' },
  { user_id: 'user_1', movie_id: 1, event_type: 'like' },
  { user_id: 'user_1', movie_id: 2, event_type: 'view' },
  { user_id: 'user_1', movie_id: 2, event_type: 'like' },
  { user_id: 'user_1', movie_id: 2, event_type: 'rating', rating: 9 },
  { user_id: 'user_1', movie_id: 4, event_type: 'view' },
  { user_id: 'user_1', movie_id: 4, event_type: 'like' },
  { user_id: 'user_1', movie_id: 7, event_type: 'view' },
  
  // user_2: Drama enthusiast
  { user_id: 'user_2', movie_id: 3, event_type: 'view' },
  { user_id: 'user_2', movie_id: 3, event_type: 'like' },
  { user_id: 'user_2', movie_id: 3, event_type: 'rating', rating: 10 },
  { user_id: 'user_2', movie_id: 5, event_type: 'view' },
  { user_id: 'user_2', movie_id: 5, event_type: 'like' },
  { user_id: 'user_2', movie_id: 8, event_type: 'view' },
  { user_id: 'user_2', movie_id: 6, event_type: 'view' },
  
  // user_3: Mixed preferences
  { user_id: 'user_3', movie_id: 9, event_type: 'view' },
  { user_id: 'user_3', movie_id: 9, event_type: 'like' },
  { user_id: 'user_3', movie_id: 1, event_type: 'view' },
  { user_id: 'user_3', movie_id: 10, event_type: 'view' },
  { user_id: 'user_3', movie_id: 10, event_type: 'rating', rating: 8 },
  { user_id: 'user_3', movie_id: 6, event_type: 'like' },
  { user_id: 'user_3', movie_id: 7, event_type: 'view' },
];

// Clear existing data
console.log('\n🗑️  Clearing existing data...');
db.prepare('DELETE FROM precomputed_recs').run();
db.prepare('DELETE FROM movie_popularity').run();
db.prepare('DELETE FROM interactions').run();
db.prepare('DELETE FROM movies').run();

// Insert movies
console.log('🎬 Inserting movies...');
const insertMovie = db.prepare(`
  INSERT INTO movies (title, year, genres, directors, cast, description, poster_url)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const insertMany = db.transaction((movies) => {
  for (const movie of movies) {
    insertMovie.run(
      movie.title,
      movie.year,
      movie.genres,
      movie.directors,
      movie.cast,
      movie.description,
      movie.poster_url
    );
  }
});

insertMany(movies);
console.log(`✓ Inserted ${movies.length} movies`);

// Insert interactions
console.log('👥 Inserting interactions...');
const insertInteraction = db.prepare(`
  INSERT INTO interactions (user_id, movie_id, event_type, rating)
  VALUES (?, ?, ?, ?)
`);

const insertInteractions = db.transaction((interactions) => {
  for (const interaction of interactions) {
    insertInteraction.run(
      interaction.user_id,
      interaction.movie_id,
      interaction.event_type,
      interaction.rating || null
    );
  }
});

insertInteractions(interactions);
console.log(`✓ Inserted ${interactions.length} interactions`);

// Populate movie_popularity from interactions
console.log('📊 Computing movie popularity...');
const popularityQuery = db.prepare(`
  INSERT INTO movie_popularity (movie_id, views, likes, avg_rating)
  SELECT 
    movie_id,
    SUM(CASE WHEN event_type = 'view' THEN 1 ELSE 0 END) as views,
    SUM(CASE WHEN event_type = 'like' THEN 1 ELSE 0 END) as likes,
    AVG(CASE WHEN event_type = 'rating' THEN rating ELSE NULL END) as avg_rating
  FROM interactions
  GROUP BY movie_id
`);

popularityQuery.run();

const popularityCount = db.prepare('SELECT COUNT(*) as count FROM movie_popularity').get();
console.log(`✓ Computed popularity for ${popularityCount.count} movies`);

// Display summary
console.log('\n📈 Database Summary:');
const stats = db.prepare(`
  SELECT 
    (SELECT COUNT(*) FROM movies) as movies,
    (SELECT COUNT(*) FROM interactions) as interactions,
    (SELECT COUNT(*) FROM movie_popularity) as popularity_entries,
    (SELECT COUNT(DISTINCT user_id) FROM interactions) as users
`).get();

console.log(`   Movies: ${stats.movies}`);
console.log(`   Users: ${stats.users}`);
console.log(`   Interactions: ${stats.interactions}`);
console.log(`   Popularity entries: ${stats.popularity_entries}`);

// Display top trending movies
console.log('\n🔥 Top Trending Movies:');
const trending = db.prepare(`
  SELECT m.title, p.views, p.likes
  FROM movies m
  LEFT JOIN movie_popularity p ON m.id = p.movie_id
  ORDER BY (COALESCE(p.likes, 0) * 2 + COALESCE(p.views, 0)) DESC
  LIMIT 5
`).all();

trending.forEach((movie, index) => {
  console.log(`   ${index + 1}. ${movie.title} (${movie.views || 0} views, ${movie.likes || 0} likes)`);
});

console.log('\n✅ Database seeded successfully!');
console.log('💡 Run "node precompute.js" to generate precomputed recommendations');

db.close();
