import { memo } from 'react';
import { TrendingUp } from 'lucide-react';

const StatCard = ({
  icon: Icon,
  title,
  value,
  subtitle,
  color = 'gray',
  trend,
}) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    red: 'bg-red-100 text-red-800',
    purple: 'bg-purple-100 text-purple-800',
    indigo: 'bg-indigo-100 text-indigo-800',
    pink: 'bg-pink-100 text-pink-800',
    gray: 'bg-gray-100 text-gray-800',
  };

  const trendColor =
    trend?.cambioMensual > 0
      ? 'text-green-600'
      : trend?.cambioMensual < 0
      ? 'text-red-600'
      : 'text-gray-500';

  return (
    <div
      className={`p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-between bg-white`}
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div
            className={`p-2 rounded-full flex items-center justify-center ${colorClasses[color]}`}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      {trend && (
        <div className="flex items-center text-xs mt-2">
          <TrendingUp className={`w-4 h-4 mr-1 ${trendColor}`} />
          <span className={trendColor}>{trend.cambioMensual}%</span>
          <span className="text-gray-500 ml-1">vs mes anterior</span>
        </div>
      )}
    </div>
  );
};

export default memo(StatCard);