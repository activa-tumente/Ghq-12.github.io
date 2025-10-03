import { useState, useEffect, useRef, useMemo } from 'react'
import { supabase } from '../api/supabase'
import { useDebounce } from './useDebounce'

/**
 * Hook para gestionar las respuestas de cuestionarios con optimizaciones de rendimiento
 * - Resuelve el problema N+1 query
 * - Implementa paginación
 * - Utiliza debounce para suscripciones en tiempo real
 */
export const useResponses = (itemsPerPage = 20) => {
  const [respuestas, setRespuestas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterLevel, setFilterLevel] = useState('todos')
  const [sortBy, setSortBy] = useState('fecha_desc')
  const [selectedResponses, setSelectedResponses] = useState([])
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Estado para paginación
  const [currentPage, setCurrentPage] = useState(0)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  
  const subscriptionRef = useRef(null)
  
  // Función optimizada para cargar respuestas (evita el problema N+1)
  const cargarRespuestas = async (page = 0) => {
    try {
      setLoading(true)
      setError(null)
      
      // Calcular el rango para paginación
      const from = page * itemsPerPage
      const to = from + itemsPerPage - 1
      
      // 1. Primero obtener usuarios con paginación
      const usuariosResult = await supabase
        .from('usuarios')
        .select('id, email, nombre, metadata, created_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)
      
      if (usuariosResult.error) {
        throw new Error(`Error al cargar usuarios: ${usuariosResult.error.message}`)
      }
      
      setTotalItems(usuariosResult.count || 0)
      setTotalPages(Math.ceil((usuariosResult.count || 0) / itemsPerPage))
      
      // 2. Obtener solo las respuestas para los usuarios de esta página (evita N+1)
      const userIds = usuariosResult.data.map(user => user.id)
      const respuestasResult = await supabase
        .from('respuestas_cuestionario')
        .select('*')
        .in('user_id', userIds)
      
      if (respuestasResult.error) {
        throw new Error(`Error al cargar respuestas: ${respuestasResult.error.message}`)
      }
      
      // Create efficient lookup map for responses by user_id
      const respuestasPorUsuario = new Map()
      respuestasResult.data.forEach(respuesta => {
        respuestasPorUsuario.set(respuesta.user_id, respuesta)
      })

      // Procesar y combinar los datos
      const respuestasCompletas = usuariosResult.data.map(usuario => {
        const respuestaUsuario = respuestasPorUsuario.get(usuario.id)

        // Extract user data
        const nombres = usuario.nombre || 'Sin nombre'
        const apellidos = usuario.apellido || ''
        const area = usuario.area_macro || usuario.departamento || 'No especificada'
        const completado = !!respuestaUsuario

        const evaluacion = calcularNivelSalud(respuestaUsuario ? [respuestaUsuario] : [])

        return {
          id: usuario.id,
          nombres,
          apellidos,
          email: usuario.email,
          area,
          fecha_completado: completado ? respuestaUsuario?.created_at : null,
          completado,
          respuestas: respuestaUsuario ? [respuestaUsuario] : [],
          nivel: evaluacion.nivel,
          puntuacionTotal: evaluacion.puntuacion,
          totalRespuestas: respuestaUsuario ? 1 : 0
        }
      })
      
      setRespuestas(respuestasCompletas)
      setCurrentPage(page)
      
    } catch (error) {
      console.error('Error al cargar respuestas:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }
  
  // Función para calcular el nivel de salud general basado en GHQ-12
  const calcularNivelSalud = (respuestas) => {
    if (!respuestas || respuestas.length === 0) return { nivel: 'sin_datos', puntuacion: 0 }

    // Get the first (and only) response record for this user
    const respuesta = respuestas[0]
    if (!respuesta || !respuesta.respuestas) return { nivel: 'sin_datos', puntuacion: 0 }

    // Sum all answers from the respuestas object (0-3 each, max 36)
    const puntuacionTotal = Object.values(respuesta.respuestas).reduce((sum, valor) => {
      return sum + (typeof valor === 'number' ? valor : 0)
    }, 0)

    // Classify according to GHQ-12 total score
    if (puntuacionTotal <= 9) {
      return { nivel: 'bajo', puntuacion: puntuacionTotal }
    } else if (puntuacionTotal <= 18) {
      return { nivel: 'moderado', puntuacion: puntuacionTotal }
    } else if (puntuacionTotal <= 27) {
      return { nivel: 'alto', puntuacion: puntuacionTotal }
    } else {
      return { nivel: 'muy_alto', puntuacion: puntuacionTotal }
    }
  }
  
  // Función para eliminar respuestas
  const eliminarRespuesta = async (id) => {
    try {
      setIsDeleting(true)
      
      const { error } = await supabase
        .from('respuestas_cuestionario')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      // Actualizar la lista de respuestas
      setRespuestas(prevRespuestas => 
        prevRespuestas.filter(resp => resp.id !== id)
      )
      
    } catch (error) {
      console.error('Error al eliminar respuesta:', error)
      setError('Error al eliminar la respuesta')
    } finally {
      setIsDeleting(false)
    }
  }
  
  // Función para eliminar múltiples respuestas
  const eliminarSeleccionados = async () => {
    if (selectedResponses.length === 0) return
    
    setIsDeleting(true)
    try {
      // Eliminar todas las respuestas seleccionadas
      const { error } = await supabase
        .from('respuestas_cuestionario')
        .delete()
        .in('id', selectedResponses)
      
      if (error) throw error
      
      // Actualizar la lista de respuestas
      setRespuestas(prevRespuestas => 
        prevRespuestas.filter(resp => !selectedResponses.includes(resp.id))
      )
      
      // Limpiar selección
      setSelectedResponses([])
      
      return { success: true }
    } catch (error) {
      console.error('Error al eliminar respuestas:', error)
      setError('Error al eliminar las respuestas seleccionadas')
      return { success: false, error: error.message }
    } finally {
      setIsDeleting(false)
    }
  }
  
  // Función para seleccionar o deseleccionar todas las respuestas filtradas
  const toggleSeleccionMasiva = (respuestasFiltradas) => {
    if (selectedResponses.length === respuestasFiltradas.length) {
      // Si todas están seleccionadas, deseleccionar todas
      setSelectedResponses([])
    } else {
      // Si no todas están seleccionadas, seleccionar todas
      setSelectedResponses(respuestasFiltradas.map(resp => resp.id))
    }
  }
  
  // Funciones para paginación
  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      cargarRespuestas(currentPage + 1)
    }
  }
  
  const prevPage = () => {
    if (currentPage > 0) {
      cargarRespuestas(currentPage - 1)
    }
  }
  
  const goToPage = (page) => {
    if (page >= 0 && page < totalPages) {
      cargarRespuestas(page)
    }
  }
  
  // Función debounceada para recargar datos
  const debouncedReload = useDebounce(() => {
    cargarRespuestas(currentPage)
  }, 500)
  
  // Setup real-time subscriptions con debounce y control de cambios
  const setupRealtimeSubscriptions = () => {
    // Clean up any existing subscriptions
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current)
      subscriptionRef.current = null
    }
    
    console.log('🔔 Configurando suscripciones en tiempo real para respuestas...')
    
    // Referencia para evitar recargas innecesarias
    const lastChangeRef = { timestamp: Date.now() }
    
    // Función para controlar recargas con un mínimo de tiempo entre ellas
    const handleChange = (source) => {
      const now = Date.now()
      // Solo recargar si han pasado al menos 2 segundos desde la última recarga
      if (now - lastChangeRef.timestamp > 2000) {
        console.log(`📱 Cambio en tiempo real - ${source}`)
        lastChangeRef.timestamp = now
        debouncedReload()
      } else {
        console.log(`🔄 Ignorando cambio en ${source} (demasiado frecuente)`)
      }
    }
    
    // Subscribe to usuarios table changes
    const usuariosSubscription = supabase
      .channel('respuestas-usuarios-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'usuarios'
      }, () => handleChange('usuarios'))
      .subscribe()
    
    // Subscribe to respuestas_cuestionario table changes
    const respuestasSubscription = supabase
      .channel('respuestas-respuestas-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'respuestas_cuestionario'
      }, () => handleChange('respuestas'))
      .subscribe()
    
    subscriptionRef.current = [usuariosSubscription, respuestasSubscription]
  }
  
  // Clean up subscriptions
  const cleanupSubscriptions = () => {
    if (subscriptionRef.current) {
      subscriptionRef.current.forEach((subscription) => {
        supabase.removeChannel(subscription)
      })
      subscriptionRef.current = null
      console.log('🧹 Suscripciones en tiempo real limpiadas')
    }
  }
  
  // Exportar datos a CSV
  const exportarDatos = () => {
    if (respuestas.length === 0) return
    
    // Crear cabeceras
    const headers = [
      'ID', 'Nombres', 'Apellidos', 'Email', 'Área', 
      'Fecha Completado', 'Nivel de Salud', 'Puntuación Total'
    ]
    
    // Crear filas de datos
    const rows = respuestas.map(resp => [
      resp.id,
      resp.nombres,
      resp.apellidos,
      resp.email,
      resp.area,
      resp.fecha_completado,
      resp.nivel,
      resp.puntuacionTotal
    ])
    
    // Combinar cabeceras y filas
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')
    
    // Crear y descargar el archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `respuestas_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  
  // Efecto para cargar datos iniciales y configurar suscripciones
  useEffect(() => {
    cargarRespuestas(0)
    setupRealtimeSubscriptions()
    
    // Clean up on unmount
    return () => {
      cleanupSubscriptions()
    }
  }, [])
  
  // Filtrar respuestas según criterios de búsqueda y filtros con memoización
  const respuestasFiltradas = useMemo(() => {
    return respuestas
      .filter(resp => {
        // Filtrar por término de búsqueda (optimizado)
        const searchLower = searchTerm.toLowerCase()
        const matchesSearch = !searchTerm || [
          resp.nombres,
          resp.apellidos,
          resp.email,
          resp.area
        ].some(field => field && field.toLowerCase().includes(searchLower))
        
        // Filtrar por nivel de salud (optimizado)
        let matchesLevel = filterLevel === 'todos'
        if (!matchesLevel) {
          matchesLevel = resp.nivel === filterLevel
        }
        
        return matchesSearch && matchesLevel
      })
      .sort((a, b) => {
        // Ordenar según criterio seleccionado
        switch (sortBy) {
          case 'fecha_asc':
            return new Date(a.fecha_completado || 0) - new Date(b.fecha_completado || 0)
          case 'fecha_desc':
            return new Date(b.fecha_completado || 0) - new Date(a.fecha_completado || 0)
          case 'nombre_asc':
            return (a.nombres || '').localeCompare(b.nombres || '')
          case 'nombre_desc':
            return (b.nombres || '').localeCompare(a.nombres || '')
          case 'nivel_asc':
            return (a.puntuacionTotal || 0) - (b.puntuacionTotal || 0)
          case 'nivel_desc':
            return (b.puntuacionTotal || 0) - (a.puntuacionTotal || 0)
          default:
            return 0
        }
      });
  }, [respuestas, searchTerm, filterLevel, sortBy]);
  
  // Calcular estadísticas con memoización
  const estadisticas = useMemo(() => {
    return respuestas.reduce((stats, resp) => {
      stats.total++
      stats[resp.nivel] = (stats[resp.nivel] || 0) + 1
      return stats
    }, { total: 0, bajo: 0, moderado: 0, alto: 0, muy_alto: 0, sin_datos: 0 })
  }, [respuestas]);
  
  return {
    // Estado
    respuestas: respuestasFiltradas,
    respuestasOriginales: respuestas,
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
  }
}

export default useResponses