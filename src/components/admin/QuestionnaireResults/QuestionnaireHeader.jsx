import React from 'react'
import PropTypes from 'prop-types'
import { ArrowLeft, User, FileText, BarChart3, Clock } from 'lucide-react'
import { getHealthLevelConfig } from '../../../utils/healthCalculations'

const QuestionnaireHeader = ({ persona, nivelSalud, onBack }) => {
  const nivelConfig = getHealthLevelConfig(nivelSalud?.nivel)
  const IconComponent = nivelConfig.icon || User

  return (
    <div className="mb-8">
      <button
        onClick={onBack}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Volver a Cuestionarios
      </button>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
              Resultados del Cuestionario GHQ-12
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              <div className="flex items-center text-gray-600">
                <User className="h-5 w-5 mr-2" />
                <span className="font-bold text-lg text-gray-900">{persona.nombre || 'Sin nombre'}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <FileText className="h-5 w-5 mr-2" />
                <span>Doc: {persona.documento || persona.metadata?.documento || 'Sin documento'}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <BarChart3 className="h-5 w-5 mr-2" />
                <span>Área: {persona.area_macro || persona.departamento || persona.metadata?.area || 'Sin área'}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Clock className="h-5 w-5 mr-2" />
                <span>Turno: {persona.turno || persona.metadata?.turno || 'Sin turno'}</span>
              </div>
            </div>
          </div>
          
          {/* Nivel de Salud Badge */}
          <div className={`px-4 py-3 rounded-lg border-2 ${nivelConfig.color} flex items-center space-x-3`}>
            <span className="text-2xl">{nivelConfig.emoji}</span>
            <div>
              <div className="font-semibold text-lg">{nivelConfig.label}</div>
              <div className="text-sm opacity-80">Puntuación: {nivelSalud?.puntuacion || 0}/36</div>
            </div>
          </div>
        </div>
        

      </div>
    </div>
  )
}

QuestionnaireHeader.propTypes = {
  persona: PropTypes.shape({
    nombre: PropTypes.string,
    metadata: PropTypes.object,
    created_at: PropTypes.string
  }).isRequired,
  nivelSalud: PropTypes.shape({
    nivel: PropTypes.string,
    puntuacion: PropTypes.number
  }),
  onBack: PropTypes.func.isRequired
}

export default React.memo(QuestionnaireHeader)