import { supabase } from '../api/supabase.js';
import { analyzeGHQ12, calculateGroupMetrics, GHQ12_CONFIG } from '../utils/ghq12Calculator.js';

/**
 * Servicio para segmentación avanzada de datos por departamento
 * Incluye filtros de respuestas válidas y métricas especializadas
 */
export class DepartmentSegmentationService {
  
  // ===========================================
  // CONFIGURACIÓN Y CONSTANTES
  // ===========================================
  
  static CACHE_TTL = 10 * 60 * 1000; // 10 minutos
  static cache = new Map();
  
  static VALIDATION_RULES = {
    MIN_RESPONSES_PER_USER: 12, // Mínimo 12 respuestas (cuestionario completo)
    MIN_USERS_PER_DEPARTMENT: 3, // Mínimo 3 usuarios por departamento para análisis válido
    MAX_RESPONSE_VALUE: 3, // Valor máximo válido para respuestas GHQ-12
    MIN_RESPONSE_VALUE: 0, // Valor mínimo válido para respuestas GHQ-12
    REQUIRED_DEMOGRAPHIC_FIELDS: ['departamento', 'cargo'] // Campos demográficos requeridos
  };

  static DEPARTMENT_METRICS = {
    CORE: ['promedio_ghq', 'porcentaje_riesgo_alto', 'total_participantes'],
    SAFETY: ['uso_epp', 'capacitaciones_completadas', 'reportes_incidentes'],
    SATISFACTION: ['satisfaccion_laboral', 'motivacion', 'confianza_gerencia'],
    DEMOGRAPHICS: ['distribucion_edad', 'distribucion_genero', 'distribucion_turno']
  };

  // ===========================================
  // MÉTODOS DE VALIDACIÓN
  // ===========================================

  /**
   * Valida si las respuestas de un usuario son completas y válidas
   */
  static validateUserResponses(respuestas) {
    // Verificar que tenga exactamente 12 respuestas
    const responseKeys = Object.keys(respuestas);
    if (responseKeys.length < this.VALIDATION_RULES.MIN_RESPONSES_PER_USER) {
      return { isValid: false, reason: 'Respuestas incompletas' };
    }

    // Verificar que todas las respuestas estén en el rango válido
    for (let i = 1; i <= 12; i++) {
      const response = respuestas[i];
      if (response === undefined || response === null) {
        return { isValid: false, reason: `Respuesta faltante para pregunta ${i}` };
      }
      
      const numResponse = Number(response);
      if (isNaN(numResponse) || 
          numResponse < this.VALIDATION_RULES.MIN_RESPONSE_VALUE || 
          numResponse > this.VALIDATION_RULES.MAX_RESPONSE_VALUE) {
        return { isValid: false, reason: `Respuesta inválida para pregunta ${i}: ${response}` };
      }
    }

    return { isValid: true };
  }

  /**
   * Valida si un departamento tiene suficientes datos para análisis
   */
  static validateDepartmentData(departmentData) {
    if (departmentData.length < this.VALIDATION_RULES.MIN_USERS_PER_DEPARTMENT) {
      return { 
        isValid: false, 
        reason: `Departamento con pocos participantes: ${departmentData.length} (mínimo ${this.VALIDATION_RULES.MIN_USERS_PER_DEPARTMENT})` 
      };
    }

    return { isValid: true };
  }

  /**
   * Valida campos demográficos requeridos
   */
  static validateDemographics(usuario) {
    const missing = this.VALIDATION_RULES.REQUIRED_DEMOGRAPHIC_FIELDS.filter(
      field => !usuario[field] || usuario[field] === 'Sin especificar'
    );

    return {
      isValid: missing.length === 0,
      missingFields: missing
    };
  }

  // ===========================================
  // MÉTODOS DE OBTENCIÓN DE DATOS
  // ===========================================

