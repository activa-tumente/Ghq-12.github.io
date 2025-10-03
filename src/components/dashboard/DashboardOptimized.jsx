import React, { memo, Suspense, lazy } from 'react';
import { ErrorBoundary } from '../ErrorBoundary';
import { useDashboardData } from '../../hooks/useDashboardData';
import { usePerformanceMonitor } from '../../utils/performanceMonitor';
import LoadingSpinner from '../ui/LoadingSpinner';

// Lazy loading de componentes para mejor performance
const AdvancedFilters = lazy(() => import('./AdvancedFilters'));
const MetricsGrid = lazy(() => import('./MetricsGrid'));
const SafetyBehaviorIndex = lazy(() => import('./SafetyBehaviorIndex'));
const VulnerabilityIndex = lazy(() => import('./VulnerabilityIndex'));
const RiskMatrixHeatmap = lazy(() => import('./components/RiskMatrixHeatmap'));
const CorrelationAnalysis = lazy(() => import('./components/CorrelationAnalysis/CorrelationAnalysisRefactored'));
const TimeTrendsChart = lazy(() => import('./components/TimeTrendsChart'));

/**
 * Dashboard Optimizado
 * Implementa lazy loading, error boundaries, performance monitoring
 */
const DashboardOptimized = memo(() => {
  const { measureRender } = usePerformanceMonitor();
  
  return measureRender('DashboardOptimized', () => {
    const {
      data,
      loading,
      error,
      filters,
      handleFilterChange,
      handleRefresh
    } = useDashboardData();

    // Componente de error personalizado
    const ErrorFallback = ({ error, resetError }) => (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Error en el Dashboard
          </h2>
          <p className="text-gray-600 mb-4">
            {error?.message || 'Ha ocurrido un error inesperado'}
          </p>
          <button
            onClick={resetError}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );

    // Componente de loading optimizado
    const LoadingFallback = () => (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );

    // Componente de loading para lazy components
    const LazyLoadingFallback = ({ children }) => (
      <Suspense fallback={
        <div className="flex items-center justify-center p-8">
          <LoadingSpinner size="medium" />
        </div>
      }>
        {children}
      </Suspense>
    );

    if (loading) {
      return <LoadingFallback />;
    }

    if (error) {
      return <ErrorFallback error={error} resetError={handleRefresh} />;
    }

    return (
      <ErrorBoundary fallback={ErrorFallback}>
        <div className="min-h-screen bg-gray-50">
          {/* Header optimizado */}
          <DashboardHeader onRefresh={handleRefresh} />

          {/* Contenido principal */}
          <main className="container mx-auto px-4 py-6 space-y-6">
            
            {/* Filtros con lazy loading */}
            <LazyLoadingFallback>
              <AdvancedFilters
                filters={filters}
                onFilterChange={handleFilterChange}
              />
            </LazyLoadingFallback>

            {/* Grid de métricas */}
            <LazyLoadingFallback>
              <MetricsGrid data={data} />
            </LazyLoadingFallback>

            {/* Componentes principales en grid responsivo */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Índice de Comportamiento Seguro */}
              <LazyLoadingFallback>
                <SafetyBehaviorIndex data={data} />
              </LazyLoadingFallback>

              {/* Índice de Vulnerabilidad */}
              <LazyLoadingFallback>
                <VulnerabilityIndex data={data} />
              </LazyLoadingFallback>

            </div>

            {/* Matriz de riesgo real */}
            <LazyLoadingFallback>
              <RiskMatrixHeatmap filters={filters} />
            </LazyLoadingFallback>

            {/* Análisis de correlación */}
            <LazyLoadingFallback>
              <CorrelationAnalysis data={data} />
            </LazyLoadingFallback>

            {/* Tendencia Temporal del Riesgo Psicosocial */}
            <LazyLoadingFallback>
              <TimeTrendsChart filters={filters} />
            </LazyLoadingFallback>

            {/* Resumen de datos optimizado */}
            <DataSummaryOptimized data={data} />

          </main>
        </div>
      </ErrorBoundary>
    );
  });
});

/**
 * Header del dashboard optimizado
 */
const DashboardHeader = memo(({ onRefresh }) => (
  <header className="bg-white shadow-sm border-b border-gray-200">
    <div className="container mx-auto px-4 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Dashboard BAT-7
          </h1>
          <p className="text-gray-600 mt-1">
            Análisis de Comportamiento Seguro
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Indicador de estado */}
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">En tiempo real</span>
          </div>
          
          {/* Botón de actualización */}
          <button
            onClick={onRefresh}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
            aria-label="Actualizar dashboard"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Actualizar</span>
          </button>
        </div>
      </div>
    </div>
  </header>
));

/**
 * Resumen de datos optimizado
 */
const DataSummaryOptimized = memo(({ data }) => {
  const { measureRender } = usePerformanceMonitor();
  
  return measureRender('DataSummaryOptimized', () => {
    if (!data?.summary) return null;

    const { summary, metrics } = data;
    
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Resumen de Datos
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard
            title="Total Evaluaciones"
            value={summary.totalEvaluations || 0}
            icon="📊"
          />
          
          <SummaryCard
            title="Usuarios Registrados"
            value={summary.totalUsers || 0}
            icon="👥"
          />
          
          <SummaryCard
            title="Tasa Participación"
            value={`${metrics?.participationRate?.toFixed(1) || 0}%`}
            icon="📈"
          />
          
          <SummaryCard
            title="Última Actualización"
            value={summary.lastUpdate ? 
              new Date(summary.lastUpdate).toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
              }) : 'N/A'
            }
            icon="🕒"
          />
        </div>

        {/* Información de performance */}
        {summary.queryTime && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Tiempo de consulta: {summary.queryTime}
            </p>
          </div>
        )}
      </div>
    );
  });
});

/**
 * Tarjeta de resumen reutilizable
 */
const SummaryCard = memo(({ title, value, icon }) => (
  <div className="text-center p-3 bg-gray-50 rounded-lg">
    <div className="text-2xl mb-1">{icon}</div>
    <div className="text-2xl font-bold text-gray-900">{value}</div>
    <div className="text-sm text-gray-600">{title}</div>
  </div>
));

// Asignar displayName para debugging
DashboardOptimized.displayName = 'DashboardOptimized';
DashboardHeader.displayName = 'DashboardHeader';
DataSummaryOptimized.displayName = 'DataSummaryOptimized';
SummaryCard.displayName = 'SummaryCard';

export default DashboardOptimized;