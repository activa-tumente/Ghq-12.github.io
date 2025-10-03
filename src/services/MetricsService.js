import { supabase } from '../api/supabase';
import { logError } from '../utils/ErrorHandling.jsx';
import { MetricsRepository } from './metrics/MetricsRepository';
import { MetricsCalculator } from './metrics/MetricsCalculator';
import { MetricsValidator } from './metrics/MetricsValidator';
import { MetricsErrorHandler } from './metrics/MetricsErrorHandler';

/**
 * Servicio para gestionar métricas reales sincronizadas con Supabase
 * Proporciona datos actualizados para todas las páginas del dashboard
 */

// Constantes de configuración
const METRICS_CONFIG = {
  TOTAL_QUESTIONS: 12,
  WELLNESS_THRESHOLDS: {
    EXCELLENT: 1,
    GOOD: 1.5,
    REGULAR: 2
  },
  TREND_THRESHOLDS: {
    GROWING: 5,
    DECLINING: -5
  },
  DEFAULT_VALUES: {
    EVALUACIONES_COMPLETADAS: 0,
    USUARIOS_ACTIVOS: 0,
    INDICE_BIENESTAR: 0,
    TENDENCIA_MENSUAL: '0%',
    PROMEDIO_SALUD: 0,
    TOTAL_RESPUESTAS: 0
  }
};

export class MetricsService {
  
  /**
   * Valida filtros de entrada usando MetricsCalculator
   * @deprecated Use MetricsCalculator.validateFilters instead
   */
  static validarFiltros(filtros = {}) {
    return MetricsCalculator.validateFilters(filtros);
  }

  /**
   * Obtener métricas generales para la página de inicio
   */
  static async getHomeMetrics() {
    try {
      console.log('📊 Obteniendo métricas para Home...');
      
      // Usar repository para obtener datos
      const { totalUsuarios, totalRespuestas, respuestas } = await MetricsRepository.getBasicCounts();

      // Usar calculator para procesar métricas
      const { promedioSalud, indiceBienestar, usuariosConRespuestas } = 
        MetricsCalculator.calculateWellnessMetrics(respuestas);
      
      const tendencia = MetricsCalculator.calculateMonthlyTrend(respuestas);

      return {
        evaluacionesCompletadas: usuariosConRespuestas,
        usuariosActivos: totalUsuarios,
        indiceBienestar,
        tendenciaMensual: tendencia.formatted,
        promedioSalud,
        totalRespuestas
      };

    } catch (error) {
      console.error('❌ Error obteniendo métricas de Home:', error);
      logError(error, { operation: 'MetricsService.getHomeMetrics' });
      
      // Retornar métricas por defecto en caso de error
      return METRICS_CONFIG.DEFAULT_VALUES;
    }
  }

  /**
    * Obtener métricas detalladas para el dashboard analítico (método legacy)
    */
  static async getDashboardMetrics(filtros = {}) {
    try {
      const filtrosValidados = this.validarFiltros(filtros);
      console.log('📈 Obteniendo métricas para Dashboard...', filtrosValidados);

      // Obtener datos completos con joins usando metadata (fallback para compatibilidad)
      const { data: datosCompletos, error } = await supabase
        .from('respuestas_cuestionario')
        .select(`
          *,
          usuarios!inner(
            id,
            nombre,
            email,
            metadata,
            created_at
          )
        `);

      if (error) throw error;

      // Aplicar filtros usando metadata (compatibilidad hacia atrás)
      let datosFiltrados = datosCompletos || [];

      if (filtrosValidados.genero && filtrosValidados.genero !== 'todos') {
        datosFiltrados = datosFiltrados.filter(d =>
          d.usuarios?.metadata?.genero === filtrosValidados.genero
        );
      }

      if (filtrosValidados.departamento && filtrosValidados.departamento !== 'todos') {
        datosFiltrados = datosFiltrados.filter(d =>
          d.usuarios?.metadata?.departamento === filtrosValidados.departamento
        );
      }

      if (filtrosValidados.turno && filtrosValidados.turno !== 'todos') {
        datosFiltrados = datosFiltrados.filter(d =>
          d.usuarios?.metadata?.turno === filtrosValidados.turno
        );
      }

      if (filtrosValidados.tipoContrato && filtrosValidados.tipoContrato !== 'todos') {
        datosFiltrados = datosFiltrados.filter(d =>
          d.usuarios?.metadata?.tipoContrato === filtrosValidados.tipoContrato
        );
      }

      if (filtrosValidados.nivelEducativo && filtrosValidados.nivelEducativo !== 'todos') {
        datosFiltrados = datosFiltrados.filter(d =>
          d.usuarios?.metadata?.nivelEducativo === filtrosValidados.nivelEducativo
        );
      }

      if (filtrosValidados.fechaInicio || filtrosValidados.fechaFin) {
        datosFiltrados = this.filtrarPorFechas(datosFiltrados, filtrosValidados.fechaInicio, filtrosValidados.fechaFin);
      }

      return this.procesarDatosParaDashboard(datosFiltrados);

    } catch (error) {
      console.error('❌ Error obteniendo métricas de Dashboard:', error);
      logError(error, { operation: 'MetricsService.getDashboardMetrics', filtros });
      throw error;
    }
  }

