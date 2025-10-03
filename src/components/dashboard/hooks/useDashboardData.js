import { useState, useEffect, useRef } from 'react';
import DashboardService from '../../../services/DashboardService';
import { useToast } from '../../../hooks/useToast';
import { supabase } from '../../../api/supabase';

/**
 * Hook personalizado para manejar la lógica de datos del dashboard
 * Separa la lógica de negocio del componente de presentación
 */
export const useDashboardData = (filters = {}) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  const { error: showError } = useToast();
  const subscriptionRef = useRef(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await DashboardService.getDashboardData(filters);
      
      if (result.success) {
        setDashboardData(result.data);
      } else {
        throw new Error(result.error || 'Error al cargar datos del dashboard');
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError(err.message);
      showError('No se pudieron cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const setupRealTimeSubscription = () => {
    // Cleanup existing subscription
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    // Subscribe to changes with debounced updates
    subscriptionRef.current = supabase
      .channel('dashboard-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'respuestas_cuestionario'
      }, (payload) => {
        console.log('Nueva respuesta detectada:', payload);
        // Debounce updates to avoid too frequent refreshes
        setTimeout(() => {
          loadDashboardData();
          setLastUpdate(new Date());
        }, 1000);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'usuarios'
      }, (payload) => {
        console.log('Cambio en usuarios detectado:', payload);
        setTimeout(() => {
          loadDashboardData();
          setLastUpdate(new Date());
        }, 1000);
      })
      .subscribe();
  };

  useEffect(() => {
    loadDashboardData();
    setupRealTimeSubscription();

    // Cleanup subscription on unmount
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [filters]);

  const handleRefresh = () => {
    loadDashboardData();
  };

  return {
    dashboardData,
    loading,
    error,
    lastUpdate,
    handleRefresh
  };
};