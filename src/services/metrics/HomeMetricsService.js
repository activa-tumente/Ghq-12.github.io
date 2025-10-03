import { MetricsRepository } from './MetricsRepository';
import { MetricsCalculator } from './MetricsCalculator';
import { MetricsErrorHandler } from './MetricsErrorHandler';

/**
 * Servicio especializado para métricas de la página Home
 */
export class HomeMetricsService {
  static async getMetrics() {
    return MetricsErrorHandler.withErrorHandling(async () => {
      console.log('📊 Obteniendo métricas para Home...');
      
      const { totalUsuarios, totalRespuestas, respuestas } = 
        await MetricsRepository.getBasicCounts();

      const { promedioSalud, indiceBienestar, usuariosConRespuestas } = 
        MetricsCalculator.calculateWellnessMetrics(respuestas);
      
      const tendencia = MetricsCalculator.calculateMonthlyTrend(respuestas);

      return {
        evaluacionesCompletadas: usuariosConRespuestas,
        usuariosActivos: totalUsuarios,
        indiceBienestar,
        tendenciaMensual: tendencia.formatted,
        promedioSalud,
        totalRespuestas
      };
    }, { 
      operation: 'HomeMetricsService.getMetrics',
      returnDefaults: true,
      type: 'home'
    });
  }
}