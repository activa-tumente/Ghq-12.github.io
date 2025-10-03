/**
 * Utilidades para ayudar con el formato de datos del cuestionario GHQ-12
 * Ayuda a diagnosticar y corregir problemas de formato en la base de datos
 */

/**
 * Verifica si las respuestas tienen el formato correcto para GHQ-12
 * @param {Object} respuestas - Objeto de respuestas a verificar
 * @returns {Object} - Resultado de la verificación con detalles
 */
export function validateResponseFormat(respuestas) {
  const result = {
    isValid: false,
    format: 'unknown',
    issues: [],
    suggestions: []
  }

  if (!respuestas || typeof respuestas !== 'object') {
    result.issues.push('Las respuestas no son un objeto válido')
    result.suggestions.push('Asegúrese de que el campo "respuestas" contenga un objeto JSON')
    return result
  }

  const keys = Object.keys(respuestas)
  const expectedKeys = Array.from({ length: 12 }, (_, i) => `q${i + 1}`)
  
  // Verificar formato q1-q12
  const hasQ1ToQ12 = expectedKeys.every(key => respuestas.hasOwnProperty(key))
  const hasAnyQ = expectedKeys.some(key => respuestas.hasOwnProperty(key))
  
  if (hasQ1ToQ12) {
    result.isValid = true
    result.format = 'q1-q12'
    
    // Verificar valores
    for (const key of expectedKeys) {
      const value = respuestas[key]
      if (value === undefined || value === null) {
        result.issues.push(`Pregunta ${key} está vacía`)
      } else if (isNaN(Number(value)) || Number(value) < 0 || Number(value) > 3) {
        result.issues.push(`Pregunta ${key} tiene valor inválido: ${value} (debe ser 0-3)`)
      }
    }
    
    if (result.issues.length === 0) {
      result.suggestions.push('Formato correcto: todas las preguntas q1-q12 están presentes con valores válidos')
    }
  } else if (hasAnyQ) {
    result.format = 'q1-q12-partial'
    result.issues.push('Faltan algunas preguntas del formato q1-q12')
    
    const missingKeys = expectedKeys.filter(key => !respuestas.hasOwnProperty(key))
    result.suggestions.push(`Agregar las preguntas faltantes: ${missingKeys.join(', ')}`)
  } else {
    // Verificar otros formatos posibles
    const numericKeys = keys.filter(key => !isNaN(Number(key)))
    const hasNumericKeys = numericKeys.length > 0
    
    if (hasNumericKeys) {
      result.format = 'numeric-keys'
      result.issues.push('Las respuestas usan claves numéricas en lugar de q1-q12')
      result.suggestions.push('Convertir claves numéricas a formato q1-q12 (ej: "1" → "q1")')
    } else {
      result.format = 'unknown'
      result.issues.push('Formato de respuestas no reconocido')
      result.suggestions.push('Las respuestas deben tener el formato: {"q1": 0, "q2": 1, ..., "q12": 2}')
    }
  }

  return result
}

/**
 * Intenta convertir respuestas de diferentes formatos al formato estándar q1-q12
 * @param {Object} respuestas - Respuestas en formato desconocido
 * @returns {Object} - Respuestas convertidas al formato q1-q12 o null si no es posible
 */
export function normalizeResponseFormat(respuestas) {
  if (!respuestas || typeof respuestas !== 'object') {
    return null
  }

  const validation = validateResponseFormat(respuestas)
  
  if (validation.isValid && validation.format === 'q1-q12') {
    return respuestas // Ya está en el formato correcto
  }

  const normalized = {}
  
  // Intentar conversión desde claves numéricas
  if (validation.format === 'numeric-keys') {
    for (let i = 1; i <= 12; i++) {
      const numericKey = String(i)
      const qKey = `q${i}`
      
      if (respuestas.hasOwnProperty(numericKey)) {
        normalized[qKey] = respuestas[numericKey]
      } else if (respuestas.hasOwnProperty(i)) {
        normalized[qKey] = respuestas[i]
      }
    }
    
    // Verificar si la conversión fue exitosa
    const convertedValidation = validateResponseFormat(normalized)
    if (convertedValidation.isValid) {
      return normalized
    }
  }

  return null // No se pudo convertir
}

/**
 * Genera un ejemplo de formato correcto para las respuestas
 * @returns {Object} - Ejemplo de respuestas en formato correcto
 */
export function getResponseFormatExample() {
  const example = {}
  for (let i = 1; i <= 12; i++) {
    example[`q${i}`] = Math.floor(Math.random() * 4) // Valores aleatorios 0-3
  }
  return example
}

/**
 * Genera SQL para verificar el formato de datos en la base de datos
 * @param {string} tableName - Nombre de la tabla
 * @returns {string} - Query SQL para diagnóstico
 */
export function generateDiagnosticSQL(tableName = 'respuestas_cuestionario') {
  return `
-- Diagnóstico de formato de respuestas GHQ-12
SELECT 
  id,
  respuestas,
  CASE 
    WHEN respuestas IS NULL THEN 'NULL'
    WHEN jsonb_typeof(respuestas) != 'object' THEN 'NOT_OBJECT'
    WHEN respuestas ? 'q1' AND respuestas ? 'q12' THEN 'Q1_Q12_FORMAT'
    WHEN respuestas ? '1' AND respuestas ? '12' THEN 'NUMERIC_FORMAT'
    ELSE 'UNKNOWN_FORMAT'
  END as formato_detectado,
  jsonb_object_keys(respuestas) as claves_encontradas
FROM ${tableName}
WHERE respuestas IS NOT NULL
LIMIT 10;

-- Contar formatos
SELECT 
  CASE 
    WHEN respuestas IS NULL THEN 'NULL'
    WHEN jsonb_typeof(respuestas) != 'object' THEN 'NOT_OBJECT'
    WHEN respuestas ? 'q1' AND respuestas ? 'q12' THEN 'Q1_Q12_FORMAT'
    WHEN respuestas ? '1' AND respuestas ? '12' THEN 'NUMERIC_FORMAT'
    ELSE 'UNKNOWN_FORMAT'
  END as formato,
  COUNT(*) as cantidad
FROM ${tableName}
GROUP BY formato;
  `.trim()
}

export default {
  validateResponseFormat,
  normalizeResponseFormat,
  getResponseFormatExample,
  generateDiagnosticSQL
}