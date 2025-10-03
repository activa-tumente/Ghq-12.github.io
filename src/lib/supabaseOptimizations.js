/**
 * Supabase Database Optimizations
 * SQL queries and configurations for better performance
 */

// Database indexes for better query performance
export const DATABASE_INDEXES = {
  // Usuarios table indexes
  usuarios: [
    'CREATE INDEX IF NOT EXISTS idx_usuarios_area_macro ON usuarios(area_macro);',
    'CREATE INDEX IF NOT EXISTS idx_usuarios_activo ON usuarios(activo);',
    'CREATE INDEX IF NOT EXISTS idx_usuarios_fecha_creacion ON usuarios(fecha_creacion DESC);',
    'CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);',
    'CREATE INDEX IF NOT EXISTS idx_usuarios_area_activo ON usuarios(area_macro, activo);'
  ],
  
  // Respuestas_cuestionario table indexes
  respuestas_cuestionario: [
    'CREATE INDEX IF NOT EXISTS idx_respuestas_usuario_id ON respuestas_cuestionario(usuario_id);',
    'CREATE INDEX IF NOT EXISTS idx_respuestas_pregunta_id ON respuestas_cuestionario(pregunta_id);',
    'CREATE INDEX IF NOT EXISTS idx_respuestas_usuario_pregunta ON respuestas_cuestionario(usuario_id, pregunta_id);',
    'CREATE INDEX IF NOT EXISTS idx_respuestas_respuesta ON respuestas_cuestionario(respuesta);'
  ],
  
  // Preguntas table indexes
  preguntas: [
    'CREATE INDEX IF NOT EXISTS idx_preguntas_categoria ON preguntas(categoria);',
    'CREATE INDEX IF NOT EXISTS idx_preguntas_activa ON preguntas(activa);'
  ]
};

// Optimized queries with proper joins and filtering
export const OPTIMIZED_QUERIES = {
  // Dashboard analytics with single query
  getDashboardAnalytics: `
    WITH usuario_stats AS (
      SELECT 
        COUNT(*) as total_participantes,
        COUNT(CASE WHEN activo = true THEN 1 END) as activos,
        COUNT(CASE WHEN activo = false THEN 1 END) as inactivos,
        area_macro
      FROM usuarios 
      WHERE fecha_creacion >= NOW() - INTERVAL '30 days'
      GROUP BY area_macro
    ),
    respuesta_stats AS (
      SELECT 
        AVG(respuesta::numeric) as promedio_general,
        p.dimension,
        COUNT(*) as total_respuestas
      FROM respuestas_cuestionario r
      JOIN preguntas p ON r.pregunta_id = p.id
      JOIN usuarios u ON r.usuario_id = u.id
      WHERE u.activo = true
      GROUP BY p.dimension
    )
    SELECT 
      us.*,
      rs.promedio_general,
      rs.dimension,
      rs.total_respuestas
    FROM usuario_stats us
    CROSS JOIN respuesta_stats rs;
  `,
  
  // Optimized usuarios with pagination
  getUsuariosPaginated: `
    SELECT 
      u.*,
      COALESCE(AVG(r.respuesta::numeric), 0) as promedio,
      COUNT(r.id) as respuestas_count
    FROM usuarios u
    LEFT JOIN respuestas_cuestionario r ON u.id = r.usuario_id
    WHERE ($1::text IS NULL OR u.area_macro = $1)
      AND ($2::boolean IS NULL OR u.activo = $2)
    GROUP BY u.id
    ORDER BY u.fecha_creacion DESC
    LIMIT $3 OFFSET $4;
  `,
  
  // Results by dimension with performance optimization
  getResultadosPorDimension: `
    SELECT 
      p.dimension,
      AVG(r.respuesta::numeric) as promedio,
      COUNT(r.id) as total_respuestas,
      STDDEV(r.respuesta::numeric) as desviacion_estandar
    FROM preguntas p
    JOIN respuestas_cuestionario r ON p.id = r.pregunta_id
    JOIN usuarios u ON r.usuario_id = u.id
    WHERE u.activo = true
      AND ($1::text IS NULL OR u.area_macro = $1)
      AND u.fecha_creacion >= COALESCE($2::timestamp, NOW() - INTERVAL '30 days')
    GROUP BY p.dimension
    ORDER BY promedio DESC;
  `,
  
  // Results by area with aggregation
  getResultadosPorArea: `
    SELECT 
      u.area_macro,
      AVG(r.respuesta::numeric) as promedio,
      COUNT(DISTINCT u.id) as participantes,
      COUNT(r.id) as total_respuestas,
      COUNT(CASE WHEN u.activo = true THEN 1 END) as activos
    FROM usuarios u
    LEFT JOIN respuestas_cuestionario r ON u.id = r.usuario_id
    WHERE u.fecha_creacion >= COALESCE($1::timestamp, NOW() - INTERVAL '30 days')
    GROUP BY u.area_macro
    ORDER BY promedio DESC;
  `,
  
  // Temporal trends with date aggregation
  getTendenciasTemporales: `
    SELECT 
      DATE_TRUNC('day', u.fecha_creacion) as fecha,
      AVG(r.respuesta::numeric) as promedio,
      COUNT(DISTINCT u.id) as participantes,
      COUNT(r.id) as total_respuestas
    FROM usuarios u
    JOIN respuestas_cuestionario r ON u.id = r.usuario_id
    WHERE u.activo = true
      AND u.fecha_creacion >= $1::timestamp
      AND u.fecha_creacion <= $2::timestamp
    GROUP BY DATE_TRUNC('day', u.fecha_creacion)
    ORDER BY fecha ASC;
  `,
  
  // Detailed usuario analysis
  getUsuarioAnalysis: `
    SELECT 
      u.*,
      AVG(r.respuesta::numeric) as promedio_general,
      COUNT(r.id) as total_respuestas,
      JSON_AGG(
        JSON_BUILD_OBJECT(
          'dimension', p.dimension,
          'pregunta', p.texto,
          'respuesta', r.respuesta
        ) ORDER BY p.dimension, p.id
      ) as respuestas_detalle
    FROM usuarios u
    LEFT JOIN respuestas_cuestionario r ON u.id = r.usuario_id
    LEFT JOIN preguntas p ON r.pregunta_id = p.id
    WHERE u.id = $1
    GROUP BY u.id;
  `
};

