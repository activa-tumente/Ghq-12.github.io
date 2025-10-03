import { supabase } from '../api/supabase';
import { debounce } from '../utils/dataProcessing';

/**
 * Service for managing real-time subscriptions to metrics data
 * Separated from the main metrics logic for better maintainability
 */
export class MetricsSubscriptionService {
  constructor() {
    this.subscription = null;
    this.refreshTimeouts = new Map();
    this.isConnected = false;
    this.onDataChange = null;
    
    // Debounced refresh function to prevent excessive API calls
    this.debouncedRefresh = debounce(this.handleDataChange.bind(this), 1500);
  }

  /**
   * Setup real-time subscription with proper error handling
   */
  setupSubscription(onDataChange) {
    if (this.subscription) {
      console.warn('Subscription already exists, cleaning up first...');
      this.cleanup();
    }

    this.onDataChange = onDataChange;
    console.log('🔄 Setting up metrics real-time subscription...');

    this.subscription = supabase
      .channel('global_metrics')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'usuarios' 
      }, (payload) => {
        console.log('👥 User change detected:', payload.eventType);
        this.debouncedRefresh('user', payload);
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'respuestas_cuestionario' 
      }, (payload) => {
        console.log('💬 Response change detected:', payload.eventType);
        this.debouncedRefresh('response', payload);
      })
      .subscribe((status) => {
        console.log('📡 Subscription status:', status);
        this.isConnected = status === 'SUBSCRIBED';
        
        if (this.onDataChange) {
          this.onDataChange('connection_status', { isConnected: this.isConnected });
        }
      });

    return this.subscription;
  }

  /**
   * Handle data changes with proper debouncing and error handling
   */
  handleDataChange(changeType, payload) {
    if (!this.onDataChange) return;

    try {
      console.log(`🔄 Processing ${changeType} change...`);
      this.onDataChange(changeType, payload);
    } catch (error) {
      console.error(`Error handling ${changeType} change:`, error);
    }
  }

  /**
   * Clean up subscriptions and timeouts
   */
  cleanup() {
    if (this.subscription) {
      supabase.removeChannel(this.subscription);
      this.subscription = null;
    }

    // Clear all pending timeouts
    this.refreshTimeouts.forEach(timeout => clearTimeout(timeout));
    this.refreshTimeouts.clear();

    this.isConnected = false;
    this.onDataChange = null;
    
    console.log('🧹 Metrics subscription cleaned up');
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      hasSubscription: !!this.subscription
    };
  }
}

// Export singleton instance for the service
export const metricsSubscriptionService = new MetricsSubscriptionService();