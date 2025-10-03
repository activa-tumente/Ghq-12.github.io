/**
 * Métricas para Mapa de Calor GHQ-12
 * Sistema de Evaluación Psicológica BAT-7
 * 
 * Implementa el cálculo de distribución de respuestas por pregunta
 * para visualización en mapa de calor 12x4 (preguntas × opciones de respuesta)
 */

import { GHQ12_CONFIG } from './ghq12Calculator.js'

// ===========================================
// CONFIGURACIÓN DEL MAPA DE CALOR
// ===========================================

export const HEATMAP_CONFIG = {
  // Preguntas GHQ-12 con sus textos descriptivos
  QUESTIONS: [
    { id: 1, text: "¿Ha podido concentrarse bien en lo que hace?", dimension: "Concentración", type: "positive" },
    { id: 2, text: "¿Sus preocupaciones le han hecho perder mucho sueño?", dimension: "Sueño", type: "negative" },
    { id: 3, text: "¿Ha sentido que está jugando un papel útil en la vida?", dimension: "Autoestima", type: "positive" },
    { id: 4, text: "¿Se ha sentido capaz de tomar decisiones?", dimension: "Decisiones", type: "positive" },
    { id: 5, text: "¿Se ha sentido constantemente agobiado y en tensión?", dimension: "Estrés", type: "negative" },
    { id: 6, text: "¿Ha sentido que no puede superar sus dificultades?", dimension: "Afrontamiento", type: "negative" },
    { id: 7, text: "¿Ha sido capaz de disfrutar sus actividades normales de cada día?", dimension: "Disfrute", type: "positive" },
    { id: 8, text: "¿Ha sido capaz de hacer frente a sus problemas?", dimension: "Problemas", type: "positive" },
    { id: 9, text: "¿Se ha sentido poco feliz y deprimido?", dimension: "Estado de ánimo", type: "negative" },
    { id: 10, text: "¿Ha perdido confianza en sí mismo?", dimension: "Confianza", type: "negative" },
    { id: 11, text: "¿Ha pensado que usted es una persona que no vale para nada?", dimension: "Autoestima", type: "negative" },
    { id: 12, text: "¿Se siente razonablemente feliz considerando todas las circunstancias?", dimension: "Felicidad", type: "positive" }
  ],

  // Opciones de respuesta
  RESPONSE_OPTIONS: [
    { value: 0, label: "Nunca", shortLabel: "Nunca" },
    { value: 1, label: "Casi Nunca", shortLabel: "C. Nunca" },
    { value: 2, label: "Casi Siempre", shortLabel: "C. Siempre" },
    { value: 3, label: "Siempre", shortLabel: "Siempre" }
  ],

  // Preguntas negativas (requieren inversión para el cálculo de riesgo)
  NEGATIVE_QUESTIONS: GHQ12_CONFIG.POSITIVE_QUESTIONS.filter(q => !GHQ12_CONFIG.POSITIVE_QUESTIONS.includes(q)),
  
  // Preguntas positivas
  POSITIVE_QUESTIONS: GHQ12_CONFIG.POSITIVE_QUESTIONS
}

// ===========================================
// FUNCIÓN PRINCIPAL: DISTRIBUCIÓN DE RESPUESTAS
// ===========================================

/**
 * Calcula la distribución de respuestas por pregunta para el mapa de calor
 * @param {Array} responses - Array de respuestas del cuestionario
 * @param {string} groupBy - Campo para agrupar (departamento, turno, etc.)
 * @returns {Object} Datos formateados para el mapa de calor
 */