  /**
   * Obtener métricas para la página de cuestionarios
   */
  static async getQuestionnaireMetrics() {
    try {
      console.log('📋 Obteniendo métricas para Cuestionarios...');
      
      const [
        { data: usuarios, error: usuariosError },
        { data: respuestas, error: respuestasError }
      ] = await Promise.all([
        supabase.from('usuarios').select('id, nombre, documento, cargo, departamento, area_macro, edad, genero, fecha_creacion'),
        supabase.from('respuestas_cuestionario').select('usuario_id, respuesta, fecha_respuesta')
      ]);

      if (usuariosError) throw usuariosError;
      if (respuestasError) throw respuestasError;

      // Procesar datos para cuestionarios
      const usuariosConRespuestas = new Set(respuestas?.map(r => r.usuario_id) || []);
      
      const cuestionarios = usuarios?.map(usuario => {
        const tieneRespuestas = usuariosConRespuestas.has(usuario.id);
        const respuestasUsuario = respuestas?.filter(r => r.usuario_id === usuario.id) || [];
        
        // Calcular puntuación promedio del usuario
        let puntuacionTotal = 0;
        let totalPreguntas = 0;
        
        respuestasUsuario.forEach(respuesta => {
          if (respuesta.respuesta && typeof respuesta.respuesta === 'object') {
            Object.values(respuesta.respuesta).forEach(valor => {
              if (typeof valor === 'number') {
                puntuacionTotal += valor;
                totalPreguntas++;
              }
            });
          }
        });

        const puntuacionPromedio = totalPreguntas > 0 ? puntuacionTotal / totalPreguntas : 0;
        const nivelBienestar = this.calcularNivelBienestar(puntuacionPromedio);

        return {
          id: usuario.id,
          nombre: usuario.nombre,
          documento: usuario.documento,
          area: usuario.area_macro || 'Sin especificar',
          turno: 'Sin especificar', // Not available in current schema
          estado: tieneRespuestas ? 'completado' : 'pendiente',
          fechaCreacion: usuario.fecha_creacion,
          fechaCompletado: tieneRespuestas ? respuestasUsuario[respuestasUsuario.length - 1]?.fecha_respuesta : null,
          puntuacionPromedio: parseFloat(puntuacionPromedio.toFixed(2)),
          nivelBienestar,
          totalRespuestas: respuestasUsuario.length
        };
      }) || [];

      return {
        cuestionarios,
        totalCuestionarios: cuestionarios.length,
        completados: cuestionarios.filter(c => c.estado === 'completado').length,
        pendientes: cuestionarios.filter(c => c.estado === 'pendiente').length,
        promedioGeneral: this.calcularPromedioGeneral(cuestionarios)
      };

    } catch (error) {
      console.error('❌ Error obteniendo métricas de Cuestionarios:', error);
      logError(error, { operation: 'MetricsService.getQuestionnaireMetrics' });
      throw error;
    }
  }

