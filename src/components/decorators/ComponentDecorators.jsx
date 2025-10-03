import React, { memo, useState, useEffect, useCallback, useMemo } from 'react';
import { AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';

// Decorator base
const createDecorator = (DecoratorComponent) => {
  return (WrappedComponent) => {
    const DecoratedComponent = (props) => (
      <DecoratorComponent {...props}>
        <WrappedComponent {...props} />
      </DecoratorComponent>
    );
    
    DecoratedComponent.displayName = `${DecoratorComponent.name}(${WrappedComponent.displayName || WrappedComponent.name})`;
    return DecoratedComponent;
  };
};

// Decorator para manejo de loading
const withLoading = (loadingComponent) => {
  const LoadingDecorator = ({ loading, children, ...props }) => {
    if (loading) {
      return loadingComponent || (
        <div className="flex items-center justify-center p-8">
          <div className="flex items-center gap-3 text-gray-600">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Cargando...</span>
          </div>
        </div>
      );
    }
    return children;
  };
  
  return createDecorator(LoadingDecorator);
};

// Decorator para manejo de errores
const withErrorBoundary = (errorComponent) => {
  const ErrorDecorator = ({ error, onRetry, children, ...props }) => {
    if (error) {
      return errorComponent ? (
        errorComponent({ error, onRetry, ...props })
      ) : (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-3 text-red-800 mb-4">
            <AlertTriangle className="w-6 h-6" />
            <h3 className="text-lg font-semibold">Error</h3>
          </div>
          <p className="text-red-700 mb-4">
            {error?.message || 'Ha ocurrido un error inesperado'}
          </p>
          {onRetry && (
            <button 
              onClick={onRetry}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reintentar
            </button>
          )}
        </div>
      );
    }
    return children;
  };
  
  return createDecorator(ErrorDecorator);
};

// Decorator para memoización automática
const withMemo = (areEqual) => {
  return (WrappedComponent) => {
    const MemoizedComponent = memo(WrappedComponent, areEqual);
    MemoizedComponent.displayName = `Memo(${WrappedComponent.displayName || WrappedComponent.name})`;
    return MemoizedComponent;
  };
};

// Decorator para lazy loading
const withLazyLoading = (importFn, fallback) => {
  const LazyComponent = React.lazy(importFn);
  
  return (props) => (
    <React.Suspense fallback={fallback || <div>Cargando...</div>}>
      <LazyComponent {...props} />
    </React.Suspense>
  );
};

// Decorator para analytics/tracking
const withAnalytics = (trackingConfig) => {
  const AnalyticsDecorator = ({ children, ...props }) => {
    useEffect(() => {
      if (trackingConfig.onMount && typeof trackingConfig.onMount === 'function') {
        trackingConfig.onMount(props);
      }
    }, []);

    useEffect(() => {
      return () => {
        if (trackingConfig.onUnmount && typeof trackingConfig.onUnmount === 'function') {
          trackingConfig.onUnmount(props);
        }
      };
    }, []);

    return children;
  };
  
  return createDecorator(AnalyticsDecorator);
};

// Decorator para validación de props
const withPropValidation = (validator) => {
  const ValidationDecorator = ({ children, ...props }) => {
    const validationResult = useMemo(() => {
      if (typeof validator === 'function') {
        return validator(props);
      }
      return { isValid: true, errors: [] };
    }, [props]);

    if (!validationResult.isValid) {
      console.warn('Validación de props falló:', validationResult.errors);
      
      if (process.env.NODE_ENV === 'development') {
        return (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-yellow-800 mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-semibold">Advertencia de Validación</span>
            </div>
            <ul className="text-yellow-700 text-sm">
              {validationResult.errors.map((error, index) => (
                <li key={index}>• {typeof error === 'string' ? error : error?.message || 'Error de validación'}</li>
              ))}
            </ul>
          </div>
        );
      }
    }

    return children;
  };
  
  return createDecorator(ValidationDecorator);
};

// Decorator para retry automático
const withRetry = (maxRetries = 3, retryDelay = 1000) => {
  const RetryDecorator = ({ onRetry, error, children, ...props }) => {
    const [retryCount, setRetryCount] = useState(0);
    const [isRetrying, setIsRetrying] = useState(false);

    const handleRetry = useCallback(async () => {
      if (retryCount < maxRetries && onRetry) {
        setIsRetrying(true);
        setRetryCount(prev => prev + 1);
        
        try {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          await onRetry();
        } catch (error) {
          console.error('Error en retry:', error);
        } finally {
          setIsRetrying(false);
        }
      }
    }, [retryCount, onRetry]);

    // Auto-retry en caso de error
    useEffect(() => {
      if (error && retryCount < maxRetries && onRetry) {
        const timer = setTimeout(handleRetry, retryDelay);
        return () => clearTimeout(timer);
      }
    }, [error, retryCount, handleRetry]);

    if (error && retryCount >= maxRetries) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-3 text-red-800 mb-4">
            <AlertTriangle className="w-6 h-6" />
            <h3 className="text-lg font-semibold">Error Persistente</h3>
          </div>
          <p className="text-red-700 mb-4">
            No se pudo completar la operación después de {maxRetries} intentos.
          </p>
          <p className="text-red-600 text-sm">
            {error?.message || 'Error desconocido'}
          </p>
        </div>
      );
    }

    if (isRetrying) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="flex items-center gap-3 text-blue-600">
            <RefreshCw className="w-6 h-6 animate-spin" />
            <span>Reintentando... ({retryCount}/{maxRetries})</span>
          </div>
        </div>
      );
    }

    return children;
  };
  
  return createDecorator(RetryDecorator);
};

