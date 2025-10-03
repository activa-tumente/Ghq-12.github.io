import { useMemo } from 'react';

const DASHBOARD_COLORS = {
  primary: '#3B82F6',
  secondary: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#8B5CF6',
  success: '#06D6A0'
};

/**
 * Custom hook for processing and memoizing chart data
 */
export const useChartData = (data) => {
  return useMemo(() => {
    if (!data) return null;

    const { coreMetrics, departmentMetrics } = data;

    const sociodemographic = coreMetrics?.sociodemographic?.distribucionGenero ? [
      { 
        name: 'Masculino', 
        value: coreMetrics.sociodemographic.distribucionGenero.masculino || 0, 
        fill: DASHBOARD_COLORS.primary 
      },
      { 
        name: 'Femenino', 
        value: coreMetrics.sociodemographic.distribucionGenero.femenino || 0, 
        fill: DASHBOARD_COLORS.secondary 
      },
      { 
        name: 'Otro', 
        value: coreMetrics.sociodemographic.distribucionGenero.otro || 0, 
        fill: DASHBOARD_COLORS.info 
      }
    ].filter(item => item.value > 0) : [];

    const departments = departmentMetrics?.map(dept => ({
      departamento: dept.departamento,
      participantes: dept.total_participantes,
      satisfaccion: dept.satisfaccion_promedio,
      motivacion: dept.motivacion_promedio,
      confianza: dept.confianza_promedio,
      ghq: dept.ghq_promedio,
      riesgo: dept.pct_riesgo
    })) || [];

    const ghqLevels = coreMetrics?.ghqDistribution ? [
      { name: 'Bajo', value: coreMetrics.ghqDistribution.bajo || 0, fill: DASHBOARD_COLORS.success },
      { name: 'Moderado', value: coreMetrics.ghqDistribution.moderado || 0, fill: DASHBOARD_COLORS.warning },
      { name: 'Alto', value: coreMetrics.ghqDistribution.alto || 0, fill: DASHBOARD_COLORS.danger },
      { name: 'Muy Alto', value: coreMetrics.ghqDistribution.muyAlto || 0, fill: '#7F1D1D' }
    ].filter(item => item.value > 0) : [];

    const radarData = departments.slice(0, 6).map(dept => ({
      departamento: dept.departamento,
      Satisfacción: dept.satisfaccion || 0,
      Motivación: dept.motivacion || 0,
      Confianza: dept.confianza || 0,
      'GHQ-12': Math.max(0, 5 - (dept.ghq || 0))
    }));

    return {
      sociodemographic,
      departments,
      ghqLevels,
      radarData
    };
  }, [data]);
};

export default useChartData;