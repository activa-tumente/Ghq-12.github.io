// Sistema avanzado de análisis y optimización de rendimiento

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

// Contexto para análisis de rendimiento
const PerformanceContext = createContext({
  metrics: {},
  startMeasurement: () => {},
  endMeasurement: () => {},
  getBottlenecks: () => {},
  optimizationSuggestions: []
});

// Provider de análisis de rendimiento
export const PerformanceProvider = ({ children }) => {
  const [metrics, setMetrics] = useState({});
  const [optimizationSuggestions, setOptimizationSuggestions] = useState([]);
  const measurementsRef = useRef(new Map());
  const observerRef = useRef(null);

  useEffect(() => {
    // Configurar Performance Observer
    if ('PerformanceObserver' in window) {
      observerRef.current = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          updateMetrics(entry);
        });
      });
      
      observerRef.current.observe({ entryTypes: ['measure', 'navigation', 'paint', 'largest-contentful-paint'] });
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const updateMetrics = useCallback((entry) => {
    setMetrics(prev => ({
      ...prev,
      [entry.name]: {
        ...prev[entry.name],
        duration: entry.duration,
        startTime: entry.startTime,
        timestamp: Date.now(),
        type: entry.entryType
      }
    }));
  }, []);

  const startMeasurement = useCallback((name) => {
    performance.mark(`${name}-start`);
    measurementsRef.current.set(name, Date.now());
  }, []);

  const endMeasurement = useCallback((name) => {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    const startTime = measurementsRef.current.get(name);
    if (startTime) {
      const duration = Date.now() - startTime;
      updateMetrics({
        name,
        duration,
        startTime,
        entryType: 'custom'
      });
      measurementsRef.current.delete(name);
    }
  }, [updateMetrics]);

  const getBottlenecks = useCallback(() => {
    return Object.entries(metrics)
      .filter(([_, metric]) => metric.duration > 100) // Más de 100ms
      .sort(([_, a], [__, b]) => b.duration - a.duration)
      .map(([name, metric]) => ({
        name,
        duration: metric.duration,
        severity: metric.duration > 1000 ? 'critical' : metric.duration > 500 ? 'high' : 'medium',
        type: metric.type
      }));
  }, [metrics]);

  return (
    <PerformanceContext.Provider value={{
      metrics,
      startMeasurement,
      endMeasurement,
      getBottlenecks,
      optimizationSuggestions
    }}>
      {children}
    </PerformanceContext.Provider>
  );
};

// Hook para usar análisis de rendimiento
export const usePerformanceAnalysis = () => {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformanceAnalysis debe usarse dentro de PerformanceProvider');
  }
  return context;
};

// HOC para medir rendimiento de componentes
export const withPerformanceTracking = (WrappedComponent, componentName) => {
  return React.memo((props) => {
    const { startMeasurement, endMeasurement } = usePerformanceAnalysis();
    const renderCountRef = useRef(0);
    const mountTimeRef = useRef(null);

    useEffect(() => {
      mountTimeRef.current = Date.now();
      startMeasurement(`${componentName}-mount`);
      
      return () => {
        endMeasurement(`${componentName}-mount`);
      };
    }, []);

    useEffect(() => {
      renderCountRef.current += 1;
      startMeasurement(`${componentName}-render-${renderCountRef.current}`);
      
      const timeoutId = setTimeout(() => {
        endMeasurement(`${componentName}-render-${renderCountRef.current}`);
      }, 0);
      
      return () => clearTimeout(timeoutId);
    });

    return <WrappedComponent {...props} />;
  });
};

// Hook para medir rendimiento de funciones
export const usePerformanceMeasure = (functionName) => {
  const { startMeasurement, endMeasurement } = usePerformanceAnalysis();
  
  return useCallback((fn) => {
    return async (...args) => {
      startMeasurement(functionName);
      try {
        const result = await fn(...args);
        return result;
      } finally {
        endMeasurement(functionName);
      }
    };
  }, [functionName, startMeasurement, endMeasurement]);
};

// Analizador de código para detectar problemas de rendimiento
export class CodePerformanceAnalyzer {
  static analyzeComponent(code, componentName) {
    const issues = [];
    const lines = code.split('\n');
    
    // Detectar re-renders innecesarios
    const rerenderIssues = this.detectRerenderIssues(code, lines);
    issues.push(...rerenderIssues);
    
    // Detectar operaciones costosas en render
    const expensiveOperations = this.detectExpensiveOperations(code, lines);
    issues.push(...expensiveOperations);
    
    // Detectar problemas de memoria
    const memoryIssues = this.detectMemoryIssues(code, lines);
    issues.push(...memoryIssues);
    
    // Detectar problemas de bundle size
    const bundleIssues = this.detectBundleIssues(code, lines);
    issues.push(...bundleIssues);
    
    return {
      componentName,
      issues: issues.sort((a, b) => this.getPriorityScore(b.priority) - this.getPriorityScore(a.priority)),
      score: this.calculatePerformanceScore(issues),
      recommendations: this.generateRecommendations(issues)
    };
  }
  
