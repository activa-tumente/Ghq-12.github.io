/**
 * Query Strategy Pattern Implementation
 * Provides different strategies for handling various types of queries
 * with optimized caching, error handling, and performance characteristics
 */

import { supabase } from '../api/supabase';
import { getConfig } from '../config';
import { AppError, SupabaseErrorHandler } from '../utils/ErrorHandling';

/**
 * Base Query Strategy Interface
 */
class BaseQueryStrategy {
  constructor(options = {}) {
    this.options = {
      timeout: 30000,
      retries: 3,
      cacheTTL: 300000, // 5 minutes
      enableCache: true,
      enableMetrics: true,
      ...options
    };
    this.errorHandler = new SupabaseErrorHandler();
  }

  /**
   * Execute query with strategy-specific logic
   * @param {Object} params - Query parameters
   * @param {Object} context - Execution context
   * @returns {Promise} Query result
   */
  async execute(params, context = {}) {
    throw new Error('execute method must be implemented by strategy');
  }

  /**
   * Validate query parameters
   * @param {Object} params - Parameters to validate
   * @returns {boolean} Validation result
   */
  validateParams(params) {
    return true; // Override in specific strategies
  }

  /**
   * Generate cache key for the query
   * @param {Object} params - Query parameters
   * @returns {string} Cache key
   */
  generateCacheKey(params) {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {});
    return `${this.constructor.name}_${JSON.stringify(sortedParams)}`;
  }

  /**
   * Handle query errors with strategy-specific logic
   * @param {Error} error - The error to handle
   * @param {Object} context - Error context
   * @returns {Promise} Recovery result or re-thrown error
   */
  async handleError(error, context = {}) {
    return this.errorHandler.handleError(error, {
      strategy: this.constructor.name,
      ...context
    });
  }
}

/**
 * Dashboard Analytics Query Strategy
 * Optimized for complex aggregation queries with heavy caching
 */
class DashboardAnalyticsStrategy extends BaseQueryStrategy {
  constructor(options = {}) {
    super({
      cacheTTL: 600000, // 10 minutes for analytics
      timeout: 45000, // Longer timeout for complex queries
      ...options
    });
  }

  validateParams(params) {
    const { dateRange, filters } = params;
    
    if (dateRange && (!dateRange.start || !dateRange.end)) {
      throw new AppError(
        'Invalid date range: start and end dates are required',
        'VALIDATION_ERROR',
        { dateRange }
      );
    }

    if (dateRange && new Date(dateRange.start) > new Date(dateRange.end)) {
      throw new AppError(
        'Invalid date range: start date must be before end date',
        'VALIDATION_ERROR',
        { dateRange }
      );
    }

    return true;
  }

