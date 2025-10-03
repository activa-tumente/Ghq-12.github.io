import PropTypes from 'prop-types'

/**
 * Reusable loading spinner component with customizable size and message
 */
const LoadingSpinner = ({ 
  size = 'medium', 
  message = 'Cargando...', 
  className = '',
  showMessage = true 
}) => {
  const getSizeClasses = (size) => {
    const sizes = {
      small: 'h-4 w-4',
      medium: 'h-8 w-8',
      large: 'h-12 w-12'
    }
    return sizes[size] || sizes.medium
  }

  return (
    <div 
      className={`flex justify-center items-center py-12 ${className}`}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div 
        className={`animate-spin rounded-full border-b-2 border-blue-600 ${getSizeClasses(size)}`}
        aria-hidden="true"
      />
      {showMessage && (
        <span className="ml-2 text-gray-600">{message}</span>
      )}
    </div>
  )
}

LoadingSpinner.propTypes = {
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  message: PropTypes.string,
  className: PropTypes.string,
  showMessage: PropTypes.bool
}

export default LoadingSpinner