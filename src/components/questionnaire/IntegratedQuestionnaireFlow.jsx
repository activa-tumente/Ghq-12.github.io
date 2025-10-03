/**
 * Flujo integrado del cuestionario con registro de usuarios
 * Combina UserRegistration, cuestionario y QuestionnaireSubmission
 */

import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { startQuestionnaire } from '../../store/slices/questionnaireSlice';
import UserRegistration from '../user/UserRegistration';
import QuestionnaireSubmission from './QuestionnaireSubmission';
import { questionnaireHelpers } from '../../lib/userDatabase.js';
import { supabase } from '../../api/supabase';
import { 
  User, 
  FileText, 
  Send, 
  CheckCircle, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight,
  Loader
} from 'lucide-react';

const IntegratedQuestionnaireFlow = ({ onComplete }) => {
  const dispatch = useDispatch();
  const [currentPhase, setCurrentPhase] = useState('registration'); // 'registration' | 'questionnaire' | 'submission'
  const [userData, setUserData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [responses, setResponses] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Preguntas del cuestionario GHQ-12 (estáticas)
  const GHQ12_QUESTIONS = [
    {
      id: 1,
      numero: 1,
      texto: "¿Ha podido concentrarse bien en lo que hace?",
      categoria: "concentracion",
      dimension: "Concentración"
    },
    {
      id: 2,
      numero: 2,
      texto: "¿Sus preocupaciones le han hecho perder mucho sueño?",
      categoria: "ansiedad",
      dimension: "Ansiedad"
    },
    {
      id: 3,
      numero: 3,
      texto: "¿Ha sentido que está jugando un papel útil en la vida?",
      categoria: "autoestima",
      dimension: "Autoestima"
    },
    {
      id: 4,
      numero: 4,
      texto: "¿Se ha sentido capaz de tomar decisiones?",
      categoria: "concentracion",
      dimension: "Concentración"
    },
    {
      id: 5,
      numero: 5,
      texto: "¿Se ha sentido constantemente agobiado y en tensión?",
      categoria: "ansiedad",
      dimension: "Ansiedad"
    },
    {
      id: 6,
      numero: 6,
      texto: "¿Ha sentido que no puede superar sus dificultades?",
      categoria: "autoestima",
      dimension: "Autoestima"
    },
    {
      id: 7,
      numero: 7,
      texto: "¿Ha sido capaz de disfrutar sus actividades normales de cada día?",
      categoria: "afrontamiento",
      dimension: "Afrontamiento"
    },
    {
      id: 8,
      numero: 8,
      texto: "¿Ha sido capaz de hacer frente a sus problemas?",
      categoria: "afrontamiento",
      dimension: "Afrontamiento"
    },
    {
      id: 9,
      numero: 9,
      texto: "¿Se ha sentido poco feliz y deprimido?",
      categoria: "depresion",
      dimension: "Depresión"
    },
    {
      id: 10,
      numero: 10,
      texto: "¿Ha perdido confianza en sí mismo?",
      categoria: "autoestima",
      dimension: "Autoestima"
    },
    {
      id: 11,
      numero: 11,
      texto: "¿Ha pensado que usted es una persona que no vale para nada?",
      categoria: "autoestima",
      dimension: "Autoestima"
    },
    {
      id: 12,
      numero: 12,
      texto: "¿Se siente razonablemente feliz considerando todas las circunstancias?",
      categoria: "depresion",
      dimension: "Depresión"
    }
  ];

  /**
   * Cargar preguntas del cuestionario (ahora usando preguntas estáticas)
   */
  const loadQuestions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simular un pequeño delay para mantener la UX consistente
      await new Promise(resolve => setTimeout(resolve, 500));
      setQuestions(GHQ12_QUESTIONS);
    } catch (error) {
      console.error('Error cargando preguntas:', error);
      setError(`Error al cargar preguntas: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Manejar registro exitoso de usuario
   */
  const handleRegistrationComplete = async (registrationData) => {
    setUserData(registrationData.user);
    
    // Cargar preguntas y avanzar al cuestionario
    await loadQuestions();
    setCurrentPhase('questionnaire');
    
    // Inicializar Redux store
    dispatch(startQuestionnaire({
      userId: registrationData.user.id,
      userEmail: registrationData.user.email
    }));
  };

  /**
   * Manejar respuesta a una pregunta
   */
  const handleQuestionResponse = (questionId, responseValue) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: responseValue
    }));
  };

  /**
   * Navegar a la siguiente pregunta
   */
  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Todas las preguntas respondidas, ir a envío
      setCurrentPhase('submission');
    }
  };

  /**
   * Navegar a la pregunta anterior
   */
  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  /**
   * Manejar envío exitoso del cuestionario
   */
  const handleSubmissionComplete = (submissionData) => {
    if (onComplete) {
      onComplete({
        user: userData,
        responses: responses,
        submissionResult: submissionData
      });
    }
  };

  /**
   * Volver al registro
   */
  const backToRegistration = () => {
    setCurrentPhase('registration');
    setUserData(null);
    setResponses({});
    setCurrentQuestionIndex(0);
    setError(null);
  };

  /**
   * Volver al cuestionario desde envío
   */
  const backToQuestionnaire = () => {
    setCurrentPhase('questionnaire');
    setCurrentQuestionIndex(questions.length - 1); // Ir a la última pregunta
  };

  /**
   * Renderizar indicador de progreso
   */
  const renderProgressIndicator = () => {
    const phases = [
      { key: 'registration', label: 'Registro', icon: User },
      { key: 'questionnaire', label: 'Cuestionario', icon: FileText },
      { key: 'submission', label: 'Envío', icon: Send }
    ];

    return (
      <div className="flex items-center justify-center mb-8">
        {phases.map((phase, index) => {
          const Icon = phase.icon;
          const isActive = currentPhase === phase.key;
          const isCompleted = phases.findIndex(p => p.key === currentPhase) > index;
          
          return (
            <React.Fragment key={phase.key}>
              <div className={`flex items-center ${
                isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
              }`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                  isActive ? 'border-blue-600 bg-blue-50' : 
                  isCompleted ? 'border-green-600 bg-green-50' : 
                  'border-gray-300 bg-gray-50'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <span className="ml-2 text-sm font-medium">{phase.label}</span>
              </div>
              
              {index < phases.length - 1 && (
                <div className={`mx-4 h-0.5 w-8 ${
                  isCompleted ? 'bg-green-600' : 'bg-gray-300'
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  /**
   * Renderizar cuestionario
   */
  const renderQuestionnaire = () => {
    if (isLoading) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center">
            <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Cargando preguntas...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={backToRegistration}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      );
    }

    if (questions.length === 0) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
            <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Sin preguntas</h2>
            <p className="text-gray-600 mb-6">No se encontraron preguntas para el cuestionario.</p>
            <button
              onClick={backToRegistration}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      );
    }

    const currentQuestion = questions[currentQuestionIndex];
    const responseLabels = ['Nunca', 'Casi nunca', 'Algunas veces', 'Frecuentemente'];
    const currentResponse = responses[currentQuestion.id];

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Cuestionario GHQ-12
            </h1>
            <p className="text-gray-600">
              Pregunta {currentQuestionIndex + 1} de {questions.length}
            </p>
          </div>

          {/* Progreso del cuestionario */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progreso</span>
              <span>{Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Pregunta actual */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {currentQuestion.numero}. {currentQuestion.texto}
            </h2>

            {/* Opciones de respuesta */}
            <div className="space-y-3">
              {responseLabels.map((label, index) => (
                <button
                  key={index}
                  onClick={() => handleQuestionResponse(currentQuestion.id, index)}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-colors ${
                    currentResponse === index
                      ? 'border-blue-600 bg-blue-50 text-blue-900'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                      currentResponse === index
                        ? 'border-blue-600 bg-blue-600'
                        : 'border-gray-300'
                    }`}>
                      {currentResponse === index && (
                        <div className="w-full h-full rounded-full bg-white scale-50" />
                      )}
                    </div>
                    <span className="font-medium">{index} - {label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Botones de navegación */}
          <div className="flex justify-between">
            <button
              onClick={prevQuestion}
              disabled={currentQuestionIndex === 0}
              className="flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Anterior
            </button>

            <button
              onClick={nextQuestion}
              disabled={currentResponse === undefined}
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentQuestionIndex === questions.length - 1 ? 'Finalizar' : 'Siguiente'}
              <ChevronRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Renderizar según la fase actual
  return (
    <div>
      {renderProgressIndicator()}
      
      {currentPhase === 'registration' && (
        <UserRegistration
          onRegistrationComplete={handleRegistrationComplete}
        />
      )}
      
      {currentPhase === 'questionnaire' && renderQuestionnaire()}
      
      {currentPhase === 'submission' && (
        <QuestionnaireSubmission
          userId={userData?.id}
          responses={responses}
          questions={questions}
          onSubmissionComplete={handleSubmissionComplete}
          onBack={backToQuestionnaire}
        />
      )}
    </div>
  );
};

export default IntegratedQuestionnaireFlow;