  async execute(params, context = {}) {
    this.validateParams(params);

    const { dateRange, filters = {}, includeDetails = false } = params;
    
    try {
      // Build base query
      let query = supabase
        .from('respuestas')
        .select(`
          id,
          persona_id,
          pregunta_id,
          respuesta,
          created_at,
          personas!inner(
            id,
            edad,
            genero,
            nivel_educativo,
            experiencia_conduccion
          ),
          preguntas!inner(
            id,
            categoria,
            subcategoria,
            texto
          )
        `);

      // Apply date range filter
      if (dateRange) {
        query = query
          .gte('created_at', dateRange.start)
          .lte('created_at', dateRange.end);
      }

      // Apply demographic filters
      if (filters.edad) {
        query = query.eq('personas.edad', filters.edad);
      }
      if (filters.genero) {
        query = query.eq('personas.genero', filters.genero);
      }
      if (filters.nivel_educativo) {
        query = query.eq('personas.nivel_educativo', filters.nivel_educativo);
      }
      if (filters.experiencia_conduccion) {
        query = query.eq('personas.experiencia_conduccion', filters.experiencia_conduccion);
      }

      // Apply question filters
      if (filters.categoria) {
        query = query.eq('preguntas.categoria', filters.categoria);
      }
      if (filters.subcategoria) {
        query = query.eq('preguntas.subcategoria', filters.subcategoria);
      }

      // Execute query with timeout
      const { data, error } = await Promise.race([
        query,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout')), this.options.timeout)
        )
      ]);

      if (error) {
        throw error;
      }

      // Process and aggregate data
      const analytics = this.processAnalyticsData(data, { includeDetails });
      
      return {
        success: true,
        data: analytics,
        metadata: {
          totalRecords: data.length,
          queryTime: Date.now(),
          filters: filters,
          dateRange: dateRange
        }
      };

    } catch (error) {
      return this.handleError(error, { params, context });
    }
  }

  processAnalyticsData(rawData, options = {}) {
    const { includeDetails } = options;
    
    // Group by category
    const resultadosPorCategoria = rawData.reduce((acc, item) => {
      const categoria = item.preguntas.categoria;
      if (!acc[categoria]) {
        acc[categoria] = {
          total: 0,
          respuestas: [],
          subcategorias: {}
        };
      }
      
      acc[categoria].total += 1;
      acc[categoria].respuestas.push(item.respuesta);
      
      // Group by subcategory
      const subcategoria = item.preguntas.subcategoria;
      if (!acc[categoria].subcategorias[subcategoria]) {
        acc[categoria].subcategorias[subcategoria] = {
          total: 0,
          respuestas: []
        };
      }
      acc[categoria].subcategorias[subcategoria].total += 1;
      acc[categoria].subcategorias[subcategoria].respuestas.push(item.respuesta);
      
      return acc;
    }, {});

    // Calculate averages and statistics
    Object.keys(resultadosPorCategoria).forEach(categoria => {
      const categoryData = resultadosPorCategoria[categoria];
      const respuestas = categoryData.respuestas.map(r => parseInt(r)).filter(r => !isNaN(r));
      
      categoryData.promedio = respuestas.length > 0 
        ? respuestas.reduce((sum, val) => sum + val, 0) / respuestas.length 
        : 0;
      categoryData.minimo = respuestas.length > 0 ? Math.min(...respuestas) : 0;
      categoryData.maximo = respuestas.length > 0 ? Math.max(...respuestas) : 0;
      
      // Calculate subcategory statistics
      Object.keys(categoryData.subcategorias).forEach(subcategoria => {
        const subData = categoryData.subcategorias[subcategoria];
        const subRespuestas = subData.respuestas.map(r => parseInt(r)).filter(r => !isNaN(r));
        
        subData.promedio = subRespuestas.length > 0
          ? subRespuestas.reduce((sum, val) => sum + val, 0) / subRespuestas.length
          : 0;
      });
      
      // Remove raw responses if details not requested
      if (!includeDetails) {
        delete categoryData.respuestas;
        Object.keys(categoryData.subcategorias).forEach(sub => {
          delete categoryData.subcategorias[sub].respuestas;
        });
      }
    });

    // Generate temporal trends
    const tendenciasTemporales = this.generateTemporalTrends(rawData);
    
    // Generate demographic segmentation
    const segmentacion = this.generateDemographicSegmentation(rawData);

    return {
      resultadosPorCategoria,
      tendenciasTemporales,
      segmentacion,
      resumen: {
        totalRespuestas: rawData.length,
        totalPersonas: new Set(rawData.map(item => item.persona_id)).size,
        categorias: Object.keys(resultadosPorCategoria).length,
        fechaGeneracion: new Date().toISOString()
      }
    };
  }

  generateTemporalTrends(data) {
    const trends = data.reduce((acc, item) => {
      const date = new Date(item.created_at).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { total: 0, categorias: {} };
      }
      acc[date].total += 1;
      
      const categoria = item.preguntas.categoria;
      if (!acc[date].categorias[categoria]) {
        acc[date].categorias[categoria] = 0;
      }
      acc[date].categorias[categoria] += 1;
      
      return acc;
    }, {});

    return Object.keys(trends)
      .sort()
      .map(date => ({
        fecha: date,
        ...trends[date]
      }));
  }

  generateDemographicSegmentation(data) {
    const segmentation = {
      porEdad: {},
      porGenero: {},
      porEducacion: {},
      porExperiencia: {}
    };

    data.forEach(item => {
      const persona = item.personas;
      
      // Age segmentation
      const edad = persona.edad;
      if (!segmentation.porEdad[edad]) {
        segmentation.porEdad[edad] = { total: 0, respuestas: [] };
      }
      segmentation.porEdad[edad].total += 1;
      segmentation.porEdad[edad].respuestas.push(parseInt(item.respuesta));
      
      // Gender segmentation
      const genero = persona.genero;
      if (!segmentation.porGenero[genero]) {
        segmentation.porGenero[genero] = { total: 0, respuestas: [] };
      }
      segmentation.porGenero[genero].total += 1;
      segmentation.porGenero[genero].respuestas.push(parseInt(item.respuesta));
      
      // Education segmentation
      const educacion = persona.nivel_educativo;
      if (!segmentation.porEducacion[educacion]) {
        segmentation.porEducacion[educacion] = { total: 0, respuestas: [] };
      }
      segmentation.porEducacion[educacion].total += 1;
      segmentation.porEducacion[educacion].respuestas.push(parseInt(item.respuesta));
      
      // Experience segmentation
      const experiencia = persona.experiencia_conduccion;
      if (!segmentation.porExperiencia[experiencia]) {
        segmentation.porExperiencia[experiencia] = { total: 0, respuestas: [] };
      }
      segmentation.porExperiencia[experiencia].total += 1;
      segmentation.porExperiencia[experiencia].respuestas.push(parseInt(item.respuesta));
    });

    // Calculate averages for each segment
    Object.keys(segmentation).forEach(segmentType => {
      Object.keys(segmentation[segmentType]).forEach(segment => {
        const respuestas = segmentation[segmentType][segment].respuestas.filter(r => !isNaN(r));
        segmentation[segmentType][segment].promedio = respuestas.length > 0
          ? respuestas.reduce((sum, val) => sum + val, 0) / respuestas.length
          : 0;
        delete segmentation[segmentType][segment].respuestas; // Remove raw data
      });
    });

    return segmentation;
  }
}

