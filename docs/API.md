# API Documentation

Complete API reference for CineHub Pro backend endpoints.

## Base URL

```
Development: http://localhost:5000/api
Production: https://your-domain.com/api
```

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Authentication Endpoints

#### Sign Up
```http
POST /api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "username": "johndoe"
}
```

**Response:**
```json
{
  "message": "User created successfully. Please verify your email.",
  "userId": "uuid"
}
```

#### Sign In
```http
POST /api/auth/signin
Content-Type: application/json

{
  "identifier": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "isAdmin": false
  }
}
```

#### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

**Response:**
```json
{
  "accessToken": "new-jwt-token"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "johndoe",
  "isAdmin": false,
  "profilePicture": "url"
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

### OTP Verification

#### Request OTP
```http
POST /api/auth/request-otp
Content-Type: application/json

{
  "target": "user@example.com",
  "purpose": "signup" // or "reset" or "login"
}
```

#### Verify OTP
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "target": "user@example.com",
  "code": "123456",
  "purpose": "signup"
}
```

## Movies API

### Get Trending Movies
```http
GET /api/movies/trending?page=1&time_window=day
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `time_window` (optional): "day" or "week" (default: "day")

**Response:**
```json
{
  "page": 1,
  "results": [
    {
      "id": 550,
      "title": "Fight Club",
      "overview": "...",
      "poster_path": "/path.jpg",
      "backdrop_path": "/path.jpg",
      "vote_average": 8.4,
      "release_date": "1999-10-15"
    }
  ],
  "total_pages": 100,
  "total_results": 2000
}
```

### Get Popular Movies
```http
GET /api/movies/popular?page=1
```

### Get Upcoming Movies
```http
GET /api/movies/upcoming?page=1
```

### Get Now Playing Movies
```http
GET /api/movies/now-playing?page=1
```

### Get Top Rated Movies
```http
GET /api/movies/top-rated?page=1
```

### Get Movie Details
```http
GET /api/movies/:id
```

**Response:**
```json
{
  "id": 550,
  "title": "Fight Club",
  "overview": "...",
  "runtime": 139,
  "release_date": "1999-10-15",
  "genres": [
    { "id": 18, "name": "Drama" }
  ],
  "credits": {
    "cast": [...],
    "crew": [...]
  },
  "videos": {
    "results": [...]
  },
  "similar": [...],
  "recommendations": [...]
}
```

### Advanced Movie Discovery
```http
GET /api/movies/discover
```

**Query Parameters (all optional):**

**Pagination & Sorting:**
- `page`: Page number
- `sort_by`: Sort by field (e.g., "popularity.desc", "vote_average.desc")

**Date Filters:**
- `primary_release_date.gte`: Minimum release date (YYYY-MM-DD)
- `primary_release_date.lte`: Maximum release date (YYYY-MM-DD)
- `release_date.gte`: Minimum any release date
- `release_date.lte`: Maximum any release date
- `primary_release_year`: Filter by release year
- `year`: Filter by any release year

**Rating & Votes:**
- `vote_average.gte`: Minimum rating (0-10)
- `vote_average.lte`: Maximum rating (0-10)
- `vote_count.gte`: Minimum vote count
- `vote_count.lte`: Maximum vote count

**Genre & Keywords:**
- `with_genres`: Include genres (comma-separated IDs or pipe-separated for OR)
- `without_genres`: Exclude genres
- `with_keywords`: Include keywords
- `without_keywords`: Exclude keywords

**People (Cast & Crew):**
- `with_cast`: Filter by cast member IDs
- `with_crew`: Filter by crew member IDs
- `with_people`: Filter by any person ID

**Runtime:**
- `with_runtime.gte`: Minimum runtime (minutes)
- `with_runtime.lte`: Maximum runtime (minutes)

**Language & Region:**
- `language`: ISO 639-1 language code
- `with_original_language`: Original language
- `region`: ISO 3166-1 region code
- `watch_region`: Streaming availability region

**Streaming:**
- `with_watch_providers`: Streaming provider IDs
- `with_watch_monetization_types`: "flatrate", "free", "ads", "rent", "buy"

**Content:**
- `include_adult`: Include adult content (boolean)
- `include_video`: Include videos (boolean)
- `certification_country`: Certification country code
- `certification`: Certification (e.g., "PG-13")

**Example:**
```http
GET /api/movies/discover?sort_by=popularity.desc&with_genres=28,12&vote_average.gte=7&primary_release_year=2024
```

### Search Movies
```http
GET /api/movies/search?query=fight+club&page=1
```

**Query Parameters:**
- `query`: Search query (required)
- `page`: Page number (optional)

## TV Shows API

### Get Trending TV Shows
```http
GET /api/tv/trending?page=1&time_window=week
```

### Get Popular TV Shows
```http
GET /api/tv/popular?page=1
```

### Get Top Rated TV Shows
```http
GET /api/tv/top-rated?page=1
```

### Get Airing Today
```http
GET /api/tv/airing-today?page=1
```

### Get On The Air
```http
GET /api/tv/on-the-air?page=1
```

### Get TV Show Details
```http
GET /api/tv/:id
```

**Response:**
```json
{
  "id": 1399,
  "name": "Game of Thrones",
  "overview": "...",
  "first_air_date": "2011-04-17",
  "number_of_seasons": 8,
  "number_of_episodes": 73,
  "genres": [...],
  "credits": {...},
  "videos": {...}
}
```

### Advanced TV Discovery
```http
GET /api/tv/discover
```

**Query Parameters (similar to movies with TV-specific additions):**

**TV-Specific:**
- `first_air_date.gte`: Minimum first air date
- `first_air_date.lte`: Maximum first air date
- `air_date.gte`: Minimum air date
- `air_date.lte`: Maximum air date
- `first_air_date_year`: First air year
- `with_networks`: Network IDs
- `with_status`: Show status (e.g., "Returning Series", "Ended")
- `with_type`: Show type (e.g., "Scripted", "Reality")
- `screened_theatrically`: Has theatrical screening (boolean)
- `timezone`: Timezone for air dates

### Search TV Shows
```http
GET /api/tv/search?query=game+of+thrones&page=1
```

## Favorites API

### Get User Favorites
```http
GET /api/favorites
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "mediaType": "movie",
    "mediaId": 550,
    "mediaTitle": "Fight Club",
    "mediaPosterPath": "/path.jpg",
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

