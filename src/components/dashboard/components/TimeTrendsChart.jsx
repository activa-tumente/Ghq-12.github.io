import React, { memo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { rechartsConfig } from '../../../utils/rechartsConfig';
import { CHART_COLORS, getColorWithOpacity } from '../../../utils/chartColors';
import { ChartSkeleton } from '../../ui/SkeletonLoader';
import { useTimeTrendsData } from '../hooks/useTimeTrendsData';

const TimeTrendsChart = memo(({ filters = {}, title = 'Tendencia Temporal del Riesgo Psicosocial' }) => {
  console.log('🎯 TimeTrendsChart - Renderizando con filtros:', filters);

  const { timeTrendsData: data, loading, error } = useTimeTrendsData(filters);

  console.log('📊 TimeTrendsChart - Estado:', {
    hasData: !!data,
    dataLength: data?.length,
    loading,
    error
  });

  if (loading) {
    console.log('⏳ TimeTrendsChart - Cargando...');
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <span className="text-sm text-blue-600 animate-pulse">⏳ Cargando...</span>
        </div>
        <ChartSkeleton type="line" />
      </div>
    );
  }

  if (error) {
    console.error('❌ TimeTrendsChart - Error:', error);
    return (
      <div className="bg-white rounded-lg border border-red-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <span className="text-sm text-red-600">❌ Error</span>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-500 mb-2">⚠️ Error al cargar datos</p>
            <p className="text-sm text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    console.warn('⚠️ TimeTrendsChart - Sin datos');
    return (
      <div className="bg-white rounded-lg border border-yellow-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <span className="text-sm text-yellow-600">📊 Sin datos</span>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-gray-500 mb-2">
              No hay datos suficientes para mostrar la tendencia temporal
            </p>
            <p className="text-sm text-gray-400">
              Completa algunos cuestionarios para ver las tendencias
            </p>
          </div>
        </div>
      </div>
    );
  }

  console.log('✅ TimeTrendsChart - Renderizando gráfico con', data.length, 'puntos de datos');

  // Formatear los datos para el gráfico
  const chartData = data.map(item => ({
    semana: item.semana,
    fecha_inicio: item.fecha_inicio,
    fecha_fin: item.fecha_fin,
    promedio_ghq: item.promedio_ghq,
    pct_muy_alto: item.pct_muy_alto,
    total_respuestas: item.total_respuestas
  }));

  // Formatear la semana para mostrar en el eje X (ej: "Sem 05 2024")
  const formatWeek = (semana) => {
    const [year, weekPart] = semana.split('-W');
    return `Sem ${weekPart} ${year}`;
  };

  // Formatear rango de fechas para el tooltip
  const formatDateRange = (fecha_inicio, fecha_fin) => {
    const start = new Date(fecha_inicio);
    const end = new Date(fecha_fin);
    const options = { day: '2-digit', month: 'short' };
    return `${start.toLocaleDateString('es-ES', options)} - ${end.toLocaleDateString('es-ES', options)}`;
  };

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const currentData = payload[0]?.payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">
            {formatWeek(label)}
          </p>
          <p className="text-xs text-gray-500 mb-2">
            {formatDateRange(currentData?.fecha_inicio, currentData?.fecha_fin)}
          </p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name === 'promedio_ghq' ? 'Promedio GHQ-12: ' : '% Riesgo Muy Alto: '}
              <span className="font-semibold">
                {entry.name === 'promedio_ghq' 
                  ? entry.value.toFixed(2) 
                  : `${entry.value.toFixed(1)}%`}
              </span>
            </p>
          ))}
          <p className="text-xs text-gray-500 mt-2">
            Total respuestas: {payload[0]?.payload?.total_respuestas || 0}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">
            Evolución semanal del riesgo psicosocial
          </p>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#E5E7EB" 
              vertical={false}
            />
            
            <XAxis
              dataKey="semana"
              tickFormatter={formatWeek}
              tick={{ fontSize: 12, fill: '#6B7280' }}
              axisLine={{ stroke: '#D1D5DB' }}
              tickLine={{ stroke: '#D1D5DB' }}
            />
            
            {/* Eje Y izquierdo para promedio GHQ */}
            <YAxis
              yAxisId="left"
              label={{ 
                value: 'Promedio GHQ-12', 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle', fill: '#4B5563', fontSize: 12 }
              }}
              domain={[0, 3]}
              tick={{ fontSize: 12, fill: '#6B7280' }}
              axisLine={{ stroke: '#D1D5DB' }}
              tickLine={{ stroke: '#D1D5DB' }}
            />
            
            {/* Eje Y derecho para % riesgo muy alto */}
            <YAxis
              yAxisId="right"
              orientation="right"
              label={{ 
                value: '% Riesgo Muy Alto', 
                angle: 90, 
                position: 'insideRight',
                style: { textAnchor: 'middle', fill: '#DC2626', fontSize: 12 }
              }}
              domain={[0, 100]}
              tick={{ fontSize: 12, fill: '#6B7280' }}
              axisLine={{ stroke: '#D1D5DB' }}
              tickLine={{ stroke: '#D1D5DB' }}
            />
            
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {/* Línea para promedio GHQ */}
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="promedio_ghq"
              name="Promedio GHQ-12"
              stroke={CHART_COLORS.metrics.primary}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              dot={{ 
                fill: CHART_COLORS.metrics.primary, 
                strokeWidth: 2, 
                r: 5,
                style: { filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }
              }}
              activeDot={{ 
                r: 7, 
                stroke: CHART_COLORS.metrics.primary, 
                strokeWidth: 3,
                style: { filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))' }
              }}
            />
            
            {/* Línea para % riesgo muy alto */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="pct_muy_alto"
              name="% Riesgo Muy Alto"
              stroke={CHART_COLORS.risk.veryHigh}
              strokeWidth={3}
              strokeDasharray="6 6"
              strokeLinecap="round"
              strokeLinejoin="round"
              dot={{ 
                fill: CHART_COLORS.risk.veryHigh, 
                strokeWidth: 2, 
                r: 5,
                style: { filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }
              }}
              activeDot={{ 
                r: 7, 
                stroke: CHART_COLORS.risk.veryHigh, 
                strokeWidth: 3,
                style: { filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))' }
              }}
            />
            
            {/* Línea de referencia para GHQ (umbral de alerta) */}
            <ReferenceLine
              yAxisId="left"
              y={2}
              stroke={CHART_COLORS.risk.moderate}
              strokeWidth={2}
              strokeDasharray="6 6"
              label={{ 
                value: 'Umbral Alerta', 
                position: 'right',
                fill: CHART_COLORS.risk.moderate,
                fontSize: 12,
                fontWeight: 500
              }}
            />
            
            {/* Línea de referencia para riesgo (umbral crítico) */}
            <ReferenceLine
              yAxisId="right"
              y={80}
              stroke={CHART_COLORS.risk.veryHigh}
              strokeWidth={2}
              strokeDasharray="6 6"
              label={{ 
                value: 'Umbral Crítico', 
                position: 'right',
                fill: CHART_COLORS.risk.veryHigh,
                fontSize: 12,
                fontWeight: 500
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        <p>Nota: El promedio GHQ-12 se mide en escala 0-3. El % de riesgo muy alto considera respuestas ≥80%.</p>
      </div>
    </div>
  );
});

TimeTrendsChart.displayName = 'TimeTrendsChart';

export default TimeTrendsChart;