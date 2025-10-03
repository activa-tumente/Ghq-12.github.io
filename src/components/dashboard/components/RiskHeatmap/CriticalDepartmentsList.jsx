import React from 'react';
import { MdWarning } from 'react-icons/md';

/**
 * Lista de departamentos críticos con accesibilidad mejorada
 * @param {Object} props - Propiedades del componente
 * @param {Array} props.criticalDepartments - Lista de departamentos críticos
 * @param {Object} props.departmentIcons - Mapeo de iconos por departamento
 */
const CriticalDepartmentsList = ({ criticalDepartments, departmentIcons }) => {
  if (criticalDepartments.length === 0) {
    return null;
  }

  return (
    <section 
      className="bg-red-50 border border-red-200 rounded-lg p-4"
      role="region"
      aria-labelledby="critical-departments-heading"
    >
      <div className="flex items-center gap-2 mb-3">
        <MdWarning 
          className="w-4 h-4 text-red-600" 
          aria-hidden="true"
        />
        <h4 
          id="critical-departments-heading"
          className="text-sm font-medium text-red-900"
        >
          Atención Prioritaria
        </h4>
        <span className="sr-only">
          {criticalDepartments.length} departamentos requieren atención inmediata
        </span>
      </div>
      
      <ul 
        className="space-y-2"
        role="list"
        aria-label="Departamentos con mayor riesgo"
      >
        {criticalDepartments.slice(0, 3).map((dept, index) => {
          const IconComponent = departmentIcons[dept.name] || departmentIcons.default;
          
          return (
            <li 
              key={`critical-${dept.name}`}
              className="flex items-center justify-between text-sm"
              role="listitem"
            >
              <div className="flex items-center gap-2">
                <span 
                  className="w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold"
                  aria-label={`Posición ${index + 1}`}
                >
                  {index + 1}
                </span>
                <IconComponent 
                  className="w-4 h-4 text-red-600" 
                  aria-hidden="true"
                />
                <span className="font-medium text-red-900">
                  {dept.name}
                </span>
              </div>
              <span 
                className="font-bold text-red-700"
                aria-label={`Nivel de riesgo: ${dept.risk.toFixed(1)} por ciento`}
              >
                {dept.risk.toFixed(1)}%
              </span>
            </li>
          );
        })}
      </ul>
      
      {criticalDepartments.length > 3 && (
        <p className="text-xs text-red-700 mt-2">
          Y {criticalDepartments.length - 3} departamentos más requieren atención
        </p>
      )}
    </section>
  );
};

export default CriticalDepartmentsList;