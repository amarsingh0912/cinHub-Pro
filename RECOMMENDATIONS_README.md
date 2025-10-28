# CineHub Recommendations Service

A zero-cost, rule-based movie recommendations microservice integrated into CineHub. This service uses SQLite for local storage and provides intelligent movie recommendations based on trending scores, genre similarity, and user viewing history.

## Features

- **Trending Movies**: Algorithm-based trending score using views, likes, and time decay
- **Similar Movies**: Genre-based similarity recommendations  
- **Personalized Recommendations**: User viewing history-based suggestions
- **Precomputed Caching**: Optional performance optimization for faster responses
- **Zero External Costs**: All computation done locally with SQLite

## Quick Start

### 1. Setup & Seed Database

```bash
# Navigate to server directory
cd server

# Run seed script to populate sample data (10 movies, 3 users, interactions)
node seed.cjs
```

Expected output:
```
✓ Schema initialized
✓ Inserted 10 movies
✓ Inserted 23 interactions
✓ Computed popularity for 8 movies
✅ Database seeded successfully!
```

### 2. (Optional) Precompute Recommendations

For better performance, precompute recommendations:

```bash
node precompute.cjs
```

This generates cached recommendations for all movies and stores them in the database.

### 3. Start the Server

The recommendations API is already integrated into the main CineHub server:

```bash
# From project root
npm run dev
```

The server will start and the recommendations API will be available at `/api/recs/*` endpoints.

## API Endpoints

### 1. Get Trending Movies

Returns top 20 movies ranked by trending score.

**Formula**: `(likes × 2 + views) / (age_hours + 2)`

```bash
GET /api/recs/trending

# Example
curl http://localhost:5000/api/recs/trending
```

**Response**:
```json
[
  {
    "id": 2,
    "title": "Inception",
    "poster_url": "https://image.tmdb.org/t/p/w500/...",
    "year": 2010,
    "genres": "Action,Sci-Fi,Thriller",
    "description": "A thief who steals corporate secrets...",
    "views": 3,
    "likes": 2,
    "avg_rating": 9
  },
  ...
]
```

### 2. Get Similar Movies

Returns top 12 movies with overlapping genres, ordered by popularity.

```bash
GET /api/recs/similar/:movieId

# Example: Get movies similar to The Dark Knight (ID: 1)
curl http://localhost:5000/api/recs/similar/1
```

**Response**: Array of movie objects similar to the trending endpoint.

### 3. Get Personalized Recommendations

Returns movies similar to the user's most recently viewed movie, excluding already-watched content.

```bash
GET /api/recs/because/:userId

# Example: Get recommendations for user_1
curl http://localhost:5000/api/recs/because/user_1
```

**Response**: Array of movie objects tailored to the user's viewing history.

### 4. Health Check

Check the recommendations service status.

```bash
GET /api/recs/health

curl http://localhost:5000/api/recs/health
```

## Frontend Integration

### Using the RecommendationCarousel Component

The `RecommendationCarousel` component is a ready-to-use React component for displaying recommendations.

**Import the component**:
```jsx
import RecommendationCarousel from '@/components/RecommendationCarousel';
```

**Basic usage**:
```jsx
function MoviePage({ movieId }) {
  return (
    <div>
      <h1>Movie Details</h1>
      
      {/* Trending movies */}
      <RecommendationCarousel 
        title="Trending Now" 
        endpoint="/api/recs/trending"
        onMovieClick={(movie) => navigate(`/movie/${movie.id}`)}
      />
      
      {/* Similar movies */}
      <RecommendationCarousel 
        title="Similar Movies" 
        endpoint={`/api/recs/similar/${movieId}`}
        onMovieClick={(movie) => navigate(`/movie/${movie.id}`)}
      />
      
      {/* Personalized recommendations */}
      <RecommendationCarousel 
        title="Because You Watched" 
        endpoint={`/api/recs/because/${userId}`}
        onMovieClick={(movie) => navigate(`/movie/${movie.id}`)}
      />
    </div>
  );
}
```

**Props**:
- `title` (string): Section heading text
- `endpoint` (string): API endpoint to fetch recommendations from
- `onMovieClick` (function, optional): Callback when a movie poster is clicked

**Features**:
- Automatic loading states with skeleton UI
- Error handling with user-friendly messages
- Empty state fallback for no results
- Horizontal scrolling with left/right navigation buttons
- Responsive design with Tailwind CSS
- Dark mode support

## Database Schema

