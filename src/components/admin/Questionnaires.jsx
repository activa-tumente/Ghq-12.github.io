import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText,
  Plus,
  Search,
  Filter,
  Calendar,
  Users,
  BarChart3,
  RefreshCw,
  Wifi,
  WifiOff,
  TrendingUp,
  CheckCircle,
  Clock,
  Trash2
} from 'lucide-react'
import { useQuestionnaires } from '../../hooks/useQuestionnaires'
import { useGlobalQuestionnaireMetrics } from '../../hooks/useGlobalMetrics'
import AnimatedCounter from '../ui/AnimatedCounter'
import MetricsUpdateIndicator from '../ui/MetricsUpdateIndicator'
import StatusBadge from '../ui/StatusBadge'
import LoadingSpinner from '../ui/LoadingSpinner'
import ActionButtons from '../ui/ActionButtons'
import ErrorBoundary from '../ui/ErrorBoundary'

const Questionnaires = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')
  const [selectedIds, setSelectedIds] = useState([])
  const { cuestionarios, loading, error, eliminarCuestionario, eliminarCuestionariosMultiples } = useQuestionnaires()
  
  // Hook para métricas en tiempo real
  const {
    metrics: metricsData,
    loading: metricsLoading,
    error: metricsError,
    lastUpdate,
    isRealTime,
    refreshMetrics
  } = useGlobalQuestionnaireMetrics({
    enableRealTime: true
  })

  // Verificar que estamos usando datos reales de Supabase
  useEffect(() => {
    if (!loading && !error) {
      console.log('✅ Datos cargados desde Supabase:', cuestionarios.length)
      
      // Verificar la integridad de los datos
      const datosValidos = cuestionarios.every(c => 
        c.id && c.titulo && typeof c.estado === 'string'
      )
      
      if (!datosValidos) {
        console.warn('⚠️ Algunos cuestionarios tienen datos incompletos')
      }
    }
  }, [cuestionarios, loading, error])

  // Navigation functions
  const verCuestionario = (id) => {
    navigate(`/cuestionarios/${id}/resultados`)
  }

  const editarCuestionario = (id) => {
    navigate(`/cuestionarios/${id}/editar`)
  }

  const exportarCuestionario = (cuestionario) => {
    console.log('📥 Exportar cuestionario:', cuestionario.titulo)
    // Implementar lógica de exportación
    alert(`Exportando cuestionario de ${cuestionario.titulo}...`)
  }

  // Handle checkbox selection
  const toggleSelection = (id) => {
    setSelectedIds(prev => 
      prev.includes(id)
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    )
  }

  // Handle select all
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredCuestionarios.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredCuestionarios.map(c => c.id))
    }
  }

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    
    const result = await eliminarCuestionariosMultiples(selectedIds)
    if (result.exito) {
      setSelectedIds([]) // Clear selection after successful deletion
    }
  }

  // Clear selection when search or filter changes
  useEffect(() => {
    setSelectedIds([])
  }, [searchTerm, filterStatus])

  const filteredCuestionarios = cuestionarios.filter(cuestionario => {
    const matchesSearch = cuestionario.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cuestionario.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (cuestionario.persona?.documento && cuestionario.persona.documento.includes(searchTerm))
    const matchesFilter = filterStatus === 'todos' || cuestionario.estado === filterStatus
    return matchesSearch && matchesFilter
  })

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="text-center sm:text-left">
            <h1 className="text-3xl font-bold text-gray-900">Cuestionarios</h1>
            <p className="text-gray-600 mt-2">
              Gestiona las evaluaciones GHQ-12 y revisa los resultados
            </p>
            <div className="mt-2">
              <MetricsUpdateIndicator
                isRealTime={isRealTime}
                lastUpdate={lastUpdate}
                isUpdating={metricsLoading}
                error={metricsError}
                onRefresh={refreshMetrics}
                compact={true}
              />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4 sm:mt-0">
            {selectedIds.length > 0 && (
              <button 
                onClick={handleBulkDelete}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                title={`Eliminar ${selectedIds.length} cuestionario(s) seleccionado(s)`}
              >
                <Trash2 size={20} />
                <span>Eliminar ({selectedIds.length})</span>
              </button>
            )}
            <button 
              onClick={refreshMetrics}
              className="bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
              disabled={metricsLoading}
            >
              <RefreshCw className={`w-4 h-4 ${metricsLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
            <button 
              onClick={() => navigate('/cuestionario-directo')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus size={20} />
              <span>Nuevo Cuestionario</span>
            </button>
          </div>
        </div>

        {/* Métricas en tiempo real */}
        {metricsData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 relative overflow-hidden">
              {/* Update pulse effect */}
              <div className="absolute inset-0 bg-blue-50 opacity-0 animate-pulse" style={{
                animation: metricsLoading ? 'pulse 2s infinite' : 'none'
              }} />

              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Cuestionarios</p>
                  <div className="text-2xl font-bold text-gray-900 mt-1">
                    {metricsLoading ? (
                      <div className="animate-pulse bg-gray-300 h-8 w-16 rounded"></div>
                    ) : (
                      <AnimatedCounter
                        value={metricsData.totalCuestionarios || 0}
                        formatValue={(val) => val.toLocaleString()}
                        duration={800}
                        showChangeIndicator={true}
                        className="inline-block"
                      />
                    )}
                  </div>
                </div>
                <FileText className="w-8 h-8 text-blue-600 opacity-75 transition-colors duration-300" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 relative overflow-hidden">
              <div className="absolute inset-0 bg-green-50 opacity-0 animate-pulse" style={{
                animation: metricsLoading ? 'pulse 2s infinite' : 'none'
              }} />

              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completados</p>
                  <div className="text-2xl font-bold text-green-600 mt-1">
                    {metricsLoading ? (
                      <div className="animate-pulse bg-gray-300 h-8 w-16 rounded"></div>
                    ) : (
                      <AnimatedCounter
                        value={metricsData.completados || 0}
                        formatValue={(val) => val.toLocaleString()}
                        duration={800}
                        showChangeIndicator={true}
                        className="inline-block"
                      />
                    )}
                  </div>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600 opacity-75 transition-colors duration-300" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 relative overflow-hidden">
              <div className="absolute inset-0 bg-yellow-50 opacity-0 animate-pulse" style={{
                animation: metricsLoading ? 'pulse 2s infinite' : 'none'
              }} />

              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pendientes</p>
                  <div className="text-2xl font-bold text-yellow-600 mt-1">
                    {metricsLoading ? (
                      <div className="animate-pulse bg-gray-300 h-8 w-16 rounded"></div>
                    ) : (
                      <AnimatedCounter
                        value={metricsData.pendientes || 0}
                        formatValue={(val) => val.toLocaleString()}
                        duration={800}
                        showChangeIndicator={true}
                        className="inline-block"
                      />
                    )}
                  </div>
                </div>
                <Clock className="w-8 h-8 text-yellow-600 opacity-75 transition-colors duration-300" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 relative overflow-hidden">
              <div className="absolute inset-0 bg-purple-50 opacity-0 animate-pulse" style={{
                animation: metricsLoading ? 'pulse 2s infinite' : 'none'
              }} />

              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-sm font-medium text-gray-600">Promedio General</p>
                  <div className="text-2xl font-bold text-purple-600 mt-1">
                    {metricsLoading ? (
                      <div className="animate-pulse bg-gray-300 h-8 w-16 rounded"></div>
                    ) : (
                      <AnimatedCounter
                        value={metricsData.promedioGeneral || 0}
                        formatValue={(val) => `${val.toFixed(2)}/3`}
                        duration={800}
                        showChangeIndicator={true}
                        className="inline-block"
                      />
                    )}
                  </div>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600 opacity-75 transition-colors duration-300" />
              </div>
            </div>
          </div>
        )}

        {/* Mostrar error de métricas si existe */}
        {metricsError && (
          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
            <MetricsUpdateIndicator
              isRealTime={isRealTime}
              lastUpdate={lastUpdate}
              isUpdating={metricsLoading}
              error={metricsError}
              onRefresh={refreshMetrics}
            />
          </div>
        )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar cuestionarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <Filter size={20} className="text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="todos">Todos los estados</option>
              <option value="completado">Completado</option>
              <option value="en_progreso">En Progreso</option>
              <option value="pendiente">Pendiente</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <LoadingSpinner message="Cargando cuestionarios..." />
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 text-lg font-medium mb-2">
            Error al cargar los datos reales desde Supabase
          </div>
          <div className="text-red-500 text-sm mb-4">
            {error}
          </div>
          <div className="text-gray-600 text-sm mb-4">
            <p>Posibles soluciones:</p>
            <ul className="list-disc list-inside mt-2">
              <li>Verificar la conexión a internet</li>
              <li>Comprobar que Supabase esté funcionando correctamente</li>
              <li>Revisar los permisos de acceso a la base de datos</li>
            </ul>
          </div>
          <div className="flex justify-center space-x-3">
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Reintentar
            </button>
            <button
              onClick={() => navigate('/admin')}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Volver al Panel
            </button>
          </div>
        </div>
      )}

      {/* Cuestionarios Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCuestionarios.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay cuestionarios disponibles
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm || filterStatus !== 'todos'
                    ? 'No se encontraron cuestionarios que coincidan con los filtros aplicados.'
                    : 'Aún no se han creado cuestionarios en la base de datos. Crea el primero para comenzar.'}
                </p>
                <div className="text-sm text-gray-500 mb-4">
                  <p>No hay cuestionarios disponibles</p>
                </div>
                {(!searchTerm && filterStatus === 'todos') && (
                  <button
                    onClick={() => navigate('/cuestionario-directo')}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                  >
                    <Plus className="h-5 w-5" />
                    Crear Primer Cuestionario
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Bulk selection header */}
                {filteredCuestionarios.length > 0 && (
                  <div className="col-span-full flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === filteredCuestionarios.length && filteredCuestionarios.length > 0}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {selectedIds.length > 0 
                          ? `${selectedIds.length} cuestionario(s) seleccionado(s)` 
                          : 'Seleccionar todos'}
                      </span>
                    </div>
                    {selectedIds.length > 0 && (
                      <button
                        onClick={handleBulkDelete}
                        className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center space-x-1"
                      >
                        <Trash2 size={16} />
                        <span>Eliminar seleccionados</span>
                      </button>
                    )}
                  </div>
                )}
                
                {filteredCuestionarios.map((cuestionario) => (
                  <div
                    key={cuestionario.id}
                    className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border ${
                      selectedIds.includes(cuestionario.id) 
                        ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-50' 
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="p-6">
                      {/* Header with checkbox */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start space-x-3 flex-1">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(cuestionario.id)}
                            onChange={() => toggleSelection(cuestionario.id)}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded mt-1 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {cuestionario.titulo}
                            </h3>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {cuestionario.descripcion}
                            </p>
                          </div>
                        </div>
                        <StatusBadge status={cuestionario.estado} />
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="h-4 w-4 mr-2" />
                          <span>{cuestionario.respuestas || 0} respuestas</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <BarChart3 className="h-4 w-4 mr-2" />
                          <span>{cuestionario.completados || 0}/{cuestionario.completados ? 12 : 0} completas</span>
                        </div>
                      </div>

                      {/* Fecha */}
                      <div className="flex items-center text-sm text-gray-500 mb-4">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>
                          Creado: {new Date(cuestionario.fechaCreacion).toLocaleDateString('es-ES')}
                        </span>
                      </div>

                      {/* Actions */}
                      <ActionButtons
                        onView={() => verCuestionario(cuestionario.id)}
                        onEdit={() => editarCuestionario(cuestionario.id)}
                        onExport={() => exportarCuestionario(cuestionario)}
                        onDelete={() => eliminarCuestionario(cuestionario.id)}
                        item={cuestionario}
                      />
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}

export default Questionnaires