  static detectRerenderIssues(code, lines) {
    const issues = [];
    
    lines.forEach((line, index) => {
      // Funciones inline en props
      if (line.includes('onClick={') && line.includes('=>') && !code.includes('useCallback')) {
        issues.push({
          type: 'rerender',
          priority: 'high',
          line: index + 1,
          message: 'Función inline en prop causa re-renders innecesarios',
          solution: 'Usar useCallback para memoizar la función',
          code: line.trim(),
          impact: 'Cada render del componente padre causa re-render del hijo'
        });
      }
      
      // Objetos/arrays inline en props
      if ((line.includes('={[') || line.includes('={{')) && !code.includes('useMemo')) {
        issues.push({
          type: 'rerender',
          priority: 'medium',
          line: index + 1,
          message: 'Objeto/Array inline en prop causa re-renders',
          solution: 'Usar useMemo para memoizar el valor',
          code: line.trim(),
          impact: 'Nueva referencia en cada render'
        });
      }
      
      // Componentes sin React.memo
      if (line.includes('const ') && line.includes('= (') && !code.includes('React.memo')) {
        const componentMatch = line.match(/const\s+([A-Z][a-zA-Z0-9_]*)\s*=/);
        if (componentMatch) {
          issues.push({
            type: 'rerender',
            priority: 'medium',
            line: index + 1,
            message: `Componente ${componentMatch[1]} no está memoizado`,
            solution: 'Envolver con React.memo si las props no cambian frecuentemente',
            code: line.trim(),
            impact: 'Re-render en cada cambio del componente padre'
          });
        }
      }
    });
    
    return issues;
  }
  
  static detectExpensiveOperations(code, lines) {
    const issues = [];
    
    lines.forEach((line, index) => {
      // Operaciones costosas en render
      if (line.includes('.sort(') || line.includes('.filter(') || line.includes('.map(')) {
        if (!code.includes('useMemo')) {
          issues.push({
            type: 'expensive-operation',
            priority: 'high',
            line: index + 1,
            message: 'Operación costosa en render sin memoización',
            solution: 'Mover a useMemo o useEffect',
            code: line.trim(),
            impact: 'Cálculo repetido en cada render'
          });
        }
      }
      
      // Llamadas a APIs en render
      if (line.includes('fetch(') && !line.includes('useEffect')) {
        issues.push({
          type: 'expensive-operation',
          priority: 'critical',
          line: index + 1,
          message: 'Llamada a API en render',
          solution: 'Mover a useEffect con dependencias apropiadas',
          code: line.trim(),
          impact: 'Múltiples requests innecesarios'
        });
      }
      
      // Cálculos complejos sin memoización
      if ((line.includes('Math.') || line.includes('JSON.parse') || line.includes('JSON.stringify')) && !code.includes('useMemo')) {
        issues.push({
          type: 'expensive-operation',
          priority: 'medium',
          line: index + 1,
          message: 'Cálculo complejo sin memoización',
          solution: 'Usar useMemo para cachear el resultado',
          code: line.trim(),
          impact: 'Procesamiento repetido innecesario'
        });
      }
    });
    
    return issues;
  }
  
  static detectMemoryIssues(code, lines) {
    const issues = [];
    
    lines.forEach((line, index) => {
      // Event listeners sin cleanup
      if (line.includes('addEventListener') && !code.includes('removeEventListener')) {
        issues.push({
          type: 'memory-leak',
          priority: 'high',
          line: index + 1,
          message: 'Event listener sin cleanup',
          solution: 'Agregar removeEventListener en cleanup de useEffect',
          code: line.trim(),
          impact: 'Posible memory leak'
        });
      }
      
      // Timers sin cleanup
      if ((line.includes('setInterval') || line.includes('setTimeout')) && !code.includes('clear')) {
        issues.push({
          type: 'memory-leak',
          priority: 'medium',
          line: index + 1,
          message: 'Timer sin cleanup',
          solution: 'Limpiar timer en cleanup de useEffect',
          code: line.trim(),
          impact: 'Timer continúa ejecutándose después del unmount'
        });
      }
      
      // Referencias circulares potenciales
      if (line.includes('useRef') && line.includes('.current =')) {
        issues.push({
          type: 'memory-leak',
          priority: 'low',
          line: index + 1,
          message: 'Posible referencia circular con useRef',
          solution: 'Verificar que no se creen referencias circulares',
          code: line.trim(),
          impact: 'Posible memory leak por referencias circulares'
        });
      }
    });
    
    return issues;
  }
  
