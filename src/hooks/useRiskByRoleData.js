import { useState, useEffect } from 'react';
import { RiskByRoleService } from '../services/RiskByRoleService';

/**
 * Hook personalizado para obtener y manejar datos de riesgo por cargo/rol
 * @param {Object} filters - Filtros opcionales para la consulta
 * @returns {Object} Estado y datos del hook
 */
export const useRiskByRoleData = (filters = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRiskByRoleData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const riskData = await RiskByRoleService.getRiskByRoleChartData(filters);
        setData(riskData);
        
      } catch (err) {
        console.error('Error fetching risk by role data:', err);
        setError(err.message || 'Error al cargar datos de riesgo por cargo');
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRiskByRoleData();
  }, [filters]);

  return {
    data,
    loading,
    error,
    isEmpty: data.length === 0 && !loading
  };
};