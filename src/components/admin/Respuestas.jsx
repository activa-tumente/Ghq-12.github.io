import { useState } from 'react'
import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import useResponses from '../../hooks/useResponses'
import { HEALTH_LEVELS } from '../../config/healthLevels'
import LoadingSpinner from '../ui/LoadingSpinner'
import HealthLevelBadge from '../ui/HealthLevelBadge'
import AccessibleModal from '../ui/AccessibleModal'
import Notification from '../ui/Notification'

const Respuestas = () => {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteSuccess, setDeleteSuccess] = useState(false)
  
  // Usar el hook optimizado
  const {
    // Estado
    respuestas,
    loading,
    error,
    searchTerm,
    filterLevel,
    sortBy,
    selectedResponses,
    isDeleting,
    estadisticas,
    
    // Paginación
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    
    // Setters
    setSearchTerm,
    setFilterLevel,
    setSortBy,
    setSelectedResponses,
    
    // Acciones
    cargarRespuestas,
    eliminarRespuesta,
    eliminarSeleccionados,
    toggleSeleccionMasiva,
    exportarDatos,
    
    // Navegación
    nextPage,
    prevPage,
    goToPage
  } = useResponses(20) // 20 items por página
  
  // Manejador para eliminar respuestas seleccionadas
  const handleEliminarSeleccionados = async () => {
    const result = await eliminarSeleccionados()
    if (result.success) {
      setDeleteSuccess(true)
      setTimeout(() => setDeleteSuccess(false), 3000)
    }
    setShowDeleteModal(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Respuestas</h1>
          <p className="text-gray-600 mt-2">Gestiona las respuestas de los cuestionarios</p>
        </div>
        <div className="flex space-x-2 mt-4 sm:mt-0">
          <button
            onClick={() => cargarRespuestas(currentPage)}
            className="bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors flex items-center space-x-2"
            disabled={loading}
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            <span>Actualizar</span>
          </button>
          
          <button
            onClick={exportarDatos}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            disabled={loading || respuestas.length === 0}
          >
            <Download size={18} />
            <span>Exportar CSV</span>
          </button>
          
          {selectedResponses.length > 0 && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
              disabled={isDeleting}
            >
              <Trash2 size={18} />
              <span>Eliminar ({selectedResponses.length})</span>
            </button>
          )}
        </div>
      </div>
      
      {/* Estadísticas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Estadísticas</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold">{estadisticas.total || 0}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500">Bajo</p>
            <p className="text-2xl font-bold text-green-600">{estadisticas.bajo || 0}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500">Moderado</p>
            <p className="text-2xl font-bold text-yellow-600">{estadisticas.moderado || 0}</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500">Alto</p>
            <p className="text-2xl font-bold text-orange-600">{estadisticas.alto || 0}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500">Muy Alto</p>
            <p className="text-2xl font-bold text-red-600">{estadisticas.muy_alto || 0}</p>
          </div>
        </div>
      </div>
      
      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nombre, email o área..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Filtro por nivel */}
          <div className="flex items-center space-x-2">
            <Filter size={20} className="text-gray-400" />
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="todos">Todos los niveles</option>
              <option value="bajo">Bajo</option>
              <option value="moderado">Moderado</option>
              <option value="alto">Alto</option>
              <option value="muy_alto">Muy Alto</option>
              <option value="sin_datos">Sin datos</option>
            </select>
          </div>
          
          {/* Ordenar por */}
          <div className="flex items-center space-x-2">
            <span className="text-gray-500">Ordenar:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="fecha_desc">Fecha (reciente)</option>
              <option value="fecha_asc">Fecha (antigua)</option>
              <option value="nombre_asc">Nombre (A-Z)</option>
              <option value="nombre_desc">Nombre (Z-A)</option>
              <option value="nivel_asc">Nivel (bajo-alto)</option>
              <option value="nivel_desc">Nivel (alto-bajo)</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Estado de carga */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      )}
      
      {/* Mensaje de error */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p>Error: {error}</p>
        </div>
      )}
      
      {/* Tabla de respuestas */}
      {!loading && !error && (
        <>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          checked={selectedResponses.length === respuestas.length && respuestas.length > 0}
                          onChange={() => toggleSeleccionMasiva(respuestas)}
                        />
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Área
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nivel
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {respuestas.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                        No se encontraron respuestas
                      </td>
                    </tr>
                  ) : (
                    respuestas.map((respuesta) => (
                      <tr key={respuesta.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            checked={selectedResponses.includes(respuesta.id)}
                            onChange={() => {
                              if (selectedResponses.includes(respuesta.id)) {
                                setSelectedResponses(selectedResponses.filter(id => id !== respuesta.id))
                              } else {
                                setSelectedResponses([...selectedResponses, respuesta.id])
                              }
                            }}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {respuesta.nombres} {respuesta.apellidos}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{respuesta.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{respuesta.area}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {respuesta.fecha_completado 
                              ? new Date(respuesta.fecha_completado).toLocaleDateString() 
                              : 'No completado'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <HealthLevelBadge nivel={respuesta.nivel} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => {
                              if (window.confirm(`¿Estás seguro de eliminar la respuesta de ${respuesta.nombres}?`)) {
                                eliminarRespuesta(respuesta.id)
                              }
                            }}
                            className="text-red-600 hover:text-red-900"
                            disabled={isDeleting}
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-700">
                Mostrando <span className="font-medium">{currentPage * itemsPerPage + 1}</span> a <span className="font-medium">{Math.min((currentPage + 1) * itemsPerPage, totalItems)}</span> de <span className="font-medium">{totalItems}</span> resultados
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={prevPage}
                  disabled={currentPage === 0}
                  className={`px-3 py-1 rounded-md ${currentPage === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'}`}
                >
                  <ChevronLeft size={18} />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Mostrar 5 páginas centradas en la página actual
                  let pageToShow
                  if (totalPages <= 5) {
                    pageToShow = i
                  } else if (currentPage < 2) {
                    pageToShow = i
                  } else if (currentPage > totalPages - 3) {
                    pageToShow = totalPages - 5 + i
                  } else {
                    pageToShow = currentPage - 2 + i
                  }
                  
                  return (
                    <button
                      key={pageToShow}
                      onClick={() => goToPage(pageToShow)}
                      className={`px-3 py-1 rounded-md ${currentPage === pageToShow ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'}`}
                    >
                      {pageToShow + 1}
                    </button>
                  )
                })}
                <button
                  onClick={nextPage}
                  disabled={currentPage >= totalPages - 1}
                  className={`px-3 py-1 rounded-md ${currentPage >= totalPages - 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'}`}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Modal de confirmación para eliminación masiva */}
      {showDeleteModal && (
        <AccessibleModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Eliminar respuestas seleccionadas"
        >
          <div>
            <p>{`¿Estás seguro de eliminar ${selectedResponses.length} respuestas seleccionadas? Esta acción no se puede deshacer.`}</p>
            <div className="flex justify-end space-x-4 mt-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300"
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button
                onClick={handleEliminarSeleccionados}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
                disabled={isDeleting}
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </AccessibleModal>
      )}
      
      {/* Notificación de éxito */}
      {deleteSuccess && (
        <Notification
          type="success"
          message="Respuestas eliminadas correctamente"
          onClose={() => setDeleteSuccess(false)}
        />
      )}
  {/* Botones de acción */}
      <div className="flex justify-between mt-6">
        <div className="flex space-x-2">
          <button
            onClick={() => setShowDeleteModal(true)}
            disabled={selectedResponses.length === 0 || isDeleting}
            className={`px-4 py-2 rounded-md ${
              selectedResponses.length === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            <div className="flex items-center">
              <Trash2 size={16} className="mr-2" />
              Eliminar seleccionados ({selectedResponses.length})
            </div>
          </button>
          
          <button
            onClick={exportarDatos}
            disabled={respuestas.length === 0 || loading}
            className={`px-4 py-2 rounded-md ${
              respuestas.length === 0 || loading
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            <div className="flex items-center">
              <Download size={16} className="mr-2" />
              Exportar a CSV
            </div>
          </button>
        </div>
        
        <button
          onClick={() => cargarRespuestas(currentPage)}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
        >
          <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>
      
      {/* Modal de confirmación para eliminación masiva */}
      {showDeleteModal && (
        <AccessibleModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Eliminar respuestas seleccionadas"
        >
          <div>
            <p>{`¿Estás seguro de eliminar ${selectedResponses.length} respuestas seleccionadas? Esta acción no se puede deshacer.`}</p>
            <div className="flex justify-end space-x-4 mt-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300"
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button
                onClick={handleEliminarSeleccionados}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
                disabled={isDeleting}
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </AccessibleModal>
      )}
      
      {/* Notificación de éxito */}
      {deleteSuccess && (
        <Notification
          type="success"
          message="Respuestas eliminadas correctamente"
          onClose={() => setDeleteSuccess(false)}
        />
      )}
    </div>
  );
};

export default Respuestas;