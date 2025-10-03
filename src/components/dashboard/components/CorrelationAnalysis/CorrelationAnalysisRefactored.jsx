/**
 * CorrelationAnalysisRefactored - Componente principal refactorizado para análisis de correlaciones
 * 
 * Mejoras implementadas:
 * - Separación de responsabilidades en componentes granulares
 * - Custom hook para lógica de datos
 * - Sistema de estilos centralizado
 * - Accesibilidad mejorada (WCAG 2.1)
 * - Performance optimizada con memoización
 * - Manejo de estados de carga y error
 * - Configuración flexible
 * 
 * @author Sistema de Evaluación Psicológica BAT-7
 * @version 2.0.0
 */

import React, { useState, useCallback, useMemo, memo } from 'react';
import PropTypes from 'prop-types';
import { BsBarChart } from 'react-icons/bs';
import { CHART_COLORS, getColorWithOpacity } from '../../../../utils/chartColors';

// Hooks personalizados
import { useCorrelationData } from '../../../../hooks/useCorrelationData';
import { useCorrelationDataFixed } from '../../../../hooks/useCorrelationDataFixed';

// Componentes granulares
import CorrelationCard from './CorrelationCard';
import InterpretationGuide from './InterpretationGuide';
import InsightsPanel from './InsightsPanel';
import StatsSummary from './StatsSummary';

// Componente de gráficos
import ScatterPlotAnalysis from '../../../correlation/ScatterPlotAnalysis';

// Constantes y configuración
import { 
  CORRELATION_CONFIGS, 
  ANIMATION_CONFIG,
  ACCESSIBILITY_CONFIG 
} from './constants.jsx';

/**
 * Componente de estado de carga
 */
const LoadingState = memo(() => (
  <div 
    className="bg-white rounded-lg shadow-sm border p-6 animate-pulse"
    role="status"
    aria-label="Cargando análisis de correlaciones"
  >
    <div className="h-4 bg-gray-200 rounded w-1/3 mb-6"></div>
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="p-4 border rounded-lg">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
        </div>
      ))}
    </div>
    <span className="sr-only">Cargando datos de correlación...</span>
  </div>
));

/**
 * Componente de estado vacío
 */
const EmptyState = memo(({ onRefresh }) => (
  <div className="bg-white rounded-lg shadow-sm border p-8">
    <div className="text-center">
      <BsBarChart className="text-gray-400 mb-4" size={64} />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        No hay datos de correlación disponibles
      </h3>
      <p className="text-gray-600 mb-4">
        No se encontraron respuestas suficientes para calcular correlaciones estadísticas.
      </p>
      {onRefresh && (
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          onClick={onRefresh}
        >
          Actualizar datos
        </button>
      )}
    </div>
  </div>
));

/**
 * Header del componente con controles
 */
