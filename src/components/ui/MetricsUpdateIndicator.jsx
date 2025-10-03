import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Wifi, WifiOff, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

/**
 * Component that shows real-time status and update indicators for metrics
 */
const MetricsUpdateIndicator = ({
  isRealTime,
  lastUpdate,
  isUpdating,
  error,
  onRefresh,
  className = '',
  showLastUpdate = true,
  compact = false
}) => {
  const [showUpdatePulse, setShowUpdatePulse] = useState(false);

  // Show pulse animation when metrics are updated
  useEffect(() => {
    if (lastUpdate) {
      setShowUpdatePulse(true);
      const timer = setTimeout(() => setShowUpdatePulse(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [lastUpdate]);

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className={`flex items-center gap-1 ${showUpdatePulse ? 'animate-pulse' : ''}`}>
          {isRealTime ? (
            <Wifi className="w-3 h-3 text-green-500" />
          ) : (
            <WifiOff className="w-3 h-3 text-yellow-500" />
          )}
          {isUpdating && <RefreshCw className="w-3 h-3 animate-spin text-blue-500" />}
        </div>
        {error && <AlertCircle className="w-3 h-3 text-red-500" />}
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center gap-4">
        {/* Real-time status */}
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            isRealTime
              ? 'bg-green-100 text-green-700 border border-green-200'
              : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
          }`}>
            {isRealTime ? (
              <>
                <Wifi className="w-3 h-3" />
                <span>Tiempo real</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3" />
                <span>Offline</span>
              </>
            )}
          </div>

          {/* Update status */}
          {isUpdating && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200 text-xs font-medium">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Actualizando...</span>
            </div>
          )}

          {/* Update success indicator */}
          {showUpdatePulse && !isUpdating && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 border border-green-200 text-xs font-medium animate-pulse">
              <CheckCircle className="w-3 h-3" />
              <span>Actualizado</span>
            </div>
          )}

          {/* Error indicator */}
          {error && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 border border-red-200 text-xs font-medium">
              <AlertCircle className="w-3 h-3" />
              <span>Error</span>
            </div>
          )}
        </div>

        {/* Last update time */}
        {showLastUpdate && lastUpdate && (
          <div className="text-xs text-gray-500">
            Última actualización: {new Date(lastUpdate).toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Manual refresh button */}
      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={isUpdating}
          className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
            isUpdating
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200'
          }`}
        >
          <RefreshCw className={`w-3 h-3 ${isUpdating ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </button>
      )}
    </div>
  );
};

MetricsUpdateIndicator.propTypes = {
  isRealTime: PropTypes.bool,
  lastUpdate: PropTypes.string,
  isUpdating: PropTypes.bool,
  error: PropTypes.shape({
    message: PropTypes.string,
    timestamp: PropTypes.string
  }),
  onRefresh: PropTypes.func,
  className: PropTypes.string,
  showLastUpdate: PropTypes.bool,
  compact: PropTypes.bool
};

export default MetricsUpdateIndicator;