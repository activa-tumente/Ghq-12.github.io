import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  Clock, 
  BarChart3, 
  FileText,
  Download,
  Edit
} from 'lucide-react'
import { supabase } from '../../api/supabase'
import { questions, likertOptions } from '../../data/questions'

const QuestionnaireDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [usuario, setUsuario] = useState(null)
  const [respuestas, setRespuestas] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    const cargarDetalle = async () => {
      try {
        setLoading(true)
        
        // Obtener datos del usuario
        const { data: usuarioData, error: usuarioError } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', id)
          .single()

        if (usuarioError) throw usuarioError
        setUsuario(usuarioData)

        // Obtener respuestas del usuario
        const { data: respuestasData, error: respuestasError } = await supabase
          .from('respuestas_cuestionario')
          .select('*')
          .eq('usuario_id', id)
          .order('pregunta_id')

        if (respuestasError) throw respuestasError
        setRespuestas(respuestasData || [])

      } catch (error) {
        console.error('Error cargando detalle:', error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      cargarDetalle()
    }
  }, [id])

  const calcularEstadisticas = () => {
    if (respuestas.length === 0) return null

    const totalRespuestas = respuestas.length
    const sumaRespuestas = respuestas.reduce((sum, r) => sum + r.respuesta, 0)
    const promedio = sumaRespuestas / totalRespuestas

    // Agrupar por categoría
    const porCategoria = {}
    respuestas.forEach(respuesta => {
      const pregunta = questions.find(q => q.id === respuesta.pregunta_id)
      if (pregunta) {
        const categoria = pregunta.dimension
        if (!porCategoria[categoria]) {
          porCategoria[categoria] = { suma: 0, count: 0 }
        }
        porCategoria[categoria].suma += respuesta.respuesta
        porCategoria[categoria].count += 1
      }
    })

    const promediosPorCategoria = Object.entries(porCategoria).map(([categoria, data]) => ({
      categoria,
      promedio: data.suma / data.count,
      respuestas: data.count
    }))

    return {
      totalRespuestas,
      promedio: promedio.toFixed(2),
      promediosPorCategoria
    }
  }

  const exportarDatos = () => {
    if (!usuario || respuestas.length === 0) return

    const datos = respuestas.map(respuesta => {
      const pregunta = questions.find(q => q.id === respuesta.pregunta_id)
      const opcion = likertOptions.find(o => o.value === respuesta.respuesta)
      
      return {
        'Pregunta ID': respuesta.pregunta_id,
        'Pregunta': pregunta?.text || 'N/A',
        'Dimensión': pregunta?.dimension || 'N/A',
        'Respuesta Valor': respuesta.respuesta,
        'Respuesta Texto': opcion?.label || 'N/A',
        'Fecha Respuesta': new Date(respuesta.fecha_respuesta).toLocaleString('es-ES')
      }
    })

    const csv = [
      Object.keys(datos[0]).join(','),
      ...datos.map(row => Object.values(row).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cuestionario_${usuario.nombre}_${usuario.apellido}_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Cargando detalles...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => navigate('/cuestionarios')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Volver a Cuestionarios
          </button>
        </div>
      </div>
    )
  }

  if (!usuario) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No encontrado</h2>
          <p className="text-gray-600 mb-4">No se encontró el cuestionario solicitado.</p>
          <button 
            onClick={() => navigate('/cuestionarios')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Volver a Cuestionarios
          </button>
        </div>
      </div>
    )
  }

  const estadisticas = calcularEstadisticas()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/cuestionarios')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver a Cuestionarios
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {usuario.nombre} {usuario.apellido}
              </h1>
              <p className="text-gray-600 mt-2">Detalle del Cuestionario CSBC</p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={exportarDatos}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Exportar</span>
              </button>
              <button
                onClick={() => navigate(`/cuestionario-editar/${id}`)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Edit className="w-4 h-4" />
                <span>Editar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Información Personal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <User className="w-5 h-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Información Personal</h3>
            </div>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-500">Documento:</span>
                <p className="font-medium">{usuario.documento || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Email:</span>
                <p className="font-medium">{usuario.email}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Género:</span>
                <p className="font-medium capitalize">{usuario.genero}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Edad:</span>
                <p className="font-medium">{usuario.edad || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <BarChart3 className="w-5 h-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Información Laboral</h3>
            </div>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-500">Cargo:</span>
                <p className="font-medium capitalize">{usuario.cargo || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Departamento:</span>
                <p className="font-medium capitalize">{usuario.departamento}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Área Macro:</span>
                <p className="font-medium capitalize">{usuario.area_macro}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Turno:</span>
                <p className="font-medium capitalize">{usuario.turno || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Antigüedad:</span>
                <p className="font-medium">{usuario.antiguedad_empresa ? `${usuario.antiguedad_empresa} años` : 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Tipo de Contrato:</span>
                <p className="font-medium capitalize">{usuario.tipo_contrato || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Nivel Educativo:</span>
                <p className="font-medium capitalize">{usuario.nivel_educativo || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Fecha Ingreso:</span>
                <p className="font-medium">{usuario.fecha_ingreso ? new Date(usuario.fecha_ingreso).toLocaleDateString('es-ES') : 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <Calendar className="w-5 h-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Fechas</h3>
            </div>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-500">Creado:</span>
                <p className="font-medium">{new Date(usuario.fecha_creacion).toLocaleDateString('es-ES')}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Activo:</span>
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                  usuario.activo 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {usuario.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        {estadisticas && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Estadísticas de Respuestas</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{estadisticas.totalRespuestas}</div>
                <div className="text-sm text-gray-600">Total Respuestas</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{estadisticas.promedio}</div>
                <div className="text-sm text-gray-600">Promedio General</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{estadisticas.promediosPorCategoria.length}</div>
                <div className="text-sm text-gray-600">Dimensiones</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {estadisticas.promediosPorCategoria.map((categoria, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">{categoria.categoria}</h4>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-gray-700">{categoria.promedio.toFixed(2)}</span>
                    <span className="text-sm text-gray-500">{categoria.respuestas} respuestas</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lista de Respuestas */}
        {respuestas.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Respuestas Detalladas</h3>
            
            <div className="space-y-4">
              {respuestas.map((respuesta, index) => {
                const pregunta = questions.find(q => q.id === respuesta.pregunta_id)
                const opcion = likertOptions.find(o => o.value === respuesta.respuesta)
                
                return (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                            Pregunta {respuesta.pregunta_id}
                          </span>
                          <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-1 rounded">
                            {pregunta?.dimension || 'N/A'}
                          </span>
                        </div>
                        <p className="text-gray-900 font-medium mb-2">
                          {pregunta?.text || 'Pregunta no encontrada'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-500">Respuesta:</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          respuesta.respuesta >= 4 
                            ? 'bg-green-100 text-green-800'
                            : respuesta.respuesta >= 3
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {opcion?.label || `Valor: ${respuesta.respuesta}`}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(respuesta.created_at).toLocaleString('es-ES')}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default QuestionnaireDetail
