// =====================================================
// SISTEMA DE MANEJO DE ERRORES MEJORADO PARA SUPABASE
// =====================================================

import { supabase } from '../api/supabase';

// Tipos de errores de Supabase
export const SUPABASE_ERROR_TYPES = {
  CONNECTION: 'connection_error',
  AUTHENTICATION: 'auth_error',
  PERMISSION: 'permission_error',
  NOT_FOUND: 'not_found',
  VALIDATION: 'validation_error',
  RATE_LIMIT: 'rate_limit',
  SERVER: 'server_error',
  UNKNOWN: 'unknown_error'
};

// Configuración de reintentos
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 segundo
  maxDelay: 10000, // 10 segundos
  backoffMultiplier: 2
};

// Logger mejorado para errores
class SupabaseLogger {
  static log(level, message, error = null, context = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      error: error ? {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      } : null,
      context
    };

    // Log en consola con formato mejorado
    const emoji = {
      error: '❌',
      warn: '⚠️',
      info: 'ℹ️',
      debug: '🔍'
    }[level] || '📝';

    console.group(`${emoji} Supabase ${level.toUpperCase()}: ${message}`);
    if (error) {
      console.error('Error details:', error);
    }
    if (Object.keys(context).length > 0) {
      console.log('Context:', context);
    }
    console.groupEnd();

    // Enviar a servicio de logging externo en producción
    if (process.env.NODE_ENV === 'production' && level === 'error') {
      this.sendToExternalLogger(logEntry);
    }
  }

  static sendToExternalLogger(logEntry) {
    // Implementar envío a servicio de logging externo
    // Por ejemplo: Sentry, LogRocket, etc.
    console.log('📤 Enviando error a servicio externo:', logEntry);
  }
}

// Clasificador de errores
export class SupabaseErrorClassifier {
  static classify(error) {
    if (!error) return SUPABASE_ERROR_TYPES.UNKNOWN;

    const message = error.message?.toLowerCase() || '';
    const code = error.code || '';

    // Errores de conexión
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return SUPABASE_ERROR_TYPES.CONNECTION;
    }

    // Errores de autenticación
    if (code === 'PGRST301' || message.includes('jwt') || message.includes('unauthorized')) {
      return SUPABASE_ERROR_TYPES.AUTHENTICATION;
    }

    // Errores de permisos
    if (code === 'PGRST116' || message.includes('permission') || message.includes('policy')) {
      return SUPABASE_ERROR_TYPES.PERMISSION;
    }

    // Errores de no encontrado
    if (code === 'PGRST116' || message.includes('not found') || message.includes('does not exist') || message.includes('could not find the table')) {
      return SUPABASE_ERROR_TYPES.NOT_FOUND;
    }

    // Errores de validación
    if (code.startsWith('23') || message.includes('constraint') || message.includes('invalid')) {
      return SUPABASE_ERROR_TYPES.VALIDATION;
    }

    // Errores de rate limit
    if (code === '429' || message.includes('rate limit') || message.includes('too many requests')) {
      return SUPABASE_ERROR_TYPES.RATE_LIMIT;
    }

    // Errores del servidor
    if (code.startsWith('5') || message.includes('server error') || message.includes('internal')) {
      return SUPABASE_ERROR_TYPES.SERVER;
    }

    return SUPABASE_ERROR_TYPES.UNKNOWN;
  }

  static getErrorMessage(error, type) {
    const userFriendlyMessages = {
      [SUPABASE_ERROR_TYPES.CONNECTION]: 'Problema de conexión con la base de datos. Verificando conexión...',
      [SUPABASE_ERROR_TYPES.AUTHENTICATION]: 'Error de autenticación. Por favor, recarga la página.',
      [SUPABASE_ERROR_TYPES.PERMISSION]: 'No tienes permisos para realizar esta acción.',
      [SUPABASE_ERROR_TYPES.NOT_FOUND]: 'Los datos solicitados no fueron encontrados.',
      [SUPABASE_ERROR_TYPES.VALIDATION]: 'Los datos proporcionados no son válidos.',
      [SUPABASE_ERROR_TYPES.RATE_LIMIT]: 'Demasiadas solicitudes. Por favor, espera un momento.',
      [SUPABASE_ERROR_TYPES.SERVER]: 'Error interno del servidor. Intentando nuevamente...',
      [SUPABASE_ERROR_TYPES.UNKNOWN]: 'Error inesperado. Usando datos locales como respaldo.'
    };

    return userFriendlyMessages[type] || error.message;
  }
}

// Utilidad para delay con backoff exponencial
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const calculateBackoffDelay = (attempt) => {
  const baseDelay = RETRY_CONFIG.baseDelay;
  const backoffDelay = baseDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt);
  return Math.min(backoffDelay, RETRY_CONFIG.maxDelay);
};

