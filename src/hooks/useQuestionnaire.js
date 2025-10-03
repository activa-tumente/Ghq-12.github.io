import { useState, useCallback } from 'react';
import { supabase } from '../api/supabase';
import { validateToken } from '../utils/tokenUtils';
import { questions } from '../data/questions';
import { useToast } from './useToast';
import { handleSupabaseError, withErrorHandling } from '../utils/errorHandling';

/**
 * Custom hook for managing questionnaire state and submission
 * @param {boolean} isDirectAccess - Whether accessing questionnaire directly
 * @param {Object} personData - User data object
 * @param {Function} onComplete - Callback when questionnaire is completed
 * @param {Function} navigate - Navigation function
 * @param {Date} startTime - When questionnaire was started
 * @param {string} token - Access token if applicable
 * @param {boolean} tokenValid - Whether token is valid
 * @returns {Object} Hook state and handlers
 */
export const useQuestionnaire = (isDirectAccess, personData, onComplete, navigate, startTime, token, tokenValid) => {
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { success, error: showError } = useToast();

  const handleAnswer = useCallback((questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  }, []);

  // Helper function to get token ID
  const getTokenId = useCallback(async () => {
    if (!token || !tokenValid) return null;

    try {
      const tokenResult = await validateToken(token);
      return tokenResult.valid && tokenResult.tokenData ? tokenResult.tokenData.id : null;
    } catch (error) {
      console.warn('Error al buscar token_id:', error);
      return null;
    }
  }, [token, tokenValid]);

  // Helper function to save responses with proper error handling
  const saveResponses = useCallback(
    withErrorHandling(async () => {
      // Early return for validation
      if (!personData?.id) {
        throw new Error('ID de persona no válido. No se pueden guardar las respuestas.');
      }

      const tokenId = await getTokenId();
      const completionTime = Math.floor((new Date() - startTime) / 1000);
      // Generar un UUID válido para sesion_id
      const sessionId = crypto.randomUUID ? crypto.randomUUID() : 
        `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${Math.random().toString(36).substr(2, 9)}-${Math.random().toString(36).substr(2, 9)}-${Math.random().toString(36).substr(2, 12)}`;

      // Preparar datos para insertar - UN REGISTRO POR PREGUNTA
      const responseRecords = Object.entries(answers).map(([questionId, answer]) => ({
        usuario_id: personData.id,
        cuestionario_id: 1, // ID del cuestionario BAT-7
        pregunta_id: parseInt(questionId.replace('pregunta_', '')),
        respuesta: answer, // Respuesta numérica directa
        puntaje_normalizado: 0,
        porcentaje_riesgo: 0,
        fecha_respuesta: new Date().toISOString(),
        sesion_id: sessionId
      }));

      const { data, error } = await supabase
        .from('respuestas_cuestionario')
        .insert(responseRecords)
        .select();

      if (error) throw handleSupabaseError(error, 'save questionnaire responses');

      return { data, completionTime };
    }, { operation: 'save questionnaire responses' }),
    [personData?.id, getTokenId, answers, startTime, questions.length, isDirectAccess]
  );

  const handleSubmit = useCallback(async () => {
    const answeredCount = Object.keys(answers).length;
    const allAnswered = answeredCount === questions.length;

    // Early return for validation
    if (!allAnswered) {
      showError('Por favor responda todas las preguntas antes de enviar.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { completionTime } = await saveResponses();

      const minutes = Math.floor(completionTime / 60);
      const seconds = completionTime % 60;

      success(`Cuestionario completado en ${minutes} minutos y ${seconds} segundos. ¡Gracias por completar la evaluación!`);

      // Handle navigation based on access method
      if (isDirectAccess) {
        navigate('/cuestionarios');
      } else if (onComplete) {
        onComplete({
          answers,
          completionTime,
          totalQuestions: questions.length
        });
      } else {
        navigate('/gracias');
      }
    } catch (error) {
      console.error('Error al enviar cuestionario:', error);
      showError(`Error al enviar el cuestionario: ${error.message || 'Error desconocido'}. Por favor intente nuevamente.`);
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, questions.length, showError, saveResponses, success, isDirectAccess, navigate, onComplete]);

  return {
    answers,
    isSubmitting,
    handleAnswer,
    handleSubmit
  };
};

export default useQuestionnaire;