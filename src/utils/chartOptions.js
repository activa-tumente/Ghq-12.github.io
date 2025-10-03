export const commonChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: {
        font: {
          family: "'Inter', 'sans-serif'",
          size: 12,
        },
        color: '#4B5563',
      },
    },
    tooltip: {
      enabled: true,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleFont: {
        family: "'Inter', 'sans-serif'",
        size: 14,
        weight: 'bold',
      },
      bodyFont: {
        family: "'Inter', 'sans-serif'",
        size: 12,
      },
      callbacks: {
        label: function(context) {
          let label = context.dataset.label || '';
          if (label) {
            label += ': ';
          }
          if (context.parsed.y !== null) {
            label += new Intl.NumberFormat('es-ES').format(context.parsed.y);
          }
          return label;
        }
      }
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        font: {
          family: "'Inter', 'sans-serif'",
          size: 11,
        },
        color: '#6B7280',
      },
    },
    y: {
      grid: {
        color: '#E5E7EB',
        borderDash: [2, 4],
      },
      ticks: {
        font: {
          family: "'Inter', 'sans-serif'",
          size: 11,
        },
        color: '#6B7280',
      },
    },
  },
  animation: {
    duration: 800,
    easing: 'easeInOutQuart',
  },
};

export const barChartOptions = {
  ...commonChartOptions,
  scales: {
    ...commonChartOptions.scales,
    y: {
        ...commonChartOptions.scales.y,
        beginAtZero: true
    }
  }
};

export const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'right',
            labels: {
                font: {
                    family: "'Inter', 'sans-serif'",
                    size: 12,
                },
                color: '#4B5563',
                boxWidth: 20,
                padding: 20
            }
        },
        tooltip: commonChartOptions.plugins.tooltip
    },
    animation: commonChartOptions.animation,
    cutout: '70%',
};