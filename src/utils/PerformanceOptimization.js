// Sistema de optimización de rendimiento con mejores prácticas

import React, { 
  memo, 
  useMemo, 
  useCallback, 
  useState, 
  useEffect, 
  useRef, 
  lazy, 
  Suspense,
  createContext,
  useContext
} from 'react';

// Contexto para métricas de rendimiento
const PerformanceContext = createContext({
  metrics: {},
  startMeasure: () => {},
  endMeasure: () => {},
  getMetrics: () => {}
});

// Provider de métricas de rendimiento
export const PerformanceProvider = ({ children }) => {
  const [metrics, setMetrics] = useState({});
  const measurementsRef = useRef({});

  const startMeasure = useCallback((name) => {
    measurementsRef.current[name] = {
      startTime: performance.now(),
      startMemory: performance.memory ? performance.memory.usedJSHeapSize : 0
    };
  }, []);

  const endMeasure = useCallback((name) => {
    const measurement = measurementsRef.current[name];
    if (!measurement) return;

    const endTime = performance.now();
    const endMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
    
    const duration = endTime - measurement.startTime;
    const memoryDelta = endMemory - measurement.startMemory;

    setMetrics(prev => ({
      ...prev,
      [name]: {
        duration,
        memoryDelta,
        timestamp: new Date().toISOString(),
        ...(prev[name] || {}),
        history: [
          ...(prev[name]?.history || []).slice(-9), // Mantener últimas 10 mediciones
          { duration, memoryDelta, timestamp: new Date().toISOString() }
        ]
      }
    }));

    delete measurementsRef.current[name];
  }, []);

  const getMetrics = useCallback((name) => {
    return name ? metrics[name] : metrics;
  }, [metrics]);

  return (
    <PerformanceContext.Provider value={{
      metrics,
      startMeasure,
      endMeasure,
      getMetrics
    }}>
      {children}
    </PerformanceContext.Provider>
  );
};

// Hook para usar métricas de rendimiento
export const usePerformance = () => {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformance debe usarse dentro de PerformanceProvider');
  }
  return context;
};

// Hook para medir rendimiento de componentes
export const useComponentPerformance = (componentName) => {
  const { startMeasure, endMeasure } = usePerformance();
  const renderCountRef = useRef(0);
  const mountTimeRef = useRef(null);

  useEffect(() => {
    mountTimeRef.current = performance.now();
    startMeasure(`${componentName}-mount`);
    
    return () => {
      endMeasure(`${componentName}-mount`);
    };
  }, [componentName, startMeasure, endMeasure]);

  useEffect(() => {
    renderCountRef.current += 1;
    startMeasure(`${componentName}-render-${renderCountRef.current}`);
    
    const timeoutId = setTimeout(() => {
      endMeasure(`${componentName}-render-${renderCountRef.current}`);
    }, 0);

    return () => clearTimeout(timeoutId);
  });

  return {
    renderCount: renderCountRef.current,
    mountTime: mountTimeRef.current
  };
};

// HOC para memoización inteligente
export const withSmartMemo = (Component, propsAreEqual) => {
  const MemoizedComponent = memo(Component, propsAreEqual);
  
  const SmartMemoComponent = (props) => {
    const { renderCount } = useComponentPerformance(Component.displayName || Component.name);
    
    if (process.env.NODE_ENV === 'development' && renderCount > 10) {
      console.warn(`Componente ${Component.displayName || Component.name} ha renderizado ${renderCount} veces. Considera optimizar.`);
    }
    
    return <MemoizedComponent {...props} />;
  };
  
  SmartMemoComponent.displayName = `withSmartMemo(${Component.displayName || Component.name})`;
  return SmartMemoComponent;
};

// Hook para debouncing optimizado
export const useOptimizedDebounce = (value, delay, options = {}) => {
  const {
    leading = false,
    trailing = true,
    maxWait = null
  } = options;
  
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timeoutRef = useRef(null);
  const maxTimeoutRef = useRef(null);
  const lastCallTimeRef = useRef(null);
  const lastInvokeTimeRef = useRef(0);

  useEffect(() => {
    const invokeFunc = () => {
      setDebouncedValue(value);
      lastInvokeTimeRef.current = Date.now();
    };

    const shouldInvoke = () => {
      const time = Date.now();
      const timeSinceLastCall = time - (lastCallTimeRef.current || 0);
      const timeSinceLastInvoke = time - lastInvokeTimeRef.current;
      
      return (
        lastCallTimeRef.current === null ||
        timeSinceLastCall >= delay ||
        (maxWait && timeSinceLastInvoke >= maxWait)
      );
    };

    const leadingEdge = () => {
      lastInvokeTimeRef.current = Date.now();
      if (leading) {
        invokeFunc();
      }
    };

    const trailingEdge = () => {
      timeoutRef.current = null;
      if (trailing) {
        invokeFunc();
      }
    };

    const timerExpired = () => {
      const time = Date.now();
      const timeSinceLastCall = time - (lastCallTimeRef.current || 0);
      
      if (timeSinceLastCall < delay) {
        timeoutRef.current = setTimeout(timerExpired, delay - timeSinceLastCall);
      } else {
        trailingEdge();
      }
    };

    lastCallTimeRef.current = Date.now();
    
    if (shouldInvoke()) {
      if (timeoutRef.current === null) {
        leadingEdge();
      }
      
      if (maxWait && !maxTimeoutRef.current) {
        maxTimeoutRef.current = setTimeout(() => {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            trailingEdge();
          }
          maxTimeoutRef.current = null;
        }, maxWait);
      }
    }
    
    if (timeoutRef.current === null) {
      timeoutRef.current = setTimeout(timerExpired, delay);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (maxTimeoutRef.current) {
        clearTimeout(maxTimeoutRef.current);
        maxTimeoutRef.current = null;
      }
    };
  }, [value, delay, leading, trailing, maxWait]);

  return debouncedValue;
};

