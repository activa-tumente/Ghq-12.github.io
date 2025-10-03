import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../api/supabase';
import { MetricsService } from '../services/MetricsService';

/**
 * Global metrics store for centralized real-time data management
 * Provides a single source of truth for all metrics across the application
 *
 * This is a singleton class that manages metrics state globally without React Context
 */
class GlobalMetricsStore {
  constructor() {
    this.subscribers = new Set();
    this.metrics = {
      home: null,
      dashboard: null,
      questionnaires: null,
      responses: null,
      users: null
    };
    this.loading = {
      home: false,
      dashboard: false,
      questionnaires: false,
      responses: false,
      users: false
    };
    this.errors = {
      home: null,
      dashboard: null,
      questionnaires: null,
      responses: null,
      users: null
    };
    this.lastUpdates = {
      home: null,
      dashboard: null,
      questionnaires: null,
      responses: null,
      users: null
    };
    this.isRealTime = false;
    this.subscription = null;
    this.refreshTimeouts = new Map();
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notify() {
    this.subscribers.forEach(callback => callback(this.getState()));
  }

  getState() {
    return {
      metrics: { ...this.metrics },
      loading: { ...this.loading },
      errors: { ...this.errors },
      lastUpdates: { ...this.lastUpdates },
      isRealTime: this.isRealTime
    };
  }

  setLoading(pageType, loading) {
    this.loading[pageType] = loading;
    this.notify();
  }

  setError(pageType, error) {
    this.errors[pageType] = error;
    this.notify();
  }

  setMetrics(pageType, metrics) {
    this.metrics[pageType] = metrics;
    this.lastUpdates[pageType] = new Date().toISOString();
    this.errors[pageType] = null;
    this.notify();
  }

  setRealTimeStatus(isRealTime) {
    this.isRealTime = isRealTime;
    this.notify();
  }

  async loadMetrics(pageType, filters = {}) {
    if (this.loading[pageType]) return;

    this.setLoading(pageType, true);
    this.setError(pageType, null);

    try {
      let data;
      switch (pageType) {
        case 'home':
          data = await MetricsService.getHomeMetrics();
          break;
        case 'dashboard':
          data = await MetricsService.getDashboardMetrics(filters);
          break;
        case 'questionnaires':
          data = await MetricsService.getQuestionnaireMetrics();
          break;
        case 'responses':
          data = await MetricsService.getResponsesMetrics();
          break;
        case 'users':
          data = await MetricsService.getUsersMetrics();
          break;
        default:
          throw new Error(`Unknown page type: ${pageType}`);
      }

      this.setMetrics(pageType, data);
      console.log(`✅ ${pageType} metrics loaded:`, data);
    } catch (error) {
      console.error(`❌ Error loading ${pageType} metrics:`, error);
      this.setError(pageType, {
        message: error.message || 'Error desconocido',
        timestamp: new Date().toISOString()
      });
    } finally {
      this.setLoading(pageType, false);
    }
  }

  setupRealTimeSubscription() {
    if (this.subscription) return;

    console.log('🔄 Setting up global real-time subscription...');

    this.subscription = supabase
      .channel('global_metrics')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'usuarios' }, (payload) => {
        console.log('👥 User change detected:', payload.eventType);
        this.handleDataChange('user');
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'respuestas_cuestionario' }, (payload) => {
        console.log('💬 Response change detected:', payload.eventType);
        this.handleDataChange('response');
      })
      .subscribe((status) => {
        console.log('📡 Global metrics subscription status:', status);
        if (status === 'SUBSCRIBED') {
          this.setRealTimeStatus(true);
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          this.setRealTimeStatus(false);
        }
      });
  }

  handleDataChange(changeType) {
    // Debounce updates to avoid excessive API calls
    const timeoutKey = `update_${changeType}`;

    if (this.refreshTimeouts.has(timeoutKey)) {
      clearTimeout(this.refreshTimeouts.get(timeoutKey));
    }

    const timeout = setTimeout(async () => {
      console.log(`🔄 Refreshing all metrics due to ${changeType} change...`);

      // Clear cache to ensure fresh data
      metricsCache.clear();

      // Refresh all metrics with a slight delay between each to avoid overwhelming the API
      const pages = ['home', 'dashboard', 'questionnaires', 'responses', 'users'];

      try {
        for (let i = 0; i < pages.length; i++) {
          setTimeout(() => {
            this.loadMetrics(pages[i]).catch(error => {
              console.error(`Error refreshing ${pages[i]} metrics:`, error);
            });
          }, i * 200);
        }
      } catch (error) {
        console.error('Error in batch metrics refresh:', error);
      }

      this.refreshTimeouts.delete(timeoutKey);
    }, 1500); // Wait 1.5 seconds after last change

    this.refreshTimeouts.set(timeoutKey, timeout);
  }

  cleanup() {
    if (this.subscription) {
      supabase.removeChannel(this.subscription);
      this.subscription = null;
    }

    this.refreshTimeouts.forEach(timeout => clearTimeout(timeout));
    this.refreshTimeouts.clear();

    this.setRealTimeStatus(false);
  }
}

