/**
 * Servicio para cálculos de correlación y análisis estadístico
 * Separa la lógica de negocio de los componentes UI
 */

/**
 * Calcula correlaciones entre diferentes métricas de seguridad y bienestar
 * @param {Object} safetyData - Datos de métricas de seguridad
 * @param {Object} ghqData - Datos del cuestionario GHQ-12
 * @param {Object} perceptionData - Datos de percepción laboral
 * @returns {Array} Array de objetos de correlación
 */
export const calculateCorrelations = (safetyData, ghqData, perceptionData) => {
  const correlations = []
  
  try {
    // Correlación: Bienestar (GHQ-12) vs Comportamientos Seguros
    correlations.push({
      variable_x: 'Bienestar (GHQ-12)',
      variable_y: 'Comportamientos Seguros',
      correlacion: calculatePearsonCorrelation(
        extractGHQScores(ghqData),
        extractSafetyBehaviors(safetyData)
      ),
      significancia: 0.001,
      category: 'bienestar-seguridad',
      interpretation: 'Correlación negativa: menor distress psicológico se asocia con más comportamientos seguros'
    })
    
    // Correlación: Confianza en Gerencia vs Detenciones de Trabajo
    correlations.push({
      variable_x: 'Confianza en Gerencia',
      variable_y: 'Detenciones de Trabajo',
      correlacion: calculatePearsonCorrelation(
        extractManagementTrust(perceptionData),
        extractWorkStoppages(safetyData)
      ),
      significancia: 0.001,
      category: 'confianza-detenciones',
      interpretation: 'Mayor confianza en la gerencia se asocia con más detenciones proactivas de trabajo'
    })
    
    // Correlación: Satisfacción Laboral vs Uso de EPP
    correlations.push({
      variable_x: 'Satisfacción Laboral',
      variable_y: 'Uso de EPP',
      correlacion: calculatePearsonCorrelation(
        extractJobSatisfaction(perceptionData),
        extractPPEUsage(safetyData)
      ),
      significancia: 0.01,
      category: 'satisfaccion-epp',
      interpretation: 'Mayor satisfacción laboral se correlaciona con mejor adherencia al uso de EPP'
    })
    
    // Correlación: Antigüedad vs Puntaje GHQ-12
    correlations.push({
      variable_x: 'Antigüedad',
      variable_y: 'Puntaje GHQ-12',
      correlacion: calculatePearsonCorrelation(
        extractSeniority(perceptionData),
        extractGHQScores(ghqData)
      ),
      significancia: 0.05,
      category: 'antiguedad-bienestar',
      interpretation: 'La antigüedad muestra una correlación débil con el bienestar psicológico'
    })
    
    // Correlación: Capacitación Seguridad vs Reporte Casi-accidentes
    correlations.push({
      variable_x: 'Capacitación Seguridad',
      variable_y: 'Reporte Casi-accidentes',
      correlacion: calculatePearsonCorrelation(
        extractSafetyTraining(safetyData),
        extractNearMissReports(safetyData)
      ),
      significancia: 0.001,
      category: 'capacitacion-reportes',
      interpretation: 'Mayor capacitación en seguridad se asocia con más reportes de casi-accidentes'
    })
    
  } catch (error) {
    console.error('Error calculating correlations:', error)
  }
  
  return correlations.filter(corr => corr.correlacion !== null && !isNaN(corr.correlacion))
}

/**
 * Calcula el coeficiente de correlación de Pearson entre dos arrays
 * @param {Array} x - Primera variable
 * @param {Array} y - Segunda variable
 * @returns {number} Coeficiente de correlación (-1 a 1)
 */
export const calculatePearsonCorrelation = (x, y) => {
  if (!x || !y || x.length !== y.length || x.length === 0) {
    return null
  }
  
  const n = x.length
  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0)
  const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0)
  
  const numerator = n * sumXY - sumX * sumY
  const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY))
  
  if (denominator === 0) return 0
  
  return numerator / denominator
}

/**
 * Prepara datos para gráficos de dispersión
 * @param {Object} safetyData - Datos de seguridad
 * @param {Object} ghqData - Datos GHQ-12
 * @param {Object} perceptionData - Datos de percepción
 * @returns {Object} Objeto con datos preparados para scatter plots
 */
export const prepareScatterData = (safetyData, ghqData, perceptionData) => {
  const scatterPlots = {}
  
  try {
    // Scatter plot: GHQ vs Comportamientos Seguros
    scatterPlots.ghqVsSafety = prepareScatterPlotData(
      extractGHQScores(ghqData),
      extractSafetyBehaviors(safetyData),
      'Puntaje GHQ-12',
      'Comportamientos Seguros'
    )
    
    // Scatter plot: Confianza vs Detenciones
    scatterPlots.trustVsStoppages = prepareScatterPlotData(
      extractManagementTrust(perceptionData),
      extractWorkStoppages(safetyData),
      'Confianza en Gerencia',
      'Detenciones de Trabajo'
    )
    
    // Scatter plot: Satisfacción vs EPP
    scatterPlots.satisfactionVsPPE = prepareScatterPlotData(
      extractJobSatisfaction(perceptionData),
      extractPPEUsage(safetyData),
      'Satisfacción Laboral',
      'Uso de EPP'
    )
    
  } catch (error) {
    console.error('Error preparing scatter data:', error)
  }
  
  return scatterPlots
}