### Check Favorite Status
```http
GET /api/favorites/:type/:id/check
Authorization: Bearer <token>
```

**Parameters:**
- `type`: "movie" or "tv"
- `id`: TMDB media ID

**Response:**
```json
{
  "isFavorite": true
}
```

### Add to Favorites
```http
POST /api/favorites
Authorization: Bearer <token>
Content-Type: application/json

{
  "mediaType": "movie",
  "mediaId": 550,
  "mediaTitle": "Fight Club",
  "mediaPosterPath": "/path.jpg",
  "mediaReleaseDate": "1999-10-15"
}
```

### Remove from Favorites
```http
DELETE /api/favorites/:type/:id
Authorization: Bearer <token>
```

## Watchlists API

### Get User Watchlists
```http
GET /api/watchlists
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "name": "Watch Later",
    "description": "Movies to watch",
    "isPublic": false,
    "createdAt": "2024-01-01T00:00:00Z",
    "items": [...]
  }
]
```

### Get Watchlist by ID
```http
GET /api/watchlists/:id
Authorization: Bearer <token>
```

### Create Watchlist
```http
POST /api/watchlists
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Watch Later",
  "description": "Movies to watch this weekend",
  "isPublic": false
}
```

### Update Watchlist
```http
PUT /api/watchlists/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "description": "Updated description"
}
```

### Delete Watchlist
```http
DELETE /api/watchlists/:id
Authorization: Bearer <token>
```

### Add Item to Watchlist
```http
POST /api/watchlists/:id/items
Authorization: Bearer <token>
Content-Type: application/json

{
  "mediaType": "movie",
  "mediaId": 550,
  "mediaTitle": "Fight Club",
  "mediaPosterPath": "/path.jpg",
  "mediaReleaseDate": "1999-10-15"
}
```

