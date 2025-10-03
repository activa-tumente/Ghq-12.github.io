import PropTypes from 'prop-types'
import { Eye, Edit, Trash2, Download } from 'lucide-react'

/**
 * Reusable action buttons component for questionnaire cards
 */
const ActionButtons = ({ 
  onView, 
  onEdit, 
  onDelete, 
  onExport, 
  item,
  showExport = true,
  className = '' 
}) => {
  const buttonBaseClass = "p-2 text-gray-400 hover:bg-opacity-10 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"

  const itemTitle = item?.titulo || 'elemento';

  return (
    <div className={`flex items-center justify-between pt-4 border-t border-gray-200 ${className}`}>
      <div className="flex space-x-2">
        <button
          onClick={() => onView(item)}
          className={`${buttonBaseClass} hover:text-blue-600 hover:bg-blue-50 focus:ring-blue-500`}
          title={`Ver detalles de ${itemTitle}`}
          aria-label={`Ver detalles de ${itemTitle}`}
        >
          <Eye size={16} />
        </button>
        
        <button
          onClick={() => onEdit(item)}
          className={`${buttonBaseClass} hover:text-green-600 hover:bg-green-50 focus:ring-green-500`}
          title={`Editar cuestionario de ${itemTitle}`}
          aria-label={`Editar cuestionario de ${itemTitle}`}
        >
          <Edit size={16} />
        </button>
        
        <button
          onClick={() => onDelete(item)}
          className={`${buttonBaseClass} hover:text-red-600 hover:bg-red-50 focus:ring-red-500`}
          title={`Eliminar cuestionario de ${itemTitle}`}
          aria-label={`Eliminar cuestionario de ${itemTitle}`}
        >
          <Trash2 size={16} />
        </button>
      </div>
      
      {showExport && (
        <button
          onClick={() => onExport(item)}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg px-2 py-1"
          title={`Exportar datos de ${itemTitle}`}
          aria-label={`Exportar datos de ${itemTitle}`}
        >
          <Download size={16} />
          <span>Exportar</span>
        </button>
      )}
    </div>
  )
}

ActionButtons.propTypes = {
  onView: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onExport: PropTypes.func.isRequired,
  item: PropTypes.object.isRequired,
  showExport: PropTypes.bool,
  className: PropTypes.string
}

export default ActionButtons