import React, { useState, useEffect } from 'react'
import { Filter, X, Calendar, Users, Building, Clock, UserCheck, Briefcase, ChevronDown, Search } from 'lucide-react'

const AdvancedFilters = ({ 
  filters = {}, 
  onFiltersChange, 
  availableOptions = {},
  className = "" 
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [localFilters, setLocalFilters] = useState(filters)
  const [searchTerms, setSearchTerms] = useState({})

  // Opciones por defecto si no se proporcionan
  const defaultOptions = {
    areas: [
      'Operaciones', 'Mantenimiento', 'Administración', 'Seguridad', 
      'Recursos Humanos', 'Calidad', 'Logística', 'Producción'
    ],
    turnos: [
      'Diurno (6:00-14:00)', 'Vespertino (14:00-22:00)', 
      'Nocturno (22:00-6:00)', 'Rotativo', 'Administrativo'
    ],
    generos: ['Masculino', 'Femenino', 'Otro', 'Prefiero no decir'],
    edadRangos: [
      '18-25 años', '26-35 años', '36-45 años', 
      '46-55 años', '56-65 años', 'Más de 65 años'
    ],
    tiposContrato: [
      'Indefinido', 'Temporal', 'Por obra', 'Prácticas', 
      'Freelance', 'Consultoría'
    ],
    antiguedadRangos: [
      'Menos de 1 año', '1-3 años', '4-7 años', 
      '8-15 años', '16-25 años', 'Más de 25 años'
    ]
  }

  const options = { ...defaultOptions, ...availableOptions }

  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  const handleFilterChange = (filterType, value, isMultiple = true) => {
    const newFilters = { ...localFilters }
    
    if (isMultiple) {
      if (!newFilters[filterType]) {
        newFilters[filterType] = []
      }
      
      if (newFilters[filterType].includes(value)) {
        newFilters[filterType] = newFilters[filterType].filter(item => item !== value)
      } else {
        newFilters[filterType] = [...newFilters[filterType], value]
      }
      
      // Limpiar array vacío
      if (newFilters[filterType].length === 0) {
        delete newFilters[filterType]
      }
    } else {
      if (newFilters[filterType] === value) {
        delete newFilters[filterType]
      } else {
        newFilters[filterType] = value
      }
    }
    
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const clearAllFilters = () => {
    setLocalFilters({})
    setSearchTerms({})
    onFiltersChange({})
  }

  const getActiveFiltersCount = () => {
    return Object.keys(localFilters).length
  }

  const handleSearch = (filterType, term) => {
    setSearchTerms(prev => ({
      ...prev,
      [filterType]: term
    }))
  }

  const getFilteredOptions = (filterType, optionsList) => {
    const searchTerm = searchTerms[filterType]
    if (!searchTerm) return optionsList
    
    return optionsList.filter(option => 
      option.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const FilterSection = ({ 
    title, 
    icon: Icon, 
    filterType, 
    optionsList, 
    isMultiple = true,
    searchable = false 
  }) => {
    const filteredOptions = getFilteredOptions(filterType, optionsList)
    const selectedValues = localFilters[filterType] || (isMultiple ? [] : null)
    
    return (
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center space-x-2 mb-3">
          <Icon className="w-4 h-4 text-gray-600" />
          <h4 className="font-medium text-gray-900">{title}</h4>
          {(isMultiple ? selectedValues.length : selectedValues) > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {isMultiple ? selectedValues.length : '1'}
            </span>
          )}
        </div>
        
        {searchable && (
          <div className="relative mb-3">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={`Buscar ${title.toLowerCase()}...`}
              value={searchTerms[filterType] || ''}
              onChange={(e) => handleSearch(filterType, e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}
        
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {filteredOptions.map((option) => (
            <label key={option} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
              <input
                type={isMultiple ? "checkbox" : "radio"}
                name={filterType}
                checked={isMultiple ? selectedValues.includes(option) : selectedValues === option}
                onChange={() => handleFilterChange(filterType, option, isMultiple)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{option}</span>
            </label>
          ))}
        </div>
        
        {filteredOptions.length === 0 && searchTerms[filterType] && (
          <p className="text-sm text-gray-500 italic">No se encontraron opciones</p>
        )}
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {/* Botón principal de filtros */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
      >
        <Filter className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">
          Filtros Avanzados
        </span>
        {getActiveFiltersCount() > 0 && (
          <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
            {getActiveFiltersCount()}
          </span>
        )}
        <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Panel de filtros */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Filtros Avanzados</h3>
              <div className="flex items-center space-x-2">
                {getActiveFiltersCount() > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-red-600 hover:text-red-800 font-medium"
                  >
                    Limpiar todo
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filtros */}
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <FilterSection
                title="Área/Departamento"
                icon={Building}
                filterType="areas"
                optionsList={options.areas}
                searchable={true}
              />
              
              <FilterSection
                title="Turno de Trabajo"
                icon={Clock}
                filterType="turnos"
                optionsList={options.turnos}
              />
              
              <FilterSection
                title="Género"
                icon={Users}
                filterType="generos"
                optionsList={options.generos}
              />
              
              <FilterSection
                title="Rango de Edad"
                icon={Calendar}
                filterType="edadRangos"
                optionsList={options.edadRangos}
              />
              
              <FilterSection
                title="Tipo de Contrato"
                icon={Briefcase}
                filterType="tiposContrato"
                optionsList={options.tiposContrato}
              />
              
              <FilterSection
                title="Antigüedad"
                icon={UserCheck}
                filterType="antiguedadRangos"
                optionsList={options.antiguedadRangos}
              />
            </div>

            {/* Footer con resumen */}
            {getActiveFiltersCount() > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  <strong>{getActiveFiltersCount()}</strong> filtro(s) activo(s)
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {Object.entries(localFilters).map(([filterType, values]) => {
                    const count = Array.isArray(values) ? values.length : 1
                    return (
                      <span
                        key={filterType}
                        className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {filterType}: {count}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Overlay para cerrar */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

export default AdvancedFilters