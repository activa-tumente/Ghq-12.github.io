import { useNavigate } from 'react-router-dom'
import { Home, ArrowLeft, AlertTriangle } from 'lucide-react'

const NotFound = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        {/* Icono de error */}
        <div className="mx-auto h-24 w-24 bg-red-100 rounded-full flex items-center justify-center mb-8">
          <AlertTriangle className="h-12 w-12 text-red-600" />
        </div>

        {/* Título y mensaje */}
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Página no encontrada
        </h2>
        <p className="text-gray-600 mb-8">
          Lo sentimos, la página que estás buscando no existe o ha sido movida.
        </p>

        {/* Botones de navegación */}
        <div className="space-y-4">
          <button
            onClick={() => navigate('/')}
            className="w-full btn-primary"
          >
            <Home className="w-5 h-5 mr-2" />
            Ir al Inicio
          </button>
          
          <button
            onClick={() => navigate(-1)}
            className="w-full btn-secondary"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver atrás
          </button>
        </div>

        {/* Enlaces adicionales */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">
            ¿Necesitas ayuda? Puedes acceder a:
          </p>
          <div className="space-y-2">
            <button
              onClick={() => navigate('/login')}
              className="block w-full text-center text-blue-600 hover:text-blue-800 text-sm"
            >
              Panel de Administración
            </button>
            <button
              onClick={() => navigate('/cuestionario')}
              className="block w-full text-center text-blue-600 hover:text-blue-800 text-sm"
            >
              Cuestionario de Seguridad
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8">
          <p className="text-xs text-gray-400">
            Sistema de Evaluación de Seguridad Conductual CSBC
          </p>
        </div>
      </div>
    </div>
  )
}

export default NotFound