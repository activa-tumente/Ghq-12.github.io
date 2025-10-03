// Constantes de configuración para RiskHeatmap
export const RISK_THRESHOLDS = {
  LOW: 40,
  MODERATE: 60,
  HIGH: 80,
  CRITICAL: 100
};

export const RISK_LEVELS = {
  LOW: 'Bajo',
  MODERATE: 'Moderado', 
  HIGH: 'Alto',
  CRITICAL: 'Crítico'
};

export const RISK_COLORS = {
  LOW: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-600',
    badge: 'bg-green-100 text-green-800',
    progress: 'bg-green-400'
  },
  MODERATE: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200', 
    text: 'text-yellow-600',
    badge: 'bg-yellow-100 text-yellow-800',
    progress: 'bg-yellow-400'
  },
  HIGH: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-600', 
    badge: 'bg-orange-100 text-orange-800',
    progress: 'bg-orange-400'
  },
  CRITICAL: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-600',
    badge: 'bg-red-100 text-red-800', 
    progress: 'bg-red-500'
  }
};

export const LEGEND_ITEMS = [
  { level: RISK_LEVELS.LOW, color: RISK_COLORS.LOW.progress, range: '0-40%' },
  { level: RISK_LEVELS.MODERATE, color: RISK_COLORS.MODERATE.progress, range: '40-60%' },
  { level: RISK_LEVELS.HIGH, color: RISK_COLORS.HIGH.progress, range: '60-80%' },
  { level: RISK_LEVELS.CRITICAL, color: RISK_COLORS.CRITICAL.progress, range: '80-100%' }
];