// Query optimization utilities
export class QueryOptimizer {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
    this.queryCache = new Map();
    this.queryStats = new Map();
  }

  // Execute optimized query with caching
  async executeOptimizedQuery(queryName, params = [], options = {}) {
    const { useCache = true, cacheTime = 300000 } = options; // 5 minutes default
    
    const cacheKey = `${queryName}:${JSON.stringify(params)}`;
    const startTime = Date.now();
    
    // Check cache first
    if (useCache && this.queryCache.has(cacheKey)) {
      const cached = this.queryCache.get(cacheKey);
      if (Date.now() - cached.timestamp < cacheTime) {
        this.updateQueryStats(queryName, Date.now() - startTime, true);
        return cached.data;
      }
    }
    
    try {
      // Execute query
      const query = OPTIMIZED_QUERIES[queryName];
      if (!query) {
        throw new Error(`Query ${queryName} not found`);
      }
      
      const { data, error } = await this.supabase.rpc('execute_sql', {
        query,
        params
      });
      
      if (error) throw error;
      
      // Cache result
      if (useCache) {
        this.queryCache.set(cacheKey, {
          data,
          timestamp: Date.now()
        });
      }
      
      this.updateQueryStats(queryName, Date.now() - startTime, false);
      return data;
      
    } catch (error) {
      this.updateQueryStats(queryName, Date.now() - startTime, false, true);
      throw error;
    }
  }
  
  // Update query performance statistics
  updateQueryStats(queryName, duration, fromCache, hasError = false) {
    if (!this.queryStats.has(queryName)) {
      this.queryStats.set(queryName, {
        totalExecutions: 0,
        totalTime: 0,
        avgTime: 0,
        cacheHits: 0,
        errors: 0
      });
    }
    
    const stats = this.queryStats.get(queryName);
    stats.totalExecutions++;
    stats.totalTime += duration;
    stats.avgTime = stats.totalTime / stats.totalExecutions;
    
    if (fromCache) stats.cacheHits++;
    if (hasError) stats.errors++;
  }
  
  // Get query performance statistics
  getQueryStats() {
    return Object.fromEntries(this.queryStats);
  }
  
  // Clear query cache
  clearCache(pattern) {
    if (pattern) {
      for (const key of this.queryCache.keys()) {
        if (key.includes(pattern)) {
          this.queryCache.delete(key);
        }
      }
    } else {
      this.queryCache.clear();
    }
  }
  
  // Create database indexes
  async createIndexes() {
    const allIndexes = Object.values(DATABASE_INDEXES).flat();
    
    for (const indexQuery of allIndexes) {
      try {
        await this.supabase.rpc('execute_sql', { query: indexQuery });
        console.log('✅ Index created:', indexQuery.split(' ')[5]);
      } catch (error) {
        console.warn('⚠️ Index creation failed:', error.message);
      }
    }
  }
}

// Connection pool optimization
export const CONNECTION_CONFIG = {
  // Supabase client configuration for better performance
  supabaseConfig: {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false
    },
    db: {
      schema: 'public'
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    },
    global: {
      headers: {
        'x-client-info': 'bat7-dashboard'
      }
    }
  },
  
  // Query timeout settings
  timeouts: {
    default: 30000, // 30 seconds
    analytics: 60000, // 1 minute for complex analytics
    reports: 120000 // 2 minutes for heavy reports
  }
};

// Performance monitoring utilities
export class PerformanceMonitor {
  constructor() {
    this.metrics = {
      queryCount: 0,
      totalQueryTime: 0,
      slowQueries: [],
      errorCount: 0
    };
  }
  
  // Track query performance
  trackQuery(queryName, duration, success = true) {
    this.metrics.queryCount++;
    this.metrics.totalQueryTime += duration;
    
    if (!success) {
      this.metrics.errorCount++;
    }
    
    // Track slow queries (> 1 second)
    if (duration > 1000) {
      this.metrics.slowQueries.push({
        queryName,
        duration,
        timestamp: new Date().toISOString()
      });
      
      // Keep only last 10 slow queries
      if (this.metrics.slowQueries.length > 10) {
        this.metrics.slowQueries.shift();
      }
    }
  }
  
  // Get performance summary
  getSummary() {
    return {
      ...this.metrics,
      avgQueryTime: this.metrics.queryCount > 0 
        ? this.metrics.totalQueryTime / this.metrics.queryCount 
        : 0,
      errorRate: this.metrics.queryCount > 0 
        ? (this.metrics.errorCount / this.metrics.queryCount) * 100 
        : 0
    };
  }
  
  // Reset metrics
  reset() {
    this.metrics = {
      queryCount: 0,
      totalQueryTime: 0,
      slowQueries: [],
      errorCount: 0
    };
  }
}

// Export singleton instances
export const performanceMonitor = new PerformanceMonitor();

export default {
  DATABASE_INDEXES,
  OPTIMIZED_QUERIES,
  QueryOptimizer,
  CONNECTION_CONFIG,
  PerformanceMonitor,
  performanceMonitor
};