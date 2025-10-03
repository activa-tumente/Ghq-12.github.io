import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { CardSkeleton } from '../../ui/SkeletonLoader';
import { getRiskLevel } from '../../../utils/riskLevelUtils';
import { getRiskColor, CHART_COLORS, getColorWithOpacity } from '../../../utils/chartColors';
import { useRiskByRoleData } from '../../../hooks/useRiskByRoleData';

/**
 * Componente para mostrar la distribución de riesgo por cargo
 * Muestra barras horizontales con colores según el nivel de riesgo
 */
const RiskDistributionByRole = ({ filters = {}, title = "Distribución de Riesgo por Cargo" }) => {
  const { data, loading, error } = useRiskByRoleData(filters);
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <CardSkeleton />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">📊</div>
          <p className="text-gray-500 text-sm">
            No hay datos suficientes para mostrar la distribución por cargo
          </p>
        </div>
      </div>
    );
  }

  // Preparar datos para el gráfico con colores modernos
  const chartData = data
    .filter(item => item.cargo)
    .slice(0, 10)
    .map((item, index) => {
      const promedio = item.hasData ? parseFloat((item.averageGHQ || 0).toFixed(2)) : 0;
      const color = item.hasData ? getRiskColor(promedio) : '#E5E7EB'; // gris si no hay datos
      return {
        cargo: item.cargo,
        promedioGHQ: promedio,
        totalEmpleados: item.hasData ? item.count : 0,
        nivelRiesgo: item.hasData ? getRiskLevel(promedio) : 'Sin datos',
        colorBarra: color,
        hasData: !!item.hasData,
        index
      };
    });

  // Custom tooltip moderno con mejor diseño
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const riskColor = getRiskColor(data.promedioGHQ);
      
      return (
        <div 
          className="bg-white p-4 border border-gray-200 rounded-xl shadow-xl backdrop-blur-sm"
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            border: `1px solid ${getColorWithOpacity(riskColor, 0.2)}`,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: riskColor }}
            />
            <p className="font-bold text-gray-900 text-lg">{data.cargo}</p>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Promedio GHQ-12:</span>
              <span 
                className="font-bold text-lg px-2 py-1 rounded-md"
                style={{ 
                  color: riskColor,
                  backgroundColor: getColorWithOpacity(riskColor, 0.1)
                }}
              >
                {data.promedioGHQ}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Nivel de Riesgo:</span>
              <span 
                className="font-semibold px-3 py-1 rounded-full text-sm"
                style={{ 
                  color: 'white',
                  backgroundColor: riskColor
                }}
              >
                {data.nivelRiesgo}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Empleados:</span>
              <span className="font-semibold text-gray-900">{data.totalEmpleados}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Formatear el cargo para mostrar en el eje Y
  const formatCargo = (cargo) => {
    if (cargo.length > 25) {
      return cargo.substring(0, 22) + '...';
    }
    return cargo;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
      {/* Header mejorado */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: getColorWithOpacity(CHART_COLORS.metrics.primary, 0.1) }}>
            <span className="text-xl">📊</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">Análisis de riesgo por posición laboral</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
            Top {chartData.length} cargos
          </div>
        </div>
      </div>

      {/* Leyenda de colores */}
      <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: getColorWithOpacity(CHART_COLORS.metrics.primary, 0.05) }}>
        <div className="flex items-center justify-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS.risk.veryLow }}></div>
            <span className="text-gray-600">Bajo (0-1.5)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS.risk.low }}></div>
            <span className="text-gray-600">Moderado (1.5-2.5)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS.risk.moderate }}></div>
            <span className="text-gray-600">Alto (2.5-3.0)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS.risk.high }}></div>
            <span className="text-gray-600">Muy Alto (3.0+)</span>
          </div>
        </div>
      </div>

      {/* Gráfico mejorado */}
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 20, right: 40, left: 120, bottom: 20 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              horizontal={true} 
              vertical={false}
              stroke="#E5E7EB"
              strokeOpacity={0.6}
            />
            
            <XAxis 
              type="number"
              domain={[0, 'dataMax + 0.5']}
              tickCount={7}
              tick={{ fontSize: 12, fill: '#6B7280' }}
              axisLine={{ stroke: '#D1D5DB' }}
              tickLine={{ stroke: '#D1D5DB' }}
              label={{ 
                value: 'Puntaje GHQ-12 Promedio', 
                position: 'insideBottom', 
                offset: -10,
                style: { textAnchor: 'middle', fill: '#4B5563', fontSize: 14, fontWeight: 500 }
              }}
            />
            
            <YAxis 
              type="category" 
              dataKey="cargo"
              tickFormatter={formatCargo}
              width={120}
              tick={{ fontSize: 12, fill: '#374151' }}
              axisLine={{ stroke: '#D1D5DB' }}
              tickLine={{ stroke: '#D1D5DB' }}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            <Bar 
              dataKey="promedioGHQ" 
              name="Promedio GHQ-12"
              radius={[0, 8, 8, 0]}
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.colorBarra}
                  style={{
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                    transition: 'all 0.3s ease'
                  }}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Footer mejorado */}
      <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: getColorWithOpacity(CHART_COLORS.metrics.primary, 0.05) }}>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-gray-600">
              <strong>Escala GHQ-12:</strong> 0-1 (Muy Bajo), 1-2 (Bajo), 2-3 (Moderado), 3+ (Alto)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskDistributionByRole;