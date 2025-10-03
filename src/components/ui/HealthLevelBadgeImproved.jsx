/**
 * Improved Health Level Badge Component
 * Enhanced version with better accessibility, performance, and maintainability
 */

import React, { memo } from 'react'
import { getHealthLevelConfig } from '../../config/healthLevels'

const HealthLevelBadgeImproved = memo(({ 
  level, 
  showIcon = true, 
  showEmoji = true,
  size = 'md',
  variant = 'default',
  className = '',
  onClick,
  ariaLabel,
  testId
}) => {
  const config = getHealthLevelConfig(level)
  const Icon = config.icon

  // Size configurations
  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-xs',
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
    xl: 'px-5 py-2.5 text-lg'
  }

  const iconSizes = {
    xs: 'h-2.5 w-2.5',
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
    xl: 'h-6 w-6'
  }

  const emojiSizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  }

  // Variant configurations
  const variantClasses = {
    default: `${config.bgColor} ${config.textColor} ${config.borderColor}`,
    outline: `border-2 ${config.borderColor} ${config.textColor} bg-transparent`,
    solid: `${config.bgColor.replace('100', '500')} text-white border-transparent`,
    subtle: `${config.bgColor.replace('100', '50')} ${config.textColor} border-transparent`
  }

  // Accessibility attributes
  const accessibilityProps = {
    role: onClick ? 'button' : 'status',
    'aria-label': ariaLabel || `Nivel de salud: ${config.label}. ${config.description}`,
    tabIndex: onClick ? 0 : undefined,
    'data-testid': testId || `health-level-badge-${level}`,
    'aria-describedby': `health-level-description-${level}`
  }

  // Keyboard event handler
  const handleKeyDown = (event) => {
    if (onClick && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault()
      onClick(level, config)
    }
  }

  // Mouse event handler
  const handleClick = () => {
    if (onClick) {
      onClick(level, config)
    }
  }

  // Base classes
  const baseClasses = [
    'inline-flex',
    'items-center',
    'gap-1.5',
    'font-semibold',
    'rounded-full',
    'border',
    'transition-all',
    'duration-200',
    sizeClasses[size],
    variantClasses[variant]
  ]

  // Interactive classes
  if (onClick) {
    baseClasses.push(
      'cursor-pointer',
      'hover:shadow-md',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-offset-2',
      `focus:ring-${config.textColor.split('-')[1]}-500`,
      'active:scale-95'
    )
  }

  // Combine all classes
  const finalClasses = [...baseClasses, className].filter(Boolean).join(' ')

  return (
    <>
      <span 
        className={finalClasses}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        {...accessibilityProps}
      >
        {/* Visual indicators */}
        {showEmoji && (
          <span 
            className={`${emojiSizes[size]} select-none`}
            aria-hidden="true"
          >
            {config.emoji}
          </span>
        )}
        
        {showIcon && Icon && (
          <Icon 
            className={`${iconSizes[size]} ${config.iconColor} flex-shrink-0`}
            aria-hidden="true"
          />
        )}
        
        {/* Label */}
        <span className="select-none">
          {config.label}
        </span>
        
        {/* Screen reader only description */}
        <span className="sr-only">
          {config.description}
        </span>
      </span>
      
      {/* Hidden description for screen readers */}
      <div 
        id={`health-level-description-${level}`}
        className="sr-only"
      >
        {config.description}
      </div>
    </>
  )
})

// Display name for debugging
HealthLevelBadgeImproved.displayName = 'HealthLevelBadgeImproved'

// PropTypes for development
if (process.env.NODE_ENV === 'development') {
  HealthLevelBadgeImproved.propTypes = {
    level: (props, propName, componentName) => {
      const validLevels = ['bajo', 'moderado', 'alto', 'muy_alto', 'sin_datos']
      if (props[propName] && !validLevels.includes(props[propName])) {
        return new Error(
          `Invalid prop \`${propName}\` of value \`${props[propName]}\` supplied to \`${componentName}\`, expected one of ${validLevels.join(', ')}.`
        )
      }
    }
  }
}

// Compound components for specific use cases
HealthLevelBadgeImproved.Small = (props) => (
  <HealthLevelBadgeImproved {...props} size="sm" />
)

HealthLevelBadgeImproved.Large = (props) => (
  <HealthLevelBadgeImproved {...props} size="lg" />
)

HealthLevelBadgeImproved.Outline = (props) => (
  <HealthLevelBadgeImproved {...props} variant="outline" />
)

HealthLevelBadgeImproved.Clickable = (props) => (
  <HealthLevelBadgeImproved 
    {...props} 
    onClick={props.onClick || (() => {})} 
  />
)

// Utility function to get badge color for external use
export const getHealthLevelBadgeColor = (level) => {
  const config = getHealthLevelConfig(level)
  return {
    background: config.bgColor,
    text: config.textColor,
    border: config.borderColor
  }
}

// Hook for health level badge state
export const useHealthLevelBadge = (level) => {
  const config = getHealthLevelConfig(level)
  
  return {
    config,
    isHighRisk: ['alto', 'muy_alto'].includes(level),
    isLowRisk: level === 'bajo',
    isModerate: level === 'moderado',
    hasData: level !== 'sin_datos'
  }
}

export default HealthLevelBadgeImproved