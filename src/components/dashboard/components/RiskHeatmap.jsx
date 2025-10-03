import React, { useMemo, memo } from 'react';
import { 
  MdBusiness, 
  MdPeople, 
  MdBuild, 
  MdLocalShipping, 
  MdInventory, 
  MdLocalHospital, 
  MdSecurity, 
  MdFactory, 
  MdVerifiedUser,
  MdWarning 
} from 'react-icons/md';
import { BsArrowUp, BsArrowDown } from 'react-icons/bs';
import {
  getRiskColor,
  getBorderColor,
  getRiskLabel,
  calculateStatistics,
  generateRecommendations
} from '../../../utils/riskUtils';

// Mapeo de departamentos a iconos de react-icons
const departmentIcons = {
  'Administración': MdBusiness,
  'Recursos Humanos': MdPeople,
  'Mantenimiento': MdBuild,
  'Logística': MdLocalShipping,
  'Almacén': MdInventory,
  'Salud Ocupacional': MdLocalHospital,
  'Seguridad': MdSecurity,
  'Operaciones': MdFactory,
  'Producción': MdFactory,
  'Calidad': MdVerifiedUser,
  'default': MdBusiness
};

// Componente de barra de progreso
const ProgressBar = ({ value, max = 100, className = '' }) => (
  <div className={`h-2 bg-gray-200 rounded-full overflow-hidden ${className}`}>
    <div 
      className="h-full bg-blue-500 transition-all duration-300"
      style={{ width: `${(value / max) * 100}%` }}
    />
  </div>
);

