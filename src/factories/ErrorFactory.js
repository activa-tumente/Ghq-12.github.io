/**
 * Error Factory Pattern Implementation
 * Provides centralized error creation with consistent formatting,
 * logging, and recovery strategies
 */

import { getConfig } from '../config';

/**
 * Error types enumeration
 */
export const ERROR_TYPES = {
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  REQUIRED_FIELD: 'REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  OUT_OF_RANGE: 'OUT_OF_RANGE',
  
  // Authentication & Authorization
  AUTH_ERROR: 'AUTH_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  
  // Database errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  CONNECTION_ERROR: 'CONNECTION_ERROR',
  QUERY_ERROR: 'QUERY_ERROR',
  CONSTRAINT_VIOLATION: 'CONSTRAINT_VIOLATION',
  
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  OFFLINE_ERROR: 'OFFLINE_ERROR',
  
  // Application errors
  BUSINESS_LOGIC_ERROR: 'BUSINESS_LOGIC_ERROR',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  FEATURE_NOT_AVAILABLE: 'FEATURE_NOT_AVAILABLE',
  
  // System errors
  SYSTEM_ERROR: 'SYSTEM_ERROR',
  MEMORY_ERROR: 'MEMORY_ERROR',
  STORAGE_ERROR: 'STORAGE_ERROR',
  
  // User interface errors
  UI_ERROR: 'UI_ERROR',
  COMPONENT_ERROR: 'COMPONENT_ERROR',
  RENDER_ERROR: 'RENDER_ERROR',
  
  // External service errors
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  API_ERROR: 'API_ERROR',
  THIRD_PARTY_ERROR: 'THIRD_PARTY_ERROR'
};

/**
 * Error severity levels
 */
export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

/**
 * Error categories for grouping and handling
 */
export const ERROR_CATEGORIES = {
  USER_INPUT: 'user_input',
  SYSTEM: 'system',
  NETWORK: 'network',
  SECURITY: 'security',
  BUSINESS: 'business',
  EXTERNAL: 'external'
};

/**
 * Recovery strategies for different error types
 */
export const RECOVERY_STRATEGIES = {
  RETRY: 'retry',
  FALLBACK: 'fallback',
  IGNORE: 'ignore',
  ESCALATE: 'escalate',
  USER_ACTION: 'user_action',
  REFRESH: 'refresh',
  REDIRECT: 'redirect'
};

/**
 * Base Application Error class
 */
export class AppError extends Error {
  constructor(message, type = ERROR_TYPES.SYSTEM_ERROR, details = {}, originalError = null) {
    super(message);
    
    this.name = 'AppError';
    this.type = type;
    this.details = details;
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();
    this.id = this.generateErrorId();
    
    // Set error metadata based on type
    const metadata = ErrorFactory.getErrorMetadata(type);
    this.severity = metadata.severity;
    this.category = metadata.category;
    this.recoveryStrategy = metadata.recoveryStrategy;
    this.userMessage = metadata.userMessage;
    this.shouldReport = metadata.shouldReport;
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
  
  generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      message: this.message,
      type: this.type,
      severity: this.severity,
      category: this.category,
      recoveryStrategy: this.recoveryStrategy,
      userMessage: this.userMessage,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack,
      originalError: this.originalError ? {
        name: this.originalError.name,
        message: this.originalError.message,
        stack: this.originalError.stack
      } : null
    };
  }
  
  toString() {
    return `${this.name} [${this.type}]: ${this.message}`;
  }
}

/**
 * Validation Error class
 */
export class ValidationError extends AppError {
  constructor(message, field = null, value = null, constraint = null) {
    super(message, ERROR_TYPES.VALIDATION_ERROR, {
      field,
      value,
      constraint
    });
    this.name = 'ValidationError';
  }
}

/**
 * Network Error class
 */
