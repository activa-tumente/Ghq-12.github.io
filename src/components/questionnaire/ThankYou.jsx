import { CheckCircle, Clock, Users, BarChart3 } from 'lucide-react'

const ThankYou = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Icono de éxito */}
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>

          {/* Título principal */}
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            ¡Cuestionario Completado!
          </h1>

          {/* Mensaje de agradecimiento */}
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            Gracias por completar el <strong>Cuestionario de Seguridad Conductual</strong>. 
            Tu participación es fundamental para mejorar la cultura de seguridad en nuestra organización.
          </p>

          {/* Información adicional */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">Tiempo Invertido</h3>
              <p className="text-sm text-gray-600">
                Has dedicado tiempo valioso para esta evaluación
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">Contribución</h3>
              <p className="text-sm text-gray-600">
                Tus respuestas ayudarán a identificar oportunidades de mejora
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">Análisis</h3>
              <p className="text-sm text-gray-600">
                Los resultados se analizarán para generar planes de acción
              </p>
            </div>
          </div>

          {/* Próximos pasos */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">¿Qué sigue ahora?</h3>
            <ul className="text-left text-sm text-gray-600 space-y-2">
              <li className="flex items-start">
                <span className="w-2 h-2 bg-primary-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Los resultados serán analizados junto con las respuestas de todo el equipo
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-primary-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Se identificarán fortalezas y oportunidades de mejora en seguridad
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-primary-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Se desarrollarán planes de acción específicos para cada área
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-primary-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Recibirás información sobre las iniciativas de mejora implementadas
              </li>
            </ul>
          </div>

          {/* Mensaje final */}
          <div className="border-t pt-6">
            <p className="text-gray-600 mb-4">
              <strong>Recuerda:</strong> La seguridad es responsabilidad de todos. 
              Tu compromiso diario con las prácticas seguras hace la diferencia.
            </p>
            
            <div className="text-sm text-gray-500">
              <p>Si tienes alguna pregunta sobre este cuestionario o sobre seguridad en general,</p>
              <p>no dudes en contactar al equipo de Seguridad y Salud Ocupacional.</p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t">
            <p className="text-xs text-gray-400">
              CSBC Cuestionario de Seguridad Basada en el Comportamiento
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ThankYou