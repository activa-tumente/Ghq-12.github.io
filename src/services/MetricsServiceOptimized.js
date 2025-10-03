/**
 * Servicio de Métricas GHQ-12 Optimizado
 * Sistema BAT-7 - Evaluación Psicológica
 * 
 * Implementa cálculos optimizados con separación de responsabilidades
 * y cache inteligente para mejorar el rendimiento del dashboard.
 */

import { supabase } from '../api/supabase.js'
import { calculateGroupMetrics, analyzeGHQ12, GHQ12_CONFIG } from '../utils/ghq12Calculator.js'

// =====================================================
// CONFIGURACIÓN Y CONSTANTES
// =====================================================

const CACHE_CONFIG = {
  TTL: {
    CORE_METRICS: 5 * 60 * 1000,      // 5 minutos
    DEPARTMENT_METRICS: 10 * 60 * 1000, // 10 minutos
    TRENDS: 30 * 60 * 1000,           // 30 minutos
    HEATMAP: 15 * 60 * 1000           // 15 minutos
  },
  MAX_SIZE: 100 // Máximo número de entradas en cache
}

const PERFORMANCE_THRESHOLDS = {
  QUERY_WARNING_MS: 1000,
  QUERY_ERROR_MS: 5000,
  CACHE_HIT_TARGET: 0.8 // 80% de cache hits objetivo
}

// =====================================================
// SISTEMA DE CACHE INTELIGENTE
// =====================================================

class IntelligentCache {
  constructor() {
    this.cache = new Map()
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0
    }
  }

  generateKey(method, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key]
        return result
      }, {})
    
    return `${method}:${JSON.stringify(sortedParams)}`
  }

  get(key, ttl) {
    const entry = this.cache.get(key)
    
    if (!entry) {
      this.stats.misses++
      return null
    }

    if (Date.now() - entry.timestamp > ttl) {
      this.cache.delete(key)
      this.stats.misses++
      return null
    }

    this.stats.hits++
    entry.lastAccessed = Date.now()
    return entry.data
  }

  set(key, data, metadata = {}) {
    // Eviction si el cache está lleno
    if (this.cache.size >= CACHE_CONFIG.MAX_SIZE) {
      this.evictLRU()
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      lastAccessed: Date.now(),
      metadata
    })
  }

  evictLRU() {
    let oldestKey = null
    let oldestTime = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
      this.stats.evictions++
    }
  }

  getStats() {
    const total = this.stats.hits + this.stats.misses
    return {
      ...this.stats,
      hitRate: total > 0 ? this.stats.hits / total : 0,
      size: this.cache.size
    }
  }

  clear() {
    this.cache.clear()
    this.stats = { hits: 0, misses: 0, evictions: 0 }
  }
}

// Instancia global del cache
const metricsCache = new IntelligentCache()

// =====================================================
// UTILIDADES DE RENDIMIENTO
// =====================================================

class PerformanceMonitor {
  static async measureQuery(queryName, queryFn) {
    const startTime = Date.now()
    
    try {
      const result = await queryFn()
      const duration = Date.now() - startTime
      
      // Log de rendimiento
      if (duration > PERFORMANCE_THRESHOLDS.QUERY_WARNING_MS) {
        console.warn(`Query lenta detectada: ${queryName} tomó ${duration}ms`)
      }
      
      if (duration > PERFORMANCE_THRESHOLDS.QUERY_ERROR_MS) {
        console.error(`Query crítica: ${queryName} tomó ${duration}ms`)
      }

      return {
        success: true,
        data: result,
        performance: {
          duration,
          queryName,
          timestamp: new Date().toISOString()
        }
      }
    } catch (error) {
      const duration = Date.now() - startTime
      console.error(`Error en query ${queryName} después de ${duration}ms:`, error)
      
      return {
        success: false,
        error: error.message,
        performance: {
          duration,
          queryName,
          timestamp: new Date().toISOString()
        }
      }
    }
  }
}

// =====================================================
// SERVICIO PRINCIPAL DE MÉTRICAS OPTIMIZADO
// =====================================================

export class MetricsServiceOptimized {
  
