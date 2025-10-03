/**
 * Error Service - BAT-7 Dashboard
 * Servicio centralizado para manejo de errores con logging, categorización y recuperación
 */

// Tipos de errores
export const ERROR_TYPES = {
  NETWORK: 'NETWORK',
  API: 'API',
  VALIDATION: 'VALIDATION',
  AUTHENTICATION: 'AUTHENTICATION',
  PERMISSION: 'PERMISSION',
  DATA_PROCESSING: 'DATA_PROCESSING',
  COMPONENT: 'COMPONENT',
  UNKNOWN: 'UNKNOWN'
};

// Severidad de errores
export const ERROR_SEVERITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

// Configuración de reintentos
const RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2
};

// Configuración de logging
const LOGGING_CONFIG = {
  enableConsoleLog: process.env.NODE_ENV === 'development',
  enableRemoteLog: process.env.NODE_ENV === 'production',
  maxLogEntries: 100
};

class ErrorService {
  constructor() {
    this.errorLog = [];
    this.errorHandlers = new Map();
    this.retryAttempts = new Map();
    this.setupGlobalErrorHandlers();
  }

  /**
   * Configura manejadores globales de errores
   */
  setupGlobalErrorHandlers() {
    // Manejo de errores no capturados
    window.addEventListener('error', (event) => {
      this.logError({
        type: ERROR_TYPES.COMPONENT,
        severity: ERROR_SEVERITY.HIGH,
        message: event.message,
        source: event.filename,
        line: event.lineno,
        column: event.colno,
        stack: event.error?.stack
      });
    });

    // Manejo de promesas rechazadas
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        type: ERROR_TYPES.UNKNOWN,
        severity: ERROR_SEVERITY.HIGH,
        message: 'Unhandled Promise Rejection',
        reason: event.reason,
        stack: event.reason?.stack
      });
    });
  }

  /**
   * Categoriza un error basado en su contenido
   */
  categorizeError(error) {
    const message = error.message?.toLowerCase() || '';
    const status = error.status || error.response?.status;

    // Errores de red
    if (message.includes('network') || message.includes('fetch') || !navigator.onLine) {
      return {
        type: ERROR_TYPES.NETWORK,
        severity: ERROR_SEVERITY.HIGH,
        recoverable: true
      };
    }

    // Errores de API por código de estado
    if (status) {
      if (status === 401) {
        return {
          type: ERROR_TYPES.AUTHENTICATION,
          severity: ERROR_SEVERITY.CRITICAL,
          recoverable: false
        };
      }
      if (status === 403) {
        return {
          type: ERROR_TYPES.PERMISSION,
          severity: ERROR_SEVERITY.HIGH,
          recoverable: false
        };
      }
      if (status >= 400 && status < 500) {
        return {
          type: ERROR_TYPES.VALIDATION,
          severity: ERROR_SEVERITY.MEDIUM,
          recoverable: false
        };
      }
      if (status >= 500) {
        return {
          type: ERROR_TYPES.API,
          severity: ERROR_SEVERITY.HIGH,
          recoverable: true
        };
      }
    }

    // Errores de validación
    if (message.includes('validation') || message.includes('invalid')) {
      return {
        type: ERROR_TYPES.VALIDATION,
        severity: ERROR_SEVERITY.MEDIUM,
        recoverable: false
      };
    }

    // Errores de procesamiento de datos
    if (message.includes('parse') || message.includes('json') || message.includes('data')) {
      return {
        type: ERROR_TYPES.DATA_PROCESSING,
        severity: ERROR_SEVERITY.MEDIUM,
        recoverable: true
      };
    }

    return {
      type: ERROR_TYPES.UNKNOWN,
      severity: ERROR_SEVERITY.MEDIUM,
      recoverable: false
    };
  }

  /**
   * Genera un mensaje de error amigable para el usuario
   */
  getUserFriendlyMessage(error, category) {
    const messages = {
      [ERROR_TYPES.NETWORK]: 'Error de conexión. Verifica tu conexión a internet e intenta nuevamente.',
      [ERROR_TYPES.API]: 'Error del servidor. El equipo técnico ha sido notificado.',
      [ERROR_TYPES.VALIDATION]: 'Los datos ingresados no son válidos. Revisa la información e intenta nuevamente.',
      [ERROR_TYPES.AUTHENTICATION]: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
      [ERROR_TYPES.PERMISSION]: 'No tienes permisos para realizar esta acción.',
      [ERROR_TYPES.DATA_PROCESSING]: 'Error al procesar los datos. Intenta recargar la página.',
      [ERROR_TYPES.COMPONENT]: 'Error en la interfaz. La página se recargará automáticamente.',
      [ERROR_TYPES.UNKNOWN]: 'Ha ocurrido un error inesperado. Intenta nuevamente.'
    };

    return messages[category.type] || messages[ERROR_TYPES.UNKNOWN];
  }

  /**
   * Registra un error en el log
   */
  logError(errorInfo) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp,
      ...errorInfo,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Agregar al log local
    this.errorLog.unshift(logEntry);
    
    // Mantener solo los últimos N errores
    if (this.errorLog.length > LOGGING_CONFIG.maxLogEntries) {
      this.errorLog = this.errorLog.slice(0, LOGGING_CONFIG.maxLogEntries);
    }

    // Log en consola (desarrollo)
    if (LOGGING_CONFIG.enableConsoleLog) {
      console.group(`🚨 Error ${errorInfo.severity}: ${errorInfo.type}`);
      console.error('Message:', errorInfo.message);
      console.error('Details:', errorInfo);
      console.error('Stack:', errorInfo.stack);
      console.groupEnd();
    }

    // Envío a servicio remoto (producción)
    if (LOGGING_CONFIG.enableRemoteLog && errorInfo.severity === ERROR_SEVERITY.CRITICAL) {
      this.sendToRemoteLog(logEntry).catch(console.error);
    }

    return logEntry.id;
  }

  /**
   * Envía errores críticos a un servicio de logging remoto
   */
  async sendToRemoteLog(logEntry) {
    try {
      // Aquí se implementaría el envío a un servicio como Sentry, LogRocket, etc.
      // Por ahora, solo simulamos el envío
      await new Promise(resolve => setTimeout(resolve, 100));
      console.log('Error sent to remote logging service:', logEntry.id);
    } catch (error) {
      console.error('Failed to send error to remote service:', error);
    }
  }

  /**
   * Maneja un error con categorización automática y recuperación
   */
  async handleError(error, context = {}) {
    const category = this.categorizeError(error);
    const userMessage = this.getUserFriendlyMessage(error, category);
    
    const errorInfo = {
      ...category,
      message: error.message || 'Unknown error',
      originalError: error,
      context,
      stack: error.stack,
      timestamp: new Date().toISOString()
    };

    const errorId = this.logError(errorInfo);

    // Intentar recuperación automática si es posible
    let recoveryAction = null;
    if (category.recoverable) {
      recoveryAction = await this.attemptRecovery(error, context);
    }

    return {
      id: errorId,
      type: category.type,
      severity: category.severity,
      message: userMessage,
      originalMessage: error.message,
      recoverable: category.recoverable,
      recoveryAction,
      context
    };
  }

  /**
   * Intenta recuperación automática para errores recuperables
   */
  async attemptRecovery(error, context) {
    const { operation, retryKey } = context;
    
    if (!operation || !retryKey) {
      return null;
    }

    const attempts = this.retryAttempts.get(retryKey) || 0;
    
    if (attempts >= RETRY_CONFIG.maxAttempts) {
      this.retryAttempts.delete(retryKey);
      return null;
    }

    const delay = Math.min(
      RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.backoffFactor, attempts),
      RETRY_CONFIG.maxDelay
    );

    this.retryAttempts.set(retryKey, attempts + 1);

    return {
      type: 'retry',
      delay,
      attempt: attempts + 1,
      maxAttempts: RETRY_CONFIG.maxAttempts,
      execute: async () => {
        await new Promise(resolve => setTimeout(resolve, delay));
        try {
          const result = await operation();
          this.retryAttempts.delete(retryKey);
          return result;
        } catch (retryError) {
          return this.handleError(retryError, context);
        }
      }
    };
  }

  /**
   * Registra un manejador personalizado para un tipo de error
   */
  registerErrorHandler(errorType, handler) {
    this.errorHandlers.set(errorType, handler);
  }

  /**
   * Obtiene el log de errores
   */
  getErrorLog(filters = {}) {
    let filteredLog = [...this.errorLog];

    if (filters.type) {
      filteredLog = filteredLog.filter(entry => entry.type === filters.type);
    }

    if (filters.severity) {
      filteredLog = filteredLog.filter(entry => entry.severity === filters.severity);
    }

    if (filters.since) {
      const sinceDate = new Date(filters.since);
      filteredLog = filteredLog.filter(entry => new Date(entry.timestamp) >= sinceDate);
    }

    return filteredLog;
  }

  /**
   * Limpia el log de errores
   */
  clearErrorLog() {
    this.errorLog = [];
    this.retryAttempts.clear();
  }

  /**
   * Obtiene estadísticas de errores
   */
  getErrorStats() {
    const total = this.errorLog.length;
    const byType = {};
    const bySeverity = {};
    const last24h = this.errorLog.filter(
      entry => new Date() - new Date(entry.timestamp) < 24 * 60 * 60 * 1000
    ).length;

    this.errorLog.forEach(entry => {
      byType[entry.type] = (byType[entry.type] || 0) + 1;
      bySeverity[entry.severity] = (bySeverity[entry.severity] || 0) + 1;
    });

    return {
      total,
      last24h,
      byType,
      bySeverity,
      retryAttempts: this.retryAttempts.size
    };
  }
}

// Instancia singleton del servicio
const errorService = new ErrorService();

// Funciones de utilidad para uso fácil
export const handleError = (error, context) => errorService.handleError(error, context);
export const logError = (errorInfo) => errorService.logError(errorInfo);
export const getErrorLog = (filters) => errorService.getErrorLog(filters);
export const clearErrorLog = () => errorService.clearErrorLog();
export const getErrorStats = () => errorService.getErrorStats();
export const registerErrorHandler = (type, handler) => errorService.registerErrorHandler(type, handler);

export default errorService;