/**
 * Custom hook para análisis de correlaciones
 * Extrae toda la lógica de cálculos estadísticos del componente UI
 */

import { useMemo } from 'react';
import {
  CORRELATION_THRESHOLDS,
  CORRELATION_STRENGTH,
  CORRELATION_DIRECTION,
  CORRELATION_CONFIGS
} from '../components/dashboard/components/CorrelationAnalysis/constants.jsx';

/**
 * Hook principal para análisis de correlaciones
 * @param {Array} data - Datos de respuestas del cuestionario
 * @param {boolean} loading - Estado de carga
 * @returns {Object} Datos procesados de correlaciones y estadísticas
 */
export const useCorrelationData = (data, loading = false) => {
  
  /**
   * Calcula el coeficiente de correlación de Pearson
   * @param {Array} x - Primera variable
   * @param {Array} y - Segunda variable
   * @returns {number} Coeficiente de correlación (-1 a 1)
   */
  const calculatePearsonCorrelation = useMemo(() => (x, y) => {
    if (!x || !y || x.length !== y.length || x.length === 0) return 0;
    
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }, []);

  /**
   * Determina la fuerza de la correlación basada en el coeficiente
   * @param {number} correlation - Coeficiente de correlación
   * @returns {string} Fuerza de la correlación
   */
  const getCorrelationStrength = useMemo(() => (correlation) => {
    const abs = Math.abs(correlation);
    if (abs >= CORRELATION_THRESHOLDS.VERY_STRONG) return CORRELATION_STRENGTH.VERY_STRONG;
    if (abs >= CORRELATION_THRESHOLDS.STRONG) return CORRELATION_STRENGTH.STRONG;
    if (abs >= CORRELATION_THRESHOLDS.MODERATE) return CORRELATION_STRENGTH.MODERATE;
    if (abs >= CORRELATION_THRESHOLDS.WEAK) return CORRELATION_STRENGTH.WEAK;
    return CORRELATION_STRENGTH.VERY_WEAK;
  }, []);

  /**
   * Determina la dirección de la correlación
   * @param {number} correlation - Coeficiente de correlación
   * @returns {string} Dirección de la correlación
   */
  const getCorrelationDirection = useMemo(() => (correlation) => {
    if (correlation > 0.1) return CORRELATION_DIRECTION.POSITIVE;
    if (correlation < -0.1) return CORRELATION_DIRECTION.NEGATIVE;
    return CORRELATION_DIRECTION.NEUTRAL;
  }, []);

  /**
   * Extrae variables específicas de los datos de respuesta con manejo robusto de errores
   * @param {Array} responses - Datos de respuestas
   * @returns {Object} Variables extraídas para análisis
   */
  const extractVariables = useMemo(() => (responses) => {
    if (!responses || responses.length === 0) {
      return {
        antiguedad: [],
        puntajeNormalizado: [],
        confianza: [],
        satisfaccion: [],
        motivacion: [],
        genero: [],
        edad: [],
        educacion: []
      };
    }

    // Verificar si los datos tienen estructura de usuarios anidada o plana
    const hasNestedStructure = responses.some(r => r.usuarios !== undefined);
    
    return {
      antiguedad: responses.map(r => {
        try {
          const antiguedadValue = hasNestedStructure ? 
            (r.usuarios?.antiguedad_empresa ?? r.antiguedad_empresa) : 
            (r.antiguedad_empresa ?? r.antiguedad ?? 0);
          return parseInt(antiguedadValue) || 0;
        } catch {
          return 0;
        }
      }),
      
      puntajeNormalizado: responses.map(r => {
        try {
          const puntaje = r.puntaje_normalizado ?? r.puntaje ?? r.ghq_score ?? 0;
          return parseFloat(puntaje) || 0;
        } catch {
          return 0;
        }
      }),
      
      confianza: responses.map(r => {
        try {
          const confianzaValue = hasNestedStructure ? 
            (r.usuarios?.confianza_gerencia ?? r.confianza_gerencia) : 
            (r.confianza_gerencia ?? r.confianza ?? 0);
          return parseInt(confianzaValue) || 0;
        } catch {
          return 0;
        }
      }),
      
      satisfaccion: responses.map(r => {
        try {
          const satisfaccionValue = hasNestedStructure ? 
            (r.usuarios?.satisfaccion_laboral ?? r.satisfaccion_laboral) : 
            (r.satisfaccion_laboral ?? r.satisfaccion ?? 0);
          return parseInt(satisfaccionValue) || 0;
        } catch {
          return 0;
        }
      }),
      
      motivacion: responses.map(r => {
        try {
          const motivacionValue = hasNestedStructure ? 
            (r.usuarios?.motivacion_seguridad ?? r.motivacion_seguridad) : 
            (r.motivacion_seguridad ?? r.motivacion ?? 0);
          return parseInt(motivacionValue) || 0;
        } catch {
          return 0;
        }
      }),
      
      genero: responses.map(r => {
        try {
          const generoValue = hasNestedStructure ? 
            (r.usuarios?.genero ?? r.genero) : 
            (r.genero ?? '');
          return generoValue === 'Masculino' ? 1 : 0;
        } catch {
          return 0;
        }
      }),
      
      edad: responses.map(r => {
        try {
          const edadValue = hasNestedStructure ? 
            (r.usuarios?.edad ?? r.edad) : 
            (r.edad ?? 0);
          return parseInt(edadValue) || 0;
        } catch {
          return 0;
        }
      }),
      
      educacion: responses.map(r => {
        try {
          const educacionValue = hasNestedStructure ? 
            (r.usuarios?.nivel_educativo ?? r.nivel_educativo) : 
            (r.nivel_educativo ?? '');
          // Convertir nivel educativo a escala numérica
          const educacionMap = {
            'Primaria': 1,
            'Secundaria': 2,
            'Técnico': 3,
            'Universitario': 4,
            'Postgrado': 5,
            'Primaria incompleta': 0,
            'Secundaria incompleta': 1,
            'Técnico incompleto': 2,
            'Universitario incompleto': 3
          };
          return educacionMap[educacionValue] || 0;
        } catch {
          return 0;
        }
      })
    };
  }, []);

  /**
   * Calcula todas las correlaciones configuradas con validación robusta
   */
  const correlations = useMemo(() => {
    if (loading || !data || !Array.isArray(data) || data.length === 0) {
      return CORRELATION_CONFIGS.map(config => ({
        ...config,
        correlation: 0,
        strength: CORRELATION_STRENGTH.VERY_WEAK,
        direction: CORRELATION_DIRECTION.NEUTRAL,
        description: 'No hay datos suficientes para calcular la correlación',
        dataStatus: 'insufficient_data',
        message: 'Datos insuficientes para calcular correlación'
      }));
    }

    const variables = extractVariables(data);
    
    return CORRELATION_CONFIGS.map(config => {
      const [var1, var2] = config.variables;
      
      // Validación robusta de datos
      const xData = variables[var1];
      const yData = variables[var2];
      
      const isValidData = xData && yData && 
                         xData.length >= 2 && yData.length >= 2 &&
                         xData.length === yData.length &&
                         !xData.every(val => val === 0) &&
                         !yData.every(val => val === 0);
      
      if (!isValidData) {
        return {
          ...config,
          correlation: 0,
          strength: CORRELATION_STRENGTH.VERY_WEAK,
          direction: CORRELATION_DIRECTION.NEUTRAL,
          description: 'Datos insuficientes para calcular correlación',
          dataStatus: 'insufficient_data',
          message: 'Datos insuficientes para calcular correlación'
        };
      }
      
      try {
        // Calcular correlación de Pearson
        const correlation = calculatePearsonCorrelation(xData, yData);
        
        // Validar si la correlación es válida (no NaN)
        const isValidCorrelation = !isNaN(correlation) && isFinite(correlation);
        
        return {
          ...config,
          correlation: isValidCorrelation ? correlation : 0,
          strength: isValidCorrelation ? getCorrelationStrength(correlation) : CORRELATION_STRENGTH.VERY_WEAK,
          direction: isValidCorrelation ? getCorrelationDirection(correlation) : CORRELATION_DIRECTION.NEUTRAL,
          dataStatus: isValidCorrelation ? 'valid' : 'calculation_error',
          message: isValidCorrelation ? '' : 'Error en cálculo de correlación'
        };
      } catch (error) {
        console.error(`Error calculando correlación para ${config.id}:`, error);
        return {
          ...config,
          correlation: 0,
          strength: CORRELATION_STRENGTH.VERY_WEAK,
          direction: CORRELATION_DIRECTION.NEUTRAL,
          description: 'Error en cálculo de correlación',
          dataStatus: 'calculation_error',
          message: `Error: ${error.message}`
        };
      }
    });
  }, [data, loading, extractVariables, calculatePearsonCorrelation, getCorrelationStrength, getCorrelationDirection]);

  /**
   * Calcula estadísticas resumidas
   */
  const statistics = useMemo(() => {
    const totalCorrelations = correlations.length;
    const strongCorrelations = correlations.filter(c => 
      c.strength === CORRELATION_STRENGTH.STRONG || 
      c.strength === CORRELATION_STRENGTH.VERY_STRONG
    ).length;
    
    const averageCorrelation = totalCorrelations > 0 ? 
      Math.abs(correlations.reduce((sum, c) => 
        sum + (isNaN(c.correlation) ? 0 : c.correlation), 0
      ) / totalCorrelations) : 0;

    return {
      totalCorrelations,
      strongCorrelations,
      averageCorrelation: averageCorrelation.toFixed(2),
      strongCorrelationPercentage: totalCorrelations > 0 ? 
        Math.round((strongCorrelations / totalCorrelations) * 100) : 0
    };
  }, [correlations]);

  /**
   * Calcula la distribución de correlaciones por fuerza
   */
  const distribution = useMemo(() => {
    const dist = {
      weak: 0,
      moderate: 0,
      strong: 0,
    };

    if (!correlations) return dist;

    correlations.forEach(c => {
      const strength = c.strength;
      if (strength === CORRELATION_STRENGTH.VERY_STRONG || strength === CORRELATION_STRENGTH.STRONG) {
        dist.strong++;
      } else if (strength === CORRELATION_STRENGTH.MODERATE) {
        dist.moderate++;
      } else if (strength === CORRELATION_STRENGTH.WEAK) {
        dist.weak++;
      }
    });

    return dist;
  }, [correlations]);

  /**
   * Genera insights dinámicos basados en los datos
   */
  const insights = useMemo(() => {
    const dynamicInsights = [];
    if (!correlations || correlations.length === 0) return dynamicInsights;
    
    // Insight sobre correlación más fuerte
    const strongestCorrelation = correlations.reduce((max, current) => 
      Math.abs(current.correlation) > Math.abs(max.correlation) ? current : max
    , correlations[0] || { correlation: 0 });

    if (strongestCorrelation && Math.abs(strongestCorrelation.correlation) > CORRELATION_THRESHOLDS.MODERATE) {
      dynamicInsights.push({
        icon: '🎯',
        title: 'Correlación Más Significativa',
        description: `${strongestCorrelation.title} muestra la relación más fuerte (${strongestCorrelation.correlation.toFixed(2)})`,
        impact: 'high',
        correlation: strongestCorrelation
      });
    }

    // Insight sobre correlaciones positivas vs negativas
    const positiveCorrelations = correlations.filter(c => c.direction === CORRELATION_DIRECTION.POSITIVE).length;
    const negativeCorrelations = correlations.filter(c => c.direction === CORRELATION_DIRECTION.NEGATIVE).length;
    
    if (positiveCorrelations > negativeCorrelations) {
      dynamicInsights.push({
        icon: '📈',
        title: 'Tendencia Positiva',
        description: `${positiveCorrelations} de ${correlations.length} correlaciones son positivas, indicando relaciones directas`,
        impact: 'medium'
      });
    } else if (negativeCorrelations > positiveCorrelations) {
      dynamicInsights.push({
        icon: '📉',
        title: 'Tendencia Negativa',
        description: `${negativeCorrelations} de ${correlations.length} correlaciones son negativas, indicando relaciones inversas`,
        impact: 'medium'
      });
    }

    // Insight sobre calidad de datos
    const validCorrelations = correlations.filter(c => !isNaN(c.correlation) && c.correlation !== 0).length;
    const dataQualityPercentage = correlations.length > 0 ? Math.round((validCorrelations / correlations.length) * 100) : 0;
    
    dynamicInsights.push({
      icon: '📊',
      title: 'Calidad de Datos',
      description: `${dataQualityPercentage}% de las correlaciones tienen datos válidos para análisis`,
      impact: dataQualityPercentage > 80 ? 'high' : dataQualityPercentage > 60 ? 'medium' : 'low'
    });

    return dynamicInsights;
  }, [correlations]);

  /**
   * Formatea un valor de correlación para mostrar
   * @param {number} correlation - Valor de correlación
   * @returns {string} Valor formateado
   */
  const formatCorrelation = useMemo(() => (correlation) => {
    return isNaN(correlation) ? '0.00' : correlation.toFixed(2);
  }, []);

  /**
   * Determina si hay datos suficientes para análisis
   */
  const hasData = useMemo(() => {
    return !loading && data && Array.isArray(data) && data.length > 0;
  }, [data, loading]);

  return {
    // Datos principales
    correlations,
    statistics,
    distribution,
    insights,
    
    // Funciones utilitarias
    calculatePearsonCorrelation,
    getCorrelationStrength,
    getCorrelationDirection,
    formatCorrelation,
    
    // Estados
    isLoading: loading,
    hasData,
    
    // Datos raw para análisis adicional
    rawVariables: hasData ? extractVariables(data) : null
  };
};

export default useCorrelationData;