// Decorator para timeout
const withTimeout = (timeoutMs = 10000, timeoutComponent) => {
  const TimeoutDecorator = ({ children, ...props }) => {
    const [hasTimedOut, setHasTimedOut] = useState(false);

    useEffect(() => {
      const timer = setTimeout(() => {
        setHasTimedOut(true);
      }, timeoutMs);

      return () => clearTimeout(timer);
    }, []);

    if (hasTimedOut) {
      return timeoutComponent || (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center gap-3 text-yellow-800 mb-4">
            <AlertTriangle className="w-6 h-6" />
            <h3 className="text-lg font-semibold">Tiempo de Espera Agotado</h3>
          </div>
          <p className="text-yellow-700">
            La operación ha tardado más de lo esperado.
          </p>
        </div>
      );
    }

    return children;
  };
  
  return createDecorator(TimeoutDecorator);
};

// Decorator para accesibilidad
const withAccessibility = (a11yConfig = {}) => {
  const AccessibilityDecorator = ({ children, ...props }) => {
    const {
      role,
      ariaLabel,
      ariaDescribedBy,
      tabIndex,
      focusOnMount = false,
      announceChanges = false
    } = a11yConfig;

    const ref = React.useRef(null);
    const [announcement, setAnnouncement] = useState('');

    useEffect(() => {
      if (focusOnMount && ref.current) {
        ref.current.focus();
      }
    }, [focusOnMount]);

    useEffect(() => {
      if (announceChanges && props.children !== children) {
        setAnnouncement('Contenido actualizado');
        const timer = setTimeout(() => setAnnouncement(''), 1000);
        return () => clearTimeout(timer);
      }
    }, [children, announceChanges]);

    return (
      <div
        ref={ref}
        role={role}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        tabIndex={tabIndex}
      >
        {children}
        {announcement && (
          <div 
            aria-live="polite" 
            aria-atomic="true" 
            className="sr-only"
          >
            {announcement}
          </div>
        )}
      </div>
    );
  };
  
  return createDecorator(AccessibilityDecorator);
};

// Decorator compuesto para casos comunes
const withCommonDecorators = (config = {}) => {
  const {
    loading = false,
    error = null,
    onRetry = null,
    memoize = true,
    analytics = null,
    accessibility = null,
    retry = null
  } = config;

  return (WrappedComponent) => {
    let DecoratedComponent = WrappedComponent;

    // Aplicar decorators en orden
    if (memoize) {
      DecoratedComponent = withMemo()(DecoratedComponent);
    }

    if (accessibility) {
      DecoratedComponent = withAccessibility(accessibility)(DecoratedComponent);
    }

    if (retry) {
      DecoratedComponent = withRetry(retry.maxRetries, retry.retryDelay)(DecoratedComponent);
    }

    if (analytics) {
      DecoratedComponent = withAnalytics(analytics)(DecoratedComponent);
    }

    DecoratedComponent = withErrorBoundary()(DecoratedComponent);
    DecoratedComponent = withLoading()(DecoratedComponent);

    return DecoratedComponent;
  };
};

// HOC para combinar múltiples decorators
const compose = (...decorators) => {
  return (WrappedComponent) => {
    return decorators.reduceRight((acc, decorator) => {
      return decorator(acc);
    }, WrappedComponent);
  };
};

// Hook para usar decorators dinámicamente
export const useDecorators = () => {
  const applyDecorators = useCallback((component, decorators) => {
    return decorators.reduce((acc, decorator) => {
      return decorator(acc);
    }, component);
  }, []);

  return { applyDecorators, compose };
};

// Ejemplos de uso predefinidos
export const withDashboardDecorators = withCommonDecorators({
  memoize: true,
  analytics: {
    onMount: (props) => console.log('Dashboard mounted', props),
    onUnmount: (props) => console.log('Dashboard unmounted', props)
  },
  accessibility: {
    role: 'main',
    ariaLabel: 'Panel de control principal'
  }
});

export const withFormDecorators = withCommonDecorators({
  memoize: true,
  accessibility: {
    role: 'form',
    announceChanges: true
  },
  retry: {
    maxRetries: 2,
    retryDelay: 1500
  }
});

export const withChartDecorators = withCommonDecorators({
  memoize: true,
  accessibility: {
    role: 'img',
    ariaLabel: 'Gráfico de datos'
  }
});

export {
  createDecorator,
  withLoading,
  withErrorBoundary,
  withMemo,
  withLazyLoading,
  withAnalytics,
  withPropValidation,
  withRetry,
  withTimeout,
  withAccessibility,
  withCommonDecorators,
  compose
};

export default {
  withLoading,
  withErrorBoundary,
  withMemo,
  withLazyLoading,
  withAnalytics,
  withPropValidation,
  withRetry,
  withTimeout,
  withAccessibility,
  withCommonDecorators,
  compose
};