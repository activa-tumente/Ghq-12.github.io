/**
 * Observer Pattern Implementation for Error Handling
 * Provides centralized error monitoring, notification, and recovery coordination
 */

import { getConfig } from '../config';
import { ErrorFactory, ERROR_SEVERITY, RECOVERY_STRATEGIES } from '../factories/ErrorFactory';

/**
 * Event types for error observer
 */
export const ERROR_EVENTS = {
  ERROR_OCCURRED: 'error_occurred',
  ERROR_RESOLVED: 'error_resolved',
  ERROR_ESCALATED: 'error_escalated',
  RECOVERY_ATTEMPTED: 'recovery_attempted',
  RECOVERY_SUCCEEDED: 'recovery_succeeded',
  RECOVERY_FAILED: 'recovery_failed',
  PATTERN_DETECTED: 'pattern_detected',
  THRESHOLD_EXCEEDED: 'threshold_exceeded'
};

/**
 * Observer interface for error handling
 */
export class ErrorObserver {
  constructor(id, priority = 0) {
    this.id = id;
    this.priority = priority;
  }

  /**
   * Handle error event notification
   * @param {string} eventType - Type of error event
   * @param {Object} data - Event data
   */
  notify(eventType, data) {
    throw new Error('notify method must be implemented by observer');
  }

  /**
   * Check if observer should handle this event
   * @param {string} eventType - Type of error event
   * @param {Object} data - Event data
   * @returns {boolean} Whether observer should handle event
   */
  shouldHandle(eventType, data) {
    return true; // Override in specific observers
  }
}

/**
 * Console Logger Observer
 */
export class ConsoleLoggerObserver extends ErrorObserver {
  constructor() {
    super('console_logger', 100);
  }

  notify(eventType, data) {
    const config = getConfig();
    
    if (!config.features.enableErrorLogging) {
      return;
    }

    const timestamp = new Date().toISOString();
    const { error, context = {} } = data;

    switch (eventType) {
      case ERROR_EVENTS.ERROR_OCCURRED:
        this.logError(error, context, timestamp);
        break;
      case ERROR_EVENTS.ERROR_RESOLVED:
        console.log(`✅ [${timestamp}] Error resolved:`, {
          errorId: error.id,
          type: error.type,
          resolution: context.resolution
        });
        break;
      case ERROR_EVENTS.RECOVERY_ATTEMPTED:
        console.log(`🔄 [${timestamp}] Recovery attempted:`, {
          errorId: error.id,
          strategy: context.strategy,
          attempt: context.attempt
        });
        break;
      case ERROR_EVENTS.RECOVERY_SUCCEEDED:
        console.log(`✅ [${timestamp}] Recovery succeeded:`, {
          errorId: error.id,
          strategy: context.strategy,
          attempts: context.attempts
        });
        break;
      case ERROR_EVENTS.RECOVERY_FAILED:
        console.error(`❌ [${timestamp}] Recovery failed:`, {
          errorId: error.id,
          strategy: context.strategy,
          attempts: context.attempts,
          reason: context.reason
        });
        break;
      case ERROR_EVENTS.PATTERN_DETECTED:
        console.warn(`🔍 [${timestamp}] Error pattern detected:`, {
          pattern: context.pattern,
          occurrences: context.occurrences,
          timeWindow: context.timeWindow
        });
        break;
      case ERROR_EVENTS.THRESHOLD_EXCEEDED:
        console.error(`⚠️ [${timestamp}] Error threshold exceeded:`, {
          threshold: context.threshold,
          current: context.current,
          timeWindow: context.timeWindow
        });
        break;
    }
  }

  logError(error, context, timestamp) {
    const severity = error.severity || ERROR_SEVERITY.MEDIUM;
    const logData = {
      id: error.id,
      type: error.type,
      message: error.message,
      severity,
      category: error.category,
      context,
      timestamp
    };

    switch (severity) {
      case ERROR_SEVERITY.LOW:
        console.info(`🔵 [${timestamp}] Low severity error:`, logData);
        break;
      case ERROR_SEVERITY.MEDIUM:
        console.warn(`🟡 [${timestamp}] Medium severity error:`, logData);
        break;
      case ERROR_SEVERITY.HIGH:
        console.error(`🟠 [${timestamp}] High severity error:`, logData);
        break;
      case ERROR_SEVERITY.CRITICAL:
        console.error(`🔴 [${timestamp}] Critical error:`, logData);
        break;
      default:
        console.error(`❓ [${timestamp}] Unknown severity error:`, logData);
    }
  }
}

/**
 * Analytics Observer
 */
export class AnalyticsObserver extends ErrorObserver {
  constructor() {
    super('analytics', 90);
    this.errorCounts = new Map();
    this.errorPatterns = new Map();
    this.sessionErrors = [];
  }

