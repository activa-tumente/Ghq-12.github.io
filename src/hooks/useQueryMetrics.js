import { useState, useCallback, useRef } from 'react';

/**
 * Performance metrics configuration
 */
export const METRICS_CONFIG = {
  ENABLE_METRICS: process.env.NODE_ENV === 'development' || process.env.REACT_APP_ENABLE_METRICS === 'true',
  MAX_METRICS_ENTRIES: 1000,
  PERFORMANCE_THRESHOLDS: {
    FAST: 100, // ms
    MEDIUM: 500, // ms
    SLOW: 1000, // ms
  },
  RETENTION_PERIOD: 24 * 60 * 60 * 1000, // 24 hours
};

/**
 * Query performance metrics tracker
 */
class QueryMetricsTracker {
  constructor(maxEntries = METRICS_CONFIG.MAX_METRICS_ENTRIES) {
    this.maxEntries = maxEntries;
    this.metrics = new Map();
    this.globalStats = {
      totalQueries: 0,
      totalTime: 0,
      averageTime: 0,
      fastQueries: 0,
      mediumQueries: 0,
      slowQueries: 0,
      errorCount: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
  }

  /**
   * Start tracking a query
   */
  startQuery(queryName, params = {}) {
    const queryId = this.generateQueryId(queryName, params);
    const startTime = performance.now();
    
    const queryMetric = {
      queryId,
      queryName,
      params,
      startTime,
      endTime: null,
      duration: null,
      status: 'pending',
      error: null,
      cacheHit: false,
      timestamp: Date.now()
    };
    
    this.metrics.set(queryId, queryMetric);
    this.cleanupOldMetrics();
    
    return queryId;
  }

  /**
   * End tracking a query with success
   */
  endQuery(queryId, cacheHit = false) {
    const metric = this.metrics.get(queryId);
    if (!metric) return null;
    
    const endTime = performance.now();
    const duration = endTime - metric.startTime;
    
    metric.endTime = endTime;
    metric.duration = duration;
    metric.status = 'success';
    metric.cacheHit = cacheHit;
    
    this.updateGlobalStats(metric);
    
    return metric;
  }

  /**
   * End tracking a query with error
   */
  endQueryWithError(queryId, error) {
    const metric = this.metrics.get(queryId);
    if (!metric) return null;
    
    const endTime = performance.now();
    const duration = endTime - metric.startTime;
    
    metric.endTime = endTime;
    metric.duration = duration;
    metric.status = 'error';
    metric.error = {
      message: error.message,
      type: error.constructor.name,
      stack: error.stack
    };
    
    this.updateGlobalStats(metric);
    
    return metric;
  }

  /**
   * Update global statistics
   */
  updateGlobalStats(metric) {
    this.globalStats.totalQueries++;
    
    if (metric.status === 'success') {
      this.globalStats.totalTime += metric.duration;
      this.globalStats.averageTime = this.globalStats.totalTime / this.globalStats.totalQueries;
      
      // Categorize by performance
      if (metric.duration <= METRICS_CONFIG.PERFORMANCE_THRESHOLDS.FAST) {
        this.globalStats.fastQueries++;
      } else if (metric.duration <= METRICS_CONFIG.PERFORMANCE_THRESHOLDS.MEDIUM) {
        this.globalStats.mediumQueries++;
      } else {
        this.globalStats.slowQueries++;
      }
      
      // Track cache performance
      if (metric.cacheHit) {
        this.globalStats.cacheHits++;
      } else {
        this.globalStats.cacheMisses++;
      }
    } else if (metric.status === 'error') {
      this.globalStats.errorCount++;
    }
  }

  /**
   * Generate unique query ID
   */
  generateQueryId(queryName, params) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const paramsHash = this.hashParams(params);
    return `${queryName}_${paramsHash}_${timestamp}_${random}`;
  }

