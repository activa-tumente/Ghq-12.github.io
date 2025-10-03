import { useState } from 'react';
import { supabase } from '../api/supabase';
import { handleSupabaseError, getUserFriendlyMessage } from '../utils/errorHandling';
import { useToast } from './useToast';

/**
 * Custom hook for managing user creation and updates
 */
export const useUserManagement = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { error: showError, success: showSuccess } = useToast();

  /**
   * Build user metadata from form data
   */
  const buildUserMetadata = (formData) => ({
    nombres: formData.nombres,
    apellidos: formData.apellidos,
    documento: formData.documento,
    edad: parseInt(formData.edad) || 0,
    genero: formData.genero,
    cargo: formData.cargo,
    area: formData.area,
    turno: formData.turno,
    antiguedad: parseInt(formData.antiguedad) || 0,
    tipo_contrato: formData.tipo_contrato,
    nivel_educativo: formData.nivel_educativo,
    capacitaciones_seguridad: formData.capacitaciones_seguridad,
    accidentes_previos: formData.accidentes_previos,
    reporta_casi_accidentes: formData.reporta_casi_accidentes === 'si',
    uso_epp: formData.uso_epp,
    satisfaccion_laboral: parseInt(formData.satisfaccion_laboral) || 0,
    motivacion_seguridad: parseInt(formData.motivacion_seguridad) || 0,
    confianza_gerencia: parseInt(formData.confianza_gerencia) || 0
  });

  /**
   * Check if user already has responses
   */
  const checkExistingResponses = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('respuestas_cuestionario')
        .select('id')
        .eq('usuario_id', userId)
        .limit(1);

      if (error) throw handleSupabaseError(error, 'check existing responses');
      return data && data.length > 0;
    } catch (error) {
      console.error('Error checking existing responses:', error);
      return false;
    }
  };

  /**
   * Delete existing responses for a user
   */
  const deleteExistingResponses = async (userId) => {
    try {
      const { error } = await supabase
        .from('respuestas_cuestionario')
        .delete()
        .eq('usuario_id', userId);

      if (error) throw handleSupabaseError(error, 'delete existing responses');
      return true;
    } catch (error) {
      console.error('Error deleting existing responses:', error);
      showError('No se pudieron eliminar las respuestas previas. Puede continuar, pero podría haber datos duplicados.');
      return false;
    }
  };

  /**
   * Find existing user by document
   */
  const findUserByDocument = async (documento) => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nombre, documento, cargo, departamento, area_macro, edad, genero')
        .eq('documento', documento)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw handleSupabaseError(error, 'find user by document');
      }

      return data;
    } catch (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
  };

  /**
   * Update existing user
   */
  const updateUser = async (userId, formData) => {
    try {
      const updateData = {
        nombre: `${formData.nombres} ${formData.apellidos}`,
        cargo: formData.cargo,
        departamento: formData.area,
        area_macro: formData.area,
        edad: parseInt(formData.edad) || 0,
        genero: formData.genero
      };

      const { data, error } = await supabase
        .from('usuarios')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw handleSupabaseError(error, 'update user');
      return data;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Create new user
   */
  const createUser = async (formData) => {
    try {
      const newUserData = {
        documento: formData.documento, // Documento como identificador único
        nombre: `${formData.nombres} ${formData.apellidos}`,
        cargo: formData.cargo,
        departamento: formData.area,
        area_macro: formData.area,
        edad: parseInt(formData.edad) || 0,
        genero: formData.genero,
        fecha_ingreso: new Date().toISOString().split('T')[0],
        activo: true
      };

      const { data, error } = await supabase
        .from('usuarios')
        .insert([newUserData])
        .select()
        .single();

      if (error) throw handleSupabaseError(error, 'create user');
      return data;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Process form data and handle user creation/update
   */
  const processFormData = async (formData) => {
    if (isProcessing) return null;

    setIsProcessing(true);
    try {
      // Find existing user
      const existingUser = await findUserByDocument(formData.documento);

      if (existingUser) {
        // Check for existing responses
        const hasResponses = await checkExistingResponses(existingUser.id);

        if (hasResponses) {
          const confirmNewEvaluation = window.confirm(
            `Ya existe una evaluación completada para ${existingUser.nombre}.\n\n¿Desea realizar una nueva evaluación? Esto eliminará las respuestas anteriores.`
          );

          if (!confirmNewEvaluation) {
            return null;
          }

          await deleteExistingResponses(existingUser.id);
        }

        // Update existing user
        const updatedUser = await updateUser(existingUser.id, formData);
        showSuccess('Datos de usuario actualizados correctamente');
        return updatedUser;
      } else {
        // Create new user
        const newUser = await createUser(formData);
        showSuccess('Nuevo usuario creado correctamente');
        return newUser;
      }
    } catch (error) {
      console.error('Error processing form data:', error);
      showError(getUserFriendlyMessage(error));
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processFormData,
    isProcessing
  };
};

export default useUserManagement;