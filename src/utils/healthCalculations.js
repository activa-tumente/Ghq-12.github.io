/**
 * Health level calculation utilities for GHQ-12 questionnaire
 */

import { CheckCircle, AlertTriangle, AlertCircle, XCircle } from 'lucide-react';

export const HEALTH_LEVELS = {
  bajo: {
    label: 'Bajo',
    description: 'Estado aceptable',
    color: 'bg-green-100 text-green-800 border-green-200',
    iconColor: 'text-green-600',
    emoji: '🟢',
    icon: CheckCircle
  },
  moderado: {
    label: 'Moderado',
    description: 'Estado de alerta',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    iconColor: 'text-yellow-600',
    emoji: '🟡',
    icon: AlertTriangle
  },
  alto: {
    label: 'Alto',
    description: 'Estado alterado',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    iconColor: 'text-orange-600',
    emoji: '🟠',
    icon: AlertCircle
  },
  muy_alto: {
    label: 'Muy Alto',
    description: 'Estado restringido',
    color: 'bg-red-100 text-red-800 border-red-200',
    iconColor: 'text-red-600',
    emoji: '🔴',
    icon: XCircle
  },
  sin_datos: {
    label: 'Sin Datos',
    description: 'No hay respuestas disponibles',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    iconColor: 'text-gray-600',
    emoji: '⚪',
    icon: XCircle
  }
};

/**
 * Calculate health level based on GHQ-12 responses
 * @param {Array} respuestasData - Array of response objects
 * @returns {Object} Health level and score
 */
export const calcularNivelSalud = (respuestasData) => {
  if (!respuestasData || respuestasData.length === 0) {
    return { nivel: 'sin_datos', puntuacion: 0 };
  }

  // Sum all responses (0-3 each, max 36 for GHQ-12)
  const puntuacionTotal = respuestasData.reduce((sum, resp) => sum + (resp.respuesta || 0), 0);

  // Classify according to GHQ-12 total score
  if (puntuacionTotal <= 9) {
    return { nivel: 'bajo', puntuacion: puntuacionTotal };
  } else if (puntuacionTotal <= 18) {
    return { nivel: 'moderado', puntuacion: puntuacionTotal };
  } else if (puntuacionTotal <= 27) {
    return { nivel: 'alto', puntuacion: puntuacionTotal };
  } else {
    return { nivel: 'muy_alto', puntuacion: puntuacionTotal };
  }
};

/**
 * Get health level configuration
 * @param {string} nivel - Health level key
 * @returns {Object} Health level configuration
 */
export const getHealthLevelConfig = (nivel) => {
  return HEALTH_LEVELS[nivel] || HEALTH_LEVELS.sin_datos;
};