  /**
   * Obtiene métricas principales del dashboard con cache inteligente
   */
  static async getCoreMetrics(filters = {}) {
    const cacheKey = metricsCache.generateKey('getCoreMetrics', filters)
    const cached = metricsCache.get(cacheKey, CACHE_CONFIG.TTL.CORE_METRICS)
    
    if (cached) {
      return { ...cached, fromCache: true }
    }

    const result = await PerformanceMonitor.measureQuery(
      'getCoreMetrics',
      async () => {
        // Usar vista materializada optimizada si existe, sino calcular directamente
        try {
          let query = supabase
            .from('v_dashboard_ghq12_summary')
            .select('*')

          const { data, error } = await query.single()

          if (error) {
            throw new Error(`Error obteniendo métricas principales: ${error.message}`)
          }

          return this.formatCoreMetrics(data)
        } catch (viewError) {
          // Fallback: calcular desde datos base
          console.warn('Vista materializada no disponible, calculando desde datos base')
          return await this.calculateCoreMetricsFromBase(filters)
        }
      }
    )

    if (result.success) {
      metricsCache.set(cacheKey, result.data, { 
        filters, 
        generatedAt: new Date().toISOString() 
      })
    }

    return result
  }

  /**
   * Fallback para calcular métricas desde datos base
   */
  static async calculateCoreMetricsFromBase(filters = {}) {
    let query = supabase
      .from('respuestas_cuestionario')
      .select(`
        *,
        usuarios!inner(departamento, turno, genero, tipo_contrato)
      `)

    // Aplicar filtros
    if (filters.departamento && filters.departamento !== 'todos') {
      query = query.eq('usuarios.departamento', filters.departamento)
    }
    if (filters.turno && filters.turno !== 'todos') {
      query = query.eq('usuarios.turno', filters.turno)
    }
    if (filters.fechaInicio) {
      query = query.gte('created_at', filters.fechaInicio)
    }
    if (filters.fechaFin) {
      query = query.lte('created_at', filters.fechaFin)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Error obteniendo datos base: ${error.message}`)
    }

    // Procesar con la lógica correcta de GHQ-12
    const processedData = data.map(response => {
      const ghqAnalysis = analyzeGHQ12(response)
      return {
        ...response,
        ...ghqAnalysis
      }
    })

    // Calcular métricas agregadas
    const groupMetrics = calculateGroupMetrics(processedData)
    
    return this.formatCoreMetricsFromCalculation(groupMetrics, processedData)
  }

  /**
   * Obtiene métricas por departamento con análisis de riesgo
   */
  static async getMetricsByDepartment(filters = {}) {
    const cacheKey = metricsCache.generateKey('getMetricsByDepartment', filters)
    const cached = metricsCache.get(cacheKey, CACHE_CONFIG.TTL.DEPARTMENT_METRICS)
    
    if (cached) {
      return { ...cached, fromCache: true }
    }

    const result = await PerformanceMonitor.measureQuery(
      'getMetricsByDepartment',
      async () => {
        try {
          let query = supabase
            .from('v_dashboard_ghq12_by_department')
            .select('*')
            .order('kpi_porcentaje_alto_riesgo', { ascending: false })

          // Aplicar filtros si existen
          if (filters.departamento && filters.departamento !== 'todos') {
            query = query.eq('departamento', filters.departamento)
          }

          const { data, error } = await query

          if (error) {
            throw new Error(`Error obteniendo métricas por departamento: ${error.message}`)
          }

          return this.formatDepartmentMetrics(data)
        } catch (viewError) {
          // Fallback: calcular desde datos base
          return await this.calculateDepartmentMetricsFromBase(filters)
        }
      }
    )

    if (result.success) {
      metricsCache.set(cacheKey, result.data, { 
        filters, 
        generatedAt: new Date().toISOString() 
      })
    }

    return result
  }

  /**
   * Fallback para calcular métricas departamentales desde datos base
   */
  static async calculateDepartmentMetricsFromBase(filters = {}) {
    let query = supabase
      .from('respuestas_cuestionario')
      .select(`
        *,
        usuarios!inner(departamento, turno, genero, tipo_contrato)
      `)

    // Aplicar filtros
    if (filters.turno && filters.turno !== 'todos') {
      query = query.eq('usuarios.turno', filters.turno)
    }
    if (filters.fechaInicio) {
      query = query.gte('created_at', filters.fechaInicio)
    }
    if (filters.fechaFin) {
      query = query.lte('created_at', filters.fechaFin)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Error obteniendo datos por departamento: ${error.message}`)
    }

