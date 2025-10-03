/**
 * Optimized Database Queries Hook
 * Implements advanced caching, query optimization, and performance strategies
 */
import { useState, useCallback, useRef, useMemo } from 'react';
import { supabase, dbHelpers } from '../api/supabase';
import { SupabaseErrorHandler } from '../lib/supabaseErrorHandler';

// Advanced cache configuration
const CACHE_CONFIG = {
  DEFAULT_TTL: 5 * 60 * 1000, // 5 minutes
  ANALYTICS_TTL: 10 * 60 * 1000, // 10 minutes for analytics
  STATIC_TTL: 30 * 60 * 1000, // 30 minutes for static data
  MAX_CACHE_SIZE: 100,
  STALE_WHILE_REVALIDATE: 2 * 60 * 1000 // 2 minutes
};

// Global cache with LRU eviction
class LRUCache {
  constructor(maxSize = CACHE_CONFIG.MAX_CACHE_SIZE) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key) {
    if (this.cache.has(key)) {
      const value = this.cache.get(key);
      // Move to end (most recently used)
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
      // Remove least recently used
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

// Global instances
const queryCache = new LRUCache();
const pendingQueries = new Map();
const queryMetrics = new Map();

// Query optimization utilities
const createOptimizedCacheKey = (queryName, params = {}) => {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((result, key) => {
      result[key] = params[key];
      return result;
    }, {});
  return `${queryName}:${JSON.stringify(sortedParams)}`;
};

const isCacheValid = (cacheEntry, ttl) => {
  if (!cacheEntry) return false;
  return (Date.now() - cacheEntry.timestamp) < ttl;
};

const isStale = (cacheEntry, staleTime) => {
  if (!cacheEntry) return true;
  return (Date.now() - cacheEntry.timestamp) > staleTime;
};

// Performance monitoring
const trackQueryPerformance = (queryName, startTime, success, fromCache = false) => {
  const duration = Date.now() - startTime;
  const key = `${queryName}:${fromCache ? 'cache' : 'db'}`;
  
  if (!queryMetrics.has(key)) {
    queryMetrics.set(key, {
      count: 0,
      totalTime: 0,
      avgTime: 0,
      errors: 0,
      lastExecuted: null
    });
  }
  
  const metrics = queryMetrics.get(key);
  metrics.count++;
  metrics.totalTime += duration;
  metrics.avgTime = metrics.totalTime / metrics.count;
  metrics.lastExecuted = new Date().toISOString();
  
  if (!success) {
    metrics.errors++;
  }
  
  console.log(`📊 Query ${queryName} (${fromCache ? 'cache' : 'db'}): ${duration}ms`);
};

export const useOptimizedQueries = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  // Optimized query executor with advanced caching
  const executeQuery = useCallback(async (queryName, queryFn, params = {}, options = {}) => {
    const {
      ttl = CACHE_CONFIG.DEFAULT_TTL,
      staleWhileRevalidate = CACHE_CONFIG.STALE_WHILE_REVALIDATE,
      forceRefresh = false,
      enableMetrics = true
    } = options;

    const cacheKey = createOptimizedCacheKey(queryName, params);
    const startTime = Date.now();

    // Check cache first
    if (!forceRefresh) {
      const cachedData = queryCache.get(cacheKey);
      
      if (cachedData && isCacheValid(cachedData, ttl)) {
        if (enableMetrics) {
          trackQueryPerformance(queryName, startTime, true, true);
        }
        return cachedData.data;
      }
      
      // Stale-while-revalidate strategy
      if (cachedData && isStale(cachedData, staleWhileRevalidate)) {
        // Return stale data immediately
        setTimeout(() => {
          executeQuery(queryName, queryFn, params, { ...options, forceRefresh: true });
        }, 0);
        
        if (enableMetrics) {
          trackQueryPerformance(queryName, startTime, true, true);
        }
        return cachedData.data;
      }
    }

    // Check for pending request
    if (pendingQueries.has(cacheKey)) {
      return await pendingQueries.get(cacheKey);
    }

    // Create new request with abort controller
    abortControllerRef.current = new AbortController();
    
    const queryPromise = (async () => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await SupabaseErrorHandler.executeWithRetry(
          async () => {
            const queryResult = await queryFn(params);
            
            // Check if request was aborted
            if (abortControllerRef.current?.signal.aborted) {
              throw new Error('Query aborted');
            }
            
            return queryResult;
          },
          { 
            operation: queryName, 
            maxRetries: 2,
            retryDelay: 1000
          }
        );

        if (result.success && result.data) {
          // Cache the result
          queryCache.set(cacheKey, {
            data: result.data,
            timestamp: Date.now(),
            queryName,
            params
          });

          if (enableMetrics) {
            trackQueryPerformance(queryName, startTime, true, false);
          }

          return result.data;
        } else {
          throw new Error(result.error?.message || 'Query failed');
        }
      } catch (error) {
        if (enableMetrics) {
          trackQueryPerformance(queryName, startTime, false, false);
        }
        
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
        pendingQueries.delete(cacheKey);
      }
    })();

    pendingQueries.set(cacheKey, queryPromise);
    return await queryPromise;
  }, []);

  // Optimized dashboard analytics query
  const getDashboardAnalytics = useCallback(async (filters = {}) => {
    return executeQuery(
      'dashboard_analytics',
      async () => {
        // Use optimized query with proper joins and indexing
        const { data, error } = await supabase
          .from('respuestas')
          .select(`
            respuesta,
            personas!inner(
              area,
              turno,
              genero,
              edad,
              antiguedad
            ),
            preguntas!inner(
              texto,
              categoria
            )
          `)
          .order('personas.fecha_creacion', { ascending: false })
          .limit(1000); // Limit for performance

        if (error) throw error;
        return { success: true, data };
      },
      filters,
      { 
        ttl: CACHE_CONFIG.ANALYTICS_TTL,
        staleWhileRevalidate: CACHE_CONFIG.STALE_WHILE_REVALIDATE
      }
    );
  }, [executeQuery]);

  // Optimized personas query with pagination
  const getPersonasPaginated = useCallback(async (page = 0, pageSize = 20, filters = {}) => {
    return executeQuery(
      'personas_paginated',
      async () => {
        let query = supabase
          .from('personas')
          .select('*', { count: 'exact' })
          .order('fecha_creacion', { ascending: false })
          .range(page * pageSize, (page + 1) * pageSize - 1);

        // Apply filters
        if (filters.area) {
          query = query.eq('area', filters.area);
        }
        if (filters.completado !== undefined) {
          query = query.eq('completado', filters.completado);
        }

        const { data, error, count } = await query;
        if (error) throw error;
        
        return { 
          success: true, 
          data: {
            personas: data,
            totalCount: count,
            page,
            pageSize,
            totalPages: Math.ceil(count / pageSize)
          }
        };
      },
      { page, pageSize, ...filters },
      { ttl: CACHE_CONFIG.DEFAULT_TTL }
    );
  }, [executeQuery]);

  // Batch operations for better performance
  const batchCreateRespuestas = useCallback(async (respuestasArray) => {
    return executeQuery(
      'batch_create_respuestas',
      async () => {
        // Split into chunks for better performance
        const CHUNK_SIZE = 100;
        const chunks = [];
        
        for (let i = 0; i < respuestasArray.length; i += CHUNK_SIZE) {
          chunks.push(respuestasArray.slice(i, i + CHUNK_SIZE));
        }

        const results = [];
        for (const chunk of chunks) {
          const { data, error } = await supabase
            .from('respuestas')
            .insert(chunk)
            .select();
          
          if (error) throw error;
          results.push(...data);
        }

        return { success: true, data: results };
      },
      { count: respuestasArray.length },
      { ttl: 0 } // Don't cache mutations
    );
  }, [executeQuery]);

  // Cache management utilities
  const clearCache = useCallback((pattern) => {
    if (pattern) {
      // Clear specific pattern
      const keysToDelete = [];
      queryCache.cache.forEach((value, key) => {
        if (key.includes(pattern)) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach(key => queryCache.cache.delete(key));
    } else {
      // Clear all cache
      queryCache.clear();
    }
    console.log('🧹 Cache cleared:', pattern || 'all');
  }, []);

  const getCacheStats = useCallback(() => {
    return {
      cacheSize: queryCache.size(),
      pendingQueries: pendingQueries.size,
      metrics: Object.fromEntries(queryMetrics)
    };
  }, []);

  // Prefetch commonly used data
  const prefetchData = useCallback(async () => {
    try {
      // Prefetch dashboard analytics
      getDashboardAnalytics();
      
      // Prefetch first page of personas
      getPersonasPaginated(0, 20);
      
      console.log('🚀 Data prefetching initiated');
    } catch (error) {
      console.warn('⚠️ Prefetch failed:', error);
    }
  }, [getDashboardAnalytics, getPersonasPaginated]);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    pendingQueries.clear();
  }, []);

  return {
    // Query methods
    executeQuery,
    getDashboardAnalytics,
    getPersonasPaginated,
    batchCreateRespuestas,
    
    // Cache management
    clearCache,
    getCacheStats,
    prefetchData,
    
    // State
    isLoading,
    error,
    
    // Cleanup
    cleanup
  };
};

export default useOptimizedQueries;