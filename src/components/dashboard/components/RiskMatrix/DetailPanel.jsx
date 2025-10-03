import React, { memo, useMemo } from 'react';
import { AlertTriangle, TrendingUp, Users, Shield } from 'lucide-react';
import { 
  CONCENTRATION_THRESHOLDS, 
  CONCENTRATION_MESSAGES,
  RECOMMENDATION_TEMPLATES,
  RECOMMENDATION_THRESHOLDS,
  LABELS 
} from '../../../../constants/riskMatrix';
import { DetailPanelPropTypes, DetailPanelDefaultProps } from './PropTypes';

/**
 * Componente para mostrar detalles de la celda seleccionada
 * Incluye análisis y recomendaciones dinámicas
 */
const DetailPanel = memo(({ selectedCell }) => {
  // Generar interpretación de la concentración
  const interpretation = useMemo(() => {
    const { percentage } = selectedCell;
    
    if (percentage === 0) return CONCENTRATION_MESSAGES.NONE;
    if (percentage > CONCENTRATION_THRESHOLDS.VERY_HIGH) return CONCENTRATION_MESSAGES.VERY_HIGH;
    if (percentage > CONCENTRATION_THRESHOLDS.HIGH) return CONCENTRATION_MESSAGES.HIGH;
    if (percentage > CONCENTRATION_THRESHOLDS.MODERATE) return CONCENTRATION_MESSAGES.MODERATE;
    return CONCENTRATION_MESSAGES.LOW;
  }, [selectedCell.percentage]);

  // Generar recomendaciones dinámicas
  const recommendations = useMemo(() => {
    const { department, level, percentage } = selectedCell;
    
    if (level === 'Muy Alto' && percentage > RECOMMENDATION_THRESHOLDS.VERY_HIGH_CRITICAL) {
      return RECOMMENDATION_TEMPLATES.VERY_HIGH_CRITICAL(department, percentage);
    }
    
    if (level === 'Alto' && percentage > RECOMMENDATION_THRESHOLDS.HIGH_PRIORITY) {
      return RECOMMENDATION_TEMPLATES.HIGH_PRIORITY(department, percentage);
    }
    
    if (level === 'Moderado' && percentage > RECOMMENDATION_THRESHOLDS.MODERATE_PREVENTIVE) {
      return RECOMMENDATION_TEMPLATES.MODERATE_PREVENTIVE(department, percentage);
    }
    
    if (level === 'Bajo' || level === 'Muy Bajo') {
      return RECOMMENDATION_TEMPLATES.LOW_MAINTAIN(department);
    }
    
    // Recomendaciones por defecto para casos no cubiertos
    return [
      `📊 Monitorear la situación en ${department}`,
      `📋 Evaluar factores específicos del ${percentage.toFixed(1)}% en ${level}`,
      `🔍 Investigar causas subyacentes del riesgo`
    ];
  }, [selectedCell]);

  if (!selectedCell) return null;

  const { department, level, percentage } = selectedCell;

  return (
    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <h4 className="font-medium text-blue-900 mb-3">
        📊 Análisis Detallado: {department} - {level}
      </h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-blue-700 font-medium">Concentración:</span>
          <div className="text-blue-900 text-lg font-bold">
            {percentage.toFixed(1)}%
          </div>
          <div className="text-blue-600 text-xs">
            de usuarios en este nivel
          </div>
        </div>
        
        <div>
          <span className="text-blue-700 font-medium">Interpretación:</span>
          <div className="text-blue-900">
            {interpretation}
          </div>
        </div>
      </div>

      {/* Acciones recomendadas dinámicas */}
      <div className="mt-4">
        <h5 className="text-blue-800 font-medium mb-2">
          🎯 Acciones Recomendadas:
        </h5>
        <ul className="text-blue-700 text-sm space-y-1">
          {recommendations.map((recommendation, index) => (
            <li key={index}>• {recommendation}</li>
          ))}
        </ul>
      </div>
    </div>
  );
});

DetailPanel.displayName = 'DetailPanel';
DetailPanel.propTypes = DetailPanelPropTypes;
DetailPanel.defaultProps = DetailPanelDefaultProps;

export default DetailPanel;