  notify(eventType, data) {
    const config = getConfig();
    
    if (!config.features.enableAnalytics) {
      return;
    }

    switch (eventType) {
      case ERROR_EVENTS.ERROR_OCCURRED:
        this.trackError(data.error, data.context);
        this.sendToAnalytics('error_occurred', data);
        break;
      case ERROR_EVENTS.ERROR_RESOLVED:
        this.sendToAnalytics('error_resolved', data);
        break;
      case ERROR_EVENTS.RECOVERY_SUCCEEDED:
        this.sendToAnalytics('recovery_succeeded', data);
        break;
      case ERROR_EVENTS.RECOVERY_FAILED:
        this.sendToAnalytics('recovery_failed', data);
        break;
    }
  }

  trackError(error, context) {
    // Track error counts by type
    const errorType = error.type;
    const currentCount = this.errorCounts.get(errorType) || 0;
    this.errorCounts.set(errorType, currentCount + 1);

    // Track session errors
    this.sessionErrors.push({
      error,
      context,
      timestamp: Date.now()
    });

    // Keep only last 100 errors in memory
    if (this.sessionErrors.length > 100) {
      this.sessionErrors = this.sessionErrors.slice(-100);
    }
  }

  sendToAnalytics(eventName, data) {
    // Send to Google Analytics
    if (window.gtag) {
      window.gtag('event', eventName, {
        error_type: data.error?.type,
        error_severity: data.error?.severity,
        error_category: data.error?.category,
        custom_parameter_1: data.context?.component,
        custom_parameter_2: data.context?.action
      });
    }

    // Send to other analytics services
    if (window.mixpanel) {
      window.mixpanel.track(eventName, {
        error_id: data.error?.id,
        error_type: data.error?.type,
        error_severity: data.error?.severity,
        ...data.context
      });
    }
  }

  getErrorStatistics() {
    return {
      errorCounts: Object.fromEntries(this.errorCounts),
      sessionErrors: this.sessionErrors.length,
      patterns: Object.fromEntries(this.errorPatterns)
    };
  }
}

/**
 * Recovery Coordinator Observer
 */
export class RecoveryCoordinatorObserver extends ErrorObserver {
  constructor() {
    super('recovery_coordinator', 80);
    this.recoveryAttempts = new Map();
    this.maxRetries = 3;
    this.retryDelays = [1000, 2000, 5000]; // Progressive delays
  }

  notify(eventType, data) {
    switch (eventType) {
      case ERROR_EVENTS.ERROR_OCCURRED:
        this.initiateRecovery(data.error, data.context);
        break;
      case ERROR_EVENTS.RECOVERY_FAILED:
        this.handleRecoveryFailure(data.error, data.context);
        break;
    }
  }

  shouldHandle(eventType, data) {
    // Only handle errors that have recovery strategies
    if (eventType === ERROR_EVENTS.ERROR_OCCURRED) {
      const strategy = data.error?.recoveryStrategy;
      return strategy && strategy !== RECOVERY_STRATEGIES.ESCALATE;
    }
    return true;
  }

  async initiateRecovery(error, context) {
    const strategy = error.recoveryStrategy;
    const errorId = error.id;
    
    if (!strategy || strategy === RECOVERY_STRATEGIES.ESCALATE) {
      return;
    }

    // Track recovery attempts
    const attempts = this.recoveryAttempts.get(errorId) || 0;
    
    if (attempts >= this.maxRetries) {
      ErrorSubject.notify(ERROR_EVENTS.RECOVERY_FAILED, {
        error,
        context: {
          ...context,
          strategy,
          attempts,
          reason: 'Max retries exceeded'
        }
      });
      return;
    }

    this.recoveryAttempts.set(errorId, attempts + 1);

    ErrorSubject.notify(ERROR_EVENTS.RECOVERY_ATTEMPTED, {
      error,
      context: {
        ...context,
        strategy,
        attempt: attempts + 1
      }
    });

    try {
      const success = await this.executeRecoveryStrategy(strategy, error, context);
      
      if (success) {
        this.recoveryAttempts.delete(errorId);
        ErrorSubject.notify(ERROR_EVENTS.RECOVERY_SUCCEEDED, {
          error,
          context: {
            ...context,
            strategy,
            attempts: attempts + 1
          }
        });
        
        ErrorSubject.notify(ERROR_EVENTS.ERROR_RESOLVED, {
          error,
          context: {
            ...context,
            resolution: `Recovered using ${strategy}`
          }
        });
      } else {
        // Schedule retry with progressive delay
        const delay = this.retryDelays[Math.min(attempts, this.retryDelays.length - 1)];
        setTimeout(() => {
          this.initiateRecovery(error, context);
        }, delay);
      }
    } catch (recoveryError) {
      ErrorSubject.notify(ERROR_EVENTS.RECOVERY_FAILED, {
        error,
        context: {
          ...context,
          strategy,
          attempts: attempts + 1,
          reason: recoveryError.message
        }
      });
    }
  }