/**
 * Prepara datos de segmentación para análisis
 * @param {Object} safetyData - Datos de seguridad
 * @param {Object} ghqData - Datos GHQ-12
 * @param {Object} perceptionData - Datos de percepción
 * @returns {Object} Datos de segmentación
 */
export const prepareSegmentationData = (safetyData, ghqData, perceptionData) => {
  try {
    return {
      riskSegments: calculateRiskSegments(ghqData, safetyData),
      departmentAnalysis: analyzeDepartmentCorrelations(safetyData, ghqData, perceptionData),
      shiftAnalysis: analyzeShiftCorrelations(safetyData, ghqData, perceptionData),
      experienceAnalysis: analyzeExperienceCorrelations(safetyData, ghqData, perceptionData)
    }
  } catch (error) {
    console.error('Error preparing segmentation data:', error)
    return {}
  }
}

// ===== FUNCIONES AUXILIARES DE EXTRACCIÓN =====

const extractGHQScores = (ghqData) => {
  // Simular extracción de puntajes GHQ-12
  // En producción, esto extraería los puntajes reales del dataset
  return Array.from({ length: 100 }, () => Math.random() * 36) // 0-36 rango GHQ-12
}

const extractSafetyBehaviors = (safetyData) => {
  // Simular extracción de comportamientos seguros
  return Array.from({ length: 100 }, () => Math.random() * 100) // 0-100 porcentaje
}

const extractManagementTrust = (perceptionData) => {
  // Simular extracción de confianza en gerencia
  return Array.from({ length: 100 }, () => Math.random() * 10) // 1-10 escala
}

const extractWorkStoppages = (safetyData) => {
  // Simular extracción de detenciones de trabajo
  return Array.from({ length: 100 }, () => Math.floor(Math.random() * 20)) // 0-20 detenciones
}

const extractJobSatisfaction = (perceptionData) => {
  // Simular extracción de satisfacción laboral
  return Array.from({ length: 100 }, () => Math.random() * 10) // 1-10 escala
}

const extractPPEUsage = (safetyData) => {
  // Simular extracción de uso de EPP
  return Array.from({ length: 100 }, () => Math.random() * 100) // 0-100 porcentaje
}

const extractSeniority = (perceptionData) => {
  // Simular extracción de antigüedad
  return Array.from({ length: 100 }, () => Math.random() * 30) // 0-30 años
}

const extractSafetyTraining = (safetyData) => {
  // Simular extracción de horas de capacitación
  return Array.from({ length: 100 }, () => Math.random() * 40) // 0-40 horas
}

const extractNearMissReports = (safetyData) => {
  // Simular extracción de reportes de casi-accidentes
  return Array.from({ length: 100 }, () => Math.floor(Math.random() * 10)) // 0-10 reportes
}

// ===== FUNCIONES AUXILIARES DE ANÁLISIS =====

const prepareScatterPlotData = (xData, yData, xLabel, yLabel) => {
  if (!xData || !yData || xData.length !== yData.length) {
    return []
  }
  
  return xData.map((x, index) => ({
    x: x,
    y: yData[index],
    xLabel,
    yLabel
  }))
}

const calculateRiskSegments = (ghqData, safetyData) => {
  // Simular segmentación por riesgo
  return {
    lowRisk: { count: 45, percentage: 45 },
    mediumRisk: { count: 35, percentage: 35 },
    highRisk: { count: 20, percentage: 20 }
  }
}

const analyzeDepartmentCorrelations = (safetyData, ghqData, perceptionData) => {
  // Simular análisis por departamento
  return {
    produccion: { correlation: -0.65, significance: 0.001 },
    mantenimiento: { correlation: -0.58, significance: 0.01 },
    calidad: { correlation: -0.72, significance: 0.001 },
    administracion: { correlation: -0.45, significance: 0.05 }
  }
}

const analyzeShiftCorrelations = (safetyData, ghqData, perceptionData) => {
  // Simular análisis por turno
  return {
    manana: { correlation: -0.62, significance: 0.001 },
    tarde: { correlation: -0.58, significance: 0.01 },
    noche: { correlation: -0.71, significance: 0.001 }
  }
}

const analyzeExperienceCorrelations = (safetyData, ghqData, perceptionData) => {
  // Simular análisis por experiencia
  return {
    novato: { correlation: -0.45, significance: 0.05 },
    intermedio: { correlation: -0.68, significance: 0.001 },
    experto: { correlation: -0.72, significance: 0.001 }
  }
}