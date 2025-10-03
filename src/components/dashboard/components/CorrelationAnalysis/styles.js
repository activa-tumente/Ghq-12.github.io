/**
 * Sistema de estilos centralizado para CorrelationAnalysis
 * Proporciona utilidades de TailwindCSS organizadas por categorías
 * 
 * @author Sistema de Evaluación Psicológica BAT-7
 * @version 2.0.0
 */

// ============================================================================
// CONTENEDORES Y LAYOUTS
// ============================================================================

export const containers = {
  // Contenedor principal
  main: 'bg-white rounded-lg shadow-sm border p-6',
  
  // Contenedores de secciones
  section: 'mb-6',
  panel: 'p-4 bg-gray-50 rounded-lg border border-gray-200',
  card: 'p-4 bg-white rounded-lg border border-gray-200 shadow-sm',
  
  // Layouts de grid
  gridResponsive: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
  gridStats: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
  gridHorizontal: 'grid grid-cols-1 md:grid-cols-4 gap-4',
  
  // Layouts de lista
  listVertical: 'space-y-4',
  listHorizontal: 'flex flex-wrap gap-4',
  
  // Contenedores flexibles
  flexBetween: 'flex items-center justify-between',
  flexCenter: 'flex items-center justify-center',
  flexStart: 'flex items-center space-x-3',
  flexColumn: 'flex flex-col space-y-2'
};

// ============================================================================
// TIPOGRAFÍA
// ============================================================================

export const typography = {
  // Títulos
  title: 'text-lg font-semibold text-gray-900',
  subtitle: 'text-sm font-medium text-gray-900',
  sectionTitle: 'text-sm font-semibold text-gray-900',
  
  // Texto de contenido
  body: 'text-sm text-gray-700',
  bodySmall: 'text-xs text-gray-600',
  description: 'text-sm text-gray-600 leading-relaxed',
  
  // Texto de datos
  statValue: 'text-2xl font-bold text-gray-900',
  correlationValue: 'text-2xl font-bold text-gray-900',
  metricLabel: 'text-xs font-medium text-gray-700',
  
  // Estados especiales
  error: 'text-red-700',
  success: 'text-green-700',
  warning: 'text-yellow-700',
  info: 'text-blue-700',
  
  // Texto de accesibilidad
  srOnly: 'sr-only'
};

// ============================================================================
// ESTADOS DE CORRELACIÓN
// ============================================================================

export const correlationStates = {
  strength: {
    'Muy Fuerte': {
      badge: 'bg-red-100 text-red-800 border-red-200',
      progress: 'bg-red-500',
      icon: '🔴'
    },
    'Fuerte': {
      badge: 'bg-orange-100 text-orange-800 border-orange-200',
      progress: 'bg-orange-500',
      icon: '🟠'
    },
    'Moderada': {
      badge: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      progress: 'bg-yellow-500',
      icon: '🟡'
    },
    'Débil': {
      badge: 'bg-blue-100 text-blue-800 border-blue-200',
      progress: 'bg-blue-500',
      icon: '🔵'
    },
    'Muy Débil': {
      badge: 'bg-gray-100 text-gray-800 border-gray-200',
      progress: 'bg-gray-400',
      icon: '⚪'
    },
    'Sin datos': {
      badge: 'bg-gray-100 text-gray-600 border-gray-200',
      progress: 'bg-gray-300',
      icon: '❓'
    }
  },
  
  direction: {
    'Positiva': {
      icon: '↗️',
      color: 'text-green-600',
      description: 'Correlación positiva'
    },
    'Negativa': {
      icon: '↘️',
      color: 'text-red-600',
      description: 'Correlación negativa'
    },
    'Neutral': {
      icon: '➡️',
      color: 'text-gray-500',
      description: 'Sin correlación significativa'
    },
    'N/A': {
      icon: '❓',
      color: 'text-gray-400',
      description: 'Datos insuficientes'
    }
  }
};

// ============================================================================
// BADGES Y ETIQUETAS
// ============================================================================

export const badges = {
  // Badges básicos
  primary: 'bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full',
  secondary: 'bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full',
  success: 'bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full',
  warning: 'bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full',
  error: 'bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full',
  
  // Badges de fuerza de correlación
  strengthBase: 'px-2 py-1 rounded-full text-xs font-medium border',
  
  // Badges de insights
  insightWarning: 'border-yellow-300 bg-yellow-50 text-yellow-800',
  insightPositive: 'border-green-300 bg-green-50 text-green-800',
  insightNeutral: 'border-blue-300 bg-blue-50 text-blue-800',
  insightRecommendation: 'border-purple-300 bg-purple-50 text-purple-800'
};

// ============================================================================
// BOTONES E INTERACCIONES
// ============================================================================

export const buttons = {
  // Botones primarios
  primary: 'px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors',
  secondary: 'px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors',
  
  // Botones de estado
  success: 'px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors',
  error: 'px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors',
  
  // Botones pequeños
  small: 'px-3 py-1 text-xs rounded-full border transition-colors',
  smallActive: 'bg-blue-100 border-blue-300 text-blue-800',
  smallInactive: 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50',
  
  // Botones de texto
  textLink: 'text-xs text-blue-600 hover:text-blue-800 focus:outline-none focus:underline',
  textButton: 'w-full text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded',
  
  // Botones de icono
  iconButton: 'p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded transition-colors'
};

// ============================================================================
// ESTADOS DE CARGA Y VACÍO
// ============================================================================

