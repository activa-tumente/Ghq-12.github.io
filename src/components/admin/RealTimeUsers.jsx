import React, { useState, useMemo, memo, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  Filter,
  Search,
  RefreshCw,
  Download,
  Wifi,
  WifiOff,
  Calendar,
  Mail,
  Building,
  Clock,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import { useUsersMetrics } from '../../hooks/useRealTimeMetrics';
import { useUserFilters } from '../../hooks/useUserFilters';
import ErrorBoundary from '../ui/ErrorBoundary';
import LoadingSpinner from '../ui/LoadingSpinner';

// Constantes de configuración
const USERS_CONFIG = {
  REFRESH_INTERVAL: 30000, // 30 segundos
  SKELETON_COUNT: 6,
  PARTICIPATION_THRESHOLD: 0.7, // 70% para considerar buena participación
  FILTER_OPTIONS: {
    AREAS: ['todas'],
    ESTADOS: ['todos', 'completado', 'pendiente'],
    GENEROS: ['todos']
  }
};

// Componente para mostrar un usuario individual
const UserCard = memo(({ usuario, loading, onEdit, onDelete, onView }) => {
  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'completado': return 'text-green-600 bg-green-50 border-green-200';
      case 'pendiente': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 animate-pulse">
        <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-300 rounded w-1/2 mb-4"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-3 bg-gray-300 rounded"></div>
          <div className="h-3 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {usuario.nombre || 'Sin nombre'}
          </h3>
          <p className="text-sm text-gray-600 flex items-center gap-1">
            <Mail className="w-3 h-3" />
            {usuario.email}
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getEstadoColor(usuario.estadoEvaluacion)}`}>
          {usuario.estadoEvaluacion === 'completado' ? 'Completado' : 'Pendiente'}
        </div>
      </div>

      {/* Información del usuario */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div className="flex items-center text-gray-600">
          <Building className="w-4 h-4 mr-2" />
          <span>{usuario.area}</span>
        </div>
        <div className="flex items-center text-gray-600">
          <Clock className="w-4 h-4 mr-2" />
          <span>{usuario.turno}</span>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <p className="text-xl font-bold text-blue-600">{usuario.totalEvaluaciones}</p>
          <p className="text-xs text-gray-500">Evaluaciones</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-green-600">
            {usuario.genero || 'N/A'}
          </p>
          <p className="text-xs text-gray-500">Género</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-purple-600">
            {usuario.metadata?.edad || 'N/A'}
          </p>
          <p className="text-xs text-gray-500">Edad</p>
        </div>
      </div>

      {/* Fechas */}
      <div className="space-y-2 text-sm text-gray-500 mb-4">
        <div className="flex items-center">
          <Calendar className="w-4 h-4 mr-2" />
          <span>
            Registrado: {new Date(usuario.created_at).toLocaleDateString('es-ES')}
          </span>
        </div>
        {usuario.ultimaEvaluacion && (
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            <span>
              Última evaluación: {new Date(usuario.ultimaEvaluacion).toLocaleDateString('es-ES')}
            </span>
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onView(usuario)}
          className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-md hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
        >
          <Eye className="w-4 h-4" />
          Ver
        </button>
        <button
          onClick={() => onEdit(usuario)}
          className="flex-1 bg-gray-50 text-gray-600 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
        >
          <Edit className="w-4 h-4" />
          Editar
        </button>
        <button
          onClick={() => onDelete(usuario)}
          className="bg-red-50 text-red-600 px-3 py-2 rounded-md hover:bg-red-100 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});

UserCard.displayName = 'UserCard';

UserCard.propTypes = {
  usuario: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    nombre: PropTypes.string,
    email: PropTypes.string.isRequired,
    estadoEvaluacion: PropTypes.oneOf(['completado', 'pendiente']).isRequired,
    area: PropTypes.string,
    turno: PropTypes.string,
    genero: PropTypes.string,
    totalEvaluaciones: PropTypes.number,
    metadata: PropTypes.object,
    created_at: PropTypes.string.isRequired,
    ultimaEvaluacion: PropTypes.string
  }),
  loading: PropTypes.bool,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onView: PropTypes.func.isRequired
};

// Componente de estadísticas resumidas
const StatsCard = memo(({ title, value, icon: Icon, color, subtitle, loading }) => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50 border-blue-200',
    green: 'text-green-600 bg-green-50 border-green-200',
    yellow: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    red: 'text-red-600 bg-red-50 border-red-200',
    purple: 'text-purple-600 bg-purple-50 border-purple-200'
  };

  return (
    <div className={`p-6 rounded-lg border ${colorClasses[color] || colorClasses.blue}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-75">{title}</p>
          <p className="text-2xl font-bold mt-1">
            {loading ? (
              <div className="animate-pulse bg-gray-300 h-8 w-16 rounded"></div>
            ) : (
              value
            )}
          </p>
          {subtitle && <p className="text-xs opacity-60 mt-1">{subtitle}</p>}
        </div>
        <Icon className="w-8 h-8 opacity-75" />
      </div>
    </div>
  );
});

