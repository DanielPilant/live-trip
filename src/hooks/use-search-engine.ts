"use client";

import { useState, useCallback, useRef } from "react";
import { Site, MapboxResult, SearchResults } from "@/lib/types";
import { unifiedSearchAction } from "@/app/actions/site";

export interface SearchState {
  query: string;
  isSearching: boolean;
  results: SearchResults;
  isOpen: boolean;
}

export interface UseSearchEngineReturn {
  // State
  state: SearchState;

  // Actions
  setQuery: (query: string) => void;
  performSearch: (query: string) => void;
  selectSite: (site: Site) => void;
  selectLocation: (location: MapboxResult) => void;
  clearSearch: () => void;
  openDropdown: () => void;
  closeDropdown: () => void;
}

interface UseSearchEngineOptions {
  debounceMs?: number;
  minSearchLength?: number;
  onSiteSelect?: (site: Site) => void;
  onLocationSelect?: (location: MapboxResult) => void;
}

/**
 * Custom Hook: useSearchEngine
 *
 * Encapsulates all search logic including:
 * - Debounced input handling
 * - Parallel API fetching with race condition prevention
 * - Unified result management
 * - Selection handlers for both sites and locations
 */
export function useSearchEngine(
  options: UseSearchEngineOptions = {}
): UseSearchEngineReturn {
  const {
    debounceMs = 300,
    minSearchLength = 1,
    onSiteSelect,
    onLocationSelect,
  } = options;

  // State
  const [state, setState] = useState<SearchState>({
    query: "",
    isSearching: false,
    results: {
      sites: [],
      locations: [],
      combined: [],
    },
    isOpen: false,
  });

  // Refs for debouncing and race condition prevention
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const latestSearchId = useRef<number>(0);

  /**
   * Set query without triggering search
   */
  const setQuery = useCallback((query: string) => {
    setState((prev) => ({ ...prev, query }));
  }, []);

  /**
   * Perform debounced search with race condition protection
   */
  const performSearch = useCallback(
    (query: string) => {
      // Clear existing timeout
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }

      // Update query immediately
      setState((prev) => ({ ...prev, query, isOpen: true }));

      // Reset state if query is too short
      if (!query.trim() || query.trim().length < minSearchLength) {
        setState((prev) => ({
          ...prev,
          results: { sites: [], locations: [], combined: [] },
          isSearching: false,
        }));
        return;
      }

      // Start loading state
      setState((prev) => ({ ...prev, isSearching: true }));

      // Increment search ID for race condition handling
      const searchId = ++latestSearchId.current;

      // Debounced execution
      debounceTimeout.current = setTimeout(async () => {
        try {
          const results = await unifiedSearchAction(query);

          // Only update if this is still the latest search
          if (searchId === latestSearchId.current) {
            setState((prev) => ({
              ...prev,
              results,
              isSearching: false,
            }));
          }
        } catch (error) {
          console.error("Search failed:", error);
          // Only update if this is still the latest search
          if (searchId === latestSearchId.current) {
            setState((prev) => ({
              ...prev,
              results: { sites: [], locations: [], combined: [] },
              isSearching: false,
            }));
          }
        }
      }, debounceMs);
    },
    [debounceMs, minSearchLength]
  );

  /**
   * Handle site selection
   */
  const selectSite = useCallback(
    (site: Site) => {
      setState((prev) => ({
        ...prev,
        query: site.name,
        isOpen: false,
        results: { sites: [], locations: [], combined: [] },
      }));

      onSiteSelect?.(site);
    },
    [onSiteSelect]
  );

  /**
   * Handle location selection
   */
  const selectLocation = useCallback(
    (location: MapboxResult) => {
      setState((prev) => ({
        ...prev,
        query: location.text,
        isOpen: false,
        results: { sites: [], locations: [], combined: [] },
      }));

      onLocationSelect?.(location);
    },
    [onLocationSelect]
  );

  /**
   * Clear search state
   */
  const clearSearch = useCallback(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    setState({
      query: "",
      isSearching: false,
      results: { sites: [], locations: [], combined: [] },
      isOpen: false,
    });
  }, []);

  /**
   * Open dropdown
   */
  const openDropdown = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: true }));
  }, []);

  /**
   * Close dropdown
   */
  const closeDropdown = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return {
    state,
    setQuery,
    performSearch,
    selectSite,
    selectLocation,
    clearSearch,
    openDropdown,
    closeDropdown,
  };
}
