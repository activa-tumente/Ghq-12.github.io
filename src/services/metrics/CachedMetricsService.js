import { MetricsService } from '../MetricsService';
import { metricsCache } from './MetricsCache';
import { logError } from '../../utils/errorHandling';

/**
 * Wrapper con cache para MetricsService
 * Implementa patrón Decorator para agregar caching transparente
 */
export class CachedMetricsService {
  
  /**
   * Obtiene métricas con cache automático
   */
  static async getMetricsWithCache(type, filters = {}, forceRefresh = false) {
    try {
      // Verificar cache primero (a menos que se fuerce refresh)
      if (!forceRefresh) {
        const cached = metricsCache.get(type, filters);
        if (cached) {
          console.log(`📦 Cache hit for ${type}:`, filters);
          return cached;
        }
      }

      console.log(`🔄 Cache miss for ${type}, fetching fresh data:`, filters);
      
      // Obtener datos frescos
      let data;
      switch (type) {
        case 'home':
          data = await MetricsService.getHomeMetrics();
          break;
        case 'dashboard':
          data = await MetricsService.getDashboardMetrics(filters);
          break;
        case 'questionnaires':
          data = await MetricsService.getQuestionnaireMetrics();
          break;
        case 'responses':
          data = await MetricsService.getResponsesMetrics();
          break;
        case 'users':
          data = await MetricsService.getUsersMetrics();
          break;
        case 'analytics':
          data = await MetricsService.getDashboardAnalytics(filters);
          break;
        default:
          throw new Error(`Unknown metrics type: ${type}`);
      }

      // Guardar en cache
      metricsCache.set(type, data, filters);
      
      return data;
    } catch (error) {
      console.error(`❌ Error getting cached metrics for ${type}:`, error);
      logError(error, { operation: `CachedMetricsService.getMetricsWithCache`, type, filters });
      throw error;
    }
  }

  /**
   * Invalida cache cuando hay cambios en los datos
   */
  static invalidateRelatedCache(changeType) {
    switch (changeType) {
      case 'user_created':
      case 'user_updated':
        metricsCache.invalidate('users');
        metricsCache.invalidate('home');
        break;
      case 'response_created':
      case 'response_updated':
        metricsCache.invalidate('responses');
        metricsCache.invalidate('dashboard');
        metricsCache.invalidate('analytics');
        metricsCache.invalidate('home');
        metricsCache.invalidate('questionnaires');
        break;
      case 'all':
        metricsCache.clear();
        break;
    }
  }

  /**
   * Métodos de conveniencia que usan cache
   */
  static async getHomeMetrics(forceRefresh = false) {
    return this.getMetricsWithCache('home', {}, forceRefresh);
  }

  static async getDashboardMetrics(filters = {}, forceRefresh = false) {
    return this.getMetricsWithCache('dashboard', filters, forceRefresh);
  }

  static async getQuestionnaireMetrics(forceRefresh = false) {
    return this.getMetricsWithCache('questionnaires', {}, forceRefresh);
  }

  static async getResponsesMetrics(forceRefresh = false) {
    return this.getMetricsWithCache('responses', {}, forceRefresh);
  }

  static async getUsersMetrics(forceRefresh = false) {
    return this.getMetricsWithCache('users', {}, forceRefresh);
  }

  static async getDashboardAnalytics(filters = {}, forceRefresh = false) {
    return this.getMetricsWithCache('analytics', filters, forceRefresh);
  }
}