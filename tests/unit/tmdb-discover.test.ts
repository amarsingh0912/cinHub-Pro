import { describe, it, expect } from 'vitest';
import {
  buildMovieDiscoverParams,
  buildTVDiscoverParams,
  shouldUseTrendingEndpoint,
  type MovieCategory,
  type TVCategory,
} from '../../server/utils/tmdbDiscover';

describe('TMDB Discover Utils', () => {
  describe('buildMovieDiscoverParams', () => {
    it('should build params for popular movies', () => {
      const params = buildMovieDiscoverParams('popular', {});
      
      expect(params).toHaveProperty('sort_by');
      expect(params.sort_by).toContain('popularity');
    });

    it('should build params for top rated movies', () => {
      const params = buildMovieDiscoverParams('top_rated', {});
      
      expect(params.sort_by).toContain('vote_average');
    });

    it('should build params for upcoming movies', () => {
      const params = buildMovieDiscoverParams('upcoming', {});
      
      expect(params).toHaveProperty('primary_release_date.gte');
      expect(params).toHaveProperty('primary_release_date.lte');
    });

    it('should build params for now playing movies', () => {
      const params = buildMovieDiscoverParams('now_playing', {});
      
      expect(params).toHaveProperty('primary_release_date.gte');
      expect(params).toHaveProperty('primary_release_date.lte');
    });

    it('should include genre filter', () => {
      const params = buildMovieDiscoverParams('popular', { 
        genres: '28,12' 
      });
      
      expect(params.with_genres).toBe('28,12');
    });

    it('should include year filter', () => {
      const params = buildMovieDiscoverParams('popular', {
        year: '2024',
      });
      
      expect(params.primary_release_year).toBe('2024');
    });

    it('should include vote average filter', () => {
      const params = buildMovieDiscoverParams('popular', {
        'vote_average.gte': '7',
        'vote_average.lte': '9',
      });
      
      expect(params['vote_average.gte']).toBe('7');
      expect(params['vote_average.lte']).toBe('9');
    });

    it('should include runtime filter', () => {
      const params = buildMovieDiscoverParams('popular', {
        'with_runtime.gte': '90',
        'with_runtime.lte': '180',
      });
      
      expect(params['with_runtime.gte']).toBe('90');
      expect(params['with_runtime.lte']).toBe('180');
    });

    it('should include people filter', () => {
      const params = buildMovieDiscoverParams('popular', {
        with_people: '1,2,3',
      });
      
      expect(params.with_people).toBe('1,2,3');
    });

    it('should include cast filter', () => {
      const params = buildMovieDiscoverParams('popular', {
        with_cast: '500',
      });
      
      expect(params.with_cast).toBe('500');
    });

    it('should include crew filter', () => {
      const params = buildMovieDiscoverParams('popular', {
        with_crew: '1000',
      });
      
      expect(params.with_crew).toBe('1000');
    });

    it('should include companies filter', () => {
      const params = buildMovieDiscoverParams('popular', {
        with_companies: '1,2',
      });
      
      expect(params.with_companies).toBe('1,2');
    });

    it('should include keywords filter', () => {
      const params = buildMovieDiscoverParams('popular', {
        with_keywords: '9715,9717',
      });
      
      expect(params.with_keywords).toBe('9715,9717');
    });

    it('should include watch providers filter', () => {
      const params = buildMovieDiscoverParams('popular', {
        with_watch_providers: '8|9',
        watch_region: 'US',
      });
      
      expect(params.with_watch_providers).toBe('8|9');
      expect(params.watch_region).toBe('US');
    });

    it('should include certification filter', () => {
      const params = buildMovieDiscoverParams('popular', {
        certification_country: 'US',
        certification: 'R',
      });
      
      expect(params.certification_country).toBe('US');
      expect(params.certification).toBe('R');
    });

    it('should include language filter', () => {
      const params = buildMovieDiscoverParams('popular', {
        with_original_language: 'en',
      });
      
      expect(params.with_original_language).toBe('en');
    });

    it('should include sort_by parameter', () => {
      const params = buildMovieDiscoverParams('popular', {
        sort_by: 'release_date.desc',
      });
      
      expect(params.sort_by).toBe('release_date.desc');
    });

    it('should handle multiple filters together', () => {
      const params = buildMovieDiscoverParams('popular', {
        genres: '28',
        year: '2024',
        'vote_average.gte': '7',
        with_cast: '500',
        sort_by: 'vote_average.desc',
      });
      
      expect(params.with_genres).toBe('28');
      expect(params.primary_release_year).toBe('2024');
      expect(params['vote_average.gte']).toBe('7');
      expect(params.with_cast).toBe('500');
      expect(params.sort_by).toBe('vote_average.desc');
    });
  });

  describe('buildTVDiscoverParams', () => {
    it('should build params for popular TV shows', () => {
      const params = buildTVDiscoverParams('popular', {});
      
      expect(params.sort_by).toContain('popularity');
    });

    it('should build params for top rated TV shows', () => {
      const params = buildTVDiscoverParams('top_rated', {});
      
      expect(params.sort_by).toContain('vote_average');
    });

    it('should build params for airing today', () => {
      const params = buildTVDiscoverParams('airing_today', {});
      
      expect(params).toHaveProperty('air_date.gte');
      expect(params).toHaveProperty('air_date.lte');
    });

    it('should build params for on the air', () => {
      const params = buildTVDiscoverParams('on_the_air', {});
      
      expect(params).toHaveProperty('air_date.gte');
    });

    it('should include genre filter', () => {
      const params = buildTVDiscoverParams('popular', {
        genres: '18,10765',
      });
      
      expect(params.with_genres).toBe('18,10765');
    });

    it('should include first air date filter', () => {
      const params = buildTVDiscoverParams('popular', {
        first_air_date_year: '2024',
      });
      
      expect(params.first_air_date_year).toBe('2024');
    });

    it('should include networks filter', () => {
      const params = buildTVDiscoverParams('popular', {
        with_networks: '213',
      });
      
      expect(params.with_networks).toBe('213');
    });

    it('should include vote average filter', () => {
      const params = buildTVDiscoverParams('popular', {
        'vote_average.gte': '8',
      });
      
      expect(params['vote_average.gte']).toBe('8');
    });

    it('should include runtime filter', () => {
      const params = buildTVDiscoverParams('popular', {
        'with_runtime.gte': '30',
        'with_runtime.lte': '60',
      });
      
      expect(params['with_runtime.gte']).toBe('30');
      expect(params['with_runtime.lte']).toBe('60');
    });

    it('should include watch providers filter', () => {
      const params = buildTVDiscoverParams('popular', {
        with_watch_providers: '8',
        watch_region: 'US',
      });
      
      expect(params.with_watch_providers).toBe('8');
      expect(params.watch_region).toBe('US');
    });
  });

  describe('shouldUseTrendingEndpoint', () => {
    it('should return true for trending category', () => {
      expect(shouldUseTrendingEndpoint('trending' as MovieCategory)).toBe(true);
    });

    it('should return false for popular category', () => {
      expect(shouldUseTrendingEndpoint('popular')).toBe(false);
    });

    it('should return false for top_rated category', () => {
      expect(shouldUseTrendingEndpoint('top_rated')).toBe(false);
    });

    it('should return false for upcoming category', () => {
      expect(shouldUseTrendingEndpoint('upcoming')).toBe(false);
    });

    it('should return false for now_playing category', () => {
      expect(shouldUseTrendingEndpoint('now_playing')).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty filters object', () => {
      const params = buildMovieDiscoverParams('popular', {});
      
      expect(params).toBeTruthy();
      expect(params.sort_by).toBeTruthy();
    });

    it('should handle undefined filters', () => {
      const params = buildMovieDiscoverParams('popular', undefined as any);
      
      expect(params).toBeTruthy();
    });

    it('should handle null values in filters', () => {
      const params = buildMovieDiscoverParams('popular', {
        genres: null as any,
        year: undefined,
      });
      
      expect(params).toBeTruthy();
    });

    it('should handle invalid category gracefully', () => {
      const params = buildMovieDiscoverParams('invalid' as MovieCategory, {});
      
      expect(params).toBeTruthy();
    });

    it('should filter out undefined filter values', () => {
      const params = buildMovieDiscoverParams('popular', {
        genres: '28',
        year: undefined,
        with_cast: null as any,
      });
      
      expect(params.with_genres).toBe('28');
      expect(params.year).toBeUndefined();
      expect(params.with_cast).toBeUndefined();
    });
  });

  describe('Date Handling', () => {
    it('should generate proper date range for upcoming movies', () => {
      const params = buildMovieDiscoverParams('upcoming', {});
      
      const today = new Date();
      expect(params['primary_release_date.gte']).toBeTruthy();
      expect(params['primary_release_date.lte']).toBeTruthy();
    });

    it('should generate proper date range for now playing movies', () => {
      const params = buildMovieDiscoverParams('now_playing', {});
      
      expect(params['primary_release_date.gte']).toBeTruthy();
      expect(params['primary_release_date.lte']).toBeTruthy();
    });

    it('should generate proper date range for airing today TV shows', () => {
      const params = buildTVDiscoverParams('airing_today', {});
      
      expect(params['air_date.gte']).toBeTruthy();
      expect(params['air_date.lte']).toBeTruthy();
    });

    it('should use ISO date format', () => {
      const params = buildMovieDiscoverParams('upcoming', {});
      
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (params['primary_release_date.gte']) {
        expect(params['primary_release_date.gte']).toMatch(dateRegex);
      }
    });
  });

  describe('Parameter Precedence', () => {
    it('should override default sort_by with custom value', () => {
      const params = buildMovieDiscoverParams('popular', {
        sort_by: 'release_date.desc',
      });
      
      expect(params.sort_by).toBe('release_date.desc');
    });

    it('should preserve category-specific parameters', () => {
      const params = buildMovieDiscoverParams('top_rated', {
        'vote_average.gte': '8',
      });
      
      expect(params.sort_by).toContain('vote_average');
      expect(params['vote_average.gte']).toBe('8');
    });
  });
});
