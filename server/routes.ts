import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { z } from "zod";
import {
  insertWatchlistSchema,
  insertWatchlistItemSchema,
  insertFavoriteSchema,
  insertReviewSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // TMDB proxy endpoints (to avoid CORS and secure API key)
  app.get('/api/movies/trending', async (req, res) => {
    try {
      const timeWindow = req.query.time_window || 'week';
      if (!process.env.TMDB_API_KEY) {
        return res.status(500).json({ message: 'TMDB API key not configured' });
      }
      const response = await fetch(
        `https://api.themoviedb.org/3/trending/movie/${timeWindow}?api_key=${process.env.TMDB_API_KEY}`
      );
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error fetching trending movies:', error);
      res.status(500).json({ message: 'Failed to fetch trending movies' });
    }
  });

  app.get('/api/tv/trending', async (req, res) => {
    try {
      const timeWindow = req.query.time_window || 'week';
      if (!process.env.TMDB_API_KEY) {
        return res.status(500).json({ message: 'TMDB API key not configured' });
      }
      const response = await fetch(
        `https://api.themoviedb.org/3/trending/tv/${timeWindow}?api_key=${process.env.TMDB_API_KEY}`
      );
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error fetching trending TV shows:', error);
      res.status(500).json({ message: 'Failed to fetch trending TV shows' });
    }
  });

  app.get('/api/movies/popular', async (req, res) => {
    try {
      if (!process.env.TMDB_API_KEY) {
        return res.status(500).json({ message: 'TMDB API key not configured' });
      }
      const page = req.query.page || 1;
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/popular?api_key=${process.env.TMDB_API_KEY}&page=${page}`
      );
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error fetching popular movies:', error);
      res.status(500).json({ message: 'Failed to fetch popular movies' });
    }
  });

  app.get('/api/movies/top-rated', async (req, res) => {
    try {
      if (!process.env.TMDB_API_KEY) {
        return res.status(500).json({ message: 'TMDB API key not configured' });
      }
      const page = req.query.page || 1;
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/top_rated?api_key=${process.env.TMDB_API_KEY}&page=${page}`
      );
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error fetching top rated movies:', error);
      res.status(500).json({ message: 'Failed to fetch top rated movies' });
    }
  });

  app.get('/api/movies/upcoming', async (req, res) => {
    try {
      if (!process.env.TMDB_API_KEY) {
        return res.status(500).json({ message: 'TMDB API key not configured' });
      }
      const page = req.query.page || 1;
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/upcoming?api_key=${process.env.TMDB_API_KEY}&page=${page}`
      );
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error fetching upcoming movies:', error);
      res.status(500).json({ message: 'Failed to fetch upcoming movies' });
    }
  });

  app.get('/api/movies/now-playing', async (req, res) => {
    try {
      if (!process.env.TMDB_API_KEY) {
        return res.status(500).json({ message: 'TMDB API key not configured' });
      }
      const page = req.query.page || 1;
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/now_playing?api_key=${process.env.TMDB_API_KEY}&page=${page}`
      );
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error fetching now playing movies:', error);
      res.status(500).json({ message: 'Failed to fetch now playing movies' });
    }
  });

  // Comprehensive movie discovery endpoint with all TMDB filters
  app.get('/api/movies/discover', async (req, res) => {
    try {
      if (!process.env.TMDB_API_KEY) {
        return res.status(500).json({ message: 'TMDB API key not configured' });
      }
      const {
        page = 1,
        sort_by = 'popularity.desc',
        with_genres,
        primary_release_year,
        'vote_average.gte': minRating,
        'vote_average.lte': maxRating,
        'vote_count.gte': minVotes,
        'with_runtime.gte': minRuntime,
        'with_runtime.lte': maxRuntime,
        'primary_release_date.gte': releaseDateFrom,
        'primary_release_date.lte': releaseDateTo,
        with_original_language,
        region,
        with_keywords,
        without_genres,
        certification_country,
        'certification.lte': certification
      } = req.query;

      let url = `https://api.themoviedb.org/3/discover/movie?api_key=${process.env.TMDB_API_KEY}&page=${page}&sort_by=${sort_by}`;
      
      // Add optional parameters
      if (with_genres) url += `&with_genres=${with_genres}`;
      if (primary_release_year) url += `&primary_release_year=${primary_release_year}`;
      if (minRating) url += `&vote_average.gte=${minRating}`;
      if (maxRating) url += `&vote_average.lte=${maxRating}`;
      if (minVotes) url += `&vote_count.gte=${minVotes}`;
      if (minRuntime) url += `&with_runtime.gte=${minRuntime}`;
      if (maxRuntime) url += `&with_runtime.lte=${maxRuntime}`;
      if (releaseDateFrom) url += `&primary_release_date.gte=${releaseDateFrom}`;
      if (releaseDateTo) url += `&primary_release_date.lte=${releaseDateTo}`;
      if (with_original_language) url += `&with_original_language=${with_original_language}`;
      if (region) url += `&region=${region}`;
      if (with_keywords) url += `&with_keywords=${with_keywords}`;
      if (without_genres) url += `&without_genres=${without_genres}`;
      if (certification_country) url += `&certification_country=${certification_country}`;
      if (certification) url += `&certification.lte=${certification}`;

      const response = await fetch(url);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error discovering movies:', error);
      res.status(500).json({ message: 'Failed to discover movies' });
    }
  });

  app.get('/api/movies/search', async (req, res) => {
    try {
      if (!process.env.TMDB_API_KEY) {
        return res.status(500).json({ message: 'TMDB API key not configured' });
      }
      const query = req.query.query;
      const page = req.query.page || 1;
      if (!query) {
        return res.status(400).json({ message: 'Search query is required' });
      }
      const response = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(query as string)}&page=${page}`
      );
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error searching movies:', error);
      res.status(500).json({ message: 'Failed to search movies' });
    }
  });

  app.get('/api/movies/:id', async (req, res) => {
    try {
      if (!process.env.TMDB_API_KEY) {
        return res.status(500).json({ message: 'TMDB API key not configured' });
      }
      const movieId = req.params.id;
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/${movieId}?api_key=${process.env.TMDB_API_KEY}&append_to_response=credits,videos,similar`
      );
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error fetching movie details:', error);
      res.status(500).json({ message: 'Failed to fetch movie details' });
    }
  });

  app.get('/api/movies/discover/:category', async (req, res) => {
    try {
      if (!process.env.TMDB_API_KEY) {
        return res.status(500).json({ message: 'TMDB API key not configured' });
      }
      const category = req.params.category;
      const page = req.query.page || 1;
      let url = `https://api.themoviedb.org/3/discover/movie?api_key=${process.env.TMDB_API_KEY}&page=${page}`;
      
      // Map categories to genre IDs
      const genreMap: Record<string, string> = {
        action: '28',
        adventure: '12',
        animation: '16',
        comedy: '35',
        crime: '80',
        documentary: '99',
        drama: '18',
        family: '10751',
        fantasy: '14',
        history: '36',
        horror: '27',
        music: '10402',
        mystery: '9648',
        romance: '10749',
        'science-fiction': '878',
        'tv-movie': '10770',
        thriller: '53',
        war: '10752',
        western: '37'
      };

      if (genreMap[category]) {
        url += `&with_genres=${genreMap[category]}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error fetching movies by category:', error);
      res.status(500).json({ message: 'Failed to fetch movies by category' });
    }
  });

  // Watchlist endpoints
  app.get('/api/watchlists', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const watchlists = await storage.getUserWatchlists(userId);
      res.json(watchlists);
    } catch (error) {
      console.error('Error fetching watchlists:', error);
      res.status(500).json({ message: 'Failed to fetch watchlists' });
    }
  });

  app.post('/api/watchlists', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertWatchlistSchema.parse({ ...req.body, userId });
      const watchlist = await storage.createWatchlist(data);
      res.json(watchlist);
    } catch (error) {
      console.error('Error creating watchlist:', error);
      res.status(500).json({ message: 'Failed to create watchlist' });
    }
  });

  app.get('/api/watchlists/:id/items', isAuthenticated, async (req, res) => {
    try {
      const watchlistId = req.params.id;
      const items = await storage.getWatchlistItems(watchlistId);
      res.json(items);
    } catch (error) {
      console.error('Error fetching watchlist items:', error);
      res.status(500).json({ message: 'Failed to fetch watchlist items' });
    }
  });

  app.post('/api/watchlists/:id/items', isAuthenticated, async (req, res) => {
    try {
      const watchlistId = req.params.id;
      const data = insertWatchlistItemSchema.parse({ ...req.body, watchlistId });
      const item = await storage.addWatchlistItem(data);
      res.json(item);
    } catch (error) {
      console.error('Error adding watchlist item:', error);
      res.status(500).json({ message: 'Failed to add watchlist item' });
    }
  });

  app.delete('/api/watchlists/:id/items/:movieId', isAuthenticated, async (req, res) => {
    try {
      const watchlistId = req.params.id;
      const movieId = parseInt(req.params.movieId);
      await storage.removeWatchlistItem(watchlistId, movieId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error removing watchlist item:', error);
      res.status(500).json({ message: 'Failed to remove watchlist item' });
    }
  });

  // Favorites endpoints
  app.get('/api/favorites', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const favorites = await storage.getUserFavorites(userId);
      res.json(favorites);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      res.status(500).json({ message: 'Failed to fetch favorites' });
    }
  });

  app.post('/api/favorites', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertFavoriteSchema.parse({ ...req.body, userId });
      const favorite = await storage.addFavorite(data);
      res.json(favorite);
    } catch (error) {
      console.error('Error adding favorite:', error);
      res.status(500).json({ message: 'Failed to add favorite' });
    }
  });

  app.delete('/api/favorites/:movieId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const movieId = parseInt(req.params.movieId);
      await storage.removeFavorite(userId, movieId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error removing favorite:', error);
      res.status(500).json({ message: 'Failed to remove favorite' });
    }
  });

  app.get('/api/favorites/:movieId/check', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const movieId = parseInt(req.params.movieId);
      const isFavorite = await storage.isFavorite(userId, movieId);
      res.json({ isFavorite });
    } catch (error) {
      console.error('Error checking favorite status:', error);
      res.status(500).json({ message: 'Failed to check favorite status' });
    }
  });

  // Reviews endpoints
  app.get('/api/reviews/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const reviews = await storage.getUserReviews(userId);
      res.json(reviews);
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      res.status(500).json({ message: 'Failed to fetch user reviews' });
    }
  });

  app.get('/api/reviews/movie/:movieId', async (req, res) => {
    try {
      const movieId = parseInt(req.params.movieId);
      const reviews = await storage.getMovieReviews(movieId);
      res.json(reviews);
    } catch (error) {
      console.error('Error fetching movie reviews:', error);
      res.status(500).json({ message: 'Failed to fetch movie reviews' });
    }
  });

  app.post('/api/reviews', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertReviewSchema.parse({ ...req.body, userId });
      const review = await storage.createReview(data);
      res.json(review);
    } catch (error) {
      console.error('Error creating review:', error);
      res.status(500).json({ message: 'Failed to create review' });
    }
  });

  // Admin endpoints
  app.get('/api/admin/users', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: 'Admin access required' });
      }
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  app.get('/api/admin/stats', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: 'Admin access required' });
      }
      const stats = await storage.getUserStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ message: 'Failed to fetch stats' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
