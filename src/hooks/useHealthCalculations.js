import { useMemo } from 'react';
import { calcularNivelSalud, getHealthLevelConfig } from '../utils/healthCalculations';

/**
 * Hook for health level calculations and statistics
 */
export const useHealthCalculations = (respuestas) => {
  // Calcular estadísticas con memoización
  const estadisticas = useMemo(() => {
    return respuestas.reduce((stats, resp) => {
      stats.total++;
      stats[resp.nivel] = (stats[resp.nivel] || 0) + 1;
      return stats;
    }, { total: 0, bajo: 0, moderado: 0, alto: 0, muy_alto: 0, sin_datos: 0 });
  }, [respuestas]);

  // Calcular distribución de niveles
  const distribucionNiveles = useMemo(() => {
    const total = estadisticas.total;
    if (total === 0) return {};

    return {
      bajo: Math.round((estadisticas.bajo / total) * 100),
      moderado: Math.round((estadisticas.moderado / total) * 100),
      alto: Math.round((estadisticas.alto / total) * 100),
      muy_alto: Math.round((estadisticas.muy_alto / total) * 100),
      sin_datos: Math.round((estadisticas.sin_datos / total) * 100)
    };
  }, [estadisticas]);

  // Calcular promedio general
  const promedioGeneral = useMemo(() => {
    const respuestasConDatos = respuestas.filter(r => r.nivel !== 'sin_datos');
    if (respuestasConDatos.length === 0) return 0;

    const suma = respuestasConDatos.reduce((sum, r) => sum + (r.puntuacionTotal || 0), 0);
    return parseFloat((suma / respuestasConDatos.length).toFixed(2));
  }, [respuestas]);

  return {
    estadisticas,
    distribucionNiveles,
    promedioGeneral,
    calcularNivelSalud,
    getHealthLevelConfig
  };
};