import { supabase } from '../../api/supabase';
import { handleSupabaseError } from '../../utils/errorHandling';

/**
 * Repository para operaciones de base de datos relacionadas con métricas
 * Separa la lógica de acceso a datos de la lógica de negocio
 */
export class MetricsRepository {
  
  /**
   * Obtiene respuestas consolidadas con información de usuarios
   */
  static async getResponsesWithUsers(filters = {}) {
    try {
      let query = supabase
        .from('respuestas_cuestionario')
        .select(`
          *,
          usuarios!inner(
            id,
            nombre,
            email,
            departamento,
            turno,
            genero,
            fecha_nacimiento,
            metadata,
            created_at
          )
        `);

      // Aplicar filtros de manera consistente
      if (filters.departamento && filters.departamento !== 'todos') {
        query = query.eq('usuarios.departamento', filters.departamento);
      }
      
      if (filters.turno && filters.turno !== 'todos') {
        query = query.eq('usuarios.turno', filters.turno);
      }
      
      if (filters.genero && filters.genero !== 'todos') {
        query = query.eq('usuarios.genero', filters.genero);
      }

      if (filters.fechaInicio) {
        query = query.gte('fecha_respuesta', filters.fechaInicio);
      }
      
      if (filters.fechaFin) {
        query = query.lte('fecha_respuesta', filters.fechaFin);
      }

      const { data, error } = await query;
      
      if (error) throw handleSupabaseError(error, 'get responses with users');
      
      return data || [];
    } catch (error) {
      console.error('Error in MetricsRepository.getResponsesWithUsers:', error);
      throw error;
    }
  }

  /**
   * Obtiene conteos básicos usando consultas directas (sin RPC)
   */
  static async getBasicCounts() {
    // Usar fallback directo en lugar de RPC inexistente
    return this.getBasicCountsFallback();
  }

  /**
   * Fallback method para compatibilidad
   */
  static async getBasicCountsFallback() {
    const [
      usuariosResult,
      respuestasCountResult,
      respuestasDataResult
    ] = await Promise.all([
      supabase.from('usuarios').select('*', { count: 'exact', head: true }),
      supabase.from('respuestas_cuestionario').select('*', { count: 'exact', head: true }),
      // En algunas tablas la columna se llama 'respuesta' (singular)
      supabase.from('respuestas_cuestionario').select('usuario_id, respuesta, respuestas, fecha_respuesta')
    ]);

    const totalUsuarios = usuariosResult?.count || 0;
    const totalRespuestas = respuestasCountResult?.count || 0;

    // Normalizar al shape esperado por MetricsCalculator: { user_id, respuestas, fecha_respuesta }
    const respuestasRaw = respuestasDataResult?.data || [];
    const respuestasNormalizadas = respuestasRaw.map((r) => ({
      user_id: r.usuario_id,
      respuestas: r.respuestas ?? r.respuesta ?? {},
      fecha_respuesta: r.fecha_respuesta
    }));

    return {
      totalUsuarios,
      totalRespuestas,
      respuestas: respuestasNormalizadas
    };
  }

  /**
   * Obtiene métricas usando vistas de base de datos
   */
  static async getDashboardViews() {
    try {
      const [
        { data: generalMetrics, error: generalError },
        { data: departmentMetrics, error: deptError },
        { data: ghqData, error: ghqError }
      ] = await Promise.all([
        supabase.from('dashboard_metrics').select('*').single(),
        supabase.from('dashboard_metrics_by_department').select('*').order('total_participantes', { ascending: false }),
        supabase.from('ghq_responses_detail').select('*').order('fecha_respuesta', { ascending: false })
      ]);

      if (generalError) throw handleSupabaseError(generalError, 'get general metrics');
      if (deptError) throw handleSupabaseError(deptError, 'get department metrics');
      if (ghqError) throw handleSupabaseError(ghqError, 'get GHQ data');

      return {
        general: generalMetrics || {},
        departments: departmentMetrics || [],
        ghqData: ghqData || []
      };
    } catch (error) {
      console.error('Error in MetricsRepository.getDashboardViews:', error);
      throw error;
    }
  }
}