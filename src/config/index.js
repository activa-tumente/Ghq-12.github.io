/**
 * Centralized Configuration Management System
 * Provides environment-aware configuration with validation and type safety
 */

/**
 * Environment detection utilities
 */
const getEnvironment = () => {
  return process.env.NODE_ENV || 'development';
};

const isDevelopment = () => getEnvironment() === 'development';
const isProduction = () => getEnvironment() === 'production';
const isTesting = () => getEnvironment() === 'test';

/**
 * Configuration validation utilities
 */
const validateRequired = (value, name) => {
  if (value === undefined || value === null || value === '') {
    throw new Error(`Required configuration value '${name}' is missing`);
  }
  return value;
};

const validateNumber = (value, name, defaultValue = 0) => {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  const num = Number(value);
  if (isNaN(num)) {
    throw new Error(`Configuration value '${name}' must be a valid number, got: ${value}`);
  }
  return num;
};

const validateBoolean = (value, name, defaultValue = false) => {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  throw new Error(`Configuration value '${name}' must be a boolean, got: ${value}`);
};

const validateUrl = (value, name, required = false) => {
  if (!value && !required) {
    return null;
  }
  if (!value && required) {
    throw new Error(`Required URL configuration '${name}' is missing`);
  }
  try {
    new URL(value);
    return value;
  } catch (error) {
    throw new Error(`Configuration value '${name}' must be a valid URL, got: ${value}`);
  }
};

/**
 * Base configuration that applies to all environments
 */
