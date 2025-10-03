const tooltipConfig = {
  cursor: { fill: 'rgba(235, 245, 255, 0.4)' },
  contentStyle: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    border: '1px solid #E5E7EB',
    borderRadius: '0.75rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    padding: '12px',
    fontFamily: '"Inter", sans-serif',
  },
  labelStyle: {
    fontWeight: '600',
    color: '#1F2937',
  },
  itemStyle: {
    fontSize: '14px',
  },
};

// Grid configuration
const gridConfig = {
  stroke: '#E5E7EB',
  strokeDasharray: '3 3',
  vertical: false,
};

// Axis configuration
const axisConfig = {
  tick: {
    fill: '#6B7280',
    fontSize: 12,
    fontFamily: '"Inter", sans-serif',
  },
  axisLine: {
    stroke: '#D1D5DB',
  },
  tickLine: {
    stroke: '#D1D5DB',
  },
};

// Legend configuration
const legendConfig = {
  iconSize: 12,
  iconType: 'circle',
  wrapperStyle: {
    paddingTop: '20px',
    fontSize: '14px',
    fontFamily: '"Inter", sans-serif',
    color: '#4B5563',
  },
};

// Animation configuration
const animationConfig = {
  animationEasing: 'ease-in-out',
  animationDuration: 800,
};

// Recharts specific configurations
export const rechartsConfig = {
  tooltip: tooltipConfig,
  grid: gridConfig,
  axis: axisConfig,
  legend: legendConfig,
  animation: animationConfig
};