export class NetworkError extends AppError {
  constructor(message, statusCode = null, endpoint = null, method = null) {
    super(message, ERROR_TYPES.NETWORK_ERROR, {
      statusCode,
      endpoint,
      method
    });
    this.name = 'NetworkError';
  }
}

/**
 * Database Error class
 */
export class DatabaseError extends AppError {
  constructor(message, query = null, table = null, operation = null) {
    super(message, ERROR_TYPES.DATABASE_ERROR, {
      query,
      table,
      operation
    });
    this.name = 'DatabaseError';
  }
}

/**
 * Business Logic Error class
 */
export class BusinessLogicError extends AppError {
  constructor(message, rule = null, context = null) {
    super(message, ERROR_TYPES.BUSINESS_LOGIC_ERROR, {
      rule,
      context
    });
    this.name = 'BusinessLogicError';
  }
}

/**
 * Authentication Error class
 */
export class AuthenticationError extends AppError {
  constructor(message, authMethod = null, userId = null) {
    super(message, ERROR_TYPES.AUTH_ERROR, {
      authMethod,
      userId
    });
    this.name = 'AuthenticationError';
  }
}

/**
 * Error Factory class
 */
export class ErrorFactory {
  /**
   * Error type metadata configuration
   */
  static errorMetadata = {
    // Validation errors
    [ERROR_TYPES.VALIDATION_ERROR]: {
      severity: ERROR_SEVERITY.LOW,
      category: ERROR_CATEGORIES.USER_INPUT,
      recoveryStrategy: RECOVERY_STRATEGIES.USER_ACTION,
      userMessage: 'Por favor, verifica los datos ingresados.',
      shouldReport: false
    },
    [ERROR_TYPES.REQUIRED_FIELD]: {
      severity: ERROR_SEVERITY.LOW,
      category: ERROR_CATEGORIES.USER_INPUT,
      recoveryStrategy: RECOVERY_STRATEGIES.USER_ACTION,
      userMessage: 'Este campo es obligatorio.',
      shouldReport: false
    },
    [ERROR_TYPES.INVALID_FORMAT]: {
      severity: ERROR_SEVERITY.LOW,
      category: ERROR_CATEGORIES.USER_INPUT,
      recoveryStrategy: RECOVERY_STRATEGIES.USER_ACTION,
      userMessage: 'El formato de los datos no es válido.',
      shouldReport: false
    },
    [ERROR_TYPES.OUT_OF_RANGE]: {
      severity: ERROR_SEVERITY.LOW,
      category: ERROR_CATEGORIES.USER_INPUT,
      recoveryStrategy: RECOVERY_STRATEGIES.USER_ACTION,
      userMessage: 'El valor está fuera del rango permitido.',
      shouldReport: false
    },
    
    // Authentication errors
    [ERROR_TYPES.AUTH_ERROR]: {
      severity: ERROR_SEVERITY.MEDIUM,
      category: ERROR_CATEGORIES.SECURITY,
      recoveryStrategy: RECOVERY_STRATEGIES.REDIRECT,
      userMessage: 'Error de autenticación. Por favor, inicia sesión nuevamente.',
      shouldReport: true
    },
    [ERROR_TYPES.UNAUTHORIZED]: {
      severity: ERROR_SEVERITY.MEDIUM,
      category: ERROR_CATEGORIES.SECURITY,
      recoveryStrategy: RECOVERY_STRATEGIES.REDIRECT,
      userMessage: 'No tienes permisos para realizar esta acción.',
      shouldReport: true
    },
    [ERROR_TYPES.FORBIDDEN]: {
      severity: ERROR_SEVERITY.HIGH,
      category: ERROR_CATEGORIES.SECURITY,
      recoveryStrategy: RECOVERY_STRATEGIES.ESCALATE,
      userMessage: 'Acceso denegado.',
      shouldReport: true
    },
    [ERROR_TYPES.TOKEN_EXPIRED]: {
      severity: ERROR_SEVERITY.MEDIUM,
      category: ERROR_CATEGORIES.SECURITY,
      recoveryStrategy: RECOVERY_STRATEGIES.REFRESH,
      userMessage: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
      shouldReport: false
    },
    
    // Database errors
    [ERROR_TYPES.DATABASE_ERROR]: {
      severity: ERROR_SEVERITY.HIGH,
      category: ERROR_CATEGORIES.SYSTEM,
      recoveryStrategy: RECOVERY_STRATEGIES.RETRY,
      userMessage: 'Error en la base de datos. Intenta nuevamente.',
      shouldReport: true
    },
    [ERROR_TYPES.CONNECTION_ERROR]: {
      severity: ERROR_SEVERITY.HIGH,
      category: ERROR_CATEGORIES.NETWORK,
      recoveryStrategy: RECOVERY_STRATEGIES.RETRY,
      userMessage: 'Error de conexión. Verifica tu conexión a internet.',
      shouldReport: true
    },
    [ERROR_TYPES.QUERY_ERROR]: {
      severity: ERROR_SEVERITY.MEDIUM,
      category: ERROR_CATEGORIES.SYSTEM,
      recoveryStrategy: RECOVERY_STRATEGIES.FALLBACK,
      userMessage: 'Error al procesar la consulta.',
      shouldReport: true
    },
    [ERROR_TYPES.CONSTRAINT_VIOLATION]: {
      severity: ERROR_SEVERITY.MEDIUM,
      category: ERROR_CATEGORIES.BUSINESS,
      recoveryStrategy: RECOVERY_STRATEGIES.USER_ACTION,
      userMessage: 'Los datos no cumplen con las reglas de negocio.',
      shouldReport: false
    },
    
    // Network errors
    [ERROR_TYPES.NETWORK_ERROR]: {
      severity: ERROR_SEVERITY.MEDIUM,
      category: ERROR_CATEGORIES.NETWORK,
      recoveryStrategy: RECOVERY_STRATEGIES.RETRY,
      userMessage: 'Error de red. Verifica tu conexión a internet.',
      shouldReport: true
    },
    [ERROR_TYPES.TIMEOUT_ERROR]: {
      severity: ERROR_SEVERITY.MEDIUM,
      category: ERROR_CATEGORIES.NETWORK,
      recoveryStrategy: RECOVERY_STRATEGIES.RETRY,
      userMessage: 'La operación tardó demasiado tiempo. Intenta nuevamente.',
      shouldReport: true
    },
    [ERROR_TYPES.OFFLINE_ERROR]: {
      severity: ERROR_SEVERITY.HIGH,
      category: ERROR_CATEGORIES.NETWORK,
      recoveryStrategy: RECOVERY_STRATEGIES.FALLBACK,
      userMessage: 'No hay conexión a internet. Algunas funciones pueden no estar disponibles.',
      shouldReport: false
    },
    
    // Application errors
    [ERROR_TYPES.BUSINESS_LOGIC_ERROR]: {
      severity: ERROR_SEVERITY.MEDIUM,
      category: ERROR_CATEGORIES.BUSINESS,
      recoveryStrategy: RECOVERY_STRATEGIES.USER_ACTION,
      userMessage: 'Error en la lógica de negocio.',
      shouldReport: true
    },
    [ERROR_TYPES.CONFIGURATION_ERROR]: {
      severity: ERROR_SEVERITY.HIGH,
      category: ERROR_CATEGORIES.SYSTEM,
      recoveryStrategy: RECOVERY_STRATEGIES.ESCALATE,
      userMessage: 'Error de configuración del sistema.',
      shouldReport: true
    },
    [ERROR_TYPES.FEATURE_NOT_AVAILABLE]: {
      severity: ERROR_SEVERITY.LOW,
      category: ERROR_CATEGORIES.BUSINESS,
      recoveryStrategy: RECOVERY_STRATEGIES.FALLBACK,
      userMessage: 'Esta función no está disponible en este momento.',
      shouldReport: false
    },
    
    // System errors
    [ERROR_TYPES.SYSTEM_ERROR]: {
      severity: ERROR_SEVERITY.CRITICAL,
      category: ERROR_CATEGORIES.SYSTEM,
      recoveryStrategy: RECOVERY_STRATEGIES.ESCALATE,
      userMessage: 'Error del sistema. Por favor, contacta al soporte técnico.',
      shouldReport: true
    },
    [ERROR_TYPES.MEMORY_ERROR]: {
      severity: ERROR_SEVERITY.CRITICAL,
      category: ERROR_CATEGORIES.SYSTEM,
      recoveryStrategy: RECOVERY_STRATEGIES.REFRESH,
      userMessage: 'Error de memoria. Intenta recargar la página.',
      shouldReport: true
    },
    [ERROR_TYPES.STORAGE_ERROR]: {
      severity: ERROR_SEVERITY.HIGH,
      category: ERROR_CATEGORIES.SYSTEM,
      recoveryStrategy: RECOVERY_STRATEGIES.FALLBACK,
      userMessage: 'Error de almacenamiento. Algunos datos pueden no guardarse.',
      shouldReport: true
    },
    
    // UI errors
    [ERROR_TYPES.UI_ERROR]: {
      severity: ERROR_SEVERITY.MEDIUM,
      category: ERROR_CATEGORIES.SYSTEM,
      recoveryStrategy: RECOVERY_STRATEGIES.REFRESH,
      userMessage: 'Error en la interfaz. Intenta recargar la página.',
      shouldReport: true
    },
    [ERROR_TYPES.COMPONENT_ERROR]: {
      severity: ERROR_SEVERITY.MEDIUM,
      category: ERROR_CATEGORIES.SYSTEM,
      recoveryStrategy: RECOVERY_STRATEGIES.FALLBACK,
      userMessage: 'Error en un componente de la aplicación.',
      shouldReport: true
    },
    [ERROR_TYPES.RENDER_ERROR]: {
      severity: ERROR_SEVERITY.HIGH,
      category: ERROR_CATEGORIES.SYSTEM,
      recoveryStrategy: RECOVERY_STRATEGIES.REFRESH,
      userMessage: 'Error al mostrar el contenido.',
      shouldReport: true
    },
    
    // External service errors
    [ERROR_TYPES.EXTERNAL_SERVICE_ERROR]: {
      severity: ERROR_SEVERITY.MEDIUM,
      category: ERROR_CATEGORIES.EXTERNAL,
      recoveryStrategy: RECOVERY_STRATEGIES.FALLBACK,
      userMessage: 'Error en un servicio externo.',
      shouldReport: true
    },
    [ERROR_TYPES.API_ERROR]: {
      severity: ERROR_SEVERITY.MEDIUM,
      category: ERROR_CATEGORIES.EXTERNAL,
      recoveryStrategy: RECOVERY_STRATEGIES.RETRY,
      userMessage: 'Error en la API. Intenta nuevamente.',
      shouldReport: true
    },
    [ERROR_TYPES.THIRD_PARTY_ERROR]: {
      severity: ERROR_SEVERITY.LOW,
      category: ERROR_CATEGORIES.EXTERNAL,
      recoveryStrategy: RECOVERY_STRATEGIES.IGNORE,
      userMessage: 'Error en un servicio de terceros.',
      shouldReport: false
    }
  };
  
