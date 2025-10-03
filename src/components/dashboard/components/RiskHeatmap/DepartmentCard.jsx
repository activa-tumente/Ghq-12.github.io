import React from 'react';
import { RISK_THRESHOLDS, RISK_COLORS } from './constants';
import { getRiskLabel } from '../../../../utils/riskUtils';

/**
 * Obtiene el nivel de riesgo basado en el valor
 * @param {number} riskValue - Valor de riesgo (0-100)
 * @returns {string} Nivel de riesgo
 */
const getRiskLevel = (riskValue) => {
  if (riskValue >= RISK_THRESHOLDS.HIGH) return 'CRITICAL';
  if (riskValue >= RISK_THRESHOLDS.MODERATE) return 'HIGH';
  if (riskValue >= RISK_THRESHOLDS.LOW) return 'MODERATE';
  return 'LOW';
};

/**
 * Componente de barra de progreso mejorado
 */
const ProgressBar = ({ value, max = 100, className = '' }) => {
  const level = getRiskLevel(value);
  const colors = RISK_COLORS[level];
  
  return (
    <div className={`h-2 bg-gray-200 rounded-full overflow-hidden ${className}`}>
      <div 
        className={`h-full ${colors.progress} transition-all duration-300`}
        style={{ width: `${Math.min((value / max) * 100, 100)}%` }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={`Nivel de riesgo: ${value.toFixed(1)}%`}
      />
    </div>
  );
};

/**
 * Tarjeta de departamento con información de riesgo
 * @param {Object} props - Propiedades del componente
 * @param {string} props.department - Nombre del departamento
 * @param {number} props.riskValue - Valor de riesgo (0-100)
 * @param {React.Component} props.IconComponent - Componente de icono
 * @param {number} props.averageRisk - Riesgo promedio para comparación
 * @param {Function} props.onClick - Función de click opcional
 */
const DepartmentCard = ({ 
  department, 
  riskValue, 
  IconComponent, 
  averageRisk,
  onClick 
}) => {
  const level = getRiskLevel(riskValue);
  const colors = RISK_COLORS[level];
  const riskLabel = getRiskLabel(riskValue);
  const isAboveAverage = riskValue > averageRisk;

  return (
    <div 
      className={`
        p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md cursor-pointer
        ${colors.bg} ${colors.border}
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
      `}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Departamento ${department}, riesgo ${riskLabel}: ${riskValue.toFixed(1)}%`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <IconComponent 
            className={`w-5 h-5 ${colors.text}`} 
            aria-hidden="true"
          />
          <span className="font-medium text-gray-900 text-sm">
            {department}
          </span>
        </div>
        <div className={`px-2 py-1 rounded text-xs font-medium ${colors.badge}`}>
          {riskValue.toFixed(1)}%
        </div>
      </div>
      
      <div className="space-y-1">
        <ProgressBar value={riskValue} className="h-2" />
        <div className="flex justify-between text-xs text-gray-600">
          <span>{riskLabel}</span>
          <span className="font-medium flex items-center gap-1">
            {isAboveAverage ? '↑' : '↓'} 
            <span className="sr-only">
              {isAboveAverage ? 'Sobre' : 'Bajo'} promedio
            </span>
            Promedio
          </span>
        </div>
      </div>
    </div>
  );
};

export default DepartmentCard;