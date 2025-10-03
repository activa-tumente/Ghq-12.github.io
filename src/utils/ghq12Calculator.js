/**
 * Calculadora GHQ-12 - Implementación Correcta según Especificaciones
 * 
 * Este módulo implementa el cálculo correcto del General Health Questionnaire (GHQ-12)
 * siguiendo las especificaciones proporcionadas para el sistema BAT-7.
 */

// Configuración de preguntas GHQ-12
export const GHQ12_CONFIG = {
  // Preguntas que mantienen su valor original (indican bienestar)
  POSITIVE_QUESTIONS: [1, 3, 4, 7, 8, 12],
  
  // Preguntas que se invierten (indican malestar/riesgo)
  NEGATIVE_QUESTIONS: [2, 5, 6, 9, 10, 11],
  
  // Umbrales de riesgo según especificación
  RISK_THRESHOLDS: {
    MUY_ALTO: { min: 0, max: 8, label: 'Muy Alto (Restringido)', color: '#DC2626', priority: 4 },
    ALTO: { min: 9, max: 17, label: 'Alto (Alterado)', color: '#EA580C', priority: 3 },
    MODERADO: { min: 18, max: 27, label: 'Moderado (Alerta)', color: '#D97706', priority: 2 },
    BAJO: { min: 28, max: 36, label: 'Bajo (Aceptable)', color: '#059669', priority: 1 }
  },
  
  // Valor máximo de respuesta individual
  MAX_RESPONSE_VALUE: 3,
  
  // Puntaje máximo total
  MAX_TOTAL_SCORE: 36
};

/**
 * Valida las respuestas del cuestionario GHQ-12
 * @param {Object} responses - Objeto con respuestas q1-q12
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export function validateGHQ12Responses(responses) {
  const errors = [];
  const requiredQuestions = Array.from({ length: 12 }, (_, i) => `q${i + 1}`);
  
  for (const question of requiredQuestions) {
    const value = responses[question];
    
    if (value === undefined || value === null) {
      errors.push(`Pregunta ${question} faltante`);
      continue;
    }
    
    const numValue = Number(value);
    if (isNaN(numValue) || numValue < 0 || numValue > GHQ12_CONFIG.MAX_RESPONSE_VALUE) {
      errors.push(`Pregunta ${question} tiene valor inválido: ${value} (debe ser 0-3)`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Calcula el puntaje total de bienestar GHQ-12 con inversión correcta
 * @param {Object} responses - Objeto con respuestas q1-q12
 * @returns {Object} - Resultado del cálculo con detalles
 */
export function calculateGHQ12Score(responses) {
  // Validar respuestas
  const validation = validateGHQ12Responses(responses);
  if (!validation.isValid) {
    throw new Error(`Respuestas inválidas: ${validation.errors.join(', ')}`);
  }
  
  let totalScore = 0;
  const scoreBreakdown = {};
  
  // Procesar cada pregunta
  for (let i = 1; i <= 12; i++) {
    const questionKey = `q${i}`;
    const rawValue = Number(responses[questionKey]);
    
    let processedValue;
    
    if (GHQ12_CONFIG.POSITIVE_QUESTIONS.includes(i)) {
      // Preguntas positivas: mantener valor original
      processedValue = rawValue;
      scoreBreakdown[questionKey] = {
        raw: rawValue,
        processed: processedValue,
        type: 'positive',
        description: 'Valor mantenido (indica bienestar)'
      };
    } else {
      // Preguntas negativas: invertir usando fórmula 3 - valor_original
      processedValue = GHQ12_CONFIG.MAX_RESPONSE_VALUE - rawValue;
      scoreBreakdown[questionKey] = {
        raw: rawValue,
        processed: processedValue,
        type: 'negative',
        description: `Valor invertido: ${GHQ12_CONFIG.MAX_RESPONSE_VALUE} - ${rawValue} = ${processedValue}`
      };
    }
    
    totalScore += processedValue;
  }
  
  return {
    totalScore,
    maxPossibleScore: GHQ12_CONFIG.MAX_TOTAL_SCORE,
    scoreBreakdown,
    percentageScore: (totalScore / GHQ12_CONFIG.MAX_TOTAL_SCORE) * 100
  };
}

/**
 * Clasifica el nivel de riesgo basado en el puntaje total
 * @param {number} totalScore - Puntaje total calculado
 * @returns {Object} - Información del nivel de riesgo
 */
export function classifyRiskLevel(totalScore) {
  for (const [level, config] of Object.entries(GHQ12_CONFIG.RISK_THRESHOLDS)) {
    if (totalScore >= config.min && totalScore <= config.max) {
      return {
        level,
        ...config,
        score: totalScore,
        isHighRisk: level === 'ALTO' || level === 'MUY_ALTO',
        requiresIntervention: level === 'ALTO' || level === 'MUY_ALTO'
      };
    }
  }
  
  // Fallback para valores fuera de rango
  throw new Error(`Puntaje fuera de rango válido: ${totalScore} (debe ser 0-36)`);
}

/**
 * Función principal que combina cálculo y clasificación
 * @param {Object} responses - Respuestas del cuestionario
 * @returns {Object} - Resultado completo del análisis GHQ-12
 */