### Movies Table
```sql
CREATE TABLE movies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  year INTEGER,
  genres TEXT,              -- CSV: "Action,Thriller,Drama"
  directors TEXT,           -- CSV
  cast TEXT,                -- CSV
  description TEXT,
  poster_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Interactions Table
```sql
CREATE TABLE interactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  movie_id INTEGER NOT NULL,
  event_type TEXT NOT NULL, -- 'view', 'like', 'rating', 'watchlist_add'
  rating INTEGER,           -- 1-10 scale
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Movie Popularity Table
```sql
CREATE TABLE movie_popularity (
  movie_id INTEGER PRIMARY KEY,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  avg_rating REAL,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Precomputed Recommendations Table
```sql
CREATE TABLE precomputed_recs (
  key TEXT PRIMARY KEY,           -- 'trending' or 'similar_<movie_id>'
  movie_ids TEXT NOT NULL,        -- CSV: "1,5,8,12"
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Customization

### Adjusting Trending Score Weights

Edit `server/recs-api.cjs` to modify the trending formula:

```javascript
// Current formula: (likes * 2 + views) / (age_hours + 2)
// Adjust these weights:
const score = (likes * 2 + views) / (ageHours + 2);

// Examples:
// More weight on likes: (likes * 5 + views) / (ageHours + 2)
// Faster time decay: (likes * 2 + views) / (ageHours + 1)
// Slower time decay: (likes * 2 + views) / (ageHours + 10)
```

### Adding More Interactions

You can track additional user interactions by inserting into the `interactions` table:

```javascript
const Database = require('better-sqlite3');
const db = new Database('server/cinehub.db');

// Add a view event
db.prepare(`
  INSERT INTO interactions (user_id, movie_id, event_type)
  VALUES (?, ?, 'view')
`).run('user_1', 5);

// Add a like
db.prepare(`
  INSERT INTO interactions (user_id, movie_id, event_type)
  VALUES (?, ?, 'like')
`).run('user_1', 5);

// Add a rating
db.prepare(`
  INSERT INTO interactions (user_id, movie_id, event_type, rating)
  VALUES (?, ?, 'rating', ?)
`).run('user_1', 5, 8);

// Update popularity after adding interactions
db.exec(`
  INSERT OR REPLACE INTO movie_popularity (movie_id, views, likes, avg_rating)
  SELECT 
    movie_id,
    SUM(CASE WHEN event_type = 'view' THEN 1 ELSE 0 END) as views,
    SUM(CASE WHEN event_type = 'like' THEN 1 ELSE 0 END) as likes,
    AVG(CASE WHEN event_type = 'rating' THEN rating ELSE NULL END) as avg_rating
  FROM interactions
  GROUP BY movie_id
`);
```

### Re-seeding the Database

To start fresh with new sample data:

```bash
cd server
node seed.cjs        # Clears and re-seeds database
node precompute.cjs  # Regenerate precomputed recommendations
```

## Testing

### Manual Testing

Use the provided `test.sh` script for smoke testing:

```bash
# Make script executable
chmod +x test.sh

# Run tests
./test.sh
```

### Manual cURL Tests

```bash
# Test trending endpoint
curl http://localhost:5000/api/recs/trending | jq

# Test similar movies (movie ID 1)
curl http://localhost:5000/api/recs/similar/1 | jq

# Test personalized recommendations (user_1)
curl http://localhost:5000/api/recs/because/user_1 | jq

# Test health endpoint
curl http://localhost:5000/api/recs/health | jq
```

## Performance Optimization

### Use Precomputed Recommendations

For production, run the precompute script regularly (e.g., via cron job):

```bash
# Regenerate every hour
0 * * * * cd /path/to/server && node precompute.cjs
```

### In-Memory Caching

The API automatically falls back to on-the-fly computation if precomputed data is missing. For additional speed, consider:

1. Running `precompute.cjs` after significant interaction changes
2. Using the precomputed_recs table for instant responses
3. Implementing an in-memory cache (Redis, Node-cache) if needed

## File Structure

```
server/
├── cinehub.db           # SQLite database (created after seed)
├── schema.sql           # Database schema definition
├── recs-api.cjs         # Express API routes & logic
├── seed.cjs             # Database seeding script
├── precompute.cjs       # Recommendation precomputation script
└── routes.ts            # Main server (integrates recs-api)

client/src/components/
└── RecommendationCarousel.jsx  # React carousel component

test.sh                  # Smoke testing script
RECOMMENDATIONS_README.md # This file
```

## Security & Privacy

- **Sample Data Only**: Seed script uses non-sensitive test user IDs (`user_1`, `user_2`, `user_3`)
- **Local Storage**: All data stored locally in SQLite (no external services)
- **Minimal Logging**: Only errors are logged to console
- **CORS**: Already configured in main server
- **Read-Only API**: All endpoints are GET requests with no state changes

### Data Retention

To implement data retention policies, add to your cron:

```bash
# Delete interactions older than 90 days
sqlite3 server/cinehub.db "DELETE FROM interactions WHERE created_at < datetime('now', '-90 days')"

# Recompute popularity
cd server && node precompute.cjs
```

## Troubleshooting

### Database Not Found

```bash
# Ensure you've run the seed script
cd server
node seed.cjs
```

### Empty Results

1. Check that the database has data: `sqlite3 server/cinehub.db "SELECT COUNT(*) FROM movies;"`
2. Verify the API endpoint is correct
3. Check server logs for errors

### "No recommendations available"

This means the database query returned no results. Common causes:
- User has no viewing history (for `/because/:userId`)
- Movie has no matching genres (for `/similar/:movieId`)
- Database hasn't been seeded

## Production Deployment

1. **Environment Variables**: None required (all local)
2. **Database Location**: Update `dbPath` in `recs-api.cjs` if needed
3. **Cron Jobs**: Set up periodic precomputation for best performance
4. **Monitoring**: Check `/api/recs/health` for service status

## Next Steps

- Integrate with actual CineHub user activity tracking
- Connect movie IDs to TMDB data
- Add more sophisticated algorithms (collaborative filtering, content-based)
- Implement A/B testing for different recommendation strategies
- Add analytics to track recommendation click-through rates

## License

Part of the CineHub project.
