// Utilidades para cálculo y visualización de riesgos
export const RISK_LEVELS = {
  VERY_LOW: { threshold: 0, label: 'Muy Bajo', color: 'bg-green-200', border: 'border-green-300', text: 'text-gray-900' },
  LOW: { threshold: 20, label: 'Bajo', color: 'bg-green-400', border: 'border-green-500', text: 'text-gray-900' },
  MODERATE: { threshold: 40, label: 'Moderado', color: 'bg-yellow-400', border: 'border-yellow-500', text: 'text-gray-900' },
  HIGH: { threshold: 60, label: 'Alto', color: 'bg-orange-500', border: 'border-orange-600', text: 'text-white' },
  VERY_HIGH: { threshold: 80, label: 'Muy Alto', color: 'bg-red-600', border: 'border-red-700', text: 'text-white' }
};

export const getRiskLevel = (value) => {
  if (value >= 80) return RISK_LEVELS.VERY_HIGH;
  if (value >= 60) return RISK_LEVELS.HIGH;
  if (value >= 40) return RISK_LEVELS.MODERATE;
  if (value >= 20) return RISK_LEVELS.LOW;
  return RISK_LEVELS.VERY_LOW;
};

export const getRiskColor = (value) => {
  return getRiskLevel(value).color;
};

export const getBorderColor = (value) => {
  return getRiskLevel(value).border;
};

export const getRiskLabel = (value) => {
  return getRiskLevel(value).label;
};

export const getTextColor = (value) => {
  return getRiskLevel(value).text;
};

// Calcular estadísticas reales basadas en datos
export const calculateStatistics = (departments, averageRisk) => {
  const values = Object.values(averageRisk);
  
  if (values.length === 0) {
    return {
      averageRisk: 0,
      departmentsAboveAverage: 0,
      criticalCount: 0,
      totalDepartments: 0
    };
  }

  const average = values.reduce((sum, val) => sum + val, 0) / values.length;
  const departmentsAboveAverage = values.filter(val => val > average).length;
  const criticalCount = values.filter(val => val >= 40).length;

  return {
    averageRisk: average,
    departmentsAboveAverage,
    criticalCount,
    totalDepartments: values.length
  };
};

// Generar recomendaciones basadas en datos reales
export const generateRecommendations = (criticalDepartments, statistics) => {
  const recommendations = [];
  
  if (criticalDepartments.length > 0) {
    const topCritical = criticalDepartments[0];
    recommendations.push(`Intervención prioritaria en ${topCritical.name} (${topCritical.risk.toFixed(1)}% riesgo)`);
  }
  
  if (statistics.criticalCount > 0) {
    recommendations.push(`Programas de bienestar para ${statistics.criticalCount} departamentos críticos`);
  }
  
  if (statistics.averageRisk > 30) {
    recommendations.push('Revisión general de cargas de trabajo y condiciones laborales');
  }
  
  recommendations.push('Monitoreo continuo de indicadores de riesgo psicológico');
  recommendations.push('Capacitación en manejo de estrés y salud mental');
  
  return recommendations;
};