// Hook para throttling optimizado
export const useOptimizedThrottle = (callback, delay, options = {}) => {
  const { leading = true, trailing = true } = options;
  const lastCallTimeRef = useRef(null);
  const timeoutRef = useRef(null);
  const lastArgsRef = useRef(null);

  const throttledCallback = useCallback((...args) => {
    const now = Date.now();
    lastArgsRef.current = args;

    const invokeFunc = () => {
      lastCallTimeRef.current = now;
      callback(...lastArgsRef.current);
    };

    if (lastCallTimeRef.current === null) {
      if (leading) {
        invokeFunc();
      } else {
        lastCallTimeRef.current = now;
      }
      
      if (trailing) {
        timeoutRef.current = setTimeout(() => {
          if (lastArgsRef.current) {
            callback(...lastArgsRef.current);
          }
          timeoutRef.current = null;
        }, delay);
      }
    } else {
      const timeSinceLastCall = now - lastCallTimeRef.current;
      
      if (timeSinceLastCall >= delay) {
        invokeFunc();
        
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      } else if (trailing && !timeoutRef.current) {
        timeoutRef.current = setTimeout(() => {
          callback(...lastArgsRef.current);
          timeoutRef.current = null;
        }, delay - timeSinceLastCall);
      }
    }
  }, [callback, delay, leading, trailing]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledCallback;
};

// Hook para lazy loading de imágenes
export const useLazyImage = (src, options = {}) => {
  const {
    rootMargin = '50px',
    threshold = 0.1,
    placeholder = null
  } = options;
  
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (!src || !imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const img = new Image();
          
          img.onload = () => {
            setImageSrc(src);
            setIsLoaded(true);
            observer.disconnect();
          };
          
          img.onerror = () => {
            setIsError(true);
            observer.disconnect();
          };
          
          img.src = src;
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [src, rootMargin, threshold]);

  return {
    ref: imgRef,
    src: imageSrc,
    isLoaded,
    isError
  };
};

// Componente de imagen lazy optimizada
export const LazyImage = memo(({
  src,
  alt,
  placeholder,
  className = '',
  onLoad,
  onError,
  ...props
}) => {
  const { ref, src: lazySrc, isLoaded, isError } = useLazyImage(src, { placeholder });

  const handleLoad = useCallback((e) => {
    if (onLoad) onLoad(e);
  }, [onLoad]);

  const handleError = useCallback((e) => {
    if (onError) onError(e);
  }, [onError]);

  return (
    <img
      ref={ref}
      src={lazySrc}
      alt={alt}
      className={`transition-opacity duration-300 ${
        isLoaded ? 'opacity-100' : 'opacity-50'
      } ${className}`}
      onLoad={handleLoad}
      onError={handleError}
      {...props}
    />
  );
});

LazyImage.displayName = 'LazyImage';

// Hook para virtualización de listas
export const useVirtualList = ({
  items,
  itemHeight,
  containerHeight,
  overscan = 5
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef(null);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      index: startIndex + index
    }));
  }, [items, startIndex, endIndex]);

  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = useOptimizedThrottle((e) => {
    setScrollTop(e.target.scrollTop);
  }, 16); // ~60fps

  return {
    scrollElementRef,
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll
  };
};

