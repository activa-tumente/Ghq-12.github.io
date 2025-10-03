// Sistema de manejo de errores mejorado con mejores prácticas

import React, { Component, createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useNotifications } from './ObserverPattern.js';

// Tipos de errores
export const ERROR_TYPES = {
  VALIDATION: 'validation',
  NETWORK: 'network',
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  NOT_FOUND: 'not_found',
  SERVER: 'server',
  CLIENT: 'client',
  UNKNOWN: 'unknown'
};

// Severidad de errores
export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Clase base para errores personalizados
export class AppError extends Error {
  constructor(message, type = ERROR_TYPES.UNKNOWN, severity = ERROR_SEVERITY.MEDIUM, details = {}) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.severity = severity;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.stack = Error.captureStackTrace ? Error.captureStackTrace(this, AppError) : this.stack;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      severity: this.severity,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
}

// Errores específicos
export class ValidationError extends AppError {
  constructor(message, field = null, value = null) {
    super(message, ERROR_TYPES.VALIDATION, ERROR_SEVERITY.LOW, { field, value });
    this.name = 'ValidationError';
  }
}

export class NetworkError extends AppError {
  constructor(message, status = null, url = null) {
    super(message, ERROR_TYPES.NETWORK, ERROR_SEVERITY.MEDIUM, { status, url });
    this.name = 'NetworkError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'No autorizado') {
    super(message, ERROR_TYPES.AUTHENTICATION, ERROR_SEVERITY.HIGH);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Acceso denegado') {
    super(message, ERROR_TYPES.AUTHORIZATION, ERROR_SEVERITY.HIGH);
    this.name = 'AuthorizationError';
  }
}

// Logger de errores
class ErrorLogger {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000;
    this.listeners = [];
  }

  log(error, context = {}) {
    const logEntry = {
      id: Date.now() + Math.random(),
      error: error instanceof Error ? error.toJSON?.() || {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error,
      context,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'Unknown'
    };

    // Agregar al log local
    this.logs.unshift(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Notificar a listeners
    this.listeners.forEach(listener => {
      try {
        listener(logEntry);
      } catch (err) {
        console.error('Error en listener de ErrorLogger:', err);
      }
    });

    // Log en consola en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error [${error.type || 'unknown'}]`);
      console.error('Message:', error.message);
      console.error('Details:', error.details || {});
      console.error('Context:', context);
      console.error('Stack:', error.stack);
      console.groupEnd();
    }

    // Enviar a servicio de logging en producción
    if (process.env.NODE_ENV === 'production') {
      this.sendToLoggingService(logEntry);
    }

    return logEntry;
  }

  async sendToLoggingService(logEntry) {
    try {
      // Aquí se implementaría el envío a un servicio como Sentry, LogRocket, etc.
      // Por ahora solo simulamos el envío
      await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(logEntry)
      });
    } catch (error) {
      console.warn('No se pudo enviar log al servidor:', error);
    }
  }

  addListener(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  getLogs(filter = {}) {
    let filteredLogs = [...this.logs];

    if (filter.type) {
      filteredLogs = filteredLogs.filter(log => log.error.type === filter.type);
    }

    if (filter.severity) {
      filteredLogs = filteredLogs.filter(log => log.error.severity === filter.severity);
    }

    if (filter.since) {
      const since = new Date(filter.since);
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= since);
    }

    return filteredLogs;
  }

  clearLogs() {
    this.logs = [];
  }
}

// Instancia global del logger
export const errorLogger = new ErrorLogger();

// Contexto para manejo de errores
const ErrorContext = createContext({
  errors: [],
  addError: () => {},
  removeError: () => {},
  clearErrors: () => {},
  hasErrors: false
});

// Provider de contexto de errores
export const ErrorProvider = ({ children, maxErrors = 10 }) => {
  const [errors, setErrors] = useState([]);
  const { notify } = useNotifications();

  const addError = useCallback((error, context = {}) => {
    const errorEntry = {
      id: Date.now() + Math.random(),
      error: error instanceof Error ? error : new AppError(error),
      context,
      timestamp: new Date().toISOString()
    };

    // Log del error
    errorLogger.log(errorEntry.error, context);

    // Agregar al estado
    setErrors(prev => {
      const newErrors = [errorEntry, ...prev];
      return newErrors.slice(0, maxErrors);
    });

    // Notificación automática basada en severidad
    const severity = errorEntry.error.severity || ERROR_SEVERITY.MEDIUM;
    if (severity === ERROR_SEVERITY.HIGH || severity === ERROR_SEVERITY.CRITICAL) {
      notify(errorEntry.error.message, 'error');
    } else if (severity === ERROR_SEVERITY.MEDIUM) {
      notify(errorEntry.error.message, 'warning');
    }

    return errorEntry.id;
  }, [maxErrors, notify]);

  const removeError = useCallback((errorId) => {
    setErrors(prev => prev.filter(error => error.id !== errorId));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const hasErrors = errors.length > 0;

  return (
    <ErrorContext.Provider value={{
      errors,
      addError,
      removeError,
      clearErrors,
      hasErrors
    }}>
      {children}
    </ErrorContext.Provider>
  );
};

// Hook para usar el contexto de errores
export const useErrorHandler = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useErrorHandler debe usarse dentro de ErrorProvider');
  }
  return context;
};

// Hook para manejo de errores asíncronos
export const useAsyncError = () => {
  const { addError } = useErrorHandler();

  const executeAsync = useCallback(async (asyncFunction, context = {}) => {
    try {
      const result = await asyncFunction();
      return { success: true, data: result };
    } catch (error) {
      const errorId = addError(error, context);
      return { success: false, error, errorId };
    }
  }, [addError]);

  const wrapAsync = useCallback((asyncFunction, context = {}) => {
    return async (...args) => {
      try {
        return await asyncFunction(...args);
      } catch (error) {
        addError(error, { ...context, args });
        throw error;
      }
    };
  }, [addError]);

  return { executeAsync, wrapAsync };
};