    // Agrupar por departamento y procesar
    const departmentGroups = data.reduce((acc, response) => {
      const dept = response.usuarios.departamento
      if (!acc[dept]) {
        acc[dept] = []
      }
      
      const ghqAnalysis = analyzeGHQ12(response)
      acc[dept].push({
        ...response,
        ...ghqAnalysis
      })
      
      return acc
    }, {})

    // Calcular métricas para cada departamento
    const departmentMetrics = Object.entries(departmentGroups).map(([dept, responses]) => {
      const groupMetrics = calculateGroupMetrics(responses)
      
      return {
        departamento: dept,
        total_participantes: responses.length,
        promedio_bienestar: groupMetrics.promedioBienestar,
        kpi_porcentaje_alto_riesgo: groupMetrics.kpiPorcentajeAltoRiesgo,
        total_alto_riesgo: groupMetrics.totalAltoRiesgo,
        count_bajo: groupMetrics.distribucion.bajo.count,
        count_moderado: groupMetrics.distribucion.moderado.count,
        count_alto: groupMetrics.distribucion.alto.count,
        count_muy_alto: groupMetrics.distribucion.muyAlto.count
      }
    })

    // Agregar ranking
    departmentMetrics.sort((a, b) => b.kpi_porcentaje_alto_riesgo - a.kpi_porcentaje_alto_riesgo)
    departmentMetrics.forEach((dept, index) => {
      dept.ranking_riesgo = index + 1
    })

