import React, { useState, memo } from 'react';
import { AlertTriangle, TrendingUp, Users, Shield, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { useRiskHeatmapData } from '../hooks/useRiskHeatmapData';
import { getRiskLevel, getRiskColor, getRiskIcon } from '../../../utils/riskLevelUtils';

/**
 * RiskHeatmap Mejorado que consume datos pre-procesados por el hook useRiskHeatmapData.
 */
const RiskHeatmapEnhanced = memo(({ filters }) => {
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const { heatmapData, criticalPoints, loading, error, isEmpty } = useRiskHeatmapData(filters);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6" role="status" aria-live="polite">
        <div className="flex items-center justify-center h-64">
          <div 
            className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
            aria-hidden="true"
          ></div>
          <span className="ml-3 text-gray-600">Cargando mapa de riesgo...</span>
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
          <p className="text-red-600 mt-2">No se pudo obtener la información para el mapa de riesgo.</p>
          <p className="text-xs text-gray-500 mt-4">{error.message}</p>
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Mapa de Riesgo por Departamento
        </h3>
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No hay datos suficientes para generar el mapa de riesgo con los filtros seleccionados.</p>
        </div>
      </div>
    );
  }

  const { departments, averageRisk, departmentDetails } = heatmapData;

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Mapa de Riesgo por Departamento
        </h3>
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

      {/* Leyenda mejorada */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Niveles de Riesgo</h4>
        <div className="flex flex-wrap gap-4">
          {[
            { range: '80-100%', level: 'Muy Alto', color: 'bg-red-600', textColor: 'text-white' },
            { range: '60-79%', level: 'Alto', color: 'bg-orange-500', textColor: 'text-white' },
            { range: '40-59%', level: 'Moderado', color: 'bg-yellow-400', textColor: 'text-gray-900' },
            { range: '20-39%', level: 'Bajo', color: 'bg-green-400', textColor: 'text-gray-900' },
            { range: '0-19%', level: 'Muy Bajo', color: 'bg-green-200', textColor: 'text-gray-900' }
          ].map((item) => (
            <div key={item.level} className="flex items-center">
              <div className={`w-4 h-4 rounded ${item.color} mr-2`} aria-hidden="true"></div>
              <span className="text-sm text-gray-600">
                {item.level}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Grid de departamentos mejorado */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
        {departments.map((department) => {
          const risk = averageRisk[department] * 100; // El hook devuelve un valor normalizado
          const details = departmentDetails[department];
          const isSelected = selectedDepartment === department;
          
          return (
            <div
              key={department}
              className={`
                relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 transform hover:scale-105
                ${getRiskColor(risk)}
                ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
              `}
              onClick={() => setSelectedDepartment(isSelected ? null : department)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedDepartment(isSelected ? null : department);
                }
              }}
              tabIndex={0}
              role="button"
              aria-pressed={isSelected}
              aria-label={`${department}: ${getRiskLevel(risk)} riesgo, ${risk.toFixed(1)}%`}
              data-testid="department-card"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm truncate">{department}</h4>
                {getRiskIcon(risk)}
              </div>
              
              <div className="space-y-1">
                <div className="text-xs opacity-90">
                  Riesgo: {risk.toFixed(1)}%
                </div>
                <div className="text-xs opacity-90">
                  {getRiskLevel(risk)}
                </div>
                {showDetails && (
                  <div className="text-xs opacity-75 mt-2 space-y-1">
                    <div>Usuarios: {details.uniqueUsers}</div>
                    <div>Evaluaciones: {details.totalResponses}</div>
                  </div>
                )}
              </div>
              
              {/* Indicador de selección */}
              {isSelected && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
              )}
            </div>
          );
        })}
      </div>

      {/* Panel de detalles del departamento seleccionado */}
      {selectedDepartment && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-3">
            Detalles de {selectedDepartment}
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-blue-700 font-medium">Riesgo Promedio:</span>
              <div className="text-blue-900">{(averageRisk[selectedDepartment] * 100).toFixed(1)}%</div>
            </div>
            <div>
              <span className="text-blue-700 font-medium">Usuarios:</span>
              <div className="text-blue-900">{departmentDetails[selectedDepartment].uniqueUsers}</div>
            </div>
            <div>
              <span className="text-blue-700 font-medium">Evaluaciones:</span>
              <div className="text-blue-900">{departmentDetails[selectedDepartment].totalResponses}</div>
            </div>
            <div>
              <span className="text-blue-700 font-medium">Nivel:</span>
              <div className="text-blue-900">{getRiskLevel(averageRisk[selectedDepartment] * 100)}</div>
            </div>
          </div>
          
          {/* Distribución de riesgo */}
          <div className="mt-3">
            <span className="text-blue-700 font-medium text-sm">Distribución de Riesgo:</span>
            <div className="flex gap-2 mt-1">
              {Object.entries(departmentDetails[selectedDepartment].rawDistribution).map(([level, count]) => (
                <div key={level} className="text-xs">
                  <span className="capitalize">{level}:</span> {count}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Puntos Críticos ahora vienen del hook */}
      {criticalPoints.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg" data-testid="critical-departments">
          <h4 className="font-medium text-red-800 mb-3 flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Puntos Críticos
          </h4>
          <div className="space-y-2">
            {criticalPoints.map((point) => (
              <div key={point.department_name} className="flex justify-between items-center text-sm">
                <span className="text-red-700 font-medium">{point.department_name}</span>
                <span className="text-red-600">{(point.average_risk * 100).toFixed(1)}% - {point.risk_level}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estadísticas y acciones recomendadas permanecen igual... */}
    </div>
  );
});

RiskHeatmapEnhanced.displayName = 'RiskHeatmapEnhanced';

export default RiskHeatmapEnhanced;