// Error Boundary mejorado
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error, errorInfo) {
    const errorId = errorLogger.log(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: this.props.name || 'Unknown'
    });

    this.setState({
      errorInfo,
      errorId: errorId.id
    });

    // Callback personalizado
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });

    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      // Renderizar fallback personalizado si se proporciona
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          errorInfo: this.state.errorInfo,
          retry: this.handleRetry
        });
      }

      // Fallback por defecto
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 text-red-600">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Algo salió mal
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Ha ocurrido un error inesperado. Por favor, intenta nuevamente.
              </p>
              {process.env.NODE_ENV === 'development' && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500">
                    Detalles del error (desarrollo)
                  </summary>
                  <pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto">
                    {this.state.error?.message}
                    {this.state.error?.stack}
                  </pre>
                </details>
              )}
            </div>
            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Intentar nuevamente
              </button>
              <button
                onClick={() => window.location.reload()}
                className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Recargar página
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC para envolver componentes con manejo de errores
export const withErrorBoundary = (Component, errorBoundaryProps = {}) => {
  const WrappedComponent = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Utilidades para manejo de errores
export const errorUtils = {
  // Crear error desde respuesta HTTP
  fromHttpResponse: (response, data = null) => {
    const status = response.status;
    let message = `Error HTTP ${status}`;
    let type = ERROR_TYPES.NETWORK;
    let severity = ERROR_SEVERITY.MEDIUM;

    if (status >= 400 && status < 500) {
      type = status === 401 ? ERROR_TYPES.AUTHENTICATION : 
             status === 403 ? ERROR_TYPES.AUTHORIZATION :
             status === 404 ? ERROR_TYPES.NOT_FOUND :
             ERROR_TYPES.CLIENT;
      severity = status === 401 || status === 403 ? ERROR_SEVERITY.HIGH : ERROR_SEVERITY.MEDIUM;
    } else if (status >= 500) {
      type = ERROR_TYPES.SERVER;
      severity = ERROR_SEVERITY.HIGH;
    }

    if (data && data.message) {
      message = data.message;
    }

    return new NetworkError(message, status, response.url);
  },

  // Crear error de validación
  validation: (message, field = null, value = null) => {
    return new ValidationError(message, field, value);
  },

  // Crear error genérico
  create: (message, type = ERROR_TYPES.UNKNOWN, severity = ERROR_SEVERITY.MEDIUM, details = {}) => {
    return new AppError(message, type, severity, details);
  },

  // Verificar si es un error específico
  isType: (error, type) => {
    return error instanceof AppError && error.type === type;
  },

  // Verificar severidad
  isSeverity: (error, severity) => {
    return error instanceof AppError && error.severity === severity;
  },

  // Formatear error para mostrar al usuario
  formatForUser: (error) => {
    if (error instanceof ValidationError) {
      return `Error de validación: ${error.message}`;
    }
    
    if (error instanceof NetworkError) {
      if (error.details.status === 404) {
        return 'El recurso solicitado no fue encontrado';
      }
      if (error.details.status >= 500) {
        return 'Error del servidor. Por favor, intenta más tarde';
      }
      return 'Error de conexión. Verifica tu conexión a internet';
    }
    
    if (error instanceof AuthenticationError) {
      return 'Debes iniciar sesión para continuar';
    }
    
    if (error instanceof AuthorizationError) {
      return 'No tienes permisos para realizar esta acción';
    }
    
    return error.message || 'Ha ocurrido un error inesperado';
  }
};

// Hook para recuperación de errores
export const useErrorRecovery = () => {
  const [retryCount, setRetryCount] = useState(0);
  const [isRecovering, setIsRecovering] = useState(false);
  const { addError } = useErrorHandler();

  const retry = useCallback(async (operation, maxRetries = 3, delay = 1000) => {
    setIsRecovering(true);
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        setRetryCount(0);
        setIsRecovering(false);
        return { success: true, data: result };
      } catch (error) {
        if (attempt === maxRetries) {
          addError(error, { retryCount: attempt + 1 });
          setRetryCount(attempt + 1);
          setIsRecovering(false);
          return { success: false, error };
        }
        
        // Esperar antes del siguiente intento
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
      }
    }
  }, [addError]);

  const reset = useCallback(() => {
    setRetryCount(0);
    setIsRecovering(false);
  }, []);

  return {
    retry,
    reset,
    retryCount,
    isRecovering,
    canRetry: retryCount < 3
  };
};

// Funciones de utilidad para manejo de errores
export const getErrorInfo = (error) => {
  if (error instanceof AppError) {
    return {
      type: error.type,
      message: error.message,
      severity: error.severity,
      context: error.context
    };
  }
  
  return {
    type: ERROR_TYPES.UNKNOWN,
    message: error?.message || 'Error desconocido',
    severity: ERROR_SEVERITY.MEDIUM,
    context: {}
  };
};

export const logError = (error, context = {}) => {
  errorLogger.log(error, context);
};

export const withErrorHandling = (fn) => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      logError(error, { function: fn.name, args });
      throw error;
    }
  };
};

// Exportación por defecto
export default {
  ErrorBoundary,
  ErrorProvider,
  useErrorHandler,
  useAsyncError,
  useErrorRecovery,
  withErrorBoundary,
  errorLogger,
  errorUtils,
  AppError,
  ValidationError,
  NetworkError,
  AuthenticationError,
  AuthorizationError,
  ERROR_TYPES,
  ERROR_SEVERITY,
  getErrorInfo,
  logError,
  withErrorHandling
};