  async executeRecoveryStrategy(strategy, error, context) {
    switch (strategy) {
      case RECOVERY_STRATEGIES.RETRY:
        return this.retryOperation(error, context);
      
      case RECOVERY_STRATEGIES.FALLBACK:
        return this.useFallback(error, context);
      
      case RECOVERY_STRATEGIES.REFRESH:
        return this.refreshPage(error, context);
      
      case RECOVERY_STRATEGIES.REDIRECT:
        return this.redirectUser(error, context);
      
      case RECOVERY_STRATEGIES.USER_ACTION:
        return this.requestUserAction(error, context);
      
      case RECOVERY_STRATEGIES.IGNORE:
        return true; // Always succeed for ignore strategy
      
      default:
        return false;
    }
  }

  async retryOperation(error, context) {
    if (context.retryFunction && typeof context.retryFunction === 'function') {
      try {
        await context.retryFunction();
        return true;
      } catch (retryError) {
        return false;
      }
    }
    return false;
  }

  async useFallback(error, context) {
    if (context.fallbackFunction && typeof context.fallbackFunction === 'function') {
      try {
        await context.fallbackFunction();
        return true;
      } catch (fallbackError) {
        return false;
      }
    }
    return false;
  }

  async refreshPage(error, context) {
    // Only refresh if it's safe to do so
    if (context.allowRefresh !== false) {
      window.location.reload();
      return true;
    }
    return false;
  }

  async redirectUser(error, context) {
    const redirectUrl = context.redirectUrl || '/';
    window.location.href = redirectUrl;
    return true;
  }

  async requestUserAction(error, context) {
    // This would typically show a user notification
    // For now, we'll just return false to indicate manual intervention needed
    return false;
  }

  handleRecoveryFailure(error, context) {
    // Escalate to higher-level error handling
    ErrorSubject.notify(ERROR_EVENTS.ERROR_ESCALATED, {
      error,
      context: {
        ...context,
        escalationReason: 'Recovery failed after maximum attempts'
      }
    });
  }
}

/**
 * Pattern Detection Observer
 */
export class PatternDetectionObserver extends ErrorObserver {
  constructor() {
    super('pattern_detection', 70);
    this.errorHistory = [];
    this.patterns = new Map();
    this.thresholds = {
      sameErrorType: { count: 5, timeWindow: 60000 }, // 5 same errors in 1 minute
      totalErrors: { count: 10, timeWindow: 300000 }, // 10 total errors in 5 minutes
      criticalErrors: { count: 2, timeWindow: 60000 } // 2 critical errors in 1 minute
    };
  }

  notify(eventType, data) {
    if (eventType === ERROR_EVENTS.ERROR_OCCURRED) {
      this.analyzeError(data.error, data.context);
    }
  }

  analyzeError(error, context) {
    const now = Date.now();
    
    // Add to history
    this.errorHistory.push({
      error,
      context,
      timestamp: now
    });

    // Clean old entries
    this.cleanOldEntries(now);

    // Check for patterns
    this.checkSameErrorTypePattern(error, now);
    this.checkTotalErrorsThreshold(now);
    this.checkCriticalErrorsThreshold(now);
  }

  cleanOldEntries(now) {
    const maxAge = Math.max(...Object.values(this.thresholds).map(t => t.timeWindow));
    this.errorHistory = this.errorHistory.filter(entry => 
      now - entry.timestamp <= maxAge
    );
  }

  checkSameErrorTypePattern(error, now) {
    const threshold = this.thresholds.sameErrorType;
    const recentSameErrors = this.errorHistory.filter(entry => 
      entry.error.type === error.type &&
      now - entry.timestamp <= threshold.timeWindow
    );

    if (recentSameErrors.length >= threshold.count) {
      ErrorSubject.notify(ERROR_EVENTS.PATTERN_DETECTED, {
        error,
        context: {
          pattern: 'same_error_type',
          errorType: error.type,
          occurrences: recentSameErrors.length,
          timeWindow: threshold.timeWindow
        }
      });
    }
  }

  checkTotalErrorsThreshold(now) {
    const threshold = this.thresholds.totalErrors;
    const recentErrors = this.errorHistory.filter(entry => 
      now - entry.timestamp <= threshold.timeWindow
    );

    if (recentErrors.length >= threshold.count) {
      ErrorSubject.notify(ERROR_EVENTS.THRESHOLD_EXCEEDED, {
        error: null,
        context: {
          threshold: 'total_errors',
          current: recentErrors.length,
          limit: threshold.count,
          timeWindow: threshold.timeWindow
        }
      });
    }
  }

