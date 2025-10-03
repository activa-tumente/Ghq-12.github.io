/**
 * ErrorBoundary Component - BAT-7 Dashboard
 * Componente mejorado para capturar errores de React con integración al servicio centralizado
 */

import React from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle, RefreshCw, Home, Bug, ChevronDown, ChevronUp } from 'lucide-react';
import { handleError, ERROR_TYPES, ERROR_SEVERITY } from '../../services/errorService';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      isRetrying: false,
      showDetails: false,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Actualiza el estado para mostrar la UI de error
    return { hasError: true };
  }

  async componentDidCatch(error, errorInfo) {
    try {
      // Usar el servicio centralizado para manejar el error
      const errorResult = await handleError(error, {
        component: this.props.componentName || 'ErrorBoundary',
        operation: 'render',
        errorInfo,
        retryKey: `boundary_${this.props.componentName || 'unknown'}_${Date.now()}`
      });

      this.setState({
        error: errorResult,
        errorInfo,
        errorId: errorResult.id,
        hasError: true
      });

      // Callback personalizado
      if (this.props.onError) {
        this.props.onError(errorResult, errorInfo);
      }

    } catch (handlingError) {
      console.error('Error in ErrorBoundary:', handlingError);
      
      // Fallback si falla el servicio de errores
      this.setState({
        error: {
          id: `fallback_${Date.now()}`,
          type: ERROR_TYPES.UNKNOWN,
          severity: ERROR_SEVERITY.HIGH,
          message: 'Error crítico en el componente',
          recoverable: true
        },
        errorInfo,
        hasError: true
      });
    }
  }

  handleRetry = async () => {
    const { onRetry, maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount >= maxRetries) {
      return;
    }

    this.setState({ 
      isRetrying: true,
      retryCount: retryCount + 1
    });

    try {
      // Callback de retry personalizado
      if (onRetry) {
        await onRetry();
      }

      // Resetear el estado después de un delay
      setTimeout(() => {
        this.setState({
          hasError: false,
          error: null,
          errorInfo: null,
          errorId: null,
          isRetrying: false,
          showDetails: false
        });
      }, 1000);

    } catch (retryError) {
      console.error('Error during retry:', retryError);
      this.setState({ isRetrying: false });
    }
  };

  handleGoHome = () => {
    if (this.props.onGoHome) {
      this.props.onGoHome();
    } else {
      window.location.href = '/';
    }
  };

  toggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails
    }));
  };

  getSeverityColor = (severity) => {
    switch (severity) {
      case ERROR_SEVERITY.LOW:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case ERROR_SEVERITY.MEDIUM:
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case ERROR_SEVERITY.HIGH:
        return 'text-red-600 bg-red-50 border-red-200';
      case ERROR_SEVERITY.CRITICAL:
        return 'text-red-800 bg-red-100 border-red-300';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  render() {
    const { hasError, error, errorInfo, isRetrying, showDetails, retryCount } = this.state;
    const { 
      fallback, 
      showRetry = true, 
      showGoHome = true, 
      maxRetries = 3,
      className = ''
    } = this.props;

    if (!hasError) {
      return this.props.children;
    }

    // Usar fallback personalizado si se proporciona
    if (fallback) {
      return fallback(error, this.handleRetry, this.handleGoHome);
    }

    const severityColor = this.getSeverityColor(error?.severity);
    const canRetry = showRetry && retryCount < maxRetries && error?.recoverable !== false;

    return (
      <div className={`min-h-screen bg-gray-50 flex items-center justify-center p-4 ${className}`}>
        <div className="max-w-2xl w-full">
          {/* Error Card */}
          <div className={`rounded-lg border-2 p-6 ${severityColor}`}>
            {/* Header */}
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="h-8 w-8 flex-shrink-0" />
              <div>
                <h1 className="text-xl font-bold">
                  {error?.type === ERROR_TYPES.NETWORK 
                    ? 'Error de Conexión'
                    : error?.type === ERROR_TYPES.VALIDATION
                    ? 'Error de Validación'
                    : error?.type === ERROR_TYPES.AUTHENTICATION
                    ? 'Error de Autenticación'
                    : 'Error del Sistema'
                  }
                </h1>
                <p className="text-sm opacity-75">
                  ID del Error: {error?.id || 'N/A'}
                </p>
              </div>
            </div>

            {/* Message */}
            <div className="mb-6">
              <p className="text-base leading-relaxed">
                {error?.message || 'Ha ocurrido un error inesperado en la aplicación.'}
              </p>
              
              {error?.userMessage && error.userMessage !== error.message && (
                <p className="text-sm mt-2 opacity-75">
                  {error.userMessage}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 mb-4">
              {canRetry && (
                <button
                  onClick={this.handleRetry}
                  disabled={isRetrying}
                  className="inline-flex items-center px-4 py-2 bg-white border border-current rounded-md hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
                  {isRetrying ? 'Reintentando...' : `Reintentar (${retryCount}/${maxRetries})`}
                </button>
              )}

              {showGoHome && (
                <button
                  onClick={this.handleGoHome}
                  className="inline-flex items-center px-4 py-2 bg-white border border-current rounded-md hover:bg-opacity-90 transition-colors"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Ir al Inicio
                </button>
              )}

              <button
                onClick={this.toggleDetails}
                className="inline-flex items-center px-4 py-2 bg-white border border-current rounded-md hover:bg-opacity-90 transition-colors"
              >
                <Bug className="h-4 w-4 mr-2" />
                Detalles Técnicos
                {showDetails ? (
                  <ChevronUp className="h-4 w-4 ml-2" />
                ) : (
                  <ChevronDown className="h-4 w-4 ml-2" />
                )}
              </button>
            </div>

            {/* Technical Details */}
            {showDetails && (
              <div className="border-t border-current border-opacity-20 pt-4">
                <h3 className="font-semibold mb-2">Información Técnica:</h3>
                
                <div className="space-y-3 text-sm font-mono">
                  {error?.originalError && (
                    <div>
                      <strong>Error Original:</strong>
                      <pre className="mt-1 p-2 bg-black bg-opacity-10 rounded text-xs overflow-x-auto">
                        {error.originalError.toString()}
                      </pre>
                    </div>
                  )}

                  {error?.stack && (
                    <div>
                      <strong>Stack Trace:</strong>
                      <pre className="mt-1 p-2 bg-black bg-opacity-10 rounded text-xs overflow-x-auto max-h-40 overflow-y-auto">
                        {error.stack}
                      </pre>
                    </div>
                  )}

                  {errorInfo?.componentStack && (
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="mt-1 p-2 bg-black bg-opacity-10 rounded text-xs overflow-x-auto max-h-40 overflow-y-auto">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}

                  {error?.context && (
                    <div>
                      <strong>Contexto:</strong>
                      <pre className="mt-1 p-2 bg-black bg-opacity-10 rounded text-xs overflow-x-auto">
                        {JSON.stringify(error.context, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Help Text */}
          <div className="mt-6 text-center text-gray-600 text-sm">
            <p>
              Si el problema persiste, por favor contacta al administrador del sistema
              con el ID del error: <code className="bg-gray-200 px-2 py-1 rounded">{error?.id}</code>
            </p>
          </div>
        </div>
      </div>
    );
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  componentName: PropTypes.string,
  fallback: PropTypes.func,
  onError: PropTypes.func,
  onRetry: PropTypes.func,
  onGoHome: PropTypes.func,
  showRetry: PropTypes.bool,
  showGoHome: PropTypes.bool,
  maxRetries: PropTypes.number,
  className: PropTypes.string
};

export default ErrorBoundary;

/**
 * HOC para envolver componentes con ErrorBoundary
 */
export const withErrorBoundary = (Component, errorBoundaryProps = {}) => {
  const WrappedComponent = React.forwardRef((props, ref) => (
    <ErrorBoundary 
      componentName={Component.displayName || Component.name}
      {...errorBoundaryProps}
    >
      <Component {...props} ref={ref} />
    </ErrorBoundary>
  ));

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

/**
 * Hook para usar ErrorBoundary programáticamente
 */
export const useErrorBoundary = () => {
  const [error, setError] = React.useState(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError };
};