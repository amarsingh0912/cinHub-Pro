import { describe, it, expect } from 'vitest';
import { getImageUrl, formatRating, formatRuntime, formatCurrency } from '@/lib/tmdb';

describe('TMDB Utilities', () => {
  describe('getImageUrl', () => {
    it('should construct correct TMDB image URL with default size', () => {
      const path = '/path/to/image.jpg';
      const url = getImageUrl(path);
      
      expect(url).toBe('https://image.tmdb.org/t/p/w500/path/to/image.jpg');
    });

    it('should construct correct TMDB image URL with custom size', () => {
      const path = '/path/to/image.jpg';
      const url = getImageUrl(path, 'w780');
      
      expect(url).toBe('https://image.tmdb.org/t/p/w780/path/to/image.jpg');
    });

    it('should return placeholder for null path', () => {
      const url = getImageUrl(null);
      
      expect(url).toBe('/placeholder-movie.jpg');
    });

    it('should return full URL as-is for Cloudinary images', () => {
      const cloudinaryUrl = 'https://res.cloudinary.com/demo/image/upload/v1234/sample.jpg';
      const url = getImageUrl(cloudinaryUrl);
      
      expect(url).toBe(cloudinaryUrl);
    });

    it('should handle all size options', () => {
      const path = '/test.jpg';
      
      expect(getImageUrl(path, 'w200')).toContain('/w200/');
      expect(getImageUrl(path, 'w500')).toContain('/w500/');
      expect(getImageUrl(path, 'w780')).toContain('/w780/');
      expect(getImageUrl(path, 'original')).toContain('/original/');
    });
  });

  describe('formatRating', () => {
    it('should convert 10-point scale to 5-point scale', () => {
      expect(formatRating(10)).toBe('5.0');
      expect(formatRating(8)).toBe('4.0');
      expect(formatRating(5)).toBe('2.5');
      expect(formatRating(0)).toBe('0.0');
    });

    it('should return one decimal place', () => {
      const result = formatRating(8.5);
      expect(result).toMatch(/^\d+\.\d$/);
      expect(result).toBe('4.3');
    });

    it('should handle edge cases', () => {
      expect(formatRating(10)).toBe('5.0');
      expect(formatRating(0)).toBe('0.0');
      expect(formatRating(1)).toBe('0.5');
    });
  });

  describe('formatRuntime', () => {
    it('should format minutes to hours and minutes', () => {
      expect(formatRuntime(125)).toBe('2h 5m');
      expect(formatRuntime(90)).toBe('1h 30m');
      expect(formatRuntime(60)).toBe('1h 0m');
    });

    it('should handle zero minutes', () => {
      expect(formatRuntime(0)).toBe('0h 0m');
    });

    it('should handle values less than 60 minutes', () => {
      expect(formatRuntime(45)).toBe('0h 45m');
      expect(formatRuntime(15)).toBe('0h 15m');
    });

    it('should handle very long runtimes', () => {
      expect(formatRuntime(240)).toBe('4h 0m');
      expect(formatRuntime(300)).toBe('5h 0m');
    });
  });

  describe('formatCurrency', () => {
    it('should format currency with USD symbol', () => {
      const result = formatCurrency(1000000);
      expect(result).toContain('$');
      expect(result).toContain('1,000,000');
    });

    it('should handle zero', () => {
      const result = formatCurrency(0);
      expect(result).toBe('$0');
    });

    it('should format large numbers with commas', () => {
      const result = formatCurrency(100000000);
      expect(result).toContain('100,000,000');
    });

    it('should not include cents', () => {
      const result = formatCurrency(1234.56);
      expect(result).not.toContain('.56');
      expect(result).toContain('1,235'); // Rounded
    });

    it('should handle negative numbers', () => {
      const result = formatCurrency(-5000);
      expect(result).toContain('-');
      expect(result).toContain('5,000');
    });
  });
});
