import React, { useState, useEffect, useRef } from 'react';
import DashboardService from '../../services/DashboardService';
import { CardSkeleton, DashboardSkeleton } from '../ui/SkeletonLoader';
import MetricsGrid from './components/MetricsGrid';
// import DepartmentAnalysis from './components/DepartmentAnalysis';
// import RiskDistribution from './components/RiskDistribution';
// import TimeTrends from './components/TimeTrends';
// import FiltersPanel from './components/FiltersPanel';
import SafetyBehaviorIndex from './components/SafetyBehaviorIndex';
import VulnerabilityIndex from './components/VulnerabilityIndex';
import CorrelationAnalysis from './components/CorrelationAnalysis/CorrelationAnalysisRefactored';
import RiskHeatmap from './components/RiskHeatmap';
import TimeTrendsChart from './components/TimeTrendsChart';
import RiskDistributionByRole from './components/RiskDistributionByRole';
// import DemographicAnalysis from './components/DemographicAnalysis';
import AdvancedFilters from './components/AdvancedFilters';
import { useToast } from '../../hooks/useToast';
import { supabase } from '../../api/supabase';
import AtRiskEmployees from './components/AtRiskEmployees';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  const { error: showError } = useToast();
  const subscriptionRef = useRef(null);

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

  const setupRealTimeSubscription = () => {
    // Cleanup existing subscription
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    // Subscribe to changes in respuestas_cuestionario table
    subscriptionRef.current = supabase
      .channel('dashboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'respuestas_cuestionario'
        },
        (payload) => {
          console.log('Nueva respuesta detectada:', payload);
          // Debounce updates to avoid too frequent refreshes
          setTimeout(() => {
            loadDashboardData();
            setLastUpdate(new Date());
          }, 1000);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'usuarios'
        },
        (payload) => {
          console.log('Cambio en usuarios detectado:', payload);
          setTimeout(() => {
            loadDashboardData();
            setLastUpdate(new Date());
          }, 1000);
        }
      )
      .subscribe();
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await DashboardService.getDashboardData(filters);
      
      if (result.success) {
        console.log('Dashboard data received:', {
          keys: Object.keys(result.data),
          responsesData: result.data.responsesData,
          hasResponses: !!result.data.responses
        });
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

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleRefresh = () => {
    loadDashboardData();
  };

  if (loading && !dashboardData) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Error al cargar el dashboard
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Header mejorado */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg">
              <span className="text-2xl text-white">📊</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Dashboard GHQ-12
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                Análisis integral de evaluaciones psicológicas
              </p>
              <div className="flex items-center gap-4 mt-3">
                <span className="inline-flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Tiempo real activo
                </span>
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  Última actualización: {lastUpdate.toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            disabled={loading}
          >
            <span className={`text-lg ${loading ? 'animate-spin' : ''}`}>🔄</span>
            {loading ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-8 space-y-6">
        {/* <FiltersPanel 
          filters={filters}
          onFiltersChange={handleFiltersChange}
          loading={loading}
        /> */}
        
        {/* Advanced Filters */}
        <AdvancedFilters 
          filters={filters}
          onFiltersChange={handleFiltersChange}
          loading={loading}
        />
      </div>

      {/* Metrics Grid */}
      <div className="mb-8">
        <MetricsGrid 
          data={dashboardData?.metrics}
          loading={loading}
        />
      </div>

      {/* Charts Grid - Nivel 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* <DepartmentAnalysis 
          data={dashboardData?.byDepartment}
          loading={loading}
        /> */}
        {/* <RiskDistribution 
          data={dashboardData?.riskDistribution}
          loading={loading}
        /> */}
      </div>

      {/* Charts Grid - Nivel 2 - Índices principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        <div className="transform hover:scale-105 transition-transform duration-300">
          <SafetyBehaviorIndex 
            data={dashboardData}
            loading={loading}
          />
        </div>
        <div className="transform hover:scale-105 transition-transform duration-300">
          <VulnerabilityIndex 
            data={dashboardData}
            loading={loading}
          />
        </div>
      </div>

      {/* Risk Heatmap - Destacado */}
      <div className="mb-10">
        <div className="transform hover:scale-102 transition-transform duration-300">
          <RiskHeatmap
            data={dashboardData}
            loading={loading}
          />
        </div>
      </div>

      {/* Gráficos de análisis - Grid de 2 columnas */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-10">
        {/* Risk Distribution by Role */}
        <div className="transform hover:scale-102 transition-transform duration-300">
          {loading ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Distribución de Riesgo por Cargo</h3>
              </div>
              <CardSkeleton />
            </div>
        ) : (
          <RiskDistributionByRole
            filters={filters}
            title="Distribución de Riesgo por Cargo"
          />
        )}
        </div>

        {/* Time Trends Chart */}
        <div className="transform hover:scale-102 transition-transform duration-300">
          {loading ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Tendencia Temporal del Riesgo</h3>
              </div>
              <CardSkeleton />
            </div>
          ) : (
            <TimeTrendsChart
              filters={filters}
              title="Tendencia Temporal del Riesgo Psicosocial"
            />
          )}
        </div>
      </div>

      {/* Correlation Analysis */}
      <div className="mb-8">
        <div className="transform hover:scale-102 transition-transform duration-300">
          <CorrelationAnalysis
            data={dashboardData}
            loading={loading}
            filters={filters}
            title="Análisis de Correlaciones"
          />
        </div>
      </div>

      {/* At-Risk Employees by Level */}
      <div className="mb-10">
        <div className="transform hover:scale-102 transition-transform duration-300">
          <AtRiskEmployees filters={filters} />
        </div>
      </div>

      {/* <DemographicAnalysis 
          data={dashboardData?.demographics}
          loading={loading}
        /> */}

      {/* Data Summary */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Resumen de Datos
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Total evaluaciones: </span>
            <span className="font-semibold">
              {dashboardData?.summary?.totalEvaluations || 0}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Última actualización: </span>
            <span className="font-semibold">
              {dashboardData?.summary?.lastUpdate || 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Riesgo alto: </span>
            <span className="font-semibold text-red-600">
              {dashboardData?.summary?.highRiskPercentage || 0}%
            </span>
          </div>
          <div>
            <span className="text-gray-600">Promedio GHQ-12: </span>
            <span className="font-semibold">
              {dashboardData?.summary?.averageScore || 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;