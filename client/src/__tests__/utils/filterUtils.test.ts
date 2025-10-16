/**
 * Unit tests for filter utility functions
 * Tests mergeFilters and buildQueryString to ensure preset parameters are preserved
 */

import { describe, it, expect } from 'vitest';
import { mergeFilters, buildQueryString, MOVIE_PRESETS } from '@/types/filters';

describe('mergeFilters', () => {
  it('should merge upcoming preset with Hindi language filter', () => {
    const result = mergeFilters('upcoming', 'movie', {
      with_original_language: 'hi',
    });

    expect(result.activePreset).toBe('upcoming');
    expect(result.category).toBe('upcoming');
    expect(result.with_original_language).toBe('hi');
    expect(result.sort_by).toBe('popularity.desc');
    expect(result.primary_release_date?.start).toBeDefined();
    expect(result.with_release_type).toEqual([2|3]);
    expect(result.region).toBe('IN');
  });

  it('should preserve user genre selections when switching presets', () => {
    const result = mergeFilters('popular', 'movie', {
      with_genres: [28, 12], // Action, Adventure
    });

    expect(result.activePreset).toBe('popular');
    expect(result.with_genres).toEqual([28, 12]);
    expect(result.sort_by).toBe('popularity.desc');
    expect(result.vote_count?.min).toBe(50);
  });

  it('should merge now_playing preset with custom filters', () => {
    const result = mergeFilters('now_playing', 'movie', {
      with_original_language: 'hi',
      vote_average: { min: 7 },
    });

    expect(result.activePreset).toBe('now_playing');
    expect(result.primary_release_date?.start).toBeDefined();
    expect(result.primary_release_date?.end).toBeDefined();
    expect(result.with_original_language).toBe('hi');
    expect(result.vote_average?.min).toBe(7);
    expect(result.sort_by).toBe('primary_release_date.desc');
  });

  it('should apply trending preset with all default parameters', () => {
    const result = mergeFilters('trending', 'movie');

    expect(result.activePreset).toBe('trending');
    expect(result.category).toBe('trending');
    expect(result.vote_count?.min).toBe(500);
    expect(result.with_release_type).toEqual([2|3]);
    expect(result.primary_release_date?.start).toBeDefined();
    expect(result.with_original_language).toBe('hi');
  });

  it('should override preset defaults with user values', () => {
    const result = mergeFilters('popular', 'movie', {
      with_original_language: 'en', // Override default 'hi'
      vote_count: { min: 1000 }, // Override default 50
    });

    expect(result.with_original_language).toBe('en');
    expect(result.vote_count?.min).toBe(1000);
  });
});

describe('buildQueryString', () => {
  it('should encode pipes as %7C for array values', () => {
    const params = {
      with_release_type: [2|3],
      with_watch_providers: [8, 9, 10],
    };

    const queryString = buildQueryString(params);

    expect(queryString).toContain('with_release_type=2%7C3');
    expect(queryString).toContain('with_watch_providers=8%7C9%7C10');
  });

  it('should preserve commas in string values', () => {
    const params = {
      with_genres: '28,12,16',
    };

    const queryString = buildQueryString(params);

    expect(queryString).toBe('with_genres=28%2C12%2C16');
  });

  it('should handle dotted parameter names', () => {
    const params = {
      'primary_release_date.gte': '2025-10-16',
      'vote_average.gte': 7,
    };

    const queryString = buildQueryString(params);

    expect(queryString).toContain('primary_release_date.gte=2025-10-16');
    expect(queryString).toContain('vote_average.gte=7');
  });

  it('should filter out undefined, null, and empty values', () => {
    const params = {
      defined: 'value',
      undefined: undefined,
      null: null,
      empty: '',
      zero: 0,
      false: false,
    };

    const queryString = buildQueryString(params);

    expect(queryString).toContain('defined=value');
    expect(queryString).toContain('zero=0');
    expect(queryString).toContain('false=false');
    expect(queryString).not.toContain('undefined');
    expect(queryString).not.toContain('null');
    expect(queryString).not.toContain('empty');
  });

  it('should build complete query string for upcoming + Hindi', () => {
    const params = {
      sort_by: 'popularity.desc',
      with_original_language: 'hi',
      region: 'IN',
      include_adult: false,
      include_video: false,
      certification_country: 'US',
      with_release_type: [2|3],
      'primary_release_date.gte': '2025-10-17',
    };

    const queryString = buildQueryString(params);

    expect(queryString).toContain('sort_by=popularity.desc');
    expect(queryString).toContain('with_original_language=hi');
    expect(queryString).toContain('region=IN');
    expect(queryString).toContain('include_adult=false');
    expect(queryString).toContain('include_video=false');
    expect(queryString).toContain('certification_country=US');
    expect(queryString).toContain('with_release_type=2%7C3');
    expect(queryString).toContain('primary_release_date.gte=2025-10-17');
  });
});

describe('Integration: mergeFilters + buildQueryString', () => {
  it('should produce correct query for upcoming preset with Hindi filter', () => {
    const merged = mergeFilters('upcoming', 'movie', {
      with_original_language: 'hi',
    });

    // Extract query params
    const queryParams: Record<string, any> = {
      sort_by: merged.sort_by,
      with_original_language: merged.with_original_language,
      region: merged.region,
      include_adult: merged.include_adult,
      include_video: merged.include_video,
      certification_country: merged.certification_country,
      with_release_type: merged.with_release_type,
    };

    if (merged.primary_release_date?.start) {
      queryParams['primary_release_date.gte'] = merged.primary_release_date.start;
    }

    const queryString = buildQueryString(queryParams);

    // Verify all expected params are present
    expect(queryString).toContain('primary_release_date.gte=');
    expect(queryString).toContain('sort_by=popularity.desc');
    expect(queryString).toContain('with_original_language=hi');
    expect(queryString).toContain('with_release_type=2%7C3');
    expect(queryString).toContain('region=IN');
  });
});
