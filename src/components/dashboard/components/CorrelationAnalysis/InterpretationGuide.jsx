/**
 * InterpretationGuide - Componente para mostrar guía de interpretación de correlaciones
 * Proporciona contexto educativo sobre cómo interpretar los valores de correlación
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { INTERPRETATION_GUIDE, ANIMATION_CONFIG } from './constants.jsx';

/**
 * Elemento individual de la guía de interpretación
 */
const InterpretationItem = ({ item, isExpanded, onToggle }) => {
  return (
    <div 
      className={`
        border-l-4 border-blue-300 pl-3 py-2 
        ${ANIMATION_CONFIG.cardHover}
        ${isExpanded ? 'bg-blue-50' : 'hover:bg-gray-50'}
      `}
      role="listitem"
    >
      <button
        className="w-full text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={`interpretation-detail-${item.value.replace(/[^a-zA-Z0-9]/g, '')}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="font-semibold text-gray-900 text-sm">
              {item.value}:
            </span>
            <span className="text-gray-700 text-sm">
              {item.description}
            </span>
          </div>
          <span 
            className={`text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            aria-hidden="true"
          >
            ▼
          </span>
        </div>
      </button>
      
      {isExpanded && (
        <div 
          id={`interpretation-detail-${item.value.replace(/[^a-zA-Z0-9]/g, '')}`}
          className="mt-2 pl-4 text-xs text-gray-600 border-l-2 border-blue-200"
          role="region"
          aria-label={`Ejemplo para ${item.value}`}
        >
          <p className="italic">
            <strong>Ejemplo:</strong> {item.example}
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * Componente principal InterpretationGuide
 */
const InterpretationGuide = ({ 
  className = '',
  isCollapsible = true,
  defaultExpanded = false,
  showExamples = true 
}) => {
  const [isGuideExpanded, setIsGuideExpanded] = useState(defaultExpanded);
  const [expandedItems, setExpandedItems] = useState(new Set());

  const toggleGuide = () => {
    setIsGuideExpanded(!isGuideExpanded);
  };

  const toggleItem = (value) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(value)) {
      newExpanded.delete(value);
    } else {
      newExpanded.add(value);
    }
    setExpandedItems(newExpanded);
  };

  const expandAllItems = () => {
    setExpandedItems(new Set(INTERPRETATION_GUIDE.map(item => item.value)));
  };

  const collapseAllItems = () => {
    setExpandedItems(new Set());
  };

  return (
    <div className={`p-4 bg-gray-50 rounded-lg border border-gray-200 ${className}`}>
      {/* Header de la guía */}
      <div className="flex items-center justify-between mb-3">
        {isCollapsible ? (
          <button
            className="flex items-center space-x-2 text-sm font-medium text-gray-900 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
            onClick={toggleGuide}
            aria-expanded={isGuideExpanded}
            aria-controls="interpretation-guide-content"
          >
            <span>Interpretación de Correlaciones:</span>
            <span 
              className={`transition-transform duration-200 ${isGuideExpanded ? 'rotate-180' : ''}`}
              aria-hidden="true"
            >
              ▼
            </span>
          </button>
        ) : (
          <h4 className="text-sm font-medium text-gray-900">
            Interpretación de Correlaciones:
          </h4>
        )}

        {/* Controles para expandir/colapsar todos los items */}
        {isGuideExpanded && showExamples && (
          <div className="flex space-x-2">
            <button
              className="text-xs text-blue-600 hover:text-blue-800 focus:outline-none focus:underline"
              onClick={expandAllItems}
              aria-label="Expandir todos los ejemplos"
            >
              Expandir todo
            </button>
            <span className="text-xs text-gray-400">|</span>
            <button
              className="text-xs text-blue-600 hover:text-blue-800 focus:outline-none focus:underline"
              onClick={collapseAllItems}
              aria-label="Colapsar todos los ejemplos"
            >
              Colapsar todo
            </button>
          </div>
        )}
      </div>

      {/* Contenido de la guía */}
      {(!isCollapsible || isGuideExpanded) && (
        <div 
          id="interpretation-guide-content"
          role="list"
          aria-label="Guía de interpretación de correlaciones"
        >
          <div className="space-y-2">
            {INTERPRETATION_GUIDE.map((item) => (
              <InterpretationItem
                key={item.value}
                item={item}
                isExpanded={showExamples && expandedItems.has(item.value)}
                onToggle={() => showExamples && toggleItem(item.value)}
              />
            ))}
          </div>

          {/* Nota adicional */}
          <div className="mt-4 p-3 bg-blue-100 border border-blue-200 rounded text-xs">
            <div className="flex items-start space-x-2">
              <span className="text-blue-600 font-semibold" aria-hidden="true">💡</span>
              <div>
                <p className="text-blue-800 font-medium mb-1">Nota importante:</p>
                <p className="text-blue-700">
                  La correlación no implica causalidad. Una correlación fuerte entre dos variables 
                  no significa necesariamente que una cause la otra. Pueden estar relacionadas 
                  por una tercera variable o ser coincidencia estadística.
                </p>
              </div>
            </div>
          </div>

          {/* Información de accesibilidad */}
          <div className="sr-only">
            <p>
              Esta guía explica cómo interpretar los coeficientes de correlación. 
              Los valores van de -1 a +1, donde valores cercanos a -1 o +1 indican 
              correlaciones fuertes, y valores cercanos a 0 indican correlaciones débiles o inexistentes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// PropTypes para validación de tipos
InterpretationGuide.propTypes = {
  className: PropTypes.string,
  isCollapsible: PropTypes.bool,
  defaultExpanded: PropTypes.bool,
  showExamples: PropTypes.bool
};

InterpretationItem.propTypes = {
  item: PropTypes.shape({
    value: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    example: PropTypes.string.isRequired
  }).isRequired,
  isExpanded: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired
};

export default InterpretationGuide;