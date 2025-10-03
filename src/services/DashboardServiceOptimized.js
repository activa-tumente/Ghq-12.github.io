import { supabase } from '../api/supabase';

/**
 * DashboardService Optimizado
 * Implementa mejores prácticas: caching, error handling, performance
 */
class DashboardServiceOptimized {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
  }

  /**
   * Obtiene datos del dashboard con caching inteligente
   */
  async getDashboardData(filters = {}) {
    const cacheKey = this.generateCacheKey(filters);
    const cachedData = this.getFromCache(cacheKey);
    
    if (cachedData) {
      console.log('Datos obtenidos desde cache');
      return cachedData;
    }

    try {
      const startTime = performance.now();
      
      // Ejecutar consultas en paralelo para mejor performance
      const [
        evaluationsResult,
        usersResult,
        responsesResult
      ] = await Promise.allSettled([
        this.getEvaluationsSummary(filters),
        this.getUsersSummary(filters),
        this.getResponsesSummary(filters)
      ]);

      // Manejar errores de consultas individuales
      const evaluationsData = this.handleSettledResult(evaluationsResult, 'evaluations');
      const usersData = this.handleSettledResult(usersResult, 'users');
      const responsesData = this.handleSettledResult(responsesResult, 'responses');

      // Calcular métricas de forma optimizada
      const metrics = await this.calculateOptimizedMetrics(
        evaluationsData, 
        usersData, 
        responsesData, 
        filters
      );
      
      const segmentedData = await this.getOptimizedSegmentedData(filters);

      const result = {
        success: true,
        data: {
          metrics,
          segmented: segmentedData,
          responses: responsesData.data,
          summary: {
            totalEvaluations: evaluationsData.total,
            totalUsers: usersData.total,
            lastUpdate: new Date().toISOString(),
            queryTime: `${(performance.now() - startTime).toFixed(2)}ms`
          }
        }
      };

      // Guardar en cache
      this.setCache(cacheKey, result);
      
      return result;

    } catch (error) {
      console.error('Error en DashboardServiceOptimized:', error);
      
      // Intentar devolver datos parciales desde cache si existe
      const partialData = this.getPartialDataFromCache(filters);
      if (partialData) {
        return {
          success: true,
          data: partialData,
          warning: 'Datos parciales obtenidos desde cache debido a error en consulta'
        };
      }

      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Maneja resultados de Promise.allSettled
   */
  handleSettledResult(result, type) {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      console.warn(`Error en consulta ${type}:`, result.reason);
      // Devolver estructura vacía pero válida
      return { total: 0, data: [] };
    }
  }

  /**
   * Consulta optimizada de evaluaciones
   */
  async getEvaluationsSummary(filters) {
    const query = supabase
      .from('respuestas_cuestionario')
      .select(`
        id, 
        usuario_id, 
        fecha_respuesta, 
        sesion_id,
        usuarios!inner(
          id,
          nombre,
          departamento,
          turno,
          cargo
        )
      `, { count: 'exact' });

    const optimizedQuery = this.applyOptimizedFilters(query, filters);
    
    const { data, error, count } = await optimizedQuery;
    
    if (error) throw new Error(`Error en evaluaciones: ${error.message}`);
    
    // Optimización: usar Set para conteo único más eficiente
    const uniqueSessions = new Set(data?.map(r => r.sesion_id) || []);
    
    return {
      total: count || 0,
      completed: uniqueSessions.size,
      data: data || []
    };
  }

  /**
   * Consulta optimizada de usuarios
   */
  async getUsersSummary(filters) {
    const query = supabase
      .from('usuarios')
      .select('id, nombre, departamento, turno, cargo', { count: 'exact' });

    const optimizedQuery = this.applyOptimizedFilters(query, filters);
    
    const { data, error, count } = await optimizedQuery;
    
    if (error) throw new Error(`Error en usuarios: ${error.message}`);
    
    return {
      total: count || 0,
      data: data || []
    };
  }

  /**
   * Consulta optimizada de respuestas
   */
  async getResponsesSummary(filters) {
    const query = supabase
      .from('respuestas_cuestionario')
      .select(`
        id,
        usuario_id,
        puntaje_normalizado,
        porcentaje_riesgo,
        fecha_respuesta,
        usuarios!inner(
          id,
          departamento,
          turno,
          cargo,
          genero,
          edad
        )
      `, { count: 'exact' })
      .not('puntaje_normalizado', 'is', null);

    const optimizedQuery = this.applyOptimizedFilters(query, filters);
    
    const { data, error, count } = await optimizedQuery;
    
    if (error) throw new Error(`Error en respuestas: ${error.message}`);
    
    return {
      total: count || 0,
      data: data || []
    };
  }

  /**
   * Aplicar filtros de forma optimizada
   */
  applyOptimizedFilters(query, filters) {
    if (!filters || Object.keys(filters).length === 0) {
      return query;
    }

    let optimizedQuery = query;

    // Aplicar filtros con validación
    if (filters.departamento && Array.isArray(filters.departamento) && filters.departamento.length > 0) {
      optimizedQuery = optimizedQuery.in('usuarios.departamento', filters.departamento);
    }

    if (filters.turno && Array.isArray(filters.turno) && filters.turno.length > 0) {
      optimizedQuery = optimizedQuery.in('usuarios.turno', filters.turno);
    }

    if (filters.cargo && Array.isArray(filters.cargo) && filters.cargo.length > 0) {
      optimizedQuery = optimizedQuery.in('usuarios.cargo', filters.cargo);
    }

    if (filters.fechaInicio && filters.fechaFin) {
      optimizedQuery = optimizedQuery
        .gte('fecha_respuesta', filters.fechaInicio)
        .lte('fecha_respuesta', filters.fechaFin);
    }

    return optimizedQuery;
  }

  /**
   * Calcular métricas de forma optimizada
   */
  async calculateOptimizedMetrics(evaluationsData, usersData, responsesData, filters) {
    const responses = responsesData.data || [];
    
    // Usar reduce para cálculos más eficientes
    const metrics = responses.reduce((acc, response) => {
      const puntaje = parseFloat(response.puntaje_normalizado);
      const riesgo = parseFloat(response.porcentaje_riesgo);
      
      if (!isNaN(puntaje)) {
        acc.ghqScores.push(puntaje);
      }
      
      if (!isNaN(riesgo)) {
        acc.riskScores.push(riesgo);
        
        // Clasificar riesgo de forma eficiente
        if (riesgo >= 80) acc.riskDistribution.critical++;
        else if (riesgo >= 60) acc.riskDistribution.high++;
        else if (riesgo >= 40) acc.riskDistribution.medium++;
        else acc.riskDistribution.low++;
      }
      
      return acc;
    }, {
      ghqScores: [],
      riskScores: [],
      riskDistribution: { low: 0, medium: 0, high: 0, critical: 0 }
    });

    const averageGHQ = metrics.ghqScores.length > 0 
      ? metrics.ghqScores.reduce((sum, score) => sum + score, 0) / metrics.ghqScores.length 
      : 0;

    const participationRate = usersData.total > 0 
      ? (evaluationsData.completed / usersData.total) * 100 
      : 0;

    return {
      totalEvaluations: evaluationsData.total,
      averageGHQ: Math.round(averageGHQ * 100) / 100,
      participationRate: Math.round(participationRate * 10) / 10,
      riskDistribution: metrics.riskDistribution,
      completedEvaluations: evaluationsData.completed,
      dataQuality: {
        validGHQScores: metrics.ghqScores.length,
        validRiskScores: metrics.riskScores.length,
        totalResponses: responses.length
      }
    };
  }

  /**
   * Obtener datos segmentados de forma optimizada
   */
  async getOptimizedSegmentedData(filters) {
    try {
      const [heatmapData, criticalPoints] = await Promise.all([
        this.getHeatmapData(filters),
        this.getCriticalPoints(filters)
      ]);
      
      return {
        byDepartment: {}, // Mantener estructura por si se usa en otro lado
        byTurno: {},
        byGenero: {},
        trends: [],
        heatmap: heatmapData,
        criticalPoints: criticalPoints
      };
    } catch (error) {
      console.warn('Error en datos segmentados:', error);
      return {
        heatmap: [],
        criticalPoints: []
      };
    }
  }

  async getHeatmapData(filters = {}) {
    const { departmentIds, positionIds, startDate, endDate } = filters;
    try {
        const { data, error } = await supabase.rpc('get_risk_heatmap_data', {
            p_start_date: startDate,
            p_end_date: endDate,
            p_department_ids: departmentIds,
            p_position_ids: positionIds,
        });

        if (error) {
            console.error('Error fetching heatmap data from RPC:', error);
            throw error;
        }
        return data;
    } catch (error) {
        console.error('Exception in getHeatmapData:', error);
        throw error;
    }
  }

  async getCriticalPoints(filters = {}) {
    const { departmentIds, positionIds, startDate, endDate } = filters;
    try {
        const { data, error } = await supabase.rpc('get_critical_points_data', {
            p_start_date: startDate,
            p_end_date: endDate,
            p_department_ids: departmentIds,
            p_position_ids: positionIds,
        });

        if (error) {
            console.error('Error fetching critical points from RPC:', error);
            throw error;
        }
        return data;
    } catch (error) {
        console.error('Exception in getCriticalPoints:', error);
        throw error;
    }
  }

  /**
   * Gestión de cache
   */
  generateCacheKey(filters) {
    return `dashboard_${JSON.stringify(filters)}_${Math.floor(Date.now() / this.cacheTimeout)}`;
  }

  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });

    // Limpiar cache antiguo
    if (this.cache.size > 50) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }

  getPartialDataFromCache(filters) {
    // Buscar datos parciales en cache
    for (const [key, value] of this.cache.entries()) {
      if (key.includes('dashboard_') && Date.now() - value.timestamp < this.cacheTimeout * 2) {
        return value.data.data;
      }
    }
    return null;
  }

  /**
   * Limpiar cache manualmente
   */
  clearCache() {
    this.cache.clear();
  }
}

// Exportar instancia singleton
export default new DashboardServiceOptimized();