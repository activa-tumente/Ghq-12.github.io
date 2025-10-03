import React, { useMemo } from 'react';
import { CardSkeleton } from '../../ui/SkeletonLoader';

const SafetyBehaviorIndex = ({ data, loading }) => {
  if (loading) {
    return <CardSkeleton showHeader={true} lines={4} />;
  }

  // Calcular datos del ICS desde los datos del dashboard
  const safetyData = useMemo(() => {
    // Verificar si tenemos datos de métricas
    const metrics = data?.metrics || data?.data?.metrics || {};
    const responses = data?.responses || data?.data?.responses || [];

    // Si tenemos el safetyIndex calculado, usarlo
    if (metrics.safetyIndex !== undefined) {
      // Calcular componentes individuales desde las respuestas
      let eppUsage = 0;
      let incidentReports = 0;
      let capacitaciones = 0;

      if (responses.length > 0) {
        const validResponses = responses.filter(r => r.usuarios);
        
        if (validResponses.length > 0) {
          eppUsage = (validResponses.filter(r => r.usuarios.uso_epp).length / validResponses.length) * 100;
          incidentReports = (validResponses.filter(r => r.usuarios.reporta_casi_accidentes).length / validResponses.length) * 100;
          capacitaciones = (validResponses.filter(r => r.usuarios.capacitaciones_seguridad).length / validResponses.length) * 100;
        }
      }

      return {
        safetyIndex: metrics.safetyIndex,
        eppUsage: Math.round(eppUsage * 10) / 10,
        incidentReports: Math.round(incidentReports * 10) / 10,
        capacitaciones: Math.round(capacitaciones * 10) / 10,
        trend: metrics.safetyIndex >= 70 ? 'improving' : metrics.safetyIndex >= 50 ? 'stable' : 'declining'
      };
    }

    // Datos de fallback
    return {
      eppUsage: 0,
      incidentReports: 0,
      capacitaciones: 0,
      safetyIndex: 0,
      trend: 'stable'
    };
  }, [data]);

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      default: return '➡️';
    }
  };

  const getSafetyLevel = (index) => {
    if (index >= 80) return { level: 'Excelente', color: 'text-green-600' };
    if (index >= 60) return { level: 'Bueno', color: 'text-blue-600' };
    if (index >= 40) return { level: 'Regular', color: 'text-yellow-600' };
    return { level: 'Crítico', color: 'text-red-600' };
  };

  const safetyLevel = getSafetyLevel(safetyData.safetyIndex);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Índice de Conducta Segura (ICS)
        </h3>
        <span className="text-2xl">🛡️</span>
      </div>

      {/* ICS Score */}
      <div className="text-center mb-6">
        <div className="text-4xl font-bold text-gray-900 mb-2">
          {safetyData.safetyIndex}%
        </div>
        <div className={`text-lg font-medium ${safetyLevel.color}`}>
          {safetyLevel.level}
        </div>
        <div className="text-sm text-gray-600 mt-1">
          Tendencia: {getTrendIcon(safetyData.trend)} {safetyData.trend}
        </div>
      </div>

      {/* Components */}
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Uso de EPP</span>
            <span className="font-semibold">{safetyData.eppUsage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full" 
              style={{ width: `${safetyData.eppUsage}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Capacitaciones de seguridad</span>
            <span className="font-semibold">{safetyData.capacitaciones}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-purple-600 h-2 rounded-full" 
              style={{ width: `${safetyData.capacitaciones}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Reportes de incidentes</span>
            <span className="font-semibold">{safetyData.incidentReports}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full" 
              style={{ width: `${safetyData.incidentReports}%` }}
            />
          </div>
        </div>
      </div>

      {/* Formula Explanation */}
      <div className="mt-6 p-3 bg-gray-50 rounded-md">
        <p className="text-xs text-gray-600">
          <strong>Fórmula ICS:</strong> (Uso EPP + Capacitaciones + Reportes) / 3 × 100
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Promedio de los tres componentes de conducta segura
        </p>
      </div>
    </div>
  );
};

export default SafetyBehaviorIndex;