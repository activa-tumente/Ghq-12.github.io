import React, { useState, useMemo } from 'react';
import {
  MessageSquare,
  Users,
  BarChart3,
  TrendingUp,
  Filter,
  Search,
  RefreshCw,
  Download,
  Wifi,
  WifiOff,
  Calendar,
  User,
  Building,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useResponsesMetrics } from '../../hooks/useRealTimeMetrics';
import ErrorBoundary from '../ui/ErrorBoundary';
import LoadingSpinner from '../ui/LoadingSpinner';

// Componente para mostrar una respuesta individual
const ResponseCard = ({ respuesta, loading }) => {
  const getBienestarColor = (nivel) => {
    switch (nivel) {
      case 'Excelente': return 'text-green-600 bg-green-50 border-green-200';
      case 'Bueno': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'Regular': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Necesita atención': return 'text-red-600 bg-red-50 border-red-200';
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
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {respuesta.usuario.nombre}
          </h3>
          <p className="text-sm text-gray-600">{respuesta.usuario.email}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getBienestarColor(respuesta.nivelBienestar)}`}>
          {respuesta.nivelBienestar}
        </div>
      </div>

      {/* Información del usuario */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div className="flex items-center text-gray-600">
          <Building className="w-4 h-4 mr-2" />
          <span>{respuesta.usuario.area}</span>
        </div>
        <div className="flex items-center text-gray-600">
          <Clock className="w-4 h-4 mr-2" />
          <span>{respuesta.usuario.turno}</span>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">{respuesta.promedio.toFixed(2)}</p>
          <p className="text-xs text-gray-500">Promedio</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{respuesta.totalPreguntas}</p>
          <p className="text-xs text-gray-500">Preguntas</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-purple-600">
            {Math.round(((3 - respuesta.promedio) / 3) * 100)}%
          </p>
          <p className="text-xs text-gray-500">Bienestar</p>
        </div>
      </div>

      {/* Fecha */}
      <div className="flex items-center text-sm text-gray-500">
        <Calendar className="w-4 h-4 mr-2" />
        <span>
          {new Date(respuesta.fechaRespuesta).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
      </div>
    </div>
  );
};

// Componente de estadísticas resumidas
const StatsCard = ({ title, value, icon: Icon, color, subtitle, loading }) => {
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
};

// Componente principal
const RealTimeResponses = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterArea, setFilterArea] = useState('todas');
  const [filterBienestar, setFilterBienestar] = useState('todos');

  const {
    metrics,
    loading,
    error,
    lastUpdate,
    isRealTime,
    refreshMetrics
  } = useResponsesMetrics({
    enableRealTime: true,
    refreshInterval: 30000
  });

  // Filtrar respuestas
  const filteredResponses = useMemo(() => {
    if (!metrics?.respuestas) return [];

    return metrics.respuestas.filter(respuesta => {
      const matchesSearch = 
        respuesta.usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        respuesta.usuario.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesArea = filterArea === 'todas' || respuesta.usuario.area === filterArea;
      const matchesBienestar = filterBienestar === 'todos' || respuesta.nivelBienestar === filterBienestar;

      return matchesSearch && matchesArea && matchesBienestar;
    });
  }, [metrics?.respuestas, searchTerm, filterArea, filterBienestar]);

  // Obtener áreas únicas para el filtro
  const areasUnicas = useMemo(() => {
    if (!metrics?.respuestas) return [];
    const areas = [...new Set(metrics.respuestas.map(r => r.usuario.area))];
    return areas.filter(area => area && area !== 'Sin especificar');
  }, [metrics?.respuestas]);

  // Función para exportar datos
  const exportarDatos = () => {
    if (!metrics) return;

    const datosExport = {
      fecha: new Date().toISOString(),
      totalRespuestas: metrics.totalRespuestas,
      promedioGeneral: metrics.promedioGeneral,
      respuestas: filteredResponses,
      estadisticas: {
        distribucionRespuestas: metrics.distribucionRespuestas,
        estadisticasPorPregunta: metrics.estadisticasPorPregunta
      }
    };

    const blob = new Blob([JSON.stringify(datosExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `respuestas-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading && !metrics) {
    return <LoadingSpinner message="Cargando respuestas en tiempo real..." />;
  }

  if (error && !metrics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error al cargar respuestas</h2>
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
              <h1 className="text-3xl font-bold text-gray-900">Respuestas en Tiempo Real</h1>
              <p className="text-gray-600 mt-1 flex items-center gap-2">
                Análisis detallado de respuestas GHQ-12
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
                onClick={exportarDatos}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
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
                title="Total Respuestas"
                value={metrics.totalRespuestas?.toLocaleString() || '0'}
                icon={MessageSquare}
                color="blue"
                loading={loading}
              />
              <StatsCard
                title="Promedio General"
                value={`${metrics.promedioGeneral?.toFixed(2) || '0.00'}/3`}
                icon={BarChart3}
                color="purple"
                loading={loading}
              />
              <StatsCard
                title="Usuarios Únicos"
                value={new Set(metrics.respuestas?.map(r => r.usuario.email) || []).size.toLocaleString()}
                icon={Users}
                color="green"
                loading={loading}
              />
              <StatsCard
                title="Nivel Bienestar Promedio"
                value={`${Math.round(((3 - (metrics.promedioGeneral || 0)) / 3) * 100)}%`}
                icon={TrendingUp}
                color={metrics.promedioGeneral <= 1.5 ? 'green' : metrics.promedioGeneral <= 2 ? 'yellow' : 'red'}
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
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Búsqueda */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Filtro por área */}
              <select
                value={filterArea}
                onChange={(e) => setFilterArea(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="todas">Todas las áreas</option>
                {areasUnicas.map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>

              {/* Filtro por nivel de bienestar */}
              <select
                value={filterBienestar}
                onChange={(e) => setFilterBienestar(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="todos">Todos los niveles</option>
                <option value="Excelente">Excelente</option>
                <option value="Bueno">Bueno</option>
                <option value="Regular">Regular</option>
                <option value="Necesita atención">Necesita atención</option>
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

          {/* Lista de respuestas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading && !metrics ? (
              // Mostrar skeletons mientras carga
              Array.from({ length: 6 }).map((_, index) => (
                <ResponseCard key={index} loading={true} />
              ))
            ) : filteredResponses.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay respuestas disponibles
                </h3>
                <p className="text-gray-600">
                  {searchTerm || filterArea !== 'todas' || filterBienestar !== 'todos'
                    ? 'No se encontraron respuestas que coincidan con los filtros aplicados.'
                    : 'Aún no se han registrado respuestas en el sistema.'}
                </p>
              </div>
            ) : (
              filteredResponses.map((respuesta) => (
                <ResponseCard
                  key={respuesta.id}
                  respuesta={respuesta}
                  loading={false}
                />
              ))
            )}
          </div>

          {/* Footer con información */}
          <div className="mt-8 p-4 bg-gray-100 rounded-lg text-sm text-gray-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span>Estado: {isRealTime ? 'Tiempo real activo' : 'Modo offline'}</span>
                <span>Respuestas mostradas: {filteredResponses.length}</span>
                <span>Total en sistema: {metrics?.totalRespuestas || 0}</span>
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

export default RealTimeResponses;