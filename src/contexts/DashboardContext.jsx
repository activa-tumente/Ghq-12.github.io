import React, { createContext, useContext, useReducer, useEffect } from 'react';
import DashboardService from '../services/DashboardService';
import { supabase } from '../api/supabase';

/**
 * Context para manejo centralizado del estado del dashboard
 * Implementa el patrón Context + Reducer para estado complejo
 */

// Tipos de acciones
const DASHBOARD_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_DATA: 'SET_DATA',
  SET_ERROR: 'SET_ERROR',
  SET_FILTERS: 'SET_FILTERS',
  UPDATE_LAST_REFRESH: 'UPDATE_LAST_REFRESH',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Estado inicial
const initialState = {
  data: null,
  loading: true,
  error: null,
  filters: {},
  lastRefresh: null,
  isRealTimeEnabled: true
};

// Reducer para manejar las acciones
const dashboardReducer = (state, action) => {
  switch (action.type) {
    case DASHBOARD_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
        error: action.payload ? null : state.error // Limpiar error al cargar
      };

    case DASHBOARD_ACTIONS.SET_DATA:
      return {
        ...state,
        data: action.payload,
        loading: false,
        error: null,
        lastRefresh: new Date()
      };

    case DASHBOARD_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };

    case DASHBOARD_ACTIONS.SET_FILTERS:
      return {
        ...state,
        filters: { ...state.filters, ...action.payload }
      };

    case DASHBOARD_ACTIONS.UPDATE_LAST_REFRESH:
      return {
        ...state,
        lastRefresh: new Date()
      };

    case DASHBOARD_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    default:
      return state;
  }
};

// Crear contextos
const DashboardContext = createContext();
const DashboardDispatchContext = createContext();

// Provider del contexto
export const DashboardProvider = ({ children }) => {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);

  // Función para cargar datos
  const loadDashboardData = async (filters = state.filters) => {
    try {
      dispatch({ type: DASHBOARD_ACTIONS.SET_LOADING, payload: true });
      
      const result = await DashboardService.getDashboardData(filters);
      
      if (result.success) {
        dispatch({ type: DASHBOARD_ACTIONS.SET_DATA, payload: result.data });
      } else {
        throw new Error(result.error || 'Error al cargar datos del dashboard');
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      dispatch({ type: DASHBOARD_ACTIONS.SET_ERROR, payload: error.message });
    }
  };

  // Función para actualizar filtros
  const updateFilters = (newFilters) => {
    dispatch({ type: DASHBOARD_ACTIONS.SET_FILTERS, payload: newFilters });
    // Recargar datos con nuevos filtros
    loadDashboardData({ ...state.filters, ...newFilters });
  };

  // Función para refrescar datos
  const refreshData = () => {
    loadDashboardData(state.filters);
  };

  // Función para limpiar errores
  const clearError = () => {
    dispatch({ type: DASHBOARD_ACTIONS.CLEAR_ERROR });
  };

  // Configurar suscripción en tiempo real
  useEffect(() => {
    if (!state.isRealTimeEnabled) return;

    const subscription = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'respuestas_cuestionario'
      }, (payload) => {
        console.log('Cambio detectado en respuestas:', payload);
        // Debounce para evitar actualizaciones muy frecuentes
        setTimeout(() => {
          refreshData();
        }, 1000);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'usuarios'
      }, (payload) => {
        console.log('Cambio detectado en usuarios:', payload);
        setTimeout(() => {
          refreshData();
        }, 1000);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [state.filters, state.isRealTimeEnabled]);

  // Cargar datos iniciales
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Valores del contexto
  const contextValue = {
    ...state,
    loadDashboardData,
    updateFilters,
    refreshData,
    clearError
  };

  return (
    <DashboardContext.Provider value={contextValue}>
      <DashboardDispatchContext.Provider value={dispatch}>
        {children}
      </DashboardDispatchContext.Provider>
    </DashboardContext.Provider>
  );
};

// Hooks personalizados para usar el contexto
export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard debe ser usado dentro de DashboardProvider');
  }
  return context;
};

export const useDashboardDispatch = () => {
  const context = useContext(DashboardDispatchContext);
  if (!context) {
    throw new Error('useDashboardDispatch debe ser usado dentro de DashboardProvider');
  }
  return context;
};

export { DASHBOARD_ACTIONS };