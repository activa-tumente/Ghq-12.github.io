import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { ExclamationTriangleIcon, ArrowPathIcon, HomeIcon } from '@heroicons/react/24/outline';
import { getConfig } from '../../config';

/**
 * Error types that can be automatically recovered from
 */
const RECOVERABLE_ERROR_TYPES = [
  'ChunkLoadError',
  'Loading chunk',
  'NetworkError',
  'Failed to fetch',
  'ERR_NETWORK',
  'ERR_INTERNET_DISCONNECTED'
];

/**
 * Error severity levels
 */
const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

/**
 * Determine error severity based on error type and context
 */
const getErrorSeverity = (error, errorInfo) => {
  // Critical errors that break the entire app
  if (error.name === 'ReferenceError' || error.name === 'TypeError') {
    return ERROR_SEVERITY.CRITICAL;
  }
  
  // High severity for component lifecycle errors
  if (errorInfo?.componentStack?.includes('componentDidMount') || 
      errorInfo?.componentStack?.includes('componentDidUpdate')) {
    return ERROR_SEVERITY.HIGH;
  }
  
  // Medium severity for network and chunk loading errors
  if (RECOVERABLE_ERROR_TYPES.some(type => 
    error.message?.includes(type) || error.name?.includes(type))) {
    return ERROR_SEVERITY.MEDIUM;
  }
  
  // Default to low severity
  return ERROR_SEVERITY.LOW;
};

/**
 * Error reporting utility
 */
const reportError = (error, errorInfo, context = {}) => {
  const config = getConfig();
  
  if (!config.features.enableErrorReporting) {
    return;
  }
  
  const errorReport = {
    message: error.message,
    stack: error.stack,
    name: error.name,
    componentStack: errorInfo?.componentStack,
    severity: getErrorSeverity(error, errorInfo),
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    userId: context.userId || 'anonymous',
    sessionId: context.sessionId || 'unknown',
    buildInfo: config.build,
    environment: config.environment.current
  };
  
  // Log to console in development
  if (config.environment.isDevelopment) {
    console.group('🚨 Error Boundary Caught Error');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Context:', context);
    console.error('Report:', errorReport);
    console.groupEnd();
  }
  
  // Send to error reporting service in production
  if (config.environment.isProduction && window.Sentry) {
    window.Sentry.captureException(error, {
      tags: {
        component: 'ErrorBoundary',
        severity: errorReport.severity
      },
      extra: {
        errorInfo,
        context,
        errorReport
      }
    });
  }
  
  // Send to analytics if enabled
  if (config.features.enableAnalytics && window.gtag) {
    window.gtag('event', 'exception', {
      description: error.message,
      fatal: errorReport.severity === ERROR_SEVERITY.CRITICAL
    });
  }
};

/**
 * Error fallback component
 */
