
export const brandColors = {
  primary: 'var(--color-primary, #4F46E5)',
  secondary: 'var(--color-secondary, #10B981)',
  accent: 'var(--color-accent, #F59E0B)',
  neutral: 'var(--color-neutral, #6B7280)',
  info: 'var(--color-info, #3B82F6)',
  success: 'var(--color-success, #14B8A6)',
  warning: 'var(--color-warning, #FBBF24)',
  error: 'var(--color-error, #EF4444)',
  purple: 'var(--color-purple, #8B5CF6)',
  pink: 'var(--color-pink, #EC4899)',
  gray: 'var(--color-gray, #78716C)',
  indigo: 'var(--color-indigo, #6366F1)',
  teal: 'var(--color-teal, #06B6D4)',
  orange: 'var(--color-orange, #F97316)',
  rose: 'var(--color-rose, #F43F5E)',
  emerald: 'var(--color-emerald, #10B981)',
  cyan: 'var(--color-cyan, #0891B2)',
  lime: 'var(--color-lime, #65A30D)',
  amber: 'var(--color-amber, #F59E0B)',
  slate: 'var(--color-slate, #64748B)',
  zinc: 'var(--color-zinc, #71717A)',
  stone: 'var(--color-stone, #78716C)',
  sky: 'var(--color-sky, #0EA5E9)',
  violet: 'var(--color-violet, #8B5CF6)',
  fuchsia: 'var(--color-fuchsia, #D946EF)'
};

export const colorPalette = Object.values(brandColors);

// Modern gradient colors for charts
export const gradientColors = {
  primary: ['#4F46E5', '#7C3AED'],
  secondary: ['#10B981', '#059669'],
  accent: ['#F59E0B', '#D97706'],
  success: ['#14B8A6', '#0F766E'],
  warning: ['#FBBF24', '#D97706'],
  error: ['#EF4444', '#DC2626'],
  info: ['#3B82F6', '#2563EB'],
  purple: ['#8B5CF6', '#7C3AED'],
  pink: ['#EC4899', '#DB2777']
};

// Tooltip configuration
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

// Custom tooltip components for Recharts
export const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="text-sm font-semibold text-gray-700 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            <span className="font-medium">{entry.name}:</span>{' '}
            {formatter ? formatter(entry.value) : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Custom label components
export const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value, name }) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize="12"
      fontWeight="600"
      fontFamily="'Inter', sans-serif"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// Chart theme for consistent styling
export const chartTheme = {
  colors: colorPalette,
  gradients: gradientColors,
  tooltip: rechartsConfig.tooltip,
  grid: rechartsConfig.grid,
  axis: rechartsConfig.axis,
  legend: rechartsConfig.legend,
  animation: rechartsConfig.animation
};
