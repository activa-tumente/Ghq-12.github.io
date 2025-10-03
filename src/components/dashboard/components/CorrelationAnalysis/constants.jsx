/**
 * Constantes de configuración para el análisis de correlaciones
 * Centraliza umbrales, colores, textos y configuraciones
 */

import { BsBarChart, BsLightning, BsGraphUp } from 'react-icons/bs';

// Umbrales para determinar la fuerza de correlación
export const CORRELATION_THRESHOLDS = {
  VERY_STRONG: 0.8,
  STRONG: 0.6,
  MODERATE: 0.4,
  WEAK: 0.2,
  VERY_WEAK: 0.0
};

// Niveles de fuerza de correlación
export const CORRELATION_STRENGTH = {
  VERY_STRONG: 'Muy Fuerte',
  STRONG: 'Fuerte', 
  MODERATE: 'Moderada',
  WEAK: 'Débil',
  VERY_WEAK: 'Muy Débil'
};

// Direcciones de correlación
export const CORRELATION_DIRECTION = {
  POSITIVE: 'Positiva',
  NEGATIVE: 'Negativa',
  NEUTRAL: 'Neutral'
};

// Colores para cada nivel de fuerza de correlación
export const CORRELATION_COLORS = {
  VERY_STRONG: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-300',
    hex: '#dc2626'
  },
  STRONG: {
    bg: 'bg-orange-100',
    text: 'text-orange-800', 
    border: 'border-orange-300',
    hex: '#ea580c'
  },
  MODERATE: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-300', 
    hex: '#ca8a04'
  },
  WEAK: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-300',
    hex: '#2563eb'
  },
  VERY_WEAK: {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    border: 'border-gray-300',
    hex: '#6b7280'
  }
};

// Iconos para direcciones de correlación
export const DIRECTION_ICONS = {
  POSITIVE: '↗️',
  NEGATIVE: '↘️', 
  NEUTRAL: '➡️'
};

// Configuración de correlaciones a analizar
export const CORRELATION_CONFIGS = [
  {
    id: 'antiguedadVsRiesgo',
    title: 'Antigüedad vs Riesgo Psicológico',
    description: 'Relación entre años de experiencia y nivel de riesgo psicológico',
    variables: ['antiguedad', 'puntajeNormalizado'],
    category: 'experiencia'
  },
  {
    id: 'confianzaVsSatisfaccion', 
    title: 'Confianza vs Satisfacción',
    description: 'Relación entre confianza en la gerencia y satisfacción laboral',
    variables: ['confianza', 'satisfaccion'],
    category: 'organizacional'
  },
  {
    id: 'educacionVsRiesgo',
    title: 'Educación vs Riesgo Psicológico', 
    description: 'Impacto del nivel educativo en la vulnerabilidad psicosocial',
    variables: ['educacion', 'puntajeNormalizado'],
    category: 'demografica'
  },
  {
    id: 'motivacionVsRiesgo',
    title: 'Motivación vs Riesgo Psicológico',
    description: 'Relación entre motivación en seguridad y bienestar psicológico',
    variables: ['motivacion', 'puntajeNormalizado'], 
    category: 'motivacional'
  },
  {
    id: 'edadVsRiesgo',
    title: 'Edad vs Riesgo Psicológico',
    description: 'Relación entre edad y nivel de riesgo psicológico',
    variables: ['edad', 'puntajeNormalizado'],
    category: 'demografica'
  },
  {
    id: 'generoVsMotivacion',
    title: 'Género vs Motivación',
    description: 'Diferencias de motivación en seguridad por género',
    variables: ['genero', 'motivacion'],
    category: 'demografica'
  }
];

// Guía de interpretación de correlaciones
export const INTERPRETATION_GUIDE = [
  {
    value: '+1.0',
    description: 'Correlación positiva perfecta',
    example: 'Cuando una variable aumenta, la otra siempre aumenta proporcionalmente'
  },
  {
    value: '-1.0', 
    description: 'Correlación negativa perfecta',
    example: 'Cuando una variable aumenta, la otra siempre disminuye proporcionalmente'
  },
  {
    value: '0.0',
    description: 'Sin correlación',
    example: 'No existe relación lineal entre las variables'
  },
  {
    value: '±0.7-1.0',
    description: 'Correlación fuerte',
    example: 'Relación muy evidente entre las variables'
  },
  {
    value: '±0.3-0.7',
    description: 'Correlación moderada',
    example: 'Relación notable pero con variabilidad'
  },
  {
    value: '±0.1-0.3',
    description: 'Correlación débil',
    example: 'Relación leve, puede ser por casualidad'
  }
];

// Insights clave predefinidos
export const KEY_INSIGHTS = [
  {
    icon: '🏢',
    title: 'Confianza Organizacional',
    description: 'La confianza organizacional es el factor más influyente en satisfacción y motivación',
    impact: 'high'
  },
  {
    icon: '⏰',
    title: 'Antigüedad Laboral',
    description: 'La antigüedad laboral muestra efecto protector contra el estrés psicológico',
    impact: 'medium'
  },
  {
    icon: '🎓',
    title: 'Nivel Educativo',
    description: 'El nivel educativo es determinante en la vulnerabilidad psicosocial',
    impact: 'high'
  },
  {
    icon: '👥',
    title: 'Diferencias de Género',
    description: 'Existen diferencias significativas en percepción de seguridad por género',
    impact: 'medium'
  }
];

// Configuración de estadísticas resumidas
export const STATS_CONFIG = {
  totalCorrelations: {
    label: 'Correlaciones analizadas',
    icon: <BsBarChart />
  },
  strongCorrelations: {
    label: 'Correlaciones fuertes',
    icon: <BsLightning />,
    threshold: [CORRELATION_STRENGTH.STRONG, CORRELATION_STRENGTH.VERY_STRONG]
  },
  averageCorrelation: {
    label: 'Correlación promedio',
    icon: <BsGraphUp />
  }
};

// Configuración de accesibilidad
export const ACCESSIBILITY_CONFIG = {
  correlationCard: {
    role: 'article',
    ariaLabelTemplate: 'Correlación entre {variable1} y {variable2}: {value}, fuerza {strength}'
  },
  progressBar: {
    role: 'progressbar',
    ariaLabelTemplate: 'Fuerza de correlación: {percentage}%'
  },
  insightsList: {
    role: 'list',
    ariaLabel: 'Lista de insights clave del análisis de correlaciones'
  }
};

// Configuración de animaciones
export const ANIMATION_CONFIG = {
  cardHover: 'transition-all duration-300 hover:scale-105 hover:shadow-md',
  fadeIn: 'animate-fade-in',
  slideUp: 'animate-slide-up',
  pulse: 'animate-pulse'
};

export default {
  CORRELATION_THRESHOLDS,
  CORRELATION_STRENGTH,
  CORRELATION_DIRECTION,
  CORRELATION_COLORS,
  DIRECTION_ICONS,
  CORRELATION_CONFIGS,
  INTERPRETATION_GUIDE,
  KEY_INSIGHTS,
  STATS_CONFIG,
  ACCESSIBILITY_CONFIG,
  ANIMATION_CONFIG
};