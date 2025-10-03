import { useState, useEffect, useCallback, useMemo } from 'react'

const useAdvancedFilters = (initialFilters = {}, options = {}) => {
  const [filters, setFilters] = useState(initialFilters)
  const [isLoading, setIsLoading] = useState(false)
  const [availableOptions, setAvailableOptions] = useState(options)

  // Persistir filtros en localStorage
  const STORAGE_KEY = 'dashboard_advanced_filters'

  useEffect(() => {
    const savedFilters = localStorage.getItem(STORAGE_KEY)
    if (savedFilters) {
      try {
        const parsedFilters = JSON.parse(savedFilters)
        setFilters(prev => ({ ...prev, ...parsedFilters }))
      } catch (error) {
        console.error('Error parsing saved filters:', error)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters))
  }, [filters])

  // Actualizar filtros
  const updateFilters = useCallback((newFilters) => {
    setFilters(newFilters)
  }, [])

  // Limpiar filtros
  const clearFilters = useCallback(() => {
    setFilters({})
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  // Agregar filtro específico
  const addFilter = useCallback((filterType, value) => {
    setFilters(prev => {
      const newFilters = { ...prev }
      
      if (!newFilters[filterType]) {
        newFilters[filterType] = []
      }
      
      if (Array.isArray(newFilters[filterType])) {
        if (!newFilters[filterType].includes(value)) {
          newFilters[filterType] = [...newFilters[filterType], value]
        }
      } else {
        newFilters[filterType] = value
      }
      
      return newFilters
    })
  }, [])

  // Remover filtro específico
  const removeFilter = useCallback((filterType, value = null) => {
    setFilters(prev => {
      const newFilters = { ...prev }
      
      if (value === null) {
        // Remover todo el filtro
        delete newFilters[filterType]
      } else if (Array.isArray(newFilters[filterType])) {
        // Remover valor específico del array
        newFilters[filterType] = newFilters[filterType].filter(item => item !== value)
        if (newFilters[filterType].length === 0) {
          delete newFilters[filterType]
        }
      } else if (newFilters[filterType] === value) {
        // Remover valor único
        delete newFilters[filterType]
      }
      
      return newFilters
    })
  }, [])

  // Obtener filtros activos
  const activeFilters = useMemo(() => {
    return Object.entries(filters).reduce((acc, [key, value]) => {
      if (Array.isArray(value) && value.length > 0) {
        acc[key] = value
      } else if (!Array.isArray(value) && value !== null && value !== undefined) {
        acc[key] = value
      }
      return acc
    }, {})
  }, [filters])

  // Contar filtros activos
  const activeFiltersCount = useMemo(() => {
    return Object.keys(activeFilters).length
  }, [activeFilters])

  // Verificar si hay filtros activos
  const hasActiveFilters = useMemo(() => {
    return activeFiltersCount > 0
  }, [activeFiltersCount])

  // Generar query string para API
  const getApiFilters = useCallback(() => {
    const apiFilters = {}
    
    Object.entries(activeFilters).forEach(([key, value]) => {
      switch (key) {
        case 'areas':
          apiFilters.departamento = Array.isArray(value) ? value : [value]
          break
        case 'turnos':
          apiFilters.turno = Array.isArray(value) ? value : [value]
          break
        case 'generos':
          apiFilters.genero = Array.isArray(value) ? value : [value]
          break
        case 'edadRangos':
          apiFilters.edad_rango = Array.isArray(value) ? value : [value]
          break
        case 'tiposContrato':
          apiFilters.tipo_contrato = Array.isArray(value) ? value : [value]
          break
        case 'antiguedadRangos':
          apiFilters.antiguedad_rango = Array.isArray(value) ? value : [value]
          break
        default:
          apiFilters[key] = value
      }
    })
    
    return apiFilters
  }, [activeFilters])

  // Generar descripción legible de filtros
  const getFiltersDescription = useCallback(() => {
    if (!hasActiveFilters) return 'Sin filtros aplicados'
    
    const descriptions = []
    
    Object.entries(activeFilters).forEach(([key, value]) => {
      const values = Array.isArray(value) ? value : [value]
      const count = values.length
      
      switch (key) {
        case 'areas':
          descriptions.push(`${count} área${count > 1 ? 's' : ''}`)
          break
        case 'turnos':
          descriptions.push(`${count} turno${count > 1 ? 's' : ''}`)
          break
        case 'generos':
          descriptions.push(`${count} género${count > 1 ? 's' : ''}`)
          break
        case 'edadRangos':
          descriptions.push(`${count} rango${count > 1 ? 's' : ''} de edad`)
          break
        case 'tiposContrato':
          descriptions.push(`${count} tipo${count > 1 ? 's' : ''} de contrato`)
          break
        case 'antiguedadRangos':
          descriptions.push(`${count} rango${count > 1 ? 's' : ''} de antigüedad`)
          break
        default:
          descriptions.push(`${key}: ${count}`)
      }
    })
    
    return descriptions.join(', ')
  }, [activeFilters, hasActiveFilters])

  // Validar filtros
  const validateFilters = useCallback((filtersToValidate = filters) => {
    const errors = []
    
    Object.entries(filtersToValidate).forEach(([key, value]) => {
      if (Array.isArray(value) && value.length === 0) {
        errors.push(`${key} no puede estar vacío`)
      }
      
      if (!availableOptions[key]) {
        return // Skip validation if options not available
      }
      
      const validOptions = availableOptions[key]
      const values = Array.isArray(value) ? value : [value]
      
      values.forEach(val => {
        if (!validOptions.includes(val)) {
          errors.push(`${val} no es una opción válida para ${key}`)
        }
      })
    })
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }, [filters, availableOptions])

  // Obtener opciones disponibles para un filtro específico
  const getAvailableOptions = useCallback((filterType) => {
    return availableOptions[filterType] || []
  }, [availableOptions])

  // Actualizar opciones disponibles
  const updateAvailableOptions = useCallback((newOptions) => {
    setAvailableOptions(prev => ({ ...prev, ...newOptions }))
  }, [])

  // Aplicar filtros preestablecidos
  const applyPreset = useCallback((presetName) => {
    const presets = {
      'alto-riesgo': {
        edadRangos: ['46-55 años', '56-65 años'],
        turnos: ['Nocturno (22:00-6:00)', 'Rotativo']
      },
      'nuevos-empleados': {
        antiguedadRangos: ['Menos de 1 año', '1-3 años']
      },
      'areas-operativas': {
        areas: ['Operaciones', 'Mantenimiento', 'Producción']
      },
      'personal-administrativo': {
        areas: ['Administración', 'Recursos Humanos'],
        turnos: ['Administrativo']
      }
    }
    
    if (presets[presetName]) {
      setFilters(presets[presetName])
    }
  }, [])

  return {
    // Estado
    filters,
    activeFilters,
    activeFiltersCount,
    hasActiveFilters,
    isLoading,
    availableOptions,
    
    // Acciones
    updateFilters,
    clearFilters,
    addFilter,
    removeFilter,
    applyPreset,
    updateAvailableOptions,
    
    // Utilidades
    getApiFilters,
    getFiltersDescription,
    validateFilters,
    getAvailableOptions,
    
    // Setters
    setIsLoading
  }
}

export default useAdvancedFilters