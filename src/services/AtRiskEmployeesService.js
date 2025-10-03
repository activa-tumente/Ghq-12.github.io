import { supabase } from '../api/supabase';

/**
 * Servicio para listar empleados según nivel de riesgo, basado en respuestas reales.
 * Clasifica por niveles: muy_alto, alto, moderado, bajo.
 */
export class AtRiskEmployeesService {
  /**
   * Obtiene empleados clasificados por nivel de riesgo, con filtros opcionales.
   */
  static async getEmployeesByRiskLevel(filters = {}) {
    // Traer respuestas con join de usuario para poder mostrar datos
    let query = supabase
      .from('respuestas_cuestionario')
      .select(`
        id,
        usuario_id,
        fecha_respuesta,
        puntaje_normalizado,
        porcentaje_riesgo,
        usuarios!inner(
          id,
          nombre,
          documento,
          cargo,
          departamento
        )
      `)
      .not('usuarios.id', 'is', null);

    if (filters.fechaInicio) query = query.gte('fecha_respuesta', filters.fechaInicio);
    if (filters.fechaFin) query = query.lte('fecha_respuesta', filters.fechaFin);
    if (filters.departamento) query = query.eq('usuarios.departamento', filters.departamento);

    const { data, error } = await query;
    if (error) throw error;

    if (!data || data.length === 0) {
      return { muy_alto: [], alto: [], moderado: [], bajo: [] };
    }

    // Tomar la última respuesta por usuario
    const byUser = new Map();
    for (const row of data) {
      const prev = byUser.get(row.usuario_id);
      if (!prev || new Date(row.fecha_respuesta) > new Date(prev.fecha_respuesta)) {
        byUser.set(row.usuario_id, row);
      }
    }

    // Clasificar por porcentaje_riesgo si existe, si no por puntaje_normalizado aproximando a %
    const buckets = { muy_alto: [], alto: [], moderado: [], bajo: [] };

    byUser.forEach((row) => {
      const pct = row.porcentaje_riesgo != null
        ? Number(row.porcentaje_riesgo)
        : Math.min(100, Math.max(0, (Number(row.puntaje_normalizado || 0) / 3) * 100));

      const item = {
        id: row.usuarios.id,
        nombre: row.usuarios.nombre || 'Sin nombre',
        cargo: row.usuarios.cargo || 'Sin cargo',
        departamento: row.usuarios.departamento || 'Sin depto',
        porcentaje: Number(pct.toFixed(1)),
        puntaje: Number((row.puntaje_normalizado || 0).toFixed(2)),
        fecha: row.fecha_respuesta
      };

      if (pct >= 80) buckets.muy_alto.push(item);
      else if (pct >= 60) buckets.alto.push(item);
      else if (pct >= 40) buckets.moderado.push(item);
      else buckets.bajo.push(item);
    });

    // Ordenar desc por porcentaje
    Object.keys(buckets).forEach(k => buckets[k].sort((a, b) => b.porcentaje - a.porcentaje));

    return buckets;
  }
}

export default AtRiskEmployeesService;