  static detectBundleIssues(code, lines) {
    const issues = [];
    
    lines.forEach((line, index) => {
      // Imports completos de librerías grandes
      if (line.includes('import') && (line.includes('lodash') || line.includes('moment'))) {
        if (!line.includes('{')) {
          issues.push({
            type: 'bundle-size',
            priority: 'medium',
            line: index + 1,
            message: 'Import completo de librería grande',
            solution: 'Usar imports específicos o tree shaking',
            code: line.trim(),
            impact: 'Aumento innecesario del bundle size'
          });
        }
      }
      
      // Imports dinámicos que podrían ser lazy
      if (line.includes('import(') && !code.includes('React.lazy')) {
        issues.push({
          type: 'bundle-size',
          priority: 'low',
          line: index + 1,
          message: 'Import dinámico que podría usar React.lazy',
          solution: 'Considerar usar React.lazy para code splitting',
          code: line.trim(),
          impact: 'Oportunidad perdida de code splitting'
        });
      }
    });
    
    return issues;
  }
  
  static getPriorityScore(priority) {
    const scores = { critical: 4, high: 3, medium: 2, low: 1 };
    return scores[priority] || 0;
  }
  
  static calculatePerformanceScore(issues) {
    if (issues.length === 0) return 100;
    
    const totalPenalty = issues.reduce((sum, issue) => {
      const penalties = { critical: 25, high: 15, medium: 10, low: 5 };
      return sum + (penalties[issue.priority] || 0);
    }, 0);
    
    return Math.max(0, 100 - totalPenalty);
  }
  
  static generateRecommendations(issues) {
    const recommendations = [];
    const issueTypes = issues.reduce((acc, issue) => {
      acc[issue.type] = (acc[issue.type] || 0) + 1;
      return acc;
    }, {});
    
    if (issueTypes.rerender > 2) {
      recommendations.push({
        category: 'Re-renders',
        priority: 'high',
        description: 'Múltiples problemas de re-render detectados',
        actions: [
          'Implementar React.memo en componentes apropiados',
          'Usar useCallback para funciones en props',
          'Usar useMemo para objetos y arrays en props',
          'Considerar usar React.PureComponent para componentes de clase'
        ]
      });
    }
    
    if (issueTypes['expensive-operation'] > 1) {
      recommendations.push({
        category: 'Operaciones Costosas',
        priority: 'high',
        description: 'Operaciones costosas en render detectadas',
        actions: [
          'Mover cálculos complejos a useMemo',
          'Usar useEffect para operaciones asíncronas',
          'Implementar debouncing para operaciones frecuentes',
          'Considerar Web Workers para cálculos intensivos'
        ]
      });
    }
    
    if (issueTypes['memory-leak'] > 0) {
      recommendations.push({
        category: 'Memory Leaks',
        priority: 'medium',
        description: 'Posibles memory leaks detectados',
        actions: [
          'Implementar cleanup en useEffect',
          'Remover event listeners en unmount',
          'Limpiar timers y intervalos',
          'Verificar referencias circulares'
        ]
      });
    }
    
    if (issueTypes['bundle-size'] > 0) {
      recommendations.push({
        category: 'Bundle Size',
        priority: 'low',
        description: 'Oportunidades de optimización de bundle',
        actions: [
          'Usar imports específicos en lugar de imports completos',
          'Implementar code splitting con React.lazy',
          'Analizar bundle con webpack-bundle-analyzer',
          'Considerar lazy loading para componentes pesados'
        ]
      });
    }
    
    return recommendations;
  }
}