### Remove Item from Watchlist
```http
DELETE /api/watchlists/:watchlistId/items/:itemId
Authorization: Bearer <token>
```

## Reviews API

### Get Reviews for Media
```http
GET /api/reviews/:type/:id
```

**Parameters:**
- `type`: "movie" or "tv"
- `id`: TMDB media ID

**Response:**
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "username": "johndoe",
    "mediaType": "movie",
    "mediaId": 550,
    "rating": 9,
    "review": "Great movie!",
    "isPublic": true,
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

### Create Review
```http
POST /api/reviews
Authorization: Bearer <token>
Content-Type: application/json

{
  "mediaType": "movie",
  "mediaId": 550,
  "rating": 9,
  "review": "Excellent movie with great plot twists!",
  "isPublic": true
}
```

### Update Review
```http
PUT /api/reviews/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "rating": 10,
  "review": "Updated review text"
}
```

### Delete Review
```http
DELETE /api/reviews/:id
Authorization: Bearer <token>
```

## User Profile API

### Get User Profile
```http
GET /api/user/profile
Authorization: Bearer <token>
```

### Update Profile
```http
PUT /api/user/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "newusername",
  "email": "newemail@example.com",
  "profilePicture": "cloudinary-url"
}
```

### Upload Profile Picture
```http
POST /api/user/upload-avatar
Authorization: Bearer <token>
Content-Type: multipart/form-data

avatar: <file>
```

**Response:**
```json
{
  "url": "https://res.cloudinary.com/..."
}
```

## Activity & History API

### Get Viewing History
```http
GET /api/viewing-history
Authorization: Bearer <token>
```

### Get Activity History
```http
GET /api/activity-history
Authorization: Bearer <token>
```

### Get Search History
```http
GET /api/search-history
Authorization: Bearer <token>
```

## Admin API

### Get All Users (Admin Only)
```http
GET /api/admin/users?page=1&limit=20
Authorization: Bearer <admin-token>
```

### Get Platform Stats (Admin Only)
```http
GET /api/admin/stats
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "totalUsers": 1000,
  "totalMovies": 5000,
  "totalReviews": 15000,
  "totalWatchlists": 3000
}
```

## Cache Status API

### Get Cache Status
```http
GET /api/cache-status/:type/:id
```

**Parameters:**
- `type`: "movie" or "tv"
- `id`: TMDB media ID

**Response:**
```json
{
  "jobId": "uuid",
  "status": "processing",
  "progress": "50%"
}
```

### WebSocket Connection

Connect to real-time cache updates:

```javascript
const ws = new WebSocket('ws://localhost:5000/ws/cache-status');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Cache status:', data);
};
```

## Error Responses

All endpoints return errors in the following format:

```json
{
  "message": "Error description",
  "error": "Detailed error information (dev only)"
}
```

### Common Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required or invalid
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists
- `422 Unprocessable Entity` - Validation error
- `500 Internal Server Error` - Server error

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **General endpoints**: 100 requests per 15 minutes per IP
- **Authentication endpoints**: 5 requests per 15 minutes per IP
- **Search endpoints**: 30 requests per minute per IP

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Pagination

List endpoints support pagination:

**Request:**
```http
GET /api/movies/popular?page=2&limit=20
```

**Response includes:**
```json
{
  "page": 2,
  "total_pages": 100,
  "total_results": 2000,
  "results": [...]
}
```

## Filtering & Sorting

Most list endpoints support filtering and sorting:

**Sorting:**
- `sort_by=popularity.desc`
- `sort_by=vote_average.asc`
- `sort_by=release_date.desc`

**Filtering:**
- Use query parameters specific to each endpoint
- Multiple values can be comma-separated or pipe-separated
- Comma (`,`) = AND logic
- Pipe (`|`) = OR logic

**Example:**
```http
GET /api/movies/discover?with_genres=28|12&vote_average.gte=7
```
(Movies with genre 28 OR 12, AND rating >= 7)