  /**
   * Hash parameters for consistent ID generation
   */
  hashParams(params) {
    const str = JSON.stringify(params, Object.keys(params).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Clean up old metrics to prevent memory leaks
   */
  cleanupOldMetrics() {
    if (this.metrics.size <= this.maxEntries) return;
    
    const now = Date.now();
    const cutoff = now - METRICS_CONFIG.RETENTION_PERIOD;
    
    // Remove old entries
    for (const [queryId, metric] of this.metrics.entries()) {
      if (metric.timestamp < cutoff) {
        this.metrics.delete(queryId);
      }
    }
    
    // If still too many, remove oldest entries
    if (this.metrics.size > this.maxEntries) {
      const sortedEntries = Array.from(this.metrics.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp);
      
      const toRemove = this.metrics.size - this.maxEntries;
      for (let i = 0; i < toRemove; i++) {
        this.metrics.delete(sortedEntries[i][0]);
      }
    }
  }

  /**
   * Get metrics for a specific query
   */
  getQueryMetrics(queryName) {
    const queryMetrics = Array.from(this.metrics.values())
      .filter(metric => metric.queryName === queryName)
      .sort((a, b) => b.timestamp - a.timestamp);
    
    if (queryMetrics.length === 0) return null;
    
    const successfulQueries = queryMetrics.filter(m => m.status === 'success');
    const durations = successfulQueries.map(m => m.duration);
    
    return {
      queryName,
      totalCalls: queryMetrics.length,
      successfulCalls: successfulQueries.length,
      errorCalls: queryMetrics.filter(m => m.status === 'error').length,
      averageDuration: durations.length > 0 
        ? durations.reduce((a, b) => a + b, 0) / durations.length 
        : 0,
      minDuration: durations.length > 0 ? Math.min(...durations) : 0,
      maxDuration: durations.length > 0 ? Math.max(...durations) : 0,
      cacheHitRate: successfulQueries.length > 0 
        ? (successfulQueries.filter(m => m.cacheHit).length / successfulQueries.length * 100)
        : 0,
      recentCalls: queryMetrics.slice(0, 10)
    };
  }

  /**
   * Get global performance statistics
   */
  getGlobalStats() {
    const cacheHitRate = this.globalStats.cacheHits + this.globalStats.cacheMisses > 0
      ? (this.globalStats.cacheHits / (this.globalStats.cacheHits + this.globalStats.cacheMisses) * 100)
      : 0;
    
    const errorRate = this.globalStats.totalQueries > 0
      ? (this.globalStats.errorCount / this.globalStats.totalQueries * 100)
      : 0;
    
    return {
      ...this.globalStats,
      cacheHitRate: parseFloat(cacheHitRate.toFixed(2)),
      errorRate: parseFloat(errorRate.toFixed(2)),
      performanceDistribution: {
        fast: this.globalStats.fastQueries,
        medium: this.globalStats.mediumQueries,
        slow: this.globalStats.slowQueries
      }
    };
  }

  /**
   * Get all metrics
   */
  getAllMetrics() {
    return Array.from(this.metrics.values())
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics.clear();
    this.globalStats = {
      totalQueries: 0,
      totalTime: 0,
      averageTime: 0,
      fastQueries: 0,
      mediumQueries: 0,
      slowQueries: 0,
      errorCount: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
  }
}

/**
 * Custom hook for query performance metrics
 * Tracks query performance, cache hit rates, and error rates
 * 
 * @param {Object} options - Metrics configuration options
 * @param {boolean} options.enabled - Whether to enable metrics tracking
 * @param {number} options.maxEntries - Maximum number of metric entries to keep
 * @returns {Object} Metrics tracking functions and data
 */
export const useQueryMetrics = (options = {}) => {
  const {
    enabled = METRICS_CONFIG.ENABLE_METRICS,
    maxEntries = METRICS_CONFIG.MAX_METRICS_ENTRIES
  } = options;

  const metricsTrackerRef = useRef(new QueryMetricsTracker(maxEntries));
  const [metricsState, setMetricsState] = useState({
    isEnabled: enabled,
    globalStats: metricsTrackerRef.current.getGlobalStats()
  });

  /**
   * Start tracking a query
   */
  const startQueryTracking = useCallback((queryName, params = {}) => {
    if (!metricsState.isEnabled) return null;
    return metricsTrackerRef.current.startQuery(queryName, params);
  }, [metricsState.isEnabled]);

  /**
   * End tracking a successful query
   */
  const endQueryTracking = useCallback((queryId, cacheHit = false) => {
    if (!metricsState.isEnabled || !queryId) return null;
    
    const metric = metricsTrackerRef.current.endQuery(queryId, cacheHit);
    
    // Update state with new global stats
    setMetricsState(prev => ({
      ...prev,
      globalStats: metricsTrackerRef.current.getGlobalStats()
    }));
    
    return metric;
  }, [metricsState.isEnabled]);

  /**
   * End tracking a failed query
   */
  const endQueryTrackingWithError = useCallback((queryId, error) => {
    if (!metricsState.isEnabled || !queryId) return null;
    
    const metric = metricsTrackerRef.current.endQueryWithError(queryId, error);
    
    // Update state with new global stats
    setMetricsState(prev => ({
      ...prev,
      globalStats: metricsTrackerRef.current.getGlobalStats()
    }));
    
    return metric;
  }, [metricsState.isEnabled]);

  /**
   * Get metrics for a specific query
   */
  const getQueryMetrics = useCallback((queryName) => {
    if (!metricsState.isEnabled) return null;
    return metricsTrackerRef.current.getQueryMetrics(queryName);
  }, [metricsState.isEnabled]);

  /**
   * Get global performance statistics
   */
  const getGlobalMetrics = useCallback(() => {
    return metricsTrackerRef.current.getGlobalStats();
  }, []);

  /**
   * Get all metrics
   */
  const getAllMetrics = useCallback(() => {
    if (!metricsState.isEnabled) return [];
    return metricsTrackerRef.current.getAllMetrics();
  }, [metricsState.isEnabled]);

  /**
   * Clear all metrics
   */
  const clearMetrics = useCallback(() => {
    metricsTrackerRef.current.clear();
    setMetricsState(prev => ({
      ...prev,
      globalStats: metricsTrackerRef.current.getGlobalStats()
    }));
  }, []);

  /**
   * Enable or disable metrics tracking
   */
  const setMetricsEnabled = useCallback((enabled) => {
    setMetricsState(prev => ({ ...prev, isEnabled: enabled }));
  }, []);

  /**
   * Get performance insights and recommendations
   */
  const getPerformanceInsights = useCallback(() => {
    const stats = metricsTrackerRef.current.getGlobalStats();
    const insights = [];
    
    // Cache performance insights
    if (stats.cacheHitRate < 50) {
      insights.push({
        type: 'warning',
        category: 'cache',
        message: `Low cache hit rate (${stats.cacheHitRate}%). Consider increasing cache TTL or reviewing cache strategy.`,
        priority: 'medium'
      });
    }
    
    // Error rate insights
    if (stats.errorRate > 5) {
      insights.push({
        type: 'error',
        category: 'reliability',
        message: `High error rate (${stats.errorRate}%). Review error handling and retry strategies.`,
        priority: 'high'
      });
    }
    
    // Performance insights
    const slowQueryPercentage = stats.totalQueries > 0 
      ? (stats.slowQueries / stats.totalQueries * 100) 
      : 0;
    
    if (slowQueryPercentage > 20) {
      insights.push({
        type: 'warning',
        category: 'performance',
        message: `${slowQueryPercentage.toFixed(1)}% of queries are slow (>${METRICS_CONFIG.PERFORMANCE_THRESHOLDS.SLOW}ms). Consider query optimization.`,
        priority: 'medium'
      });
    }
    
    // Average response time insights
    if (stats.averageTime > METRICS_CONFIG.PERFORMANCE_THRESHOLDS.MEDIUM) {
      insights.push({
        type: 'info',
        category: 'performance',
        message: `Average query time is ${stats.averageTime.toFixed(0)}ms. Consider implementing query optimization strategies.`,
        priority: 'low'
      });
    }
    
    return insights;
  }, []);

  return {
    // Tracking functions
    startQueryTracking,
    endQueryTracking,
    endQueryTrackingWithError,
    
    // Data retrieval
    getQueryMetrics,
    getGlobalMetrics,
    getAllMetrics,
    getPerformanceInsights,
    
    // Management
    clearMetrics,
    setMetricsEnabled,
    
    // State
    isEnabled: metricsState.isEnabled,
    globalStats: metricsState.globalStats
  };
};

export default useQueryMetrics;