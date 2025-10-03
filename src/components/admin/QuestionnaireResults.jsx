import { useParams, useNavigate } from 'react-router-dom'
import { XCircle, FileText } from 'lucide-react'
import LoadingSpinner from '../ui/LoadingSpinner'
import useQuestionnaireResults from '../../hooks/useQuestionnaireResults'
import QuestionnaireHeader from './QuestionnaireResults/QuestionnaireHeader'
import ResponsesSection from './QuestionnaireResults/ResponsesSection'
import UserInfoSection from './QuestionnaireResults/UserInfoSection'

const QuestionnaireResults = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  
  // Use custom hook for data management
  const { loading, error, persona, respuestas, nivelSalud } = useQuestionnaireResults(id)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner message="Cargando resultados del cuestionario..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
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
      <div className="max-w-6xl mx-auto px-4 py-8">
        <QuestionnaireHeader 
          persona={persona}
          nivelSalud={nivelSalud}
          onBack={() => navigate('/cuestionarios')}
        />
        
        <ResponsesSection respuestas={respuestas} nivelSalud={nivelSalud} />
        
        <UserInfoSection persona={persona} respuestas={respuestas} />
      </div>
    </div>
  )
}

export default QuestionnaireResults