/**
 * Paginated Query Strategy
 * Optimized for large datasets with cursor-based pagination
 */
class PaginatedQueryStrategy extends BaseQueryStrategy {
  constructor(options = {}) {
    super({
      cacheTTL: 60000, // 1 minute for paginated data
      defaultPageSize: 20,
      maxPageSize: 100,
      ...options
    });
  }

  validateParams(params) {
    const { page, pageSize, cursor } = params;
    
    if (page !== undefined && (page < 1 || !Number.isInteger(page))) {
      throw new AppError(
        'Invalid page number: must be a positive integer',
        'VALIDATION_ERROR',
        { page }
      );
    }

    if (pageSize !== undefined && (pageSize < 1 || pageSize > this.options.maxPageSize)) {
      throw new AppError(
        `Invalid page size: must be between 1 and ${this.options.maxPageSize}`,
        'VALIDATION_ERROR',
        { pageSize, maxPageSize: this.options.maxPageSize }
      );
    }

    return true;
  }

  async execute(params, context = {}) {
    this.validateParams(params);

    const {
      table,
      select = '*',
      filters = {},
      orderBy = { column: 'created_at', ascending: false },
      page = 1,
      pageSize = this.options.defaultPageSize,
      cursor,
      searchTerm
    } = params;

    try {
      let query = supabase.from(table).select(select, { count: 'exact' });

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else if (typeof value === 'object' && value.operator) {
            switch (value.operator) {
              case 'gte':
                query = query.gte(key, value.value);
                break;
              case 'lte':
                query = query.lte(key, value.value);
                break;
              case 'like':
                query = query.like(key, `%${value.value}%`);
                break;
              case 'ilike':
                query = query.ilike(key, `%${value.value}%`);
                break;
              default:
                query = query.eq(key, value.value);
            }
          } else {
            query = query.eq(key, value);
          }
        }
      });

      // Apply search if provided
      if (searchTerm && params.searchColumns) {
        const searchConditions = params.searchColumns
          .map(column => `${column}.ilike.%${searchTerm}%`)
          .join(',');
        query = query.or(searchConditions);
      }

      // Apply ordering
      query = query.order(orderBy.column, { ascending: orderBy.ascending });

      // Apply pagination
      if (cursor) {
        // Cursor-based pagination
        if (orderBy.ascending) {
          query = query.gt(orderBy.column, cursor);
        } else {
          query = query.lt(orderBy.column, cursor);
        }
        query = query.limit(pageSize);
      } else {
        // Offset-based pagination
        const offset = (page - 1) * pageSize;
        query = query.range(offset, offset + pageSize - 1);
      }

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      // Calculate pagination metadata
      const totalPages = Math.ceil(count / pageSize);
      const hasNextPage = cursor ? data.length === pageSize : page < totalPages;
      const hasPreviousPage = cursor ? !!cursor : page > 1;
      
      let nextCursor = null;
      let previousCursor = null;
      
      if (cursor && data.length > 0) {
        nextCursor = data[data.length - 1][orderBy.column];
        // Previous cursor would need to be tracked separately in a real implementation
      }

      return {
        success: true,
        data,
        pagination: {
          page: cursor ? null : page,
          pageSize,
          totalItems: count,
          totalPages: cursor ? null : totalPages,
          hasNextPage,
          hasPreviousPage,
          nextCursor,
          previousCursor
        },
        metadata: {
          queryTime: Date.now(),
          filters,
          orderBy,
          searchTerm
        }
      };

    } catch (error) {
      return this.handleError(error, { params, context });
    }
  }
}

/**
 * Real-time Query Strategy
 * Optimized for live data with subscriptions
 */
class RealtimeQueryStrategy extends BaseQueryStrategy {
  constructor(options = {}) {
    super({
      enableCache: false, // No caching for real-time data
      timeout: 10000,
      ...options
    });
    this.subscriptions = new Map();
  }

