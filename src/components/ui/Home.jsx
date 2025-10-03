import { Link, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  FileText,
  Users,
  TrendingUp,
  Shield,
  CheckCircle,
  PlusCircle,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import { useGlobalHomeMetrics } from '../../hooks/useGlobalMetrics'
import { useAuth } from '../../contexts/AuthContext'
import AnimatedCounter from './AnimatedCounter'
import MetricsUpdateIndicator from './MetricsUpdateIndicator'

const Home = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    metrics,
    loading,
    error,
    lastUpdate,
    isRealTime,
    refreshMetrics
  } = useGlobalHomeMetrics({
    enableRealTime: true
  });

  const features = [
    {
      icon: PlusCircle,
      title: 'Nueva Evaluación',
      description: 'Inicia una nueva evaluación GHQ-12 de salud general de forma directa.',
      link: '/cuestionario-directo',
      color: 'bg-emerald-500',
      requiresAuth: false
    },
    {
      icon: BarChart3,
      title: 'Dashboard Analytics',
      description: 'Visualiza métricas avanzadas y análisis de datos de evaluaciones.',
      link: '/dashboard',
      color: 'bg-blue-500',
      requiresAuth: true
    },
    {
      icon: FileText,
      title: 'Cuestionarios CSBC',
      description: 'Gestiona y administra las evaluaciones GHQ-12 de salud general.',
      link: '/cuestionarios',
      color: 'bg-green-500',
      requiresAuth: true
    },
    {
      icon: Users,
      title: 'Gestión de Usuarios',
      description: 'Administra usuarios, roles y permisos del sistema.',
      link: '/usuarios',
      color: 'bg-purple-500',
      requiresAuth: true
    }
  ]

  const handleFeatureClick = (e, feature) => {
    if (feature.requiresAuth && !user) {
      e.preventDefault()
      navigate('/login', { state: { from: feature.link } })
    }
  }

  // Usar métricas reales con animación
  const stats = [
    {
      label: 'Evaluaciones Completadas',
      value: metrics?.evaluacionesCompletadas || 0,
      formatValue: (val) => val.toLocaleString(),
      icon: CheckCircle,
      color: 'text-green-600',
      loading
    },
    {
      label: 'Usuarios Activos',
      value: metrics?.usuariosActivos || 0,
      formatValue: (val) => val.toLocaleString(),
      icon: Users,
      color: 'text-blue-600',
      loading
    },
    {
      label: 'Índice de Bienestar',
      value: metrics?.indiceBienestar || 0,
      formatValue: (val) => `${val}%`,
      icon: Shield,
      color: 'text-purple-600',
      loading
    },
    {
      label: 'Tendencia Mensual',
      value: metrics?.tendenciaMensual || '0%',
      formatValue: (val) => val,
      icon: TrendingUp,
      color: 'text-emerald-600',
      loading
    }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Cuestionario de Salud General (GHQ-12)
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Instrumento para la medición de la salud mental y el bienestar
        </p>
        
        {/* Estado de conexión y última actualización */}
        <div className="mt-4">
          <MetricsUpdateIndicator
            isRealTime={isRealTime}
            lastUpdate={lastUpdate}
            isUpdating={loading}
            error={error}
            onRefresh={refreshMetrics}
            className="justify-center"
          />
        </div>

        {/* Mostrar error si existe */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 max-w-md mx-auto">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error.message}</span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative overflow-hidden">
              {/* Update pulse effect */}
              <div className="absolute inset-0 bg-blue-50 opacity-0 animate-pulse" style={{
                animation: loading ? 'pulse 2s infinite' : 'none'
              }} />

              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <div className="text-3xl font-bold text-gray-900 mt-2">
                    {stat.loading ? (
                      <div className="animate-pulse bg-gray-300 h-8 w-16 rounded"></div>
                    ) : (
                      <AnimatedCounter
                        value={stat.value}
                        formatValue={stat.formatValue}
                        duration={800}
                        showChangeIndicator={true}
                        className="inline-block"
                      />
                    )}
                  </div>
                </div>
                <div className={`p-3 rounded-lg bg-gray-50 transition-colors duration-300 ${
                  !stat.loading && stat.value > 0 ? 'bg-green-50' : ''
                }`}>
                  <Icon className={`w-6 h-6 ${stat.color} transition-colors duration-300 ${
                    !stat.loading && stat.value > 0 ? 'text-green-600' : ''
                  }`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, index) => {
          const Icon = feature.icon
          return (
            <Link
              key={index}
              to={feature.link}
              onClick={(e) => handleFeatureClick(e, feature)}
              className="group bg-white rounded-xl shadow-sm border border-gray-200 p-8 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex flex-col items-center text-center">
                <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  {feature.description}
                </p>
                <div className="mt-auto flex items-center text-blue-600 font-medium group-hover:text-blue-700">
                  <span>Acceder</span>
                  <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-8 text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">¿Listo para comenzar?</h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Inicia una nueva evaluación o revisa los resultados existentes para obtener insights valiosos sobre la salud general en tu organización.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/cuestionario-directo"
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Nueva Evaluación
            </Link>

          </div>
        </div>
      </div>
    </div>
  )
}

export default Home