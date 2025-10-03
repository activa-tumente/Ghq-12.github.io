/**
 * InsightsPanel - Componente para mostrar insights dinámicos de correlaciones
 * Genera recomendaciones y observaciones basadas en los datos de correlación
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { BsSearch } from 'react-icons/bs';
import { KEY_INSIGHTS, ANIMATION_CONFIG } from './constants.jsx';

/**
 * Componente para mostrar un insight individual
 */
const InsightCard = ({ insight, index, isExpanded, onToggle }) => {
  const getInsightIcon = (type) => {
    const icons = {
      warning: '⚠️',
      positive: '✅',
      neutral: 'ℹ️',
      recommendation: '💡'
    };
    return icons[type] || icons.neutral;
  };

  const getInsightStyles = (type) => {
    const styles = {
      warning: 'border-yellow-300 bg-yellow-50 text-yellow-800',
      positive: 'border-green-300 bg-green-50 text-green-800',
      neutral: 'border-blue-300 bg-blue-50 text-blue-800',
      recommendation: 'border-purple-300 bg-purple-50 text-purple-800'
    };
    return styles[type] || styles.neutral;
  };

  return (
    <div 
      className={`
        border-l-4 p-3 rounded-r-lg ${getInsightStyles(insight.type)}
        ${ANIMATION_CONFIG.cardHover}
        transition-all duration-200
      `}
      role="article"
      aria-labelledby={`insight-title-${index}`}
    >
      <button
        className="w-full text-left focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded"
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={`insight-content-${index}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg" aria-hidden="true">
              {getInsightIcon(insight.type)}
            </span>
            <h4 
              id={`insight-title-${index}`}
              className="font-medium text-sm"
            >
              {insight.title}
            </h4>
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
          id={`insight-content-${index}`}
          className="mt-3 space-y-2"
          role="region"
          aria-labelledby={`insight-title-${index}`}
        >
          <p className="text-sm leading-relaxed">
            {insight.description}
          </p>
          
          {insight.recommendation && (
            <div className="mt-2 p-2 bg-white bg-opacity-50 rounded border border-current border-opacity-20">
              <p className="text-xs font-medium mb-1">Recomendación:</p>
              <p className="text-xs leading-relaxed">
                {insight.recommendation}
              </p>
            </div>
          )}

          {insight.metrics && insight.metrics.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium mb-1">Métricas relacionadas:</p>
              <div className="flex flex-wrap gap-1">
                {insight.metrics.map((metric, metricIndex) => (
                  <span 
                    key={metricIndex}
                    className="inline-block px-2 py-1 text-xs bg-white bg-opacity-70 rounded border border-current border-opacity-30"
                  >
                    {metric}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Componente principal InsightsPanel
 */
const InsightsPanel = ({ 
  insights = [],
  className = '',
  maxInsights = 5,
  showFilters = true,
  defaultExpanded = false
}) => {
  const [expandedInsights, setExpandedInsights] = useState(new Set());
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Combinar insights dinámicos con insights predefinidos
  const allInsights = [...insights, ...KEY_INSIGHTS].slice(0, maxInsights);

  // Filtrar insights por tipo
  const filteredInsights = selectedFilter === 'all' 
    ? allInsights 
    : allInsights.filter(insight => insight.type === selectedFilter);

  const toggleInsight = (index) => {
    const newExpanded = new Set(expandedInsights);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedInsights(newExpanded);
  };

  const expandAllInsights = () => {
    setExpandedInsights(new Set(filteredInsights.map((_, index) => index)));
  };

  const collapseAllInsights = () => {
    setExpandedInsights(new Set());
  };

  // Obtener tipos únicos para filtros
  const availableTypes = [...new Set(allInsights.map(insight => insight.type))];

  if (filteredInsights.length === 0) {
    return (
      <div className={`p-4 bg-gray-50 rounded-lg border border-gray-200 ${className}`}>
        <div className="text-center py-6">
          <span className="text-4xl mb-2 block" aria-hidden="true">📊</span>
          <p className="text-gray-600 text-sm">
            No hay insights disponibles para mostrar.
          </p>
          <p className="text-gray-500 text-xs mt-1">
            Los insights se generarán automáticamente cuando haya datos de correlación.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 bg-gray-50 rounded-lg border border-gray-200 ${className}`}>
      {/* Header del panel */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center space-x-2">
          <BsSearch aria-hidden="true" />
          <span>Insights y Recomendaciones</span>
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
            {filteredInsights.length}
          </span>
        </h3>

        {/* Controles */}
        <div className="flex items-center space-x-2">
          <button
            className="text-xs text-blue-600 hover:text-blue-800 focus:outline-none focus:underline"
            onClick={expandAllInsights}
            aria-label="Expandir todos los insights"
          >
            Expandir todo
          </button>
          <span className="text-xs text-gray-400">|</span>
          <button
            className="text-xs text-blue-600 hover:text-blue-800 focus:outline-none focus:underline"
            onClick={collapseAllInsights}
            aria-label="Colapsar todos los insights"
          >
            Colapsar todo
          </button>
        </div>
      </div>

      {/* Filtros por tipo */}
      {showFilters && availableTypes.length > 1 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            <button
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                selectedFilter === 'all'
                  ? 'bg-blue-100 border-blue-300 text-blue-800'
                  : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => setSelectedFilter('all')}
              aria-pressed={selectedFilter === 'all'}
            >
              Todos ({allInsights.length})
            </button>
            {availableTypes.map(type => {
              const count = allInsights.filter(insight => insight.type === type).length;
              const typeLabels = {
                warning: 'Advertencias',
                positive: 'Positivos',
                neutral: 'Informativos',
                recommendation: 'Recomendaciones'
              };
              
              return (
                <button
                  key={type}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                    selectedFilter === type
                      ? 'bg-blue-100 border-blue-300 text-blue-800'
                      : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedFilter(type)}
                  aria-pressed={selectedFilter === type}
                >
                  {typeLabels[type] || type} ({count})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Lista de insights */}
      <div className="space-y-3" role="list" aria-label="Lista de insights">
        {filteredInsights.map((insight, index) => (
          <div key={`${insight.type}-${index}`} role="listitem">
            <InsightCard
              insight={insight}
              index={index}
              isExpanded={defaultExpanded || expandedInsights.has(index)}
              onToggle={() => toggleInsight(index)}
            />
          </div>
        ))}
      </div>

      {/* Información de accesibilidad */}
      <div className="sr-only">
        <p>
          Panel de insights que muestra {filteredInsights.length} recomendaciones 
          y observaciones basadas en el análisis de correlaciones. 
          Use los controles para expandir o filtrar los insights por tipo.
        </p>
      </div>
    </div>
  );
};

// PropTypes para validación de tipos
InsightsPanel.propTypes = {
  insights: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.oneOf(['warning', 'positive', 'neutral', 'recommendation']).isRequired,
      title: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      recommendation: PropTypes.string,
      metrics: PropTypes.arrayOf(PropTypes.string)
    })
  ),
  className: PropTypes.string,
  maxInsights: PropTypes.number,
  showFilters: PropTypes.bool,
  defaultExpanded: PropTypes.bool
};

InsightCard.propTypes = {
  insight: PropTypes.shape({
    type: PropTypes.oneOf(['warning', 'positive', 'neutral', 'recommendation']).isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    recommendation: PropTypes.string,
    metrics: PropTypes.arrayOf(PropTypes.string)
  }).isRequired,
  index: PropTypes.number.isRequired,
  isExpanded: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired
};

export default InsightsPanel; InsightsPanel;