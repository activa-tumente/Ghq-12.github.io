import PropTypes from 'prop-types';

/**
 * PropTypes para los componentes de la Matriz de Riesgo
 * Proporciona validación de tipos y documentación de las props
 */

// PropTypes para MatrixCell
export const MatrixCellPropTypes = {
  department: PropTypes.string.isRequired,
  level: PropTypes.oneOf(['Muy Bajo', 'Bajo', 'Moderado', 'Alto', 'Muy Alto']).isRequired,
  percentage: PropTypes.number.isRequired,
  isSelected: PropTypes.bool.isRequired,
  onCellClick: PropTypes.func.isRequired,
  getCellColor: PropTypes.func.isRequired
};

// PropTypes para MatrixHeader
export const MatrixHeaderPropTypes = {
  riskLevels: PropTypes.arrayOf(PropTypes.string),
  getRiskLevelColor: PropTypes.func
};

// PropTypes para DetailPanel
export const DetailPanelPropTypes = {
  selectedCell: PropTypes.shape({
    department: PropTypes.string.isRequired,
    level: PropTypes.string.isRequired,
    percentage: PropTypes.number.isRequired
  })
};

// PropTypes para ConcentrationLegend
export const ConcentrationLegendPropTypes = {
  // No requiere props específicas
};

// PropTypes para RiskMatrixHeatmap
export const RiskMatrixHeatmapPropTypes = {
  // Props opcionales para configuración futura
  showLegend: PropTypes.bool,
  showDetailPanel: PropTypes.bool,
  onCellSelect: PropTypes.func,
  customColors: PropTypes.object
};

// Default props para componentes
export const MatrixCellDefaultProps = {
  isSelected: false
};

export const MatrixHeaderDefaultProps = {
  riskLevels: ['Muy Bajo', 'Bajo', 'Moderado', 'Alto', 'Muy Alto'],
  getRiskLevelColor: () => 'bg-gray-500'
};

export const DetailPanelDefaultProps = {
  selectedCell: null
};

export const RiskMatrixHeatmapDefaultProps = {
  showLegend: true,
  showDetailPanel: true,
  onCellSelect: null,
  customColors: null
};