import React from 'react';
import { CardSkeleton } from '../../ui/SkeletonLoader';

const MetricsGrid = ({ data, loading }) => {
  const metrics = [
    {
      key: 'totalEvaluations',
      title: 'Evaluaciones Completadas',
      value: data?.completedEvaluations || 0,
      icon: '📊',
      color: 'blue',
      description: 'Cuestionarios respondidos',
      badge: null
    },
    {
      key: 'averageGHQ',
      title: 'Promedio GHQ-12',
      value: data?.averageGHQ ? data.averageGHQ.toFixed(2) : '0.00',
      icon: '🧠',
      color: data?.averageGHQ > 2 ? 'red' : data?.averageGHQ > 1 ? 'yellow' : 'green',
      description: 'Salud mental (0-3 escala)',
      badge: data?.averageGHQ > 2 ? 'Alerta' : data?.averageGHQ > 1 ? 'Moderado' : 'Normal'
    },
    {
      key: 'participationRate',
      title: 'Participación',
      value: data?.participationRate ? `${data.participationRate}%` : '0%',
      icon: '👥',
      color: data?.participationRate > 80 ? 'green' : data?.participationRate > 50 ? 'yellow' : 'red',
      description: 'Cobertura de encuestas',
      badge: null
    },
    {
      key: 'highRisk',
      title: 'Riesgo Alto',
      value: data?.riskDistribution?.alto ? `${data.riskDistribution.alto}%` : '0%',
      icon: '⚠️',
      color: 'red',
      description: 'Nivel alto + muy alto',
      badge: null
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-50 border-blue-200 text-blue-700',
      green: 'bg-green-50 border-green-200 text-green-700',
      red: 'bg-red-50 border-red-200 text-red-700',
      yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
      purple: 'bg-purple-50 border-purple-200 text-purple-700'
    };
    return colors[color] || colors.blue;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <CardSkeleton key={metric.key} showHeader={false} lines={2} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" role="grid" aria-label="Métricas del dashboard">
      {metrics.map((metric) => (
        <div
          key={metric.key}
          className={`rounded-lg border p-6 ${getColorClasses(metric.color)}`}
          role="gridcell"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex-shrink-0">
              <span className="text-2xl" aria-hidden="true">
                {metric.icon}
              </span>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dt className="text-sm font-medium text-gray-900 truncate">
                {metric.title}
              </dt>
              <dd className="text-2xl font-semibold text-gray-900 mt-1">
                {metric.value}
              </dd>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-600">
              {metric.description}
            </p>
            
            {metric.badge && (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                metric.color === 'red' 
                  ? 'bg-red-100 text-red-800' 
                  : metric.color === 'yellow' 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {metric.badge}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MetricsGrid;