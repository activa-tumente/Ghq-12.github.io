/**
 * Token Utilities
 * Utilities for generating and managing access tokens
 */

import { supabase } from '../api/supabase';

/**
 * Generate a unique token for user access
 * @returns {string} UUID token
 */
export const generateToken = () => {
  return crypto.randomUUID();
};

/**
 * Create a new access token for a user
 * @param {string} userId - User ID
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<Object>} Created token data
 */
export const createAccessToken = async (userId, metadata = {}) => {
  try {
    const token = generateToken();
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7); // 7 days from now

    const tokenData = {
      token,
      user_id: userId,
      expiracion: expirationDate.toISOString(),
      metadata: {
        ...metadata,
        created_by: 'admin',
        purpose: 'questionnaire_access'
      }
    };

    const { data, error } = await supabase
      .from('tokens_acceso')
      .insert([tokenData])
      .select()
      .single();

    if (error) throw error;

    return {
      token: data.token,
      expiration: data.expiracion,
      id: data.id
    };
  } catch (error) {
    console.error('Error creating access token:', error);
    throw new Error('No se pudo crear el token de acceso');
  }
};

/**
 * Validate an access token
 * @param {string} token - Token to validate
 * @returns {Promise<Object>} Token validation result
 */
export const validateToken = async (token) => {
  try {
    const { data, error } = await supabase
      .from('tokens_acceso')
      .select('id, user_id, usado, expiracion, fecha_uso')
      .eq('token', token)
      .single();

    if (error || !data) {
      return { valid: false, reason: 'Token no encontrado' };
    }

    if (data.usado) {
      return { valid: false, reason: 'Token ya utilizado' };
    }

    const now = new Date();
    const expiracion = new Date(data.expiracion);

    if (now > expiracion) {
      return { valid: false, reason: 'Token expirado' };
    }

    return {
      valid: true,
      tokenData: data
    };
  } catch (error) {
    console.error('Error validating token:', error);
    return { valid: false, reason: 'Error interno' };
  }
};

/**
 * Mark a token as used
 * @param {string} token - Token to mark as used
 * @param {string} userId - User ID that used the token
 * @returns {Promise<boolean>} Success status
 */
export const markTokenAsUsed = async (token, userId) => {
  try {
    const { error } = await supabase
      .from('tokens_acceso')
      .update({
        user_id: userId,
        usado: true,
        fecha_uso: new Date().toISOString()
      })
      .eq('token', token);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error marking token as used:', error);
    return false;
  }
};

/**
 * Get all tokens for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of tokens
 */
export const getUserTokens = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('tokens_acceso')
      .select('*')
      .eq('usuario_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting user tokens:', error);
    return [];
  }
};

/**
 * Delete an access token
 * @param {string} tokenId - Token ID to delete
 * @returns {Promise<boolean>} Success status
 */
export const deleteToken = async (tokenId) => {
  try {
    const { error } = await supabase
      .from('tokens_acceso')
      .delete()
      .eq('id', tokenId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting token:', error);
    return false;
  }
};

export default {
  generateToken,
  createAccessToken,
  validateToken,
  markTokenAsUsed,
  getUserTokens,
  deleteToken
};