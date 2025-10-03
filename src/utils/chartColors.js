/**
 * Sistema de colores moderno para gráficos del dashboard
 * Paleta de colores optimizada para visualización de datos
 */

// Paleta principal de colores modernos
export const CHART_COLORS = {
  // Colores para niveles de riesgo (GHQ-12)
  risk: {
    veryLow: '#10B981',    // Verde esmeralda
    low: '#34D399',        // Verde claro
    moderate: '#F59E0B',   // Ámbar
    high: '#F97316',       // Naranja
    veryHigh: '#EF4444',   // Rojo
    critical: '#DC2626'    // Rojo oscuro
  },
  
  // Colores para métricas principales
  metrics: {
    primary: '#3B82F6',    // Azul principal
    secondary: '#8B5CF6',  // Púrpura
    success: '#10B981',    // Verde
    warning: '#F59E0B',    // Ámbar
    danger: '#EF4444',     // Rojo
    info: '#06B6D4'        // Cian
  },
  
  // Colores para departamentos (paleta diversa)
  departments: [
    '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1',
    '#14B8A6', '#F43F5E', '#8B5A2B', '#059669', '#DC2626'
  ],
  
  // Colores para gradientes
  gradients: {
    blue: ['#3B82F6', '#1D4ED8'],
    purple: ['#8B5CF6', '#7C3AED'],
    green: ['#10B981', '#059669'],
    orange: ['#F59E0B', '#D97706'],
    red: ['#EF4444', '#DC2626'],
    cyan: ['#06B6D4', '#0891B2']
  }
};

// Función para obtener color de riesgo basado en valor GHQ-12
export const getRiskColor = (ghqScore) => {
  if (ghqScore >= 3.0) return CHART_COLORS.risk.veryHigh;
  if (ghqScore >= 2.5) return CHART_COLORS.risk.high;
  if (ghqScore >= 2.0) return CHART_COLORS.risk.moderate;
  if (ghqScore >= 1.5) return CHART_COLORS.risk.low;
  return CHART_COLORS.risk.veryLow;
};

// Función para obtener color con gradiente
export const getGradientColor = (color, opacity = 1) => {
  const gradients = {
    blue: `linear-gradient(135deg, ${CHART_COLORS.gradients.blue[0]}${Math.round(opacity * 255).toString(16).padStart(2, '0')}, ${CHART_COLORS.gradients.blue[1]}${Math.round(opacity * 255).toString(16).padStart(2, '0')})`,
    purple: `linear-gradient(135deg, ${CHART_COLORS.gradients.purple[0]}${Math.round(opacity * 255).toString(16).padStart(2, '0')}, ${CHART_COLORS.gradients.purple[1]}${Math.round(opacity * 255).toString(16).padStart(2, '0')})`,
    green: `linear-gradient(135deg, ${CHART_COLORS.gradients.green[0]}${Math.round(opacity * 255).toString(16).padStart(2, '0')}, ${CHART_COLORS.gradients.green[1]}${Math.round(opacity * 255).toString(16).padStart(2, '0')})`,
    orange: `linear-gradient(135deg, ${CHART_COLORS.gradients.orange[0]}${Math.round(opacity * 255).toString(16).padStart(2, '0')}, ${CHART_COLORS.gradients.orange[1]}${Math.round(opacity * 255).toString(16).padStart(2, '0')})`,
    red: `linear-gradient(135deg, ${CHART_COLORS.gradients.red[0]}${Math.round(opacity * 255).toString(16).padStart(2, '0')}, ${CHART_COLORS.gradients.red[1]}${Math.round(opacity * 255).toString(16).padStart(2, '0')})`
  };
  return gradients[color] || gradients.blue;
};

// Función para obtener color de departamento por índice
export const getDepartmentColor = (index) => {
  return CHART_COLORS.departments[index % CHART_COLORS.departments.length];
};

// Configuración de estilos para gráficos
export const CHART_STYLES = {
  // Estilos para barras
  bar: {
    borderRadius: 6,
    borderWidth: 0,
    shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    hoverShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
  },
  
  // Estilos para líneas
  line: {
    strokeWidth: 3,
    strokeLinecap: 'round',
    strokeLinejoin: 'round'
  },
  
  // Estilos para puntos
  dot: {
    radius: 6,
    strokeWidth: 2,
    fillOpacity: 0.8
  },
  
  // Estilos para tooltips
  tooltip: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    border: '1px solid rgba(229, 231, 235, 0.8)',
    borderRadius: 8,
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    padding: '12px 16px'
  }
};

// Función para generar colores con transparencia
export const getColorWithOpacity = (color, opacity = 1) => {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// Función para obtener color de fondo con gradiente sutil
export const getBackgroundGradient = (color) => {
  const baseColor = color || CHART_COLORS.metrics.primary;
  return `linear-gradient(135deg, ${getColorWithOpacity(baseColor, 0.1)} 0%, ${getColorWithOpacity(baseColor, 0.05)} 100%)`;
};

export default CHART_COLORS;

