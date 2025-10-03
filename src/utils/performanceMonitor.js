/**
 * Performance Monitor Utility
 * Herramienta para monitorear y optimizar el rendimiento del dashboard
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = new Map();
    this.isEnabled = process.env.NODE_ENV === 'development';
  }

  /**
   * Iniciar medición de performance
   */
  startMeasure(name) {
    if (!this.isEnabled) return;
    
    const startTime = performance.now();
    this.metrics.set(name, {
      startTime,
      name,
      status: 'running'
    });
    
    console.log(`🚀 Performance: Iniciando medición "${name}"`);
  }

  /**
   * Finalizar medición de performance
   */
  endMeasure(name) {
    if (!this.isEnabled) return;
    
    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`⚠️ Performance: No se encontró medición "${name}"`);
      return;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;
    
    const completedMetric = {
      ...metric,
      endTime,
      duration,
      status: 'completed'
    };
    
    this.metrics.set(name, completedMetric);
    
    // Clasificar performance
    const performanceLevel = this.classifyPerformance(duration);
    const emoji = this.getPerformanceEmoji(performanceLevel);
    
    console.log(`${emoji} Performance: "${name}" completado en ${duration.toFixed(2)}ms (${performanceLevel})`);
    
    return completedMetric;
  }

  /**
   * Medir función async
   */
  async measureAsync(name, asyncFunction) {
    if (!this.isEnabled) {
      return await asyncFunction();
    }

    this.startMeasure(name);
    try {
      const result = await asyncFunction();
      this.endMeasure(name);
      return result;
    } catch (error) {
      this.endMeasure(name);
      console.error(`❌ Performance: Error en "${name}":`, error);
      throw error;
    }
  }

  /**
   * Medir función síncrona
   */
  measureSync(name, syncFunction) {
    if (!this.isEnabled) {
      return syncFunction();
    }

    this.startMeasure(name);
    try {
      const result = syncFunction();
      this.endMeasure(name);
      return result;
    } catch (error) {
      this.endMeasure(name);
      console.error(`❌ Performance: Error en "${name}":`, error);
      throw error;
    }
  }

  /**
   * Monitorear renders de componentes React
   */
  measureRender(componentName, renderFunction) {
    if (!this.isEnabled) {
      return renderFunction();
    }

    const measureName = `render_${componentName}`;
    return this.measureSync(measureName, renderFunction);
  }

  /**
   * Observar Web Vitals
   */
  observeWebVitals() {
    if (!this.isEnabled || typeof window === 'undefined') return;

    // Observar Largest Contentful Paint (LCP)
    this.observeLCP();
    
    // Observar First Input Delay (FID)
    this.observeFID();
    
    // Observar Cumulative Layout Shift (CLS)
    this.observeCLS();
  }

  /**
   * Observar LCP (Largest Contentful Paint)
   */
  observeLCP() {
    if (!window.PerformanceObserver) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      console.log(`📊 LCP: ${lastEntry.startTime.toFixed(2)}ms`);
      
      if (lastEntry.startTime > 2500) {
        console.warn('⚠️ LCP: Tiempo superior a 2.5s, considerar optimizaciones');
      }
    });

    observer.observe({ entryTypes: ['largest-contentful-paint'] });
    this.observers.set('lcp', observer);
  }

  /**
   * Observar FID (First Input Delay)
   */
  observeFID() {
    if (!window.PerformanceObserver) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        console.log(`⚡ FID: ${entry.processingStart - entry.startTime}ms`);
        
        if (entry.processingStart - entry.startTime > 100) {
          console.warn('⚠️ FID: Delay superior a 100ms, revisar JavaScript');
        }
      });
    });

    observer.observe({ entryTypes: ['first-input'] });
    this.observers.set('fid', observer);
  }

  /**
   * Observar CLS (Cumulative Layout Shift)
   */
  observeCLS() {
    if (!window.PerformanceObserver) return;

    let clsValue = 0;
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      
      console.log(`📐 CLS: ${clsValue.toFixed(4)}`);
      
      if (clsValue > 0.1) {
        console.warn('⚠️ CLS: Valor superior a 0.1, revisar layout shifts');
      }
    });

    observer.observe({ entryTypes: ['layout-shift'] });
    this.observers.set('cls', observer);
  }

  /**
   * Monitorear uso de memoria
   */
  monitorMemory() {
    if (!this.isEnabled || !window.performance?.memory) return;

    const memory = window.performance.memory;
    const memoryInfo = {
      used: Math.round(memory.usedJSHeapSize / 1048576), // MB
      total: Math.round(memory.totalJSHeapSize / 1048576), // MB
      limit: Math.round(memory.jsHeapSizeLimit / 1048576) // MB
    };

    console.log(`🧠 Memoria: ${memoryInfo.used}MB / ${memoryInfo.total}MB (límite: ${memoryInfo.limit}MB)`);
    
    // Advertir si el uso de memoria es alto
    const memoryUsagePercent = (memoryInfo.used / memoryInfo.limit) * 100;
    if (memoryUsagePercent > 80) {
      console.warn(`⚠️ Memoria: Uso alto (${memoryUsagePercent.toFixed(1)}%)`);
    }

    return memoryInfo;
  }

  /**
   * Obtener resumen de métricas
   */
  getMetricsSummary() {
    if (!this.isEnabled) return null;

    const completedMetrics = Array.from(this.metrics.values())
      .filter(metric => metric.status === 'completed');

    const summary = {
      totalMeasurements: completedMetrics.length,
      averageDuration: 0,
      slowestOperation: null,
      fastestOperation: null,
      operations: completedMetrics
    };

    if (completedMetrics.length > 0) {
      const durations = completedMetrics.map(m => m.duration);
      summary.averageDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      summary.slowestOperation = completedMetrics.reduce((prev, current) => 
        prev.duration > current.duration ? prev : current
      );
      summary.fastestOperation = completedMetrics.reduce((prev, current) => 
        prev.duration < current.duration ? prev : current
      );
    }

    return summary;
  }

  /**
   * Clasificar nivel de performance
   */
  classifyPerformance(duration) {
    if (duration < 100) return 'excelente';
    if (duration < 300) return 'bueno';
    if (duration < 1000) return 'aceptable';
    if (duration < 3000) return 'lento';
    return 'muy lento';
  }

  /**
   * Obtener emoji según performance
   */
  getPerformanceEmoji(level) {
    const emojis = {
      'excelente': '🚀',
      'bueno': '✅',
      'aceptable': '⚡',
      'lento': '⚠️',
      'muy lento': '🐌'
    };
    return emojis[level] || '📊';
  }

  /**
   * Limpiar métricas
   */
  clearMetrics() {
    this.metrics.clear();
  }

  /**
   * Desconectar observadores
   */
  disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }

  /**
   * Habilitar/deshabilitar monitoreo
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    if (!enabled) {
      this.disconnect();
    }
  }
}

// Crear instancia singleton
const performanceMonitor = new PerformanceMonitor();

// Hook para React
export const usePerformanceMonitor = () => {
  return {
    startMeasure: (name) => performanceMonitor.startMeasure(name),
    endMeasure: (name) => performanceMonitor.endMeasure(name),
    measureAsync: (name, fn) => performanceMonitor.measureAsync(name, fn),
    measureSync: (name, fn) => performanceMonitor.measureSync(name, fn),
    measureRender: (name, fn) => performanceMonitor.measureRender(name, fn),
    getMetricsSummary: () => performanceMonitor.getMetricsSummary(),
    monitorMemory: () => performanceMonitor.monitorMemory()
  };
};

export default performanceMonitor;