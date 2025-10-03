import { supabase } from '../api/supabase';
import { logError } from '../utils/ErrorHandling.jsx';
import type { Cuestionario, User, QuestionnaireResponse } from '../types';

export class QuestionnaireService {
  private static readonly TOTAL_QUESTIONS = 12;

  /**
   * Load all questionnaire data in optimized batch requests
   */
  static async loadAllData(): Promise<Cuestionario[]> {
    try {
      console.log('🔄 Cargando datos optimizados desde Supabase...');

      // Parallel data fetching - only 2 API calls instead of N+1
      const [usersResult, responsesResult] = await Promise.all([
        supabase
          .from('usuarios')
          .select('id, nombre, documento, fecha_creacion')
          .order('fecha_creacion', { ascending: false }),
        supabase
          .from('respuestas_cuestionario')
          .select('usuario_id, respuesta, fecha_respuesta')
      ]);

      if (usersResult.error) {
        console.error('Error obteniendo usuarios:', usersResult.error);
        throw usersResult.error;
      }

      if (responsesResult.error) {
        console.error('Error obteniendo respuestas:', responsesResult.error);
        // Don't throw for responses error, continue with empty responses
      }

      const usuarios = usersResult.data || [];
      const respuestas = responsesResult.data || [];

      console.log(`📊 Datos obtenidos: ${usuarios.length} usuarios, ${respuestas.length} respuestas`);

      return this.processData(usuarios, respuestas);
    } catch (error) {
      console.error('❌ Error en QuestionnaireService.loadAllData:', error);
      logError(error, { operation: 'QuestionnaireService.loadAllData' });

      // Handle case when tables don't exist (no data scenario)
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('Could not find the table')) {
        console.log('⚠️ Tablas no encontradas, retornando datos vacíos');
        return [];
      }

      throw new Error(`Failed to load questionnaire data: ${errorMessage}`);
    }
  }

  /**
   * Process data efficiently using lookup maps
   */
  private static processData(users: any[], responses: any[]): Cuestionario[] {
    if (!users || users.length === 0) {
      console.log('⚠️ No hay usuarios en la base de datos');
      return [];
    }

    // Create efficient lookup map for responses
    const responsesMap = this.createResponsesMap(responses);

    // Process each user with pre-built responses map
    return users.map(user => this.createQuestionnaireItem(user, responsesMap));
  }

  /**
   * Create efficient lookup map for responses by user_id
   */
  private static createResponsesMap(responses: any[]): Record<string, any[]> {
    return responses.reduce((acc, response) => {
      const userId = response.usuario_id;
      if (!acc[userId]) acc[userId] = [];
      acc[userId].push(response);
      return acc;
    }, {} as Record<string, any[]>);
  }

  /**
   * Create questionnaire item for a single user
   */
  private static createQuestionnaireItem(user: any, responsesMap: Record<string, any[]>): Cuestionario {
    const userResponses = responsesMap[user.id] || [];
    const totalResponses = userResponses.length;
    const completado = totalResponses > 0;

    // Calculate latest response date efficiently
    const latestResponse = userResponses.length > 0
      ? new Date(Math.max(...userResponses.map((r: any) => new Date(r.fecha_respuesta).getTime())))
      : null;

    // Use actual database columns
    const nombres = user.nombre || 'Sin nombre';
    const apellidos = ''; // No more apellido

    return {
      id: user.id,
      titulo: `${nombres}`.trim(), // Just nombre
      descripcion: `Documento: ${user.documento}`,
      estado: completado ? 'finalizado' : 'activo',
      created_at: user.fecha_creacion, // Use fecha_creacion
      fechaCreacion: user.fecha_creacion, // Use fecha_creacion
      fechaCompletado: completado ? latestResponse?.toISOString() : null,
      fechaUltimaRespuesta: latestResponse?.toISOString(),
      respuestas: totalResponses,
      completados: completado ? this.TOTAL_QUESTIONS : 0,
      persona: {
        nombres,
        apellidos,
        documento: '', // Not available in current schema
        area: '',
        turno: '', // Not available in current schema
        genero: '',
        edad: null
      }
    } as any;
  }

  /**
   * Delete user and their responses (optimized version)
   */
  static async deleteQuestionnaire(userId: string, userTitle: string): Promise<boolean> {
    try {
      console.log(`🗑️ Eliminando cuestionario: ${userTitle}`);

      // Delete responses first (due to foreign key constraints)
      const { error: respuestasError } = await supabase
        .from('respuestas_cuestionario')
        .delete()
        .eq('usuario_id', userId);

      if (respuestasError) {
        console.error('Error eliminando respuestas:', respuestasError);
        throw respuestasError;
      }

      // Delete user
      const { error: usuarioError } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', userId);

      if (usuarioError) {
        console.error('Error eliminando usuario:', usuarioError);
        throw usuarioError;
      }

      console.log(`✅ Cuestionario eliminado exitosamente: ${userTitle}`);
      return true;
    } catch (error) {
      console.error('❌ Error en QuestionnaireService.deleteQuestionnaire:', error);
      logError(error, {
        operation: 'QuestionnaireService.deleteQuestionnaire',
        userId,
        userTitle
      });
      throw error;
    }
  }

  /**
   * Delete multiple users and their responses (optimized version)
   */
  static async deleteQuestionnairesMultiples(userIds: string[]): Promise<boolean> {
    try {
      if (userIds.length === 0) {
        return true;
      }

      console.log(`🗑️ Eliminando ${userIds.length} cuestionarios múltiples...`);

      // Delete responses first (due to foreign key constraints)
      const { error: respuestasError } = await supabase
        .from('respuestas_cuestionario')
        .delete()
        .in('usuario_id', userIds);

      if (respuestasError) {
        console.error('Error eliminando respuestas múltiples:', respuestasError);
        throw respuestasError;
      }

      // Delete users
      const { error: usuarioError } = await supabase
        .from('usuarios')
        .delete()
        .in('id', userIds);

      if (usuarioError) {
        console.error('Error eliminando usuarios múltiples:', usuarioError);
        throw usuarioError;
      }

      console.log(`✅ ${userIds.length} cuestionarios eliminados exitosamente`);
      return true;
    } catch (error) {
      console.error('❌ Error en QuestionnaireService.deleteQuestionnairesMultiples:', error);
      logError(error, {
        operation: 'QuestionnaireService.deleteQuestionnairesMultiples',
        userIds
      });
      throw error;
    }
  }
}

export default QuestionnaireService;