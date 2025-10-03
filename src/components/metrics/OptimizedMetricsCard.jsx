import { memo, useMemo } from 'react';
import PropTypes from 'prop-types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * Optimized metrics card component with memoization
 * Only re-renders when actual metric values change
 */
const OptimizedMetricsCard = memo(({ 
  title, 
  value, 
  previousValue, 
  icon: Icon, 
  format = 'number',
  loading = false,
  error = null,
  className = ''
}) => {
  // Memoize trend calculation
  const trend = useMemo(() => {
    if (!previousValue || previousValue === 0) return null;
    
    const change = ((value - previousValue) / previousValue) * 100;
    return {
      percentage: Math.abs(change).toFixed(1),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
      value: change
    };
  }, [value, previousValue]);

  // Memoize formatted value
  const formattedValue = useMemo(() => {
    if (loading) return '...';
    if (error) return 'Error';
    
    switch (format) {
      case 'percentage':
        return `${value}%`;
      case 'currency':
        return new Intl.NumberFormat('es-ES', { 
          style: 'currency', 
          currency: 'EUR' 
        }).format(value);
      case 'number':
      default:
        return typeof value === 'number' ? value.toLocaleString('es-ES') : value;
    }
  }, [value, format, loading, error]);

  // Memoize trend icon
  const TrendIcon = useMemo(() => {
    if (!trend) return null;
    
    switch (trend.direction) {
      case 'up':
        return TrendingUp;
      case 'down':
        return TrendingDown;
      default:
        return Minus;
    }
  }, [trend]);

  // Memoize trend color
  const trendColor = useMemo(() => {
    if (!trend) return 'text-gray-400';
    
    switch (trend.direction) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-400';
    }
  }, [trend]);

  return (
    <div className={`bg-white p-6 rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <div className="flex items-baseline space-x-2">
            <p className={`text-2xl font-bold ${
              loading ? 'text-gray-400' : error ? 'text-red-600' : 'text-gray-900'
            }`}>
              {formattedValue}
            </p>
            {trend && TrendIcon && (
              <div className={`flex items-center space-x-1 ${trendColor}`}>
                <TrendIcon className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {trend.percentage}%
                </span>
              </div>
            )}
          </div>
        </div>
        {Icon && (
          <Icon className={`w-8 h-8 opacity-75 ${
            loading ? 'text-gray-400' : error ? 'text-red-400' : 'text-blue-600'
          }`} />
        )}
      </div>
      
      {error && (
        <p className="text-xs text-red-500 mt-2">
          {error.message || 'Error al cargar datos'}
        </p>
      )}
    </div>
  );
});

OptimizedMetricsCard.displayName = 'OptimizedMetricsCard';

OptimizedMetricsCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  previousValue: PropTypes.number,
  icon: PropTypes.elementType,
  format: PropTypes.oneOf(['number', 'percentage', 'currency']),
  loading: PropTypes.bool,
  error: PropTypes.object,
  className: PropTypes.string
};

export default OptimizedMetricsCard;