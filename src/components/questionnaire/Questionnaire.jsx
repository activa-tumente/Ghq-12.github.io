import React, { useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { questions, likertOptions } from '../../data/questions';
import { useKeyboardNavigation } from '../../hooks/useKeyboardNavigation';
import { useQuestionnaire } from '../../hooks/useQuestionnaire';
import { useQuestionnaireNavigation } from './hooks/useQuestionnaireNavigation';
import { useTimer } from './hooks/useTimer';
import QuestionSidebar from './QuestionSidebar';
import './questionnaire.css';




const QuestionHeader = React.memo(({
  isDirectAccess,
  currentGroup,
  totalGroups,
  currentGroupStartIndex,
  currentGroupEndIndex,
  currentGroupAnswered,
  currentGroupTotal,
  elapsedTime,
  formatTime
}) => (
  <div className="bg-white shadow-sm border-b border-gray-200 p-4">
    <div className="max-w-none mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900 truncate">
            {isDirectAccess ? 'Cuestionario de Salud General (GHQ-12)' : 'Cuestionario de Salud General (GHQ-12)'}
          </h1>
          <div className="flex items-center space-x-4 mt-1">
            <p className="text-gray-600">
              Grupo {currentGroup + 1} de {totalGroups} • Preguntas {currentGroupStartIndex + 1}-{currentGroupEndIndex}
            </p>
            <span className="text-gray-400">•</span>
            <p className="text-gray-600">
              Respondidas: {currentGroupAnswered}/{currentGroupTotal}
            </p>
            {isDirectAccess && (
              <>
                <span className="text-gray-400">•</span>
                <p className="text-sm text-blue-600">
                  Modo demostración
                </p>
              </>
            )}
          </div>
        </div>
        <div className="text-right ml-4">
          <div className="text-sm text-gray-500">Tiempo</div>
          <div className="text-lg font-mono font-semibold text-gray-700">
            {formatTime(elapsedTime)}
          </div>
        </div>
      </div>
    </div>
  </div>
));

const QuestionGroupContent = React.memo(({
  currentGroupQuestions,
  currentGroup,
  answers,
  handleAnswer,
  goToPreviousGroup,
  goToNextGroup,
  totalGroups,
  isCurrentGroupComplete,
  currentGroupStartIndex
}) => {
  const containerRef = useRef(null);
  
  // Crear array de todas las opciones de respuesta para navegación
  const allAnswerOptions = useMemo(() => {
    const options = [];
    currentGroupQuestions.forEach((question, questionIndex) => {
      likertOptions.forEach((option, optionIndex) => {
        options.push({
          questionId: question.id,
          questionIndex,
          optionValue: option.value,
          optionIndex,
          optionLabel: option.label
        });
      });
    });
    return options;
  }, [currentGroupQuestions]);

  // Configurar navegación por teclado
  const keyboardNavigation = useKeyboardNavigation({
    items: allAnswerOptions,
    onSelect: (index, item) => {
      if (item) {
        handleAnswer(item.questionId, item.optionValue);
      }
    },
    onNext: () => {
      if (isCurrentGroupComplete && currentGroup < totalGroups - 1) {
        goToNextGroup();
      }
    },
    onPrevious: () => {
      if (currentGroup > 0) {
        goToPreviousGroup();
      }
    },
    enabled: true,
    containerRef,
    orientation: 'both'
  });

  return (
    <div 
      ref={containerRef}
      className="flex-1 flex items-start justify-center p-4 overflow-y-auto"
      tabIndex={0}
      role="main"
      aria-label="Contenido del cuestionario"
    >
      <div className="max-w-6xl w-full">
        <div className="bg-white rounded-xl shadow-lg p-6">
          {/* Group Header */}
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Grupo {currentGroup + 1} de {totalGroups} - Preguntas {currentGroupStartIndex + 1} al {currentGroupStartIndex + currentGroupQuestions.length}
            </h2>
            <p className="text-gray-600">
              {totalGroups === 1 ? 'Responde todas las preguntas del cuestionario' : 'Responde todas las preguntas de este grupo antes de continuar'}
            </p>
          </div>

          {/* Questions Grid */}
          <div className="space-y-8">
            {currentGroupQuestions.map((question, questionIndex) => {
              const questionNumber = currentGroupStartIndex + questionIndex + 1;
              const isAnswered = answers[question.id] !== undefined;

              return (
                <div key={question.id} className="border border-gray-200 rounded-lg p-6">
                  {/* Question Header */}
                  <div className="flex items-center space-x-3 mb-4">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center font-semibold
                      ${isAnswered
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-600'
                      }
                    `}>
                      {questionNumber}
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 uppercase tracking-wide">
                        {question.dimension}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {question.text}
                      </h3>
                    </div>
                  </div>

                  {/* Answer Options */}
                  <div className="ml-13" role="radiogroup" aria-labelledby={`question-${question.id}-title`}>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      {likertOptions.map((option, optionIndex) => {
                        const isSelected = answers[question.id] === option.value;
                        const globalOptionIndex = questionIndex * likertOptions.length + optionIndex;

                        return (
                          <button
                            key={option.value}
                            ref={keyboardNavigation.setItemRef(globalOptionIndex)}
                            onClick={() => handleAnswer(question.id, option.value)}
                            className={`
                              p-3 rounded-lg border-2 transition-all duration-200
                              flex flex-col items-center text-center space-y-2
                              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                              ${isSelected
                                ? 'border-blue-500 bg-blue-50 text-blue-900'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                              }
                            `}
                            role="radio"
                            aria-checked={isSelected}
                            aria-label={`Pregunta ${questionNumber}: ${option.label}, valor ${option.value}`}
                            aria-describedby={`question-${question.id}-desc`}
                            tabIndex={-1}
                          >
                            <div className={`
                              w-6 h-6 rounded-full border-2 flex items-center justify-center
                              ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}
                            `}>
                              {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                            </div>
                            <div>
                              <div className="font-medium text-sm">{option.label}</div>
                              <div className="text-xs text-gray-500">Valor: {option.value}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Keyboard Navigation Instructions */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-800">
              <strong>Navegación por teclado:</strong> Use las flechas ↑↓←→ para navegar entre opciones, 
              Enter/Espacio para seleccionar, Ctrl+← para grupo anterior, Ctrl+→ para siguiente grupo
            </div>
          </div>

          {/* Group Navigation */}
          <div className="flex justify-between items-center pt-8 mt-8 border-t border-gray-200">
            <button
              onClick={goToPreviousGroup}
              disabled={currentGroup === 0}
              className={`
                flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
                ${currentGroup === 0
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100 border border-gray-300'
                }
              `}
              aria-label="Grupo anterior (Ctrl + Flecha izquierda)"
              aria-describedby="nav-instructions"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Grupo Anterior</span>
            </button>

            <div className="flex items-center space-x-3" role="status" aria-live="polite">
              {isCurrentGroupComplete && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
              <span className="text-sm text-gray-600">
                {isCurrentGroupComplete ? 'Grupo Completo' : 'Grupo Incompleto'}
              </span>
            </div>

            <button
              onClick={goToNextGroup}
              disabled={currentGroup === totalGroups - 1}
              className={`
                flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${currentGroup === totalGroups - 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : isCurrentGroupComplete
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'text-gray-700 hover:bg-gray-100 border border-gray-300'
                }
              `}
              aria-label="Siguiente grupo (Ctrl + Flecha derecha)"
              aria-describedby="nav-instructions"
            >
              <span>Siguiente Grupo</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Hidden instructions for screen readers */}
          <div id="nav-instructions" className="sr-only">
            Use Ctrl + flechas izquierda/derecha para navegar entre grupos de preguntas
          </div>
        </div>
      </div>
    </div>
  );
});

// Componente principal
const Questionnaire = ({ personData, onComplete, token, tokenValid }) => {
  const navigate = useNavigate();
  const isDirectAccess = !token;
  
  const [startTime] = useState(new Date());
  const [showSidebar, setShowSidebar] = useState(true);

  const { elapsedTime, formatTime } = useTimer(startTime);
  const { answers, isSubmitting, handleAnswer, handleSubmit } = useQuestionnaire(
    isDirectAccess, personData, onComplete, navigate, startTime, token, tokenValid
  );

  // Use existing navigation hook
  const {
    currentGroup,
    totalGroups,
    currentGroupStartIndex,
    currentGroupEndIndex,
    currentGroupQuestions,
    goToNextGroup,
    goToPreviousGroup,
    goToQuestion
  } = useQuestionnaireNavigation(questions, 6);

  // Wrap goToQuestion to include answer validation
  const handleGoToQuestion = useCallback((index) => {
    goToQuestion(index, answers);
  }, [goToQuestion, answers]);

  // Check if current group is complete - Memoized for performance
  const { currentGroupAnswered, isCurrentGroupComplete } = useMemo(() => {
    const answered = currentGroupQuestions.filter(q => answers[q.id] !== undefined).length;
    return {
      currentGroupAnswered: answered,
      isCurrentGroupComplete: answered === currentGroupQuestions.length
    };
  }, [currentGroupQuestions, answers]);

  // Memoize answer options for keyboard navigation
  const allAnswerOptions = useMemo(() => {
    const options = [];
    currentGroupQuestions.forEach((question, questionIndex) => {
      likertOptions.forEach((option, optionIndex) => {
        options.push({
          questionId: question.id,
          questionIndex,
          optionValue: option.value,
          optionIndex,
          optionLabel: option.label
        });
      });
    });
    return options;
  }, [currentGroupQuestions]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <QuestionSidebar
        showSidebar={showSidebar}
        setShowSidebar={setShowSidebar}
        elapsedTime={elapsedTime}
        formatTime={formatTime}
        answers={answers}
        questions={questions}
        currentGroup={currentGroup}
        currentGroupStartIndex={currentGroupStartIndex}
        goToQuestion={handleGoToQuestion}
        handleSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />

      <div className="flex-1 flex flex-col max-w-none">
        <QuestionHeader
          isDirectAccess={isDirectAccess}
          currentGroup={currentGroup}
          totalGroups={totalGroups}
          currentGroupStartIndex={currentGroupStartIndex}
          currentGroupEndIndex={currentGroupEndIndex}
          currentGroupAnswered={currentGroupAnswered}
          currentGroupTotal={currentGroupQuestions.length}
          elapsedTime={elapsedTime}
          formatTime={formatTime}
        />

        <QuestionGroupContent
          currentGroupQuestions={currentGroupQuestions}
          currentGroup={currentGroup}
          answers={answers}
          handleAnswer={handleAnswer}
          goToPreviousGroup={goToPreviousGroup}
          goToNextGroup={goToNextGroup}
          totalGroups={totalGroups}
          isCurrentGroupComplete={isCurrentGroupComplete}
          currentGroupStartIndex={currentGroupStartIndex}
          allAnswerOptions={allAnswerOptions}
        />
      </div>
    </div>
  );
};

// Add PropTypes
Questionnaire.propTypes = {
  personData: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    nombre: PropTypes.string,
    email: PropTypes.string,
    metadata: PropTypes.object
  }),
  onComplete: PropTypes.func,
  token: PropTypes.string,
  tokenValid: PropTypes.bool
};

export default Questionnaire;