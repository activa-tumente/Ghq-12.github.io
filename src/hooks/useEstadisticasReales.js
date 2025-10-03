import { useState, useEffect } from 'react'
import { supabase, dbHelpers, subscribeToTable } from '../api/supabase'

/**
 * Hook para obtener estadísticas en tiempo real desde Supabase
 * @returns {Object} Estadísticas calculadas desde datos reales
 */
export function useEstadisticasReales() {
  const [estadisticas, setEstadisticas] = useState({
    total_usuarios: 0,
    total_respuestas: 0,
    puntuacion_promedio: 0,
    usuarios_con_respuestas: 0,
    cargando: true,
    error: null
  })

  useEffect(() => {
    let isMounted = true
    
    const cargarEstadisticas = async () => {
      try {
        // Usar la función de dbHelpers para obtener estadísticas calculadas
        const stats = await dbHelpers.getEstadisticas()
        
        if (isMounted) {
          setEstadisticas({
            ...stats,
            cargando: false,
            error: null
          })
        }
      } catch (error) {
        console.error('Error al cargar estadísticas:', error)
        if (isMounted) {
          // Handle case when tables don't exist (no data scenario)
          const errorMessage = error.message || String(error);
          if (errorMessage.includes('Could not find the table')) {
            console.log('⚠️ Tablas no encontradas, mostrando estadísticas vacías');
            setEstadisticas({
              total_usuarios: 0,
              total_respuestas: 0,
              puntuacion_promedio: 0,
              usuarios_con_respuestas: 0,
              cargando: false,
              error: null
            });
          } else {
            setEstadisticas(prev => ({
              ...prev,
              cargando: false,
              error: errorMessage
            }));
          }
        }
      }
    }

    // Cargar estadísticas iniciales
    cargarEstadisticas()

    // Suscribirse a cambios en las tablas relevantes
    const usuariosSubscription = subscribeToTable('usuarios', () => {
      cargarEstadisticas()
    })

    const respuestasSubscription = subscribeToTable('respuestas_cuestionario', () => {
      cargarEstadisticas()
    })

    // Limpiar suscripciones al desmontar
    return () => {
      isMounted = false
      usuariosSubscription.unsubscribe()
      respuestasSubscription.unsubscribe()
    }
  }, [])

  return estadisticas
}

export default useEstadisticasReales