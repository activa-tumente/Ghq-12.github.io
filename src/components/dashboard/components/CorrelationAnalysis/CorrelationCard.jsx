/**
 * CorrelationCard - Componente para mostrar información individual de correlación
 * Incluye accesibilidad mejorada y diseño responsivo
 */

import React from 'react';
import PropTypes from 'prop-types';
import {
  CORRELATION_COLORS,
  DIRECTION_ICONS,
  ACCESSIBILITY_CONFIG,
  ANIMATION_CONFIG
} from './constants.jsx';

/**
 * Barra de progreso visual para la correlación
 */
const CorrelationProgressBar = ({ correlation, strength }) => {
  const percentage = Math.abs(correlation) * 100;
  const isNegative = correlation < 0;
  
  return (
    <div className="w-full bg-gray-200 rounded-full h-2 mb-2 relative overflow-hidden">
      <div
        className="h-2 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all duration-500"
        style={{ 
          width: `${percentage}%`,
          marginLeft: isNegative ? `${100 - percentage}%` : '0%'
        }}
        role={ACCESSIBILITY_CONFIG.progressBar.role}
        aria-label={ACCESSIBILITY_CONFIG.progressBar.ariaLabelTemplate
          .replace('{percentage}', percentage.toFixed(0))}
        aria-valuenow={percentage}
        aria-valuemin="0"
        aria-valuemax="100"
      />
      
      {/* Indicador central para correlación cero */}
      <div 
        className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0.5 h-2 bg-gray-400"
        aria-hidden="true"
      />
    </div>
  );
};

/**
 * Badge de fuerza de correlación
 */
const StrengthBadge = ({ strength }) => {
  const colors = CORRELATION_COLORS[strength.toUpperCase().replace(' ', '_')] || CORRELATION_COLORS.VERY_WEAK;
  
  return (
    <div 
      className={`px-2 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text} ${colors.border} border`}
      role="status"
      aria-label={`Fuerza de correlación: ${strength}`}
    >
      {strength}
    </div>
  );
};

/**
 * Icono de dirección de correlación
 */
const DirectionIcon = ({ direction, correlation }) => {
  const icon = DIRECTION_ICONS[direction.toUpperCase()] || DIRECTION_ICONS.NEUTRAL;
  const ariaLabel = `Dirección ${direction.toLowerCase()}: ${correlation > 0 ? 'positiva' : correlation < 0 ? 'negativa' : 'neutral'}`;
  
  return (
    <span 
      className="text-lg select-none"
      role="img"
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      {icon}
    </span>
  );
};

/**
 * Componente principal CorrelationCard
 */
const CorrelationCard = ({ 
  correlation, 
  onCardClick = null,
  className = '',
  showDetails = true 
}) => {
  const {
    id,
    title,
    description,
    correlation: correlationValue,
    strength,
    direction,
    category
  } = correlation;

  const colors = CORRELATION_COLORS[strength.toUpperCase().replace(' ', '_')] || CORRELATION_COLORS.VERY_WEAK;
  const isClickable = typeof onCardClick === 'function';
  
  const formatCorrelation = (value) => {
    return isNaN(value) ? '0.00' : value.toFixed(2);
  };

  const handleClick = () => {
    if (isClickable) {
      onCardClick(correlation);
    }
  };

  const handleKeyPress = (event) => {
    if (isClickable && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onCardClick(correlation);
    }
  };

  return (
    <div
      className={`
        p-4 border-2 rounded-lg 
        ${colors.border} 
        ${ANIMATION_CONFIG.cardHover}
        ${isClickable ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2' : ''}
        ${className}
      `}
      style={{
        backgroundColor: `${colors.hex}10`,
        borderColor: colors.hex
      }}
      role={ACCESSIBILITY_CONFIG.correlationCard.role}
      aria-label={ACCESSIBILITY_CONFIG.correlationCard.ariaLabelTemplate
        .replace('{variable1}', title.split(' vs ')[0])
        .replace('{variable2}', title.split(' vs ')[1] || '')
        .replace('{value}', formatCorrelation(correlationValue))
        .replace('{strength}', strength)}
      onClick={handleClick}
      onKeyPress={handleKeyPress}
      tabIndex={isClickable ? 0 : -1}
      data-testid={`correlation-card-${id}`}
      data-category={category}
    >
      {/* Header con título y badge de fuerza */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900 capitalize text-sm md:text-base">
          {title}
        </h4>
        <StrengthBadge strength={strength} />
      </div>

      {/* Valor de correlación y dirección */}
      <div className="flex items-center justify-between mb-2">
        <span 
          className="text-2xl font-bold text-gray-900"
          aria-label={`Coeficiente de correlación: ${formatCorrelation(correlationValue)}`}
        >
          {formatCorrelation(correlationValue)}
        </span>
        <DirectionIcon direction={direction} correlation={correlationValue} />
      </div>

      {/* Descripción */}
      {showDetails && (
        <p className="text-sm text-gray-600 mb-3 leading-relaxed">
          {description}
        </p>
      )}

      {/* Barra de progreso visual */}
      <CorrelationProgressBar 
        correlation={correlationValue} 
        strength={strength} 
      />

      {/* Escala de referencia */}
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span aria-label="Correlación negativa perfecta">-1.0</span>
        <span aria-label="Sin correlación">0.0</span>
        <span aria-label="Correlación positiva perfecta">+1.0</span>
      </div>

      {/* Información adicional para lectores de pantalla */}
      <div className="sr-only">
        <p>
          Categoría: {category}. 
          Interpretación: Una correlación {direction.toLowerCase()} {strength.toLowerCase()} 
          indica que {correlationValue > 0 ? 'cuando una variable aumenta, la otra tiende a aumentar' : 
                     correlationValue < 0 ? 'cuando una variable aumenta, la otra tiende a disminuir' :
                     'no hay una relación lineal clara entre las variables'}.
        </p>
      </div>
    </div>
  );
};

// PropTypes para validación de tipos
CorrelationCard.propTypes = {
  correlation: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    correlation: PropTypes.number.isRequired,
    strength: PropTypes.string.isRequired,
    direction: PropTypes.string.isRequired,
    category: PropTypes.string
  }).isRequired,
  onCardClick: PropTypes.func,
  className: PropTypes.string,
  showDetails: PropTypes.bool
};

// Componentes auxiliares para exportación individual
export { CorrelationProgressBar, StrengthBadge, DirectionIcon };

export default CorrelationCard;