  /**
   * Create a generic application error
   */
  static createError(message, type = ERROR_TYPES.SYSTEM_ERROR, details = {}, originalError = null) {
    return new AppError(message, type, details, originalError);
  }
  
  /**
   * Create a validation error
   */
  static createValidationError(message, field = null, value = null, constraint = null) {
    return new ValidationError(message, field, value, constraint);
  }
  
  /**
   * Create a network error
   */
  static createNetworkError(message, statusCode = null, endpoint = null, method = null) {
    return new NetworkError(message, statusCode, endpoint, method);
  }
  
  /**
   * Create a database error
   */
  static createDatabaseError(message, query = null, table = null, operation = null) {
    return new DatabaseError(message, query, table, operation);
  }
  
  /**
   * Create a business logic error
   */
  static createBusinessLogicError(message, rule = null, context = null) {
    return new BusinessLogicError(message, rule, context);
  }
  
  /**
   * Create an authentication error
   */
  static createAuthenticationError(message, authMethod = null, userId = null) {
    return new AuthenticationError(message, authMethod, userId);
  }
  
  /**
   * Create error from HTTP response
   */
  static createFromHttpResponse(response, endpoint = null, method = null) {
    const statusCode = response.status;
    let errorType = ERROR_TYPES.NETWORK_ERROR;
    let message = `HTTP ${statusCode}: ${response.statusText}`;
    
    // Map HTTP status codes to error types
    if (statusCode >= 400 && statusCode < 500) {
      switch (statusCode) {
        case 401:
          errorType = ERROR_TYPES.UNAUTHORIZED;
          message = 'No autorizado';
          break;
        case 403:
          errorType = ERROR_TYPES.FORBIDDEN;
          message = 'Acceso prohibido';
          break;
        case 404:
          errorType = ERROR_TYPES.API_ERROR;
          message = 'Recurso no encontrado';
          break;
        case 422:
          errorType = ERROR_TYPES.VALIDATION_ERROR;
          message = 'Datos de entrada inválidos';
          break;
        case 429:
          errorType = ERROR_TYPES.API_ERROR;
          message = 'Demasiadas solicitudes';
          break;
        default:
          errorType = ERROR_TYPES.API_ERROR;
          message = 'Error del cliente';
      }
    } else if (statusCode >= 500) {
      errorType = ERROR_TYPES.EXTERNAL_SERVICE_ERROR;
      message = 'Error del servidor';
    }
    
    return new NetworkError(message, statusCode, endpoint, method);
  }
  
