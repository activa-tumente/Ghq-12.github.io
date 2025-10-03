import React, { memo, useCallback } from 'react';
import { CONCENTRATION_COLORS, ACCESSIBILITY_CONFIG } from '../../../../constants/riskMatrix';
import { MatrixCellPropTypes, MatrixCellDefaultProps } from './PropTypes';

/**
 * Componente para una celda individual de la matriz de riesgo
 * Optimizado con memo y useCallback para mejor performance
 */
const MatrixCell = memo(({ 
  department, 
  level, 
  percentage, 
  isSelected, 
  onCellClick 
}) => {
  // Función para obtener el color de la celda basado en el porcentaje
  const getCellColor = useCallback((percentage) => {
    const colorConfig = CONCENTRATION_COLORS.find(
      config => percentage >= config.min && percentage <= config.max
    );
    return colorConfig?.class || 'bg-gray-50 text-gray-400';
  }, []);

  // Handler optimizado para clicks
  const handleClick = useCallback(() => {
    onCellClick(isSelected ? null : { department, level, percentage });
  }, [department, level, percentage, isSelected, onCellClick]);

  // Handler para navegación por teclado
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }, [handleClick]);

  return (
    <button
      className={`
        p-3 text-xs font-medium rounded ${ACCESSIBILITY_CONFIG.TRANSITION} ${ACCESSIBILITY_CONFIG.HOVER_SCALE} ${ACCESSIBILITY_CONFIG.FOCUS_RING}
        ${getCellColor(percentage)}
        ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
      `}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={`${department}, ${level}: ${percentage.toFixed(1)}%`}
      title={`${percentage.toFixed(1)}% de usuarios en ${level}`}
      role="gridcell"
      tabIndex={0}
    >
      {percentage.toFixed(1)}%
    </button>
  );
});

MatrixCell.displayName = 'MatrixCell';
MatrixCell.propTypes = MatrixCellPropTypes;
MatrixCell.defaultProps = MatrixCellDefaultProps;

export default MatrixCell;