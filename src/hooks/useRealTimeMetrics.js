import { useState, useEffect, useCallback, useRef } from 'react';
import { MetricsService } from '../services/MetricsService';
import { supabase } from '../api/supabase';
import { logError } from '../utils/ErrorHandling.jsx';

/**
 * Hook personalizado para métricas en tiempo real
 * Proporciona datos actualizados y sincronización automática con Supabase
 */
export const useRealTimeMetrics = (pageType, options = {}) => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isRealTime, setIsRealTime] = useState(false);

  // Referencias para cleanup y control
  const isMountedRef = useRef(true);
  const subscriptionRef = useRef(null);
  const intervalRef = useRef(null);

  // Configuración por defecto
  const config = {
    enableRealTime: true,
    refreshInterval: 30000, // 30 segundos
    retryAttempts: 3,
    retryDelay: 1000,
    ...options
  };

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  /**
   * Cargar métricas según el tipo de página
   */
  const loadMetrics = useCallback(async (retryCount = 0) => {
    if (!isMountedRef.current) return;

    try {
      console.log(`📊 Cargando métricas para ${pageType}...`);
      
      let data;
      switch (pageType) {
        case 'home':
          data = await MetricsService.getHomeMetrics();
          break;
        case 'dashboard':
          data = await MetricsService.getDashboardMetrics(config.filters);
          break;
        case 'questionnaires':
          data = await MetricsService.getQuestionnaireMetrics();
          break;
        case 'responses':
          data = await MetricsService.getResponsesMetrics();
          break;
        case 'users':
          data = await MetricsService.getUsersMetrics();
          break;
        default:
          throw new Error(`Tipo de página no soportado: ${pageType}`);
      }

      if (isMountedRef.current) {
        setMetrics(data);
        setError(null);
        setLastUpdate(new Date().toISOString());
        console.log(`✅ Métricas cargadas para ${pageType}:`, data);
      }

    } catch (err) {
      console.error(`❌ Error cargando métricas para ${pageType}:`, err);
      
      if (retryCount < config.retryAttempts) {
        console.log(`🔄 Reintentando... (${retryCount + 1}/${config.retryAttempts})`);
        setTimeout(() => {
          loadMetrics(retryCount + 1);
        }, config.retryDelay * Math.pow(2, retryCount)); // Backoff exponencial
      } else {
        if (isMountedRef.current) {
          setError({
            message: `Error al cargar métricas: ${err.message}`,
            type: 'load_error',
            timestamp: new Date().toISOString()
          });
          logError(err, { operation: 'useRealTimeMetrics.loadMetrics', pageType });
        }
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [pageType, config.filters, config.retryAttempts, config.retryDelay]);

  /**
   * Manejar actualizaciones en tiempo real
   */
  const handleRealTimeUpdate = useCallback((table, payload) => {
    if (!isMountedRef.current) return;

    console.log(`🔄 Actualizando métricas por cambio en ${table}:`, payload.eventType);

    // Recargar métricas después de un pequeño delay para permitir que se procesen los cambios
    setTimeout(() => {
      if (isMountedRef.current) {
        loadMetrics();
      }
    }, 1000);
  }, [loadMetrics]);

  /**
   * Configurar suscripción en tiempo real
   */
  const setupRealTimeSubscription = useCallback(() => {
    if (!config.enableRealTime || subscriptionRef.current) return;

    console.log(`🔄 Configurando suscripción en tiempo real para ${pageType}...`);

    // Helper function to retry subscription on error
    const retrySubscription = (channelName, maxRetries = 3) => {
      let retryCount = 0;

      const attemptSubscription = () => {
        const channel = supabase
          .channel(channelName)
          .on('postgres_changes',
            { event: '*', schema: 'public', table: 'usuarios' },
            (payload) => {
              console.log('👥 Cambio en usuarios:', payload);
              handleRealTimeUpdate('usuarios', payload);
            }
          )
          .on('postgres_changes',
            { event: '*', schema: 'public', table: 'respuestas_cuestionario' },
            (payload) => {
              console.log('💬 Cambio en respuestas:', payload);
              handleRealTimeUpdate('respuestas', payload);
            }
          )
          .subscribe((status) => {
            console.log(`📡 Estado de suscripción para ${pageType}:`, status, `Intento: ${retryCount + 1}`);

            if (status === 'CHANNEL_ERROR' && retryCount < maxRetries) {
              retryCount++;
              console.log(`🔄 Reintentando suscripción ${pageType} (${retryCount}/${maxRetries}) en ${2000 * retryCount}ms...`);
              setTimeout(() => {
                if (subscriptionRef.current) {
                  supabase.removeChannel(subscriptionRef.current);
                  subscriptionRef.current = null;
                }
                attemptSubscription();
              }, 2000 * retryCount); // Exponential backoff
            } else if (status === 'SUBSCRIBED') {
              console.log(`✅ Suscripción ${pageType} establecida exitosamente`);
              if (isMountedRef.current) {
                setIsRealTime(true);
              }
            } else if (status === 'CLOSED') {
              console.log(`🔒 Suscripción ${pageType} cerrada - ${retryCount < maxRetries ? 'reintentando' : 'sin más reintentos'}`);
              if (isMountedRef.current) {
                setIsRealTime(false);
              }
              // Try to reconnect if closed and we haven't exceeded retries
              if (retryCount < maxRetries) {
                retryCount++;
                console.log(`🔄 Reconectando suscripción ${pageType} cerrada (${retryCount}/${maxRetries})...`);
                setTimeout(() => {
                  if (subscriptionRef.current) {
                    supabase.removeChannel(subscriptionRef.current);
                    subscriptionRef.current = null;
                  }
                  attemptSubscription();
                }, 3000 * retryCount);
              }
            } else if (status === 'TIMED_OUT') {
              console.log(`⏰ Suscripción ${pageType} expiró por tiempo`);
              if (retryCount < maxRetries) {
                retryCount++;
                console.log(`🔄 Reintentando suscripción ${pageType} por timeout (${retryCount}/${maxRetries})...`);
                setTimeout(() => attemptSubscription(), 1000 * retryCount);
              }
            }
          });

        subscriptionRef.current = channel;
      };

      attemptSubscription();
    };

    retrySubscription(`metrics_${pageType}_${Date.now()}`); // Unique channel name
  }, [pageType, config.enableRealTime, handleRealTimeUpdate]);


  /**
   * Configurar actualización periódica como fallback
   */
  const setupPeriodicRefresh = useCallback(() => {
    if (config.refreshInterval <= 0) return;

    intervalRef.current = setInterval(() => {
      if (isMountedRef.current && !loading) {
        console.log(`⏰ Actualización periódica para ${pageType}`);
        loadMetrics();
      }
    }, config.refreshInterval);
  }, [pageType, config.refreshInterval, loading, loadMetrics]);

  /**
   * Refrescar métricas manualmente
   */
  const refreshMetrics = useCallback(() => {
    setLoading(true);
    setError(null);
    loadMetrics();
  }, [loadMetrics]);

  /**
   * Limpiar cache y recargar
   */
  const clearCacheAndReload = useCallback(() => {
    setMetrics(null);
    setError(null);
    setLastUpdate(null);
    refreshMetrics();
  }, [refreshMetrics]);

  // Efecto principal para inicializar
  useEffect(() => {
    console.log(`🚀 Inicializando métricas para ${pageType}...`);
    
    // Cargar métricas iniciales
    loadMetrics();
    
    // Configurar tiempo real si está habilitado
    if (config.enableRealTime) {
      setupRealTimeSubscription();
    }
    
    // Configurar actualización periódica
    setupPeriodicRefresh();

  }, [loadMetrics, setupRealTimeSubscription, setupPeriodicRefresh]);

  // Efecto para recargar cuando cambian los filtros
  useEffect(() => {
    if (config.filters && Object.keys(config.filters).length > 0) {
      console.log(`🔄 Recargando métricas por cambio en filtros:`, config.filters);
      loadMetrics();
    }
  }, [config.filters, loadMetrics]);

  return {
    // Datos principales
    metrics,
    loading,
    error,
    lastUpdate,
    
    // Estado de conexión
    isRealTime,
    isConnected: !error && metrics !== null,
    
    // Métodos de control
    refreshMetrics,
    clearCacheAndReload,
    
    // Información adicional
    pageType,
    config: {
      enableRealTime: config.enableRealTime,
      refreshInterval: config.refreshInterval,
      hasFilters: !!(config.filters && Object.keys(config.filters).length > 0)
    }
  };
};

/**
 * Hook específico para métricas de Home
 */
export const useHomeMetrics = (options = {}) => {
  return useRealTimeMetrics('home', options);
};

/**
 * Hook específico para métricas de Dashboard
 */
export const useDashboardMetrics = (filters = {}, options = {}) => {
  return useRealTimeMetrics('dashboard', { ...options, filters });
};

/**
 * Hook específico para métricas de Cuestionarios
 */
export const useQuestionnaireMetrics = (options = {}) => {
  return useRealTimeMetrics('questionnaires', options);
};

/**
 * Hook específico para métricas de Respuestas
 */
export const useResponsesMetrics = (options = {}) => {
  return useRealTimeMetrics('responses', options);
};

/**
 * Hook específico para métricas de Usuarios
 */
export const useUsersMetrics = (options = {}) => {
  return useRealTimeMetrics('users', options);
};

export default useRealTimeMetrics;