const baseConfig = {
  // Application metadata
  app: {
    name: process.env.REACT_APP_NAME || 'Cuestionario de Salud General (GHQ-12)',
    version: process.env.REACT_APP_VERSION || '1.0.0',
    description: 'Psychological Evaluation System - Behavioral Assessment Tool 7',
    author: 'Development Team'
  },

  // API configuration
  api: {
    timeout: validateNumber(process.env.REACT_APP_API_TIMEOUT, 'REACT_APP_API_TIMEOUT', 30000),
    retries: validateNumber(process.env.REACT_APP_API_RETRIES, 'REACT_APP_API_RETRIES', 3),
    retryDelay: validateNumber(process.env.REACT_APP_API_RETRY_DELAY, 'REACT_APP_API_RETRY_DELAY', 1000),
    retryBackoffMultiplier: validateNumber(process.env.REACT_APP_API_RETRY_BACKOFF, 'REACT_APP_API_RETRY_BACKOFF', 2),
    maxRetryDelay: validateNumber(process.env.REACT_APP_API_MAX_RETRY_DELAY, 'REACT_APP_API_MAX_RETRY_DELAY', 10000)
  },

  // Cache configuration
  cache: {
    defaultTTL: validateNumber(process.env.REACT_APP_CACHE_DEFAULT_TTL, 'REACT_APP_CACHE_DEFAULT_TTL', 5 * 60 * 1000), // 5 minutes
    analyticsTTL: validateNumber(process.env.REACT_APP_CACHE_ANALYTICS_TTL, 'REACT_APP_CACHE_ANALYTICS_TTL', 10 * 60 * 1000), // 10 minutes
    staticTTL: validateNumber(process.env.REACT_APP_CACHE_STATIC_TTL, 'REACT_APP_CACHE_STATIC_TTL', 30 * 60 * 1000), // 30 minutes
    maxSize: validateNumber(process.env.REACT_APP_CACHE_MAX_SIZE, 'REACT_APP_CACHE_MAX_SIZE', 100),
    staleWhileRevalidate: validateNumber(process.env.REACT_APP_CACHE_SWR, 'REACT_APP_CACHE_SWR', 2 * 60 * 1000), // 2 minutes
    enableMetrics: validateBoolean(process.env.REACT_APP_CACHE_ENABLE_METRICS, 'REACT_APP_CACHE_ENABLE_METRICS', true)
  },

  // Performance monitoring
  performance: {
    enableMetrics: validateBoolean(process.env.REACT_APP_ENABLE_METRICS, 'REACT_APP_ENABLE_METRICS', true),
    maxMetricsEntries: validateNumber(process.env.REACT_APP_MAX_METRICS_ENTRIES, 'REACT_APP_MAX_METRICS_ENTRIES', 1000),
    metricsRetentionPeriod: validateNumber(process.env.REACT_APP_METRICS_RETENTION, 'REACT_APP_METRICS_RETENTION', 24 * 60 * 60 * 1000), // 24 hours
    thresholds: {
      fast: validateNumber(process.env.REACT_APP_PERF_FAST_THRESHOLD, 'REACT_APP_PERF_FAST_THRESHOLD', 100), // ms
      medium: validateNumber(process.env.REACT_APP_PERF_MEDIUM_THRESHOLD, 'REACT_APP_PERF_MEDIUM_THRESHOLD', 500), // ms
      slow: validateNumber(process.env.REACT_APP_PERF_SLOW_THRESHOLD, 'REACT_APP_PERF_SLOW_THRESHOLD', 1000) // ms
    }
  },

  // UI/UX configuration
  ui: {
    theme: process.env.REACT_APP_DEFAULT_THEME || 'light',
    language: process.env.REACT_APP_DEFAULT_LANGUAGE || 'es',
    pageSize: validateNumber(process.env.REACT_APP_DEFAULT_PAGE_SIZE, 'REACT_APP_DEFAULT_PAGE_SIZE', 20),
    maxPageSize: validateNumber(process.env.REACT_APP_MAX_PAGE_SIZE, 'REACT_APP_MAX_PAGE_SIZE', 100),
    animationDuration: validateNumber(process.env.REACT_APP_ANIMATION_DURATION, 'REACT_APP_ANIMATION_DURATION', 300), // ms
    debounceDelay: validateNumber(process.env.REACT_APP_DEBOUNCE_DELAY, 'REACT_APP_DEBOUNCE_DELAY', 300), // ms
    toastDuration: validateNumber(process.env.REACT_APP_TOAST_DURATION, 'REACT_APP_TOAST_DURATION', 5000) // ms
  },

  // Security configuration
  security: {
    enableCSP: validateBoolean(process.env.REACT_APP_ENABLE_CSP, 'REACT_APP_ENABLE_CSP', true),
    sessionTimeout: validateNumber(process.env.REACT_APP_SESSION_TIMEOUT, 'REACT_APP_SESSION_TIMEOUT', 30 * 60 * 1000), // 30 minutes
    maxLoginAttempts: validateNumber(process.env.REACT_APP_MAX_LOGIN_ATTEMPTS, 'REACT_APP_MAX_LOGIN_ATTEMPTS', 5),
    lockoutDuration: validateNumber(process.env.REACT_APP_LOCKOUT_DURATION, 'REACT_APP_LOCKOUT_DURATION', 15 * 60 * 1000) // 15 minutes
  },

  // Feature flags
  features: {
    enableAnalytics: validateBoolean(process.env.REACT_APP_ENABLE_ANALYTICS, 'REACT_APP_ENABLE_ANALYTICS', false),
    enableErrorReporting: validateBoolean(process.env.REACT_APP_ENABLE_ERROR_REPORTING, 'REACT_APP_ENABLE_ERROR_REPORTING', true),
    enablePerformanceMonitoring: validateBoolean(process.env.REACT_APP_ENABLE_PERF_MONITORING, 'REACT_APP_ENABLE_PERF_MONITORING', true),
    enableOfflineMode: validateBoolean(process.env.REACT_APP_ENABLE_OFFLINE, 'REACT_APP_ENABLE_OFFLINE', false),
    enablePWA: validateBoolean(process.env.REACT_APP_ENABLE_PWA, 'REACT_APP_ENABLE_PWA', false)
  },

  // Supabase configuration
  supabase: {
    url: validateRequired(process.env.VITE_SUPABASE_URL, 'VITE_SUPABASE_URL'),
    anonKey: validateRequired(process.env.VITE_SUPABASE_ANON_KEY, 'VITE_SUPABASE_ANON_KEY'),
    enableRealtime: validateBoolean(process.env.VITE_SUPABASE_REALTIME, 'VITE_SUPABASE_REALTIME', false),
    enableAuth: validateBoolean(process.env.VITE_SUPABASE_AUTH, 'VITE_SUPABASE_AUTH', true)
  }
};

/**
 * Environment-specific configurations
 */
