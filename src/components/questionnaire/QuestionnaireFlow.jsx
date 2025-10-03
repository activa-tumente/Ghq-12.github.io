import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { markTokenAsUsed } from '../../utils/tokenUtils';
import { useTokenValidation } from '../../hooks/useTokenValidation';
import { useUserManagement } from '../../hooks/useUserManagement';
import { useToast } from '../../hooks/useToast';
import {
  LoadingStep,
  InvalidTokenStep,
  FormStep,
  QuestionnaireStep
} from './QuestionnaireFlowSteps';

const QuestionnaireFlow = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState('form');
  const [personData, setPersonData] = useState(null);

  // Custom hooks
  const { tokenValid, isValidating, isDirectAccess } = useTokenValidation(token);
  const { processFormData, isProcessing } = useUserManagement();
  const { success: showSuccess, error: showError } = useToast();

  // Determine current step based on token validation
  const getCurrentStep = () => {
    if (isValidating) return 'loading';
    if (tokenValid === false) return 'invalid_token';
    return currentStep;
  };

  const handleFormComplete = async (formData) => {
    if (isProcessing) return;

    console.log('Procesando datos del formulario:', { ...formData, documento: '***REDACTED***' });

    const userData = await processFormData(formData);
    if (!userData) return; // User cancelled or error occurred

    // Validate user data
    if (!userData.id) {
      showError('Error: No se pudo obtener un ID válido para el registro. Por favor intente nuevamente.');
      return;
    }

    // Mark token as used if applicable
    if (token && tokenValid) {
      console.log('🔗 Marcando token como usado...');
      const success = await markTokenAsUsed(token, userData.id);
      if (success) {
        console.log('✅ Token marcado como usado correctamente');
      } else {
        console.error('Error marcando token como usado');
        // Don't block the flow, just log
      }
    }

    console.log('Avanzando al cuestionario con ID de persona:', userData.id);
    setPersonData(userData);
    setCurrentStep('questionnaire');
  };

  const handleQuestionnaireComplete = async (questionnaireData) => {
    try {
      if (isDirectAccess) {
        const minutes = Math.floor(questionnaireData.completionTime / 60);
        const seconds = questionnaireData.completionTime % 60;
        showSuccess(`Evaluación completada exitosamente en ${minutes} minutos y ${seconds} segundos. ¡Gracias por completar la evaluación!`);
        navigate('/cuestionarios');
      } else {
        navigate('/gracias');
      }
    } catch (error) {
      console.error('Error completing questionnaire:', error);
      showError('Error al finalizar la evaluación. Por favor intente nuevamente.');
    }
  };

  const handleBackToForm = () => {
    setCurrentStep('form');
    setPersonData(null);
  };

  const step = getCurrentStep();

  switch (step) {
    case 'loading':
      return <LoadingStep />;

    case 'invalid_token':
      return <InvalidTokenStep />;

    case 'form':
      return <FormStep onComplete={handleFormComplete} />;

    case 'questionnaire':
      return (
        <QuestionnaireStep
          personData={personData}
          onComplete={handleQuestionnaireComplete}
          token={token}
          tokenValid={tokenValid}
          isDirectAccess={isDirectAccess}
          onBackToForm={handleBackToForm}
        />
      );

    default:
      return null;
  }
};

export default QuestionnaireFlow;