  /**
   * Create error from Supabase error
   */
  static createFromSupabaseError(error, context = {}) {
    const { table, operation, query } = context;
    
    // Map Supabase error codes to our error types
    let errorType = ERROR_TYPES.DATABASE_ERROR;
    let message = error.message || 'Error de base de datos';
    
    if (error.code) {
      switch (error.code) {
        case 'PGRST116': // No rows found
          errorType = ERROR_TYPES.BUSINESS_LOGIC_ERROR;
          message = 'No se encontraron registros';
          break;
        case 'PGRST301': // Parsing error
          errorType = ERROR_TYPES.QUERY_ERROR;
          message = 'Error en la consulta';
          break;
        case '23505': // Unique violation
          errorType = ERROR_TYPES.CONSTRAINT_VIOLATION;
          message = 'El registro ya existe';
          break;
        case '23503': // Foreign key violation
          errorType = ERROR_TYPES.CONSTRAINT_VIOLATION;
          message = 'Violación de integridad referencial';
          break;
        case '23502': // Not null violation
          errorType = ERROR_TYPES.VALIDATION_ERROR;
          message = 'Campo obligatorio faltante';
          break;
        case 'PGRST204': // Connection error
          errorType = ERROR_TYPES.CONNECTION_ERROR;
          message = 'Error de conexión a la base de datos';
          break;
        default:
          errorType = ERROR_TYPES.DATABASE_ERROR;
      }
    }
    
    return new DatabaseError(message, query, table, operation);
  }
  
