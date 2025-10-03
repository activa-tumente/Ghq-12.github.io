/**
 * Sistema de cache para métricas con TTL y invalidación inteligente
 */
export class MetricsCache {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutos
    this.shortTTL = 1 * 60 * 1000;   // 1 minuto para datos en tiempo real
  }

  /**
   * Genera clave de cache basada en tipo y filtros
   */
  generateKey(type, filters = {}) {
    const sortedFilters = Object.keys(filters)
      .sort()
      .reduce((result, key) => {
        result[key] = filters[key];
        return result;
      }, {});
    
    return `${type}_${JSON.stringify(sortedFilters)}`;
  }

  /**
   * Obtiene datos del cache si están vigentes
   */
  get(type, filters = {}) {
    const key = this.generateKey(type, filters);
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  /**
   * Almacena datos en cache con TTL apropiado
   */
  set(type, data, filters = {}, customTTL = null) {
    const key = this.generateKey(type, filters);
    const ttl = customTTL || this.getTTLForType(type);
    const expiry = Date.now() + ttl;
    
    this.cache.set(key, {
      data,
      expiry,
      type,
      filters,
      createdAt: Date.now()
    });
  }

  /**
   * Determina TTL apropiado según el tipo de métrica
   */
  getTTLForType(type) {
    const realTimeTypes = ['dashboard', 'realtime'];
    return realTimeTypes.includes(type) ? this.shortTTL : this.defaultTTL;
  }

  /**
   * Invalida cache por tipo o patrón
   */
  invalidate(pattern) {
    if (typeof pattern === 'string') {
      // Invalidar por tipo específico
      for (const [key, item] of this.cache.entries()) {
        if (item.type === pattern) {
          this.cache.delete(key);
        }
      }
    } else if (pattern instanceof RegExp) {
      // Invalidar por patrón regex
      for (const key of this.cache.keys()) {
        if (pattern.test(key)) {
          this.cache.delete(key);
        }
      }
    }
  }

  /**
   * Limpia cache expirado
   */
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Obtiene estadísticas del cache
   */
  getStats() {
    const now = Date.now();
    let valid = 0;
    let expired = 0;
    
    for (const item of this.cache.values()) {
      if (now > item.expiry) {
        expired++;
      } else {
        valid++;
      }
    }
    
    return {
      total: this.cache.size,
      valid,
      expired,
      hitRate: this.hitRate || 0
    };
  }

  /**
   * Limpia todo el cache
   */
  clear() {
    this.cache.clear();
  }
}

// Singleton instance
export const metricsCache = new MetricsCache();

// Auto-cleanup cada 10 minutos
setInterval(() => {
  metricsCache.cleanup();
}, 10 * 60 * 1000);