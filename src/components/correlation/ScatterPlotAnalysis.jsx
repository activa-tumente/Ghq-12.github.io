import React, { memo, useMemo } from 'react'
import { TrendingUp, TrendingDown, Info } from 'lucide-react'
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import PropTypes from 'prop-types'

/**
 * Componente para análisis de gráfico de dispersión
 * Muestra la relación entre dos variables con línea de tendencia
 */
const ScatterPlotAnalysis = memo(({ scatterData, xLabel, yLabel, title, className = '' }) => {
  // Calcular estadísticas de la línea de tendencia usando useMemo para optimización
  const trendStats = useMemo(() => {
    if (!scatterData || scatterData.length === 0) {
      return null
    }

    // Calcular regresión lineal simple
    const n = scatterData.length
    const sumX = scatterData.reduce((sum, point) => sum + point.x, 0)
    const sumY = scatterData.reduce((sum, point) => sum + point.y, 0)
    const sumXY = scatterData.reduce((sum, point) => sum + (point.x * point.y), 0)
    const sumXX = scatterData.reduce((sum, point) => sum + (point.x * point.x), 0)
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n
    
    // Calcular R²
    const meanY = sumY / n
    const totalSumSquares = scatterData.reduce((sum, point) => sum + Math.pow(point.y - meanY, 2), 0)
    const residualSumSquares = scatterData.reduce((sum, point) => {
      const predicted = slope * point.x + intercept
      return sum + Math.pow(point.y - predicted, 2)
    }, 0)
    
    const rSquared = 1 - (residualSumSquares / totalSumSquares)
    
    return {
      slope,
      intercept,
      rSquared,
      correlation: Math.sqrt(Math.abs(rSquared)) * (slope >= 0 ? 1 : -1)
    }
  }, [scatterData])

  // Tooltip personalizado para el gráfico
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium">{`${xLabel}: ${label}`}</p>
          <p className="text-sm text-blue-600">{`${yLabel}: ${payload[0].value}`}</p>
        </div>
      )
    }
    return null
  }

  // Early return si no hay datos
  if (!scatterData || scatterData.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No hay datos disponibles para el análisis de dispersión</p>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Título y estadísticas */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        
        {trendStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {trendStats.correlation.toFixed(3)}
              </div>
              <div className="text-gray-600">Correlación</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {trendStats.rSquared.toFixed(3)}
              </div>
              <div className="text-gray-600">R²</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {trendStats.slope.toFixed(3)}
              </div>
              <div className="text-gray-600">Pendiente</div>
            </div>
            <div className="text-center">
              <div className={`flex items-center justify-center space-x-1 ${
                trendStats.slope > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {trendStats.slope > 0 ? (
                  <TrendingUp className="w-5 h-5" />
                ) : (
                  <TrendingDown className="w-5 h-5" />
                )}
                <span className="text-sm font-medium">
                  {trendStats.slope > 0 ? 'Positiva' : 'Negativa'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Gráfico de dispersión */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              data={scatterData}
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                type="number" 
                dataKey="x" 
                name={xLabel}
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis 
                type="number" 
                dataKey="y" 
                name={yLabel}
                stroke="#6b7280"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Scatter 
                name={`${xLabel} vs ${yLabel}`} 
                dataKey="y" 
                fill="#3b82f6"
                fillOpacity={0.7}
                stroke="#1d4ed8"
                strokeWidth={1}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        
        {/* Interpretación de la correlación */}
        {trendStats && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Interpretación</h4>
            <p className="text-sm text-gray-600">
              {Math.abs(trendStats.correlation) >= 0.7 && (
                <span className="font-medium text-green-600">Correlación fuerte</span>
              )}
              {Math.abs(trendStats.correlation) >= 0.5 && Math.abs(trendStats.correlation) < 0.7 && (
                <span className="font-medium text-yellow-600">Correlación moderada</span>
              )}
              {Math.abs(trendStats.correlation) < 0.5 && (
                <span className="font-medium text-gray-600">Correlación débil</span>
              )}
              {' '}entre {xLabel.toLowerCase()} y {yLabel.toLowerCase()}. 
              El R² de {trendStats.rSquared.toFixed(3)} indica que el {(trendStats.rSquared * 100).toFixed(1)}% 
              de la variabilidad en {yLabel.toLowerCase()} puede explicarse por {xLabel.toLowerCase()}.
            </p>
          </div>
        )}
      </div>
    </div>
  )
})

// Configurar displayName para debugging
ScatterPlotAnalysis.displayName = 'ScatterPlotAnalysis'

// PropTypes para validación de tipos
ScatterPlotAnalysis.propTypes = {
  scatterData: PropTypes.arrayOf(
    PropTypes.shape({
      x: PropTypes.number.isRequired,
      y: PropTypes.number.isRequired
    })
  ),
  xLabel: PropTypes.string.isRequired,
  yLabel: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  className: PropTypes.string
}

export default ScatterPlotAnalysis