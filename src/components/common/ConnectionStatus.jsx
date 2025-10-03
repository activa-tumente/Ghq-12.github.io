// =====================================================
// COMPONENTE DE ESTADO DE CONEXIÓN CON SUPABASE
// =====================================================

import React, { useState } from 'react';
import { SUPABASE_ERROR_TYPES } from '../../lib/supabaseErrorHandler';

const ConnectionStatus = ({ 
  connectionStatus, 
  error, 
  isUsingMockData, 
  onRetry,
  onClearCache,
  className = '',
  showDetails = false 
}) => {
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  // Configuración de estados visuales
  const statusConfig = {
    connected: {
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      icon: '🟢',
      label: 'Conectado',
      description: 'Conexión estable con la base de datos'
    },
    disconnected: {
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      icon: '🔴',
      label: 'Desconectado',
      description: 'Sin conexión con la base de datos'
    },
    checking: {
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      icon: '🟡',
      label: 'Verificando...',
      description: 'Verificando estado de conexión'
    }
  };

  const currentStatus = statusConfig[connectionStatus] || statusConfig.checking;

  // Función para obtener mensaje de error amigable
  const getErrorMessage = (error) => {
    if (!error) return null;

    const errorMessages = {
      [SUPABASE_ERROR_TYPES.CONNECTION]: 'Problema de red o conectividad',
      [SUPABASE_ERROR_TYPES.AUTHENTICATION]: 'Error de autenticación',
      [SUPABASE_ERROR_TYPES.PERMISSION]: 'Permisos insuficientes',
      [SUPABASE_ERROR_TYPES.NOT_FOUND]: 'Recurso no encontrado',
      [SUPABASE_ERROR_TYPES.VALIDATION]: 'Error de validación de datos',
      [SUPABASE_ERROR_TYPES.RATE_LIMIT]: 'Límite de solicitudes excedido',
      [SUPABASE_ERROR_TYPES.SERVER]: 'Error interno del servidor',
      [SUPABASE_ERROR_TYPES.UNKNOWN]: 'Error desconocido'
    };

    return errorMessages[error.type] || error.message;
  };

  return (
    <div className={`${className}`}>
      {/* Indicador principal */}
      <div className={`
        flex items-center gap-2 px-3 py-2 rounded-lg border
        ${currentStatus.bgColor} ${currentStatus.borderColor}
        transition-all duration-200
      `}>
        <span className="text-sm">{currentStatus.icon}</span>
        <div className="flex-1 min-w-0">
          <div className={`font-medium text-sm ${currentStatus.color}`}>
            {currentStatus.label}
          </div>
          {showDetails && (
            <div className="text-xs text-gray-600 mt-1">
              {currentStatus.description}
            </div>
          )}
        </div>

        {/* Indicador de datos mock */}
        {isUsingMockData && (
          <div className="flex items-center gap-1">
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              📊 Demo
            </span>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex items-center gap-1">
          {onRetry && (
            <button
              onClick={onRetry}
              className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
              title="Reintentar conexión"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}

          {error && (
            <button
              onClick={() => setShowErrorDetails(!showErrorDetails)}
              className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
              title="Ver detalles del error"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}

          {onClearCache && (
            <button
              onClick={onClearCache}
              className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
              title="Limpiar cache"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Detalles del error (expandible) */}
      {error && showErrorDetails && (
        <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-sm font-medium text-gray-700 mb-2">
            Detalles del Error
          </div>
          
          <div className="space-y-2 text-xs text-gray-600">
            <div>
              <span className="font-medium">Tipo:</span> {error.type || 'Desconocido'}
            </div>
            
            <div>
              <span className="font-medium">Mensaje:</span> {getErrorMessage(error)}
            </div>
            
            {error.originalError && (
              <div>
                <span className="font-medium">Error original:</span> {error.originalError}
              </div>
            )}
            
            {error.timestamp && (
              <div>
                <span className="font-medium">Hora:</span> {new Date(error.timestamp).toLocaleString()}
              </div>
            )}

            {error.attempts && (
              <div>
                <span className="font-medium">Intentos realizados:</span> {error.attempts}
              </div>
            )}
          </div>

          {/* Sugerencias de solución */}
          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
            <div className="text-xs font-medium text-blue-700 mb-1">
              💡 Sugerencias:
            </div>
            <ul className="text-xs text-blue-600 space-y-1">
              {error.type === SUPABASE_ERROR_TYPES.CONNECTION && (
                <>
                  <li>• Verifica tu conexión a internet</li>
                  <li>• Comprueba el estado del servidor</li>
                </>
              )}
              {error.type === SUPABASE_ERROR_TYPES.AUTHENTICATION && (
                <>
                  <li>• Recarga la página</li>
                  <li>• Verifica las credenciales</li>
                </>
              )}
              {error.type === SUPABASE_ERROR_TYPES.PERMISSION && (
                <>
                  <li>• Contacta al administrador</li>
                  <li>• Verifica los permisos de tu cuenta</li>
                </>
              )}
              {(!error.type || error.type === SUPABASE_ERROR_TYPES.UNKNOWN) && (
                <>
                  <li>• Intenta recargar la página</li>
                  <li>• Limpia el cache del navegador</li>
                  <li>• Contacta al soporte técnico si persiste</li>
                </>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente compacto para la barra superior
export const ConnectionStatusCompact = ({ 
  connectionStatus, 
  isUsingMockData, 
  onRetry 
}) => {
  const statusIcons = {
    connected: '🟢',
    disconnected: '🔴',
    checking: '🟡'
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">
        {statusIcons[connectionStatus] || statusIcons.checking}
      </span>
      
      {isUsingMockData && (
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
          Demo
        </span>
      )}
      
      {onRetry && connectionStatus === 'disconnected' && (
        <button
          onClick={onRetry}
          className="text-xs text-blue-600 hover:text-blue-800 underline"
        >
          Reintentar
        </button>
      )}
    </div>
  );
};

// Componente de notificación toast
export const ConnectionToast = ({ 
  connectionStatus, 
  error, 
  onDismiss,
  autoHide = true 
}) => {
  React.useEffect(() => {
    if (autoHide && connectionStatus === 'connected') {
      const timer = setTimeout(onDismiss, 3000);
      return () => clearTimeout(timer);
    }
  }, [connectionStatus, autoHide, onDismiss]);

  if (connectionStatus === 'connected' && !error) {
    return (
      <div className="fixed top-4 right-4 z-50 bg-green-100 border border-green-200 text-green-700 px-4 py-3 rounded-lg shadow-lg">
        <div className="flex items-center gap-2">
          <span>🟢</span>
          <span className="font-medium">Conexión restaurada</span>
          <button onClick={onDismiss} className="ml-2 text-green-500 hover:text-green-700">
            ×
          </button>
        </div>
      </div>
    );
  }

  if (connectionStatus === 'disconnected' || error) {
    return (
      <div className="fixed top-4 right-4 z-50 bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-lg">
        <div className="flex items-center gap-2">
          <span>🔴</span>
          <div className="flex-1">
            <div className="font-medium">Problema de conexión</div>
            <div className="text-sm">Usando datos de demostración</div>
          </div>
          <button onClick={onDismiss} className="ml-2 text-red-500 hover:text-red-700">
            ×
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default ConnectionStatus;