/**
 * Cache implementation with TTL for better performance
 */
class MetricsCache {
  constructor() {
    this.cache = new Map();
    this.TTL = 5 * 60 * 1000; // 5 minutes
  }

  set(key, value, ttl = this.TTL) {
    const expiry = Date.now() + ttl;
    this.cache.set(key, { value, expiry });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  clear() {
    this.cache.clear();
  }
}

// Create singleton instances
const globalMetricsStore = new GlobalMetricsStore();
const metricsCache = new MetricsCache();

/**
 * Debounce utility for metrics updates
 */
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

/**
 * Hook for using global real-time metrics with improved performance and error handling
 * @param {string} pageType - Type of page ('home', 'dashboard', 'questionnaires', 'responses', 'users')
 * @param {object} options - Configuration options
 * @returns {object} Metrics state and methods
 */
export const useGlobalMetrics = (pageType, options = {}) => {
  const [state, setState] = useState(() => globalMetricsStore.getState());
  const optionsRef = useRef(options);
  const loadingRef = useRef(false);

  // Validate pageType
  useEffect(() => {
    const validTypes = ['home', 'dashboard', 'questionnaires', 'responses', 'users'];
    if (!validTypes.includes(pageType)) {
      console.error(`Invalid pageType: ${pageType}. Must be one of: ${validTypes.join(', ')}`);
    }
  }, [pageType]);

  // Update options ref when options change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Memoized cache key for better performance
  const cacheKey = useMemo(() => {
    const filters = options.filters || {};
    return `${pageType}_${JSON.stringify(filters)}`;
  }, [pageType, options.filters]);

  // Enhanced load function with caching
  const loadMetrics = useCallback(async (forceRefresh = false) => {
    if (loadingRef.current) return;

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cachedData = metricsCache.get(cacheKey);
      if (cachedData) {
        globalMetricsStore.setMetrics(pageType, cachedData);
        return;
      }
    }

    loadingRef.current = true;
    try {
      await globalMetricsStore.loadMetrics(pageType, options.filters || {});

      // Cache the result
      const currentMetrics = globalMetricsStore.getState().metrics[pageType];
      if (currentMetrics) {
        metricsCache.set(cacheKey, currentMetrics);
      }
    } catch (error) {
      console.error(`Error loading ${pageType} metrics:`, error);
    } finally {
      loadingRef.current = false;
    }
  }, [pageType, cacheKey, options.filters]);

  // Subscribe to store changes
  useEffect(() => {
    const unsubscribe = globalMetricsStore.subscribe(setState);
    return unsubscribe;
  }, []);

  // Load initial metrics
  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  // Setup real-time subscription
  useEffect(() => {
    if (options.enableRealTime) {
      globalMetricsStore.setupRealTimeSubscription();
    }

    return () => {
      if (options.enableRealTime) {
        // Only cleanup if this is the last component using real-time
        // In a real app, you'd want a reference counter
      }
    };
  }, [options.enableRealTime]);

  // Memoized refresh functions
  const refreshMetrics = useCallback(() => {
    loadMetrics(true);
  }, [loadMetrics]);

  const clearCacheAndReload = useCallback(() => {
    metricsCache.clear();
    loadMetrics(true);
  }, [loadMetrics]);

  // Return memoized state to prevent unnecessary re-renders
  return useMemo(() => ({
    metrics: state.metrics[pageType],
    loading: state.loading[pageType],
    error: state.errors[pageType],
    lastUpdate: state.lastUpdates[pageType],
    isRealTime: state.isRealTime,
    refreshMetrics,
    clearCacheAndReload,
    isConnected: !state.errors[pageType] && state.metrics[pageType] !== null
  }), [
    state.metrics[pageType],
    state.loading[pageType],
    state.errors[pageType],
    state.lastUpdates[pageType],
    state.isRealTime,
    refreshMetrics,
    clearCacheAndReload,
    pageType
  ]);
};

/**
 * Specialized hooks for different page types
 */

/**
 * Hook for Home page metrics
 */
export const useGlobalHomeMetrics = (options = {}) => {
  return useGlobalMetrics('home', options);
};

/**
 * Hook for Dashboard metrics with filters
 */
export const useGlobalDashboardMetrics = (filters = {}, options = {}) => {
  return useGlobalMetrics('dashboard', { ...options, filters });
};

/**
 * Hook for Questionnaires metrics
 */
export const useGlobalQuestionnaireMetrics = (options = {}) => {
  return useGlobalMetrics('questionnaires', options);
};

/**
 * Hook for Responses metrics
 */
export const useGlobalResponsesMetrics = (options = {}) => {
  return useGlobalMetrics('responses', options);
};

/**
 * Hook for Users metrics
 */
export const useGlobalUsersMetrics = (options = {}) => {
  return useGlobalMetrics('users', options);
};


/**
 * Cleanup function for app unmount
 * Call this in your main App component's useEffect cleanup
 */
export const cleanupGlobalMetrics = () => {
  globalMetricsStore.cleanup();
  metricsCache.clear();
  console.log('🧹 Global metrics system cleaned up');
};

export default useGlobalMetrics;