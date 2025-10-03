import React, { useState, useEffect } from 'react';

/**
 * Componente de notificación para mostrar mensajes al usuario
 * @param {Object} props - Propiedades del componente
 * @param {string} props.message - Mensaje a mostrar
 * @param {string} props.type - Tipo de notificación (success, error, warning, info)
 * @param {boolean} props.show - Controla si se muestra la notificación
 * @param {function} props.onClose - Función para cerrar la notificación
 * @param {number} props.duration - Duración en ms antes de cerrarse automáticamente (0 para no cerrarse)
 */
const Notification = ({ 
  message, 
  type = 'info', 
  show = false, 
  onClose, 
  duration = 3000 
}) => {
  const [isVisible, setIsVisible] = useState(show);

  useEffect(() => {
    setIsVisible(show);
    
    let timer;
    if (show && duration > 0) {
      timer = setTimeout(() => {
        setIsVisible(false);
        if (onClose) onClose();
      }, duration);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [show, duration, onClose]);

  if (!isVisible) return null;

  const bgColors = {
    success: 'bg-green-100 border-green-500 text-green-700',
    error: 'bg-red-100 border-red-500 text-red-700',
    warning: 'bg-yellow-100 border-yellow-500 text-yellow-700',
    info: 'bg-blue-100 border-blue-500 text-blue-700'
  };

  const iconClasses = {
    success: 'fas fa-check-circle',
    error: 'fas fa-exclamation-circle',
    warning: 'fas fa-exclamation-triangle',
    info: 'fas fa-info-circle'
  };

  return (
    <div 
      className={`fixed top-4 right-4 z-50 p-4 rounded-md border-l-4 shadow-md ${bgColors[type] || bgColors.info}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <i className={`${iconClasses[type] || iconClasses.info} mr-2`} aria-hidden="true"></i>
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <div className="ml-auto pl-3">
          <button
            type="button"
            className="inline-flex text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            onClick={() => {
              setIsVisible(false);
              if (onClose) onClose();
            }}
            aria-label="Cerrar notificación"
          >
            <span className="sr-only">Cerrar</span>
            <i className="fas fa-times" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Notification;