import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { supabase } from '../api/supabase';
import { MetricsService } from '../services/MetricsService';
import { debounce } from '../utils/dataProcessing';

// Action types
const METRICS_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_METRICS: 'SET_METRICS',
  SET_REAL_TIME_STATUS: 'SET_REAL_TIME_STATUS',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Initial state
const initialState = {
  metrics: {
    home: null,
    dashboard: null,
    questionnaires: null,
    responses: null,
    users: null
  },
  loading: {
    home: false,
    dashboard: false,
    questionnaires: false,
    responses: false,
    users: false
  },
  errors: {
    home: null,
    dashboard: null,
    questionnaires: null,
    responses: null,
    users: null
  },
  lastUpdates: {
    home: null,
    dashboard: null,
    questionnaires: null,
    responses: null,
    users: null
  },
  isRealTime: false
};

// Reducer with immutable updates
const metricsReducer = (state, action) => {
  switch (action.type) {
    case METRICS_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.pageType]: action.loading
        }
      };
    
    case METRICS_ACTIONS.SET_ERROR:
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.pageType]: action.error
        },
        loading: {
          ...state.loading,
          [action.pageType]: false
        }
      };
    
    case METRICS_ACTIONS.SET_METRICS:
      return {
        ...state,
        metrics: {
          ...state.metrics,
          [action.pageType]: action.metrics
        },
        lastUpdates: {
          ...state.lastUpdates,
          [action.pageType]: new Date().toISOString()
        },
        errors: {
          ...state.errors,
          [action.pageType]: null
        },
        loading: {
          ...state.loading,
          [action.pageType]: false
        }
      };
    
    case METRICS_ACTIONS.SET_REAL_TIME_STATUS:
      return {
        ...state,
        isRealTime: action.isRealTime
      };
    
    case METRICS_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.pageType]: null
        }
      };
    
    default:
      return state;
  }
};

const MetricsContext = createContext();

export const MetricsProvider = ({ children }) => {
  const [state, dispatch] = useReducer(metricsReducer, initialState);
  
  // Memoized actions to prevent unnecessary re-renders
  const actions = React.useMemo(() => ({
    setLoading: (pageType, loading) => 
      dispatch({ type: METRICS_ACTIONS.SET_LOADING, pageType, loading }),
    
    setError: (pageType, error) => 
      dispatch({ type: METRICS_ACTIONS.SET_ERROR, pageType, error }),
    
    setMetrics: (pageType, metrics) => 
      dispatch({ type: METRICS_ACTIONS.SET_METRICS, pageType, metrics }),
    
    setRealTimeStatus: (isRealTime) => 
      dispatch({ type: METRICS_ACTIONS.SET_REAL_TIME_STATUS, isRealTime }),
    
    clearError: (pageType) => 
      dispatch({ type: METRICS_ACTIONS.CLEAR_ERROR, pageType })
  }), []);

  return (
    <MetricsContext.Provider value={{ state, actions }}>
      {children}
    </MetricsContext.Provider>
  );
};

export const useMetricsContext = () => {
  const context = useContext(MetricsContext);
  if (!context) {
    throw new Error('useMetricsContext must be used within a MetricsProvider');
  }
  return context;
};