export const calculateResponseDistribution = (responses, groupBy = 'departamento') => {
  if (!responses || responses.length === 0) {
    return {
      questions: [],
      groups: [],
      matrix: [],
      summary: {
        totalResponses: 0,
        totalQuestions: 12,
        totalGroups: 0
      }
    }
  }

  // 1. Procesar respuestas y extraer datos demográficos
  const processedData = responses.map(response => {
    const demographics = extractDemographics(response.usuarios?.metadata || {})
    const groupValue = demographics[groupBy] || 'Sin especificar'
    
    // Extraer respuestas individuales (q1-q12)
    const questionResponses = {}
    for (let i = 1; i <= 12; i++) {
      const questionKey = `q${i}`
      questionResponses[questionKey] = response.respuestas?.[questionKey] || 0
    }

    return {
      group: groupValue,
      responses: questionResponses
    }
  })

  // 2. Obtener grupos únicos
  const uniqueGroups = [...new Set(processedData.map(item => item.group))].sort()

  // 3. Calcular distribución para cada pregunta
  const questionsData = HEATMAP_CONFIG.QUESTIONS.map(question => {
    const questionKey = `q${question.id}`
    
    // Calcular distribución por grupo
    const groupsData = uniqueGroups.map(group => {
      const groupResponses = processedData
        .filter(item => item.group === group)
        .map(item => item.responses[questionKey])
        .filter(response => response !== undefined && response !== null)

      // Contar frecuencia de cada opción de respuesta (0, 1, 2, 3)
      const distribution = [0, 1, 2, 3].map(option => {
        const count = groupResponses.filter(response => response === option).length
        const percentage = groupResponses.length > 0 ? (count / groupResponses.length) * 100 : 0
        
        return {
          option,
          count,
          percentage: parseFloat(percentage.toFixed(2)),
          isRisk: isRiskResponse(question.type, option)
        }
      })

      // Calcular métricas adicionales
      const totalResponses = groupResponses.length
      const averageResponse = totalResponses > 0 
        ? groupResponses.reduce((sum, val) => sum + val, 0) / totalResponses 
        : 0
      
      // Calcular porcentaje de respuestas de riesgo
      const riskResponses = groupResponses.filter(response => 
        isRiskResponse(question.type, response)
      ).length
      const riskPercentage = totalResponses > 0 ? (riskResponses / totalResponses) * 100 : 0

      return {
        group,
        distribution,
        totalResponses,
        averageResponse: parseFloat(averageResponse.toFixed(2)),
        riskPercentage: parseFloat(riskPercentage.toFixed(2))
      }
    })

    return {
      questionId: question.id,
      questionText: question.text,
      dimension: question.dimension,
      type: question.type,
      groups: groupsData
    }
  })

  // 4. Crear matriz para visualización (12 preguntas × 4 opciones × N grupos)
  const matrix = createHeatmapMatrix(questionsData, uniqueGroups)

  // 5. Calcular resumen estadístico
  const summary = calculateSummaryStats(questionsData, processedData.length)

  return {
    questions: questionsData,
    groups: uniqueGroups,
    matrix,
    summary,
    config: {
      groupBy,
      timestamp: new Date().toISOString(),
      questionsConfig: HEATMAP_CONFIG.QUESTIONS,
      responseOptions: HEATMAP_CONFIG.RESPONSE_OPTIONS
    }
  }
}

// ===========================================
// FUNCIONES AUXILIARES
// ===========================================

/**
 * Determina si una respuesta representa riesgo según el tipo de pregunta
 * @param {string} questionType - 'positive' o 'negative'
 * @param {number} responseValue - Valor de respuesta (0-3)
 * @returns {boolean} True si representa riesgo
 */
const isRiskResponse = (questionType, responseValue) => {
  if (questionType === 'negative') {
    // Para preguntas negativas, valores altos (2-3) indican riesgo
    return responseValue >= 2
  } else {
    // Para preguntas positivas, valores bajos (0-1) indican riesgo
    return responseValue <= 1
  }
}

/**
 * Mapea roles/departamentos específicos a las 8 áreas macro definidas
 * @param {string} role - Rol o departamento específico del usuario
 * @returns {string} - Área macro correspondiente
 */