  /**
   * Create error from JavaScript Error
   */
  static createFromJavaScriptError(error, context = {}) {
    let errorType = ERROR_TYPES.SYSTEM_ERROR;
    let message = error.message || 'Error desconocido';
    
    // Map JavaScript error types
    switch (error.name) {
      case 'TypeError':
        errorType = ERROR_TYPES.SYSTEM_ERROR;
        break;
      case 'ReferenceError':
        errorType = ERROR_TYPES.SYSTEM_ERROR;
        break;
      case 'SyntaxError':
        errorType = ERROR_TYPES.SYSTEM_ERROR;
        break;
      case 'RangeError':
        errorType = ERROR_TYPES.VALIDATION_ERROR;
        break;
      case 'NetworkError':
        errorType = ERROR_TYPES.NETWORK_ERROR;
        break;
      case 'TimeoutError':
        errorType = ERROR_TYPES.TIMEOUT_ERROR;
        break;
      default:
        errorType = ERROR_TYPES.SYSTEM_ERROR;
    }
    
    return new AppError(message, errorType, context, error);
  }
  
  /**
   * Get error metadata for a given error type
   */
  static getErrorMetadata(errorType) {
    return this.errorMetadata[errorType] || this.errorMetadata[ERROR_TYPES.SYSTEM_ERROR];
  }
  
