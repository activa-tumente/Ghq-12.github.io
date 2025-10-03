import React from 'react'
import { AlertTriangle, CheckCircle, AlertCircle, XCircle } from 'lucide-react'

const HealthLevelBadge = ({ level, showIcon = true, size = 'md' }) => {
  const levelConfig = {
    bajo: {
      label: 'Bajo',
      emoji: '🟢',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      borderColor: 'border-green-200',
      icon: CheckCircle,
      iconColor: 'text-green-600'
    },
    moderado: {
      label: 'Moderado',
      emoji: '🟡',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
      borderColor: 'border-yellow-200',
      icon: AlertCircle,
      iconColor: 'text-yellow-600'
    },
    alto: {
      label: 'Alto',
      emoji: '🟠',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-800',
      borderColor: 'border-orange-200',
      icon: AlertTriangle,
      iconColor: 'text-orange-600'
    },
    muy_alto: {
      label: 'Muy Alto',
      emoji: '🔴',
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      borderColor: 'border-red-200',
      icon: XCircle,
      iconColor: 'text-red-600'
    },
    sin_datos: {
      label: 'Sin Datos',
      emoji: '⚪',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-800',
      borderColor: 'border-gray-200',
      icon: AlertCircle,
      iconColor: 'text-gray-600'
    }
  }

  const config = levelConfig[level] || levelConfig.sin_datos
  const Icon = config.icon

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }

  return (
    <span className={`
      inline-flex items-center gap-1.5 font-semibold rounded-full border
      ${config.bgColor} ${config.textColor} ${config.borderColor}
      ${sizeClasses[size]}
    `}>
      {showIcon && (
        <>
          <span className="text-sm">{config.emoji}</span>
          <Icon className={`${iconSizes[size]} ${config.iconColor}`} />
        </>
      )}
      {config.label}
    </span>
  )
}

export default HealthLevelBadge