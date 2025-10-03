import { useState, useCallback, useRef } from 'react';

/**
 * LRU (Least Recently Used) Cache implementation
 * Automatically evicts least recently used items when capacity is exceeded
 */
class LRUCache {
  constructor(maxSize = 100) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key) {
    if (this.cache.has(key)) {
      // Move to end (most recently used)
      const value = this.cache.get(key);
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    return null;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  has(key) {
    return this.cache.has(key);
  }

  delete(key) {
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }

  keys() {
    return Array.from(this.cache.keys());
  }

  values() {
    return Array.from(this.cache.values());
  }

  entries() {
    return Array.from(this.cache.entries());
  }
}

/**
 * Cache configuration constants
 */
export const CACHE_CONFIG = {
  DEFAULT_TTL: 5 * 60 * 1000, // 5 minutes
  ANALYTICS_TTL: 10 * 60 * 1000, // 10 minutes
  STATIC_TTL: 30 * 60 * 1000, // 30 minutes
  MAX_CACHE_SIZE: 100,
  STALE_WHILE_REVALIDATE: 2 * 60 * 1000, // 2 minutes
};

/**
 * Custom hook for managing query cache
 * Provides LRU cache functionality with TTL support
 * 
 * @param {Object} options - Cache configuration options
 * @param {number} options.maxSize - Maximum number of items in cache
 * @param {number} options.defaultTTL - Default time-to-live for cache entries
 * @returns {Object} Cache management functions
 */
export const useQueryCache = (options = {}) => {
  const {
    maxSize = CACHE_CONFIG.MAX_CACHE_SIZE,
    defaultTTL = CACHE_CONFIG.DEFAULT_TTL
  } = options;

  const cacheRef = useRef(new LRUCache(maxSize));
  const [cacheStats, setCacheStats] = useState({
    hits: 0,
    misses: 0,
    size: 0
  });

  /**
   * Generate cache key from query name and parameters
   */
  const generateCacheKey = useCallback((queryName, params = {}) => {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {});
    
    return `${queryName}:${JSON.stringify(sortedParams)}`;
  }, []);

  /**
   * Check if cache entry is still valid
   */
  const isValidCacheEntry = useCallback((entry, ttl = defaultTTL) => {
    if (!entry || !entry.timestamp) return false;
    return Date.now() - entry.timestamp < ttl;
  }, [defaultTTL]);

  /**
   * Get data from cache
   */
  const getCachedData = useCallback((queryName, params, ttl) => {
    const cacheKey = generateCacheKey(queryName, params);
    const cached = cacheRef.current.get(cacheKey);
    
    if (cached && isValidCacheEntry(cached, ttl)) {
      setCacheStats(prev => ({ ...prev, hits: prev.hits + 1 }));
      return cached.data;
    }
    
    setCacheStats(prev => ({ ...prev, misses: prev.misses + 1 }));
    return null;
  }, [generateCacheKey, isValidCacheEntry]);

  /**
   * Set data in cache
   */
  const setCachedData = useCallback((queryName, params, data, metadata = {}) => {
    const cacheKey = generateCacheKey(queryName, params);
    const entry = {
      data,
      timestamp: Date.now(),
      queryName,
      params,
      metadata
    };
    
    cacheRef.current.set(cacheKey, entry);
    setCacheStats(prev => ({ ...prev, size: cacheRef.current.size() }));
  }, [generateCacheKey]);

  /**
   * Check if data exists in cache (regardless of validity)
   */
  const hasCachedData = useCallback((queryName, params) => {
    const cacheKey = generateCacheKey(queryName, params);
    return cacheRef.current.has(cacheKey);
  }, [generateCacheKey]);

  /**
   * Get stale data from cache (for stale-while-revalidate)
   */
  const getStaleCachedData = useCallback((queryName, params) => {
    const cacheKey = generateCacheKey(queryName, params);
    const cached = cacheRef.current.get(cacheKey);
    return cached ? cached.data : null;
  }, [generateCacheKey]);

  /**
   * Remove specific entry from cache
   */
  const removeCachedData = useCallback((queryName, params) => {
    const cacheKey = generateCacheKey(queryName, params);
    const removed = cacheRef.current.delete(cacheKey);
    if (removed) {
      setCacheStats(prev => ({ ...prev, size: cacheRef.current.size() }));
    }
    return removed;
  }, [generateCacheKey]);

  /**
   * Clear all cache entries
   */
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
    setCacheStats({ hits: 0, misses: 0, size: 0 });
  }, []);

  /**
   * Get cache statistics
   */
  const getCacheInfo = useCallback(() => {
    const cache = cacheRef.current;
    const entries = cache.entries();
    const now = Date.now();
    
    const validEntries = entries.filter(([, entry]) => 
      isValidCacheEntry(entry, defaultTTL)
    );
    
    const expiredEntries = entries.filter(([, entry]) => 
      !isValidCacheEntry(entry, defaultTTL)
    );

    return {
      ...cacheStats,
      totalEntries: cache.size(),
      validEntries: validEntries.length,
      expiredEntries: expiredEntries.length,
      hitRate: cacheStats.hits + cacheStats.misses > 0 
        ? (cacheStats.hits / (cacheStats.hits + cacheStats.misses) * 100).toFixed(2)
        : 0,
      oldestEntry: entries.length > 0 
        ? Math.min(...entries.map(([, entry]) => entry.timestamp))
        : null,
      newestEntry: entries.length > 0 
        ? Math.max(...entries.map(([, entry]) => entry.timestamp))
        : null
    };
  }, [cacheStats, isValidCacheEntry, defaultTTL]);

  /**
   * Clean up expired entries
   */
  const cleanupExpiredEntries = useCallback(() => {
    const cache = cacheRef.current;
    const entries = cache.entries();
    let removedCount = 0;
    
    entries.forEach(([key, entry]) => {
      if (!isValidCacheEntry(entry, defaultTTL)) {
        cache.delete(key);
        removedCount++;
      }
    });
    
    if (removedCount > 0) {
      setCacheStats(prev => ({ ...prev, size: cache.size() }));
    }
    
    return removedCount;
  }, [isValidCacheEntry, defaultTTL]);

  return {
    // Core cache operations
    getCachedData,
    setCachedData,
    hasCachedData,
    getStaleCachedData,
    removeCachedData,
    clearCache,
    
    // Cache management
    cleanupExpiredEntries,
    getCacheInfo,
    
    // Utilities
    generateCacheKey,
    isValidCacheEntry,
    
    // Stats
    cacheStats
  };
};

export default useQueryCache;