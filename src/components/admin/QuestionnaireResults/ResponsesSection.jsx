import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import { FileText, CheckCircle, XCircle } from 'lucide-react'
import { questions, likertOptions } from '../../../data/questions'
import { getHealthLevelConfig } from '../../../utils/healthCalculations'

// Constants
const QUESTIONNAIRE_CONFIG = {
  TOTAL_QUESTIONS: 12,
  MAX_SCORE: 36,
  QUESTIONNAIRE_NAME: 'GHQ-12'
}

// Extracted component for health level summary
const HealthLevelSummary = React.memo(({ nivelSalud, respuestasCount }) => {
  const nivelConfig = getHealthLevelConfig(nivelSalud?.nivel)

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <h3 className="text-lg font-semibold text-blue-900">
            Nivel de Salud Mental: {nivelConfig.label}
          </h3>
        </div>
        <div>
          <p className="text-lg font-medium text-blue-700">{nivelConfig.description}</p>
        </div>
        <div>
          <span className="text-lg font-medium text-blue-600">
            Puntuación Total: {nivelSalud?.puntuacion || 0}/{QUESTIONNAIRE_CONFIG.MAX_SCORE}
          </span>
        </div>
      </div>
    </div>
  )
})

HealthLevelSummary.displayName = 'HealthLevelSummary'
HealthLevelSummary.propTypes = {
  nivelSalud: PropTypes.shape({
    nivel: PropTypes.string,
    puntuacion: PropTypes.number
  }),
  respuestasCount: PropTypes.number.isRequired
}

const ResponsesSection = ({ respuestas, nivelSalud }) => {
  // Input validation
  const validRespuestas = useMemo(() => {
    if (!Array.isArray(respuestas)) {
      console.warn('ResponsesSection: respuestas prop should be an array')
      return []
    }
    return respuestas.filter(r => r && typeof r.pregunta_id === 'number')
  }, [respuestas])

  // Create lookup maps for better performance
  const respuestasMap = useMemo(() => {
    return validRespuestas.reduce((map, respuesta) => {
      map[respuesta.pregunta_id] = respuesta
      return map
    }, {})
  }, [validRespuestas])

  const likertOptionsMap = useMemo(() => {
    return likertOptions.reduce((map, option) => {
      map[option.value] = option
      return map
    }, {})
  }, [])

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center justify-center">
          <FileText className="h-6 w-6 mr-2" aria-hidden="true" />
          Respuestas Detalladas ({validRespuestas.length}/{QUESTIONNAIRE_CONFIG.TOTAL_QUESTIONS})
        </h2>
      </div>

      <div className="p-6">
        {validRespuestas.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" aria-hidden="true" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Sin respuestas</h3>
            <p className="text-gray-600">
              Este usuario aún no ha completado el cuestionario {QUESTIONNAIRE_CONFIG.QUESTIONNAIRE_NAME}.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <HealthLevelSummary
              nivelSalud={nivelSalud}
              respuestasCount={validRespuestas.length}
            />

            {/* Detailed Responses - 2 Column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {questions.map((pregunta, index) => {
              const respuesta = respuestasMap[pregunta.id]
              const opcionSeleccionada = respuesta ? likertOptionsMap[respuesta.respuesta] : null
              const questionNumber = index + 1

              return (
                <div
                  key={pregunta.id}
                  className="border border-gray-200 rounded-lg p-4"
                  role="article"
                  aria-labelledby={`question-${pregunta.id}-title`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3
                        id={`question-${pregunta.id}-title`}
                        className="font-medium text-gray-900 mb-2"
                      >
                        {questionNumber}. {pregunta.text}
                      </h3>
                    </div>
                    <div className="ml-4 text-right">
                      <span className="text-sm text-gray-500">
                        Pregunta {questionNumber}/{QUESTIONNAIRE_CONFIG.TOTAL_QUESTIONS}
                      </span>
                    </div>
                  </div>

                  {respuesta ? (
                    <div
                      className="bg-green-50 border border-green-200 rounded-lg p-3"
                      role="status"
                      aria-label="Pregunta respondida"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <span className="font-medium text-green-900">
                            Respuesta: {opcionSeleccionada?.label}
                          </span>
                          <span className="ml-2 text-sm text-green-700">
                            (Puntuación: {respuesta.respuesta})
                          </span>
                        </div>
                        <CheckCircle
                          className="h-5 w-5 text-green-600 ml-3"
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                  ) : (
                    <div
                      className="bg-gray-50 border border-gray-200 rounded-lg p-3"
                      role="status"
                      aria-label="Pregunta sin responder"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Sin respuesta</span>
                        <XCircle
                          className="h-5 w-5 text-gray-400"
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

ResponsesSection.propTypes = {
  respuestas: PropTypes.arrayOf(PropTypes.shape({
    pregunta_id: PropTypes.number,
    respuesta: PropTypes.number,
    fecha_respuesta: PropTypes.string
  })).isRequired,
  nivelSalud: PropTypes.shape({
    nivel: PropTypes.string,
    puntuacion: PropTypes.number
  })
}

export default React.memo(ResponsesSection)