export const loadingStates = {
  // Skeleton loading
  skeleton: 'animate-pulse',
  skeletonBar: 'h-4 bg-gray-200 rounded',
  skeletonCard: 'p-4 border rounded-lg',
  skeletonText: 'h-3 bg-gray-200 rounded',
  
  // Estados vacíos
  emptyContainer: 'text-center py-6',
  emptyIcon: 'text-4xl mb-2 block',
  emptyTitle: 'text-lg font-medium text-gray-900 mb-2',
  emptyDescription: 'text-gray-600 mb-4',
  
  // Estados de error
  errorContainer: 'text-center',
  errorIcon: 'text-4xl mb-2 block',
  errorTitle: 'text-lg font-medium text-red-900 mb-2',
  errorDescription: 'text-red-700 mb-4'
};

// ============================================================================
// ACCESIBILIDAD
// ============================================================================

export const accessibility = {
  // Focus states
  focusRing: 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
  focusVisible: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
  
  // Skip links
  skipLink: 'sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 bg-blue-600 text-white p-2 rounded',
  
  // Screen reader only
  srOnly: 'sr-only',
  
  // ARIA states
  ariaExpanded: 'aria-expanded',
  ariaControls: 'aria-controls',
  ariaLabel: 'aria-label',
  ariaDescribedBy: 'aria-describedby'
};

// ============================================================================
// ANIMACIONES
// ============================================================================

export const animations = {
  // Transiciones básicas
  transition: 'transition-all duration-200',
  transitionColors: 'transition-colors duration-200',
  transitionTransform: 'transition-transform duration-200',
  
  // Hover effects
  cardHover: 'hover:shadow-md transition-shadow duration-200',
  scaleHover: 'hover:scale-105 transition-transform duration-200',
  
  // Animaciones de entrada
  fadeIn: 'animate-fade-in',
  slideIn: 'animate-slide-in',
  staggerDelay: 'animate-stagger',
  
  // Rotaciones
  rotate180: 'rotate-180',
  rotateTransition: 'transition-transform duration-200',
  
  // Pulso y spin
  pulse: 'animate-pulse',
  spin: 'animate-spin'
};

// ============================================================================
// RESPONSIVE BREAKPOINTS
// ============================================================================

export const responsive = {
  // Breakpoints
  mobile: 'sm:',
  tablet: 'md:',
  desktop: 'lg:',
  wide: 'xl:',
  
  // Grid responsive
  gridMobile: 'grid-cols-1',
  gridTablet: 'md:grid-cols-2',
  gridDesktop: 'lg:grid-cols-3',
  gridWide: 'xl:grid-cols-4',
  
  // Spacing responsive
  paddingMobile: 'p-4',
  paddingTablet: 'md:p-6',
  paddingDesktop: 'lg:p-8',
  
  // Text responsive
  textMobile: 'text-sm',
  textTablet: 'md:text-base',
  textDesktop: 'lg:text-lg'
};

// ============================================================================
// UTILIDADES DE FUNCIONES
// ============================================================================

/**
 * Obtiene las clases CSS para el estado de fuerza de correlación
 */
export const getCorrelationStrengthClasses = (strength) => {
  const state = correlationStates.strength[strength];
  return state ? state.badge : correlationStates.strength['Sin datos'].badge;
};

/**
 * Obtiene las clases CSS para la dirección de correlación
 */
export const getCorrelationDirectionClasses = (direction) => {
  const state = correlationStates.direction[direction];
  return state ? state.color : correlationStates.direction['N/A'].color;
};

/**
 * Obtiene el icono para la fuerza de correlación
 */
export const getCorrelationStrengthIcon = (strength) => {
  const state = correlationStates.strength[strength];
  return state ? state.icon : correlationStates.strength['Sin datos'].icon;
};

/**
 * Obtiene el icono para la dirección de correlación
 */
export const getCorrelationDirectionIcon = (direction) => {
  const state = correlationStates.direction[direction];
  return state ? state.icon : correlationStates.direction['N/A'].icon;
};

/**
 * Obtiene las clases CSS para la barra de progreso de correlación
 */
export const getProgressClasses = (strength, direction) => {
  const strengthState = correlationStates.strength[strength];
  const baseClasses = 'h-2 rounded-full transition-all duration-500';
  const colorClass = strengthState ? strengthState.progress : 'bg-gray-300';
  
  return `${baseClasses} ${colorClass}`;
};

/**
 * Combina clases CSS de manera segura
 */
export const combineClasses = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Obtiene clases responsivas para grid
 */
export const getResponsiveGridClasses = (columns = 3) => {
  const baseClasses = 'grid gap-4';
  const responsiveClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  };
  
  return `${baseClasses} ${responsiveClasses[columns] || responsiveClasses[3]}`;
};

/**
 * Obtiene clases para estados de botón
 */
export const getButtonStateClasses = (isActive, variant = 'primary') => {
  if (variant === 'small') {
    return isActive ? buttons.smallActive : buttons.smallInactive;
  }
  
  return isActive ? buttons.primary : buttons.secondary;
};

// ============================================================================
// EXPORTACIÓN POR DEFECTO
// ============================================================================

export default {
  containers,
  typography,
  correlationStates,
  badges,
  buttons,
  loadingStates,
  accessibility,
  animations,
  responsive,
  // Utilidades
  getCorrelationStrengthClasses,
  getCorrelationDirectionClasses,
  getCorrelationStrengthIcon,
  getCorrelationDirectionIcon,
  getProgressClasses,
  combineClasses,
  getResponsiveGridClasses,
  getButtonStateClasses
};