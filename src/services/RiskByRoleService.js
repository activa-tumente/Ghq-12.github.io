import { supabase } from '../api/supabase';

/**
 * Servicio para obtener datos de distribución de riesgo por cargo/rol
 */
export class RiskByRoleService {
  
  /**
   * Obtiene la distribución de riesgo por cargo/rol
   * @param {Object} filters - Filtros opcionales (fecha, departamento, etc.)
   * @returns {Promise<Array>} Array con datos de riesgo por cargo
   */
  static async getRiskByRole(filters = {}) {
    try {
      let query = supabase
        .from('respuestas_cuestionario')
        .select(`
          puntaje_normalizado,
          usuarios!inner(id, cargo)
        `)
        .not('usuarios.cargo', 'is', null);

      // Aplicar filtros si están presentes
      if (filters.fechaInicio) {
        query = query.gte('fecha_respuesta', filters.fechaInicio);
      }
      
      if (filters.fechaFin) {
        query = query.lte('fecha_respuesta', filters.fechaFin);
      }
      
      if (filters.departamento) {
        query = query.eq('usuarios.departamento', filters.departamento);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching risk by role data:', error);
        throw error;
      }

      // Primero agrupar por usuario para calcular promedios individuales
      const userGroups = {};
      
      data.forEach(item => {
        const userId = item.usuarios?.id;
        const cargo = item.usuarios?.cargo;
        
        if (userId && cargo) {
          if (!userGroups[userId]) {
            userGroups[userId] = {
              usuario_id: userId,
              cargo: cargo,
              puntajes: []
            };
          }
          userGroups[userId].puntajes.push(item.puntaje_normalizado || 0);
        }
      });

      // Calcular promedio por usuario
      const userAverages = Object.values(userGroups).map(user => ({
        cargo: user.cargo,
        averageGHQ: user.puntajes.reduce((sum, p) => sum + p, 0) / user.puntajes.length,
        count: 1 // Cada usuario cuenta como 1 empleado
      }));

      // Agrupar por cargo y calcular promedios finales
      const groupedByRole = {};
      
      userAverages.forEach(user => {
        const cargo = user.cargo;
        if (!groupedByRole[cargo]) {
          groupedByRole[cargo] = {
            cargo: cargo,
            totalScore: 0,
            count: 0
          };
        }
        groupedByRole[cargo].totalScore += user.averageGHQ;
        groupedByRole[cargo].count += user.count;
      });

      // Calcular promedios finales por cargo (solo con datos)
      const resultWithData = Object.values(groupedByRole)
        .map(item => ({
          cargo: item.cargo,
          averageGHQ: item.count > 0 ? item.totalScore / item.count : 0,
          count: item.count,
          hasData: item.count > 0
        }))
        .sort((a, b) => b.averageGHQ - a.averageGHQ);

      // Obtener lista base de cargos para mantener los nombres aunque no haya respuestas
      const { data: cargosRows, error: cargosError } = await supabase
        .from('usuarios')
        .select('cargo')
        .not('cargo', 'is', null);

      if (cargosError) {
        console.warn('Warning loading cargos list:', cargosError);
      }

      const cargosSet = new Set((cargosRows || []).map(r => r.cargo));
      const cargoToData = new Map(resultWithData.map(r => [r.cargo, r]));

      // Construir lista final: todos los cargos, y datos si existen; si no, placeholder sin datos
      const finalList = Array.from(cargosSet).map(cargo => {
        if (cargoToData.has(cargo)) {
          return cargoToData.get(cargo);
        }
        return {
          cargo,
          averageGHQ: 0,
          count: 0,
          hasData: false
        };
      });

      // Si no hay cargos en usuarios, devolver lo calculado (caso mínimo)
      return finalList.length > 0 ? finalList : resultWithData;

    } catch (error) {
      console.error('Error in RiskByRoleService.getRiskByRole:', error);
      throw error;
    }
  }

  /**
   * Obtiene datos de riesgo por cargo con formato para gráfico
   * @param {Object} filters - Filtros opcionales
   * @returns {Promise<Array>} Datos formateados para visualización
   */
  static async getRiskByRoleChartData(filters = {}) {
    try {
      const data = await this.getRiskByRole(filters);

      // Ordenar manteniendo primero los que tienen datos, luego placeholders
      const sorted = data
        .filter(item => item.cargo)
        .sort((a, b) => {
          if ((b.hasData ? 1 : 0) !== (a.hasData ? 1 : 0)) {
            return (b.hasData ? 1 : 0) - (a.hasData ? 1 : 0);
          }
          return (b.averageGHQ || 0) - (a.averageGHQ || 0);
        })
        .slice(0, 10);

      return sorted.map(item => ({
        cargo: item.cargo,
        promedioGHQ: item.hasData ? parseFloat((item.averageGHQ || 0).toFixed(2)) : 0,
        totalEmpleados: item.hasData ? item.count : 0,
        hasData: !!item.hasData
      }));

    } catch (error) {
      console.error('Error in RiskByRoleService.getRiskByRoleChartData:', error);
      throw error;
    }
  }
}