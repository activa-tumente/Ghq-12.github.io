import { useMemo, memo } from 'react';
import PropTypes from 'prop-types';
import { Clock, ArrowLeft, Save } from 'lucide-react';
import { questionCategories } from '../../data/questions';

const QuestionSidebar = ({
  showSidebar,
  setShowSidebar,
  elapsedTime,
  formatTime,
  answers,
  questions,
  currentGroup,
  currentGroupStartIndex,
  goToQuestion,
  handleSubmit,
  isSubmitting
}) => {
  const { answeredCount, progressPercentage, allAnswered } = useMemo(() => {
    const count = Object.keys(answers).length;
    return {
      answeredCount: count,
      progressPercentage: (count / questions.length) * 100,
      allAnswered: count === questions.length
    };
  }, [answers, questions.length]);

  return (
    <div className={`${showSidebar ? 'w-72' : 'w-14'} bg-white shadow-lg transition-all duration-300 flex flex-col min-h-screen`}>
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label={showSidebar ? 'Ocultar barra lateral' : 'Mostrar barra lateral'}
          >
            <ArrowLeft className={`w-5 h-5 transition-transform ${!showSidebar ? 'rotate-180' : ''}`} />
          </button>
          {showSidebar && (
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span className="font-mono text-lg font-semibold text-gray-700">
                {formatTime(elapsedTime)}
              </span>
            </div>
          )}
        </div>
        
        {showSidebar && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progreso</span>
              <span>{answeredCount}/{questions.length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${progressPercentage}%`,
                  background: `linear-gradient(to right, #F97316, #10B981)`
                }}
                role="progressbar"
                aria-valuenow={progressPercentage}
                aria-valuemin="0"
                aria-valuemax="100"
              />
            </div>
          </div>
        )}
      </div>

      {/* Questions by Categories */}
      {showSidebar && (
        <div className="flex-1 overflow-y-auto p-4">
          {questionCategories.map((category, categoryIndex) => {
            const [startQuestion, endQuestion] = category.range;
            const categoryQuestions = questions.filter(q =>
              q.id >= startQuestion && q.id <= endQuestion
            );

            const categoryAnswered = categoryQuestions.filter(q => answers[q.id] !== undefined).length;
            const categoryTotal = categoryQuestions.length;

            const containsCurrentGroup = currentGroupStartIndex < endQuestion &&
                                       (currentGroupStartIndex + 6) > startQuestion;
            const isCurrentCategory = containsCurrentGroup && categoryAnswered > 0;

            return (
              <div key={categoryIndex} className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`text-sm font-semibold ${isCurrentCategory ? 'text-blue-700' : 'text-gray-700'}`}>
                    {category.name}
                  </h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    categoryAnswered === categoryTotal
                      ? 'text-green-700 bg-green-100'
                      : isCurrentCategory
                        ? 'text-blue-700 bg-blue-100'
                        : 'text-gray-500 bg-gray-100'
                  }`}>
                    {categoryAnswered}/{categoryTotal}
                  </span>
                </div>

                <div className="text-xs text-gray-500 mb-2">
                  Preguntas {startQuestion}-{endQuestion}
                </div>

                <div className="space-y-1">
                  {Array.from({ length: Math.ceil(categoryTotal / 6) }, (_, rowIndex) => {
                    const rowStart = rowIndex * 6;
                    const rowEnd = Math.min(rowStart + 6, categoryTotal);
                    const rowQuestions = categoryQuestions.slice(rowStart, rowEnd);

                    return (
                      <div key={rowIndex} className="grid grid-cols-6 gap-1">
                        {rowQuestions.map((question) => {
                          const isAnswered = answers[question.id] !== undefined;
                          const isInCurrentGroup = Math.floor((question.id - 1) / 6) === currentGroup;
                          const hasStartedAnswering = Object.keys(answers).length > 0;
                          
                          const answeredQuestions = Object.keys(answers).map(Number).sort((a, b) => a - b);
                          const lastAnsweredQuestion = answeredQuestions.length > 0 ? Math.max(...answeredQuestions) : 0;
                          const isAvailable = isAnswered || 
                                            (question.id === lastAnsweredQuestion + 1 && lastAnsweredQuestion < questions.length) || 
                                            (answeredQuestions.length === 0 && question.id === 1);

                          return (
                            <button
                              key={question.id}
                              onClick={() => goToQuestion(question.id - 1)}
                              disabled={!isAvailable}
                              className={`
                                w-8 h-8 rounded-lg text-xs font-medium transition-all duration-200
                                ${!isAvailable
                                  ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                                  : isInCurrentGroup && hasStartedAnswering
                                    ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                                    : isAnswered
                                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }
                              `}
                              aria-label={`Pregunta ${question.id}${isAnswered ? ' (respondida)' : ''}${isInCurrentGroup ? ' (grupo actual)' : ''}`}
                            >
                              {question.id}
                            </button>
                          );
                        })}
                        {Array.from({ length: 6 - rowQuestions.length }, (_, emptyIndex) => (
                          <div key={`empty-${emptyIndex}`} className="w-8 h-8"></div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Submit Button */}
      {showSidebar && (
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleSubmit}
            disabled={!allAnswered || isSubmitting}
            className={`
              w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200
              flex items-center justify-center space-x-2
              ${allAnswered && !isSubmitting
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
            aria-label="Enviar cuestionario"
          >
            <Save className="w-5 h-5" />
            <span>
              {isSubmitting ? 'Enviando...' : 'Enviar Cuestionario'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

QuestionSidebar.propTypes = {
  showSidebar: PropTypes.bool.isRequired,
  setShowSidebar: PropTypes.func.isRequired,
  elapsedTime: PropTypes.number.isRequired,
  formatTime: PropTypes.func.isRequired,
  answers: PropTypes.object.isRequired,
  questions: PropTypes.array.isRequired,
  currentGroup: PropTypes.number.isRequired,
  currentGroupStartIndex: PropTypes.number.isRequired,
  goToQuestion: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool.isRequired
};

export default memo(QuestionSidebar);