export function analyzeGHQ12(responses) {
  try {
    const scoreResult = calculateGHQ12Score(responses);
    const riskClassification = classifyRiskLevel(scoreResult.totalScore);
    
    return {
      success: true,
      score: scoreResult,
      risk: riskClassification,
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Calcula métricas agregadas para un conjunto de participantes
 * @param {Array} participants - Array de objetos con respuestas GHQ-12
 * @returns {Object} - Métricas agregadas del grupo
 */
export function calculateGroupMetrics(participants) {
  const results = participants.map(p => analyzeGHQ12(p.responses)).filter(r => r.success);
  
  if (results.length === 0) {
    throw new Error('No hay datos válidos para calcular métricas grupales');
  }
  
  // Distribución por nivel de riesgo
  const distribution = {};
  Object.keys(GHQ12_CONFIG.RISK_THRESHOLDS).forEach(level => {
    distribution[level] = {
      count: 0,
      percentage: 0,
      participants: []
    };
  });
  
  // Calcular distribución
  results.forEach((result, index) => {
    const level = result.risk.level;
    distribution[level].count++;
    distribution[level].participants.push({
      index,
      score: result.score.totalScore,
      participant: participants[index]
    });
  });
  
  // Calcular porcentajes
  Object.keys(distribution).forEach(level => {
    distribution[level].percentage = (distribution[level].count / results.length) * 100;
  });
  
  // KPI Principal: Porcentaje en riesgo Alto/Muy Alto
  const highRiskCount = distribution.ALTO.count + distribution.MUY_ALTO.count;
  const highRiskPercentage = (highRiskCount / results.length) * 100;
  
  // Estadísticas descriptivas
  const scores = results.map(r => r.score.totalScore);
  const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  
  // Mediana
  const sortedScores = [...scores].sort((a, b) => a - b);
  const median = sortedScores.length % 2 === 0
    ? (sortedScores[sortedScores.length / 2 - 1] + sortedScores[sortedScores.length / 2]) / 2
    : sortedScores[Math.floor(sortedScores.length / 2)];
  
  return {
    totalParticipants: results.length,
    distribution,
    kpi: {
      highRiskPercentage,
      highRiskCount,
      description: 'Porcentaje de trabajadores en riesgo Alto/Muy Alto'
    },
    statistics: {
      average: avgScore,
      median,
      min: minScore,
      max: maxScore,
      range: maxScore - minScore
    },
    timestamp: new Date().toISOString()
  };
}

/**
 * Genera consulta SQL para implementar la lógica en base de datos
 * @param {string} tableName - Nombre de la tabla de respuestas
 * @returns {string} - Consulta SQL optimizada
 */
export function generateGHQ12SQL(tableName = 'respuestas_cuestionario') {
  return `
WITH ghq12_scores AS (
  SELECT 
    id,
    participante_id,
    -- Cálculo correcto con inversión de preguntas negativas
    (
      -- Preguntas positivas (mantener valor original)
      COALESCE(q1, 0) + COALESCE(q3, 0) + COALESCE(q4, 0) + 
      COALESCE(q7, 0) + COALESCE(q8, 0) + COALESCE(q12, 0) +
      
      -- Preguntas negativas (invertir: 3 - valor_original)
      (3 - COALESCE(q2, 0)) + (3 - COALESCE(q5, 0)) + (3 - COALESCE(q6, 0)) +
      (3 - COALESCE(q9, 0)) + (3 - COALESCE(q10, 0)) + (3 - COALESCE(q11, 0))
    ) AS puntaje_total_bienestar,
    
    created_at,
    departamento,
    turno
  FROM ${tableName}
  WHERE q1 IS NOT NULL AND q2 IS NOT NULL AND q3 IS NOT NULL AND 
        q4 IS NOT NULL AND q5 IS NOT NULL AND q6 IS NOT NULL AND
        q7 IS NOT NULL AND q8 IS NOT NULL AND q9 IS NOT NULL AND
        q10 IS NOT NULL AND q11 IS NOT NULL AND q12 IS NOT NULL
),
ghq12_classified AS (
  SELECT 
    *,
    CASE 
      WHEN puntaje_total_bienestar >= 28 THEN 'Bajo (Aceptable)'
      WHEN puntaje_total_bienestar >= 18 THEN 'Moderado (Alerta)'
      WHEN puntaje_total_bienestar >= 9 THEN 'Alto (Alterado)'
      ELSE 'Muy Alto (Restringido)'
    END AS nivel_riesgo_general,
    
    CASE 
      WHEN puntaje_total_bienestar <= 17 THEN 1 
      ELSE 0 
    END AS es_alto_riesgo
  FROM ghq12_scores
)
SELECT 
  nivel_riesgo_general,
  COUNT(*) as total_participantes,
  ROUND(
    (COUNT(*)::numeric * 100.0 / (SELECT COUNT(*) FROM ghq12_classified)), 
    2
  ) as porcentaje,
  AVG(puntaje_total_bienestar) as promedio_puntaje,
  MIN(puntaje_total_bienestar) as min_puntaje,
  MAX(puntaje_total_bienestar) as max_puntaje
FROM ghq12_classified
GROUP BY nivel_riesgo_general
ORDER BY 
  CASE nivel_riesgo_general
    WHEN 'Muy Alto (Restringido)' THEN 4
    WHEN 'Alto (Alterado)' THEN 3
    WHEN 'Moderado (Alerta)' THEN 2
    WHEN 'Bajo (Aceptable)' THEN 1
  END DESC;
`;
}

export default {
  GHQ12_CONFIG,
  validateGHQ12Responses,
  calculateGHQ12Score,
  classifyRiskLevel,
  analyzeGHQ12,
  calculateGroupMetrics,
  generateGHQ12SQL
};