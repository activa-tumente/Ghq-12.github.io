import { supabase, dbHelpers } from '../api/supabase';

/**
 * Utilidades para configuración y gestión de la base de datos Supabase
 * Integrado con el sistema existente de helpers de base de datos
 */
export class SupabaseSetup {
  /**
   * Verificar que las tablas necesarias existan y sean accesibles
   */
  static async verifyTables() {
    try {
      // Verificar tabla usuarios
      const { error: usersError } = await supabase
        .from('usuarios')
        .select('id')
        .limit(1);

      if (usersError && usersError.code !== 'PGRST116') {
        throw usersError;
      }

      // Verificar tabla respuestas_cuestionario
      const { error: responsesError } = await supabase
        .from('respuestas_cuestionario')
        .select('id')
        .limit(1);

      if (responsesError && responsesError.code !== 'PGRST116') {
        throw responsesError;
      }

      return { success: true };
    } catch (error) {
      console.error('Error verifying tables:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener estadísticas completas de la base de datos usando los helpers existentes
   */
  static async getDatabaseStats() {
    try {
      const stats = await dbHelpers.getEstadisticas();

      // Transformar al formato esperado por DatabaseSetup
      const formattedStats = {
        totalUsuarios: stats.total_usuarios || 0,
        totalRespuestas: stats.total_respuestas || 0,
        usuariosConRespuestas: stats.usuarios_con_respuestas || 0,
        tasaParticipacion: Math.round((stats.usuarios_con_respuestas || 0) / (stats.total_usuarios || 1) * 100),
        puntuacionPromedio: stats.puntuacion_promedio || 0
      };

      return { success: true, stats: formattedStats };
    } catch (error) {
      console.error('Error getting database stats:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Configurar la base de datos con datos de ejemplo realistas
   */
  static async setupDatabase() {
    try {
      // Crear usuarios de ejemplo con datos realistas
      const usuariosEjemplo = [
        {
          email: 'juan.perez@empresa.com',
          nombre: 'Juan Pérez',
          metadata: {
            area: 'Recursos Humanos',
            turno: 'Mañana',
            edad: 35,
            genero: 'Masculino',
            nivelEducativo: 'Universitario',
            anosExperiencia: 8
          }
        },
        {
          email: 'maria.garcia@empresa.com',
          nombre: 'María García',
          metadata: {
            area: 'Tecnología',
            turno: 'Tarde',
            edad: 28,
            genero: 'Femenino',
            nivelEducativo: 'Maestría',
            anosExperiencia: 5
          }
        },
        {
          email: 'carlos.rodriguez@empresa.com',
          nombre: 'Carlos Rodríguez',
          metadata: {
            area: 'Finanzas',
            turno: 'Noche',
            edad: 42,
            genero: 'Masculino',
            nivelEducativo: 'Universitario',
            anosExperiencia: 15
          }
        },
        {
          email: 'ana.martinez@empresa.com',
          nombre: 'Ana Martínez',
          metadata: {
            area: 'Marketing',
            turno: 'Mañana',
            edad: 31,
            genero: 'Femenino',
            nivelEducativo: 'Universitario',
            anosExperiencia: 7
          }
        },
        {
          email: 'luis.sanchez@empresa.com',
          nombre: 'Luis Sánchez',
          metadata: {
            area: 'Operaciones',
            turno: 'Tarde',
            edad: 39,
            genero: 'Masculino',
            nivelEducativo: 'Técnico',
            anosExperiencia: 12
          }
        }
      ];

      // Insertar usuarios usando los helpers existentes
      const insertedUsers = [];
      for (const usuario of usuariosEjemplo) {
        const result = await dbHelpers.createUsuario({
          ...usuario,
          fecha_registro: new Date().toISOString()
        });

        if (result.success) {
          insertedUsers.push(result.data[0]);
        }
      }

      if (insertedUsers.length === 0) {
        throw new Error('No se pudieron crear usuarios de ejemplo');
      }

      // Crear respuestas GHQ-12 realistas para cada usuario
      const respuestasEjemplo = [];

      insertedUsers.forEach(user => {
        // Generar respuestas GHQ-12 con patrones realistas
        // GHQ-12 tiene 12 preguntas con escala 0-3
        const respuestas = {
          q1: Math.floor(Math.random() * 2), // Menos estrés general
          q2: Math.floor(Math.random() * 3), // Concentración
          q3: Math.floor(Math.random() * 2), // Útil en el trabajo
          q4: Math.floor(Math.random() * 2), // Decisiones
          q5: Math.floor(Math.random() * 3), // Bajo presión
          q6: Math.floor(Math.random() * 2), // Problemas para superar dificultades
          q7: Math.floor(Math.random() * 2), // Disfrutando actividades normales
          q8: Math.floor(Math.random() * 3), // Afrontar problemas
          q9: Math.floor(Math.random() * 2), // Pérdida de confianza
          q10: Math.floor(Math.random() * 2), // Pensamientos de inutilidad
          q11: Math.floor(Math.random() * 3), // Felicidad general
          q12: Math.floor(Math.random() * 2)  // Satisfacción con actividades
        };

        respuestasEjemplo.push({
          user_id: user.id,
          respuestas: respuestas,
          fecha_completado: new Date().toISOString()
        });
      });

      // Insertar respuestas usando los helpers existentes
      const result = await dbHelpers.createRespuestas(respuestasEjemplo);
      if (!result.success) {
        throw new Error('Error al crear respuestas de ejemplo');
      }

      // Obtener estadísticas actualizadas
      const statsResult = await this.getDatabaseStats();
      if (!statsResult.success) {
        throw new Error(statsResult.error);
      }

      return {
        success: true,
        message: `Base de datos configurada exitosamente con ${insertedUsers.length} usuarios y ${respuestasEjemplo.length} respuestas`,
        stats: statsResult.stats
      };
    } catch (error) {
      console.error('Error setting up database:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Limpiar todos los datos de la base de datos usando los helpers existentes
   */
  static async clearAllData() {
    try {
      // Obtener todos los usuarios
      const { data: users, error: usersError } = await supabase
        .from('usuarios')
        .select('id');

      if (usersError) throw usersError;

      // Eliminar respuestas de cada usuario
      for (const user of users || []) {
        await dbHelpers.deleteUsuario(user.id);
      }

      return {
        success: true,
        message: `Se eliminaron ${users?.length || 0} usuarios y todas sus respuestas asociadas`
      };
    } catch (error) {
      console.error('Error clearing database:', error);
      return { success: false, error: error.message };
    }
  }
}

export default SupabaseSetup;