import { useState, useEffect } from 'react'
import { supabase } from '../api/supabase'
import { calcularNivelSalud } from '../utils/healthCalculations'
import { handleSupabaseError, getUserFriendlyMessage, withErrorHandling } from '../utils/errorHandling'
import { processConsolidatedResponses } from '../utils/dataProcessing'

/**
 * Custom hook for managing questionnaire results data
 * @param {string} userId - User ID to fetch results for
 * @returns {Object} Hook state and actions
 */
export const useQuestionnaireResults = (userId) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [persona, setPersona] = useState(null)
  const [respuestas, setRespuestas] = useState([])
  const [nivelSalud, setNivelSalud] = useState(null)

  const cargarDatos = async () => {
    if (!userId) return

    try {
      setLoading(true)
      setError(null)

      // Cargar datos del usuario
      const { data: usuarioData, error: usuarioError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', userId)
        .single()

      if (usuarioError) {
        throw handleSupabaseError(usuarioError, 'cargar usuario')
      }

      if (!usuarioData) {
        throw new Error('Usuario no encontrado')
      }

      setPersona(usuarioData)

      // Cargar respuestas del usuario
      const { data: respuestasData, error: respuestasError } = await supabase
        .from('respuestas_cuestionario')
        .select('*')
        .eq('usuario_id', userId)
        .order('pregunta_id', { ascending: true })

      if (respuestasError) {
        throw handleSupabaseError(respuestasError, 'cargar respuestas')
      }

      // Process individual responses
      let respuestasProcesadas = []
      if (respuestasData && respuestasData.length > 0) {
        respuestasProcesadas = respuestasData
      }

      setRespuestas(respuestasProcesadas)

      // Calcular nivel de salud usando utilidad existente
      const nivel = calcularNivelSalud(respuestasProcesadas)
      setNivelSalud(nivel)

    } catch (error) {
      console.error('Error cargando datos:', error)
      setError(getUserFriendlyMessage(error))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [userId])

  return {
    loading,
    error,
    persona,
    respuestas,
    nivelSalud,
    refetch: cargarDatos
  }
}

export default useQuestionnaireResults