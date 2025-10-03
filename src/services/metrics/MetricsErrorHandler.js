import { logError, getUserFriendlyMessage } from '../../utils/errorHandling';

/**
 * Manejador centralizado de errores para métricas
 */
export class MetricsErrorHandler {
  
  /**
   * Maneja errores de manera consistente con contexto
   */
  static handleError(error, context = {}) {
    const errorContext = {
      timestamp: new Date().toISOString(),
      service: 'MetricsService',
      ...context
    };

    // Log técnico detallado
    console.error(`❌ Metrics Error [${context.operation || 'unknown'}]:`, error);
    logError(error, errorContext);

    // Determinar si retornar datos por defecto o propagar error
    if (context.returnDefaults) {
      console.warn(`🔄 Returning default metrics for type: ${context.type}`);
      return this.getDefaultMetrics(context.type);
    }

    // Crear error amigable para el usuario
    const userError = new Error(getUserFriendlyMessage(error));
    userError.originalError = error;
    userError.context = errorContext;
    userError.isMetricsError = true; // Flag for error boundaries
    
    throw userError;
  }

  /**
   * Retorna métricas por defecto según el tipo
   */
  static getDefaultMetrics(type) {
    const defaults = {
      home: {
        evaluacionesCompletadas: 0,
        usuariosActivos: 0,
        indiceBienestar: 0,
        tendenciaMensual: '0%',
        promedioSalud: 0,
        totalRespuestas: 0
      },
      dashboard: {
        resultadosGenerales: {
          evaluacionesCompletadas: 0,
          promedioGlobal: 0,
          nivelCumplimiento: 0
        },
        segmentacion: { porArea: {}, porTurno: {}, porGenero: {} },
        datosSeguridad: { respuestasSaludables: 0, respuestasProblematicas: 0 }
      },
      questionnaires: {
        cuestionarios: [],
        totalCuestionarios: 0,
        completados: 0,
        pendientes: 0,
        promedioGeneral: 0
      },
      responses: {
        respuestas: [],
        totalRespuestas: 0,
        distribucionRespuestas: { 0: 0, 1: 0, 2: 0, 3: 0 },
        promedioGeneral: 0
      },
      users: {
        usuarios: [],
        totalUsuarios: 0,
        usuariosActivos: 0,
        usuariosPendientes: 0
      }
    };

    return defaults[type] || {};
  }

  /**
   * Wrapper para operaciones con manejo de errores automático
   */
  static async withErrorHandling(operation, context = {}) {
    try {
      return await operation();
    } catch (error) {
      return this.handleError(error, context);
    }
  }

  /**
   * Wrapper específico para operaciones de métricas con retry
   */
  static async withRetry(operation, context = {}, maxRetries = 2) {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt < maxRetries && this.isRetryableError(error)) {
          console.warn(`⚠️ Retry attempt ${attempt + 1}/${maxRetries} for ${context.operation}`);
          await this.delay(1000 * (attempt + 1)); // Exponential backoff
          continue;
        }
        
        break;
      }
    }
    
    return this.handleError(lastError, { ...context, attempts: maxRetries + 1 });
  }

  /**
   * Determina si un error es reintentable
   */
  static isRetryableError(error) {
    const retryableCodes = ['PGRST301', 'PGRST302', 'NETWORK_ERROR'];
    return retryableCodes.some(code => error.code === code || error.message.includes(code));
  }

  /**
   * Delay helper para retry logic
   */
  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}