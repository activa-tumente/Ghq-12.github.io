/**
 * Constantes para el componente RiskMatrixHeatmap
 * Centraliza configuración, colores y pesos para facilitar mantenimiento
 */

// Niveles de riesgo en orden de menor a mayor
export const RISK_LEVELS = ['Muy Bajo', 'Bajo', 'Moderado', 'Alto', 'Muy Alto'];

// Pesos para cálculo de riesgo promedio (0.0 - 1.0)
export const RISK_WEIGHTS = {
  'Muy Bajo': 0.1,
  'Bajo': 0.3,
  'Moderado': 0.5,
  'Alto': 0.7,
  'Muy Alto': 0.9
};

// Colores para niveles de riesgo (TailwindCSS classes)
export const RISK_LEVEL_COLORS = {
  'Muy Alto': 'bg-red-600 text-white',
  'Alto': 'bg-orange-500 text-white',
  'Moderado': 'bg-yellow-400 text-gray-900',
  'Bajo': 'bg-green-400 text-gray-900',
  'Muy Bajo': 'bg-green-200 text-gray-900'
};

// Escala de colores para concentración de usuarios (porcentajes)
export const CONCENTRATION_COLORS = [
  { min: 0, max: 0, class: 'bg-gray-50 text-gray-400' },
  { min: 0.1, max: 9.9, class: 'bg-blue-100 text-blue-800' },
  { min: 10, max: 24.9, class: 'bg-blue-200 text-blue-900' },
  { min: 25, max: 49.9, class: 'bg-blue-300 text-blue-900' },
  { min: 50, max: 74.9, class: 'bg-blue-500 text-white' },
  { min: 75, max: 100, class: 'bg-blue-700 text-white' }
];

// Configuración de la leyenda de concentración
export const CONCENTRATION_LEGEND = [
  { color: 'bg-gray-50 border', label: '0%' },
  { color: 'bg-blue-100', label: '1-9%' },
  { color: 'bg-blue-200', label: '10-24%' },
  { color: 'bg-blue-300', label: '25-49%' },
  { color: 'bg-blue-500', label: '50-74%' },
  { color: 'bg-blue-700', label: '75-100%' }
];

// Umbrales para interpretación de concentración
export const CONCENTRATION_THRESHOLDS = {
  VERY_HIGH: 50,
  HIGH: 25,
  MODERATE: 10,
  LOW: 0.1
};

// Mensajes de interpretación
export const CONCENTRATION_MESSAGES = {
  VERY_HIGH: 'Concentración muy alta',
  HIGH: 'Concentración alta',
  MODERATE: 'Concentración moderada',
  LOW: 'Concentración baja',
  NONE: 'Sin usuarios'
};

// Configuración de accesibilidad
export const ACCESSIBILITY_CONFIG = {
  FOCUS_RING: 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
  HOVER_SCALE: 'hover:scale-105',
  TRANSITION: 'transition-all duration-200 transform'
};

// Configuración de animaciones
export const ANIMATION_CONFIG = {
  LOADING_SPINNER: 'animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600',
  FADE_IN: 'transition-opacity duration-300',
  SLIDE_DOWN: 'transition-all duration-200 ease-in-out'
};

// Textos y etiquetas
export const LABELS = {
  TITLE: 'Matriz de Riesgo por Departamento',
  DEPARTMENT: 'Departamento',
  AVERAGE_RISK: 'Riesgo Promedio',
  CONCENTRATION_SCALE: 'Escala de Concentración',
  CALCULATION_INFO: 'Información sobre cálculos',
  SHOW_DETAILS: 'Ver detalles',
  HIDE_DETAILS: 'Ocultar detalles',
  CRITICAL_DEPARTMENTS: 'Departamentos Críticos',
  LOADING: 'Cargando matriz de riesgo...',
  ERROR_TITLE: 'Error al cargar los datos',
  ERROR_MESSAGE: 'No se pudo obtener la información para la matriz de riesgo.',
  NO_DATA: 'No hay datos suficientes para generar la matriz de riesgo con los filtros seleccionados.',
  DEPARTMENTS_COUNT: 'Departamentos',
  USERS_COUNT: 'Usuarios Evaluados',
  CRITICAL_POINTS_COUNT: 'Puntos Críticos'
};

// Configuración de cálculos
export const CALCULATION_CONFIG = {
  RISK_WEIGHT_DIVISOR: 500, // Para normalizar el cálculo de riesgo promedio
  PERCENTAGE_DECIMALS: 1,
  RISK_DECIMALS: 1
};

// Plantillas de recomendaciones dinámicas
export const RECOMMENDATION_TEMPLATES = {
  VERY_HIGH_CRITICAL: (dept, percentage) => [
    `🚨 Intervención crítica inmediata en ${dept}`,
    `📋 Evaluación psicológica individual para el ${percentage.toFixed(1)}% en riesgo muy alto`,
    `🏥 Activar protocolo de salud mental de emergencia`
  ],
  HIGH_PRIORITY: (dept, percentage) => [
    `⚠️ Programa de bienestar prioritario para ${dept}`,
    `👥 Sesiones grupales de apoyo psicológico`,
    `📊 Monitoreo semanal del ${percentage.toFixed(1)}% en riesgo alto`
  ],
  MODERATE_PREVENTIVE: (dept, percentage) => [
    `📈 Implementar estrategias preventivas en ${dept}`,
    `🎯 Talleres de manejo del estrés para el ${percentage.toFixed(1)}% en riesgo moderado`,
    `🔄 Revisión de cargas de trabajo y rotación de tareas`
  ],
  LOW_MAINTAIN: (dept) => [
    `✅ Mantener buenas prácticas en ${dept}`,
    `🌟 Usar como modelo para otros departamentos`,
    `📚 Documentar estrategias exitosas de bienestar`
  ]
};

// Configuración de umbrales para recomendaciones
export const RECOMMENDATION_THRESHOLDS = {
  VERY_HIGH_CRITICAL: 50,
  HIGH_PRIORITY: 30,
  MODERATE_PREVENTIVE: 40
};