import { supabase } from '../api/supabase.js';

class DashboardService {
  
  /**
   * Obtiene datos resumidos para el dashboard
   */
  async getDashboardData(filters = {}) {
    try {
      // Obtener datos básicos
      const [
        evaluationsData,
        usersData,
        responsesData
      ] = await Promise.all([
        this.getEvaluationsSummary(filters),
        this.getUsersSummary(filters),
        this.getResponsesSummary(filters)
      ]);

      // Calcular métricas principales
      const metrics = await this.calculateMainMetrics(evaluationsData, usersData, responsesData, filters);
      
      // Calcular métricas derivadas
      const derivedMetrics = await this.calculateDerivedMetrics(responsesData, filters);

      // Obtener datos segmentados
      const segmentedData = await this.getSegmentedData(filters);

      return {
        success: true,
        data: {
          metrics: {
            ...metrics,
            ...derivedMetrics
          },
          segmented: segmentedData,
          responses: responsesData.data, // Agregar datos de respuestas para correlaciones
          summary: {
            totalEvaluations: metrics.completedEvaluations,
            totalUsers: usersData.total,
            lastUpdate: new Date().toISOString()
          }
        }
      };

    } catch (error) {
      console.error('Error en DashboardService:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Resumen de evaluaciones completadas
   */
  async getEvaluationsSummary(filters) {
    let query = supabase
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
          cargo,
          genero,
          edad
        )
      `, { count: 'exact' });

    // Aplicar filtros
    query = this.applyFilters(query, filters, 'respuestas_cuestionario');
    
    const { data, error, count } = await query;
    
    if (error) throw error;
    
    // Contar evaluaciones completadas por sesión única
    const uniqueSessions = new Set(data.map(r => r.sesion_id));
    
    return {
      total: count,
      completed: uniqueSessions.size,
      data: data
    };
  }

  /**
   * Resumen de usuarios
   */
  async getUsersSummary(filters) {
    let query = supabase
      .from('usuarios')
      .select('id, nombre, departamento, turno, cargo, genero, fecha_ingreso', { count: 'exact' });

    // Aplicar filtros
    query = this.applyFilters(query, filters, 'usuarios');
    
    const { data, error, count } = await query;
    
    if (error) throw error;
    
    return {
      total: count,
      data: data
    };
  }

  /**
   * Resumen de respuestas con puntajes GHQ-12
   */
  async getResponsesSummary(filters) {
    let query = supabase
      .from('respuestas_cuestionario')
      .select(`
        *,
        usuarios!inner(
          id,
          nombre,
          departamento,
          turno,
          cargo,
          genero,
          edad,
          antiguedad_empresa,
          uso_epp,
          capacitaciones_seguridad,
          reporta_casi_accidentes,
          accidentes_previos,
          motivacion_seguridad,
          confianza_gerencia,
          satisfaccion_laboral
        )
      `, { count: 'exact' })
      .not('respuesta', 'is', null)
      .not('sesion_id', 'is', null);

    // Aplicar filtros
    query = this.applyFilters(query, filters, 'respuestas_cuestionario');
    
    const { data, error, count } = await query;
    
    if (error) throw error;
    
    return {
      total: count,
      data: data
    };
  }

  /**
   * Calcular métricas principales
   */
  async calculateMainMetrics(evaluationsData, usersData, responsesData, filters) {
    const totalEvaluations = evaluationsData.total;
    const totalUsers = usersData.total;
    const completedEvaluations = evaluationsData.completed;

    // Calcular promedio GHQ-12 usando el campo real 'puntaje_normalizado'
    const ghqScores = responsesData.data
      .filter(r => r.puntaje_normalizado !== null && r.puntaje_normalizado !== undefined)
      .map(r => parseFloat(r.puntaje_normalizado));
    
    const averageGHQ = ghqScores.length > 0 
      ? ghqScores.reduce((sum, score) => sum + score, 0) / ghqScores.length 
      : 0;

    // Calcular cobertura de participación
    const participationRate = totalUsers > 0 
      ? (completedEvaluations / totalUsers) * 100 
      : 0;

    // Calcular distribución de riesgo usando porcentaje_riesgo
    const riskPercentages = responsesData.data
      .filter(r => r.porcentaje_riesgo !== null && r.porcentaje_riesgo !== undefined)
      .map(r => parseFloat(r.porcentaje_riesgo));
    
    const riskDistribution = this.calculateRiskDistribution(riskPercentages);

    return {
      totalEvaluations,
      averageGHQ: parseFloat(averageGHQ.toFixed(2)),
      participationRate: parseFloat(participationRate.toFixed(1)),
      riskDistribution,
      completedEvaluations
    };
  }

  /**
   * Calcular métricas derivadas (ICS, IVP, correlaciones)
   */
  async calculateDerivedMetrics(responsesData, filters) {
    const responses = responsesData.data;
    
    if (!responses || responses.length === 0) {
      return {
        safetyIndex: 0,
        vulnerabilityIndex: 0,
        correlationAntiguedadGHQ: 0,
        correlationConfianzaSatisfaccion: 0
      };
    }

    // Calcular ICS = (uso_epp + capacitaciones_seguridad + reporta_casi_accidentes) / 3
    const icsValues = responses
      .filter(r => r.usuarios && r.usuarios.uso_epp !== null && 
                   r.usuarios.capacitaciones_seguridad !== null && 
                   r.usuarios.reporta_casi_accidentes !== null)
      .map(r => {
        const usoEpp = r.usuarios.uso_epp ? 1 : 0;
        const capacitaciones = r.usuarios.capacitaciones_seguridad ? 1 : 0;
        const reportaCasi = r.usuarios.reporta_casi_accidentes ? 1 : 0;
        return (usoEpp + capacitaciones + reportaCasi) / 3;
      });

    const safetyIndex = icsValues.length > 0 
      ? (icsValues.reduce((sum, val) => sum + val, 0) / icsValues.length) * 100
      : 0;

    // Calcular IVP = (puntaje_normalizado + (5 - motivacion_seguridad) + (accidentes_previos ? 1 : 0)) / 3
    const ivpValues = responses
      .filter(r => r.puntaje_normalizado !== null && 
                   r.usuarios && r.usuarios.motivacion_seguridad !== null && 
                   r.usuarios.accidentes_previos !== null)
      .map(r => {
        const puntajeNorm = parseFloat(r.puntaje_normalizado);
        const motivacionInv = 5 - parseFloat(r.usuarios.motivacion_seguridad);
        const accidentes = r.usuarios.accidentes_previos ? 1 : 0;
        return (puntajeNorm + motivacionInv + accidentes) / 3;
      });

    const vulnerabilityIndex = ivpValues.length > 0 
      ? (ivpValues.reduce((sum, val) => sum + val, 0) / ivpValues.length) * 100
      : 0;

    // Calcular correlación Pearson: antiguedad_empresa vs puntaje_normalizado
    const correlationAntiguedadGHQ = this.calculatePearsonCorrelation(
      responses
        .filter(r => r.usuarios && r.usuarios.antiguedad_empresa !== null && r.puntaje_normalizado !== null)
        .map(r => parseFloat(r.usuarios.antiguedad_empresa)),
      responses
        .filter(r => r.usuarios && r.usuarios.antiguedad_empresa !== null && r.puntaje_normalizado !== null)
        .map(r => parseFloat(r.puntaje_normalizado))
    );

    // Calcular correlación: confianza_gerencia vs satisfaccion_laboral
    const correlationConfianzaSatisfaccion = this.calculatePearsonCorrelation(
      responses
        .filter(r => r.usuarios && r.usuarios.confianza_gerencia !== null && r.usuarios.satisfaccion_laboral !== null)
        .map(r => parseFloat(r.usuarios.confianza_gerencia)),
      responses
        .filter(r => r.usuarios && r.usuarios.confianza_gerencia !== null && r.usuarios.satisfaccion_laboral !== null)
        .map(r => parseFloat(r.usuarios.satisfaccion_laboral))
    );

    return {
      safetyIndex: parseFloat(safetyIndex.toFixed(1)),
      vulnerabilityIndex: parseFloat(vulnerabilityIndex.toFixed(1)),
      correlationAntiguedadGHQ: parseFloat(correlationAntiguedadGHQ.toFixed(3)),
      correlationConfianzaSatisfaccion: parseFloat(correlationConfianzaSatisfaccion.toFixed(3))
    };
  }

  /**
   * Obtener datos segmentados por categorías
   */
  async getSegmentedData(filters) {
    try {
      // Obtener respuestas con datos de usuarios
      const responsesData = await this.getResponsesSummary(filters);
      const responses = responsesData.data;
      
      if (!responses || responses.length === 0) {
        return {
          byDepartment: {},
          byShift: {},
          byGender: {},
          byPosition: {},
          bySeniority: {},
          byAge: {}
        };
      }

      // Segmentar por departamento
      const byDepartment = this.segmentByDepartment(responses);
      
      // Segmentar por turno
      const byShift = this.segmentByShift(responses);
      
      // Segmentar por género
      const byGender = this.segmentByGender(responses);
      
      // Segmentar por cargo
      const byPosition = this.segmentByPosition(responses);
      
      // Segmentar por antigüedad
      const bySeniority = this.segmentBySeniority(responses);
      
      // Segmentar por edad
      const byAge = this.segmentByAge(responses);

      return {
        byDepartment,
        byShift,
        byGender,
        byPosition,
        bySeniority,
        byAge
      };
    } catch (error) {
      console.error('Error en getSegmentedData:', error);
      return {
        byDepartment: {},
        byShift: {},
        byGender: {},
        byPosition: {},
        bySeniority: {},
        byAge: {}
      };
    }
  }

  /**
   * Segmentar datos por departamento
   */
  segmentByDepartment(responses) {
    const departmentStats = {};
    
    responses.forEach(response => {
      if (response.usuarios && response.usuarios.departamento) {
        const dept = response.usuarios.departamento;
        
        if (!departmentStats[dept]) {
          departmentStats[dept] = {
            count: 0,
            totalGHQ: 0,
            totalRisk: 0,
            responses: []
          };
        }
        
        departmentStats[dept].count++;
        
        if (response.puntaje_normalizado !== null && response.puntaje_normalizado !== undefined) {
          departmentStats[dept].totalGHQ += parseFloat(response.puntaje_normalizado);
        }
        
        if (response.porcentaje_riesgo !== null && response.porcentaje_riesgo !== undefined) {
          departmentStats[dept].totalRisk += parseFloat(response.porcentaje_riesgo);
        }
        
        departmentStats[dept].responses.push(response);
      }
    });

    // Calcular promedios
    Object.keys(departmentStats).forEach(dept => {
      const stats = departmentStats[dept];
      stats.averageGHQ = stats.count > 0 ? parseFloat((stats.totalGHQ / stats.count).toFixed(2)) : 0;
      stats.averageRisk = stats.count > 0 ? parseFloat((stats.totalRisk / stats.count).toFixed(2)) : 0;
      
      // Calcular distribución de riesgo para el departamento
      const riskScores = stats.responses
        .filter(r => r.porcentaje_riesgo !== null && r.porcentaje_riesgo !== undefined)
        .map(r => parseFloat(r.porcentaje_riesgo));
      
      stats.riskDistribution = this.calculateRiskDistribution(riskScores);
      
      // Eliminar respuestas individuales para optimizar memoria
      delete stats.responses;
      delete stats.totalGHQ;
      delete stats.totalRisk;
    });

    return departmentStats;
  }

  /**
   * Segmentar datos por turno
   */
  segmentByShift(responses) {
    const shiftStats = {};
    
    responses.forEach(response => {
      if (response.usuarios && response.usuarios.turno) {
        const shift = response.usuarios.turno;
        
        if (!shiftStats[shift]) {
          shiftStats[shift] = {
            count: 0,
            totalGHQ: 0,
            totalRisk: 0
          };
        }
        
        shiftStats[shift].count++;
        
        if (response.puntaje_normalizado !== null && response.puntaje_normalizado !== undefined) {
          shiftStats[shift].totalGHQ += parseFloat(response.puntaje_normalizado);
        }
        
        if (response.porcentaje_riesgo !== null && response.porcentaje_riesgo !== undefined) {
          shiftStats[shift].totalRisk += parseFloat(response.porcentaje_riesgo);
        }
      }
    });

    // Calcular promedios
    Object.keys(shiftStats).forEach(shift => {
      const stats = shiftStats[shift];
      stats.averageGHQ = stats.count > 0 ? parseFloat((stats.totalGHQ / stats.count).toFixed(2)) : 0;
      stats.averageRisk = stats.count > 0 ? parseFloat((stats.totalRisk / stats.count).toFixed(2)) : 0;
      
      delete stats.totalGHQ;
      delete stats.totalRisk;
    });

    return shiftStats;
  }

  /**
   * Segmentar datos por género
   */
  segmentByGender(responses) {
    const genderStats = {};
    
    responses.forEach(response => {
      if (response.usuarios && response.usuarios.genero) {
        const gender = response.usuarios.genero;
        
        if (!genderStats[gender]) {
          genderStats[gender] = {
            count: 0,
            totalGHQ: 0,
            totalRisk: 0
          };
        }
        
        genderStats[gender].count++;
        
        if (response.puntaje_normalizado !== null && response.puntaje_normalizado !== undefined) {
          genderStats[gender].totalGHQ += parseFloat(response.puntaje_normalizado);
        }
        
        if (response.porcentaje_riesgo !== null && response.porcentaje_riesgo !== undefined) {
          genderStats[gender].totalRisk += parseFloat(response.porcentaje_riesgo);
        }
      }
    });

    // Calcular promedios
    Object.keys(genderStats).forEach(gender => {
      const stats = genderStats[gender];
      stats.averageGHQ = stats.count > 0 ? parseFloat((stats.totalGHQ / stats.count).toFixed(2)) : 0;
      stats.averageRisk = stats.count > 0 ? parseFloat((stats.totalRisk / stats.count).toFixed(2)) : 0;
      
      delete stats.totalGHQ;
      delete stats.totalRisk;
    });

    return genderStats;
  }

  /**
   * Segmentar datos por cargo
   */
  segmentByPosition(responses) {
    const positionStats = {};
    
    responses.forEach(response => {
      if (response.usuarios && response.usuarios.cargo) {
        const position = response.usuarios.cargo;
        
        if (!positionStats[position]) {
          positionStats[position] = {
            count: 0,
            totalGHQ: 0,
            totalRisk: 0
          };
        }
        
        positionStats[position].count++;
        
        if (response.puntaje_normalizado !== null && response.puntaje_normalizado !== undefined) {
          positionStats[position].totalGHQ += parseFloat(response.puntaje_normalizado);
        }
        
        if (response.porcentaje_riesgo !== null && response.porcentaje_riesgo !== undefined) {
          positionStats[position].totalRisk += parseFloat(response.porcentaje_riesgo);
        }
      }
    });

    // Calcular promedios
    Object.keys(positionStats).forEach(position => {
      const stats = positionStats[position];
      stats.averageGHQ = stats.count > 0 ? parseFloat((stats.totalGHQ / stats.count).toFixed(2)) : 0;
      stats.averageRisk = stats.count > 0 ? parseFloat((stats.totalRisk / stats.count).toFixed(2)) : 0;
      
      delete stats.totalGHQ;
      delete stats.totalRisk;
    });

    return positionStats;
  }

  /**
   * Segmentar datos por antigüedad
   */
  segmentBySeniority(responses) {
    const seniorityStats = {
      '0-1 años': { count: 0, totalGHQ: 0, totalRisk: 0 },
      '1-3 años': { count: 0, totalGHQ: 0, totalRisk: 0 },
      '3-5 años': { count: 0, totalGHQ: 0, totalRisk: 0 },
      '5+ años': { count: 0, totalGHQ: 0, totalRisk: 0 }
    };
    
    responses.forEach(response => {
      if (response.usuarios && response.usuarios.antiguedad_empresa !== null) {
        const seniority = parseFloat(response.usuarios.antiguedad_empresa);
        let category;
        
        if (seniority <= 1) category = '0-1 años';
        else if (seniority <= 3) category = '1-3 años';
        else if (seniority <= 5) category = '3-5 años';
        else category = '5+ años';
        
        seniorityStats[category].count++;
        
        if (response.puntaje_normalizado !== null && response.puntaje_normalizado !== undefined) {
          seniorityStats[category].totalGHQ += parseFloat(response.puntaje_normalizado);
        }
        
        if (response.porcentaje_riesgo !== null && response.porcentaje_riesgo !== undefined) {
          seniorityStats[category].totalRisk += parseFloat(response.porcentaje_riesgo);
        }
      }
    });

    // Calcular promedios
    Object.keys(seniorityStats).forEach(category => {
      const stats = seniorityStats[category];
      stats.averageGHQ = stats.count > 0 ? parseFloat((stats.totalGHQ / stats.count).toFixed(2)) : 0;
      stats.averageRisk = stats.count > 0 ? parseFloat((stats.totalRisk / stats.count).toFixed(2)) : 0;
      
      delete stats.totalGHQ;
      delete stats.totalRisk;
    });

    return seniorityStats;
  }

  /**
   * Segmentar datos por edad
   */
  segmentByAge(responses) {
    const ageStats = {
      '18-25': { count: 0, totalGHQ: 0, totalRisk: 0 },
      '26-35': { count: 0, totalGHQ: 0, totalRisk: 0 },
      '36-45': { count: 0, totalGHQ: 0, totalRisk: 0 },
      '46+': { count: 0, totalGHQ: 0, totalRisk: 0 }
    };
    
    responses.forEach(response => {
      if (response.usuarios && response.usuarios.edad !== null) {
        const age = parseFloat(response.usuarios.edad);
        let category;
        
        if (age <= 25) category = '18-25';
        else if (age <= 35) category = '26-35';
        else if (age <= 45) category = '36-45';
        else category = '46+';
        
        ageStats[category].count++;
        
        if (response.puntaje_normalizado !== null && response.puntaje_normalizado !== undefined) {
          ageStats[category].totalGHQ += parseFloat(response.puntaje_normalizado);
        }
        
        if (response.porcentaje_riesgo !== null && response.porcentaje_riesgo !== undefined) {
          ageStats[category].totalRisk += parseFloat(response.porcentaje_riesgo);
        }
      }
    });

    // Calcular promedios
    Object.keys(ageStats).forEach(category => {
      const stats = ageStats[category];
      stats.averageGHQ = stats.count > 0 ? parseFloat((stats.totalGHQ / stats.count).toFixed(2)) : 0;
      stats.averageRisk = stats.count > 0 ? parseFloat((stats.totalRisk / stats.count).toFixed(2)) : 0;
      
      delete stats.totalGHQ;
      delete stats.totalRisk;
    });

    return ageStats;
  }

  /**
   * Calcular distribución de riesgo basado en GHQ-12
   */
  calculateRiskDistribution(scores) {
    if (!scores || scores.length === 0) {
      return { bajo: 0, moderado: 0, alto: 0, muyAlto: 0 };
    }

    const distribution = {
      bajo: 0,      // GHQ 0-1
      moderado: 0,  // GHQ 2-3
      alto: 0,      // GHQ 4-6
      muyAlto: 0    // GHQ 7+
    };

    scores.forEach(score => {
      if (score <= 1) distribution.bajo++;
      else if (score <= 3) distribution.moderado++;
      else if (score <= 6) distribution.alto++;
      else distribution.muyAlto++;
    });

    // Convertir a porcentajes
    const total = scores.length;
    return {
      bajo: parseFloat(((distribution.bajo / total) * 100).toFixed(1)),
      moderado: parseFloat(((distribution.moderado / total) * 100).toFixed(1)),
      alto: parseFloat(((distribution.alto / total) * 100).toFixed(1)),
      muyAlto: parseFloat(((distribution.muyAlto / total) * 100).toFixed(1))
    };
  }

  /**
   * Aplicar filtros a la consulta
   */
  applyFilters(query, filters, tableName = 'respuestas_cuestionario') {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        const isUsersTable = tableName === 'usuarios';

        // Manejar filtros especiales
        if (key === 'ageRange' && Array.isArray(value) && value.length === 2) {
          const ageColumn = isUsersTable ? 'edad' : 'usuarios.edad';
          query = query
            .gte(ageColumn, value[0])
            .lte(ageColumn, value[1]);
        } else if (key === 'tenureRange' && Array.isArray(value) && value.length === 2) {
          const tenureColumn = isUsersTable ? 'fecha_ingreso' : 'usuarios.fecha_ingreso';
          
          const maxDate = new Date();
          maxDate.setFullYear(maxDate.getFullYear() - value[0]);

          const minDate = new Date();
          minDate.setFullYear(minDate.getFullYear() - value[1]);

          query = query
            .gte(tenureColumn, minDate.toISOString())
            .lte(tenureColumn, maxDate.toISOString());
        } else if (key === 'departamento' || key === 'turno' || key === 'cargo' || key === 'genero') {
          const column = isUsersTable ? key : `usuarios.${key}`;
          // Filtros que están en la tabla usuarios
          if (Array.isArray(value)) {
            query = query.in(column, value);
          } else {
            query = query.eq(column, value);
          }
        } else if (key !== 'ageRange' && key !== 'tenureRange') {
          // Filtros normales para la tabla principal
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else {
            query = query.eq(key, value);
          }
        }
      }
    });
    return query;
  }

  /**
   * Obtener opciones de filtro disponibles
   */
  async getFilterOptions() {
    try {
      const [departments, shifts, positions, genders] = await Promise.all([
        this.getUniqueValues('usuarios', 'departamento'),
        this.getUniqueValues('usuarios', 'turno'),
        this.getUniqueValues('usuarios', 'cargo'),
        this.getUniqueValues('usuarios', 'genero')
      ]);

      return {
        departments: departments.filter(Boolean),
        shifts: shifts.filter(Boolean),
        positions: positions.filter(Boolean),
        genders: genders.filter(Boolean)
      };
    } catch (error) {
      console.error('Error obteniendo opciones de filtro:', error);
      return { departments: [], shifts: [], positions: [], genders: [] };
    }
  }

  /**
   * Obtener valores únicos de una columna
   */
  async getUniqueValues(table, column) {
    const { data, error } = await supabase
      .from(table)
      .select(column)
      .not(column, 'is', null);

    if (error) throw error;

    return [...new Set(data.map(item => item[column]))];
  }

  /**
   * Calcular correlación de Pearson entre two arrays de valores
   */
  calculatePearsonCorrelation(x, y) {
    if (!x || !y || x.length !== y.length || x.length === 0) {
      return 0;
    }

    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
    const sumY2 = y.reduce((sum, val) => sum + val * val, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    if (denominator === 0) {
      return 0;
    }

    return numerator / denominator;
  }

  /**
   * Obtener tendencias temporales del riesgo psicosocial
   * Evolución semanal del puntaje promedio GHQ-12 y % de trabajadores en riesgo alto/muy alto
   */
  async getTimeTrends(filters = {}) {
    console.log('🔍 DashboardService.getTimeTrends - Iniciando con filtros:', filters);

    try {
      let query = supabase
        .from('respuestas_cuestionario')
        .select(`
          fecha_respuesta,
          puntaje_normalizado,
          porcentaje_riesgo,
          usuarios!inner(
            id,
            departamento,
            turno,
            cargo,
            genero
          )
        `)
        .not('fecha_respuesta', 'is', null)
        .not('puntaje_normalizado', 'is', null)
        .not('porcentaje_riesgo', 'is', null)
        .order('fecha_respuesta', { ascending: true });

      console.log('📊 DashboardService.getTimeTrends - Query construida');

      // Aplicar filtros
      query = this.applyFilters(query, filters, 'respuestas_cuestionario');

      console.log('🔎 DashboardService.getTimeTrends - Ejecutando query...');
      const { data, error } = await query;

      if (error) {
        console.error('❌ DashboardService.getTimeTrends - Error en query:', error);
        throw error;
      }

      console.log('📦 DashboardService.getTimeTrends - Datos recibidos:', {
        count: data?.length,
        hasData: !!data
      });

      if (!data || data.length === 0) {
        console.warn('⚠️ DashboardService.getTimeTrends - Sin datos');
        return [];
      }

      // Agrupar por semana y calcular métricas
      const weeklyData = {};

      data.forEach(response => {
        const fecha = new Date(response.fecha_respuesta);
        // Calcular semana del año (YYYY-Www)
        const year = fecha.getFullYear();
        const weekNumber = this.getWeekNumber(fecha);
        const semana = `${year}-W${weekNumber.toString().padStart(2, '0')}`;

        if (!weeklyData[semana]) {
          weeklyData[semana] = {
            semana: semana,
            fecha_inicio: this.getStartOfWeek(fecha).toISOString().split('T')[0],
            fecha_fin: this.getEndOfWeek(fecha).toISOString().split('T')[0],
            totalPuntaje: 0,
            totalRiesgo: 0,
            count: 0,
            altoRiesgoCount: 0
          };
        }

        const puntaje = parseFloat(response.puntaje_normalizado);
        const riesgo = parseFloat(response.porcentaje_riesgo);

        weeklyData[semana].totalPuntaje += puntaje;
        weeklyData[semana].totalRiesgo += riesgo;
        weeklyData[semana].count += 1;

        // Contar respuestas de alto riesgo (>= 80%)
        if (riesgo >= 80) {
          weeklyData[semana].altoRiesgoCount += 1;
        }
      });

      // Calcular promedios y porcentajes
      const result = Object.values(weeklyData).map(item => ({
        semana: item.semana,
        fecha_inicio: item.fecha_inicio,
        fecha_fin: item.fecha_fin,
        promedio_ghq: item.count > 0 ? parseFloat((item.totalPuntaje / item.count).toFixed(2)) : 0,
        promedio_riesgo: item.count > 0 ? parseFloat((item.totalRiesgo / item.count).toFixed(2)) : 0,
        pct_muy_alto: item.count > 0 ? parseFloat(((item.altoRiesgoCount / item.count) * 100).toFixed(2)) : 0,
        total_respuestas: item.count
      }));

      // Ordenar por fecha de inicio
      const sortedResult = result.sort((a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio));

      console.log('✅ DashboardService.getTimeTrends - Resultado final:', {
        semanas: sortedResult.length,
        primeraSemana: sortedResult[0]?.semana,
        ultimaSemana: sortedResult[sortedResult.length - 1]?.semana,
        datos: sortedResult
      });

      return sortedResult;

    } catch (error) {
      console.error('❌ DashboardService.getTimeTrends - Error:', error);
      throw error;
    }
  }

  /**
   * Calcular el número de semana ISO 8601 para una fecha
   * Basado en la especificación ISO 8601: la semana 1 es la que contiene el primer jueves del año
   */
  getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
  }

  /**
   * Obtener el inicio de la semana (lunes)
   */
  getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajustar para que lunes sea el primer día
    return new Date(d.setDate(diff));
  }

  /**
   * Obtener el fin de la semana (domingo)
   */
  getEndOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() + (7 - day) - (day === 0 ? 7 : 0); // Ajustar para que domingo sea el último día
    return new Date(d.setDate(diff));
  }
}

export default new DashboardService();