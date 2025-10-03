import { useState, useEffect } from 'react';
import DashboardService from '../../../services/DashboardService';
import { useToast } from '../../../hooks/useToast';

/**
 * Hook personalizado para manejar los datos de tendencias temporales
 * Separa la lógica de negocio del componente de presentación
 */
export const useTimeTrendsData = (filters = {}) => {
  const [timeTrendsData, setTimeTrendsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { error: showError } = useToast();

  const loadTimeTrendsData = async () => {
    console.log('🔄 useTimeTrendsData - Iniciando carga con filtros:', filters);

    try {
      setLoading(true);
      setError(null);

      console.log('📡 useTimeTrendsData - Llamando a DashboardService.getTimeTrends...');
      const data = await DashboardService.getTimeTrends(filters);

      console.log('✅ useTimeTrendsData - Datos recibidos:', {
        isArray: Array.isArray(data),
        length: data?.length,
        firstItem: data?.[0]
      });

      setTimeTrendsData(data || []);
    } catch (err) {
      console.error('❌ useTimeTrendsData - Error loading time trends:', err);
      setError(err.message || 'Error desconocido');
      showError('No se pudieron cargar las tendencias temporales');
      setTimeTrendsData([]);
    } finally {
      setLoading(false);
      console.log('🏁 useTimeTrendsData - Carga finalizada');
    }
  };

  useEffect(() => {
    console.log('🎬 useTimeTrendsData - useEffect disparado');
    loadTimeTrendsData();
  }, [JSON.stringify(filters)]);

  const handleRefresh = () => {
    console.log('🔄 useTimeTrendsData - Refresh manual');
    loadTimeTrendsData();
  };

  return {
    timeTrendsData,
    loading,
    error,
    handleRefresh
  };
};