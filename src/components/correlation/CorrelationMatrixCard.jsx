import React, { memo } from 'react'
import { Info } from 'lucide-react'
import PropTypes from 'prop-types'

/**
 * Componente para mostrar una matriz de correlación en formato de tarjetas
 * Optimizado con React.memo para evitar re-renders innecesarios
 */
const CorrelationMatrixCard = memo(({ correlationData, className = '' }) => {
  // Early return si no hay datos
  if (!correlationData || correlationData.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No hay datos de correlación disponibles</p>
      </div>
    )
  }

  /**
   * Obtiene el color basado en el valor de correlación
   * @param {number} value - Valor de correlación (-1 a 1)
   * @returns {string} Color hexadecimal
   */
  const getCorrelationColor = (value) => {
    const absValue = Math.abs(value)
    if (absValue >= 0.7) return value > 0 ? '#10b981' : '#ef4444' // Verde fuerte / Rojo fuerte
    if (absValue >= 0.5) return value > 0 ? '#34d399' : '#f87171' // Verde medio / Rojo medio
    if (absValue >= 0.3) return value > 0 ? '#6ee7b7' : '#fca5a5' // Verde claro / Rojo claro
    return '#e5e7eb' // Gris - correlación débil
  }

  /**
   * Obtiene la descripción textual de la correlación
   * @param {number} value - Valor de correlación (-1 a 1)
   * @returns {string} Descripción de la fuerza de correlación
   */
  const getCorrelationText = (value) => {
    const absValue = Math.abs(value)
    if (absValue >= 0.7) return 'Fuerte'
    if (absValue >= 0.5) return 'Moderada'
    if (absValue >= 0.3) return 'Débil'
    return 'Muy débil'
  }

  /**
   * Determina si la correlación es estadísticamente significativa
   * @param {number} significance - Valor p de significancia
   * @returns {boolean} True si es significativa (p < 0.05)
   */
  const isSignificant = (significance) => significance < 0.05

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Grid de correlaciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {correlationData.map((item, index) => {
          const color = getCorrelationColor(item.correlacion)
          const strength = getCorrelationText(item.correlacion)
          const significant = isSignificant(item.significancia)
          
          return (
            <div
              key={`correlation-${index}`}
              className="p-4 rounded-lg border-2 transition-all duration-300 hover:scale-105 hover:shadow-md"
              style={{
                backgroundColor: `${color}20`,
                borderColor: color
              }}
              role="article"
              aria-label={`Correlación entre ${item.variable_x} y ${item.variable_y}`}
            >
              <div className="text-center">
                <div className="text-sm font-medium text-gray-700 mb-2">
                  {item.variable_x} vs {item.variable_y}
                </div>
                <div 
                  className="text-2xl font-bold mb-1"
                  style={{ color }}
                  aria-label={`Valor de correlación: ${item.correlacion.toFixed(3)}`}
                >
                  {item.correlacion.toFixed(3)}
                </div>
                <div className="text-xs text-gray-600 mb-1">
                  {strength}
                </div>
                <div className={`text-xs mt-1 ${significant ? 'text-green-600' : 'text-gray-500'}`}>
                  {significant ? 'Significativa' : 'No significativa'}
                </div>
                {significant && (
                  <div className="text-xs text-gray-400 mt-1">
                    p = {item.significancia.toFixed(3)}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Leyenda mejorada */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Interpretación de Correlaciones</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ef4444' }}></div>
            <span>Negativa fuerte</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f87171' }}></div>
            <span>Negativa moderada</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#34d399' }}></div>
            <span>Positiva moderada</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10b981' }}></div>
            <span>Positiva fuerte</span>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          * Solo se muestran correlaciones estadísticamente significativas (p &lt; 0.05)
        </div>
      </div>
    </div>
  )
})

// Configurar displayName para debugging
CorrelationMatrixCard.displayName = 'CorrelationMatrixCard'

// PropTypes para validación de tipos
CorrelationMatrixCard.propTypes = {
  correlationData: PropTypes.arrayOf(
    PropTypes.shape({
      variable_x: PropTypes.string.isRequired,
      variable_y: PropTypes.string.isRequired,
      correlacion: PropTypes.number.isRequired,
      significancia: PropTypes.number.isRequired
    })
  ),
  className: PropTypes.string
}

export default CorrelationMatrixCard