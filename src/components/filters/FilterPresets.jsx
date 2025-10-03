import React from 'react'
import { Zap, Clock, Users, Building, AlertTriangle, TrendingUp, Target, Shield } from 'lucide-react'

const FilterPresets = ({ onApplyPreset, activePreset, className = "" }) => {
  const presets = [
    {
      id: 'alto-riesgo',
      name: 'Alto Riesgo SST',
      description: 'Empleados en turnos nocturnos/rotativos y rangos de edad de mayor riesgo',
      icon: AlertTriangle,
      color: 'red',
      filters: {
        edadRangos: ['46-55 años', '56-65 años'],
        turnos: ['Nocturno (22:00-6:00)', 'Rotativo']
      },
      insights: 'Identifica personal con mayor probabilidad de fatiga y problemas de salud mental'
    },
    {
      id: 'nuevos-empleados',
      name: 'Nuevos Empleados',
      description: 'Personal con menos de 3 años de antigüedad',
      icon: Users,
      color: 'blue',
      filters: {
        antiguedadRangos: ['Menos de 1 año', '1-3 años']
      },
      insights: 'Evalúa la adaptación y necesidades de capacitación en seguridad'
    },
    {
      id: 'areas-operativas',
      name: 'Áreas Operativas',
      description: 'Departamentos con mayor exposición a riesgos físicos',
      icon: Building,
      color: 'orange',
      filters: {
        areas: ['Operaciones', 'Mantenimiento', 'Producción']
      },
      insights: 'Analiza el impacto de la exposición directa a riesgos operacionales'
    },
    {
      id: 'personal-administrativo',
      name: 'Personal Administrativo',
      description: 'Empleados en roles de oficina y horarios regulares',
      icon: Clock,
      color: 'green',
      filters: {
        areas: ['Administración', 'Recursos Humanos'],
        turnos: ['Administrativo']
      },
      insights: 'Compara bienestar entre personal operativo y administrativo'
    },
    {
      id: 'supervisores-seguridad',
      name: 'Liderazgo en Seguridad',
      description: 'Personal clave en la gestión de seguridad',
      icon: Shield,
      color: 'purple',
      filters: {
        areas: ['Seguridad', 'Mantenimiento'],
        antiguedadRangos: ['4-7 años', '8-15 años', '16-25 años']
      },
      insights: 'Evalúa el bienestar de quienes lideran la cultura de seguridad'
    },
    {
      id: 'turnos-criticos',
      name: 'Turnos Críticos',
      description: 'Empleados en horarios que afectan el ritmo circadiano',
      icon: TrendingUp,
      color: 'yellow',
      filters: {
        turnos: ['Nocturno (22:00-6:00)', 'Rotativo', 'Vespertino (14:00-22:00)']
      },
      insights: 'Analiza el impacto de horarios irregulares en la salud mental'
    },
    {
      id: 'veteranos',
      name: 'Empleados Veteranos',
      description: 'Personal con más de 15 años de experiencia',
      icon: Target,
      color: 'indigo',
      filters: {
        antiguedadRangos: ['16-25 años', 'Más de 25 años']
      },
      insights: 'Evalúa burnout y satisfacción en empleados de larga trayectoria'
    },
    {
      id: 'jovenes-operativos',
      name: 'Jóvenes Operativos',
      description: 'Empleados jóvenes en áreas de alto riesgo',
      icon: Zap,
      color: 'cyan',
      filters: {
        edadRangos: ['18-25 años', '26-35 años'],
        areas: ['Operaciones', 'Producción', 'Mantenimiento']
      },
      insights: 'Analiza la percepción de riesgo y comportamientos seguros en jóvenes'
    }
  ]

  const getColorClasses = (color, isActive = false) => {
    const colors = {
      red: isActive 
        ? 'bg-red-100 border-red-500 text-red-900' 
        : 'bg-red-50 border-red-200 text-red-800 hover:bg-red-100',
      blue: isActive 
        ? 'bg-blue-100 border-blue-500 text-blue-900' 
        : 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100',
      orange: isActive 
        ? 'bg-orange-100 border-orange-500 text-orange-900' 
        : 'bg-orange-50 border-orange-200 text-orange-800 hover:bg-orange-100',
      green: isActive 
        ? 'bg-green-100 border-green-500 text-green-900' 
        : 'bg-green-50 border-green-200 text-green-800 hover:bg-green-100',
      purple: isActive 
        ? 'bg-purple-100 border-purple-500 text-purple-900' 
        : 'bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100',
      yellow: isActive 
        ? 'bg-yellow-100 border-yellow-500 text-yellow-900' 
        : 'bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100',
      indigo: isActive 
        ? 'bg-indigo-100 border-indigo-500 text-indigo-900' 
        : 'bg-indigo-50 border-indigo-200 text-indigo-800 hover:bg-indigo-100',
      cyan: isActive 
        ? 'bg-cyan-100 border-cyan-500 text-cyan-900' 
        : 'bg-cyan-50 border-cyan-200 text-cyan-800 hover:bg-cyan-100'
    }
    return colors[color] || colors.blue
  }

  const handlePresetClick = (preset) => {
    if (activePreset === preset.id) {
      // Si ya está activo, limpiar filtros
      onApplyPreset(null)
    } else {
      // Aplicar nuevo preset
      onApplyPreset(preset.id, preset.filters)
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center space-x-2 mb-4">
        <Target className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">Filtros Preestablecidos</h3>
        <span className="text-sm text-gray-500">
          Análisis rápido por grupos de riesgo
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {presets.map((preset) => {
          const Icon = preset.icon
          const isActive = activePreset === preset.id
          
          return (
            <button
              key={preset.id}
              onClick={() => handlePresetClick(preset)}
              className={`
                p-4 border-2 rounded-lg text-left transition-all duration-200 
                ${getColorClasses(preset.color, isActive)}
                ${isActive ? 'shadow-md transform scale-105' : 'hover:shadow-sm'}
              `}
            >
              <div className="flex items-start space-x-3">
                <Icon className="w-6 h-6 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm mb-1 truncate">
                    {preset.name}
                  </h4>
                  <p className="text-xs opacity-90 mb-2 line-clamp-2">
                    {preset.description}
                  </p>
                  
                  {/* Filtros aplicados */}
                  <div className="space-y-1 mb-2">
                    {Object.entries(preset.filters).map(([filterType, values]) => (
                      <div key={filterType} className="text-xs opacity-75">
                        <span className="font-medium">
                          {filterType === 'areas' ? 'Áreas' :
                           filterType === 'turnos' ? 'Turnos' :
                           filterType === 'edadRangos' ? 'Edad' :
                           filterType === 'antiguedadRangos' ? 'Antigüedad' :
                           filterType}:
                        </span>
                        <span className="ml-1">
                          {Array.isArray(values) ? `${values.length} seleccionado${values.length > 1 ? 's' : ''}` : '1 seleccionado'}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Insight */}
                  <div className="text-xs opacity-80 italic border-t pt-2 mt-2">
                    {preset.insights}
                  </div>
                </div>
              </div>
              
              {isActive && (
                <div className="mt-3 text-xs font-medium opacity-90">
                  ✓ Filtro activo
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Información adicional */}
      <div className="bg-gray-50 rounded-lg p-4 mt-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-gray-900 mb-1">
              Cómo usar los filtros preestablecidos
            </h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Haz clic en un preset para aplicar filtros específicos al dashboard</li>
              <li>• Los presets están diseñados para análisis de SST comunes</li>
              <li>• Puedes combinar presets con filtros manuales adicionales</li>
              <li>• Haz clic nuevamente en un preset activo para desactivarlo</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FilterPresets