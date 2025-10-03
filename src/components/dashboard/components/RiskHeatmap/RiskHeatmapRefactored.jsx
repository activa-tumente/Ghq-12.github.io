import React, { memo } from 'react';
import PropTypes from 'prop-types';
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

import { useRiskHeatmapData } from '../../../../hooks/useRiskHeatmapData';
import DepartmentCard from './DepartmentCard';
import CriticalDepartmentsList from './CriticalDepartmentsList';
import { LEGEND_ITEMS } from './constants';

// Mapeo de departamentos a iconos
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

/**
 * Componente de carga con skeleton
 */
const LoadingSkeleton = () => (
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

/**
 * Estado vacío cuando no hay datos
 */
const EmptyState = () => (
  <div className="bg-white rounded-lg shadow-sm border p-6">
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-lg font-semibold text-gray-900">
        Heatmap de Riesgo por Departamento
      </h3>
      <span className="text-2xl" aria-hidden="true">🌡️</span>
    </div>
    <div className="text-center py-8 text-gray-500" role="region" aria-live="polite">
      <p>No hay datos disponibles para mostrar el heatmap</p>
      <p className="text-sm mt-2">Asegúrate de que existan respuestas con departamentos asignados</p>
    </div>
  </div>
);

/**
 * Header con estadísticas principales
 */
const StatsHeader = ({ statistics, data }) => (
  <div className="flex items-center justify-between mb-6">
    <div className="flex items-center gap-3">
      <h3 className="text-lg font-semibold text-gray-900">
        Mapa de Riesgo por Departamento
      </h3>
      <span className="text-2xl" aria-hidden="true">🌡️</span>
    </div>
    <div className="flex items-center gap-4 text-sm" role="region" aria-label="Estadísticas principales">
      <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-lg">
        <span className="font-medium text-blue-900" aria-label={`Promedio de riesgo: ${statistics.averageRisk.toFixed(1)} por ciento`}>
          {statistics.averageRisk.toFixed(1)}%
        </span>
        <span className="text-blue-700">Promedio</span>
      </div>
      <div className="flex items-center gap-2 bg-orange-50 px-3 py-1 rounded-lg">
        <MdWarning className="w-4 h-4 text-orange-600" aria-hidden="true" />
        <span className="font-medium text-orange-900" aria-label={`${statistics.criticalCount} departamentos críticos`}>
          {statistics.criticalCount}
        </span>
        <span className="text-orange-700">Críticos</span>
      </div>
      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
        {data?.responses?.length || 0} respuestas
      </span>
    </div>
  </div>
);

/**
 * Leyenda de niveles de riesgo
 */
const RiskLegend = () => (
  <div className="flex items-center gap-3 text-xs mb-4 p-2 bg-gray-50 rounded-lg" role="region" aria-label="Leyenda de niveles de riesgo">
    <span className="font-medium text-gray-700">Niveles:</span>
    {LEGEND_ITEMS.map((item, index) => (
      <div key={index} className="flex items-center gap-1">
        <div className={`w-2 h-2 rounded-full ${item.color}`} aria-hidden="true" />
        <span className="text-gray-600">{item.level}</span>
      </div>
    ))}
  </div>
);

/**
 * Grid de departamentos
 */
const DepartmentsGrid = ({ heatmapData, statistics }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3" role="region" aria-label="Departamentos evaluados">
    {heatmapData.departments.map((dept) => {
      const riskValue = heatmapData.averageRisk[dept];
      const IconComponent = departmentIcons[dept] || departmentIcons.default;
      
      return (
        <DepartmentCard
          key={dept}
          department={dept}
          riskValue={riskValue}
          IconComponent={IconComponent}
          averageRisk={statistics.averageRisk}
          onClick={() => {
            // Aquí se podría implementar navegación a detalle del departamento
            console.log(`Navegando a detalle de ${dept}`);
          }}
        />
      );
    })}
  </div>
);

/**
 * Panel de recomendaciones
 */
const RecommendationsPanel = ({ recommendations }) => {
  if (recommendations.length === 0) return null;

  return (
    <section 
      className="bg-blue-50 border border-blue-200 rounded-lg p-4"
      role="region"
      aria-labelledby="recommendations-heading"
    >
      <h4 
        id="recommendations-heading"
        className="text-sm font-medium text-blue-900 mb-3"
      >
        Acciones Recomendadas
      </h4>
      <ul className="text-xs text-blue-800 space-y-2" role="list">
        {recommendations.slice(0, 4).map((rec, index) => (
          <li key={index} className="flex items-start gap-2" role="listitem">
            <span 
              className="w-4 h-4 bg-blue-200 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
              aria-label={`Recomendación ${index + 1}`}
            >
              {index + 1}
            </span>
            <span>{rec}</span>
          </li>
        ))}
      </ul>
    </section>
  );
};

/**
 * Resumen estadístico
 */
const StatsSummary = ({ heatmapData, statistics }) => (
  <section 
    className="bg-gray-50 border border-gray-200 rounded-lg p-4"
    role="region"
    aria-labelledby="stats-summary-heading"
  >
    <h4 
      id="stats-summary-heading"
      className="text-sm font-medium text-gray-900 mb-3"
    >
      Resumen Estadístico
    </h4>
    <dl className="space-y-3 text-sm">
      <div className="flex justify-between items-center">
        <dt className="text-gray-600">Departamentos evaluados</dt>
        <dd className="font-semibold text-gray-900">{heatmapData.departments.length}</dd>
      </div>
      <div className="flex justify-between items-center">
        <dt className="text-gray-600">Sobre promedio</dt>
        <dd className="font-semibold text-gray-900">{statistics.departmentsAboveAverage}</dd>
      </div>
      <div className="flex justify-between items-center">
        <dt className="text-gray-600">Requieren atención</dt>
        <dd className="font-semibold text-red-600">{statistics.criticalCount}</dd>
      </div>
    </dl>
  </section>
);

/**
 * Componente principal del RiskHeatmap refactorizado
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.data - Datos del dashboard
 * @param {boolean} props.loading - Estado de carga
 */
const RiskHeatmapRefactored = memo(({ data, loading = false }) => {
  const { heatmapData, criticalDepartments, statistics, recommendations } = useRiskHeatmapData(data, loading);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (heatmapData.isEmpty) {
    return <EmptyState />;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <StatsHeader statistics={statistics} data={data} />

      {/* Layout principal en dos columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna principal - Grid de departamentos */}
        <div className="lg:col-span-2">
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Departamentos por Nivel de Riesgo
            </h4>
            <RiskLegend />
          </div>
          <DepartmentsGrid heatmapData={heatmapData} statistics={statistics} />
        </div>

        {/* Columna lateral - Análisis y recomendaciones */}
        <div className="space-y-4">
          <CriticalDepartmentsList 
            criticalDepartments={criticalDepartments}
            departmentIcons={departmentIcons}
          />
          <RecommendationsPanel recommendations={recommendations} />
          <StatsSummary heatmapData={heatmapData} statistics={statistics} />
        </div>
      </div>
    </div>
  );
});

// PropTypes para validación de tipos
RiskHeatmapRefactored.propTypes = {
  data: PropTypes.shape({
    segmented: PropTypes.shape({
      byDepartment: PropTypes.object
    }),
    responses: PropTypes.array
  }),
  loading: PropTypes.bool
};

RiskHeatmapRefactored.defaultProps = {
  data: null,
  loading: false
};

RiskHeatmapRefactored.displayName = 'RiskHeatmapRefactored';

export default RiskHeatmapRefactored;