const mapRoleToMacroArea = (role) => {
  if (!role || typeof role !== 'string') return 'Sin especificar';

  const roleUpper = role.toUpperCase().trim();

  // Administración y Recursos Humanos
  if (roleUpper.includes('ADMINISTRACIÓN') || roleUpper.includes('ADMINISTRADOR') ||
      roleUpper.includes('RRHH') || roleUpper.includes('RECURSOS HUMANOS') ||
      roleUpper.includes('FINANZAS') || roleUpper.includes('CONTABILIDAD') ||
      roleUpper.includes('ASISTENTE ADMINISTRATIVO') || roleUpper.includes('SECRETARIA') ||
      roleUpper.includes('TESORERÍA') || roleUpper.includes('NÓMINA')) {
    return 'Administración y Recursos Humanos';
  }

  // Ingeniería y Proyectos
  if (roleUpper.includes('INGENIERO') || roleUpper.includes('INGENIERÍA') ||
      roleUpper.includes('PROYECTOS') || roleUpper.includes('COORDINADOR DE ÁREA') ||
      roleUpper.includes('DISEÑO') || roleUpper.includes('PLANIFICACIÓN') ||
      roleUpper.includes('DESARROLLO') || roleUpper.includes('TÉCNICO ESPECIALISTA')) {
    return 'Ingeniería y Proyectos';
  }

  // Operaciones y Mantenimiento
  if (roleUpper.includes('OPERACIÓN') || roleUpper.includes('OPERADOR') ||
      roleUpper.includes('MANTENIMIENTO') || roleUpper.includes('MECÁNICO') ||
      roleUpper.includes('ELECTRICISTA') || roleUpper.includes('AYUDANTE DE MÁQUINA') ||
      roleUpper.includes('SOLDADOR') || roleUpper.includes('TÉCNICO DE MANTENIMIENTO') ||
      roleUpper.includes('SUPERVISOR DE OPERACIONES') || roleUpper.includes('PRODUCCIÓN')) {
    return 'Operaciones y Mantenimiento';
  }

  // Seguridad, Salud y Medio Ambiente (HSE)
  if (roleUpper.includes('SEGURIDAD') || roleUpper.includes('HSE') ||
      roleUpper.includes('SALUD OCUPACIONAL') || roleUpper.includes('MEDIO AMBIENTE') ||
      roleUpper.includes('PREVENCIONISTA') || roleUpper.includes('INSPECTOR DE SEGURIDAD') ||
      roleUpper.includes('COORDINADOR DE SEGURIDAD') || roleUpper.includes('HIGIENE INDUSTRIAL')) {
    return 'Seguridad, Salud y Medio Ambiente (HSE)';
  }

  // Logística y Suministros
  if (roleUpper.includes('LOGÍSTICA') || roleUpper.includes('SUMINISTROS') ||
      roleUpper.includes('ALMACÉN') || roleUpper.includes('INVENTARIO') ||
      roleUpper.includes('COMPRAS') || roleUpper.includes('PROCUREMENT') ||
      roleUpper.includes('BODEGA') || roleUpper.includes('DISTRIBUCIÓN')) {
    return 'Logística y Suministros';
  }

  // Servicios y Soporte
  if (roleUpper.includes('VIGILANTE') || roleUpper.includes('CHOFER') ||
      roleUpper.includes('SERVICIOS') || roleUpper.includes('LIMPIEZA') ||
      roleUpper.includes('JARDINERÍA') || roleUpper.includes('COCINA') ||
      roleUpper.includes('MENSAJERÍA') || roleUpper.includes('RECEPCIÓN') ||
      roleUpper.includes('PORTERÍA') || roleUpper.includes('TRANSPORTE')) {
    return 'Servicios y Soporte';
  }

  // Calidad y Control
  if (roleUpper.includes('CALIDAD') || roleUpper.includes('CONTROL') ||
      roleUpper.includes('INSPECTOR') || roleUpper.includes('AUDITOR') ||
      roleUpper.includes('LABORATORIO') || roleUpper.includes('ENSAYOS') ||
      roleUpper.includes('CERTIFICACIÓN') || roleUpper.includes('METROLOGÍA')) {
    return 'Calidad y Control';
  }

  // Gerencia/Dirección
  if (roleUpper.includes('GERENTE') || roleUpper.includes('DIRECTOR') ||
      roleUpper.includes('JEFE') || roleUpper.includes('COORDINADOR GENERAL') ||
      roleUpper.includes('SUPERINTENDENTE') || roleUpper.includes('LÍDER') ||
      roleUpper.includes('SUPERVISOR GENERAL') || roleUpper.includes('EJECUTIVO')) {
    return 'Gerencia/Dirección';
  }

  // Si no coincide con ninguna categoría, devolver una categoría por defecto
  return 'Servicios y Soporte'; // Categoría por defecto para roles no clasificados
};

/**
 * Extrae datos demográficos del metadata del usuario
 * @param {Object} metadata - Metadata del usuario
 * @returns {Object} Datos demográficos estructurados
 */
const extractDemographics = (metadata) => {
  // Obtener el rol/departamento original
  const originalDepartment = metadata?.departamento || metadata?.area || metadata?.rol || 'Sin especificar';

  // Mapear a área macro
  const macroArea = mapRoleToMacroArea(originalDepartment);

  return {
    departamento: macroArea, // Ahora usa el área macro
    departamento_original: originalDepartment, // Mantener el original para referencia
    turno: metadata?.turno || metadata?.horario || 'Sin especificar',
    genero: metadata?.genero || metadata?.sexo || 'Sin especificar',
    tipo_contrato: metadata?.tipo_contrato || metadata?.tipoContrato || 'Sin especificar',
    antiguedad: metadata?.antiguedad || metadata?.experiencia || 'Sin especificar'
  }
}

