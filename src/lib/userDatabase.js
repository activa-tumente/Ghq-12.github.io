/**
 * Utilidades para la gestión de usuarios y respuestas del cuestionario
 * Integración con las nuevas tablas: usuarios y respuestas_cuestionario
 */

import { supabase } from '../api/supabase.js';

/**
 * Funciones para la tabla usuarios
 */
export const userHelpers = {
  /**
   * Crear un nuevo usuario
   * @param {Object} userData - Datos del usuario
   * @param {string} userData.email - Email del usuario
   * @param {string} userData.nombre - Nombre del usuario (opcional)
   * @param {Object} userData.metadata - Metadata adicional del usuario (opcional)
   * @returns {Promise<Object>} Usuario creado
   */
  createUser: async (userData) => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .insert([{
          email: userData.email,
          nombre: userData.nombre || null,
          documento: userData.documento || null,
          apellidos: userData.apellidos || null,
          edad: userData.edad || null,
          genero: userData.genero || null,
          cargo: userData.cargo || null,
          departamento: userData.area || null,
          turno: userData.turno || null,
          antiguedad_empresa: userData.antiguedad_empresa || null,
          tipo_contrato: userData.tipo_contrato || null,
          nivel_educativo: userData.nivel_educativo || null,
          metadata: userData.metadata || null,
          fecha_registro: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error creating user:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Buscar usuario por email
   * @param {string} email - Email del usuario
   * @returns {Promise<Object>} Usuario encontrado o null
   */
  getUserByEmail: async (email) => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      return { success: true, data };
    } catch (error) {
      console.error('Error getting user by email:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Buscar usuario por documento
   * @param {string} documento - Documento del usuario
   * @returns {Promise<Object>} Usuario encontrado o null
   */
  getUserByDocument: async (documento) => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('documento', documento)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      return { success: true, data };
    } catch (error) {
      console.error('Error getting user by document:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Obtener usuario por ID
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} Usuario encontrado
   */
  getUserById: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Actualizar datos del usuario
   * @param {string} userId - ID del usuario
   * @param {Object} updates - Datos a actualizar
   * @returns {Promise<Object>} Usuario actualizado
   */
  updateUser: async (userId, updates) => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error updating user:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Listar todos los usuarios
   * @returns {Promise<Array>} Lista de usuarios
   */
  getAllUsers: async () => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('fecha_registro', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error getting all users:', error);
      return { success: false, error: error.message };
    }
  }
};

/**
 * Funciones para la tabla respuestas_cuestionario
 */
export const questionnaireHelpers = {
  /**
   * Guardar respuestas del cuestionario
   * @param {string} userId - ID del usuario
   * @param {Array} respuestas - Array de respuestas
   * @returns {Promise<Object>} Respuestas guardadas
   */
  saveResponses: async (userId, respuestas) => {
    try {
      const { data, error } = await supabase
        .from('respuestas_cuestionario')
        .insert([{
          user_id: userId,
          respuestas: respuestas
        }])
        .select();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error saving responses:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Obtener respuestas de un usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<Array>} Respuestas del usuario
   */
  getUserResponses: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('respuestas_cuestionario')
        .select('*')
        .eq('usuario_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error getting user responses:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Eliminar respuestas previas de un usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} Resultado de la eliminación
   */
  deleteUserResponses: async (userId) => {
    try {
      const { error } = await supabase
        .from('respuestas_cuestionario')
        .delete()
        .eq('usuario_id', userId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting user responses:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Obtener estadísticas de respuestas
   * @returns {Promise<Object>} Estadísticas generales
   */
  getResponseStats: async () => {
    try {
      // Total de respuestas
      const { count: totalResponses, error: countError } = await supabase
        .from('respuestas_cuestionario')
        .select('*', { count: 'exact', head: true });

      if (countError) throw countError;

      // Usuarios únicos que han respondido
      const { data: uniqueUsers, error: usersError } = await supabase
        .from('respuestas_cuestionario')
        .select('usuario_id')
        .group('usuario_id');

      if (usersError) throw usersError;

      // Promedio de puntuación total
      const { data: avgData, error: avgError } = await supabase
        .rpc('calcular_promedio_total');

      if (avgError && avgError.code !== '42883') { // Función no existe
        console.warn('Function calcular_promedio_total not found, using fallback');
      }

      return {
        success: true,
        data: {
          totalResponses,
          uniqueUsers: uniqueUsers?.length || 0,
          averageScore: avgData || 0
        }
      };
    } catch (error) {
      console.error('Error getting response stats:', error);
      return { success: false, error: error.message };
    }
  }
};

/**
 * Funciones de integración para el flujo completo
 */
export const integrationHelpers = {
  /**
   * Registrar usuario y guardar respuestas en una transacción
   * @param {Object} userData - Datos del usuario
   * @param {Array} respuestas - Respuestas del cuestionario
   * @returns {Promise<Object>} Resultado de la operación
   */
  registerUserAndSaveResponses: async (userData, respuestas) => {
    try {
      // 1. Verificar si el usuario ya existe
      const existingUser = await userHelpers.getUserByEmail(userData.email);
      
      let userId;
      if (existingUser.success && existingUser.data) {
        // Usuario existe, usar su ID
        userId = existingUser.data.id;
        
        // Eliminar respuestas previas si existen
        await questionnaireHelpers.deleteUserResponses(userId);
      } else {
        // Crear nuevo usuario
        const newUser = await userHelpers.createUser(userData);
        if (!newUser.success) {
          throw new Error(newUser.error);
        }
        userId = newUser.data.id;
      }

      // 2. Guardar respuestas
      const savedResponses = await questionnaireHelpers.saveResponses(userId, respuestas);
      if (!savedResponses.success) {
        throw new Error(savedResponses.error);
      }

      return {
        success: true,
        data: {
          userId,
          responsesCount: savedResponses.data.length
        }
      };
    } catch (error) {
      console.error('Error in registerUserAndSaveResponses:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Obtener datos completos de un usuario con sus respuestas
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} Datos completos del usuario
   */
  getUserCompleteData: async (userId) => {
    try {
      const [userResult, responsesResult] = await Promise.all([
        userHelpers.getUserById(userId),
        questionnaireHelpers.getUserResponses(userId)
      ]);

      if (!userResult.success) {
        throw new Error(userResult.error);
      }

      return {
        success: true,
        data: {
          user: userResult.data,
          responses: responsesResult.success ? responsesResult.data : []
        }
      };
    } catch (error) {
      console.error('Error getting user complete data:', error);
      return { success: false, error: error.message };
    }
  }
};

/**
 * Funciones de validación
 */
export const validationHelpers = {
  /**
   * Validar email
   * @param {string} email - Email a validar
   * @returns {boolean} Es válido
   */
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validar respuesta del cuestionario
   * @param {number} valor - Valor de la respuesta
   * @returns {boolean} Es válido
   */
  isValidResponse: (valor) => {
    return Number.isInteger(valor) && valor >= 0 && valor <= 3;
  },

  /**
   * Validar array de respuestas
   * @param {Array} respuestas - Array de respuestas
   * @returns {Object} Resultado de validación
   */
  validateResponses: (respuestas) => {
    if (!Array.isArray(respuestas) || respuestas.length === 0) {
      return { valid: false, error: 'Las respuestas deben ser un array no vacío' };
    }

    for (let i = 0; i < respuestas.length; i++) {
      const respuesta = respuestas[i];
      
      if (!respuesta.pregunta_id || !validationHelpers.isValidResponse(respuesta.respuesta_valor)) {
        return {
          valid: false,
          error: `Respuesta inválida en posición ${i}: pregunta_id y respuesta_valor (0-3) son requeridos`
        };
      }
    }

    return { valid: true };
  }
};

export default {
  userHelpers,
  questionnaireHelpers,
  integrationHelpers,
  validationHelpers
};