import React, { useState, memo, useMemo, useCallback } from 'react';
import { AlertTriangle, Info, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { useRiskHeatmapData } from '../hooks/useRiskHeatmapData';
import MatrixHeader from './RiskMatrix/MatrixHeader';
import MatrixCell from './RiskMatrix/MatrixCell';
import ConcentrationLegend from './RiskMatrix/ConcentrationLegend';
import DetailPanel from './RiskMatrix/DetailPanel';
import { RiskMatrixHeatmapPropTypes, RiskMatrixHeatmapDefaultProps } from './RiskMatrix/PropTypes';
import { 
  RISK_LEVELS, 
  RISK_WEIGHTS, 
  CONCENTRATION_COLORS,
  CONCENTRATION_THRESHOLDS 
} from '../../../constants/riskMatrix';

/**
 * Matriz de Riesgo Real - Heatmap que muestra departamentos vs niveles de riesgo
 * Implementa una verdadera matriz donde cada celda representa el porcentaje de usuarios
 * de un departamento en un nivel de riesgo específico.
 */
const RiskMatrixHeatmap = memo(({ filters }) => {
  const [selectedCell, setSelectedCell] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showCalculationInfo, setShowCalculationInfo] = useState(false);

  const { heatmapData, criticalPoints, loading, error, isEmpty } = useRiskHeatmapData(filters);

  // Niveles de riesgo en orden
  const riskLevels = RISK_LEVELS;

  // Procesar datos para la matriz
  const matrixData = useMemo(() => {
    if (!heatmapData || isEmpty) return { departments: [], matrix: {} };

    // Los datos vienen del hook como heatmapData con estructura procesada
    // Necesitamos acceder a los datos raw de Supabase para obtener risk_distribution
    return heatmapData;
  }, [heatmapData, isEmpty]);

  // Función para obtener el color de la celda basado en el porcentaje
  const getCellColor = useCallback((percentage) => {
    if (percentage === 0) return CONCENTRATION_COLORS[0];
    if (percentage <= CONCENTRATION_THRESHOLDS.LOW) return CONCENTRATION_COLORS.low;
    if (percentage <= CONCENTRATION_THRESHOLDS.MODERATE) return CONCENTRATION_COLORS.moderate;
    if (percentage <= CONCENTRATION_THRESHOLDS.HIGH) return CONCENTRATION_COLORS.high;
    return CONCENTRATION_COLORS.veryHigh;
  }, []);

  // Función para obtener el color del nivel de riesgo
  const getRiskLevelColor = (level) => {
    const colors = {
      'Muy Bajo': 'bg-green-500',
      'Bajo': 'bg-yellow-500',
      'Moderado': 'bg-orange-500',
      'Alto': 'bg-red-500',
      'Muy Alto': 'bg-red-700'
    };
    return colors[level] || 'bg-gray-500';
  };

  // Calcular riesgo promedio del departamento
  const calculateDepartmentRisk = useCallback((riskDistribution) => {
    if (!riskDistribution) return 0;
    
    let totalWeighted = 0;
    let totalPercentage = 0;

    Object.entries(riskDistribution).forEach(([level, percentage]) => {
      const weight = RISK_WEIGHTS[level] || 0;
      totalWeighted += (percentage * weight);
      totalPercentage += percentage;
    });

    return totalPercentage > 0 ? (totalWeighted / totalPercentage) * 100 : 0;
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6" role="status" aria-live="polite">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" aria-hidden="true"></div>
          <span className="ml-3 text-gray-600">Cargando matriz de riesgo...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6" role="alert">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800">Error al cargar los datos</h3>
          <p className="text-red-600 mt-2">No se pudo obtener la información para la matriz de riesgo.</p>
          <p className="text-xs text-gray-500 mt-4">{error.message}</p>
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Matriz de Riesgo por Departamento
        </h3>
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No hay datos suficientes para generar la matriz de riesgo con los filtros seleccionados.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      {/* Header con controles */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-900">
            Matriz de Riesgo por Departamento
          </h3>
          <button
            onClick={() => setShowCalculationInfo(!showCalculationInfo)}
            className="flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Información sobre cálculos"
            title="Cómo se calculan los riesgos"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
          aria-expanded={showDetails}
        >
          <Info className="h-4 w-4 mr-1" />
          {showDetails ? 'Ocultar detalles' : 'Ver detalles'}
          {showDetails ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
        </button>
      </div>

      {/* Información sobre cálculos */}
      {showCalculationInfo && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">📊 Cómo se calculan los riesgos</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• <strong>Porcentaje por celda:</strong> % de usuarios del departamento en cada nivel de riesgo</p>
            <p>• <strong>Riesgo promedio:</strong> Promedio ponderado considerando la distribución completa</p>
            <p>• <strong>Clasificación:</strong> Basada en puntajes normalizados del cuestionario GHQ-12</p>
            <p>• <strong>Colores:</strong> Intensidad representa concentración de usuarios (azul más oscuro = mayor concentración)</p>
          </div>
        </div>
      )}

      {/* Leyenda de concentración */}
      <ConcentrationLegend />

      {/* Matriz de Riesgo */}
      <div className="overflow-x-auto mb-6">
        <div className="min-w-full">
          {/* Encabezados */}
          <MatrixHeader riskLevels={riskLevels} getRiskLevelColor={getRiskLevelColor} />

          {/* Filas de departamentos */}
          {matrixData.departments?.map((department) => {
            const departmentData = matrixData.departmentDetails?.[department];
            const riskDistribution = departmentData?.rawDistribution || {};
            const avgRisk = calculateDepartmentRisk(riskDistribution);

            return (
              <div key={department} className="grid grid-cols-8 gap-1 mb-1">
                {/* Nombre del departamento */}
                <div className="p-3 bg-gray-50 font-medium text-sm text-gray-900 rounded flex items-center">
                  <span className="truncate" title={department}>{department}</span>
                </div>

                {/* Celdas de niveles de riesgo */}
                {riskLevels.map((level) => {
                  const percentage = riskDistribution[level] || 0;
                  const isSelected = selectedCell?.department === department && selectedCell?.level === level;

                  return (
                    <MatrixCell
                      key={level}
                      department={department}
                      level={level}
                      percentage={percentage}
                      isSelected={isSelected}
                      onCellClick={handleCellClick}
                      getCellColor={getCellColor}
                    />
                  );
                })}

                {/* Riesgo promedio */}
                <div className="p-3 bg-gray-100 text-sm font-semibold text-gray-900 text-center rounded">
                  {avgRisk.toFixed(1)}%
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Panel de detalles de celda seleccionada */}
      <DetailPanel selectedCell={selectedCell} />

      {/* Puntos Críticos */}
      {criticalPoints.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="font-medium text-red-800 mb-3 flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Departamentos Críticos
          </h4>
          <div className="space-y-2">
            {criticalPoints.map((point) => (
              <div key={point.department_name} className="flex justify-between items-center text-sm">
                <span className="text-red-700 font-medium">{point.department_name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-red-600">{point.risk_percentage.toFixed(1)}%</span>
                  <span className={`px-2 py-1 rounded text-xs ${getRiskLevelColor(point.risk_level)}`}>
                    {point.risk_level}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estadísticas generales */}
      {showDetails && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {matrixData.departments?.length || 0}
            </div>
            <div className="text-sm text-gray-600">Departamentos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {Object.values(matrixData.departmentDetails || {})
                .reduce((sum, dept) => sum + (dept.uniqueUsers || 0), 0)}
            </div>
            <div className="text-sm text-gray-600">Usuarios Evaluados</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {criticalPoints.length}
            </div>
            <div className="text-sm text-gray-600">Puntos Críticos</div>
          </div>
        </div>
      )}
    </div>
  );
});

RiskMatrixHeatmap.displayName = 'RiskMatrixHeatmap';
RiskMatrixHeatmap.propTypes = RiskMatrixHeatmapPropTypes;
RiskMatrixHeatmap.defaultProps = RiskMatrixHeatmapDefaultProps;

export default RiskMatrixHeatmap;