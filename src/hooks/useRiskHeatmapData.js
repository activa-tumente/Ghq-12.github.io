import { useMemo } from 'react';
import { 
  getRiskLabel, 
  calculateStatistics, 
  generateRecommendations 
} from '../utils/riskUtils';
import { RISK_THRESHOLDS } from '../components/dashboard/components/RiskHeatmap/constants';

/**
 * Custom hook para manejar la lógica de datos del RiskHeatmap
 * @param {Object} data - Datos del dashboard
 * @param {boolean} loading - Estado de carga
 * @returns {Object} Datos procesados para el heatmap
 */
export const useRiskHeatmapData = (data, loading) => {
  // Procesar datos para el heatmap
  const heatmapData = useMemo(() => {
    if (!data || loading) {
      return { departments: [], averageRisk: {}, isEmpty: true };
    }

    const departmentData = data?.segmented?.byDepartment || {};
    
    if (Object.keys(departmentData).length === 0) {
      return { departments: [], averageRisk: {}, isEmpty: true };
    }

    const averageRisk = {};
    Object.keys(departmentData).forEach(dept => {
      const deptData = departmentData[dept];
      if (deptData && deptData.averageRisk !== undefined) {
        averageRisk[dept] = deptData.averageRisk;
      }
    });

    return {
      departments: Object.keys(averageRisk).sort(),
      averageRisk,
      isEmpty: Object.keys(averageRisk).length === 0
    };
  }, [data?.segmented?.byDepartment, loading]);

  // Identificar departamentos críticos
  const criticalDepartments = useMemo(() => {
    if (heatmapData.isEmpty) return [];
    
    return heatmapData.departments
      .map(dept => ({
        name: dept,
        risk: heatmapData.averageRisk[dept],
        level: getRiskLabel(heatmapData.averageRisk[dept])
      }))
      .filter(dept => dept.risk >= RISK_THRESHOLDS.LOW)
      .sort((a, b) => b.risk - a.risk)
      .slice(0, 5);
  }, [heatmapData]);

  // Calcular estadísticas
  const statistics = useMemo(() => {
    return calculateStatistics(heatmapData.departments, heatmapData.averageRisk);
  }, [heatmapData]);

  // Generar recomendaciones
  const recommendations = useMemo(() => {
    return generateRecommendations(criticalDepartments, statistics);
  }, [criticalDepartments, statistics]);

  return {
    heatmapData,
    criticalDepartments,
    statistics,
    recommendations
  };
};