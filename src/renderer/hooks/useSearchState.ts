/**
 * Search State Management Hook
 * Extracted from App.tsx to manage search functionality separately
 */

import { useState, useCallback } from 'react';
import { SearchResult, SearchOptions, searchService } from '../services/SearchService';

export interface SearchState {
  searchText: string;
  searchResults: SearchResult[];
  currentSearchIndex: number;
  isSearching: boolean;
}

export interface SearchActions {
  setSearchText: (text: string) => void;
  performSearch: (text: string, options?: SearchOptions) => Promise<void>;
  clearSearch: () => void;
  nextResult: () => void;
  previousResult: () => void;
  goToResult: (index: number) => void;
  hasResults: boolean;
  totalResults: number;
  currentResult: SearchResult | null;
}

const initialSearchState: SearchState = {
  searchText: '',
  searchResults: [],
  currentSearchIndex: -1,
  isSearching: false,
};

export function useSearchState(): SearchState & SearchActions {
  const [state, setState] = useState<SearchState>(initialSearchState);

  const setSearchText = useCallback((text: string) => {
    setState(prev => ({ ...prev, searchText: text }));
  }, []);

  const performSearch = useCallback(async (text: string, options?: SearchOptions) => {
    if (!text.trim()) {
      setState(prev => ({ ...prev, searchResults: [], currentSearchIndex: -1 }));
      return;
    }

    setState(prev => ({ ...prev, isSearching: true }));

    try {
      const results = await searchService.search(text, options);
      setState(prev => ({
        ...prev,
        searchResults: results,
        currentSearchIndex: results.length > 0 ? 0 : -1,
        isSearching: false,
      }));

      // Highlight results if available
      if (results.length > 0) {
        searchService.highlightResults(results);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setState(prev => ({
        ...prev,
        searchResults: [],
        currentSearchIndex: -1,
        isSearching: false,
      }));
    }
  }, []);

  const clearSearch = useCallback(() => {
    searchService.clearHighlights();
    setState(initialSearchState);
  }, []);

  const nextResult = useCallback(() => {
    setState(prev => {
      if (prev.searchResults.length === 0) return prev;
      
      const nextIndex = (prev.currentSearchIndex + 1) % prev.searchResults.length;
      return { ...prev, currentSearchIndex: nextIndex };
    });
  }, []);

  const previousResult = useCallback(() => {
    setState(prev => {
      if (prev.searchResults.length === 0) return prev;
      
      const prevIndex = prev.currentSearchIndex <= 0 
        ? prev.searchResults.length - 1 
        : prev.currentSearchIndex - 1;
      return { ...prev, currentSearchIndex: prevIndex };
    });
  }, []);

  const goToResult = useCallback((index: number) => {
    setState(prev => {
      if (index < 0 || index >= prev.searchResults.length) return prev;
      return { ...prev, currentSearchIndex: index };
    });
  }, []);

  return {
    ...state,
    setSearchText,
    performSearch,
    clearSearch,
    nextResult,
    previousResult,
    goToResult,
    hasResults: state.searchResults.length > 0,
    totalResults: state.searchResults.length,
    currentResult: state.currentSearchIndex >= 0 && state.currentSearchIndex < state.searchResults.length
      ? state.searchResults[state.currentSearchIndex]
      : null,
  };
}