import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../api/supabase'
import { withErrorHandling, getErrorInfo, logError } from '../utils/ErrorHandling.jsx'
import { QuestionnaireService } from '../services/QuestionnaireService'
import { Debouncer } from '../utils/debounce'
import type { Cuestionario, UseQuestionnaireReturn } from '../types'

/**
 * Custom hook for managing questionnaires data and operations
 * Extracts data loading logic from the Questionnaires component
 */
export const useQuestionnaires = (): UseQuestionnaireReturn => {
  const [cuestionarios, setCuestionarios] = useState<Cuestionario[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const subscriptionRef = useRef<any>(null);

  // Memoized function to load questionnaires data using optimized service
  const cargarCuestionarios = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      console.log('🔄 Cargando cuestionarios (optimizado)...')

      // Use optimized service layer for data loading
      const cuestionariosData = await QuestionnaireService.loadAllData();

      // Verificar que los datos no estén vacíos
      if (!cuestionariosData || cuestionariosData.length === 0) {
        console.log('⚠️ No se encontraron cuestionarios en Supabase')
        setCuestionarios([]) // Siempre usar un array vacío
      } else {
        console.log('✅ Cuestionarios reales cargados desde Supabase:', cuestionariosData.length)
        setCuestionarios(cuestionariosData)
      }
    } catch (error) {
      console.error('❌ Error cargando cuestionarios:', error)
      logError(error, { operation: 'cargarCuestionarios' })
      const errorInfo = getErrorInfo(error)
      setError(errorInfo.message)
      // No usar datos de prueba en caso de error
      setCuestionarios([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Delete questionnaire function using optimized service
  const eliminarCuestionario = useCallback(async (id: string) => {
    const cuestionario = cuestionarios.find(c => c.id === id);
    if (!cuestionario) {
      console.error('Cuestionario no encontrado con ID:', id);
      setError('Cuestionario no encontrado');
      return { exito: false, mensaje: 'Cuestionario no encontrado' };
    }

    const confirmacion = window.confirm(
      `¿Estás seguro de que deseas eliminar el cuestionario de ${cuestionario.titulo}?\n\nEsta acción eliminará:\n- Los datos del usuario\n- Todas sus respuestas\n\nEsta acción no se puede deshacer.`
    )

    if (!confirmacion) return { exito: false, mensaje: 'Operación cancelada por el usuario' }

    try {
      console.log('🗑️ Eliminando cuestionario:', cuestionario.titulo)
      setError(null) // Clear any previous errors

      // Use optimized service for deletion
      await QuestionnaireService.deleteQuestionnaire(cuestionario.id, cuestionario.titulo);

      // Update local list
      setCuestionarios(prev => prev.filter(c => c.id !== cuestionario.id))
      console.log('✅ Cuestionario eliminado exitosamente:', cuestionario.titulo)

      // Show success message
      if (window.alert) {
        window.alert(`Cuestionario de ${cuestionario.titulo} eliminado exitosamente.`);
      }

      return { exito: true, mensaje: 'Cuestionario eliminado exitosamente' }
    } catch (error) {
      console.error('❌ Error eliminando cuestionario:', error)
      logError(error, { operation: 'eliminarCuestionario', cuestionarioId: cuestionario.id })
      const errorInfo = getErrorInfo(error)
      setError(`Error al eliminar cuestionario: ${errorInfo.message}`)

      // Show error message to user
      if (window.alert) {
        window.alert(`Error al eliminar el cuestionario: ${errorInfo.message}`);
      }

      return { exito: false, mensaje: `Error al eliminar cuestionario: ${errorInfo.message}` }
    }
  }, [cuestionarios])

  // Delete multiple questionnaires function
  const eliminarCuestionariosMultiples = useCallback(async (ids: string[]) => {
    if (ids.length === 0) {
      return { exito: false, mensaje: 'No se seleccionaron cuestionarios para eliminar' };
    }

    const cuestionariosAEliminar = cuestionarios.filter(c => ids.includes(c.id));
    if (cuestionariosAEliminar.length === 0) {
      return { exito: false, mensaje: 'No se encontraron cuestionarios para eliminar' };
    }

    const titulos = cuestionariosAEliminar.map(c => c.titulo).join(', ');
    const confirmacion = window.confirm(
      `¿Estás seguro de que deseas eliminar ${cuestionariosAEliminar.length} cuestionario(s)?\n\nCuestionarios seleccionados:\n- ${cuestionariosAEliminar.map(c => c.titulo).join('\n- ')}\n\nEsta acción eliminará:\n- Los datos de los usuarios\n- Todas sus respuestas\n\nEsta acción no se puede deshacer.`
    )

    if (!confirmacion) return { exito: false, mensaje: 'Operación cancelada por el usuario' }

    try {
      console.log(`🗑️ Eliminando ${cuestionariosAEliminar.length} cuestionarios:`, titulos)
      setError(null) // Clear any previous errors

      // Use optimized service for batch deletion
      await QuestionnaireService.deleteQuestionnairesMultiples(ids);

      // Update local list
      setCuestionarios(prev => prev.filter(c => !ids.includes(c.id)))
      console.log(`✅ ${cuestionariosAEliminar.length} cuestionarios eliminados exitosamente`)

      // Show success message
      if (window.alert) {
        window.alert(`${cuestionariosAEliminar.length} cuestionario(s) eliminado(s) exitosamente.`);
      }

      return { exito: true, mensaje: `${cuestionariosAEliminar.length} cuestionario(s) eliminado(s) exitosamente` }
    } catch (error) {
      console.error('❌ Error eliminando cuestionarios múltiples:', error)
      logError(error, { operation: 'eliminarCuestionariosMultiples', cuestionarioIds: ids })
      const errorInfo = getErrorInfo(error)
      setError(`Error al eliminar cuestionarios: ${errorInfo.message}`)

      // Show error message to user
      if (window.alert) {
        window.alert(`Error al eliminar los cuestionarios: ${errorInfo.message}`);
      }

      return { exito: false, mensaje: `Error al eliminar cuestionarios: ${errorInfo.message}` }
    }
  }, [cuestionarios])

  // Setup real-time subscriptions with debouncing for usuarios and respuestas_cuestionario tables
  const setupRealtimeSubscriptions = useCallback(() => {
    // Clean up any existing subscriptions and timers
    if (subscriptionRef.current) {
      const { debouncer } = subscriptionRef.current;
      if (debouncer) {
        debouncer.cancel();
      }
      subscriptionRef.current.subscriptions.forEach((subscription: any) => {
        supabase.removeChannel(subscription);
      });
      subscriptionRef.current = null;
    }

    console.log('🔔 Configurando suscripciones optimizadas en tiempo real...');

    // Create debouncer for reloads
    const debouncer = new Debouncer(1000); // 1 second debounce

    const debouncedReload = () => {
      debouncer.debounce(() => {
        console.log('🔄 Recarga debounced activada');
        cargarCuestionarios();
      });
    };

    // Helper function to retry subscription on error
    const retrySubscription = (channelName: string, tableName: string, callback: (payload: any) => void, maxRetries = 3) => {
      let retryCount = 0;

      const attemptSubscription = () => {
        const subscription = supabase
          .channel(channelName)
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: tableName
          }, callback)
          .subscribe((status) => {
            console.log(`📡 Estado suscripción ${tableName}:`, status);

            if (status === 'CHANNEL_ERROR' && retryCount < maxRetries) {
              retryCount++;
              console.log(`🔄 Reintentando suscripción ${tableName} (${retryCount}/${maxRetries})...`);
              setTimeout(() => {
                supabase.removeChannel(subscription);
                attemptSubscription();
              }, 2000 * retryCount); // Exponential backoff
            } else if (status === 'SUBSCRIBED') {
              console.log(`✅ Suscripción ${tableName} establecida exitosamente`);
            }
          });

        return subscription;
      };

      return attemptSubscription();
    };

    // Subscribe to usuarios table changes with retry logic
    const usuariosSubscription = retrySubscription('usuarios-changes', 'usuarios', (payload) => {
      console.log('📱 Cambio en tiempo real - usuarios:', payload.eventType);
      debouncedReload();
    });

    // Subscribe to respuestas_cuestionario table changes with retry logic
    const respuestasSubscription = retrySubscription('respuestas-changes', 'respuestas_cuestionario', (payload) => {
      console.log('📱 Cambio en tiempo real - respuestas:', payload.eventType);
      debouncedReload();
    });

    subscriptionRef.current = {
      subscriptions: [usuariosSubscription, respuestasSubscription],
      debouncer
    };
  }, [cargarCuestionarios]);

  // Clean up subscriptions and timers on unmount
  const cleanupSubscriptions = useCallback(() => {
    if (subscriptionRef.current) {
      const { subscriptions, debouncer } = subscriptionRef.current;
      
      // Clear debouncer
      if (debouncer) {
        debouncer.cancel();
      }
      
      // Remove all subscriptions
      if (subscriptions) {
        subscriptions.forEach((subscription: any) => {
          supabase.removeChannel(subscription);
        });
      }
      
      subscriptionRef.current = null;
      console.log('🧹 Suscripciones y debouncers en tiempo real limpiados');
    }
  }, []);

  // Load data and setup subscriptions on mount
  useEffect(() => {
    cargarCuestionarios();
    setupRealtimeSubscriptions();

    return () => {
      cleanupSubscriptions();
    };
  }, [cargarCuestionarios, setupRealtimeSubscriptions, cleanupSubscriptions]);

  return {
    cuestionarios,
    loading,
    error,
    cargarCuestionarios,
    eliminarCuestionario,
    eliminarCuestionariosMultiples,
    cuestionariosFiltrados: cuestionarios,
    totalCuestionarios: cuestionarios.length,
    crearCuestionario: async () => ({ exito: false, mensaje: 'No implementado' }),
    editarCuestionario: async () => ({ exito: false, mensaje: 'No implementado' }),
    duplicarCuestionario: async () => ({ exito: false, mensaje: 'No implementado' }),
    cambiarEstado: async () => ({ exito: false, mensaje: 'No implementado' }),
    filtros: {},
    aplicarFiltros: () => {},
    limpiarFiltros: () => {},
    paginacion: { pagina: 1, limite: 10 },
    cambiarPagina: () => {},
    cambiarLimite: () => {}
  } as any
}