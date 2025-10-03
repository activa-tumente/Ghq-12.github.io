import React, { memo } from 'react';
import { RISK_LEVELS, RISK_LEVEL_COLORS, LABELS } from '../../../../constants/riskMatrix';
import { MatrixHeaderPropTypes, MatrixHeaderDefaultProps } from './PropTypes';

/**
 * Componente para el encabezado de la matriz de riesgo
 * Muestra los niveles de riesgo como columnas
 */
const MatrixHeader = memo(() => {
  return (
    <div className="grid grid-cols-8 gap-1 mb-2" role="row">
      {/* Encabezado de departamento */}
      <div 
        className="p-3 bg-gray-100 font-semibold text-sm text-gray-700 rounded"
        role="columnheader"
      >
        {LABELS.DEPARTMENT}
      </div>
      
      {/* Encabezados de niveles de riesgo */}
      {RISK_LEVELS.map((level) => (
        <div
          key={level}
          className={`p-3 font-semibold text-xs text-center rounded ${RISK_LEVEL_COLORS[level]}`}
          role="columnheader"
          title={`Nivel de riesgo: ${level}`}
        >
          {level}
        </div>
      ))}
      
      {/* Encabezado de riesgo promedio */}
      <div 
        className="p-3 bg-gray-100 font-semibold text-sm text-gray-700 text-center rounded"
        role="columnheader"
      >
        {LABELS.AVERAGE_RISK}
      </div>
    </div>
  );
});

MatrixHeader.displayName = 'MatrixHeader';
MatrixHeader.propTypes = MatrixHeaderPropTypes;
MatrixHeader.defaultProps = MatrixHeaderDefaultProps;

export default MatrixHeader;