// Componente de lista virtualizada
export const VirtualList = memo(({
  items,
  itemHeight,
  height,
  renderItem,
  className = '',
  overscan = 5
}) => {
  const {
    scrollElementRef,
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll
  } = useVirtualList({
    items,
    itemHeight,
    containerHeight: height,
    overscan
  });

  return (
    <div
      ref={scrollElementRef}
      className={`overflow-auto ${className}`}
      style={{ height }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map(({ item, index }) => (
            <div
              key={index}
              style={{ height: itemHeight }}
            >
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

VirtualList.displayName = 'VirtualList';

// Hook para lazy loading de componentes
export const useLazyComponent = (importFunc, fallback = null) => {
  const [Component, setComponent] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadComponent = useCallback(async () => {
    if (Component || isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const module = await importFunc();
      setComponent(() => module.default || module);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [importFunc, Component, isLoading]);

  return {
    Component,
    isLoading,
    error,
    loadComponent
  };
};

// Componente de carga lazy con Suspense
export const LazyComponentLoader = ({
  importFunc,
  fallback = <div>Cargando...</div>,
  errorFallback = <div>Error al cargar componente</div>,
  ...props
}) => {
  const LazyComponent = useMemo(() => lazy(importFunc), [importFunc]);

  return (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

// Hook para optimización de re-renders
export const useRenderOptimization = (dependencies = []) => {
  const renderCountRef = useRef(0);
  const lastDepsRef = useRef(dependencies);
  const unnecessaryRendersRef = useRef(0);

  useEffect(() => {
    renderCountRef.current += 1;
    
    // Verificar si las dependencias realmente cambiaron
    const depsChanged = dependencies.some((dep, index) => {
      return dep !== lastDepsRef.current[index];
    });
    
    if (!depsChanged && renderCountRef.current > 1) {
      unnecessaryRendersRef.current += 1;
      
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `Render innecesario detectado. Total: ${unnecessaryRendersRef.current}`,
          { dependencies, lastDeps: lastDepsRef.current }
        );
      }
    }
    
    lastDepsRef.current = dependencies;
  });

  return {
    renderCount: renderCountRef.current,
    unnecessaryRenders: unnecessaryRendersRef.current
  };
};

// Utilidades de optimización
export const optimizationUtils = {
  // Crear comparador de props personalizado
  createPropsComparator: (keys) => {
    return (prevProps, nextProps) => {
      if (keys) {
        return keys.every(key => prevProps[key] === nextProps[key]);
      }
      
      const prevKeys = Object.keys(prevProps);
      const nextKeys = Object.keys(nextProps);
      
      if (prevKeys.length !== nextKeys.length) {
        return false;
      }
      
      return prevKeys.every(key => prevProps[key] === nextProps[key]);
    };
  },

  // Shallow compare optimizado
  shallowEqual: (obj1, obj2) => {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    if (keys1.length !== keys2.length) {
      return false;
    }
    
    return keys1.every(key => obj1[key] === obj2[key]);
  },

  // Deep compare para objetos pequeños
  deepEqual: (obj1, obj2) => {
    if (obj1 === obj2) return true;
    
    if (obj1 == null || obj2 == null) return false;
    
    if (typeof obj1 !== typeof obj2) return false;
    
    if (typeof obj1 !== 'object') return obj1 === obj2;
    
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    if (keys1.length !== keys2.length) return false;
    
    return keys1.every(key => optimizationUtils.deepEqual(obj1[key], obj2[key]));
  },

  // Crear función memoizada con cache personalizado
  createMemoizedFunction: (fn, cacheSize = 10) => {
    const cache = new Map();
    
    return (...args) => {
      const key = JSON.stringify(args);
      
      if (cache.has(key)) {
        return cache.get(key);
      }
      
      const result = fn(...args);
      
      if (cache.size >= cacheSize) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }
      
      cache.set(key, result);
      return result;
    };
  },

  // Batch de actualizaciones de estado
  batchStateUpdates: (updates) => {
    return new Promise(resolve => {
      // En React 18+, las actualizaciones ya están batcheadas automáticamente
      // Esta función es para compatibilidad con versiones anteriores
      if (typeof ReactDOM !== 'undefined' && ReactDOM.unstable_batchedUpdates) {
        ReactDOM.unstable_batchedUpdates(() => {
          updates.forEach(update => update());
          resolve();
        });
      } else {
        updates.forEach(update => update());
        resolve();
      }
    });
  }
};

// Monitor de rendimiento para desarrollo
export const PerformanceMonitor = ({ children, enabled = process.env.NODE_ENV === 'development' }) => {
  const { metrics } = usePerformance();
  const [showMetrics, setShowMetrics] = useState(false);

  if (!enabled) {
    return children;
  }

  return (
    <>
      {children}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setShowMetrics(!showMetrics)}
          className="bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700"
          title="Mostrar métricas de rendimiento"
        >
          📊
        </button>
        
        {showMetrics && (
          <div className="absolute bottom-12 right-0 bg-white border rounded-lg shadow-lg p-4 w-80 max-h-96 overflow-auto">
            <h3 className="font-bold mb-2">Métricas de Rendimiento</h3>
            {Object.entries(metrics).map(([name, metric]) => (
              <div key={name} className="mb-2 text-sm">
                <div className="font-medium">{name}</div>
                <div className="text-gray-600">
                  Duración: {metric.duration?.toFixed(2)}ms
                </div>
                {metric.memoryDelta && (
                  <div className="text-gray-600">
                    Memoria: {(metric.memoryDelta / 1024 / 1024).toFixed(2)}MB
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default {
  PerformanceProvider,
  usePerformance,
  useComponentPerformance,
  withSmartMemo,
  useOptimizedDebounce,
  useOptimizedThrottle,
  useLazyImage,
  LazyImage,
  useVirtualList,
  VirtualList,
  useLazyComponent,
  LazyComponentLoader,
  useRenderOptimization,
  optimizationUtils,
  PerformanceMonitor
};