import React, { memo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, 
  PolarRadiusAxis, Radar, ComposedChart, Area, AreaChart
} from 'recharts';

// Configuraciones base para diferentes tipos de gráficos
const CHART_CONFIGS = {
  bar: {
    margin: { top: 20, right: 30, left: 20, bottom: 5 },
    colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
    defaultProps: {
      dataKey: 'value',
      nameKey: 'name'
    }
  },
  pie: {
    colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'],
    defaultProps: {
      cx: '50%',
      cy: '50%',
      outerRadius: 80,
      dataKey: 'value'
    }
  },
  line: {
    margin: { top: 20, right: 30, left: 20, bottom: 5 },
    colors: ['#3B82F6', '#10B981', '#F59E0B'],
    defaultProps: {
      strokeWidth: 2,
      dot: { r: 4 }
    }
  },
  radar: {
    colors: ['#3B82F6', '#10B981'],
    defaultProps: {
      cx: '50%',
      cy: '50%',
      outerRadius: '80%'
    }
  }
};

// Factory para crear gráficos
class ChartFactory {
  static createChart(type, props) {
    const config = CHART_CONFIGS[type];
    if (!config) {
      throw new Error(`Tipo de gráfico no soportado: ${type}`);
    }

    switch (type) {
      case 'bar':
        return <BarChartComponent {...props} config={config} />;
      case 'pie':
        return <PieChartComponent {...props} config={config} />;
      case 'line':
        return <LineChartComponent {...props} config={config} />;
      case 'radar':
        return <RadarChartComponent {...props} config={config} />;
      default:
        return null;
    }
  }
}

// Componente base para gráficos
const ChartContainer = memo(({ titulo, children, className = '' }) => (
  <div className={`bg-white p-6 rounded-lg shadow-sm border border-gray-200 ${className}`}>
    {titulo && (
      <h3 className="text-lg font-semibold mb-4 text-gray-800">{titulo}</h3>
    )}
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  </div>
));

ChartContainer.displayName = 'ChartContainer';

// Componente de gráfico de barras
const BarChartComponent = memo(({ datos, titulo, config, dataKey, nameKey, ...props }) => {
  if (!datos || datos.length === 0) {
    return (
      <ChartContainer titulo={titulo}>
        <div className="flex items-center justify-center h-full text-gray-500">
          No hay datos disponibles
        </div>
      </ChartContainer>
    );
  }

  return (
    <ChartContainer titulo={titulo}>
      <BarChart data={datos} margin={config.margin} {...props}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey={nameKey || config.defaultProps.nameKey} 
          tick={{ fontSize: 12 }}
          stroke="#6B7280"
        />
        <YAxis tick={{ fontSize: 12 }} stroke="#6B7280" />
        <Tooltip 
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        />
        <Legend />
        <Bar 
          dataKey={dataKey || config.defaultProps.dataKey} 
          fill={config.colors[0]}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  );
});

BarChartComponent.displayName = 'BarChartComponent';

// Componente de gráfico circular
const PieChartComponent = memo(({ datos, titulo, config, dataKey, nameKey, ...props }) => {
  if (!datos || datos.length === 0) {
    return (
      <ChartContainer titulo={titulo}>
        <div className="flex items-center justify-center h-full text-gray-500">
          No hay datos disponibles
        </div>
      </ChartContainer>
    );
  }

  return (
    <ChartContainer titulo={titulo}>
      <PieChart {...props}>
        <Pie
          data={datos}
          {...config.defaultProps}
          dataKey={dataKey || config.defaultProps.dataKey}
          nameKey={nameKey || 'name'}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
        >
          {datos.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={config.colors[index % config.colors.length]} 
            />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        />
      </PieChart>
    </ChartContainer>
  );
});

PieChartComponent.displayName = 'PieChartComponent';

// Componente de gráfico de líneas
const LineChartComponent = memo(({ datos, titulo, config, dataKey, nameKey, ...props }) => {
  if (!datos || datos.length === 0) {
    return (
      <ChartContainer titulo={titulo}>
        <div className="flex items-center justify-center h-full text-gray-500">
          No hay datos disponibles
        </div>
      </ChartContainer>
    );
  }

  return (
    <ChartContainer titulo={titulo}>
      <LineChart data={datos} margin={config.margin} {...props}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey={nameKey || 'name'} 
          tick={{ fontSize: 12 }}
          stroke="#6B7280"
        />
        <YAxis tick={{ fontSize: 12 }} stroke="#6B7280" />
        <Tooltip 
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey={dataKey || config.defaultProps.dataKey} 
          stroke={config.colors[0]}
          {...config.defaultProps}
        />
      </LineChart>
    </ChartContainer>
  );
});

LineChartComponent.displayName = 'LineChartComponent';

// Componente de gráfico radar
const RadarChartComponent = memo(({ datos, titulo, config, dataKey, nameKey, ...props }) => {
  if (!datos || datos.length === 0) {
    return (
      <ChartContainer titulo={titulo}>
        <div className="flex items-center justify-center h-full text-gray-500">
          No hay datos disponibles
        </div>
      </ChartContainer>
    );
  }

  return (
    <ChartContainer titulo={titulo}>
      <RadarChart data={datos} {...config.defaultProps} {...props}>
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis 
          dataKey={nameKey || 'name'} 
          tick={{ fontSize: 12, fill: '#6B7280' }}
        />
        <PolarRadiusAxis 
          angle={90} 
          domain={[0, 5]} 
          tick={{ fontSize: 10, fill: '#6B7280' }}
        />
        <Radar
          dataKey={dataKey || 'value'}
          stroke={config.colors[0]}
          fill={config.colors[0]}
          fillOpacity={0.3}
          strokeWidth={2}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        />
      </RadarChart>
    </ChartContainer>
  );
});

RadarChartComponent.displayName = 'RadarChartComponent';

// Hook personalizado para usar el factory
export const useChart = () => {
  const createChart = (type, props) => ChartFactory.createChart(type, props);
  
  return { createChart };
};

// Exportar componentes individuales para uso directo
export {
  ChartFactory,
  ChartContainer,
  BarChartComponent,
  PieChartComponent,
  LineChartComponent,
  RadarChartComponent
};

export default ChartFactory;