  /**
   * Obtener métricas para la página de respuestas
   */
  static async getResponsesMetrics() {
    try {
      console.log('💬 Obteniendo métricas para Respuestas...');
      
      const { data: respuestas, error } = await supabase
        .from('respuestas_cuestionario')
        .select(`
          *,
          usuarios!inner(
            nombre,
            email,
            metadata
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Procesar respuestas detalladas
      const respuestasDetalladas = respuestas?.map(respuesta => {
        const respuestasObj = respuesta.respuestas || {};
        const valores = Object.values(respuestasObj).filter(v => typeof v === 'number');
        const promedio = valores.length > 0 ? valores.reduce((a, b) => a + b, 0) / valores.length : 0;

        // Extract user info from joined data
        const usuario = respuesta.usuarios || {};
        const metadata = usuario.metadata || {};

        return {
          id: respuesta.id,
          usuario: {
            nombre: usuario.nombre || 'Sin nombre',
            documento: usuario.documento || '',
            area: usuario.area_macro || usuario.departamento || 'Sin especificar',
            turno: usuario.turno || 'Sin especificar'
          },
          respuestas: respuestasObj,
          promedio: parseFloat(promedio.toFixed(2)),
          nivelBienestar: this.calcularNivelBienestar(promedio),
          fechaRespuesta: respuesta.created_at,
          totalPreguntas: valores.length
        };
      }) || [];

      // Calcular estadísticas de respuestas
      const distribucionRespuestas = this.calcularDistribucionRespuestas(respuestasDetalladas);
      const estadisticasPorPregunta = this.calcularEstadisticasPorPregunta(respuestasDetalladas);

      return {
        respuestas: respuestasDetalladas,
        totalRespuestas: respuestasDetalladas.length,
        distribucionRespuestas,
        estadisticasPorPregunta,
        promedioGeneral: respuestasDetalladas.length > 0 
          ? respuestasDetalladas.reduce((sum, r) => sum + r.promedio, 0) / respuestasDetalladas.length 
          : 0
      };

    } catch (error) {
      console.error('❌ Error obteniendo métricas de Respuestas:', error);
      logError(error, { operation: 'MetricsService.getResponsesMetrics' });
      throw error;
    }
  }

  /**
    * Obtener métricas para la página de usuarios
    */
  static async getUsersMetrics() {
    try {
      console.log('👥 Obteniendo métricas para Usuarios...');

      const [
        { data: usuarios, error: usuariosError },
        { data: respuestas, error: respuestasError }
      ] = await Promise.all([
        supabase.from('usuarios').select('*').order('fecha_creacion', { ascending: false }),
        supabase.from('respuestas_cuestionario').select('usuario_id, fecha_respuesta')
      ]);

      if (usuariosError) throw usuariosError;
      if (respuestasError) throw respuestasError;

      const usuariosConRespuestas = new Set(respuestas?.map(r => r.usuario_id) || []);

      // Procesar usuarios con estadísticas usando las nuevas columnas estructuradas
      const usuariosConEstadisticas = usuarios?.map(usuario => {
        const tieneRespuestas = usuariosConRespuestas.has(usuario.id);
        const respuestasUsuario = respuestas?.filter(r => r.usuario_id === usuario.id) || [];

        return {
          ...usuario,
          estadoEvaluacion: tieneRespuestas ? 'completado' : 'pendiente',
          totalEvaluaciones: respuestasUsuario.length,
          ultimaEvaluacion: respuestasUsuario.length > 0
            ? respuestasUsuario[respuestasUsuario.length - 1].fecha_respuesta
            : null,
          departamento: usuario.departamento || 'Sin especificar',
          turno: usuario.turno || 'Sin especificar',
          genero: usuario.genero || 'Sin especificar',
          edad: usuario.fecha_nacimiento ? this.calcularEdad(usuario.fecha_nacimiento) : null
        };
      }) || [];

      // Calcular estadísticas por segmentos usando las nuevas columnas
      const estadisticasPorDepartamento = this.calcularEstadisticasPorSegmento(usuariosConEstadisticas, 'departamento');
      const estadisticasPorTurno = this.calcularEstadisticasPorSegmento(usuariosConEstadisticas, 'turno');
      const estadisticasPorGenero = this.calcularEstadisticasPorSegmento(usuariosConEstadisticas, 'genero');

      return {
        usuarios: usuariosConEstadisticas,
        totalUsuarios: usuariosConEstadisticas.length,
        usuariosActivos: usuariosConEstadisticas.filter(u => u.estadoEvaluacion === 'completado').length,
        usuariosPendientes: usuariosConEstadisticas.filter(u => u.estadoEvaluacion === 'pendiente').length,
        estadisticasPorDepartamento,
        estadisticasPorTurno,
        estadisticasPorGenero
      };

    } catch (error) {
      console.error('❌ Error obteniendo métricas de Usuarios:', error);
      logError(error, { operation: 'MetricsService.getUsersMetrics' });
      throw error;
    }
  }

  /**
   * Obtener métricas del dashboard analítico moderno
   */
  static async getDashboardAnalytics(filters = {}) {
    try {
      console.log('📊 Obteniendo métricas del dashboard analítico...', filters);

      // Obtener datos de usuarios y respuestas del cuestionario
      const [
        { data: usuarios, error: usuariosError },
        { data: respuestas, error: respuestasError }
      ] = await Promise.all([
        supabase.from('usuarios').select('*'),
        supabase.from('respuestas_cuestionario').select('*, usuarios!inner(*)')
      ]);

      if (usuariosError) throw usuariosError;
      if (respuestasError) throw respuestasError;

      // Aplicar filtros primero para calcular métricas basadas en datos filtrados
      let filteredUsers = usuarios || [];
      let filteredResponses = respuestas || [];

      // Aplicar filtros sociodemográficos
      if (filters.genero && filters.genero !== 'todos') {
        filteredUsers = filteredUsers.filter(u => u.genero === filters.genero);
        filteredResponses = filteredResponses.filter(r =>
          filteredUsers.some(u => u.id === r.user_id)
        );
      }

      if (filters.departamento && filters.departamento !== 'todos') {
        filteredUsers = filteredUsers.filter(u => u.departamento === filters.departamento);
        filteredResponses = filteredResponses.filter(r =>
          filteredUsers.some(u => u.id === r.user_id)
        );
      }

      if (filters.turno && filters.turno !== 'todos') {
        filteredUsers = filteredUsers.filter(u => u.turno === filters.turno);
        filteredResponses = filteredResponses.filter(r =>
          filteredUsers.some(u => u.id === r.user_id)
        );
      }

      // Calcular métricas de seguridad con datos filtrados
      const safety = this.calculateSafetyFromMetadata(filteredUsers);

      // Calcular distribución GHQ-12 con datos filtrados
      const ghqDistribution = this.calculateGhqDistribution(filteredResponses);

      // Calcular métricas de percepción con datos filtrados
      const perception = this.calculatePerceptionFromMetadata(filteredUsers);

      // Calcular datos por departamento con filtros aplicados
      const departments = this.calculateDepartmentsData(filteredUsers, filteredResponses);

      // Procesar heatmap GHQ-12
      const ghqHeatmap = this.processGhqHeatmapAdvanced(filteredResponses, 'departamento');

      const processedData = {
        general: {
          totalParticipantes: filteredUsers.length,
          totalRespuestas: filteredResponses.length,
          tasaCompletacion: filteredUsers.length > 0 ? Math.round((filteredResponses.length / filteredUsers.length) * 100) : 0
        },
        sociodemographic: this.calculateSociodemographicFromMetadata(filteredUsers),
        safety,
        perception,
        ghqDistribution,
        departments,
        ghqHeatmap: ghqHeatmap.data,
        riskIndicators: {
          empleadosEnRiesgo: ghqDistribution.empleadosEnRiesgo,
          pctRiesgoAlto: ghqDistribution.pctRiesgoAlto,
          totalRespuestas: ghqDistribution.totalRespuestas
        },
        // Datos para compatibilidad con componentes existentes
        ghqLevels: [
          { name: 'Bajo', value: ghqDistribution.bajo, fill: '#10B981' },
          { name: 'Moderado', value: ghqDistribution.moderado, fill: '#F59E0B' },
          { name: 'Alto', value: ghqDistribution.alto, fill: '#F97316' },
          { name: 'Muy Alto', value: ghqDistribution.muyAlto, fill: '#EF4444' }
        ].filter(item => item.value > 0)
      };

      return processedData;

    } catch (error) {
      console.error('❌ Error obteniendo métricas del dashboard:', error);
      logError(error, { operation: 'MetricsService.getDashboardAnalytics', filters });
      throw error;
    }
  }

  // Métodos auxiliares privados

  /**
   * Calcula la edad a partir de la fecha de nacimiento
   */
  static calcularEdad(fechaNacimiento) {
    if (!fechaNacimiento) return null;
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  }

  /**
   * Procesa datos para heatmap de GHQ-12
   */
  static processGhqHeatmapData(ghqData) {
    if (!ghqData || ghqData.length === 0) return [];
    
    return ghqData.map(item => ({
      userId: item.user_id,
      departamento: item.departamento,
      responses: [item.q1, item.q2, item.q3, item.q4, item.q5, item.q6,
                 item.q7, item.q8, item.q9, item.q10, item.q11, item.q12],
      totalScore: item.total_score,
      riskLevel: item.risk_level
    }));
  }

  /**
   * Procesa datos sociodemográficos
   */
  static processSociodemographicData(generalMetrics) {
    if (!generalMetrics) return {};
    
    return {
      gender: {
        masculino: generalMetrics.masculino_count || 0,
        femenino: generalMetrics.femenino_count || 0,
        otro: generalMetrics.otro_genero_count || 0
      },
      ageGroups: {
        '18-25': generalMetrics.edad_18_25 || 0,
        '26-35': generalMetrics.edad_26_35 || 0,
        '36-45': generalMetrics.edad_36_45 || 0,
        '46-55': generalMetrics.edad_46_55 || 0,
        '56+': generalMetrics.edad_56_plus || 0
      }
    };
  }

  /**
   * Procesa datos de seguridad
   */
  static processSafetyData(generalMetrics) {
    if (!generalMetrics) return {};
    
    return {
      capacitacion: generalMetrics.pct_capacitacion || 0,
      accidentes: generalMetrics.pct_accidentes || 0,
      casiAccidentes: generalMetrics.pct_casi_accidentes || 0,
      usoEpp: generalMetrics.pct_uso_epp || 0
    };
  }

  /**
   * Procesa datos de percepción
   */
  static processPerceptionData(generalMetrics) {
    if (!generalMetrics) return {};
    
    return {
      satisfaccion: generalMetrics.satisfaccion_promedio || 0,
      motivacion: generalMetrics.motivacion_promedio || 0,
      confianza: generalMetrics.confianza_promedio || 0
    };
  }

  /**
   * Procesa distribución de GHQ-12
   */
  static processGhqDistribution(generalMetrics) {
    if (!generalMetrics) return {};
    
    return {
      bajo: generalMetrics.ghq_bajo || 0,
      moderado: generalMetrics.ghq_moderado || 0,
      alto: generalMetrics.ghq_alto || 0,
      muyAlto: generalMetrics.ghq_muy_alto || 0
    };
  }

  /**
   * Procesa indicadores de riesgo
   */
  static processRiskIndicators(generalMetrics) {
    if (!generalMetrics) return {};
    
    return {
      porcentajeRiesgoAlto: generalMetrics.pct_riesgo_alto || 0,
      promedioTotal: generalMetrics.ghq_promedio_total || 0,
      totalRespuestas: generalMetrics.total_respuestas_ghq || 0
    };
  }

  /**
   * Calcula el promedio de respuestas de un conjunto de datos
   */
  static calcularPromedioRespuestas(respuestas) {
    let totalPuntuacion = 0;
    let totalPreguntas = 0;
    
    respuestas?.forEach(respuesta => {
      if (respuesta.respuestas && typeof respuesta.respuestas === 'object') {
        Object.values(respuesta.respuestas).forEach(valor => {
          if (typeof valor === 'number') {
            totalPuntuacion += valor;
            totalPreguntas++;
          }
        });
      }
    });

    return {
      promedio: totalPreguntas > 0 ? totalPuntuacion / totalPreguntas : 0,
      totalPuntuacion,
      totalPreguntas
    };
  }

  /**
   * Filtra datos por rango de fechas
   */
  static filtrarPorFechas(datos, fechaInicio, fechaFin) {
    return datos.filter(dato => {
      const fecha = new Date(dato.created_at);
      if (fechaInicio && fecha < new Date(fechaInicio)) return false;
      if (fechaFin && fecha > new Date(fechaFin)) return false;
      return true;
    });
  }

  /**
   * Calcula métricas de tendencia mensual
   */
  static calcularTendenciaMensual(datos) {
    const fechaActual = new Date();
    const mesAnterior = new Date(fechaActual.getFullYear(), fechaActual.getMonth() - 1, 1);
    
    const datosMesActual = datos.filter(d => 
      new Date(d.created_at) >= new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1)
    );
    
    const datosMesAnterior = datos.filter(d => {
      const fecha = new Date(d.created_at);
      return fecha >= mesAnterior && fecha < new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
    });

    const cambio = datosMesAnterior.length > 0 
      ? ((datosMesActual.length - datosMesAnterior.length) / datosMesAnterior.length) * 100
      : datosMesActual.length > 0 ? 100 : 0;

    return `${cambio >= 0 ? '+' : ''}${Math.round(cambio)}%`;
  }

  static processDataForDashboard(data) {
    const uniqueUsers = new Set(data.map(d => d.user_id));
    const totalParticipants = uniqueUsers.size;

    // Calculate global average using utility
    const scores = [];
    data.forEach(item => {
      if (item.respuestas && typeof item.respuestas === 'object') {
        Object.values(item.respuestas).forEach(value => {
          if (typeof value === 'number') {
            scores.push(value);
          }
        });
      }
    });

    const { average: globalAverage } = calculateBasicStats(scores);
    const complianceLevel = ((3 - globalAverage) / 3) * 100;

    return {
      generalResults: {
        completedEvaluations: totalParticipants,
        globalAverage: parseFloat(globalAverage.toFixed(2)),
        complianceLevel: Math.round(Math.max(0, complianceLevel)),
        temporalTrend: this.calculateTemporalTrend(data)
      },
      categoryResults: this.calculateCategoryResults(data),
      segmentation: this.calculateSegmentation(data),
      securityData: this.calculateSecurityData(data),
      temporalEvolution: this.calculateTemporalEvolution(data)
    };
  }

  static calcularNivelBienestar(promedio) {
    const { EXCELLENT, GOOD, REGULAR } = METRICS_CONFIG.WELLNESS_THRESHOLDS;
    
    if (promedio <= EXCELLENT) return 'Excelente';
    if (promedio <= GOOD) return 'Bueno';
    if (promedio <= REGULAR) return 'Regular';
    return 'Necesita atención';
  }

  static calcularPromedioGeneral(cuestionarios) {
    const completados = cuestionarios.filter(c => c.estado === 'completado');
    if (completados.length === 0) return 0;
    
    const suma = completados.reduce((sum, c) => sum + c.puntuacionPromedio, 0);
    return parseFloat((suma / completados.length).toFixed(2));
  }

  static calcularDistribucionRespuestas(respuestas) {
    const distribucion = { 0: 0, 1: 0, 2: 0, 3: 0 };
    
    respuestas.forEach(respuesta => {
      Object.values(respuesta.respuestas).forEach(valor => {
        if (typeof valor === 'number' && distribucion.hasOwnProperty(valor)) {
          distribucion[valor]++;
        }
      });
    });

    return distribucion;
  }

  static calcularEstadisticasPorPregunta(respuestas) {
    const estadisticas = {};
    
    for (let i = 1; i <= METRICS_CONFIG.TOTAL_QUESTIONS; i++) {
      const valoresPregunta = [];
      
      respuestas.forEach(respuesta => {
        const valor = respuesta.respuestas[`pregunta_${i}`];
        if (typeof valor === 'number') {
          valoresPregunta.push(valor);
        }
      });

      if (valoresPregunta.length > 0) {
        const promedio = valoresPregunta.reduce((a, b) => a + b, 0) / valoresPregunta.length;
        estadisticas[`pregunta_${i}`] = {
          promedio: parseFloat(promedio.toFixed(2)),
          total: valoresPregunta.length,
          distribucion: valoresPregunta.reduce((acc, val) => {
            acc[val] = (acc[val] || 0) + 1;
            return acc;
          }, {})
        };
      }
    }

    return estadisticas;
  }

  static calcularEstadisticasPorSegmento(usuarios, campo) {
    const segmentos = {};
    
    usuarios.forEach(usuario => {
      const valor = usuario[campo];
      if (!segmentos[valor]) {
        segmentos[valor] = {
          total: 0,
          completados: 0,
          pendientes: 0
        };
      }
      
      segmentos[valor].total++;
      if (usuario.estadoEvaluacion === 'completado') {
        segmentos[valor].completados++;
      } else {
        segmentos[valor].pendientes++;
      }
    });

    return segmentos;
  }

  static calcularTendenciaTemporal(datos) {
    // Implementación básica de tendencia temporal
    const ahora = new Date();
    const mesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
    
    const datosMesActual = datos.filter(d => new Date(d.created_at) >= new Date(ahora.getFullYear(), ahora.getMonth(), 1));
    const datosMesAnterior = datos.filter(d => {
      const fecha = new Date(d.created_at);
      return fecha >= mesAnterior && fecha < new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    });

    const cambio = datosMesAnterior.length > 0 
      ? ((datosMesActual.length - datosMesAnterior.length) / datosMesAnterior.length) * 100
      : datosMesActual.length > 0 ? 100 : 0;

    return {
      cambioMensual: parseFloat(cambio.toFixed(1)),
      tendencia: cambio > 5 ? 'creciente' : cambio < -5 ? 'decreciente' : 'estable'
    };
  }

  static calcularResultadosPorCategoria(datos) {
    // Para GHQ-12, todas las preguntas son de salud general
    return {
      salud_general: {
        nombre: 'Salud General',
        promedio: 0, // Calcular basado en datos reales
        cumplimiento: 0 // Calcular basado en datos reales
      }
    };
  }

  static calcularSegmentacion(datos) {
    const segmentacion = {
      porDepartamento: {},
      porTurno: {},
      porGenero: {},
      porEdad: {},
      porContrato: {},
      porEducacion: {}
    };

    datos.forEach(dato => {
      const usuario = dato.usuarios || {};

      // Por departamento
      const departamento = usuario.departamento || 'Sin especificar';
      if (!segmentacion.porDepartamento[departamento]) {
        segmentacion.porDepartamento[departamento] = { totalUsuarios: 0, promedio: 0 };
      }
      segmentacion.porDepartamento[departamento].totalUsuarios++;

      // Por turno
      const turno = usuario.turno || 'Sin especificar';
      if (!segmentacion.porTurno[turno]) {
        segmentacion.porTurno[turno] = { totalUsuarios: 0, promedio: 0 };
      }
      segmentacion.porTurno[turno].totalUsuarios++;

      // Por género
      const genero = usuario.genero || 'Sin especificar';
      if (!segmentacion.porGenero[genero]) {
        segmentacion.porGenero[genero] = { totalUsuarios: 0, promedio: 0 };
      }
      segmentacion.porGenero[genero].totalUsuarios++;

      // Por tipo de contrato
      const contrato = usuario.tipo_contrato || 'Sin especificar';
      if (!segmentacion.porContrato[contrato]) {
        segmentacion.porContrato[contrato] = { totalUsuarios: 0, promedio: 0 };
      }
      segmentacion.porContrato[contrato].totalUsuarios++;

      // Por nivel educativo
      const educacion = usuario.nivel_educativo || 'Sin especificar';
      if (!segmentacion.porEducacion[educacion]) {
        segmentacion.porEducacion[educacion] = { totalUsuarios: 0, promedio: 0 };
      }
      segmentacion.porEducacion[educacion].totalUsuarios++;
    });

    return segmentacion;
  }

  static calcularDatosSeguridad(datos) {
    // Calcular indicadores de bienestar basados en respuestas
    const totalRespuestas = datos.length;
    let respuestasSaludables = 0;
    let respuestasProblematicas = 0;

    datos.forEach(dato => {
      if (dato.respuestas && typeof dato.respuestas === 'object') {
        Object.values(dato.respuestas).forEach(valor => {
          if (typeof valor === 'number') {
            if (valor <= 1) respuestasSaludables++;
            if (valor >= 2) respuestasProblematicas++;
          }
        });
      }
    });

    return {
      respuestasSaludables: totalRespuestas > 0 ? Math.round((respuestasSaludables / totalRespuestas) * 100) : 0,
      respuestasProblematicas: totalRespuestas > 0 ? Math.round((respuestasProblematicas / totalRespuestas) * 100) : 0
    };
  }

  static calcularEvolucionTemporal(datos) {
    const promediosPorMes = {};

    datos.forEach(dato => {
      const fecha = new Date(dato.created_at);
      const mesAno = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;

      if (!promediosPorMes[mesAno]) {
        promediosPorMes[mesAno] = [];
      }

      if (dato.respuestas && typeof dato.respuestas === 'object') {
        const valores = Object.values(dato.respuestas).filter(v => typeof v === 'number');
        if (valores.length > 0) {
          const promedio = valores.reduce((a, b) => a + b, 0) / valores.length;
          promediosPorMes[mesAno].push(promedio);
        }
      }
    });

    // Calcular promedio por mes
    Object.keys(promediosPorMes).forEach(mes => {
      const valores = promediosPorMes[mes];
      promediosPorMes[mes] = valores.length > 0
        ? parseFloat((valores.reduce((a, b) => a + b, 0) / valores.length).toFixed(2))
        : 0;
    });

    return {
      promediosPorMes,
      tendencia: 'estable', // Calcular basado en datos reales
      variacion: 0 // Calcular basado en datos reales
    };
  }

  // Métodos auxiliares para el dashboard moderno

  /**
   * Calcular edad a partir de fecha de nacimiento
   */
  static calcularEdad(fechaNacimiento) {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();

    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }

    return edad;
  }

  /**
   * Procesar datos para heatmap de GHQ-12
   */
  static processGhqHeatmapData(ghqData) {
    const heatmap = [];

    // Para cada pregunta (1-12)
    for (let pregunta = 1; pregunta <= 12; pregunta++) {
      const preguntaData = {
        pregunta: pregunta,
        respuestas: [0, 0, 0, 0] // Índices: 0=Nada, 1=Menos que lo habitual, 2=Igual que lo habitual, 3=Más que lo habitual
      };

      ghqData.forEach(row => {
        const respuesta = row[`q${pregunta}`];
        if (respuesta !== null && respuesta >= 0 && respuesta <= 3) {
          preguntaData.respuestas[respuesta]++;
        }
      });

      heatmap.push(preguntaData);
    }

    return heatmap;
  }

  /**
   * Procesar datos sociodemográficos
   */
  static processSociodemographicData(metrics) {
    return {
      totalParticipantes: metrics?.total_participantes || 0,
      distribucionGenero: {
        masculino: metrics?.masculino_count || 0,
        femenino: metrics?.femenino_count || 0,
        otro: metrics?.otro_genero_count || 0
      },
      distribucionEdad: {
        '18-25': metrics?.edad_18_25 || 0,
        '26-35': metrics?.edad_26_35 || 0,
        '36-45': metrics?.edad_36_45 || 0,
        '46-55': metrics?.edad_46_55 || 0,
        '56+': metrics?.edad_56_plus || 0
      },
      distribucionContrato: {
        indefinido: metrics?.contrato_indefinido || 0,
        temporal: metrics?.contrato_temporal || 0,
        practica: metrics?.contrato_practica || 0
      },
      distribucionEducacion: {
        primaria: metrics?.educacion_primaria || 0,
        secundaria: metrics?.educacion_secundaria || 0,
        tecnico: metrics?.educacion_tecnico || 0,
        universitario: metrics?.educacion_universitario || 0,
        postgrado: metrics?.educacion_postgrado || 0
      },
      distribucionTurno: {
        diurno: metrics?.turno_diurno || 0,
        nocturno: metrics?.turno_nocturno || 0,
        rotativo: metrics?.turno_rotativo || 0
      },
      antiguedadPromedio: metrics?.antiguedad_promedio || 0
    };
  }

  /**
   * Procesar datos de seguridad
   */
  static processSafetyData(metrics) {
    return {
      capacitacion: metrics?.pct_capacitacion || 0,
      accidentesPrevios: metrics?.pct_accidentes || 0,
      reportesCasiAccidentes: metrics?.pct_casi_accidentes || 0,
      usoEPP: metrics?.pct_uso_epp || 0
    };
  }

  /**
   * Procesar datos de percepción laboral
   */
  static processPerceptionData(metrics) {
    return {
      satisfaccionLaboral: metrics?.satisfaccion_promedio || 0,
      motivacionSeguridad: metrics?.motivacion_promedio || 0,
      confianzaGerencia: metrics?.confianza_promedio || 0
    };
  }

  /**
   * Procesar distribución de niveles GHQ-12
   */
  static processGhqDistribution(metrics) {
    return {
      bajo: metrics?.ghq_bajo || 0,
      moderado: metrics?.ghq_moderado || 0,
      alto: metrics?.ghq_alto || 0,
      muyAlto: metrics?.ghq_muy_alto || 0,
      promedioTotal: metrics?.ghq_promedio_total || 0
    };
  }

  /**
   * Procesar indicadores de riesgo
   */
  static processRiskIndicators(metrics) {
    return {
      empleadosEnRiesgo: metrics?.pct_riesgo_alto || 0,
      totalRespuestas: metrics?.total_respuestas_ghq || 0
    };
  }

  // Métodos auxiliares para dashboard moderno con metadata

  /**
   * Calcular métricas sociodemográficas desde metadata
   */
  static calculateSociodemographicFromMetadata(users) {
    const stats = {
      totalParticipantes: users.length,
      distribucionGenero: { masculino: 0, femenino: 0, otro: 0 },
      distribucionEdad: { '18-25': 0, '26-35': 0, '36-45': 0, '46-55': 0, '56+': 0 },
      distribucionContrato: { indefinido: 0, temporal: 0, practica: 0 },
      distribucionEducacion: { primaria: 0, secundaria: 0, tecnico: 0, universitario: 0, postgrado: 0 },
      distribucionTurno: { diurno: 0, nocturno: 0, rotativo: 0 },
      antiguedadPromedio: 0
    };

    let totalAntiguedad = 0;
    let antiguedadCount = 0;

    users.forEach(user => {
      // Usar columnas directas de la base de datos en lugar de metadata
      
      // Género - usar columna directa
      const genero = user.genero;
      if (genero === 'masculino' || genero === 'Masculino') stats.distribucionGenero.masculino++;
      else if (genero === 'femenino' || genero === 'Femenino') stats.distribucionGenero.femenino++;
      else stats.distribucionGenero.otro++;

      // Edad - usar columna directa
      const edad = user.edad;
      if (edad && typeof edad === 'number') {
        if (edad <= 25) stats.distribucionEdad['18-25']++;
        else if (edad <= 35) stats.distribucionEdad['26-35']++;
        else if (edad <= 45) stats.distribucionEdad['36-45']++;
        else if (edad <= 55) stats.distribucionEdad['46-55']++;
        else stats.distribucionEdad['56+']++;
      }

      // Contrato - no disponible en el esquema actual, usar valores por defecto
      // const contrato = user.tipo_contrato; // No existe en el esquema actual
      // Mantener contadores en 0 por ahora

      // Educación - no disponible en el esquema actual, usar valores por defecto
      // const educacion = user.nivel_educativo; // No existe en el esquema actual
      // Mantener contadores en 0 por ahora

      // Turno - no disponible en el esquema actual, usar valores por defecto
      // const turno = user.turno; // No existe en el esquema actual
      // Mantener contadores en 0 por ahora

      // Antigüedad - calcular desde fecha_ingreso si está disponible
      if (user.fecha_ingreso) {
        const fechaIngreso = new Date(user.fecha_ingreso);
        const ahora = new Date();
        const antiguedad = (ahora - fechaIngreso) / (1000 * 60 * 60 * 24 * 365); // años
        if (antiguedad >= 0) {
          totalAntiguedad += antiguedad;
          antiguedadCount++;
        }
      }
    });

    stats.antiguedadPromedio = antiguedadCount > 0 ? totalAntiguedad / antiguedadCount : 0;

    return stats;
  }

  /**
   * Calcular métricas de seguridad desde metadata con lógica avanzada
   */
  static calculateSafetyFromMetadata(users) {
    if (!users || users.length === 0) {
      return {
        capacitacion: 0,
        accidentesPrevios: 0,
        reportesCasiAccidentes: 0,
        usoEPP: 0,
        totalParticipantes: 0
      };
    }

    let capacitacion = 0, accidentes = 0, casiAccidentes = 0, usoEPP = 0;

    users.forEach(user => {
      // Los campos de seguridad no están disponibles en el esquema actual
      // Mantener contadores en 0 por ahora hasta que se agreguen estas columnas
      
      // TODO: Agregar columnas de seguridad a la tabla usuarios:
      // - capacitaciones_seguridad
      // - accidentes_previos  
      // - reporta_casi_accidentes
      // - uso_epp
      
      // Por ahora, no incrementar ningún contador ya que no tenemos los datos
    });

    const total = users.length;
    return {
      capacitacion: total > 0 ? Math.round((capacitacion / total) * 100) : 0,
      accidentesPrevios: total > 0 ? Math.round((accidentes / total) * 100) : 0,
      reportesCasiAccidentes: total > 0 ? Math.round((casiAccidentes / total) * 100) : 0,
      usoEPP: total > 0 ? Math.round((usoEPP / total) * 100) : 0,
      totalParticipantes: total,
      // Datos detallados para análisis
      capacitacionCount: capacitacion,
      accidentesCount: accidentes,
      casiAccidentesCount: casiAccidentes,
      usoEPPCount: usoEPP
    };
  }

  /**
   * Calcular métricas de percepción desde metadata
   */
  static calculatePerceptionFromMetadata(users) {
    let totalSatisfaccion = 0, totalMotivacion = 0, totalConfianza = 0;
    let countSatisfaccion = 0, countMotivacion = 0, countConfianza = 0;

    users.forEach(user => {
      // Los campos de percepción no están disponibles en el esquema actual
      // Mantener contadores en 0 por ahora hasta que se agreguen estas columnas
      
      // TODO: Agregar columnas de percepción a la tabla usuarios:
      // - satisfaccion_laboral
      // - motivacion_seguridad
      // - confianza_gerencia
      
      // Por ahora, no incrementar ningún contador ya que no tenemos los datos
    });

    return {
      satisfaccionLaboral: countSatisfaccion > 0 ? Math.round((totalSatisfaccion / countSatisfaccion) * 10) / 10 : 0,
      motivacionSeguridad: countMotivacion > 0 ? Math.round((totalMotivacion / countMotivacion) * 10) / 10 : 0,
      confianzaGerencia: countConfianza > 0 ? Math.round((totalConfianza / countConfianza) * 10) / 10 : 0
    };
  }

  /**
   * Calcular distribución GHQ-12 con lógica avanzada
   */
  static calculateGhqDistribution(responses) {
    const levels = { bajo: 0, moderado: 0, alto: 0, muyAlto: 0 };
    let totalScore = 0;
    let scoreCount = 0;
    const scores = [];

    responses.forEach(response => {
      const metadata = response.metadata || {};
      const score = metadata.totalScore;

      if (typeof score === 'number') {
        totalScore += score;
        scoreCount++;
        scores.push(score);

        // Clasificación por niveles de riesgo (GHQ-12 estándar)
        if (score <= 11) levels.bajo++;
        else if (score <= 18) levels.moderado++;
        else if (score <= 25) levels.alto++;
        else levels.muyAlto++;
      }
    });

    const promedio = scoreCount > 0 ? totalScore / scoreCount : 0;
    const empleadosEnRiesgo = levels.alto + levels.muyAlto;
    const pctRiesgoAlto = scoreCount > 0 ? Math.round((empleadosEnRiesgo / scoreCount) * 100) : 0;

    return {
      bajo: levels.bajo,
      moderado: levels.moderado,
      alto: levels.alto,
      muyAlto: levels.muyAlto,
      promedioTotal: Math.round(promedio * 10) / 10,
      empleadosEnRiesgo,
      pctRiesgoAlto,
      totalRespuestas: scoreCount,
      // Estadísticas adicionales
      mediana: this.calculateMedian(scores),
      desviacionEstandar: this.calculateStandardDeviation(scores, promedio),
      rango: scores.length > 0 ? `${Math.min(...scores)} - ${Math.max(...scores)}` : 'N/A'
    };
  }

  /**
   * Procesar datos para heatmap GHQ-12 avanzado
   */
  static processGhqHeatmapAdvanced(responses, groupBy = 'departamento') {
    const heatmapData = [];
    const groupData = {};

    // Agrupar respuestas por la dimensión seleccionada
    responses.forEach(response => {
      const user = response.usuarios || {};
      const metadata = user.metadata || {};
      const groupKey = metadata[groupBy] || 'Sin especificar';

      if (!groupData[groupKey]) {
        groupData[groupKey] = {
          group: groupKey,
          responses: [],
          totalParticipants: 0
        };
      }

      groupData[groupKey].responses.push(response);
      groupData[groupKey].totalParticipants++;
    });

    // Para cada pregunta (1-12), calcular distribución por grupo
    for (let pregunta = 1; pregunta <= 12; pregunta++) {
      const preguntaData = {
        pregunta: pregunta,
        preguntaTexto: this.getGhqQuestionText(pregunta),
        grupos: []
      };

      Object.keys(groupData).forEach(groupKey => {
        const group = groupData[groupKey];
        const respuestasCriticas = [0, 0, 0, 0]; // [Nada, Menos, Igual, Más]

        group.responses.forEach(response => {
          const respuesta = response.respuestas || {};
          const valor = respuesta[pregunta.toString()];

          if (valor !== null && valor !== undefined && valor >= 0 && valor <= 3) {
            respuestasCriticas[valor]++;
          }
        });

        // Calcular porcentaje de respuestas críticas (valores 2 y 3)
        const totalRespuestas = respuestasCriticas.reduce((a, b) => a + b, 0);
        const pctCriticas = totalRespuestas > 0 ?
          Math.round(((respuestasCriticas[2] + respuestasCriticas[3]) / totalRespuestas) * 100) : 0;

        preguntaData.grupos.push({
          grupo: groupKey,
          distribucion: respuestasCriticas,
          pctCriticas,
          totalRespuestas
        });
      });

      heatmapData.push(preguntaData);
    }

    return {
      data: heatmapData,
      grupos: Object.keys(groupData),
      totalGrupos: Object.keys(groupData).length
    };
  }

  /**
   * Obtener texto de pregunta GHQ-12
   */
  static getGhqQuestionText(questionNumber) {
    const questions = {
      1: "Se ha sentido capaz de controlar sus problemas",
      2: "Ha podido continuar con sus actividades habituales",
      3: "Se ha sentido nervioso/a o con los nervios de punta",
      4: "Se ha sentido tan desanimado/a que nada podía animarle",
      5: "Ha perdido la confianza en sí mismo/a",
      6: "Se ha sentido inútil o poco valioso/a",
      7: "Se ha sentido razonablemente feliz, considerando las circunstancias",
      8: "Ha podido disfrutar de sus actividades diarias",
      9: "Ha sido capaz de enfrentarse a sus problemas",
      10: "Se ha sentido que estaba perdiendo el control",
      11: "Ha estado preocupado/a por sentirse bajo tensión o presión",
      12: "Ha sentido que no podía superar sus dificultades"
    };
    return questions[questionNumber] || `Pregunta ${questionNumber}`;
  }

  /**
   * Calcular mediana
   */
  static calculateMedian(values) {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  /**
   * Calcular desviación estándar
   */
  static calculateStandardDeviation(values, mean) {
    if (values.length === 0) return 0;
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
    return Math.round(Math.sqrt(variance) * 10) / 10;
  }

  /**
   * Calcular datos por departamento
   */
  static calculateDepartmentsData(users, responses) {
    const deptMap = new Map();

    // Procesar usuarios por departamento
    users.forEach(user => {
      const dept = user.metadata?.area || 'Sin asignar';
      if (!deptMap.has(dept)) {
        deptMap.set(dept, {
          departamento: dept,
          total_participantes: 0,
          satisfaccion_promedio: 0,
          motivacion_promedio: 0,
          confianza_promedio: 0,
          ghq_promedio: 0,
          pct_riesgo: 0,
          metadata: user.metadata,
          users: [],
          responses: []
        });
      }
      deptMap.get(dept).total_participantes++;
      deptMap.get(dept).users.push(user);
    });

    // Procesar respuestas por departamento
    responses.forEach(response => {
      const user = users.find(u => u.id === response.user_id);
      if (user) {
        const dept = user.metadata?.area || 'Sin asignar';
        if (deptMap.has(dept)) {
          deptMap.get(dept).responses.push(response);
        }
      }
    });

    // Calcular promedios
    const result = [];
    deptMap.forEach(dept => {
      const { users, responses } = dept;

      // Satisfacción
      const satisfacciones = users
        .map(u => u.metadata?.satisfaccionLaboral)
        .filter(s => typeof s === 'number');
      dept.satisfaccion_promedio = satisfacciones.length > 0
        ? Math.round((satisfacciones.reduce((a, b) => a + b, 0) / satisfacciones.length) * 10) / 10
        : 0;

      // Motivación
      const motivaciones = users
        .map(u => u.metadata?.motivacionSeguridad)
        .filter(m => typeof m === 'number');
      dept.motivacion_promedio = motivaciones.length > 0
        ? Math.round((motivaciones.reduce((a, b) => a + b, 0) / motivaciones.length) * 10) / 10
        : 0;

      // Confianza
      const confianzas = users
        .map(u => u.metadata?.confianzaGerencia)
        .filter(c => typeof c === 'number');
      dept.confianza_promedio = confianzas.length > 0
        ? Math.round((confianzas.reduce((a, b) => a + b, 0) / confianzas.length) * 10) / 10
        : 0;

      // GHQ
      const ghqScores = responses
        .map(r => r.metadata?.totalScore)
        .filter(s => typeof s === 'number');
      dept.ghq_promedio = ghqScores.length > 0
        ? Math.round((ghqScores.reduce((a, b) => a + b, 0) / ghqScores.length) * 10) / 10
        : 0;

      // Riesgo
      const altoRiesgo = ghqScores.filter(s => s > 18).length;
      dept.pct_riesgo = ghqScores.length > 0
        ? Math.round((altoRiesgo / ghqScores.length) * 100)
        : 0;

      result.push(dept);
    });

    return result.sort((a, b) => b.total_participantes - a.total_participantes);
  }
}

export default MetricsService;