/**
 * useErrorHandler Hook - BAT-7 Dashboard
 * Hook personalizado para manejo de errores integrado con React
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { handleError, ERROR_TYPES, ERROR_SEVERITY } from '../services/errorService';

/**
 * Hook principal para manejo de errores
 */
export const useErrorHandler = (options = {}) => {
  const [error, setError] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const retryTimeoutRef = useRef(null);

  const {
    showNotification = true,
    autoRetry = true,
    maxRetries = 3,
    onError,
    onRetry,
    onRecovery
  } = options;

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Maneja un error con el servicio centralizado
   */
  const handleErrorWithService = useCallback(async (error, context = {}) => {
    try {
      const errorResult = await handleError(error, {
        ...context,
        component: context.component || 'Unknown',
        operation: context.operation,
        retryKey: context.retryKey || `${context.component}_${Date.now()}`
      });

      setError(errorResult);

      // Callback personalizado
      if (onError) {
        onError(errorResult);
      }

      // Mostrar notificación si está habilitado
      if (showNotification && window.showErrorNotification) {
        window.showErrorNotification(errorResult.message);
      }

      // Intentar recuperación automática
      if (autoRetry && errorResult.recoveryAction && retryCount < maxRetries) {
        await attemptAutoRetry(errorResult.recoveryAction);
      }

      return errorResult;
    } catch (handlingError) {
      console.error('Error in error handler:', handlingError);
      const fallbackError = {
        id: `fallback_${Date.now()}`,
        type: ERROR_TYPES.UNKNOWN,
        severity: ERROR_SEVERITY.HIGH,
        message: 'Error crítico en el sistema de manejo de errores',
        recoverable: false
      };
      setError(fallbackError);
      return fallbackError;
    }
  }, [onError, showNotification, autoRetry, retryCount, maxRetries]);

  /**
   * Intenta recuperación automática
   */
  const attemptAutoRetry = useCallback(async (recoveryAction) => {
    if (!recoveryAction || recoveryAction.type !== 'retry') {
      return;
    }

    setIsRetrying(true);
    setRetryCount(prev => prev + 1);

    if (onRetry) {
      onRetry(recoveryAction.attempt, recoveryAction.maxAttempts);
    }

    try {
      retryTimeoutRef.current = setTimeout(async () => {
        try {
          const result = await recoveryAction.execute();
          
          if (result && !result.type) {
            // Recuperación exitosa
            setError(null);
            setIsRetrying(false);
            setRetryCount(0);
            
            if (onRecovery) {
              onRecovery(result);
            }
          } else {
            // Falló el retry, mantener el error
            setIsRetrying(false);
          }
        } catch (retryError) {
          setIsRetrying(false);
          await handleErrorWithService(retryError);
        }
      }, recoveryAction.delay);
    } catch (retryError) {
      setIsRetrying(false);
      await handleErrorWithService(retryError);
    }
  }, [onRetry, onRecovery, handleErrorWithService]);

  /**
   * Limpia el error actual
   */
  const clearError = useCallback(() => {
    setError(null);
    setIsRetrying(false);
    setRetryCount(0);
    
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  /**
   * Reintenta manualmente la última operación
   */
  const retryManually = useCallback(async () => {
    if (!error?.recoveryAction) {
      return;
    }

    await attemptAutoRetry(error.recoveryAction);
  }, [error, attemptAutoRetry]);

  return {
    error,
    isRetrying,
    retryCount,
    handleError: handleErrorWithService,
    clearError,
    retryManually,
    hasError: !!error,
    canRetry: !!error?.recoveryAction
  };
};

/**
 * Hook para manejo de errores asíncronos
 */
export const useAsyncError = (options = {}) => {
  const { handleError, ...errorState } = useErrorHandler(options);

  /**
   * Wrapper para operaciones asíncronas con manejo de errores
   */
  const executeAsync = useCallback(async (asyncOperation, context = {}) => {
    try {
      const result = await asyncOperation();
      return { data: result, error: null };
    } catch (error) {
      const errorResult = await handleError(error, context);
      return { data: null, error: errorResult };
    }
  }, [handleError]);

  /**
   * Hook para fetch con manejo de errores
   */
  const fetchWithErrorHandling = useCallback(async (url, options = {}, context = {}) => {
    return executeAsync(async () => {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status;
        error.response = response;
        throw error;
      }
      
      return response.json();
    }, {
      ...context,
      operation: () => fetch(url, options),
      retryKey: `fetch_${url}`
    });
  }, [executeAsync]);

  return {
    ...errorState,
    executeAsync,
    fetchWithErrorHandling
  };
};

/**
 * Hook para manejo de errores en formularios
 */
export const useFormErrorHandler = (options = {}) => {
  const [fieldErrors, setFieldErrors] = useState({});
  const { handleError, ...errorState } = useErrorHandler(options);

  /**
   * Maneja errores de validación de campos
   */
  const handleFieldError = useCallback((fieldName, error) => {
    setFieldErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));
  }, []);

  /**
   * Limpia errores de un campo específico
   */
  const clearFieldError = useCallback((fieldName) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  /**
   * Limpia todos los errores de campos
   */
  const clearAllFieldErrors = useCallback(() => {
    setFieldErrors({});
  }, []);

  /**
   * Valida un formulario y maneja errores
   */
  const validateForm = useCallback(async (formData, validationRules) => {
    const errors = {};
    
    for (const [field, rules] of Object.entries(validationRules)) {
      const value = formData[field];
      
      for (const rule of rules) {
        try {
          const isValid = await rule.validator(value, formData);
          if (!isValid) {
            errors[field] = rule.message;
            break;
          }
        } catch (error) {
          errors[field] = 'Error de validación';
          await handleError(error, {
            component: 'FormValidator',
            field,
            value
          });
        }
      }
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [handleError]);

  return {
    ...errorState,
    fieldErrors,
    handleFieldError,
    clearFieldError,
    clearAllFieldErrors,
    validateForm,
    hasFieldErrors: Object.keys(fieldErrors).length > 0
  };
};

/**
 * Hook para manejo de errores con estado de carga
 */
export const useAsyncState = (initialState = null, options = {}) => {
  const [data, setData] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const { executeAsync, ...errorState } = useAsyncError(options);

  /**
   * Ejecuta una operación asíncrona con estado de carga
   */
  const execute = useCallback(async (asyncOperation, context = {}) => {
    setLoading(true);
    
    const result = await executeAsync(asyncOperation, context);
    
    if (result.data !== null) {
      setData(result.data);
    }
    
    setLoading(false);
    return result;
  }, [executeAsync]);

  /**
   * Refresca los datos ejecutando la última operación
   */
  const refresh = useCallback(async (asyncOperation, context = {}) => {
    return execute(asyncOperation, context);
  }, [execute]);

  return {
    data,
    loading,
    execute,
    refresh,
    setData,
    ...errorState
  };
};

export default useErrorHandler;