const CorrelationHeader = memo(({ 
  totalCorrelations, 
  onRefresh, 
  isRefreshing,
  viewMode,
  onViewModeChange 
}) => (
  <div className="flex items-center justify-between mb-6">
    <div className="flex items-center space-x-3">
      <div className="p-2 rounded-lg" style={{ backgroundColor: getColorWithOpacity(CHART_COLORS.metrics.secondary, 0.1) }}>
        <BsBarChart className="text-xl" style={{ color: CHART_COLORS.metrics.secondary }} />
      </div>
      <div>
        <h3 className="text-xl font-bold text-gray-900">
          Análisis de Correlaciones
        </h3>
        <p className="text-sm text-gray-600">Análisis estadístico de relaciones entre variables</p>
      </div>
      {totalCorrelations > 0 && (
        <span className="bg-purple-100 text-purple-800 text-xs px-3 py-1 rounded-full font-medium border border-purple-200">
          {totalCorrelations} correlaciones
        </span>
      )}
    </div>

    <div className="flex items-center space-x-3">
      {/* Selector de vista */}
      <div className="flex bg-gray-100 rounded-lg p-1">
        <button
          className={`px-3 py-1 text-xs rounded transition-colors ${
            viewMode === 'grid' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => onViewModeChange('grid')}
          aria-pressed={viewMode === 'grid'}
        >
          Cuadrícula
        </button>
        <button
          className={`px-3 py-1 text-xs rounded transition-colors ${
            viewMode === 'list' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => onViewModeChange('list')}
          aria-pressed={viewMode === 'list'}
        >
          Lista
        </button>
      </div>

      {/* Botón de actualizar */}
      {onRefresh && (
        <button
          className="p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded transition-colors"
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label="Actualizar análisis de correlaciones"
        >
          <span className={`text-lg ${isRefreshing ? 'animate-spin' : ''}`}>
            🔄
          </span>
        </button>
      )}
    </div>
  </div>
));

/**
 * Grid de correlaciones
 */
const CorrelationGrid = memo(({ correlations, viewMode, onCorrelationClick }) => {
  const gridClasses = viewMode === 'grid' 
    ? 'grid grid-cols-1 md:grid-cols-2 gap-4'
    : 'space-y-4';

  return (
    <div 
      className={gridClasses}
      role="list"
      aria-label={`${correlations.length} correlaciones en vista de ${viewMode === 'grid' ? 'cuadrícula' : 'lista'}`}
    >
      {correlations.map((correlation, index) => (
        <div key={correlation.id} role="listitem">
          <CorrelationCard
            correlation={correlation}
            index={index}
            className={ANIMATION_CONFIG.staggerDelay}
            style={{ animationDelay: `${index * 100}ms` }}
            onCardClick={onCorrelationClick}
          />
        </div>
      ))}
    </div>
  );
});

/**
 * Componente principal CorrelationAnalysisRefactored
 */
const CorrelationAnalysisRefactored = ({
  data,
  loading = false,
  error = null,
  onRefresh = null,
  className = '',
  showInterpretationGuide = true,
  showInsights = true,
  showStatsSummary = true,
  maxInsights = 5,
  defaultViewMode = 'grid',
  filters = {},
  ...props
}) => {
  // Estados locales
  const [viewMode, setViewMode] = useState(defaultViewMode);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCorrelation, setSelectedCorrelation] = useState(null);

  // Hook personalizado para datos de correlación - usar hook corregido
  const {
    correlations,
    stats,
    distribution,
    insights,
    loading: dataLoading,
    error: dataError,
    refreshData
  } = useCorrelationDataFixed(filters);

  // Estado mejorado para manejar diferentes escenarios de datos
  const hasValidData = useMemo(() => {
    if (!correlations || correlations.length === 0) return false;
    
    // Verificar si al menos una correlación tiene datos válidos
    return correlations.some(corr => 
      corr.dataStatus === 'valid' && corr.sampleSize >= 2
    );
  }, [correlations]);

  const hasInsufficientData = useMemo(() => {
    if (!correlations || correlations.length === 0) return true;
    
    // Verificar si todas las correlaciones tienen datos insuficientes
    return correlations.every(corr => 
      corr.dataStatus === 'insufficient_data' || corr.sampleSize < 2
    );
  }, [correlations]);

  const hasCalculationErrors = useMemo(() => {
    if (!correlations || correlations.length === 0) return false;
    
    // Verificar si hay errores de cálculo
    return correlations.some(corr => 
      corr.dataStatus === 'calculation_error'
    );
  }, [correlations]);

  // Handlers
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error refreshing correlation data:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshData, onRefresh]);

  // Manejar clic en tarjeta de correlación para mostrar gráfico
  const handleCorrelationClick = useCallback((correlation) => {
    setSelectedCorrelation(correlation);
  }, []);

  // Cerrar gráfico
  const handleCloseChart = useCallback(() => {
    setSelectedCorrelation(null);
  }, []);

  const handleViewModeChange = useCallback((mode) => {
    setViewMode(mode);
  }, []);

  // Estados de carga y error
  const isLoadingState = loading || dataLoading;
  const hasError = error || dataError;
  const isEmpty = !hasValidData && !isLoadingState && !hasError;

  // Renderizado condicional mejorado
  if (loading || dataLoading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border p-6 ${className}`}>
        <CorrelationHeader
          totalCorrelations={0}
          onRefresh={onRefresh || handleRefresh}
          isRefreshing={isRefreshing}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
        />
        <LoadingState />
      </div>
    );
  }

  if (error || dataError) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border p-6 ${className}`}>
        <CorrelationHeader
          totalCorrelations={0}
          onRefresh={onRefresh || handleRefresh}
          isRefreshing={isRefreshing}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
        />
        <div className="text-center">
          <span className="text-4xl mb-2 block" aria-hidden="true">⚠️</span>
          <h3 className="text-lg font-medium text-red-900 mb-2">
            Error al cargar correlaciones
          </h3>
          <p className="text-red-700 mb-4">
            {error?.message || dataError?.message || 'Ocurrió un error inesperado al procesar los datos.'}
          </p>
          {onRefresh && (
            <button
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
              onClick={handleRefresh}
            >
              Reintentar
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!correlations || correlations.length === 0 || hasInsufficientData) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border p-6 ${className}`}>
        <CorrelationHeader
          totalCorrelations={0}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
        />
        <EmptyState 
          onRefresh={handleRefresh}
          title="Datos insuficientes"
          message="No hay suficientes datos para realizar el análisis de correlación. Se necesitan al menos 2 respuestas completas."
        />
        {/* Placeholders de tarjetas para mantener el diseño aún sin datos */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4" aria-label="Correlaciones (placeholders)">
          {[{
            id: 'ph-1',
            title: 'GHQ-12 vs Satisfacción Laboral',
            description: 'Relación entre salud mental y satisfacción en el trabajo',
            correlation: 0,
            strength: 'Muy Débil',
            direction: 'Neutral',
            category: 'bienestar'
          }, {
            id: 'ph-2',
            title: 'GHQ-12 vs Motivación de Seguridad',
            description: 'Relación entre salud mental y motivación hacia la seguridad',
            correlation: 0,
            strength: 'Muy Débil',
            direction: 'Neutral',
            category: 'seguridad'
          }, {
            id: 'ph-3',
            title: 'Satisfacción vs Confianza en Gerencia',
            description: 'Relación entre satisfacción y confianza en la gerencia',
            correlation: 0,
            strength: 'Muy Débil',
            direction: 'Neutral',
            category: 'clima'
          }].map((placeholder) => (
            <CorrelationCard key={placeholder.id} correlation={placeholder} onCardClick={null} />
          ))}
        </div>
      </div>
    );
  }

  if (hasCalculationErrors) {
    return (
      <EmptyState 
        onRefresh={handleRefresh}
        title="Error en cálculos"
        message="Se produjeron errores al calcular las correlaciones. Por favor, verifique la calidad de los datos."
      />
    );
  }

  if (!hasValidData) {
    return (
      <EmptyState 
        onRefresh={handleRefresh}
        title="Datos no válidos"
        message="Los datos disponibles no son válidos para el análisis de correlación."
      />
    );
  }

  return (
    <div 
      className={`bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow duration-300 ${className}`}
      role="region"
      aria-labelledby="correlation-analysis-title"
      {...props}
    >
      {/* Header */}
      <CorrelationHeader
        totalCorrelations={correlations.length}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
      />

      {/* Guía de interpretación */}
      {showInterpretationGuide && (
        <div className="mb-6">
          <InterpretationGuide
            isCollapsible={true}
            defaultExpanded={false}
            showExamples={true}
          />
        </div>
      )}

      {/* Resumen estadístico */}
      {showStatsSummary && Object.keys(stats).length > 0 && (
        <div className="mb-6">
          <StatsSummary
            stats={stats}
            distribution={distribution}
            showDistribution={true}
            layout="grid"
          />
        </div>
      )}

      {/* Grid de correlaciones */}
      <div className="mb-6">
        <CorrelationGrid
          correlations={correlations}
          viewMode={viewMode}
          onCorrelationClick={handleCorrelationClick}
        />
      </div>

      {/* Panel de insights */}
      {showInsights && (
        <div className="mt-6">
          <InsightsPanel
            insights={insights}
            maxInsights={maxInsights}
            showFilters={true}
            defaultExpanded={false}
          />
        </div>
      )}

      {/* Modal para gráfico de dispersión */}
      {selectedCorrelation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Gráfico de Dispersión - {selectedCorrelation.title}
              </h3>
              <button
                onClick={handleCloseChart}
                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-1"
                aria-label="Cerrar gráfico"
              >
                <span className="text-xl">×</span>
              </button>
            </div>
            <div className="p-4 overflow-auto">
              <ScatterPlotAnalysis
                correlationData={selectedCorrelation}
                height={400}
                showStatistics={true}
              />
            </div>
            <div className="p-4 border-t bg-gray-50">
              <p className="text-sm text-gray-600">
                {selectedCorrelation.description}
              </p>
              <div className="mt-2 flex justify-end">
                <button
                  onClick={handleCloseChart}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Información de accesibilidad */}
      <div className="sr-only">
        <h2 id="correlation-analysis-title">Análisis de Correlaciones</h2>
        <p>
          Esta sección presenta el análisis de correlaciones entre diferentes variables 
          del cuestionario de seguridad. Se muestran {correlations.length} correlaciones 
          calculadas usando el coeficiente de Pearson.
        </p>
        {showInterpretationGuide && (
          <p>
            Incluye una guía de interpretación para entender los valores de correlación 
            y su significado estadístico.
          </p>
        )}
        {showInsights && (
          <p>
            También se proporcionan insights automáticos y recomendaciones basadas 
            en los patrones encontrados en los datos.
          </p>
        )}
      </div>
    </div>
  );
};

// PropTypes para validación de tipos
CorrelationAnalysisRefactored.propTypes = {
  /** Datos de respuestas para calcular correlaciones */
  data: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.array
  ]),
  /** Estado de carga */
  loading: PropTypes.bool,
  /** Error en la carga de datos */
  error: PropTypes.object,
  /** Función para actualizar datos */
  onRefresh: PropTypes.func,
  /** Clases CSS adicionales */
  className: PropTypes.string,
  /** Mostrar guía de interpretación */
  showInterpretationGuide: PropTypes.bool,
  /** Mostrar panel de insights */
  showInsights: PropTypes.bool,
  /** Mostrar resumen estadístico */
  showStatsSummary: PropTypes.bool,
  /** Número máximo de insights a mostrar */
  maxInsights: PropTypes.number,
  /** Modo de vista por defecto */
  defaultViewMode: PropTypes.oneOf(['grid', 'list']),
  /** Filtros activos del dashboard */
  filters: PropTypes.object
};

// PropTypes para componentes internos
LoadingState.displayName = 'LoadingState';
EmptyState.displayName = 'EmptyState';
CorrelationHeader.displayName = 'CorrelationHeader';
CorrelationGrid.displayName = 'CorrelationGrid';

EmptyState.propTypes = {
  onRefresh: PropTypes.func
};

CorrelationHeader.propTypes = {
  totalCorrelations: PropTypes.number.isRequired,
  onRefresh: PropTypes.func,
  isRefreshing: PropTypes.bool.isRequired,
  viewMode: PropTypes.oneOf(['grid', 'list']).isRequired,
  onViewModeChange: PropTypes.func.isRequired
};

CorrelationGrid.propTypes = {
  correlations: PropTypes.array.isRequired,
  viewMode: PropTypes.oneOf(['grid', 'list']).isRequired
};

// Exportación con memo para optimización de performance
export default memo(CorrelationAnalysisRefactored);