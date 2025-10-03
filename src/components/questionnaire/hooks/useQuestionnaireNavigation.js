import { useState, useCallback, useMemo } from 'react';

export const useQuestionnaireNavigation = (questions, questionsPerGroup = 6) => {
  const [currentGroup, setCurrentGroup] = useState(0);
  
  const totalGroups = Math.ceil(questions.length / questionsPerGroup);
  const currentGroupStartIndex = currentGroup * questionsPerGroup;
  const currentGroupEndIndex = Math.min(currentGroupStartIndex + questionsPerGroup, questions.length);
  const currentGroupQuestions = questions.slice(currentGroupStartIndex, currentGroupEndIndex);

  const goToNextGroup = useCallback(() => {
    setCurrentGroup(prev => prev < totalGroups - 1 ? prev + 1 : prev);
  }, [totalGroups]);

  const goToPreviousGroup = useCallback(() => {
    setCurrentGroup(prev => prev > 0 ? prev - 1 : prev);
  }, []);

  const goToQuestion = useCallback((index) => {
    const targetGroup = Math.floor(index / questionsPerGroup);
    setCurrentGroup(targetGroup);
  }, [questionsPerGroup]);

  return {
    currentGroup,
    totalGroups,
    currentGroupStartIndex,
    currentGroupEndIndex,
    currentGroupQuestions,
    goToNextGroup,
    goToPreviousGroup,
    goToQuestion,
    setCurrentGroup
  };
};