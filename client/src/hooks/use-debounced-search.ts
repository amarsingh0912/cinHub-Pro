import { useState, useEffect, useCallback } from 'react';

export function useDebouncedSearch(delay: number = 250) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [searchQuery, delay]);

  const updateQuery = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const clearQuery = useCallback(() => {
    setSearchQuery('');
    setDebouncedQuery('');
  }, []);

  return {
    searchQuery,
    debouncedQuery,
    updateQuery,
    clearQuery,
    isDebouncing: searchQuery !== debouncedQuery,
  };
}