const ErrorFallback = ({ 
  error, 
  errorInfo, 
  onRetry, 
  onGoHome, 
  canRetry, 
  retryCount, 
  severity 
}) => {
  const config = getConfig();
  
  const getSeverityColor = () => {
    switch (severity) {
      case ERROR_SEVERITY.CRITICAL:
        return 'text-red-600 bg-red-50 border-red-200';
      case ERROR_SEVERITY.HIGH:
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case ERROR_SEVERITY.MEDIUM:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };
  
  const getSeverityIcon = () => {
    return severity === ERROR_SEVERITY.CRITICAL ? '💥' : '⚠️';
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="text-6xl mb-4">{getSeverityIcon()}</div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            ¡Oops! Algo salió mal
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {severity === ERROR_SEVERITY.CRITICAL 
              ? 'Se ha producido un error crítico en la aplicación.'
              : 'Se ha producido un error inesperado.'}
          </p>
        </div>
        
        <div className={`rounded-md border p-4 ${getSeverityColor()}`}>
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium">
                Error: {error.name}
              </h3>
              <div className="mt-2 text-sm">
                <p>{error.message}</p>
              </div>
              {config.environment.isDevelopment && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm font-medium">
                    Detalles técnicos
                  </summary>
                  <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-auto max-h-32">
                    {error.stack}
                  </pre>
                  {errorInfo?.componentStack && (
                    <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-auto max-h-32">
                      {errorInfo.componentStack}
                    </pre>
                  )}
                </details>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col space-y-3">
          {canRetry && (
            <button
              onClick={onRetry}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={retryCount >= 3}
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <ArrowPathIcon className="h-5 w-5 text-indigo-500 group-hover:text-indigo-400" aria-hidden="true" />
              </span>
              {retryCount > 0 ? `Reintentar (${retryCount}/3)` : 'Reintentar'}
            </button>
          )}
          
          <button
            onClick={onGoHome}
            className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
              <HomeIcon className="h-5 w-5 text-gray-400 group-hover:text-gray-500" aria-hidden="true" />
            </span>
            Ir al inicio
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="w-full text-center py-2 px-4 text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Recargar página
          </button>
        </div>
        
        {config.environment.isDevelopment && (
          <div className="text-center text-xs text-gray-400">
            <p>Modo desarrollo - Información adicional disponible en la consola</p>
            <p>Severidad: {severity} | Intentos: {retryCount}</p>
          </div>
        )}
      </div>
    </div>
  );
};

ErrorFallback.propTypes = {
  error: PropTypes.object.isRequired,
  errorInfo: PropTypes.object,
  onRetry: PropTypes.func.isRequired,
  onGoHome: PropTypes.func.isRequired,
  canRetry: PropTypes.bool.isRequired,
  retryCount: PropTypes.number.isRequired,
  severity: PropTypes.string.isRequired
};

/**
 * Enhanced Error Boundary with recovery strategies
 */
class EnhancedErrorBoundary extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      severity: ERROR_SEVERITY.LOW,
      errorId: null
    };
    
    this.retryTimeouts = new Set();
  }
  
  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }
  
  componentDidCatch(error, errorInfo) {
    const severity = getErrorSeverity(error, errorInfo);
    
    this.setState({
      errorInfo,
      severity
    });
    
    // Report the error
    reportError(error, errorInfo, {
      userId: this.props.userId,
      sessionId: this.props.sessionId,
      component: this.props.fallbackComponent || 'Unknown',
      retryCount: this.state.retryCount
    });
    
    // Auto-recovery for certain error types
    if (this.canAutoRecover(error) && this.state.retryCount === 0) {
      this.scheduleRetry(1000); // Initial retry after 1 second
    }
  }
  
  componentWillUnmount() {
    // Clear any pending retry timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
    this.retryTimeouts.clear();
  }
  
  /**
   * Check if error can be automatically recovered from
   */
  canAutoRecover = (error) => {
    if (this.props.disableAutoRecovery) {
      return false;
    }
    
    return RECOVERABLE_ERROR_TYPES.some(type => 
      error.message?.includes(type) || 
      error.name?.includes(type) ||
      error.stack?.includes(type)
    );
  };
  
  /**
   * Schedule a retry with exponential backoff
   */
  scheduleRetry = (delay = null) => {
    const { retryCount } = this.state;
    const maxRetries = this.props.maxRetries || 3;
    
    if (retryCount >= maxRetries) {
      return;
    }
    
    // Calculate delay with exponential backoff
    const baseDelay = delay || 1000;
    const retryDelay = baseDelay * Math.pow(2, retryCount);
    const maxDelay = this.props.maxRetryDelay || 10000;
    const finalDelay = Math.min(retryDelay, maxDelay);
    
    const timeout = setTimeout(() => {
      this.retryTimeouts.delete(timeout);
      this.handleRetry();
    }, finalDelay);
    
    this.retryTimeouts.add(timeout);
  };
  
  /**
   * Handle retry attempt
   */
  handleRetry = () => {
    const { retryCount } = this.state;
    const maxRetries = this.props.maxRetries || 3;
    
    if (retryCount >= maxRetries) {
      return;
    }
    
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
      severity: ERROR_SEVERITY.LOW,
      errorId: null
    }));
    
    // Call onRetry callback if provided
    if (this.props.onRetry) {
      this.props.onRetry(retryCount + 1);
    }
  };
  
  /**
   * Handle navigation to home
   */
  handleGoHome = () => {
    if (this.props.onGoHome) {
      this.props.onGoHome();
    } else {
      // Default behavior - navigate to home
      window.location.href = '/';
    }
  };
  
  /**
   * Reset error boundary state
   */
  resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      severity: ERROR_SEVERITY.LOW,
      errorId: null
    });
  };
  
  render() {
    const { hasError, error, errorInfo, retryCount, severity } = this.state;
    const { children, fallbackComponent: FallbackComponent, maxRetries = 3 } = this.props;
    
    if (hasError) {
      // Custom fallback component
      if (FallbackComponent) {
        return (
          <FallbackComponent
            error={error}
            errorInfo={errorInfo}
            onRetry={this.handleRetry}
            onGoHome={this.handleGoHome}
            resetErrorBoundary={this.resetErrorBoundary}
            canRetry={retryCount < maxRetries}
            retryCount={retryCount}
            severity={severity}
          />
        );
      }
      
      // Default fallback UI
      return (
        <ErrorFallback
          error={error}
          errorInfo={errorInfo}
          onRetry={this.handleRetry}
          onGoHome={this.handleGoHome}
          canRetry={retryCount < maxRetries}
          retryCount={retryCount}
          severity={severity}
        />
      );
    }
    
    return children;
  }
}

EnhancedErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallbackComponent: PropTypes.elementType,
  onRetry: PropTypes.func,
  onGoHome: PropTypes.func,
  onError: PropTypes.func,
  maxRetries: PropTypes.number,
  maxRetryDelay: PropTypes.number,
  disableAutoRecovery: PropTypes.bool,
  userId: PropTypes.string,
  sessionId: PropTypes.string
};

EnhancedErrorBoundary.defaultProps = {
  maxRetries: 3,
  maxRetryDelay: 10000,
  disableAutoRecovery: false
};

export default EnhancedErrorBoundary;
export { ErrorFallback, ERROR_SEVERITY, RECOVERABLE_ERROR_TYPES };