/**
 * Crea la matriz de datos para el mapa de calor
 * @param {Array} questionsData - Datos procesados por pregunta
 * @param {Array} groups - Lista de grupos únicos
 * @returns {Array} Matriz de datos para visualización
 */
const createHeatmapMatrix = (questionsData, groups) => {
  const matrix = []

  questionsData.forEach(question => {
    groups.forEach(group => {
      const groupData = question.groups.find(g => g.group === group)
      
      if (groupData) {
        // Crear una fila por cada opción de respuesta
        groupData.distribution.forEach(option => {
          matrix.push({
            questionId: question.questionId,
            questionText: question.questionText,
            dimension: question.dimension,
            questionType: question.type,
            group: group,
            responseOption: option.option,
            responseLabel: HEATMAP_CONFIG.RESPONSE_OPTIONS[option.option].label,
            count: option.count,
            percentage: option.percentage,
            isRisk: option.isRisk,
            totalResponses: groupData.totalResponses,
            // Intensidad para el color (0-1)
            intensity: option.percentage / 100,
            // Intensidad de riesgo (más alta para respuestas de riesgo)
            riskIntensity: option.isRisk ? option.percentage / 100 : 0
          })
        })
      }
    })
  })

  return matrix
}

/**
 * Calcula estadísticas de resumen
 * @param {Array} questionsData - Datos procesados por pregunta
 * @param {number} totalResponses - Total de respuestas
 * @returns {Object} Estadísticas de resumen
 */
const calculateSummaryStats = (questionsData, totalResponses) => {
  const allRiskPercentages = questionsData.flatMap(q => 
    q.groups.map(g => g.riskPercentage)
  ).filter(p => p > 0)

  return {
    totalResponses,
    totalQuestions: questionsData.length,
    totalGroups: questionsData[0]?.groups.length || 0,
    averageRiskPercentage: allRiskPercentages.length > 0 
      ? parseFloat((allRiskPercentages.reduce((sum, p) => sum + p, 0) / allRiskPercentages.length).toFixed(2))
      : 0,
    maxRiskPercentage: allRiskPercentages.length > 0 ? Math.max(...allRiskPercentages) : 0,
    minRiskPercentage: allRiskPercentages.length > 0 ? Math.min(...allRiskPercentages) : 0,
    questionsWithHighRisk: questionsData.filter(q => 
      q.groups.some(g => g.riskPercentage > 50)
    ).length
  }
}

// ===========================================
// FUNCIONES PARA COLORES DEL MAPA DE CALOR
// ===========================================

/**
 * Obtiene el color para una celda del mapa de calor basado en el riesgo
 * @param {number} riskIntensity - Intensidad de riesgo (0-1)
 * @param {boolean} isRisk - Si la respuesta representa riesgo
 * @returns {string} Color en formato HSL
 */
export const getHeatmapColor = (riskIntensity, isRisk = false) => {
  if (!isRisk || riskIntensity === 0) {
    // Tonos neutros para respuestas sin riesgo
    return `hsl(200, 20%, ${95 - (riskIntensity * 10)}%)`
  }

  // Gradiente de riesgo: amarillo → naranja → rojo
  const hue = 60 - (riskIntensity * 60) // 60° (amarillo) a 0° (rojo)
  const saturation = 70 + (riskIntensity * 25) // 70-95%
  const lightness = 75 - (riskIntensity * 25) // 75-50%

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

/**
 * Obtiene el color del texto para una celda del mapa de calor
 * @param {number} riskIntensity - Intensidad de riesgo (0-1)
 * @param {boolean} isRisk - Si la respuesta representa riesgo
 * @returns {string} Color del texto
 */
export const getHeatmapTextColor = (riskIntensity, isRisk = false) => {
  if (!isRisk || riskIntensity < 0.6) {
    return '#1f2937' // Texto oscuro
  }
  return '#ffffff' // Texto blanco para fondos oscuros
}

export default {
  calculateResponseDistribution,
  getHeatmapColor,
  getHeatmapTextColor,
  HEATMAP_CONFIG
}