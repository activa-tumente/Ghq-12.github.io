/**
 * StatsSummary - Componente para mostrar resumen estadístico de correlaciones
 * Presenta métricas clave y estadísticas descriptivas de manera visual y accesible
 */

import React from 'react';
import PropTypes from 'prop-types';
import { BsBarChart } from 'react-icons/bs';
import { STATS_CONFIG, ANIMATION_CONFIG } from './constants.jsx';

/**
 * Componente para mostrar una métrica estadística individual
 */
const StatCard = ({ stat, value, description, icon, trend, className = '' }) => {
  const formatValue = (val) => {
    if (typeof val === 'number') {
      return val % 1 === 0 ? val.toString() : val.toFixed(3);
    }
    return val?.toString() || 'N/A';
  };

  const getTrendIcon = (trendValue) => {
    if (!trendValue) return null;
    if (trendValue > 0) return '📈';
    if (trendValue < 0) return '📉';
    return '➡️';
  };

  const getTrendColor = (trendValue) => {
    if (!trendValue) return 'text-gray-500';
    if (trendValue > 0) return 'text-green-600';
    if (trendValue < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  return (
    <div 
      className={`
        p-4 bg-white rounded-lg border border-gray-200 shadow-sm
        ${ANIMATION_CONFIG.cardHover}
        transition-all duration-200
        ${className}
      `}
      role="article"
      aria-labelledby={`stat-${stat}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {icon && (
            <span className="text-lg" aria-hidden="true">
              {icon}
            </span>
          )}
          <h4 
            id={`stat-${stat}`}
            className="text-sm font-medium text-gray-900"
          >
            {STATS_CONFIG[stat]?.label || stat}
          </h4>
        </div>
        
        {trend !== undefined && (
          <div className={`flex items-center space-x-1 ${getTrendColor(trend)}`}>
            <span className="text-xs" aria-hidden="true">
              {getTrendIcon(trend)}
            </span>
            <span className="text-xs font-medium">
              {trend > 0 ? '+' : ''}{formatValue(trend)}
            </span>
          </div>
        )}
      </div>

      <div className="mb-2">
        <span 
          className="text-2xl font-bold text-gray-900"
          aria-label={`${STATS_CONFIG[stat]?.label || stat}: ${formatValue(value)}`}
        >
          {formatValue(value)}
        </span>
        {STATS_CONFIG[stat]?.unit && (
          <span className="text-sm text-gray-500 ml-1">
            {STATS_CONFIG[stat].unit}
          </span>
        )}
      </div>

      {description && (
        <p className="text-xs text-gray-600 leading-relaxed">
          {description}
        </p>
      )}

      {/* Barra de progreso visual para valores entre -1 y 1 */}
      {typeof value === 'number' && value >= -1 && value <= 1 && (
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${
                value >= 0 ? 'bg-blue-500' : 'bg-red-500'
              }`}
              style={{ 
                width: `${Math.abs(value) * 100}%`,
                marginLeft: value < 0 ? `${(1 + value) * 100}%` : '0'
              }}
              role="progressbar"
              aria-valuenow={value}
              aria-valuemin={-1}
              aria-valuemax={1}
              aria-label={`Valor de ${STATS_CONFIG[stat]?.label || stat}: ${formatValue(value)}`}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>-1</span>
            <span>0</span>
            <span>+1</span>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Componente para mostrar distribución de correlaciones
 */
const CorrelationDistribution = ({ distribution, className = '' }) => {
  if (!distribution || Object.keys(distribution).length === 0) {
    return null;
  }

  const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
  
  const strengthLabels = {
    weak: 'Débiles',
    moderate: 'Moderadas', 
    strong: 'Fuertes'
  };

  const strengthColors = {
    weak: 'bg-gray-400',
    moderate: 'bg-yellow-400',
    strong: 'bg-green-500'
  };

  return (
    <div className={`p-4 bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center space-x-2">
        <span aria-hidden="true">📊</span>
        <span>Distribución por Fuerza</span>
      </h4>

      <div className="space-y-3">
        {Object.entries(distribution).map(([strength, count]) => {
          const percentage = total > 0 ? (count / total) * 100 : 0;
          
          return (
            <div key={strength} className="flex items-center space-x-3">
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-gray-700">
                    {strengthLabels[strength] || strength}
                  </span>
                  <span className="text-xs text-gray-500">
                    {count} ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${strengthColors[strength] || 'bg-gray-400'}`}
                    style={{ width: `${percentage}%` }}
                    role="progressbar"
                    aria-valuenow={percentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${strengthLabels[strength] || strength}: ${count} correlaciones (${percentage.toFixed(1)}%)`}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-600">Total de correlaciones:</span>
          <span className="font-medium text-gray-900">{total}</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Componente principal StatsSummary
 */
const StatsSummary = ({ 
  stats = {},
  distribution = {},
  className = '',
  showDistribution = true,
  layout = 'grid' // 'grid' | 'horizontal'
}) => {
  const hasStats = Object.keys(stats).length > 0;
  const hasDistribution = Object.keys(distribution).length > 0;

  if (!hasStats && !hasDistribution) {
    return (
      <div className={`p-6 bg-gray-50 rounded-lg border border-gray-200 ${className}`}>
        <div className="text-center">
          <span className="text-4xl mb-2 block" aria-hidden="true">📈</span>
          <p className="text-gray-600 text-sm">
            No hay estadísticas disponibles
          </p>
          <p className="text-gray-500 text-xs mt-1">
            Las estadísticas se calcularán automáticamente cuando haya datos de correlación.
          </p>
        </div>
      </div>
    );
  }

  const gridCols = layout === 'horizontal' ? 'grid-cols-1 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Estadísticas principales */}
      {hasStats && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center space-x-2">
            <BsBarChart aria-hidden="true" />
            <span>Resumen Estadístico</span>
          </h3>
          
          <div className={`grid gap-4 ${gridCols}`}>
            {Object.entries(stats).map(([key, value]) => {
              const config = STATS_CONFIG[key] || {};
              return (
                <StatCard
                  key={key}
                  stat={key}
                  value={value}
                  description={config.description}
                  icon={config.icon}
                  trend={config.trend}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Distribución de correlaciones */}
      {showDistribution && hasDistribution && (
        <CorrelationDistribution 
          distribution={distribution}
          className="md:col-span-2 lg:col-span-3"
        />
      )}

      {/* Información de accesibilidad */}
      <div className="sr-only">
        <p>
          Resumen estadístico que muestra {Object.keys(stats).length} métricas principales
          {hasDistribution && ` y la distribución de ${Object.values(distribution).reduce((sum, count) => sum + count, 0)} correlaciones por fuerza`}.
        </p>
      </div>
    </div>
  );
};

// PropTypes para validación de tipos
StatsSummary.propTypes = {
  stats: PropTypes.objectOf(PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.string
  ])),
  distribution: PropTypes.objectOf(PropTypes.number),
  className: PropTypes.string,
  showDistribution: PropTypes.bool,
  layout: PropTypes.oneOf(['grid', 'horizontal'])
};

StatCard.propTypes = {
  stat: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  description: PropTypes.string,
  icon: PropTypes.string,
  trend: PropTypes.number,
  className: PropTypes.string
};

CorrelationDistribution.propTypes = {
  distribution: PropTypes.objectOf(PropTypes.number).isRequired,
  className: PropTypes.string
};

export default StatsSummary;