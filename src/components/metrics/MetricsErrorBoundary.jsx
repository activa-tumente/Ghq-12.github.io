import React from 'react';
import { AlertTriangle, RefreshCw, TrendingDown } from 'lucide-react';
import { logError } from '../../utils/errorHandling';

class MetricsErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });
    
    // Log error with context
    logError(error, { 
      component: 'MetricsErrorBoundary',
      errorInfo,
      retryCount: this.state.retryCount
    });
  }

  handleRetry = () => {
    this.setState(prevState => ({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback, pageType } = this.props;
      
      // Use custom fallback if provided
      if (Fallback) {
        return (
          <Fallback 
            error={this.state.error}
            onRetry={this.handleRetry}
            retryCount={this.state.retryCount}
          />
        );
      }

      // Default metrics error UI
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <TrendingDown className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">
            Error en las Métricas {pageType ? `de ${pageType}` : ''}
          </h3>
          <p className="text-red-700 mb-4">
            No se pudieron cargar las métricas. Esto puede deberse a un problema temporal.
          </p>
          <div className="space-y-3">
            <button
              onClick={this.handleRetry}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2 mx-auto"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Reintentar ({this.state.retryCount + 1})</span>
            </button>
            {this.state.retryCount > 2 && (
              <p className="text-sm text-red-600">
                Si el problema persiste, contacta al administrador del sistema.
              </p>
            )}
          </div>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-red-600">
                Detalles del error (desarrollo)
              </summary>
              <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto text-red-800">
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default MetricsErrorBoundary;