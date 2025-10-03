/**
 * Sistema de estilos utilitarios para RiskHeatmap
 * Centraliza clases de TailwindCSS para mantener consistencia
 */

// Estilos base para contenedores
export const containerStyles = {
  main: 'bg-white rounded-lg shadow-sm border p-6',
  section: 'bg-gray-50 border border-gray-200 rounded-lg p-4',
  card: 'bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200',
  cardInteractive: 'bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
};

// Estilos para texto y tipografía
export const textStyles = {
  heading: 'text-lg font-semibold text-gray-900',
  subheading: 'text-sm font-medium text-gray-900',
  body: 'text-sm text-gray-700',
  caption: 'text-xs text-gray-600',
  label: 'text-xs font-medium text-gray-700',
  value: 'font-semibold text-gray-900'
};

// Estilos para estados de riesgo
export const riskStateStyles = {
  low: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    accent: 'text-green-600'
  },
  medium: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-800',
    accent: 'text-yellow-600'
  },
  high: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-800',
    accent: 'text-orange-600'
  },
  critical: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    accent: 'text-red-600'
  }
};

// Estilos para badges y indicadores
export const badgeStyles = {
  primary: 'bg-blue-50 text-blue-900 px-3 py-1 rounded-lg',
  warning: 'bg-orange-50 text-orange-900 px-3 py-1 rounded-lg',
  success: 'bg-green-50 text-green-900 px-3 py-1 rounded-lg',
  neutral: 'bg-gray-100 text-gray-700 px-2 py-1 rounded'
};

// Estilos para grids y layouts
export const layoutStyles = {
  gridMain: 'grid grid-cols-1 lg:grid-cols-3 gap-6',
  gridDepartments: 'grid grid-cols-1 md:grid-cols-2 gap-3',
  flexBetween: 'flex items-center justify-between',
  flexCenter: 'flex items-center gap-3',
  flexStart: 'flex items-start gap-2'
};

// Estilos para estados de carga y vacío
export const stateStyles = {
  loading: 'animate-pulse',
  skeleton: 'bg-gray-200 rounded',
  empty: 'text-center py-8 text-gray-500'
};

// Estilos para accesibilidad
export const a11yStyles = {
  srOnly: 'sr-only',
  focusRing: 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
  skipLink: 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded'
};

// Función utilitaria para combinar clases de riesgo
export const getRiskClasses = (riskLevel) => {
  const level = riskLevel?.toLowerCase() || 'low';
  const styles = riskStateStyles[level] || riskStateStyles.low;
  
  return {
    container: `${styles.bg} ${styles.border}`,
    text: styles.text,
    accent: styles.accent
  };
};

// Función para generar clases de progreso
export const getProgressClasses = (percentage) => {
  if (percentage >= 80) return 'bg-red-500';
  if (percentage >= 60) return 'bg-orange-500';
  if (percentage >= 40) return 'bg-yellow-500';
  return 'bg-green-500';
};

// Estilos para animaciones
export const animationStyles = {
  fadeIn: 'animate-fade-in',
  slideUp: 'animate-slide-up',
  pulse: 'animate-pulse',
  bounce: 'animate-bounce'
};

// Breakpoints responsivos
export const responsiveStyles = {
  mobile: 'block md:hidden',
  tablet: 'hidden md:block lg:hidden',
  desktop: 'hidden lg:block',
  mobileUp: 'block',
  tabletUp: 'hidden md:block',
  desktopUp: 'hidden lg:block'
};

export default {
  containerStyles,
  textStyles,
  riskStateStyles,
  badgeStyles,
  layoutStyles,
  stateStyles,
  a11yStyles,
  animationStyles,
  responsiveStyles,
  getRiskClasses,
  getProgressClasses
};