// Hook para análisis automático de rendimiento
export const useAutomaticPerformanceAnalysis = (componentCode, componentName) => {
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const analyzePerformance = useCallback(async () => {
    if (!componentCode) return;
    
    setIsAnalyzing(true);
    try {
      // Simular análisis asíncrono
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const result = CodePerformanceAnalyzer.analyzeComponent(componentCode, componentName);
      setAnalysis(result);
    } catch (error) {
      console.error('Error en análisis de rendimiento:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [componentCode, componentName]);
  
  useEffect(() => {
    analyzePerformance();
  }, [analyzePerformance]);
  
  return { analysis, isAnalyzing, reanalyze: analyzePerformance };
};

// Componente de dashboard de rendimiento
export const PerformanceDashboard = ({ onOptimizationApply }) => {
  const { metrics, getBottlenecks } = usePerformanceAnalysis();
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  
  const bottlenecks = getBottlenecks();
  const averageLoadTime = Object.values(metrics).reduce((sum, metric) => sum + (metric.duration || 0), 0) / Object.keys(metrics).length || 0;
  
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };
  
  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard de Rendimiento</h2>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {showDetails ? 'Ocultar Detalles' : 'Ver Detalles'}
        </button>
      </div>
      
      {/* Métricas generales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800">Tiempo Promedio</h3>
          <p className="text-2xl font-bold text-blue-600">{averageLoadTime.toFixed(2)}ms</p>
        </div>
        
        <div className="p-4 bg-green-50 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800">Métricas Activas</h3>
          <p className="text-2xl font-bold text-green-600">{Object.keys(metrics).length}</p>
        </div>
        
        <div className="p-4 bg-red-50 rounded-lg">
          <h3 className="text-lg font-semibold text-red-800">Cuellos de Botella</h3>
          <p className="text-2xl font-bold text-red-600">{bottlenecks.length}</p>
        </div>
      </div>
      
      {/* Lista de cuellos de botella */}
      {bottlenecks.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Cuellos de Botella Detectados</h3>
          <div className="space-y-2">
            {bottlenecks.map((bottleneck, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedMetric(bottleneck)}
              >
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(bottleneck.severity)}`}>
                    {bottleneck.severity.toUpperCase()}
                  </span>
                  <span className="font-medium">{bottleneck.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-gray-800">{bottleneck.duration.toFixed(2)}ms</span>
                  <span className="text-sm text-gray-500 block">{bottleneck.type}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Detalles de métrica seleccionada */}
      {selectedMetric && (
        <div className="mb-6 p-4 bg-gray-50 border rounded-lg">
          <h4 className="font-semibold mb-2">Detalles: {selectedMetric.name}</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Duración:</span> {selectedMetric.duration.toFixed(2)}ms
            </div>
            <div>
              <span className="font-medium">Severidad:</span> {selectedMetric.severity}
            </div>
            <div>
              <span className="font-medium">Tipo:</span> {selectedMetric.type}
            </div>
          </div>
          <button
            onClick={() => setSelectedMetric(null)}
            className="mt-3 px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
          >
            Cerrar
          </button>
        </div>
      )}
      
      {/* Métricas detalladas */}
      {showDetails && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Todas las Métricas</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Nombre</th>
                  <th className="text-left p-2">Duración</th>
                  <th className="text-left p-2">Tipo</th>
                  <th className="text-left p-2">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(metrics).map(([name, metric]) => (
                  <tr key={name} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{name}</td>
                    <td className="p-2">{metric.duration?.toFixed(2) || 'N/A'}ms</td>
                    <td className="p-2">{metric.type}</td>
                    <td className="p-2">{new Date(metric.timestamp).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {Object.keys(metrics).length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No hay métricas de rendimiento disponibles.</p>
          <p className="text-sm mt-1">Las métricas aparecerán cuando se ejecuten mediciones.</p>
        </div>
      )}
    </div>
  );
};

// Utilidades de optimización
export const performanceUtils = {
  // Debounce para optimizar eventos frecuentes
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },
  
  // Throttle para limitar frecuencia de ejecución
  throttle: (func, limit) => {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },
  
  // Lazy loading de imágenes
  lazyLoadImages: () => {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.remove('lazy');
            imageObserver.unobserve(img);
          }
        });
      });
      
      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  },
  
  // Preload de recursos críticos
  preloadCriticalResources: (resources) => {
    resources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource.href;
      link.as = resource.as || 'script';
      if (resource.crossorigin) link.crossOrigin = resource.crossorigin;
      document.head.appendChild(link);
    });
  },
  
  // Medir Web Vitals
  measureWebVitals: (callback) => {
    if ('web-vitals' in window) {
      import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS(callback);
        getFID(callback);
        getFCP(callback);
        getLCP(callback);
        getTTFB(callback);
      });
    }
  }
};

export default {
  PerformanceProvider,
  usePerformanceAnalysis,
  withPerformanceTracking,
  usePerformanceMeasure,
  CodePerformanceAnalyzer,
  useAutomaticPerformanceAnalysis,
  PerformanceDashboard,
  performanceUtils
};