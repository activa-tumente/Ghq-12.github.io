/**
 * Componente para manejar el envío de respuestas del cuestionario
 * Integrado con la nueva tabla respuestas_cuestionario
 */

import React, { useState, useEffect } from 'react';
import { Send, CheckCircle, AlertCircle, Loader, BarChart3 } from 'lucide-react';
import { questionnaireHelpers, integrationHelpers } from '../../lib/userDatabase.js';

const QuestionnaireSubmission = ({ 
  userId, 
  responses, 
  questions, 
  onSubmissionComplete, 
  onBack 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState(null); // 'success' | 'error'
  const [submissionResult, setSubmissionResult] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);

  /**
   * Validar respuestas antes del envío
   */
  const validateResponses = () => {
    const errors = [];

    // Verificar que todas las preguntas tengan respuesta
    questions.forEach(question => {
      if (responses[question.id] === undefined || responses[question.id] === null) {
        errors.push(`Falta respuesta para la pregunta ${question.numero}: "${question.texto}"`);
      }
    });

    // Verificar que las respuestas estén en el rango válido (0-3)
    Object.entries(responses).forEach(([questionId, response]) => {
      if (response < 0 || response > 3) {
        const question = questions.find(q => q.id === parseInt(questionId));
        errors.push(`Respuesta inválida para la pregunta ${question?.numero || questionId}: debe estar entre 0 y 3`);
      }
    });

    setValidationErrors(errors);
    return errors.length === 0;
  };

  /**
   * Calcular estadísticas de las respuestas
   */
  const calculateResponseStats = () => {
    const responseValues = Object.values(responses);
    const totalScore = responseValues.reduce((sum, value) => sum + value, 0);
    const averageScore = totalScore / responseValues.length;
    const maxPossibleScore = questions.length * 3;
    const scorePercentage = (totalScore / maxPossibleScore) * 100;

    return {
      totalScore,
      averageScore: Math.round(averageScore * 100) / 100,
      scorePercentage: Math.round(scorePercentage * 100) / 100,
      totalQuestions: questions.length,
      maxPossibleScore
    };
  };

  /**
   * Manejar envío de respuestas
   */
  const handleSubmit = async () => {
    if (!validateResponses()) {
      return;
    }

    setIsSubmitting(true);
    setSubmissionStatus(null);
    setSubmissionResult(null);

    try {
      // Preparar datos para envío
      const responseData = {
        user_id: userId,
        respuestas: responses,
        metadata: {
          fecha_completado: new Date().toISOString(),
          total_preguntas: questions.length,
          ...calculateResponseStats()
        }
      };

      // Enviar respuestas usando integrationHelpers
      const result = await integrationHelpers.saveUserResponse(userId, responses, {
        cuestionario_tipo: 'GHQ-12',
        fecha_completado: new Date().toISOString()
      });

      if (result.success) {
        setSubmissionStatus('success');
        setSubmissionResult({
          responseId: result.data.id,
          stats: calculateResponseStats(),
          submittedAt: new Date().toISOString()
        });

        // Llamar callback de finalización
        if (onSubmissionComplete) {
          onSubmissionComplete({
            success: true,
            responseId: result.data.id,
            stats: calculateResponseStats()
          });
        }
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error al enviar respuestas:', error);
      setSubmissionStatus('error');
      setValidationErrors([`Error al enviar respuestas: ${error.message}`]);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Renderizar resumen de respuestas
   */
  const renderResponseSummary = () => {
    const stats = calculateResponseStats();
    
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2" />
          Resumen de Respuestas
        </h3>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-blue-700 font-medium">Preguntas respondidas:</span>
            <span className="ml-2 text-blue-900">{Object.keys(responses).length} / {stats.totalQuestions}</span>
          </div>
          <div>
            <span className="text-blue-700 font-medium">Puntuación total:</span>
            <span className="ml-2 text-blue-900">{stats.totalScore} / {stats.maxPossibleScore}</span>
          </div>
          <div>
            <span className="text-blue-700 font-medium">Promedio:</span>
            <span className="ml-2 text-blue-900">{stats.averageScore}</span>
          </div>
          <div>
            <span className="text-blue-700 font-medium">Porcentaje:</span>
            <span className="ml-2 text-blue-900">{stats.scorePercentage}%</span>
          </div>
        </div>
      </div>
    );
  };

  /**
   * Renderizar errores de validación
   */
  const renderValidationErrors = () => {
    if (validationErrors.length === 0) return null;

    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
          <div>
            <h4 className="text-red-800 font-medium mb-2">Errores de validación:</h4>
            <ul className="text-red-700 text-sm space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index} className="list-disc list-inside">
                  {typeof error === 'string' ? error : error?.message || 'Error de validación'}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  /**
   * Renderizar mensaje de éxito
   */
  const renderSuccessMessage = () => {
    if (submissionStatus !== 'success' || !submissionResult) return null;

    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
        <div className="flex items-start">
          <CheckCircle className="w-6 h-6 text-green-600 mr-3 mt-0.5" />
          <div>
            <h4 className="text-green-800 font-semibold mb-2">¡Cuestionario enviado exitosamente!</h4>
            <p className="text-green-700 text-sm mb-3">
              Sus respuestas han sido guardadas correctamente en la base de datos.
            </p>
            <div className="text-sm text-green-600">
              <p><strong>ID de respuesta:</strong> {submissionResult.responseId}</p>
              <p><strong>Fecha de envío:</strong> {new Date(submissionResult.submittedAt).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Enviar Cuestionario
          </h1>
          <p className="text-gray-600">
            Revise sus respuestas antes de enviar
          </p>
        </div>

        {/* Mensajes de estado */}
        {renderSuccessMessage()}
        {renderValidationErrors()}

        {/* Resumen de respuestas */}
        {submissionStatus !== 'success' && renderResponseSummary()}

        {/* Lista de respuestas */}
        {submissionStatus !== 'success' && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Respuestas detalladas:</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {questions.map(question => {
                const response = responses[question.id];
                const responseLabels = ['Nunca', 'Casi nunca', 'Algunas veces', 'Frecuentemente'];
                
                return (
                  <div key={question.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          {question.numero}. {question.texto}
                        </p>
                        <p className="text-sm text-gray-600">
                          Respuesta: <span className="font-medium">
                            {response !== undefined ? `${response} - ${responseLabels[response]}` : 'Sin respuesta'}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Botones */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          {submissionStatus !== 'success' && onBack && (
            <button
              type="button"
              onClick={onBack}
              disabled={isSubmitting}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Volver
            </button>
          )}
          
          {submissionStatus !== 'success' ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || validationErrors.length > 0}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Cuestionario
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onSubmissionComplete && onSubmissionComplete({ success: true })}
              className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors flex items-center justify-center"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Finalizar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionnaireSubmission;