import React, { useState } from 'react';

const AdvancedFilters = ({ onFiltersChange, initialFilters = {} }) => {
  const [filters, setFilters] = useState({
    ageRange: initialFilters.ageRange || [18, 65],
    tenureRange: initialFilters.tenureRange || [0, 40],
    macroArea: initialFilters.macroArea || '',
    position: initialFilters.position || '',
    shift: initialFilters.shift || '',
    gender: initialFilters.gender || '',
    riskLevel: initialFilters.riskLevel || '',
    educationLevel: initialFilters.educationLevel || '',
    department: initialFilters.department || '',
    hasAccidents: initialFilters.hasAccidents || ''
  });

  const handleFilterChange = (filterName, value) => {
    const newFilters = { ...filters, [filterName]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleRangeChange = (filterName, index, value) => {
    const newRange = [...filters[filterName]];
    newRange[index] = parseInt(value);
    handleFilterChange(filterName, newRange);
  };

  const clearFilters = () => {
    const emptyFilters = {
      ageRange: [18, 65],
      tenureRange: [0, 40],
      macroArea: '',
      position: '',
      shift: '',
      gender: '',
      riskLevel: '',
      educationLevel: '',
      department: '',
      hasAccidents: ''
    };
    setFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  // Opciones para los select
  const filterOptions = {
    macroAreas: ['Producción', 'Calidad', 'Mantenimiento', 'Logística', 'Administración', 'RRHH'],
    positions: ['Operario', 'Supervisor', 'Coordinador', 'Gerente', 'Director', 'Analista'],
    shifts: ['Mañana', 'Tarde', 'Noche', 'Mixto', 'Rotativo'],
    genders: ['Masculino', 'Femenino', 'Otro'],
    riskLevels: ['Muy Bajo', 'Bajo', 'Moderado', 'Alto', 'Muy Alto'],
    educationLevels: ['Primaria', 'Secundaria', 'Técnico', 'Universitario', 'Posgrado'],
    departments: ['Producción', 'Calidad', 'Mantenimiento', 'Logística', 'Administración', 'TI', 'Finanzas'],
    accidentOptions: ['Con accidentes', 'Sin accidentes', 'Todos']
  };

  const activeFiltersCount = Object.values(filters).filter(value => 
    Array.isArray(value) ? value.some(v => v !== (value === filters.ageRange ? 18 : 0)) : value !== ''
  ).length;

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Filtros Avanzados
        </h3>
        <div className="flex items-center gap-2">
          {activeFiltersCount > 0 && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
              {activeFiltersCount} activos
            </span>
          )}
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Limpiar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Rango de Edad */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rango de Edad
          </label>
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-500">
              <span>{filters.ageRange[0]} años</span>
              <span>{filters.ageRange[1]} años</span>
            </div>
            <input
              type="range"
              min="18"
              max="65"
              value={filters.ageRange[0]}
              onChange={(e) => handleRangeChange('ageRange', 0, e.target.value)}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <input
              type="range"
              min="18"
              max="65"
              value={filters.ageRange[1]}
              onChange={(e) => handleRangeChange('ageRange', 1, e.target.value)}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Rango de Antigüedad */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Antigüedad (años)
          </label>
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-500">
              <span>{filters.tenureRange[0]} años</span>
              <span>{filters.tenureRange[1]} años</span>
            </div>
            <input
              type="range"
              min="0"
              max="40"
              value={filters.tenureRange[0]}
              onChange={(e) => handleRangeChange('tenureRange', 0, e.target.value)}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <input
              type="range"
              min="0"
              max="40"
              value={filters.tenureRange[1]}
              onChange={(e) => handleRangeChange('tenureRange', 1, e.target.value)}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Área Macro */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Área Macro
          </label>
          <select
            value={filters.macroArea}
            onChange={(e) => handleFilterChange('macroArea', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas las áreas</option>
            {filterOptions.macroAreas.map(area => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
        </div>

        {/* Cargo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cargo
          </label>
          <select
            value={filters.position}
            onChange={(e) => handleFilterChange('position', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los cargos</option>
            {filterOptions.positions.map(position => (
              <option key={position} value={position}>{position}</option>
            ))}
          </select>
        </div>

        {/* Turno */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Turno
          </label>
          <select
            value={filters.shift}
            onChange={(e) => handleFilterChange('shift', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los turnos</option>
            {filterOptions.shifts.map(shift => (
              <option key={shift} value={shift}>{shift}</option>
            ))}
          </select>
        </div>

        {/* Género */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Género
          </label>
          <select
            value={filters.gender}
            onChange={(e) => handleFilterChange('gender', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos</option>
            {filterOptions.genders.map(gender => (
              <option key={gender} value={gender}>{gender}</option>
            ))}
          </select>
        </div>

        {/* Nivel de Riesgo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nivel de Riesgo
          </label>
          <select
            value={filters.riskLevel}
            onChange={(e) => handleFilterChange('riskLevel', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los niveles</option>
            {filterOptions.riskLevels.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>

        {/* Nivel Educativo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nivel Educativo
          </label>
          <select
            value={filters.educationLevel}
            onChange={(e) => handleFilterChange('educationLevel', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los niveles</option>
            {filterOptions.educationLevels.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>

        {/* Departamento */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Departamento
          </label>
          <select
            value={filters.department}
            onChange={(e) => handleFilterChange('department', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los departamentos</option>
            {filterOptions.departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        {/* Historial de Accidentes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Historial de Accidentes
          </label>
          <select
            value={filters.hasAccidents}
            onChange={(e) => handleFilterChange('hasAccidents', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos</option>
            {filterOptions.accidentOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Resumen de filtros activos */}
      {activeFiltersCount > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Filtros Activos:</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(filters).map(([key, value]) => {
              if (Array.isArray(value)) {
                if (value[0] !== (key === 'ageRange' ? 18 : 0) || value[1] !== (key === 'ageRange' ? 65 : 40)) {
                  return (
                    <span key={key} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {key === 'ageRange' ? 'Edad' : 'Antigüedad'}: {value[0]}-{value[1]}
                    </span>
                  );
                }
              } else if (value !== '') {
                return (
                  <span key={key} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {key}: {value}
                  </span>
                );
              }
              return null;
            }).filter(Boolean)}
          </div>
        </div>
      )}

      {/* Estadísticas de filtrado */}
      <div className="mt-6 grid grid-cols-3 gap-4 text-xs">
        <div className="text-center p-2 bg-gray-100 rounded">
          <div className="font-semibold text-gray-900">10</div>
          <div className="text-gray-600">Criterios disponibles</div>
        </div>
        <div className="text-center p-2 bg-gray-100 rounded">
          <div className="font-semibold text-gray-900">{activeFiltersCount}</div>
          <div className="text-gray-600">Filtros activos</div>
        </div>
        <div className="text-center p-2 bg-gray-100 rounded">
          <div className="font-semibold text-gray-900">87%</div>
          <div className="text-gray-600">Población filtrada</div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedFilters;