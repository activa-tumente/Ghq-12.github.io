/**
 * Centralized error handling utilities
 */

export class AppError extends Error {
  constructor(message, code, statusCode = 500, context = {}) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.context = context;
    this.timestamp = new Date().toISOString();
  }
}

export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  SUPABASE_ERROR: 'SUPABASE_ERROR'
};

/**
 * Handle Supabase errors and convert to AppError
 */
export const handleSupabaseError = (error, operation = 'unknown') => {
  console.error(`Supabase error in ${operation}:`, error);
  
  if (error.code === 'PGRST116') {
    return new AppError('Recurso no encontrado', ERROR_CODES.NOT_FOUND, 404);
  }
  
  if (error.code === '42501') {
    return new AppError('Permisos insuficientes', ERROR_CODES.PERMISSION_DENIED, 403);
  }
  
  if (error.message?.includes('network')) {
    return new AppError('Error de conexión', ERROR_CODES.NETWORK_ERROR, 503);
  }
  
  return new AppError(
    error.message || 'Error en la base de datos',
    ERROR_CODES.SUPABASE_ERROR,
    500
  );
};

/**
 * Log error to monitoring service (placeholder for future implementation)
 */
export const logError = (error, context = {}) => {
  const errorLog = {
    message: error.message,
    stack: error.stack,
    code: error.code || 'UNKNOWN',
    timestamp: new Date().toISOString(),
    context
  };
  
  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.error('Error logged:', errorLog);
  }
  
  // TODO: Send to monitoring service in production
  // Example: sendToMonitoringService(errorLog);
};

/**
 * Get user-friendly error message
 */
export const getUserFriendlyMessage = (error) => {
  if (error instanceof AppError) {
    switch (error.code) {
      case ERROR_CODES.NETWORK_ERROR:
        return 'Problema de conexión. Verifica tu internet e intenta nuevamente.';
      case ERROR_CODES.NOT_FOUND:
        return 'El recurso solicitado no fue encontrado.';
      case ERROR_CODES.PERMISSION_DENIED:
        return 'No tienes permisos para realizar esta acción.';
      case ERROR_CODES.VALIDATION_ERROR:
        return 'Los datos proporcionados no son válidos.';
      default:
        return error.message;
    }
  }
  
  return 'Ha ocurrido un error inesperado. Por favor intenta nuevamente.';
};

/**
 * Create a standardized error handler for async operations
 */
export const withErrorHandling = (operation, context = {}) => {
  return async (...args) => {
    try {
      return await operation(...args);
    } catch (error) {
      const appError = error instanceof AppError 
        ? error 
        : handleSupabaseError(error, context.operation || 'unknown');
      
      logError(appError, context);
      throw appError;
    }
  };
};