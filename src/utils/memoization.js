/**
 * Utilidades de memoización para optimizar performance
 */

/**
 * Memoización simple con TTL
 */
export class MemoCache {
  constructor(ttl = 5 * 60 * 1000) { // 5 minutos por defecto
    this.cache = new Map();
    this.ttl = ttl;
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      expiry: Date.now() + this.ttl
    });
  }

  clear() {
    this.cache.clear();
  }
}

/**
 * Decorator para memoizar métodos de clase
 */
export const memoize = (ttl = 5 * 60 * 1000) => {
  const cache = new MemoCache(ttl);
  
  return (_target, propertyName, descriptor) => {
    const originalMethod = descriptor.value;
    
    descriptor.value = function(...args) {
      const key = `${propertyName}_${JSON.stringify(args)}`;
      
      let result = cache.get(key);
      if (result === null) {
        result = originalMethod.apply(this, args);
        cache.set(key, result);
      }
      
      return result;
    };
    
    return descriptor;
  };
};

/**
 * Memoización para funciones async
 */
export const memoizeAsync = (fn, ttl = 5 * 60 * 1000) => {
  const cache = new MemoCache(ttl);
  
  return async (...args) => {
    const key = JSON.stringify(args);
    
    let result = cache.get(key);
    if (result === null) {
      result = await fn(...args);
      cache.set(key, result);
    }
    
    return result;
  };
};