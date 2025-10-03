import PropTypes from 'prop-types'

/**
 * Reusable status badge component with consistent styling
 */
const StatusBadge = ({ status, className = '' }) => {
  const getStatusConfig = (estado) => {
    const configs = {
      completado: {
        className: 'bg-green-100 text-green-800',
        text: 'Completado'
      },
      en_progreso: {
        className: 'bg-yellow-100 text-yellow-800',
        text: 'En Progreso'
      },
      pendiente: {
        className: 'bg-gray-100 text-gray-800',
        text: 'Pendiente'
      },
      demo: {
        className: 'bg-purple-100 text-purple-800',
        text: 'Demo'
      }
    }
    
    return configs[estado] || {
      className: 'bg-gray-100 text-gray-800',
      text: 'Desconocido'
    }
  }

  const config = getStatusConfig(status)

  return (
    <span 
      className={`px-2 py-1 rounded-full text-xs font-medium ${config.className} ${className}`}
      role="status"
      aria-label={`Estado: ${config.text}`}
    >
      {config.text}
    </span>
  )
}

StatusBadge.propTypes = {
  status: PropTypes.oneOf(['completado', 'en_progreso', 'pendiente', 'demo']).isRequired,
  className: PropTypes.string
}

export default StatusBadge