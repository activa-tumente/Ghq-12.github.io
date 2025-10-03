import { AlertTriangle } from 'lucide-react';
import MultiStepForm from './MultiStepForm';
import Questionnaire from './Questionnaire';

/**
 * Loading step component
 */
export const LoadingStep = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
      <p className="mt-4 text-gray-600">Validando acceso...</p>
    </div>
  </div>
);

/**
 * Invalid token step component
 */
export const InvalidTokenStep = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center max-w-md mx-auto p-8">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="w-8 h-8 text-red-600" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Enlace no válido</h1>
      <p className="text-gray-600 mb-6">
        El enlace que utilizaste no es válido, ha expirado o ya ha sido utilizado.
      </p>
      <p className="text-sm text-gray-500">
        Si crees que esto es un error, contacta al administrador del sistema.
      </p>
    </div>
  </div>
);

/**
 * Progress indicator component
 */
const ProgressIndicator = ({ currentStep }) => (
  <div className="mb-8">
    <div className="flex items-center justify-center space-x-4">
      <div className="flex items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
          currentStep === 'form' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
        }`}>
          1
        </div>
        <span className={`ml-2 text-sm font-medium ${
          currentStep === 'form' ? 'text-blue-600' : 'text-gray-500'
        }`}>
          Datos Personales
        </span>
      </div>
      <div className="w-16 h-1 bg-gray-200 rounded" />
      <div className="flex items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
          currentStep === 'questionnaire' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
        }`}>
          2
        </div>
        <span className={`ml-2 text-sm font-medium ${
          currentStep === 'questionnaire' ? 'text-blue-600' : 'text-gray-500'
        }`}>
          Cuestionario
        </span>
      </div>
    </div>
  </div>
);

/**
 * Form step component
 */
export const FormStep = ({ onComplete }) => (
  <div className="min-h-screen bg-gray-50">
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Cuestionario de Salud General (GHQ-12)
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            Cuestionario de Salud General (GHQ-12)
          </p>
          <p className="text-sm text-gray-500">
            Antes de comenzar con las preguntas, necesitamos recopilar algunos datos básicos
          </p>
        </div>

        <ProgressIndicator currentStep="form" />
        <MultiStepForm onComplete={onComplete} />
      </div>
    </div>
  </div>
);

/**
 * Questionnaire step component
 */
export const QuestionnaireStep = ({ 
  personData, 
  onComplete, 
  token, 
  tokenValid, 
  isDirectAccess, 
  onBackToForm 
}) => (
  <div className="relative">
    {/* Back button (solo visible en acceso directo) */}
    {isDirectAccess && (
      <button
        onClick={onBackToForm}
        className="absolute top-4 left-4 z-50 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg shadow-md border border-gray-200 transition-colors duration-200 flex items-center space-x-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span>Volver a datos</span>
      </button>
    )}
    
    <Questionnaire
      personData={personData}
      onComplete={onComplete}
      token={token}
      tokenValid={tokenValid}
    />
  </div>
);