StatsCard.displayName = 'StatsCard';

StatsCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.elementType.isRequired,
  color: PropTypes.oneOf(['blue', 'green', 'yellow', 'red', 'purple']),
  subtitle: PropTypes.string,
  loading: PropTypes.bool
};

// Componente principal
const RealTimeUsers = () => {
  const {
    metrics,
    loading,
    error,
    lastUpdate,
    isRealTime,
    refreshMetrics
  } = useUsersMetrics({
    enableRealTime: true,
    refreshInterval: USERS_CONFIG.REFRESH_INTERVAL
  });

  // Hook personalizado para manejo de filtros
  const {
    searchTerm,
    filterArea,
    filterEstado,
    filterGenero,
    filteredUsers,
    filterOptions,
    updateSearchTerm,
    updateAreaFilter,
    updateEstadoFilter,
    updateGeneroFilter,
    hasActiveFilters
  } = useUserFilters(metrics?.usuarios || []);

  // Funciones de manejo de usuarios memoizadas
  const handleView = useCallback((usuario) => {
    console.log('Ver usuario:', usuario);
    // Implementar navegación o modal
  }, []);

  const handleEdit = useCallback((usuario) => {
    console.log('Editar usuario:', usuario);
    // Implementar navegación o modal de edición
  }, []);

  const handleDelete = useCallback((usuario) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar al usuario ${usuario.nombre || usuario.email}?`)) {
      console.log('Eliminar usuario:', usuario);
      // Implementar eliminación
    }
  }, []);

  const handleNewUser = useCallback(() => {
    console.log('Crear nuevo usuario');
    // Implementar navegación o modal de creación
  }, []);

  // Función para exportar datos memoizada
  const exportarDatos = useCallback(() => {
    if (!metrics) return;

    const datosExport = {
      fecha: new Date().toISOString(),
      totalUsuarios: metrics.totalUsuarios,
      usuariosActivos: metrics.usuariosActivos,
      usuariosPendientes: metrics.usuariosPendientes,
      usuarios: filteredUsers,
      estadisticas: {
        porArea: metrics.estadisticasPorArea,
        porTurno: metrics.estadisticasPorTurno,
        porGenero: metrics.estadisticasPorGenero
      }
    };

    const blob = new Blob([JSON.stringify(datosExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `usuarios-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [metrics, filteredUsers]);

  if (loading && !metrics) {
    return <LoadingSpinner message="Cargando usuarios en tiempo real..." />;
  }

  if (error && !metrics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error al cargar usuarios</h2>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <button 
            onClick={refreshMetrics}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Usuarios en Tiempo Real</h1>
              <p className="text-gray-600 mt-1 flex items-center gap-2">
                Gestión de usuarios y seguimiento de evaluaciones
                {isRealTime ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <Wifi className="w-4 h-4" />
                    Tiempo real activo
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-yellow-600">
                    <WifiOff className="w-4 h-4" />
                    Modo offline
                  </span>
                )}
                {lastUpdate && (
                  <span className="text-sm">
                    • Última actualización: {new Date(lastUpdate).toLocaleString()}
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleNewUser}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Nuevo Usuario
              </button>
              <button 
                onClick={exportarDatos}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors flex items-center gap-2"
                disabled={!metrics}
              >
                <Download className="w-4 h-4" />
                Exportar
              </button>
              <button 
                onClick={refreshMetrics}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </button>
            </div>
          </div>

          {/* Estadísticas generales */}
          {metrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <StatsCard
                title="Total Usuarios"
                value={metrics.totalUsuarios?.toLocaleString() || '0'}
                icon={Users}
                color="blue"
                loading={loading}
              />
              <StatsCard
                title="Usuarios Activos"
                value={metrics.usuariosActivos?.toLocaleString() || '0'}
                subtitle="Con evaluaciones completadas"
                icon={UserCheck}
                color="green"
                loading={loading}
              />
              <StatsCard
                title="Usuarios Pendientes"
                value={metrics.usuariosPendientes?.toLocaleString() || '0'}
                subtitle="Sin evaluaciones"
                icon={UserX}
                color="yellow"
                loading={loading}
              />
              <StatsCard
                title="Tasa de Participación"
                value={`${metrics.totalUsuarios > 0 ? Math.round((metrics.usuariosActivos / metrics.totalUsuarios) * 100) : 0}%`}
                icon={TrendingUp}
                color={metrics.totalUsuarios > 0 && (metrics.usuariosActivos / metrics.totalUsuarios) >= USERS_CONFIG.PARTICIPATION_THRESHOLD ? 'green' : 'yellow'}
                loading={loading}
              />
            </div>
          )}

          {/* Filtros */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-800">Filtros</h3>
              {loading && <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Búsqueda */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o email..."
                  value={searchTerm}
                  onChange={(e) => updateSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-label="Buscar usuarios por nombre o email"
                  aria-describedby="search-help"
                />
              </div>

              {/* Filtro por área */}
              <select
                value={filterArea}
                onChange={(e) => updateAreaFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="Filtrar por área"
              >
                <option value="todas">Todas las áreas</option>
                {filterOptions.areas.map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>

              {/* Filtro por estado */}
              <select
                value={filterEstado}
                onChange={(e) => updateEstadoFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="Filtrar por estado de evaluación"
              >
                <option value="todos">Todos los estados</option>
                <option value="completado">Completado</option>
                <option value="pendiente">Pendiente</option>
              </select>

              {/* Filtro por género */}
              <select
                value={filterGenero}
                onChange={(e) => updateGeneroFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="Filtrar por género"
              >
                <option value="todos">Todos los géneros</option>
                {filterOptions.generos.map(genero => (
                  <option key={genero} value={genero}>{genero}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Mostrar error si existe pero hay datos en cache */}
          {error && metrics && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-300 rounded-md">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <p className="text-yellow-800">
                  <strong>Advertencia:</strong> {error.message}. Mostrando datos en cache.
                </p>
              </div>
            </div>
          )}

          {/* Lista de usuarios */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading && !metrics ? (
              // Mostrar skeletons mientras carga
              Array.from({ length: USERS_CONFIG.SKELETON_COUNT }).map((_, index) => (
                <UserCard key={index} loading={true} />
              ))
            ) : filteredUsers.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay usuarios disponibles
                </h3>
                <p className="text-gray-600 mb-6">
                  {hasActiveFilters
                    ? 'No se encontraron usuarios que coincidan con los filtros aplicados.'
                    : 'Aún no se han registrado usuarios en el sistema.'}
                </p>
                {!hasActiveFilters && (
                  <button
                    onClick={handleNewUser}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                  >
                    <Plus className="h-5 w-5" />
                    Crear Primer Usuario
                  </button>
                )}
              </div>
            ) : (
              filteredUsers.map((usuario) => (
                <UserCard
                  key={usuario.id}
                  usuario={usuario}
                  loading={false}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>

          {/* Footer con información */}
          <div className="mt-8 p-4 bg-gray-100 rounded-lg text-sm text-gray-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span>Estado: {isRealTime ? 'Tiempo real activo' : 'Modo offline'}</span>
                <span>Usuarios mostrados: {filteredUsers.length}</span>
                <span>Total en sistema: {metrics?.totalUsuarios || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Actualización automática cada 30 segundos</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default RealTimeUsers;