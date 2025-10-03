import PropTypes from 'prop-types';

// PropTypes definitions for Questionnaire components
export const QuestionnaireProps = {
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

export const QuestionSidebarProps = {
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

export const QuestionHeaderProps = {
  isDirectAccess: PropTypes.bool.isRequired,
  currentGroup: PropTypes.number.isRequired,
  totalGroups: PropTypes.number.isRequired,
  currentGroupStartIndex: PropTypes.number.isRequired,
  currentGroupEndIndex: PropTypes.number.isRequired,
  currentGroupAnswered: PropTypes.number.isRequired,
  currentGroupTotal: PropTypes.number.isRequired,
  elapsedTime: PropTypes.number.isRequired,
  formatTime: PropTypes.func.isRequired
};

export const QuestionGroupContentProps = {
  currentGroupQuestions: PropTypes.array.isRequired,
  currentGroup: PropTypes.number.isRequired,
  answers: PropTypes.object.isRequired,
  handleAnswer: PropTypes.func.isRequired,
  goToPreviousGroup: PropTypes.func.isRequired,
  goToNextGroup: PropTypes.func.isRequired,
  totalGroups: PropTypes.number.isRequired,
  isCurrentGroupComplete: PropTypes.bool.isRequired,
  currentGroupStartIndex: PropTypes.number.isRequired
};