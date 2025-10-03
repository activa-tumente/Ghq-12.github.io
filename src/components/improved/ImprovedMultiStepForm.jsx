// Componente MultiStepForm mejorado con mejores prácticas de React

import React, { useState, useCallback, useMemo, useReducer, useEffect, Suspense, lazy } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useValidation } from '../../utils/ValidationStrategy.js';
import { useNotifications } from '../../patterns/ObserverPattern.js';
import { useCommandInvoker } from '../../patterns/CommandPattern.js';
import { withErrorHandling, withLoading, withMemoization } from '../../patterns/ComponentDecorators.jsx';

// Lazy loading de componentes pesados
const ProgressIndicator = lazy(() => import('./ProgressIndicator'));
const FormStep = lazy(() => import('./FormStep'));
const NavigationButtons = lazy(() => import('./NavigationButtons'));
const FormSummary = lazy(() => import('./FormSummary'));

// Reducer para gestión de estado del formulario
const formReducer = (state, action) => {
  switch (action.type) {
    case 'SET_STEP':
      return {
        ...state,
        currentStep: action.payload,
        errors: {} // Limpiar errores al cambiar de paso
      };
    
    case 'UPDATE_DATA':
      return {
        ...state,
        formData: {
          ...state.formData,
          ...action.payload
        }
      };
    
    case 'SET_ERRORS':
      return {
        ...state,
        errors: action.payload
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };
    
    case 'SET_SUBMITTED':
      return {
        ...state,
        isSubmitted: action.payload,
        isLoading: false
      };
    
    case 'RESET_FORM':
      return {
        ...action.payload // Estado inicial
      };
    
    default:
      return state;
  }
};

// Estado inicial del formulario
const createInitialState = (initialData = {}) => ({
  currentStep: 0,
  formData: {
    // Información personal
    nombre: '',
    apellido: '',
    documento: '',
    area: '',
    turno: '',
    genero: '',
    // Respuestas del cuestionario
    respuestas: {},
    ...initialData
  },
  errors: {},
  isLoading: false,
  isSubmitted: false
});

// Configuración de pasos del formulario
const FORM_STEPS = [
  {
    id: 'personal-info',
    title: 'Información Personal',
    description: 'Datos básicos del participante',
    fields: ['nombre', 'apellido', 'documento', 'area', 'turno', 'genero'],
    validation: 'user'
  },
  {
    id: 'questionnaire',
    title: 'Cuestionario de Salud General (GHQ-12)',
    description: 'Evaluación de salud general y bienestar psicológico',
    fields: ['respuestas'],
    validation: 'questionnaire'
  },
  {
    id: 'review',
    title: 'Revisión',
    description: 'Verificar información antes de enviar',
    fields: [],
    validation: null
  }
];

// Hook personalizado para gestión del formulario
const useMultiStepForm = (initialData, onSubmit) => {
  const [state, dispatch] = useReducer(formReducer, createInitialState(initialData));
  const { validateStep } = useValidation();
  const { notify } = useNotifications();
  const { executeCommand } = useCommandInvoker();

  // Navegación entre pasos
  const goToStep = useCallback((stepIndex) => {
    if (stepIndex >= 0 && stepIndex < FORM_STEPS.length) {
      dispatch({ type: 'SET_STEP', payload: stepIndex });
    }
  }, []);

  const nextStep = useCallback(async () => {
    const currentStepConfig = FORM_STEPS[state.currentStep];
    
    // Validar paso actual antes de continuar
    if (currentStepConfig.validation) {
      const validation = validateStep(
        currentStepConfig.validation,
        state.formData,
        currentStepConfig.fields
      );
      
      if (!validation.isValid) {
        dispatch({ type: 'SET_ERRORS', payload: validation.errors });
        notify('Por favor corrige los errores antes de continuar', 'warning');
        return false;
      }
    }

    if (state.currentStep < FORM_STEPS.length - 1) {
      goToStep(state.currentStep + 1);
      return true;
    }
    
    return false;
  }, [state.currentStep, state.formData, validateStep, notify, goToStep]);

  const prevStep = useCallback(() => {
    if (state.currentStep > 0) {
      goToStep(state.currentStep - 1);
    }
  }, [state.currentStep, goToStep]);

  // Actualización de datos del formulario
  const updateFormData = useCallback((data) => {
    // Usar comando para permitir undo/redo
    const updateCommand = {
      execute: () => dispatch({ type: 'UPDATE_DATA', payload: data }),
      undo: () => {
        // Implementar lógica de undo si es necesario
      },
      type: 'UPDATE_FORM_DATA',
      data
    };
    
    executeCommand(updateCommand);
  }, [executeCommand]);

  // Envío del formulario
  const submitForm = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Validación final de todos los datos
      const finalValidation = validateStep('questionnaire', state.formData);
      
      if (!finalValidation.isValid) {
        dispatch({ type: 'SET_ERRORS', payload: finalValidation.errors });
        notify('Hay errores en el formulario. Por favor revísalos.', 'error');
        return false;
      }

      // Ejecutar callback de envío
      const result = await onSubmit(state.formData);
      
      if (result.success) {
        dispatch({ type: 'SET_SUBMITTED', payload: true });
        notify('Formulario enviado exitosamente', 'success');
        return true;
      } else {
        throw new Error(result.error || 'Error al enviar formulario');
      }
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      notify(`Error al enviar formulario: ${error.message}`, 'error');
      return false;
    }
  }, [state.formData, onSubmit, validateStep, notify]);

  // Resetear formulario
  const resetForm = useCallback(() => {
    dispatch({ type: 'RESET_FORM', payload: createInitialState(initialData) });
    notify('Formulario reiniciado', 'info');
  }, [initialData, notify]);

  return {
    ...state,
    currentStepConfig: FORM_STEPS[state.currentStep],
    totalSteps: FORM_STEPS.length,
    isFirstStep: state.currentStep === 0,
    isLastStep: state.currentStep === FORM_STEPS.length - 1,
    goToStep,
    nextStep,
    prevStep,
    updateFormData,
    submitForm,
    resetForm
  };
};