// Wrapper principal para operaciones de Supabase con manejo de errores
export class SupabaseErrorHandler {
  static async executeWithRetry(operation, context = {}) {
    let lastError = null;
    
    for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
      try {
        SupabaseLogger.log('debug', `Ejecutando operación (intento ${attempt + 1})`, null, context);
        
        const result = await operation();
        
        if (result.error) {
          throw result.error;
        }

        // Operación exitosa
        if (attempt > 0) {
          SupabaseLogger.log('info', `Operación exitosa después de ${attempt + 1} intentos`, null, context);
        }
        
        return { success: true, data: result.data, error: null };

      } catch (error) {
        lastError = error;
        const errorType = SupabaseErrorClassifier.classify(error);
        
        SupabaseLogger.log('error', `Error en intento ${attempt + 1}`, error, {
          ...context,
          errorType,
          attempt: attempt + 1
        });

        // No reintentar para ciertos tipos de errores
        if (errorType === SUPABASE_ERROR_TYPES.AUTHENTICATION || 
            errorType === SUPABASE_ERROR_TYPES.PERMISSION ||
            errorType === SUPABASE_ERROR_TYPES.VALIDATION) {
          break;
        }

        // Si no es el último intento, esperar antes de reintentar
        if (attempt < RETRY_CONFIG.maxRetries) {
          const delayMs = calculateBackoffDelay(attempt);
          SupabaseLogger.log('info', `Esperando ${delayMs}ms antes del siguiente intento`, null, context);
          await delay(delayMs);
        }
      }
    }

    // Todos los intentos fallaron
    const errorType = SupabaseErrorClassifier.classify(lastError);
    const userMessage = SupabaseErrorClassifier.getErrorMessage(lastError, errorType);
    
    return {
      success: false,
      data: null,
      error: {
        type: errorType,
        message: userMessage,
        originalError: lastError,
        attempts: RETRY_CONFIG.maxRetries + 1
      }
    };
  }

  // Método específico para verificar conexión
  static async checkConnection() {
    return this.executeWithRetry(async () => {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id')
        .limit(1);
      
      return { data, error };
    }, { operation: 'connection_check' });
  }

  // Método para operaciones de lectura
  static async read(table, query = '*', filters = {}) {
    return this.executeWithRetry(async () => {
      let queryBuilder = supabase.from(table).select(query);
      
      // Aplicar filtros
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          queryBuilder = queryBuilder.eq(key, value);
        }
      });
      
      return await queryBuilder;
    }, { operation: 'read', table, filters });
  }

  // Método para operaciones de escritura
  static async write(table, data, operation = 'insert') {
    return this.executeWithRetry(async () => {
      switch (operation) {
        case 'insert':
          return await supabase.from(table).insert(data).select();
        case 'update':
          return await supabase.from(table).update(data.updates).eq('id', data.id).select();
        case 'upsert':
          return await supabase.from(table).upsert(data).select();
        default:
          throw new Error(`Operación no soportada: ${operation}`);
      }
    }, { operation, table, dataSize: Array.isArray(data) ? data.length : 1 });
  }

  // Método para operaciones complejas con joins
  static async readWithJoins(table, selectQuery, filters = {}) {
    return this.executeWithRetry(async () => {
      let queryBuilder = supabase.from(table).select(selectQuery);
      
      // Aplicar filtros
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          queryBuilder = queryBuilder.eq(key, value);
        }
      });
      
      return await queryBuilder;
    }, { operation: 'read_with_joins', table, selectQuery });
  }
}

// Hook personalizado para usar el manejo de errores
export const useSupabaseErrorHandler = () => {
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [lastError, setLastError] = useState(null);

  const checkConnection = async () => {
    setConnectionStatus('checking');
    const result = await SupabaseErrorHandler.checkConnection();
    
    if (result.success) {
      setConnectionStatus('connected');
      setLastError(null);
    } else {
      setConnectionStatus('disconnected');
      setLastError(result.error);
    }
    
    return result;
  };

  const executeOperation = async (operation, context = {}) => {
    const result = await SupabaseErrorHandler.executeWithRetry(operation, context);
    
    if (!result.success) {
      setLastError(result.error);
    }
    
    return result;
  };

  return {
    connectionStatus,
    lastError,
    checkConnection,
    executeOperation,
    read: SupabaseErrorHandler.read,
    write: SupabaseErrorHandler.write,
    readWithJoins: SupabaseErrorHandler.readWithJoins
  };
};

// Exportar instancia singleton
export const supabaseErrorHandler = new SupabaseErrorHandler();

export default SupabaseErrorHandler;