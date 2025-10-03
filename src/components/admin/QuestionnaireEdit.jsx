import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Save, 
  User, 
  FileText,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { supabase } from '../../api/supabase'
import { questions, likertOptions } from '../../data/questions'
import LoadingSpinner from '../ui/LoadingSpinner'

const QuestionnaireEdit = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [persona, setPersona] = useState(null)
  const [respuestas, setRespuestas] = useState({})
  const [originalRespuestas, setOriginalRespuestas] = useState({})
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    cargarDatos()
  }, [id])

  useEffect(() => {
    // Detectar cambios
    const cambios = Object.keys(respuestas).some(preguntaId => {
      return respuestas[preguntaId] !== originalRespuestas[preguntaId]
    })
    setHasChanges(cambios)
  }, [respuestas, originalRespuestas])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      setError(null)

      // Cargar datos de la persona
      const { data: personaData, error: personaError } = await supabase
        .from('personas')
        .select('*')
        .eq('id', id)
        .single()

      if (personaError) {
        throw new Error(`Error al cargar persona: ${personaError.message}`)
      }

      if (!personaData) {
        throw new Error('Persona no encontrada')
      }

      setPersona(personaData)

      // Cargar respuestas de la persona
      const { data: respuestasData, error: respuestasError } = await supabase
        .from('respuestas')
        .select('*')
        .eq('persona_id', id)

      if (respuestasError) {
        throw new Error(`Error al cargar respuestas: ${respuestasError.message}`)
      }

      // Convertir respuestas a objeto para fácil manejo
      const respuestasObj = {}
      if (respuestasData) {
        respuestasData.forEach(resp => {
          respuestasObj[resp.pregunta_id] = resp.respuesta
        })
      }
      
      setRespuestas(respuestasObj)
      setOriginalRespuestas({ ...respuestasObj })

    } catch (error) {
      console.error('Error cargando datos:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRespuestaChange = (preguntaId, valor) => {
    setRespuestas(prev => ({
      ...prev,
      [preguntaId]: parseInt(valor)
    }))
  }

  const guardarCambios = async () => {
    try {
      setSaving(true)
      setError(null)

      // Preparar las respuestas para guardar
      const respuestasParaGuardar = []
      const respuestasParaActualizar = []
      const respuestasParaEliminar = []

      // Procesar cada pregunta
      questions.forEach(pregunta => {
        const preguntaId = pregunta.id
        const nuevaRespuesta = respuestas[preguntaId]
        const respuestaOriginal = originalRespuestas[preguntaId]

        if (nuevaRespuesta !== undefined && nuevaRespuesta !== null) {
          if (respuestaOriginal !== undefined) {
            // Actualizar respuesta existente
            if (nuevaRespuesta !== respuestaOriginal) {
              respuestasParaActualizar.push({
                persona_id: id,
                pregunta_id: preguntaId,
                respuesta: nuevaRespuesta
              })
            }
          } else {
            // Crear nueva respuesta
            respuestasParaGuardar.push({
              persona_id: id,
              pregunta_id: preguntaId,
              respuesta: nuevaRespuesta
            })
          }
        } else if (respuestaOriginal !== undefined) {
          // Eliminar respuesta (si se dejó en blanco)
          respuestasParaEliminar.push(preguntaId)
        }
      })

      // Ejecutar operaciones en la base de datos
      if (respuestasParaGuardar.length > 0) {
        const { error: insertError } = await supabase
          .from('respuestas')
          .insert(respuestasParaGuardar)
        
        if (insertError) {
          throw new Error(`Error al insertar respuestas: ${insertError.message}`)
        }
      }

      if (respuestasParaActualizar.length > 0) {
        for (const respuesta of respuestasParaActualizar) {
          const { error: updateError } = await supabase
            .from('respuestas')
            .update({ respuesta: respuesta.respuesta })
            .eq('persona_id', respuesta.persona_id)
            .eq('pregunta_id', respuesta.pregunta_id)
          
          if (updateError) {
            throw new Error(`Error al actualizar respuesta: ${updateError.message}`)
          }
        }
      }

      if (respuestasParaEliminar.length > 0) {
        const { error: deleteError } = await supabase
          .from('respuestas')
          .delete()
          .eq('persona_id', id)
          .in('pregunta_id', respuestasParaEliminar)
        
        if (deleteError) {
          throw new Error(`Error al eliminar respuestas: ${deleteError.message}`)
        }
      }

      // Actualizar estado de completado si es necesario
      const totalRespuestas = Object.keys(respuestas).filter(key => respuestas[key] !== undefined && respuestas[key] !== null).length
      const completado = totalRespuestas === questions.length
      
      if (persona.completado !== completado) {
        const { error: updatePersonaError } = await supabase
          .from('personas')
          .update({ 
            completado,
            fecha_completado: completado ? new Date().toISOString() : null
          })
          .eq('id', id)
        
        if (updatePersonaError) {
          throw new Error(`Error al actualizar estado: ${updatePersonaError.message}`)
        }
      }

      // Actualizar estado local
      setOriginalRespuestas({ ...respuestas })
      setHasChanges(false)
      
      // Mostrar mensaje de éxito y redirigir
      alert('✅ Cambios guardados exitosamente')
      navigate(`/cuestionarios/${id}/resultados`)

    } catch (error) {
      console.error('Error guardando cambios:', error)
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }

  const cancelarEdicion = () => {
    if (hasChanges) {
      if (window.confirm('¿Estás seguro de que quieres cancelar? Se perderán los cambios no guardados.')) {
        navigate(`/cuestionarios/${id}/resultados`)
      }
    } else {
      navigate(`/cuestionarios/${id}/resultados`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner message="Cargando cuestionario para editar..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error al cargar datos</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/cuestionarios')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Volver a Cuestionarios
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!persona) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Cuestionario no encontrado</h2>
            <p className="text-gray-600 mb-6">El cuestionario solicitado no existe o ha sido eliminado.</p>
            <button
              onClick={() => navigate('/cuestionarios')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Volver a Cuestionarios
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={cancelarEdicion}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Volver a Resultados
          </button>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Editar Cuestionario GHQ-12
                </h1>
                <div className="flex items-center text-gray-600 space-x-6">
                  <div className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    <span className="font-medium">{persona.nombres} {persona.apellidos}</span>
                  </div>
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    <span>Doc: {persona.documento}</span>
                  </div>
                </div>
              </div>
              
              {/* Botones de acción */}
              <div className="flex space-x-3">
                <button
                  onClick={cancelarEdicion}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={guardarCambios}
                  disabled={!hasChanges || saving}
                  className={`px-6 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                    hasChanges && !saving
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Guardar Cambios</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {hasChanges && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                  <span className="text-yellow-800">Tienes cambios sin guardar</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Formulario de Edición */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <FileText className="h-6 w-6 mr-2" />
              Respuestas del Cuestionario
            </h2>
            <p className="text-gray-600 mt-1">
              Modifica las respuestas según sea necesario. Los cambios se guardarán automáticamente.
            </p>
          </div>
          
          <div className="p-6">
            <div className="space-y-8">
              {questions.map((pregunta, index) => {
                const respuestaActual = respuestas[pregunta.id]
                
                return (
                  <div key={pregunta.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="mb-4">
                      <h3 className="font-medium text-gray-900 mb-2">
                        {index + 1}. {pregunta.text}
                      </h3>
                    </div>
                    
                    <div className="space-y-3">
                      {likertOptions.map((opcion, opcionIndex) => (
                        <label
                          key={opcionIndex}
                          className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            respuestaActual === opcionIndex
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`pregunta-${pregunta.id}`}
                            value={opcionIndex}
                            checked={respuestaActual === opcionIndex}
                            onChange={(e) => handleRespuestaChange(pregunta.id, e.target.value)}
                            className="sr-only"
                          />
                          <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                            respuestaActual === opcionIndex
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-300'
                          }`}>
                            {respuestaActual === opcionIndex && (
                              <CheckCircle className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <span className={`flex-1 ${
                            respuestaActual === opcionIndex
                              ? 'text-blue-900 font-medium'
                              : 'text-gray-700'
                          }`}>
                            {opcion.text}
                          </span>
                          <span className={`text-sm ${
                            respuestaActual === opcionIndex
                              ? 'text-blue-700'
                              : 'text-gray-500'
                          }`}>
                            ({opcionIndex} pts)
                          </span>
                        </label>
                      ))}
                    </div>
                    
                    {/* Opción para limpiar respuesta */}
                    {respuestaActual !== undefined && (
                      <button
                        onClick={() => handleRespuestaChange(pregunta.id, undefined)}
                        className="mt-3 text-sm text-red-600 hover:text-red-800 transition-colors"
                      >
                        Limpiar respuesta
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer con botones */}
        <div className="mt-8 flex justify-end space-x-4">
          <button
            onClick={cancelarEdicion}
            className="px-6 py-3 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={guardarCambios}
            disabled={!hasChanges || saving}
            className={`px-8 py-3 rounded-lg transition-colors flex items-center space-x-2 ${
              hasChanges && !saving
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                <span>Guardar Cambios</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default QuestionnaireEdit