  /**
   * Obtiene datos segmentados por departamento con filtros avanzados
   */
  static async getSegmentedDepartmentData(filters = {}) {
    const cacheKey = `dept-segmentation-${JSON.stringify(filters)}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const startTime = performance.now();

      // Obtener datos base con joins optimizados
      const { data: respuestasData, error } = await supabase
        .from('respuestas_cuestionario')
        .select(`
          usuario_id,
          pregunta_id,
          respuesta,
          sesion_id,
          fecha_respuesta,
          usuarios!inner(
            email,
            nombre,
            apellido,
            cargo,
            departamento,
            area_macro,
            edad,
            genero,
            turno,
            tipo_contrato,
            fecha_ingreso
          )
        `)
        .order('fecha_respuesta', { ascending: false });

      if (error) throw error;

      // Aplicar filtros temporales si existen
      let filteredData = respuestasData;
      if (filters.fechaInicio) {
        filteredData = filteredData.filter(item => 
          new Date(item.fecha_respuesta) >= new Date(filters.fechaInicio)
        );
      }
      if (filters.fechaFin) {
        filteredData = filteredData.filter(item => 
          new Date(item.fecha_respuesta) <= new Date(filters.fechaFin)
        );
      }

      // Agrupar respuestas por usuario y sesión
      const respuestasPorUsuario = this.groupResponsesByUser(filteredData);

      // Validar y procesar datos
      const validatedData = this.validateAndProcessData(respuestasPorUsuario);

      // Segmentar por departamento
      const departmentSegmentation = this.segmentByDepartment(validatedData);

      // Calcular métricas avanzadas
      const departmentMetrics = this.calculateAdvancedMetrics(departmentSegmentation);

      const result = {
        departments: departmentMetrics,
        summary: this.generateSummary(departmentMetrics),
        validation: this.generateValidationReport(validatedData),
        filters: filters,
        timestamp: new Date().toISOString(),
        performance: {
          query_time_ms: Math.round(performance.now() - startTime),
          total_responses: respuestasData.length,
          valid_responses: validatedData.length
        }
      };

      this.setCachedData(cacheKey, result);
      return result;

    } catch (error) {
      console.error('Error en getSegmentedDepartmentData:', error);
      throw new Error(`Error al obtener datos segmentados: ${error.message}`);
    }
  }

  /**
   * Agrupa respuestas por usuario y sesión
   */
  static groupResponsesByUser(respuestasData) {
    return respuestasData.reduce((grupos, item) => {
      const key = `${item.usuario_id}-${item.sesion_id}`;
      if (!grupos[key]) {
        grupos[key] = {
          usuario_id: item.usuario_id,
          sesion_id: item.sesion_id,
          fecha_respuesta: item.fecha_respuesta,
          usuarios: item.usuarios,
          respuestas: {}
        };
      }
      grupos[key].respuestas[item.pregunta_id] = item.respuesta;
      return grupos;
    }, {});
  }

  /**
   * Valida y procesa datos de usuarios
   */
  static validateAndProcessData(respuestasPorUsuario) {
    const validatedData = [];
    const validationErrors = [];

    Object.values(respuestasPorUsuario).forEach(item => {
      // Validar respuestas
      const responseValidation = this.validateUserResponses(item.respuestas);
      if (!responseValidation.isValid) {
        validationErrors.push({
          usuario_id: item.usuario_id,
          error: responseValidation.reason
        });
        return;
      }

      // Validar demografía
      const demoValidation = this.validateDemographics(item.usuarios);
      if (!demoValidation.isValid) {
        validationErrors.push({
          usuario_id: item.usuario_id,
          error: `Campos faltantes: ${demoValidation.missingFields.join(', ')}`
        });
        return;
      }

      // Convertir respuestas a array ordenado
      const respuestasArray = [];
      for (let i = 1; i <= 12; i++) {
        respuestasArray.push(Number(item.respuestas[i]));
      }

      // Calcular métricas GHQ-12
      const ghqMetrics = analyzeGHQ12(respuestasArray);

      // Procesar datos demográficos
      const demographics = this.processDemographics(item.usuarios);

      validatedData.push({
        ...ghqMetrics,
        ...demographics,
        usuario_id: item.usuario_id,
        sesion_id: item.sesion_id,
        fecha_respuesta: item.fecha_respuesta,
        respuestas_raw: respuestasArray
      });
    });

    // Almacenar errores de validación para reporte
    this.validationErrors = validationErrors;

    return validatedData;
  }

  /**
   * Procesa datos demográficos
   */
  static processDemographics(usuario) {
    return {
      departamento: usuario.departamento || 'Sin especificar',
      area_macro: usuario.area_macro || 'Sin especificar',
      cargo: usuario.cargo || 'Sin especificar',
      edad: usuario.edad || null,
      genero: usuario.genero || 'Sin especificar',
      turno: usuario.turno || 'Sin especificar',
      tipo_contrato: usuario.tipo_contrato || 'Sin especificar',
      antiguedad: usuario.fecha_ingreso ? 
        this.calculateAntiquity(usuario.fecha_ingreso) : null
    };
  }

  /**
   * Calcula antigüedad en años
   */
  static calculateAntiquity(fechaIngreso) {
    const now = new Date();
    const ingreso = new Date(fechaIngreso);
    return Math.floor((now - ingreso) / (365.25 * 24 * 60 * 60 * 1000));
  }

  /**
   * Segmenta datos por departamento
   */
  static segmentByDepartment(validatedData) {
    const departmentGroups = validatedData.reduce((groups, item) => {
      const dept = item.departamento;
      if (!groups[dept]) {
        groups[dept] = [];
      }
      groups[dept].push(item);
      return groups;
    }, {});

    // Filtrar departamentos con datos insuficientes
    const validDepartments = {};
    Object.entries(departmentGroups).forEach(([dept, data]) => {
      const validation = this.validateDepartmentData(data);
      if (validation.isValid) {
        validDepartments[dept] = data;
      }
    });

    return validDepartments;
  }

  /**
   * Calcula métricas avanzadas por departamento
   */
  static calculateAdvancedMetrics(departmentSegmentation) {
    return Object.entries(departmentSegmentation).map(([departamento, data]) => {
      const groupMetrics = calculateGroupMetrics(data);
      
      // Métricas básicas
      const basicMetrics = {
        departamento,
        total_participantes: data.length,
        promedio_ghq: groupMetrics.promedioPuntuacion,
        porcentaje_riesgo_alto: groupMetrics.porcentajeAltoRiesgo,
        distribucion_riesgo: groupMetrics.distribucionRiesgo
      };

      // Métricas demográficas
      const demographicMetrics = this.calculateDemographicMetrics(data);

      // Métricas de calidad de datos
      const qualityMetrics = this.calculateDataQualityMetrics(data);

      // Tendencias (si hay datos históricos)
      const trendMetrics = this.calculateTrendMetrics(data);

      return {
        ...basicMetrics,
        demographics: demographicMetrics,
        quality: qualityMetrics,
        trends: trendMetrics,
        ranking: 0 // Se calculará después
      };
    }).sort((a, b) => b.porcentaje_riesgo_alto - a.porcentaje_riesgo_alto)
      .map((dept, index) => ({ ...dept, ranking: index + 1 }));
  }

  /**
   * Calcula métricas demográficas
   */
  static calculateDemographicMetrics(data) {
    const total = data.length;
    
    return {
      distribucion_genero: this.calculateDistribution(data, 'genero'),
      distribucion_edad: this.calculateAgeDistribution(data),
      distribucion_turno: this.calculateDistribution(data, 'turno'),
      distribucion_contrato: this.calculateDistribution(data, 'tipo_contrato'),
      promedio_antiguedad: data
        .filter(item => item.antiguedad !== null)
        .reduce((sum, item) => sum + item.antiguedad, 0) / 
        data.filter(item => item.antiguedad !== null).length || 0
    };
  }

  /**
   * Calcula distribución por campo
   */
  static calculateDistribution(data, field) {
    const distribution = {};
    data.forEach(item => {
      const value = item[field] || 'Sin especificar';
      distribution[value] = (distribution[value] || 0) + 1;
    });

    // Convertir a porcentajes
    const total = data.length;
    Object.keys(distribution).forEach(key => {
      distribution[key] = {
        count: distribution[key],
        percentage: Math.round((distribution[key] / total) * 100 * 100) / 100
      };
    });

    return distribution;
  }

  /**
   * Calcula distribución por edad
   */
  static calculateAgeDistribution(data) {
    const ageRanges = {
      '18-25': 0,
      '26-35': 0,
      '36-45': 0,
      '46-55': 0,
      '56+': 0,
      'Sin especificar': 0
    };

    data.forEach(item => {
      const edad = item.edad;
      if (!edad) {
        ageRanges['Sin especificar']++;
      } else if (edad <= 25) {
        ageRanges['18-25']++;
      } else if (edad <= 35) {
        ageRanges['26-35']++;
      } else if (edad <= 45) {
        ageRanges['36-45']++;
      } else if (edad <= 55) {
        ageRanges['46-55']++;
      } else {
        ageRanges['56+']++;
      }
    });

    // Convertir a porcentajes
    const total = data.length;
    Object.keys(ageRanges).forEach(range => {
      const count = ageRanges[range];
      ageRanges[range] = {
        count,
        percentage: Math.round((count / total) * 100 * 100) / 100
      };
    });

    return ageRanges;
  }

  /**
   * Calcula métricas de calidad de datos
   */
  static calculateDataQualityMetrics(data) {
    return {
      completeness_score: this.calculateCompletenessScore(data),
      consistency_score: this.calculateConsistencyScore(data),
      recency_score: this.calculateRecencyScore(data),
      sample_size_adequacy: this.assessSampleSizeAdequacy(data.length)
    };
  }

  /**
   * Calcula score de completitud
   */
  static calculateCompletenessScore(data) {
    const requiredFields = ['departamento', 'cargo', 'edad', 'genero'];
    let totalFields = 0;
    let completeFields = 0;

    data.forEach(item => {
      requiredFields.forEach(field => {
        totalFields++;
        if (item[field] && item[field] !== 'Sin especificar') {
          completeFields++;
        }
      });
    });

    return Math.round((completeFields / totalFields) * 100 * 100) / 100;
  }

  /**
   * Calcula score de consistencia
   */
  static calculateConsistencyScore(data) {
    // Verificar consistencia en respuestas (no todas iguales, patrones válidos)
    let consistentResponses = 0;
    
    data.forEach(item => {
      const responses = item.respuestas_raw;
      const uniqueValues = new Set(responses).size;
      
      // Si hay variación en las respuestas (no todas iguales), es más consistente
      if (uniqueValues > 1 && uniqueValues < responses.length) {
        consistentResponses++;
      }
    });

    return Math.round((consistentResponses / data.length) * 100 * 100) / 100;
  }

  /**
   * Calcula score de recencia
   */
  static calculateRecencyScore(data) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    const recentResponses = data.filter(item => 
      new Date(item.fecha_respuesta) >= thirtyDaysAgo
    ).length;

    return Math.round((recentResponses / data.length) * 100 * 100) / 100;
  }

  /**
   * Evalúa adecuación del tamaño de muestra
   */
  static assessSampleSizeAdequacy(sampleSize) {
    if (sampleSize >= 30) return 'Excelente';
    if (sampleSize >= 15) return 'Bueno';
    if (sampleSize >= 5) return 'Aceptable';
    return 'Insuficiente';
  }

  /**
   * Calcula métricas de tendencia
   */
  static calculateTrendMetrics(data) {
    // Agrupar por mes para análisis de tendencias
    const monthlyData = data.reduce((groups, item) => {
      const date = new Date(item.fecha_respuesta);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(item);
      return groups;
    }, {});

    const months = Object.keys(monthlyData).sort();
    if (months.length < 2) {
      return { trend: 'Sin datos suficientes', change: 0 };
    }

    // Calcular tendencia en los últimos meses
    const lastMonth = monthlyData[months[months.length - 1]];
    const previousMonth = monthlyData[months[months.length - 2]];

    const lastMonthAvg = lastMonth.reduce((sum, item) => sum + item.puntuacion_total, 0) / lastMonth.length;
    const previousMonthAvg = previousMonth.reduce((sum, item) => sum + item.puntuacion_total, 0) / previousMonth.length;

    const change = ((lastMonthAvg - previousMonthAvg) / previousMonthAvg) * 100;

    return {
      trend: change > 5 ? 'Empeorando' : change < -5 ? 'Mejorando' : 'Estable',
      change: Math.round(change * 100) / 100,
      last_month_avg: Math.round(lastMonthAvg * 100) / 100,
      previous_month_avg: Math.round(previousMonthAvg * 100) / 100
    };
  }

  /**
   * Genera resumen general
   */
  static generateSummary(departmentMetrics) {
    const totalParticipants = departmentMetrics.reduce((sum, dept) => sum + dept.total_participantes, 0);
    const avgRisk = departmentMetrics.reduce((sum, dept) => sum + dept.porcentaje_riesgo_alto, 0) / departmentMetrics.length;
    
    return {
      total_departments: departmentMetrics.length,
      total_participants: totalParticipants,
      average_risk_percentage: Math.round(avgRisk * 100) / 100,
      highest_risk_department: departmentMetrics[0]?.departamento || 'N/A',
      lowest_risk_department: departmentMetrics[departmentMetrics.length - 1]?.departamento || 'N/A'
    };
  }

  /**
   * Genera reporte de validación
   */
  static generateValidationReport(validatedData) {
    return {
      total_valid_responses: validatedData.length,
      validation_errors: this.validationErrors || [],
      error_rate: this.validationErrors ? 
        Math.round((this.validationErrors.length / (validatedData.length + this.validationErrors.length)) * 100 * 100) / 100 : 0
    };
  }

  // ===========================================
  // MÉTODOS DE CACHE
  // ===========================================

  static getCachedData(key) {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
      return cached.data;
    }
    return null;
  }

  static setCachedData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  static clearCache() {
    this.cache.clear();
  }
}

export default DepartmentSegmentationService;