  /**
   * Check if error should be reported
   */
  static shouldReportError(error) {
    if (error instanceof AppError) {
      return error.shouldReport;
    }
    
    const metadata = this.getErrorMetadata(error.type || ERROR_TYPES.SYSTEM_ERROR);
    return metadata.shouldReport;
  }
  
  /**
   * Get user-friendly message for error
   */
  static getUserMessage(error) {
    if (error instanceof AppError) {
      return error.userMessage;
    }
    
    const metadata = this.getErrorMetadata(error.type || ERROR_TYPES.SYSTEM_ERROR);
    return metadata.userMessage;
  }
  
  /**
   * Get recovery strategy for error
   */
  static getRecoveryStrategy(error) {
    if (error instanceof AppError) {
      return error.recoveryStrategy;
    }
    
    const metadata = this.getErrorMetadata(error.type || ERROR_TYPES.SYSTEM_ERROR);
    return metadata.recoveryStrategy;
  }
  
  /**
   * Register custom error metadata
   */
  static registerErrorType(errorType, metadata) {
    this.errorMetadata[errorType] = {
      severity: ERROR_SEVERITY.MEDIUM,
      category: ERROR_CATEGORIES.SYSTEM,
      recoveryStrategy: RECOVERY_STRATEGIES.ESCALATE,
      userMessage: 'Ha ocurrido un error.',
      shouldReport: true,
      ...metadata
    };
  }
  
  /**
   * Log error with appropriate level
   */
  static logError(error, context = {}) {
    const config = getConfig();
    
    if (!config.features.enableErrorLogging) {
      return;
    }
    
    const errorData = {
      error: error instanceof AppError ? error.toJSON() : {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context,
      timestamp: new Date().toISOString(),
      environment: config.environment.current,
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    // Log based on severity
    const severity = error.severity || ERROR_SEVERITY.MEDIUM;
    
    switch (severity) {
      case ERROR_SEVERITY.LOW:
        console.info('🔵 Low severity error:', errorData);
        break;
      case ERROR_SEVERITY.MEDIUM:
        console.warn('🟡 Medium severity error:', errorData);
        break;
      case ERROR_SEVERITY.HIGH:
        console.error('🟠 High severity error:', errorData);
        break;
      case ERROR_SEVERITY.CRITICAL:
        console.error('🔴 Critical error:', errorData);
        break;
      default:
        console.error('❓ Unknown severity error:', errorData);
    }
    
    // Send to external logging service if configured
    if (config.environment.isProduction && this.shouldReportError(error)) {
      this.reportToExternalService(errorData);
    }
  }
  
  /**
   * Report error to external service
   */
  static reportToExternalService(errorData) {
    // Implement external error reporting (Sentry, LogRocket, etc.)
    if (window.Sentry) {
      window.Sentry.captureException(errorData.error, {
        extra: errorData.context,
        tags: {
          severity: errorData.error.severity,
          category: errorData.error.category,
          environment: errorData.environment
        }
      });
    }
  }
}

export default ErrorFactory;