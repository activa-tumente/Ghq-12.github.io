export const RISK_LEVELS = [
  { level: 'Muy Bajo', threshold: 0, color: 'bg-green-200', textColor: 'text-gray-900', borderColor: 'border-green-300' },
  { level: 'Bajo', threshold: 20, color: 'bg-green-400', textColor: 'text-gray-900', borderColor: 'border-green-500' },
  { level: 'Moderado', threshold: 40, color: 'bg-yellow-400', textColor: 'text-gray-900', borderColor: 'border-yellow-500' },
  { level: 'Alto', threshold: 60, color: 'bg-orange-500', textColor: 'text-white', borderColor: 'border-orange-600' },
  { level: 'Muy Alto', threshold: 80, color: 'bg-red-600', textColor: 'text-white', borderColor: 'border-red-700' },
];

const findRiskLevel = (value) => {
  let level = RISK_LEVELS[0];
  for (let i = RISK_LEVELS.length - 1; i >= 0; i--) {
    if (value >= RISK_LEVELS[i].threshold) {
      level = RISK_LEVELS[i];
      break;
    }
  }
  return level;
};

export const getRiskLevel = (value) => findRiskLevel(value).level;
export const getRiskColor = (value) => `${findRiskLevel(value).color} ${findRiskLevel(value).textColor}`;
export const getBorderColor = (value) => findRiskLevel(value).borderColor;