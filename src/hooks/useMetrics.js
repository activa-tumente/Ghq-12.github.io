import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../api/supabase';
import { useErrorHandler } from './useErrorHandler';

/**
 * Hook for managing metrics data
 */
export const useMetrics = (type = 'home', filters = {}) => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const { withErrorHandling } = useErrorHandler();

  const fetchHomeMetrics = useCallback(async () => {
    const [
      { data: respuestas, error: respuestasError },
      { count: totalUsuarios },
      { count: totalRespuestas }
    ] = await Promise.all([
      supabase.from('respuestas_cuestionario').select('usuario_id, respuestas, fecha_respuesta'),
      supabase.from('usuarios').select('*', { count: 'exact', head: true }),
      supabase.from('respuestas_cuestionario').select('*', { count: 'exact', head: true })
    ]);

    if (respuestasError) throw respuestasError;

    const usuariosConRespuestas = new Set(respuestas?.map(r => r.usuario_id) || []).size;
    const evaluacionesCompletadas = usuariosConRespuestas;
    
    // Calculate wellness index
    const promedioSalud = calculateAverageHealth(respuestas);
    const indiceBienestar = Math.max(0, Math.min(100, ((3 - promedioSalud) / 3) * 100));
    const tendenciaMensual = calculateMonthlyTrend(respuestas || []);

    return {
      evaluacionesCompletadas,
      usuariosActivos: totalUsuarios || 0,
      indiceBienestar: Math.round(indiceBienestar),
      tendenciaMensual: `${tendenciaMensual >= 0 ? '+' : ''}${Math.round(tendenciaMensual)}%`,
      promedioSalud: parseFloat(promedioSalud.toFixed(2)),
      totalRespuestas: totalRespuestas || 0
    };
  }, []);

  const calculateAverageHealth = useCallback((respuestas) => {
    let totalPuntuacion = 0;
    let totalPreguntas = 0;
    
    respuestas?.forEach(respuesta => {
      if (respuesta.respuestas && typeof respuesta.respuestas === 'object') {
        Object.values(respuesta.respuestas).forEach(valor => {
          if (typeof valor === 'number') {
            totalPuntuacion += valor;
            totalPreguntas++;
          }
        });
      }
    });

    return totalPreguntas > 0 ? totalPuntuacion / totalPreguntas : 0;
  }, []);

  const calculateMonthlyTrend = useCallback((datos) => {
    const fechaActual = new Date();
    const mesAnterior = new Date(fechaActual.getFullYear(), fechaActual.getMonth() - 1, 1);
    
    const datosMesActual = datos.filter(d => 
      new Date(d.fecha_respuesta) >= new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1)
    );
    
    const datosMesAnterior = datos.filter(d => {
      const fecha = new Date(d.fecha_respuesta);
      return fecha >= mesAnterior && fecha < new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
    });

    const cambio = datosMesAnterior.length > 0 
      ? ((datosMesActual.length - datosMesAnterior.length) / datosMesAnterior.length) * 100
      : datosMesActual.length > 0 ? 100 : 0;

    return cambio;
  }, []);

  const loadMetrics = useCallback(
    withErrorHandling(async () => {
      setLoading(true);
      
      let result;
      switch (type) {
        case 'home':
          result = await fetchHomeMetrics();
          break;
        // Add other metric types as needed
        default:
          result = await fetchHomeMetrics();
      }
      
      setMetrics(result);
    }, { operation: `load ${type} metrics` }),
    [type, filters, fetchHomeMetrics, withErrorHandling]
  );

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  return {
    metrics,
    loading,
    refetch: loadMetrics
  };
};