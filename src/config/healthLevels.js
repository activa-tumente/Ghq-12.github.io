/**
 * Health Level Configuration
 * Centralized configuration for health levels used across the application
 */

import { AlertTriangle, CheckCircle, AlertCircle, XCircle } from 'lucide-react'

export const HEALTH_LEVELS = {
  bajo: {
   label: 'Bajo',
   description: 'Estado aceptable de salud mental',
   emoji: '🟢',
   bgColor: 'bg-green-100',
   textColor: 'text-green-800',
   borderColor: 'border-green-200',
   icon: CheckCircle,
   iconColor: 'text-green-600',
   // Additional styling for different contexts
   badgeColor: 'bg-green-100 text-green-800 border-green-200',
   threshold: { min: 0, max: 12 }
 },
 moderado: {
   label: 'Moderado',
   description: 'Estado de alerta - requiere atención',
   emoji: '🟡',
   bgColor: 'bg-yellow-100',
   textColor: 'text-yellow-800',
   borderColor: 'border-yellow-200',
   icon: AlertCircle,
   iconColor: 'text-yellow-600',
   badgeColor: 'bg-yellow-100 text-yellow-800 border-yellow-200',
   threshold: { min: 13, max: 24 }
 },
 alto: {
   label: 'Alto',
   description: 'Estado alterado - requiere intervención',
   emoji: '🟠',
   bgColor: 'bg-orange-100',
   textColor: 'text-orange-800',
   borderColor: 'border-orange-200',
   icon: AlertTriangle,
   iconColor: 'text-orange-600',
   badgeColor: 'bg-orange-100 text-orange-800 border-orange-200',
   threshold: { min: 25, max: 36 }
 },
  sin_datos: {
    label: 'Sin Datos',
    description: 'No hay respuestas disponibles',
    emoji: '⚪',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    borderColor: 'border-gray-200',
    icon: AlertCircle,
    iconColor: 'text-gray-600',
    badgeColor: 'bg-gray-100 text-gray-800 border-gray-200',
    threshold: { min: 0, max: 0 }
  }
}

/**
 * Calculate health level based on GHQ-12 responses
 * @param {Array} responses - Array of response objects with 'respuesta' property
 * @returns {Object} - Object with 'nivel' and 'puntuacion' properties
 */
export const calculateHealthLevel = (responses) => {
  if (!responses || responses.length === 0) {
    return { nivel: 'sin_datos', puntuacion: 0 }
  }

  // Sum all responses (0-3 each, maximum 36 for GHQ-12)
  const totalScore = responses.reduce((sum, resp) => sum + (resp.respuesta || 0), 0)

  // Classify according to GHQ-12 total score (corrected ranges)
  if (totalScore <= 12) {
    return { nivel: 'bajo', puntuacion: totalScore }
  } else if (totalScore <= 24) {
    return { nivel: 'moderado', puntuacion: totalScore }
  } else {
    return { nivel: 'alto', puntuacion: totalScore }
  }
}

/**
 * Get health level configuration by level key
 * @param {string} level - Health level key
 * @returns {Object} - Health level configuration object
 */
export const getHealthLevelConfig = (level) => {
  return HEALTH_LEVELS[level] || HEALTH_LEVELS.sin_datos
}

/**
 * Get all health level keys
 * @returns {Array} - Array of health level keys
 */
export const getHealthLevelKeys = () => {
  return Object.keys(HEALTH_LEVELS)
}

/**
 * Get health levels for filtering (excluding 'sin_datos')
 * @returns {Array} - Array of health level objects for filtering
 */
export const getFilterableHealthLevels = () => {
  return Object.entries(HEALTH_LEVELS)
    .filter(([key]) => key !== 'sin_datos')
    .map(([key, config]) => ({ key, ...config }))
}

/**
 * Calculate statistics for health levels
 * @param {Array} responses - Array of response objects
 * @returns {Object} - Statistics object with counts and percentages
 */
export const calculateHealthLevelStats = (responses) => {
  const stats = {
    total: responses.length,
    levels: {}
  }

  // Initialize all levels with 0 count
  Object.keys(HEALTH_LEVELS).forEach(level => {
    stats.levels[level] = {
      count: 0,
      percentage: 0,
      config: HEALTH_LEVELS[level]
    }
  })

  // Count responses by level
  responses.forEach(response => {
    const level = response.nivel || 'sin_datos'
    if (stats.levels[level]) {
      stats.levels[level].count++
    }
  })

  // Calculate percentages
  Object.keys(stats.levels).forEach(level => {
    stats.levels[level].percentage = stats.total > 0 
      ? Math.round((stats.levels[level].count / stats.total) * 100)
      : 0
  })

  return stats
}

/**
 * Validate if a score falls within a specific health level range
 * @param {number} score - The score to validate
 * @param {string} level - The health level to check against
 * @returns {boolean} - True if score falls within the level's range
 */
export const isScoreInLevel = (score, level) => {
  const config = HEALTH_LEVELS[level]
  if (!config || !config.threshold) return false
  
  return score >= config.threshold.min && score <= config.threshold.max
}

export default HEALTH_LEVELS