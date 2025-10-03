import React, { memo } from 'react';
import { CONCENTRATION_COLORS, LABELS } from '../../../../constants/riskMatrix';
import { ConcentrationLegendPropTypes } from './PropTypes';

/**
 * Componente para la leyenda de concentración de la matriz
 * Muestra la escala de colores y sus significados
 */
const ConcentrationLegend = memo(() => {
  return (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
      <h4 className="text-sm font-medium text-gray-700 mb-3">
        {LABELS.CONCENTRATION_SCALE}
      </h4>
      <div className="flex flex-wrap gap-4 items-center">
        {CONCENTRATION_LEGEND.map((item, index) => (
          <div key={index} className="flex items-center">
            <div 
              className={`w-4 h-4 rounded ${item.color} mr-2`}
              aria-hidden="true"
            />
            <span className="text-sm text-gray-600">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});

ConcentrationLegend.displayName = 'ConcentrationLegend';
ConcentrationLegend.propTypes = ConcentrationLegendPropTypes;

export default ConcentrationLegend;