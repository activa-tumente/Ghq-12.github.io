import React from 'react'
import PropTypes from 'prop-types'
import { Calendar, User } from 'lucide-react'

const UserInfoSection = ({ persona, respuestas }) => {
  return (
    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-center">
          <Calendar className="h-5 w-5 mr-2" />
          Información Temporal
        </h3>
        <div className="space-y-3">
          <div className="text-center">
            <span className="text-sm text-gray-500">Fecha de creación:</span>
            <p className="font-medium">
              {persona.fecha_creacion ? new Date(persona.fecha_creacion).toLocaleString('es-ES') : 'Fecha no disponible'}
            </p>
          </div>
          {respuestas.length > 0 && respuestas[0].created_at && (
            <div>
              <span className="text-sm text-gray-500">Fecha de finalización:</span>
              <p className="font-medium">
                {new Date(respuestas[0].created_at).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-center">
          <User className="h-5 w-5 mr-2" />
          Datos Demográficos
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center">
            <span className="text-sm text-gray-500 block mb-1">Género:</span>
            <p className="font-medium">{persona.genero || 'No especificado'}</p>
          </div>
          <div className="text-center">
            <span className="text-sm text-gray-500 block mb-1">Edad:</span>
            <p className="font-medium">{persona.edad ? `${persona.edad} años` : 'No especificada'}</p>
          </div>
          <div className="text-center">
            <span className="text-sm text-gray-500 block mb-1">Estado:</span>
            <p className="font-medium">
              {respuestas.length > 0 ? (
                <span className="text-green-600">✅ Completado</span>
              ) : (
                <span className="text-yellow-600">⏳ Sin respuestas</span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

UserInfoSection.propTypes = {
  persona: PropTypes.shape({
    fecha_creacion: PropTypes.string,
    metadata: PropTypes.object
  }).isRequired,
  respuestas: PropTypes.arrayOf(PropTypes.shape({
    created_at: PropTypes.string
  })).isRequired
}

export default React.memo(UserInfoSection)