  async execute(params, context = {}) {
    const {
      table,
      event = '*',
      filter,
      callback,
      subscriptionId = `${table}_${Date.now()}`
    } = params;

    try {
      // Create subscription
      let subscription = supabase
        .channel(subscriptionId)
        .on('postgres_changes', {
          event,
          schema: 'public',
          table,
          filter
        }, callback);

      // Subscribe and track
      subscription.subscribe();
      this.subscriptions.set(subscriptionId, subscription);

      return {
        success: true,
        subscriptionId,
        unsubscribe: () => this.unsubscribe(subscriptionId)
      };

    } catch (error) {
      return this.handleError(error, { params, context });
    }
  }

  unsubscribe(subscriptionId) {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(subscriptionId);
      return true;
    }
    return false;
  }

  unsubscribeAll() {
    this.subscriptions.forEach((subscription, id) => {
      subscription.unsubscribe();
    });
    this.subscriptions.clear();
  }
}

/**
 * Batch Query Strategy
 * Optimized for multiple related queries
 */
class BatchQueryStrategy extends BaseQueryStrategy {
  constructor(options = {}) {
    super({
      maxBatchSize: 10,
      batchTimeout: 100, // ms to wait for batching
      ...options
    });
    this.pendingQueries = [];
    this.batchTimer = null;
  }

  async execute(params, context = {}) {
    const { queries, parallel = true } = params;

    if (!Array.isArray(queries) || queries.length === 0) {
      throw new AppError(
        'Batch queries must be a non-empty array',
        'VALIDATION_ERROR',
        { queries }
      );
    }

    if (queries.length > this.options.maxBatchSize) {
      throw new AppError(
        `Batch size exceeds maximum of ${this.options.maxBatchSize}`,
        'VALIDATION_ERROR',
        { batchSize: queries.length, maxBatchSize: this.options.maxBatchSize }
      );
    }

    try {
      const results = parallel
        ? await this.executeParallel(queries)
        : await this.executeSequential(queries);

      return {
        success: true,
        data: results,
        metadata: {
          batchSize: queries.length,
          parallel,
          queryTime: Date.now()
        }
      };

    } catch (error) {
      return this.handleError(error, { params, context });
    }
  }

  async executeParallel(queries) {
    const promises = queries.map(async (queryConfig, index) => {
      try {
        const result = await this.executeSingleQuery(queryConfig);
        return { index, success: true, data: result };
      } catch (error) {
        return { index, success: false, error: error.message };
      }
    });

    return Promise.all(promises);
  }

  async executeSequential(queries) {
    const results = [];
    
    for (let i = 0; i < queries.length; i++) {
      try {
        const result = await this.executeSingleQuery(queries[i]);
        results.push({ index: i, success: true, data: result });
      } catch (error) {
        results.push({ index: i, success: false, error: error.message });
      }
    }

    return results;
  }

  async executeSingleQuery(queryConfig) {
    const { table, select, filters, orderBy, limit } = queryConfig;
    
    let query = supabase.from(table).select(select || '*');

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    if (orderBy) {
      query = query.order(orderBy.column, { ascending: orderBy.ascending });
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    
    if (error) {
      throw error;
    }

    return data;
  }
}

/**
 * Query Strategy Factory
 * Creates appropriate strategy based on query type
 */
class QueryStrategyFactory {
  static strategies = {
    analytics: DashboardAnalyticsStrategy,
    paginated: PaginatedQueryStrategy,
    realtime: RealtimeQueryStrategy,
    batch: BatchQueryStrategy
  };

  static createStrategy(type, options = {}) {
    const StrategyClass = this.strategies[type];
    
    if (!StrategyClass) {
      throw new AppError(
        `Unknown query strategy type: ${type}`,
        'STRATEGY_ERROR',
        { type, availableTypes: Object.keys(this.strategies) }
      );
    }

    return new StrategyClass(options);
  }

  static registerStrategy(type, strategyClass) {
    if (!(strategyClass.prototype instanceof BaseQueryStrategy)) {
      throw new AppError(
        'Strategy must extend BaseQueryStrategy',
        'STRATEGY_ERROR',
        { type }
      );
    }

    this.strategies[type] = strategyClass;
  }

  static getAvailableStrategies() {
    return Object.keys(this.strategies);
  }
}

export {
  BaseQueryStrategy,
  DashboardAnalyticsStrategy,
  PaginatedQueryStrategy,
  RealtimeQueryStrategy,
  BatchQueryStrategy,
  QueryStrategyFactory
};

export default QueryStrategyFactory;