const RiskHeatmap = memo(({ data, loading = false }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6 animate-pulse" role="status" aria-live="polite">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-6" aria-hidden="true"></div>
        <div className="grid grid-cols-5 gap-2 mb-4">
          {[...Array(25)].map((_, i) => (
            <div key={i} className="aspect-square bg-gray-200 rounded" aria-hidden="true"></div>
          ))}
        </div>
        <div className="h-4 bg-gray-200 rounded w-1/2" aria-hidden="true"></div>
        <span className="sr-only">Cargando mapa de riesgo...</span>
      </div>
    );
  }

  // Procesar datos para el heatmap - Optimizado con dependencias específicas
  const heatmapData = useMemo(() => {
    if (!data || loading) {
      return { departments: [], averageRisk: {}, isEmpty: true };
    }

    // Verificar si tenemos datos segmentados por departamento
    // Los datos vienen en data.segmented.byDepartment desde DashboardService
    const departmentData = data?.segmented?.byDepartment || {};
    
    console.log('RiskHeatmap: Rendering with', {
      hasData: !!data,
      hasSegmentedData: !!data.segmented,
      hasDepartmentData: !!data.segmented?.byDepartment,
      departmentKeys: Object.keys(departmentData),
      loading
    });
    
    if (Object.keys(departmentData).length === 0) {
      console.log('RiskHeatmap: No department data found');
      return {
        departments: [],
        averageRisk: {},
        isEmpty: true
      };
    }

    // Extraer datos de departamentos y sus riesgos promedio
    const averageRisk = {};
    
    Object.keys(departmentData).forEach(dept => {
      const deptData = departmentData[dept];
      if (deptData && deptData.averageRisk !== undefined) {
        averageRisk[dept] = deptData.averageRisk;
      }
    });

    return {
      departments: Object.keys(averageRisk).sort(),
      averageRisk,
      isEmpty: Object.keys(averageRisk).length === 0
    };
  }, [data?.segmented?.byDepartment, loading]);

  // Identificar departamentos críticos
  const criticalDepartments = useMemo(() => {
    if (heatmapData.isEmpty) return [];
    
    return heatmapData.departments
      .map(dept => ({
        name: dept,
        risk: heatmapData.averageRisk[dept],
        level: getRiskLabel(heatmapData.averageRisk[dept])
      }))
      .filter(dept => dept.risk >= 40)
      .sort((a, b) => b.risk - a.risk)
      .slice(0, 5);
  }, [heatmapData]);

  // Calcular estadísticas reales
  const statistics = useMemo(() => {
    return calculateStatistics(heatmapData.departments, heatmapData.averageRisk);
  }, [heatmapData]);

  // Generar recomendaciones basadas en datos reales
  const recommendations = useMemo(() => {
    return generateRecommendations(criticalDepartments, statistics);
  }, [criticalDepartments, statistics]);

  if (heatmapData.isEmpty) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Heatmap de Riesgo por Departamento
          </h3>
          <span className="text-2xl">🌡️</span>
        </div>
        <div className="text-center py-8 text-gray-500">
          <p>No hay datos disponibles para mostrar el heatmap</p>
          <p className="text-sm mt-2">Asegúrate de que existan respuestas con departamentos asignados</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      {/* Header con estadísticas principales */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-900">
            Mapa de Riesgo por Departamento
          </h3>
          <span className="text-2xl">🌡️</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-lg">
            <span className="font-medium text-blue-900">{statistics.averageRisk.toFixed(1)}%</span>
            <span className="text-blue-700">Promedio</span>
          </div>
          <div className="flex items-center gap-2 bg-orange-50 px-3 py-1 rounded-lg">
            <MdWarning className="w-4 h-4 text-orange-600" />
            <span className="font-medium text-orange-900">{statistics.criticalCount}</span>
            <span className="text-orange-700">Críticos</span>
          </div>
          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
            {data?.responses?.length || 0} respuestas
          </span>
        </div>
      </div>

      {/* Layout principal en dos columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna principal - Grid de departamentos */}
        <div className="lg:col-span-2">
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Departamentos por Nivel de Riesgo</h4>
            
            {/* Leyenda compacta */}
            <div className="flex items-center gap-3 text-xs mb-4 p-2 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-700">Niveles:</span>
              {[
                { level: 'Bajo', color: 'bg-green-400', range: '0-40%' },
                { level: 'Moderado', color: 'bg-yellow-400', range: '40-60%' },
                { level: 'Alto', color: 'bg-orange-400', range: '60-80%' },
                { level: 'Crítico', color: 'bg-red-500', range: '80-100%' }
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${item.color}`} />
                  <span className="text-gray-600">{item.level}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Grid optimizado de departamentos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {heatmapData.departments.map((dept) => {
              const riskValue = heatmapData.averageRisk[dept];
              const riskLevel = getRiskLabel(riskValue);
              const IconComponent = departmentIcons[dept] || departmentIcons.default;
              const isCritical = riskValue >= 60;
              
              return (
                <div 
                  key={dept} 
                  className={`p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
                    isCritical 
                      ? 'border-red-200 bg-red-50' 
                      : riskValue >= 40 
                        ? 'border-yellow-200 bg-yellow-50'
                        : 'border-green-200 bg-green-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <IconComponent className={`w-5 h-5 ${
                        isCritical ? 'text-red-600' : riskValue >= 40 ? 'text-yellow-600' : 'text-green-600'
                      }`} />
                      <span className="font-medium text-gray-900 text-sm">{dept}</span>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      isCritical 
                        ? 'bg-red-100 text-red-800' 
                        : riskValue >= 40 
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                    }`}>
                      {riskValue.toFixed(1)}%
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <ProgressBar 
                      value={riskValue} 
                      className="h-2"
                    />
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>{riskLevel}</span>
                      <span className="font-medium flex items-center">{riskValue > statistics.averageRisk ? <BsArrowUp className="mr-1" /> : <BsArrowDown className="mr-1" />} Promedio</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Columna lateral - Análisis y recomendaciones */}
        <div className="space-y-4">
          
          {/* Top 3 departamentos críticos */}
          {criticalDepartments.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <MdWarning className="w-4 h-4 text-red-600" />
                <h4 className="text-sm font-medium text-red-900">Atención Prioritaria</h4>
              </div>
              <div className="space-y-2">
                {criticalDepartments.slice(0, 3).map((dept, index) => {
                  const IconComponent = departmentIcons[dept.name] || departmentIcons.default;
                  return (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        <IconComponent className="w-4 h-4 text-red-600" />
                        <span className="font-medium text-red-900">{dept.name}</span>
                      </div>
                      <span className="font-bold text-red-700">{dept.risk.toFixed(1)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recomendaciones principales */}
          {recommendations.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-3">Acciones Recomendadas</h4>
              <ul className="text-xs text-blue-800 space-y-2">
                {recommendations.slice(0, 4).map((rec, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="w-4 h-4 bg-blue-200 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                      {index + 1}
                    </span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Estadísticas resumidas */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Resumen Estadístico</h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Departamentos evaluados</span>
                <span className="font-semibold text-gray-900">{heatmapData.departments.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Sobre promedio</span>
                <span className="font-semibold text-gray-900">{statistics.departmentsAboveAverage}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Requieren atención</span>
                <span className="font-semibold text-red-600">{statistics.criticalCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default RiskHeatmap;