    return this.formatDepartmentMetrics(departmentMetrics)
  }

  /**
   * Obtiene datos para heatmap con agrupación flexible
   */
  static async getHeatmapData(groupBy = 'departamento', filters = {}) {
    const cacheKey = metricsCache.generateKey('getHeatmapData', { groupBy, ...filters })
    const cached = metricsCache.get(cacheKey, CACHE_CONFIG.TTL.HEATMAP)
    
    if (cached) {
      return { ...cached, fromCache: true }
    }

    const result = await PerformanceMonitor.measureQuery(
      'getHeatmapData',
      async () => {
        let query = supabase
          .from('respuestas_cuestionario')
          .select(`
            *,
            usuarios!inner(departamento, turno, genero, tipo_contrato, nivel_educativo, rango_edad)
          `)

        // Aplicar filtros
        if (filters.departamento && filters.departamento !== 'todos') {
          query = query.eq('usuarios.departamento', filters.departamento)
        }
        if (filters.turno && filters.turno !== 'todos') {
          query = query.eq('usuarios.turno', filters.turno)
        }
        if (filters.fechaInicio) {
          query = query.gte('created_at', filters.fechaInicio)
        }
        if (filters.fechaFin) {
          query = query.lte('created_at', filters.fechaFin)
        }

        const { data, error } = await query

        if (error) {
          throw new Error(`Error obteniendo datos de heatmap: ${error.message}`)
        }

        return this.formatHeatmapData(data, groupBy)
      }
    )

    if (result.success) {
      metricsCache.set(cacheKey, result.data, { 
        groupBy, 
        filters, 
        generatedAt: new Date().toISOString() 
      })
    }

    return result
  }

  /**
   * Calcula tendencias temporales optimizadas
   */
  static async getTrendsData(metric = 'ghq', period = '6months', filters = {}) {
    const cacheKey = metricsCache.generateKey('getTrendsData', { metric, period, ...filters })
    const cached = metricsCache.get(cacheKey, CACHE_CONFIG.TTL.TRENDS)
    
    if (cached) {
      return { ...cached, fromCache: true }
    }

    const result = await PerformanceMonitor.measureQuery(
      'getTrendsData',
      async () => {
        const dateRange = this.calculateDateRange(period)
        
        let query = supabase
          .from('respuestas_cuestionario')
          .select(`
            created_at,
            *,
            usuarios!inner(departamento, turno)
          `)
          .gte('created_at', dateRange.start)
          .lte('created_at', dateRange.end)
          .order('created_at', { ascending: true })

        // Aplicar filtros
        if (filters.departamento && filters.departamento !== 'todos') {
          query = query.eq('usuarios.departamento', filters.departamento)
        }

        const { data, error } = await query

        if (error) {
          throw new Error(`Error obteniendo datos de tendencias: ${error.message}`)
        }

        return this.formatTrendsData(data, metric, period)
      }
    )

    if (result.success) {
      metricsCache.set(cacheKey, result.data, { 
        metric, 
        period, 
        filters, 
        generatedAt: new Date().toISOString() 
      })
    }

    return result
  }

  // =====================================================
  // MÉTODOS DE FORMATEO Y TRANSFORMACIÓN
  // =====================================================

  static formatCoreMetrics(data) {
    return {
      totalParticipantes: data.total_participantes,
      promedioBienestar: data.promedio_bienestar,
      desviacionEstandar: data.desviacion_estandar,
      
      // KPI Principal
      kpi: {
        porcentajeAltoRiesgo: data.kpi_porcentaje_alto_riesgo,
        totalAltoRiesgo: data.total_alto_riesgo,
        descripcion: 'Porcentaje de trabajadores en riesgo Alto/Muy Alto'
      },
      
      // Distribución por niveles
      distribucion: {
        bajo: {
          count: data.count_bajo,
          percentage: data.pct_bajo,
          label: 'Bajo (Aceptable)',
          color: GHQ12_CONFIG.RISK_THRESHOLDS.BAJO.color
        },
        moderado: {
          count: data.count_moderado,
          percentage: data.pct_moderado,
          label: 'Moderado (Alerta)',
          color: GHQ12_CONFIG.RISK_THRESHOLDS.MODERADO.color
        },
        alto: {
          count: data.count_alto,
          percentage: data.pct_alto,
          label: 'Alto (Alterado)',
          color: GHQ12_CONFIG.RISK_THRESHOLDS.ALTO.color
        },
        muyAlto: {
          count: data.count_muy_alto,
          percentage: data.pct_muy_alto,
          label: 'Muy Alto (Restringido)',
          color: GHQ12_CONFIG.RISK_THRESHOLDS.MUY_ALTO.color
        }
      },
      
      // Dimensiones
      dimensiones: {
        ansiedadDepresion: data.promedio_ansiedad_depresion,
        disfuncionSocial: data.promedio_disfuncion_social
      },
      
      // Metadatos
      metadata: {
        calculadoEn: data.calculado_en || new Date().toISOString(),
        versionCalculo: data.version_calculo || 'GHQ-12 v2.0',
        rangoValido: '0-36 puntos',
        metodologia: 'GHQ-12 con inversión de preguntas negativas'
      }
    }
  }

  static formatCoreMetricsFromCalculation(groupMetrics, rawData) {
    return {
      totalParticipantes: rawData.length,
      promedioBienestar: groupMetrics.promedioBienestar,
      desviacionEstandar: groupMetrics.desviacionEstandar,
      
      // KPI Principal
      kpi: {
        porcentajeAltoRiesgo: groupMetrics.kpiPorcentajeAltoRiesgo,
        totalAltoRiesgo: groupMetrics.totalAltoRiesgo,
        descripcion: 'Porcentaje de trabajadores en riesgo Alto/Muy Alto'
      },
      
      // Distribución por niveles
      distribucion: groupMetrics.distribucion,
      
      // Dimensiones
      dimensiones: {
        ansiedadDepresion: groupMetrics.dimensiones.ansiedadDepresion,
        disfuncionSocial: groupMetrics.dimensiones.disfuncionSocial
      },
      
      // Metadatos
      metadata: {
        calculadoEn: new Date().toISOString(),
        versionCalculo: 'GHQ-12 v2.0',
        rangoValido: '0-36 puntos',
        metodologia: 'GHQ-12 con inversión de preguntas negativas'
      }
    }
  }

  static formatDepartmentMetrics(data) {
    return data.map(dept => ({
      departamento: dept.departamento,
      totalParticipantes: dept.total_participantes,
      promedioBienestar: dept.promedio_bienestar,
      kpiPorcentajeAltoRiesgo: dept.kpi_porcentaje_alto_riesgo,
      totalAltoRiesgo: dept.total_alto_riesgo,
      rankingRiesgo: dept.ranking_riesgo,
      
      distribucion: {
        bajo: dept.count_bajo,
        moderado: dept.count_moderado,
        alto: dept.count_alto,
        muyAlto: dept.count_muy_alto
      },
      
      // Clasificación de riesgo departamental
      clasificacionRiesgo: this.classifyDepartmentRisk(dept.kpi_porcentaje_alto_riesgo),
      
      // Recomendaciones automáticas
      recomendaciones: this.generateDepartmentRecommendations(dept)
    }))
  }

  static formatHeatmapData(data, groupBy) {
    // Procesar cada respuesta con GHQ-12 correcto
    const processedData = data.map(response => {
      const ghqAnalysis = analyzeGHQ12(response)
      return {
        ...response,
        ...ghqAnalysis,
        groupValue: response.usuarios[groupBy] || 'Sin especificar'
      }
    })

    const grouped = processedData.reduce((acc, item) => {
      const key = item.groupValue
      if (!acc[key]) {
        acc[key] = {
          grupo: key,
          totalParticipantes: 0,
          distribucion: {},
          promedioRiesgo: 0,
          participantes: []
        }
      }
      
      acc[key].totalParticipantes++
      acc[key].participantes.push(item)
      
      const nivel = item.nivelRiesgo
      acc[key].distribucion[nivel] = (acc[key].distribucion[nivel] || 0) + 1
      
      return acc
    }, {})

    // Calcular métricas agregadas
    return Object.values(grouped).map(group => {
      const altoRiesgo = group.participantes.filter(p => p.esAltoRiesgo).length
      const porcentajeAltoRiesgo = (altoRiesgo / group.totalParticipantes) * 100
      
      return {
        ...group,
        porcentajeAltoRiesgo: Math.round(porcentajeAltoRiesgo * 100) / 100,
        intensidadColor: this.calculateColorIntensity(porcentajeAltoRiesgo),
        clasificacion: this.classifyGroupRisk(porcentajeAltoRiesgo)
      }
    })
  }

  static formatTrendsData(data, metric, period) {
    // Procesar cada respuesta con métricas correctas
    const processedData = data.map(response => {
      // 1. Calcular GHQ-12 con método correcto (0-1-2-3)
      const ghqAnalysis = analyzeGHQ12(response.respuestas || response)
      
      // 2. Extraer Satisfacción Laboral (pregunta 4 de percepción, escala 1-5)
      const satisfaccionLaboral = this.extractSatisfactionScore(response)
      
      // 3. Calcular % Riesgo Alto usando umbral ≥12 puntos GHQ-12
      const esRiesgoAlto = ghqAnalysis.success && ghqAnalysis.score.totalScore >= 12
      
      return {
        ...response,
        ghqAnalysis,
        satisfaccionLaboral,
        esRiesgoAlto,
        // Mantener compatibilidad con código existente
        puntajeTotalBienestar: ghqAnalysis.success ? ghqAnalysis.score.totalScore : 0,
        esAltoRiesgo: esRiesgoAlto
      }
    })

    // Agrupar por períodos (diario, semanal, mensual)
    const grouping = this.determineGrouping(period)
    const grouped = this.groupByTimePeriod(processedData, grouping, metric)
    
    return {
      metric,
      period,
      grouping,
      data: grouped,
      summary: {
        totalPuntos: grouped.length,
        tendencia: this.calculateTrend(grouped, metric),
        variabilidad: this.calculateVariability(grouped, metric)
      }
    }
  }

  /**
   * Extrae la puntuación de satisfacción laboral de los datos de respuesta
   * Busca en diferentes ubicaciones posibles según la estructura de datos
   */
  static extractSatisfactionScore(response) {
    // Buscar en diferentes ubicaciones posibles
    const respuestas = response.respuestas || response
    
    // Opción 1: Campo directo satisfaccion_laboral
    if (respuestas.satisfaccion_laboral && typeof respuestas.satisfaccion_laboral === 'number') {
      return respuestas.satisfaccion_laboral
    }
    
    // Opción 2: En metadata del usuario
    if (response.usuarios && response.usuarios.metadata && response.usuarios.metadata.satisfaccionLaboral) {
      return response.usuarios.metadata.satisfaccionLaboral
    }
    
    // Opción 3: Campo en el objeto de respuestas como string
    if (respuestas.satisfaccion_laboral && typeof respuestas.satisfaccion_laboral === 'string') {
      const parsed = parseInt(respuestas.satisfaccion_laboral)
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 5) {
        return parsed
      }
    }
    
    // Valor por defecto si no se encuentra
    return 3 // Valor neutro en escala 1-5
  }

  // =====================================================
  // MÉTODOS AUXILIARES
  // =====================================================

  static classifyDepartmentRisk(percentage) {
    if (percentage >= 30) return { level: 'critico', color: '#DC2626', action: 'Intervención inmediata' }
    if (percentage >= 20) return { level: 'alto', color: '#EA580C', action: 'Monitoreo intensivo' }
    if (percentage >= 10) return { level: 'moderado', color: '#D97706', action: 'Seguimiento regular' }
    return { level: 'bajo', color: '#059669', action: 'Mantenimiento' }
  }

  static generateDepartmentRecommendations(dept) {
    const recommendations = []
    
    if (dept.kpi_porcentaje_alto_riesgo >= 25) {
      recommendations.push('Implementar programa de bienestar urgente')
      recommendations.push('Evaluar cargas de trabajo y estrés laboral')
    }
    
    if (dept.total_participantes < 5) {
      recommendations.push('Aumentar participación en evaluaciones')
    }
    
    if (dept.ranking_riesgo <= 3) {
      recommendations.push('Priorizar en intervenciones de SST')
    }
    
    return recommendations
  }

  static calculateColorIntensity(percentage) {
    // Normalizar 0-100% a 0-1 para intensidad de color
    return Math.min(percentage / 50, 1) // 50% = intensidad máxima
  }

  static classifyGroupRisk(percentage) {
    if (percentage >= 30) return 'Crítico'
    if (percentage >= 20) return 'Alto'
    if (percentage >= 10) return 'Moderado'
    return 'Bajo'
  }

  static calculateDateRange(period) {
    const now = new Date()
    const start = new Date()
    
    switch (period) {
      case '1month':
        start.setMonth(now.getMonth() - 1)
        break
      case '3months':
        start.setMonth(now.getMonth() - 3)
        break
      case '6months':
        start.setMonth(now.getMonth() - 6)
        break
      case '1year':
        start.setFullYear(now.getFullYear() - 1)
        break
      default:
        start.setMonth(now.getMonth() - 6)
    }
    
    return {
      start: start.toISOString(),
      end: now.toISOString()
    }
  }

  static determineGrouping(period) {
    switch (period) {
      case '1month':
        return 'daily'
      case '3months':
        return 'weekly'
      case '6months':
      case '1year':
        return 'monthly'
      default:
        return 'weekly'
    }
  }

  static groupByTimePeriod(data, grouping, metric = 'riesgo') {
    // Implementar agrupación temporal según el tipo
    const grouped = {}
    
    data.forEach(item => {
      const date = new Date(item.created_at)
      let key
      
      switch (grouping) {
        case 'daily':
          key = date.toISOString().split('T')[0]
          break
        case 'weekly':
          const weekStart = new Date(date)
          weekStart.setDate(date.getDate() - date.getDay())
          key = weekStart.toISOString().split('T')[0]
          break
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          break
      }
      
      if (!grouped[key]) {
        grouped[key] = {
          periodo: key,
          participantes: [],
          // Inicializar métricas
          satisfaccionLaboral: 0,
          puntuacionGHQ12: 0,
          porcentajeRiesgoAlto: 0,
          // Mantener compatibilidad
          promedioBienestar: 0,
          porcentajeAltoRiesgo: 0
        }
      }
      
      grouped[key].participantes.push(item)
    })
    
    // Calcular métricas para cada período
    return Object.values(grouped).map(group => {
      const participantes = group.participantes
      const totalParticipantes = participantes.length
      
      if (totalParticipantes === 0) {
        return {
          ...group,
          totalParticipantes: 0,
          satisfaccionLaboral: 0,
          puntuacionGHQ12: 0,
          porcentajeRiesgoAlto: 0,
          promedioBienestar: 0,
          porcentajeAltoRiesgo: 0
        }
      }
      
      // 1. Satisfacción Laboral (promedio escala 1-5)
      const satisfaccionPromedio = participantes.reduce((sum, p) => {
        return sum + (p.satisfaccionLaboral || 3)
      }, 0) / totalParticipantes
      
      // 2. Puntuación GHQ-12 (promedio escala 0-36)
      const ghq12Promedio = participantes.reduce((sum, p) => {
        return sum + (p.ghqAnalysis?.score?.totalScore || 0)
      }, 0) / totalParticipantes
      
      // 3. % Riesgo Alto (participantes con GHQ-12 ≥ 12)
      const participantesRiesgoAlto = participantes.filter(p => p.esRiesgoAlto).length
      const porcentajeRiesgoAlto = (participantesRiesgoAlto / totalParticipantes) * 100
      
      return {
        ...group,
        totalParticipantes,
        // Nuevas métricas según especificaciones
        satisfaccionLaboral: Math.round(satisfaccionPromedio * 100) / 100,
        puntuacionGHQ12: Math.round(ghq12Promedio * 100) / 100,
        porcentajeRiesgoAlto: Math.round(porcentajeRiesgoAlto * 100) / 100,
        // Mantener compatibilidad con código existente
        promedioBienestar: Math.round(ghq12Promedio * 100) / 100,
        porcentajeAltoRiesgo: Math.round(porcentajeRiesgoAlto * 100) / 100
      }
    }).sort((a, b) => a.periodo.localeCompare(b.periodo))
  }

  static calculateTrend(data, metric = 'riesgo') {
    if (data.length < 2) return 'insuficiente'
    
    // Seleccionar la métrica correcta según el tipo
    let metricField
    let threshold
    let isPositiveGood = true // true si valores más altos son mejores
    
    switch (metric) {
      case 'satisfaccion':
        metricField = 'satisfaccionLaboral'
        threshold = 0.2 // Cambio mínimo significativo en escala 1-5
        isPositiveGood = true
        break
      case 'ghq':
        metricField = 'puntuacionGHQ12'
        threshold = 1.0 // Cambio mínimo significativo en escala 0-36
        isPositiveGood = false // Valores más bajos son mejores en GHQ-12
        break
      case 'riesgo':
      default:
        metricField = 'porcentajeRiesgoAlto'
        threshold = 2.0 // Cambio mínimo significativo en porcentaje
        isPositiveGood = false // Valores más bajos son mejores
        break
    }
    
    const first = data[0][metricField] || 0
    const last = data[data.length - 1][metricField] || 0
    const change = last - first
    
    if (Math.abs(change) < threshold) return 'estable'
    
    // Determinar si la tendencia es positiva o negativa
    const isImproving = isPositiveGood ? change > 0 : change < 0
    return isImproving ? 'mejorando' : 'empeorando'
  }

  static calculateVariability(data, metric = 'riesgo') {
    if (data.length < 2) return 0
    
    // Seleccionar la métrica correcta según el tipo
    let metricField
    switch (metric) {
      case 'satisfaccion':
        metricField = 'satisfaccionLaboral'
        break
      case 'ghq':
        metricField = 'puntuacionGHQ12'
        break
      case 'riesgo':
      default:
        metricField = 'porcentajeRiesgoAlto'
        break
    }
    
    const values = data.map(d => d[metricField] || 0)
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    
    return Math.round(Math.sqrt(variance) * 100) / 100
  }

  // =====================================================
  // MÉTODOS DE UTILIDAD Y MANTENIMIENTO
  // =====================================================

  static getCacheStats() {
    return metricsCache.getStats()
  }

  static clearCache() {
    metricsCache.clear()
    return { success: true, message: 'Cache limpiado exitosamente' }
  }

  static async refreshMaterializedViews() {
    try {
      const { error } = await supabase.rpc('refresh_ghq12_materialized_views')
      
      if (error) {
        throw new Error(`Error refrescando vistas: ${error.message}`)
      }
      
      // Limpiar cache después del refresh
      this.clearCache()
      
      return { 
        success: true, 
        message: 'Vistas materializadas refrescadas exitosamente',
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return { 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }
  }

  static getServiceHealth() {
    const cacheStats = this.getCacheStats()
    
    return {
      status: 'healthy',
      cache: {
        ...cacheStats,
        performance: cacheStats.hitRate >= PERFORMANCE_THRESHOLDS.CACHE_HIT_TARGET ? 'good' : 'needs_improvement'
      },
      thresholds: PERFORMANCE_THRESHOLDS,
      timestamp: new Date().toISOString()
    }
  }
}

export default MetricsServiceOptimized