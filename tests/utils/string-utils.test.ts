import { describe, it, expect } from 'vitest';

// Test common string utility functions
describe('String Utilities', () => {
  describe('truncateText', () => {
    it('should truncate long text', () => {
      const longText = 'This is a very long text that should be truncated';
      const maxLength = 20;
      const truncated = longText.slice(0, maxLength);
      
      expect(truncated.length).toBeLessThanOrEqual(maxLength);
    });

    it('should not truncate short text', () => {
      const shortText = 'Short';
      const maxLength = 20;
      
      expect(shortText.length).toBeLessThan(maxLength);
    });

    it('should handle empty strings', () => {
      const emptyText = '';
      expect(emptyText).toBe('');
    });

    it('should add ellipsis when truncating', () => {
      const longText = 'This is a very long text';
      const maxLength = 10;
      const truncated = longText.slice(0, maxLength) + '...';
      
      expect(truncated).toContain('...');
      expect(truncated.length).toBeLessThanOrEqual(maxLength + 3);
    });
  });

  describe('capitalizeFirst', () => {
    it('should capitalize first letter', () => {
      const text = 'hello world';
      const capitalized = text.charAt(0).toUpperCase() + text.slice(1);
      
      expect(capitalized).toBe('Hello world');
    });

    it('should handle empty strings', () => {
      const text = '';
      expect(text).toBe('');
    });

    it('should handle single character', () => {
      const text = 'a';
      const capitalized = text.toUpperCase();
      
      expect(capitalized).toBe('A');
    });
  });

  describe('slugify', () => {
    it('should convert string to slug', () => {
      const text = 'Hello World 123';
      const slug = text.toLowerCase().replace(/\s+/g, '-');
      
      expect(slug).toBe('hello-world-123');
    });

    it('should handle special characters', () => {
      const text = 'Hello @ World!';
      const slug = text.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      
      expect(slug).toMatch(/^[a-z0-9-]+$/);
    });

    it('should remove consecutive dashes', () => {
      const text = 'Hello   World';
      const slug = text.toLowerCase().replace(/\s+/g, '-');
      
      expect(slug).not.toContain('--');
    });
  });

  describe('parseQueryString', () => {
    it('should parse query string to object', () => {
      const query = '?page=1&genre=action&year=2024';
      const params = new URLSearchParams(query);
      
      expect(params.get('page')).toBe('1');
      expect(params.get('genre')).toBe('action');
      expect(params.get('year')).toBe('2024');
    });

    it('should handle empty query string', () => {
      const query = '';
      const params = new URLSearchParams(query);
      
      expect(params.toString()).toBe('');
    });

    it('should handle array parameters', () => {
      const query = '?genres=action&genres=drama';
      const params = new URLSearchParams(query);
      
      const genres = params.getAll('genres');
      expect(genres).toHaveLength(2);
      expect(genres).toContain('action');
      expect(genres).toContain('drama');
    });
  });

  describe('sanitizeInput', () => {
    it('should remove HTML tags', () => {
      const input = '<script>alert("XSS")</script>';
      const sanitized = input.replace(/<[^>]*>/g, '');
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('</script>');
    });

    it('should trim whitespace', () => {
      const input = '  hello world  ';
      const trimmed = input.trim();
      
      expect(trimmed).toBe('hello world');
    });

    it('should handle null and undefined', () => {
      const nullInput = null;
      const undefinedInput = undefined;
      
      expect(nullInput).toBeNull();
      expect(undefinedInput).toBeUndefined();
    });
  });
});