const environmentConfigs = {
  development: {
    api: {
      timeout: 10000, // Shorter timeout for development
      retries: 1 // Fewer retries for faster feedback
    },
    cache: {
      defaultTTL: 2 * 60 * 1000, // Shorter cache for development
      enableMetrics: true
    },
    performance: {
      enableMetrics: true,
      maxMetricsEntries: 500 // Smaller for development
    },
    features: {
      enableErrorReporting: false, // Disable in development
      enablePerformanceMonitoring: true
    },
    logging: {
      level: 'debug',
      enableConsole: true,
      enableRemote: false
    }
  },

  production: {
    api: {
      timeout: 30000,
      retries: 3
    },
    cache: {
      defaultTTL: 10 * 60 * 1000, // Longer cache for production
      analyticsTTL: 30 * 60 * 1000,
      maxSize: 200, // Larger cache for production
      enableMetrics: false // Disable detailed metrics in production
    },
    performance: {
      enableMetrics: false, // Disable detailed metrics in production
      maxMetricsEntries: 100
    },
    features: {
      enableErrorReporting: true,
      enablePerformanceMonitoring: true,
      enableAnalytics: true
    },
    logging: {
      level: 'error',
      enableConsole: false,
      enableRemote: true
    }
  },

  test: {
    api: {
      timeout: 5000,
      retries: 0 // No retries in tests
    },
    cache: {
      defaultTTL: 1000, // Very short cache for tests
      enableMetrics: false
    },
    performance: {
      enableMetrics: false
    },
    features: {
      enableErrorReporting: false,
      enablePerformanceMonitoring: false,
      enableAnalytics: false
    },
    logging: {
      level: 'silent',
      enableConsole: false,
      enableRemote: false
    }
  }
};

/**
 * Deep merge utility for configuration objects
 */
const deepMerge = (target, source) => {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
};

/**
 * Create the final configuration by merging base config with environment-specific config
 */
const createConfig = () => {
  const environment = getEnvironment();
  const envConfig = environmentConfigs[environment] || {};
  
  const config = deepMerge(baseConfig, envConfig);
  
  // Add environment information
  config.environment = {
    current: environment,
    isDevelopment: isDevelopment(),
    isProduction: isProduction(),
    isTesting: isTesting()
  };
  
  // Add build information
  config.build = {
    timestamp: process.env.REACT_APP_BUILD_TIMESTAMP || new Date().toISOString(),
    commit: process.env.REACT_APP_GIT_COMMIT || 'unknown',
    branch: process.env.REACT_APP_GIT_BRANCH || 'unknown'
  };
  
  return config;
};

/**
 * Configuration validation
 */
const validateConfig = (config) => {
  const errors = [];
  
  // Validate required Supabase configuration
  if (!config.supabase.url) {
    errors.push('Supabase URL is required');
  }
  if (!config.supabase.anonKey) {
    errors.push('Supabase anonymous key is required');
  }
  
  // Validate performance thresholds
  const { fast, medium, slow } = config.performance.thresholds;
  if (fast >= medium || medium >= slow) {
    errors.push('Performance thresholds must be in ascending order (fast < medium < slow)');
  }
  
  // Validate cache configuration
  if (config.cache.defaultTTL <= 0) {
    errors.push('Cache TTL must be positive');
  }
  if (config.cache.maxSize <= 0) {
    errors.push('Cache max size must be positive');
  }
  
  // Validate API configuration
  if (config.api.timeout <= 0) {
    errors.push('API timeout must be positive');
  }
  if (config.api.retries < 0) {
    errors.push('API retries must be non-negative');
  }
  
  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
  
  return true;
};

/**
 * Create and validate the configuration
 */
let config;
try {
  config = createConfig();
  validateConfig(config);
} catch (error) {
  console.error('Configuration Error:', error.message);
  throw error;
}

/**
 * Configuration utilities
 */
export const getConfig = () => config;

export const getEnvironmentConfig = () => config.environment;

export const isFeatureEnabled = (featureName) => {
  return config.features[featureName] || false;
};

export const getApiConfig = () => config.api;

export const getCacheConfig = () => config.cache;

export const getPerformanceConfig = () => config.performance;

export const getUIConfig = () => config.ui;

export const getSecurityConfig = () => config.security;

export const getSupabaseConfig = () => config.supabase;

export const getBuildInfo = () => config.build;

/**
 * Development utilities
 */
export const logConfig = () => {
  if (isDevelopment()) {
    console.group('🔧 Application Configuration');
    console.log('Environment:', config.environment.current);
    console.log('Version:', config.app.version);
    console.log('Build:', config.build);
    console.log('Features:', config.features);
    console.log('Full Config:', config);
    console.groupEnd();
  }
};

export const validateEnvironment = () => {
  const requiredEnvVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ];
  
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.join('\n')}\n\n` +
      'Please check your .env file and ensure all required variables are set.'
    );
  }
  
  return true;
};

// Export the main configuration object
export default config;

// Log configuration in development
if (isDevelopment()) {
  logConfig();
}