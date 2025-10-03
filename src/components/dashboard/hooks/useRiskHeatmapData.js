import { useState, useEffect } from 'react';
import DashboardServiceOptimized from '../../../../src/services/DashboardServiceOptimized';

/**
 * Hook personalizado para procesar los datos del heatmap de riesgo.
 * Ahora obtiene los datos directamente del DashboardServiceOptimized, que a su vez
 * llama a las funciones RPC de Supabase.
 * 
 * @param {object} filters - Filtros para la consulta de datos (startDate, endDate, departmentIds, positionIds).
 * @returns {object} - Objeto con los datos procesados para el heatmap.
 */
export const useRiskHeatmapData = (filters) => {
  const [heatmapData, setHeatmapData] = useState({ departments: [], averageRisk: {}, departmentDetails: {}, isEmpty: true });
  const [criticalPoints, setCriticalPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHeatmapData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await DashboardServiceOptimized.getHeatmapData(filters);
        const critical = await DashboardServiceOptimized.getCriticalPoints(filters);

        // Adaptar la estructura de datos de Supabase a lo que espera el componente
        const processedHeatmapData = processSupabaseHeatmapData(data);
        setHeatmapData(processedHeatmapData);
        setCriticalPoints(critical);
      } catch (err) {
        console.error("Error fetching heatmap data:", err);
        setError(err);
        setHeatmapData({ departments: [], averageRisk: {}, departmentDetails: {}, isEmpty: true });
        setCriticalPoints([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHeatmapData();
  }, [filters]);

  // Función auxiliar para adaptar los datos de Supabase
  const processSupabaseHeatmapData = (data) => {
    if (!data || data.length === 0) {
      return { departments: [], averageRisk: {}, departmentDetails: {}, isEmpty: true };
    }

    const departments = [];
    const averageRisk = {};
    const departmentDetails = {};

    data.forEach(deptData => {
      const deptName = deptData.department_name;
      departments.push(deptName);

      // Calcular el promedio de riesgo (simplificado para este ejemplo, se puede refinar)
      // Para el promedio, podríamos sumar los porcentajes ponderados por nivel de riesgo
      // O simplemente usar el porcentaje de 'Alto'/'Muy Alto' como indicador principal
      let totalRiskPercentage = 0;
      let totalUsers = deptData.total_users;
      
      // Ejemplo simple de cálculo de 'averageRisk' para compatibilidad
      // Esto debería ser más sofisticado si se necesita un promedio real de riesgo
      // Por ahora, usaremos el porcentaje de 'Muy Alto' como un proxy para el promedio visual
      const riskDistribution = deptData.risk_distribution;
      const muyAltoPercentage = riskDistribution['Muy Alto'] || 0;
      const altoPercentage = riskDistribution['Alto'] || 0;
      const moderadoPercentage = riskDistribution['Moderado'] || 0;
      const bajoPercentage = riskDistribution['Bajo'] || 0;
      const muyBajoPercentage = riskDistribution['Muy Bajo'] || 0;

      // Un cálculo ponderado simple para un 'averageRisk' representativo
      averageRisk[deptName] = (
        (muyAltoPercentage * 5) + 
        (altoPercentage * 4) + 
        (moderadoPercentage * 3) + 
        (bajoPercentage * 2) + 
        (muyBajoPercentage * 1)
      ) / 500; // Dividir por 500 para normalizar a una escala de 0-1 (o similar)

      departmentDetails[deptName] = {
        totalResponses: totalUsers, // Asumimos que total_users es el total de respuestas únicas
        uniqueUsers: totalUsers,
        riskDistribution: {
          'Muy Bajo': muyBajoPercentage,
          'Bajo': bajoPercentage,
          'Moderado': moderadoPercentage,
          'Alto': altoPercentage,
          'Muy Alto': muyAltoPercentage,
        },
        rawDistribution: riskDistribution // Guardar la distribución completa para el detalle
      };
    });

    return {
      departments: departments.sort(),
      averageRisk,
      departmentDetails,
      isEmpty: departments.length === 0
    };
  };

  return {
    heatmapData,
    criticalPoints,
    loading,
    error,
    isEmpty: heatmapData.isEmpty,
  };
};