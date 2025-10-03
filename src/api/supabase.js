import { createClient } from '@supabase/supabase-js'
import { CONNECTION_CONFIG, QueryOptimizer, performanceMonitor } from '../lib/supabaseOptimizations'

// Validar variables de entorno
if (!import.meta.env.VITE_SUPABASE_URL) {
  throw new Error('VITE_SUPABASE_URL is required')
}

if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
  throw new Error('VITE_SUPABASE_ANON_KEY is required')
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Configuración mejorada para Supabase con soporte para tiempo real
const supabaseConfig = {
  ...CONNECTION_CONFIG.supabaseConfig,
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
}

// Create optimized Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey, supabaseConfig)

// Initialize query optimizer
export const queryOptimizer = new QueryOptimizer(supabase)

// Función para suscribirse a cambios en tiempo real
export const subscribeToTable = (tableName, callback) => {
  return supabase
    .channel(`public:${tableName}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, (payload) => {
      callback(payload)
    })
    .subscribe()
}

export const dbHelpers = {
  // Usuarios
  getUsuarios: () => supabase.from('usuarios').select('*').order('created_at', { ascending: false }),
  getUsuarioByEmail: (email) => supabase.from('usuarios').select('*').eq('email', email).single(),
  createUsuario: (usuario) => supabase.from('usuarios').insert([usuario]).select(),
  updateUsuario: (id, updates) => supabase.from('usuarios').update(updates).eq('id', id).select(),
  deleteUsuario: (id) => supabase.from('usuarios').delete().eq('id', id),
  
  // Suscripción a cambios en usuarios
  subscribeToUsuarios: (callback) => subscribeToTable('usuarios', callback),

  // Respuestas
  createRespuestas: (respuestas) => supabase.from('respuestas_cuestionario').insert(respuestas).select(),
  getRespuestasByUsuario: (userId) => supabase.from('respuestas_cuestionario').select('*').eq('usuario_id', userId),
  getAllRespuestas: () => supabase.from('respuestas_cuestionario').select('*, usuarios(*)'),
  subscribeToRespuestas: (callback) => subscribeToTable('respuestas_cuestionario', callback),

  // Analytics y Estadísticas
  getEstadisticas: async () => {
    // Obtener estadísticas calculadas en tiempo real
    const { data: totalUsuarios } = await supabase
      .from('usuarios')
      .select('count', { count: 'exact', head: true })
    
    const { data: totalRespuestas } = await supabase
      .from('respuestas_cuestionario')
      .select('count', { count: 'exact', head: true })
    
    const { data: usuariosConRespuestas } = await supabase
      .from('respuestas_cuestionario')
      .select('usuario_id')
      .limit(1000)
    
    // Calcular usuarios únicos con respuestas
    const usuariosUnicos = new Set(usuariosConRespuestas?.map(r => r.usuario_id) || [])
    
    // Calcular puntuación promedio
    const { data: respuestas } = await supabase
      .from('respuestas_cuestionario')
      .select('respuestas')
      .limit(1000)
    
    let puntuacionTotal = 0
    let cantidadRespuestas = 0
    
    respuestas?.forEach(item => {
      if (item.respuestas && typeof item.respuestas === 'object') {
        Object.values(item.respuestas).forEach(valor => {
          if (typeof valor === 'number') {
            puntuacionTotal += valor
            cantidadRespuestas++
          }
        })
      }
    })
    
    const puntuacionPromedio = cantidadRespuestas > 0 ? puntuacionTotal / cantidadRespuestas : 0
    
    return {
      total_usuarios: totalUsuarios?.[0]?.count || 0,
      total_respuestas: totalRespuestas?.[0]?.count || 0,
      puntuacion_promedio: puntuacionPromedio,
      usuarios_con_respuestas: usuariosUnicos.size
    }
  },
  
  getResultadosPorCategoria: () => 
    supabase
      .from('respuestas_cuestionario')
      .select(`
        respuestas,
        usuarios!inner(metadata)
      `),

  getResultadosPorArea: () =>
    supabase
      .from('respuestas_cuestionario')
      .select(`
        respuestas,
        usuarios!inner(metadata)
      `),

  getEstadisticasGenerales: () =>
    supabase
      .from('respuestas_cuestionario')
      .select(`
        *,
        usuarios(nombre, email, metadata)
      `),

  // Función para marcar usuario como completado
  marcarUsuarioCompletado: (userId) =>
    supabase
      .from('usuarios')
      .update({
        metadata: { completado: true, fecha_completado: new Date().toISOString() }
      })
      .eq('id', userId),

  // Personas (alias for usuarios for compatibility)
  getPersonas: () => supabase.from('usuarios').select('*').order('created_at', { ascending: false })
}