  checkCriticalErrorsThreshold(now) {
    const threshold = this.thresholds.criticalErrors;
    const recentCriticalErrors = this.errorHistory.filter(entry => 
      entry.error.severity === ERROR_SEVERITY.CRITICAL &&
      now - entry.timestamp <= threshold.timeWindow
    );

    if (recentCriticalErrors.length >= threshold.count) {
      ErrorSubject.notify(ERROR_EVENTS.THRESHOLD_EXCEEDED, {
        error: null,
        context: {
          threshold: 'critical_errors',
          current: recentCriticalErrors.length,
          limit: threshold.count,
          timeWindow: threshold.timeWindow
        }
      });
    }
  }
}

/**
 * External Reporting Observer
 */
export class ExternalReportingObserver extends ErrorObserver {
  constructor() {
    super('external_reporting', 60);
    this.reportingQueue = [];
    this.isProcessing = false;
  }

  notify(eventType, data) {
    const config = getConfig();
    
    if (!config.features.enableErrorReporting) {
      return;
    }

    if (eventType === ERROR_EVENTS.ERROR_OCCURRED && 
        ErrorFactory.shouldReportError(data.error)) {
      this.queueForReporting(data.error, data.context);
    }
  }

  shouldHandle(eventType, data) {
    return eventType === ERROR_EVENTS.ERROR_OCCURRED && 
           data.error && 
           ErrorFactory.shouldReportError(data.error);
  }

  queueForReporting(error, context) {
    this.reportingQueue.push({ error, context, timestamp: Date.now() });
    
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  async processQueue() {
    this.isProcessing = true;
    
    while (this.reportingQueue.length > 0) {
      const item = this.reportingQueue.shift();
      try {
        await this.reportError(item.error, item.context);
      } catch (reportingError) {
        console.error('Failed to report error:', reportingError);
      }
    }
    
    this.isProcessing = false;
  }

  async reportError(error, context) {
    const config = getConfig();
    
    // Report to Sentry
    if (window.Sentry) {
      window.Sentry.captureException(error, {
        tags: {
          severity: error.severity,
          category: error.category,
          type: error.type
        },
        extra: {
          context,
          errorId: error.id,
          timestamp: error.timestamp
        }
      });
    }

    // Report to custom error service
    if (config.api.errorReportingEndpoint) {
      try {
        await fetch(config.api.errorReportingEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            error: error.toJSON ? error.toJSON() : error,
            context,
            environment: config.environment.current,
            timestamp: new Date().toISOString()
          })
        });
      } catch (networkError) {
        console.error('Failed to send error report:', networkError);
      }
    }
  }
}

/**
 * Error Subject (Observable)
 */
export class ErrorSubject {
  static observers = new Map();
  static isInitialized = false;

  /**
   * Initialize with default observers
   */
  static initialize() {
    if (this.isInitialized) {
      return;
    }

    // Register default observers
    this.addObserver(new ConsoleLoggerObserver());
    this.addObserver(new AnalyticsObserver());
    this.addObserver(new RecoveryCoordinatorObserver());
    this.addObserver(new PatternDetectionObserver());
    this.addObserver(new ExternalReportingObserver());

    this.isInitialized = true;
  }

  /**
   * Add an observer
   */
  static addObserver(observer) {
    if (!(observer instanceof ErrorObserver)) {
      throw new Error('Observer must extend ErrorObserver class');
    }
    
    this.observers.set(observer.id, observer);
  }

  /**
   * Remove an observer
   */
  static removeObserver(observerId) {
    return this.observers.delete(observerId);
  }

  /**
   * Notify all observers of an event
   */
  static notify(eventType, data) {
    // Sort observers by priority (higher priority first)
    const sortedObservers = Array.from(this.observers.values())
      .sort((a, b) => b.priority - a.priority);

    for (const observer of sortedObservers) {
      try {
        if (observer.shouldHandle(eventType, data)) {
          observer.notify(eventType, data);
        }
      } catch (observerError) {
        console.error(`Observer ${observer.id} failed to handle event:`, observerError);
      }
    }
  }

  /**
   * Report an error (convenience method)
   */
  static reportError(error, context = {}) {
    // Ensure error is an AppError instance
    if (!(error instanceof Error)) {
      error = ErrorFactory.createError(String(error));
    } else if (!error.type) {
      error = ErrorFactory.createFromJavaScriptError(error, context);
    }

    this.notify(ERROR_EVENTS.ERROR_OCCURRED, { error, context });
  }

  /**
   * Get all observers
   */
  static getObservers() {
    return Array.from(this.observers.values());
  }

  /**
   * Get observer by ID
   */
  static getObserver(observerId) {
    return this.observers.get(observerId);
  }

  /**
   * Clear all observers
   */
  static clearObservers() {
    this.observers.clear();
    this.isInitialized = false;
  }
}

// Initialize the error subject
ErrorSubject.initialize();

export default ErrorSubject;