// Componente de indicador de progreso
const ProgressIndicator = React.memo(({ currentStep, totalSteps, steps }) => {
  const progressPercentage = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`flex items-center ${
              index < steps.length - 1 ? 'flex-1' : ''
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                index <= currentStep
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {index + 1}
            </div>
            <div className="ml-2 hidden sm:block">
              <div className={`text-sm font-medium ${
                index <= currentStep ? 'text-blue-600' : 'text-gray-500'
              }`}>
                {step.title}
              </div>
              <div className="text-xs text-gray-500">
                {step.description}
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-4 ${
                index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      
      <div className="text-center mt-2 text-sm text-gray-600">
        Paso {currentStep + 1} de {totalSteps}
      </div>
    </div>
  );
});

ProgressIndicator.displayName = 'ProgressIndicator';

// Componente de paso del formulario
const FormStep = React.memo(({ stepConfig, formData, errors, onUpdateData, children }) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {stepConfig.title}
        </h2>
        <p className="text-gray-600">
          {stepConfig.description}
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border p-6">
        {children}
      </div>
      
      {Object.keys(errors).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium mb-2">Errores encontrados:</h3>
          <ul className="text-red-700 text-sm space-y-1">
            {Object.entries(errors).map(([field, error]) => (
              <li key={field}>• {typeof error === 'string' ? error : error?.message || 'Error de validación'}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
});

FormStep.displayName = 'FormStep';

// Componente de botones de navegación
const NavigationButtons = React.memo(({ 
  isFirstStep, 
  isLastStep, 
  isLoading, 
  onPrevStep, 
  onNextStep, 
  onSubmit 
}) => {
  return (
    <div className="flex justify-between items-center pt-6 border-t">
      <button
        type="button"
        onClick={onPrevStep}
        disabled={isFirstStep || isLoading}
        className={`px-6 py-2 rounded-lg font-medium transition-colors ${
          isFirstStep || isLoading
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        Anterior
      </button>
      
      <div className="flex space-x-3">
        {isLastStep ? (
          <button
            type="button"
            onClick={onSubmit}
            disabled={isLoading}
            className={`px-8 py-2 rounded-lg font-medium transition-colors ${
              isLoading
                ? 'bg-blue-400 text-white cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Enviando...
              </span>
            ) : (
              'Enviar Formulario'
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={onNextStep}
            disabled={isLoading}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              isLoading
                ? 'bg-blue-400 text-white cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Siguiente
          </button>
        )}
      </div>
    </div>
  );
});

NavigationButtons.displayName = 'NavigationButtons';

// Componente de resumen del formulario
const FormSummary = React.memo(({ formData }) => {
  const summaryData = useMemo(() => {
    return {
      'Información Personal': {
        'Nombre': `${formData.nombre} ${formData.apellido}`,
        'Documento': formData.documento,
        'Área': formData.area,
        'Turno': formData.turno,
        'Género': formData.genero
      },
      'Respuestas del Cuestionario': {
        'Total de respuestas': Object.keys(formData.respuestas || {}).length,
        'Promedio de puntuación': Object.values(formData.respuestas || {})
          .reduce((sum, val) => sum + val, 0) / Object.keys(formData.respuestas || {}).length || 0
      }
    };
  }, [formData]);

  return (
    <div className="space-y-6">
      {Object.entries(summaryData).map(([section, data]) => (
        <div key={section} className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3">{section}</h3>
          <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {Object.entries(data).map(([key, value]) => (
              <div key={key}>
                <dt className="text-sm font-medium text-gray-500">{key}:</dt>
                <dd className="text-sm text-gray-900">
                  {typeof value === 'number' ? value.toFixed(2) : value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
});

FormSummary.displayName = 'FormSummary';

// Componente de manejo de errores
const ErrorFallback = ({ error, resetErrorBoundary }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
          Algo salió mal
        </h2>
        <p className="text-gray-600 text-center mb-4">
          Ha ocurrido un error inesperado. Por favor, intenta nuevamente.
        </p>
        <details className="mb-4">
          <summary className="text-sm text-gray-500 cursor-pointer">Detalles del error</summary>
          <pre className="text-xs text-red-600 mt-2 p-2 bg-red-50 rounded overflow-auto">
            {error.message}
          </pre>
        </details>
        <button
          onClick={resetErrorBoundary}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Intentar nuevamente
        </button>
      </div>
    </div>
  );
};

// Componente principal mejorado
const ImprovedMultiStepForm = React.memo(({ 
  initialData = {}, 
  onSubmit, 
  onStepChange,
  className = '',
  ...props 
}) => {
  const formState = useMultiStepForm(initialData, onSubmit);
  
  // Notificar cambios de paso al componente padre
  useEffect(() => {
    if (onStepChange) {
      onStepChange(formState.currentStep, formState.currentStepConfig);
    }
  }, [formState.currentStep, formState.currentStepConfig, onStepChange]);

  // Renderizado condicional del contenido del paso
  const renderStepContent = useCallback(() => {
    switch (formState.currentStepConfig.id) {
      case 'personal-info':
        return (
          <PersonalInfoStep 
            formData={formState.formData}
            errors={formState.errors}
            onUpdateData={formState.updateFormData}
          />
        );
      
      case 'questionnaire':
        return (
          <QuestionnaireStep 
            formData={formState.formData}
            errors={formState.errors}
            onUpdateData={formState.updateFormData}
          />
        );
      
      case 'review':
        return <FormSummary formData={formState.formData} />;
      
      default:
        return <div>Paso no encontrado</div>;
    }
  }, [formState.currentStepConfig.id, formState.formData, formState.errors, formState.updateFormData]);

  if (formState.isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            ¡Formulario Enviado!
          </h2>
          <p className="text-gray-600 mb-6">
            Tu cuestionario ha sido enviado exitosamente. Gracias por tu participación.
          </p>
          <button
            onClick={formState.resetForm}
            className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Enviar Otro Formulario
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className={`min-h-screen bg-gray-50 py-8 ${className}`} {...props}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Suspense fallback={
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          }>
            <ProgressIndicator
              currentStep={formState.currentStep}
              totalSteps={formState.totalSteps}
              steps={FORM_STEPS}
            />
            
            <FormStep
              stepConfig={formState.currentStepConfig}
              formData={formState.formData}
              errors={formState.errors}
              onUpdateData={formState.updateFormData}
            >
              {renderStepContent()}
            </FormStep>
            
            <NavigationButtons
              isFirstStep={formState.isFirstStep}
              isLastStep={formState.isLastStep}
              isLoading={formState.isLoading}
              onPrevStep={formState.prevStep}
              onNextStep={formState.nextStep}
              onSubmit={formState.submitForm}
            />
          </Suspense>
        </div>
      </div>
    </ErrorBoundary>
  );
});

ImprovedMultiStepForm.displayName = 'ImprovedMultiStepForm';

// Componentes de pasos específicos (placeholders - deberían implementarse por separado)
const PersonalInfoStep = React.memo(({ formData, errors, onUpdateData }) => {
  // Implementación del paso de información personal
  return (
    <div className="space-y-4">
      <p className="text-gray-600">Componente de información personal aquí...</p>
      {/* Implementar campos del formulario */}
    </div>
  );
});

const QuestionnaireStep = React.memo(({ formData, errors, onUpdateData }) => {
  // Implementación del paso del cuestionario
  return (
    <div className="space-y-4">
      <p className="text-gray-600">Componente del cuestionario aquí...</p>
      {/* Implementar preguntas del cuestionario */}
    </div>
  );
});

// Aplicar decoradores para funcionalidades adicionales
const EnhancedMultiStepForm = withErrorHandling(
  withLoading(
    withMemoization(ImprovedMultiStepForm)
  )
);

export default EnhancedMultiStepForm;
export {
  ImprovedMultiStepForm,
  useMultiStepForm,
  FORM_STEPS,
  ProgressIndicator,
  FormStep,
  NavigationButtons,
  FormSummary
};