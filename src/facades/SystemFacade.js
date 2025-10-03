// Facade Pattern para simplificar la interacción con subsistemas complejos

import { AdapterFactory } from '../adapters/DataAdapters.js';
import { ValidationFactory } from '../utils/ValidationStrategy.js';
import { ChartFactory } from '../components/ui/ChartFactory.jsx';
import { NotificationSystem } from '../patterns/ObserverPattern.js';
import { CommandInvoker } from '../patterns/CommandPattern.js';
import { FormConfigBuilder, DashboardConfigBuilder } from '../patterns/BuilderPattern.js';

// Facade principal del sistema
class SystemFacade {
  constructor(config = {}) {
    this.config = {
      supabaseClient: null,
      apiBaseUrl: null,
      apiKey: null,
      enableNotifications: true,
      enableCommands: true,
      ...config
    };

    this.adapters = new Map();
    this.validators = new Map();
    this.notifications = null;
    this.commandInvoker = null;
    this.isInitialized = false;

    this.init();
  }

  async init() {
    try {
      // Inicializar sistema de notificaciones
      if (this.config.enableNotifications) {
        this.notifications = new NotificationSystem();
      }

      // Inicializar sistema de comandos
      if (this.config.enableCommands) {
        this.commandInvoker = new CommandInvoker();
      }

      // Configurar adaptadores por defecto
      await this.setupDefaultAdapters();

      // Configurar validadores por defecto
      this.setupDefaultValidators();

      this.isInitialized = true;
      this.notify('Sistema inicializado correctamente', 'success');
    } catch (error) {
      this.notify(`Error al inicializar sistema: ${error.message}`, 'error');
      throw error;
    }
  }

  async setupDefaultAdapters() {
    // Adapter para cuestionarios
    if (this.config.supabaseClient) {
      const questionnaireAdapter = AdapterFactory.createQuestionnaireAdapter(
        this.config.supabaseClient
      );
      await this.registerAdapter('questionnaires', questionnaireAdapter);
    }

    // Adapter para usuarios
    if (this.config.supabaseClient) {
      const userAdapter = AdapterFactory.createSupabaseAdapter(
        this.config.supabaseClient,
        'usuarios'
      );
      await this.registerAdapter('users', userAdapter);
    }

    // Adapter para configuraciones
    const configAdapter = AdapterFactory.createLocalStorageAdapter('app_config');
    await this.registerAdapter('config', configAdapter);

    // Adapter para API externa (si está configurada)
    if (this.config.apiBaseUrl) {
      const apiAdapter = AdapterFactory.createRestApiAdapter(
        this.config.apiBaseUrl,
        this.config.apiKey
      );
      await this.registerAdapter('api', apiAdapter);
    }
  }

  setupDefaultValidators() {
    // Validador para cuestionarios
    const questionnaireValidator = ValidationFactory.createQuestionnaireValidator();
    this.validators.set('questionnaire', questionnaireValidator);

    // Validador para usuarios
    const userValidator = ValidationFactory.createUserValidator();
    this.validators.set('user', userValidator);

    // Validador para formularios generales
    const formValidator = ValidationFactory.createFormValidator();
    this.validators.set('form', formValidator);
  }

  async registerAdapter(name, adapter) {
    try {
      const result = await adapter.connect();
      if (result.success) {
        this.adapters.set(name, adapter);
        this.notify(`Adapter '${name}' registrado correctamente`, 'info');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      this.notify(`Error al registrar adapter '${name}': ${error.message}`, 'error');
      throw error;
    }
  }

  getAdapter(name) {
    const adapter = this.adapters.get(name);
    if (!adapter) {
      throw new Error(`Adapter '${name}' no encontrado`);
    }
    return adapter;
  }

  getValidator(name) {
    const validator = this.validators.get(name);
    if (!validator) {
      throw new Error(`Validator '${name}' no encontrado`);
    }
    return validator;
  }

  notify(message, type = 'info', data = null) {
    if (this.notifications) {
      this.notifications.notify({ message, type, data, timestamp: new Date() });
    }
  }

  executeCommand(command) {
    if (this.commandInvoker) {
      return this.commandInvoker.execute(command);
    }
    throw new Error('Sistema de comandos no inicializado');
  }

  undo() {
    if (this.commandInvoker) {
      return this.commandInvoker.undo();
    }
    throw new Error('Sistema de comandos no inicializado');
  }

  redo() {
    if (this.commandInvoker) {
      return this.commandInvoker.redo();
    }
    throw new Error('Sistema de comandos no inicializado');
  }
}

// Facade específico para gestión de cuestionarios
class QuestionnaireFacade {
  constructor(systemFacade) {
    this.system = systemFacade;
    this.adapter = systemFacade.getAdapter('questionnaires');
    this.validator = systemFacade.getValidator('questionnaire');
  }

  async createQuestionnaire(data) {
    try {
      // Validar datos
      const validation = this.validator.validate(data);
      if (!validation.isValid) {
        throw new Error(`Datos inválidos: ${validation.errors.join(', ')}`);
      }

      // Crear cuestionario
      const result = await this.adapter.create(data);
      
      if (result.success) {
        this.system.notify('Cuestionario creado exitosamente', 'success');
        return result;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      this.system.notify(`Error al crear cuestionario: ${error.message}`, 'error');
      throw error;
    }
  }

  async getQuestionnaire(id) {
    try {
      const result = await this.adapter.read(id);
      
      if (result.success) {
        return result;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      this.system.notify(`Error al obtener cuestionario: ${error.message}`, 'error');
      throw error;
    }
  }

  async updateQuestionnaire(id, data) {
    try {
      // Validar datos
      const validation = this.validator.validate(data);
      if (!validation.isValid) {
        throw new Error(`Datos inválidos: ${validation.errors.join(', ')}`);
      }

      // Actualizar cuestionario
      const result = await this.adapter.update(id, data);
      
      if (result.success) {
        this.system.notify('Cuestionario actualizado exitosamente', 'success');
        return result;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      this.system.notify(`Error al actualizar cuestionario: ${error.message}`, 'error');
      throw error;
    }
  }

  async deleteQuestionnaire(id) {
    try {
      const result = await this.adapter.delete(id);
      
      if (result.success) {
        this.system.notify('Cuestionario eliminado exitosamente', 'success');
        return result;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      this.system.notify(`Error al eliminar cuestionario: ${error.message}`, 'error');
      throw error;
    }
  }

  async searchQuestionnaires(filters = {}) {
    try {
      const result = await this.adapter.list(filters);
      
      if (result.success) {
        return result;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      this.system.notify(`Error al buscar cuestionarios: ${error.message}`, 'error');
      throw error;
    }
  }

  async getQuestionnairesByDocument(documento) {
    try {
      const result = await this.adapter.getByDocument(documento);
      
      if (result.success) {
        return result;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      this.system.notify(`Error al buscar cuestionarios por documento: ${error.message}`, 'error');
      throw error;
    }
  }

  async getStatistics(filters = {}) {
    try {
      const result = await this.adapter.getStatistics(filters);
      
      if (result.success) {
        return result;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      this.system.notify(`Error al obtener estadísticas: ${error.message}`, 'error');
      throw error;
    }
  }

  // Métodos de conveniencia para operaciones comunes
  async submitQuestionnaire(formData) {
    const questionnaireData = {
      nombre: formData.nombre,
      apellido: formData.apellido,
      documento: formData.documento,
      area: formData.area,
      turno: formData.turno,
      genero: formData.genero,
      respuestas: formData.respuestas,
      fecha_creacion: new Date().toISOString()
    };

    return await this.createQuestionnaire(questionnaireData);
  }

  async generateReport(filters = {}) {
    try {
      const [questionnaires, statistics] = await Promise.all([
        this.searchQuestionnaires(filters),
        this.getStatistics(filters)
      ]);

      if (questionnaires.success && statistics.success) {
        return {
          success: true,
          data: {
            questionnaires: questionnaires.data,
            statistics: statistics.data,
            generatedAt: new Date().toISOString(),
            filters
          }
        };
      } else {
        throw new Error('Error al generar reporte');
      }
    } catch (error) {
      this.system.notify(`Error al generar reporte: ${error.message}`, 'error');
      throw error;
    }
  }
}

// Facade específico para dashboard y análisis
class DashboardFacade {
  constructor(systemFacade) {
    this.system = systemFacade;
    this.questionnaireAdapter = systemFacade.getAdapter('questionnaires');
    this.chartFactory = new ChartFactory();
  }

  async getDashboardData(filters = {}) {
    try {
      // Obtener datos de cuestionarios
      const questionnairesResult = await this.questionnaireAdapter.list(filters);
      
      if (!questionnairesResult.success) {
        throw new Error(questionnairesResult.error);
      }

      const questionnaires = questionnairesResult.data;

      // Procesar datos para dashboard
      const dashboardData = this.processDashboardData(questionnaires, filters);

      return {
        success: true,
        data: dashboardData
      };
    } catch (error) {
      this.system.notify(`Error al obtener datos del dashboard: ${error.message}`, 'error');
      throw error;
    }
  }

  processDashboardData(questionnaires, filters) {
    // Métricas básicas
    const totalResponses = questionnaires.length;
    const uniqueUsers = new Set(questionnaires.map(q => q.documento)).size;

    // Distribución por área
    const byArea = questionnaires.reduce((acc, q) => {
      acc[q.area] = (acc[q.area] || 0) + 1;
      return acc;
    }, {});

    // Distribución por género
    const byGender = questionnaires.reduce((acc, q) => {
      acc[q.genero] = (acc[q.genero] || 0) + 1;
      return acc;
    }, {});

    // Distribución por turno
    const byShift = questionnaires.reduce((acc, q) => {
      acc[q.turno] = (acc[q.turno] || 0) + 1;
      return acc;
    }, {});

    // Tendencias temporales
    const timeSeriesData = this.generateTimeSeriesData(questionnaires);

    // Análisis de respuestas
    const responseAnalysis = this.analyzeResponses(questionnaires);

    return {
      metrics: {
        totalResponses,
        uniqueUsers,
        completionRate: (totalResponses / uniqueUsers * 100).toFixed(2)
      },
      distributions: {
        byArea,
        byGender,
        byShift
      },
      timeSeries: timeSeriesData,
      responseAnalysis,
      lastUpdated: new Date().toISOString()
    };
  }

  generateTimeSeriesData(questionnaires) {
    const timeGroups = questionnaires.reduce((acc, q) => {
      const date = new Date(q.fecha_creacion).toDateString();
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(timeGroups)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  analyzeResponses(questionnaires) {
    const analysis = {
      averageScores: {},
      riskLevels: { bajo: 0, medio: 0, alto: 0 },
      recommendations: []
    };

    questionnaires.forEach(q => {
      try {
        const responses = typeof q.respuestas === 'string' 
          ? JSON.parse(q.respuestas) 
          : q.respuestas;

        // Ensure responses are in {q1: score, q2: score, ...} format
        const ghqResponses = {};
        if (Array.isArray(responses)) {
          // Handles numeric-keyed objects or arrays
          Object.values(responses).forEach((score, index) => {
            ghqResponses[`q${index + 1}`] = score;
          });
        } else {
          // Assumes it's already in the correct format
          Object.assign(ghqResponses, responses);
        }

        // Calcular puntuaciones promedio por categoría
        // This part seems incorrect for GHQ-12, as it's a single score, not per-category.
        // Let's calculate a single average score for the questionnaire.
        const scores = Object.values(ghqResponses);
        const totalScore = scores.reduce((a, b) => a + b, 0);
        const avgScore = totalScore / scores.length;

        // Determinar nivel de riesgo
        if (avgScore >= 2) analysis.riskLevels.alto++;
        else if (avgScore < 4) analysis.riskLevels.medio++;
        else analysis.riskLevels.bajo++;
      } catch (error) {
        console.warn('Error al procesar respuestas:', error);
      }
    });

    // This logic seems to be for a different type of questionnaire.
    // For GHQ-12, we'll leave averageScores empty for now unless you have categories.
    // If you do have categories, the logic to populate ghqResponses correctly is key.
    analysis.averageScores = {};

    // Generar recomendaciones
    analysis.recommendations = this.generateRecommendations(analysis);

    return analysis;
  }

  generateRecommendations(analysisData) {
    const recommendations = [];

    // Recomendaciones basadas en niveles de riesgo
    const totalResponses = Object.values(analysisData.riskLevels).reduce((a, b) => a + b, 0);
    const highRiskPercentage = (analysisData.riskLevels.alto / totalResponses) * 100;

    if (highRiskPercentage > 30) {
      recommendations.push({
        type: 'warning',
        message: 'Alto porcentaje de respuestas de riesgo. Se recomienda implementar medidas de seguridad adicionales.',
        priority: 'high'
      });
    }

    // Recomendaciones basadas en puntuaciones por categoría
    Object.entries(analysisData.averageScores).forEach(([category, score]) => {
      if (score < 3) {
        recommendations.push({
          type: 'improvement',
          message: `La categoría '${category}' muestra puntuaciones bajas. Considere capacitación específica.`,
          priority: 'medium'
        });
      }
    });

    return recommendations;
  }

  async createChart(type, data, config = {}) {
    try {
      const chart = this.chartFactory.createChart(type, {
        data,
        ...config
      });

      return {
        success: true,
        chart
      };
    } catch (error) {
      this.system.notify(`Error al crear gráfico: ${error.message}`, 'error');
      throw error;
    }
  }

  async exportDashboardData(format = 'json', filters = {}) {
    try {
      const dashboardData = await this.getDashboardData(filters);
      
      if (!dashboardData.success) {
        throw new Error('Error al obtener datos del dashboard');
      }

      let exportedData;
      
      switch (format.toLowerCase()) {
        case 'json':
          exportedData = JSON.stringify(dashboardData.data, null, 2);
          break;
        case 'csv':
          exportedData = this.convertToCSV(dashboardData.data);
          break;
        default:
          throw new Error(`Formato no soportado: ${format}`);
      }

      return {
        success: true,
        data: exportedData,
        format,
        filename: `dashboard_export_${new Date().toISOString().split('T')[0]}.${format}`
      };
    } catch (error) {
      this.system.notify(`Error al exportar datos: ${error.message}`, 'error');
      throw error;
    }
  }

  convertToCSV(data) {
    // Implementación básica de conversión a CSV
    const headers = ['Métrica', 'Valor'];
    const rows = [
      ['Total Respuestas', data.metrics.totalResponses],
      ['Usuarios Únicos', data.metrics.uniqueUsers],
      ['Tasa de Completitud', data.metrics.completionRate + '%']
    ];

    return [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');
  }
}

// Facade para configuración del sistema
class ConfigurationFacade {
  constructor(systemFacade) {
    this.system = systemFacade;
    this.adapter = systemFacade.getAdapter('config');
  }

  async getConfiguration(key = null) {
    try {
      if (key) {
        const result = await this.adapter.read(key);
        return result.success ? result.data : null;
      } else {
        const result = await this.adapter.list();
        return result.success ? result.data : [];
      }
    } catch (error) {
      this.system.notify(`Error al obtener configuración: ${error.message}`, 'error');
      return null;
    }
  }

  async setConfiguration(key, value) {
    try {
      const configData = {
        key,
        value: typeof value === 'object' ? JSON.stringify(value) : value,
        updatedAt: new Date().toISOString()
      };

      const result = await this.adapter.create(configData);
      
      if (result.success) {
        this.system.notify('Configuración guardada exitosamente', 'success');
        return result;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      this.system.notify(`Error al guardar configuración: ${error.message}`, 'error');
      throw error;
    }
  }

  async updateConfiguration(key, value) {
    try {
      const configData = {
        value: typeof value === 'object' ? JSON.stringify(value) : value,
        updatedAt: new Date().toISOString()
      };

      const result = await this.adapter.update(key, configData);
      
      if (result.success) {
        this.system.notify('Configuración actualizada exitosamente', 'success');
        return result;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      this.system.notify(`Error al actualizar configuración: ${error.message}`, 'error');
      throw error;
    }
  }

  async deleteConfiguration(key) {
    try {
      const result = await this.adapter.delete(key);
      
      if (result.success) {
        this.system.notify('Configuración eliminada exitosamente', 'success');
        return result;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      this.system.notify(`Error al eliminar configuración: ${error.message}`, 'error');
      throw error;
    }
  }

  // Métodos de conveniencia para configuraciones específicas
  async getTheme() {
    const config = await this.getConfiguration('theme');
    return config ? JSON.parse(config.value) : { mode: 'light' };
  }

  async setTheme(theme) {
    return await this.setConfiguration('theme', theme);
  }

  async getDashboardSettings() {
    const config = await this.getConfiguration('dashboard_settings');
    return config ? JSON.parse(config.value) : {
      refreshInterval: 30000,
      defaultFilters: {},
      chartTypes: ['bar', 'pie', 'line']
    };
  }

  async setDashboardSettings(settings) {
    return await this.setConfiguration('dashboard_settings', settings);
  }
}

// Factory para crear facades
class FacadeFactory {
  static createSystemFacade(config) {
    return new SystemFacade(config);
  }

  static createQuestionnaireFacade(systemFacade) {
    return new QuestionnaireFacade(systemFacade);
  }

  static createDashboardFacade(systemFacade) {
    return new DashboardFacade(systemFacade);
  }

  static createConfigurationFacade(systemFacade) {
    return new ConfigurationFacade(systemFacade);
  }

  // Crear todas las facades de una vez
  static createAllFacades(config) {
    const systemFacade = new SystemFacade(config);
    
    return {
      system: systemFacade,
      questionnaire: new QuestionnaireFacade(systemFacade),
      dashboard: new DashboardFacade(systemFacade),
      configuration: new ConfigurationFacade(systemFacade)
    };
  }
}

// Hook de React para usar facades
import { useState, useEffect, useContext, createContext } from 'react';

const FacadeContext = createContext(null);

export const FacadeProvider = ({ children, config }) => {
  const [facades, setFacades] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeFacades = async () => {
      try {
        setLoading(true);
        const facadeInstances = FacadeFactory.createAllFacades(config);
        
        // Esperar a que el sistema se inicialice
        await new Promise(resolve => {
          const checkInit = () => {
            if (facadeInstances.system.isInitialized) {
              resolve();
            } else {
              setTimeout(checkInit, 100);
            }
          };
          checkInit();
        });
        
        setFacades(facadeInstances);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initializeFacades();
  }, [config]);

  return (
    <FacadeContext.Provider value={{ facades, loading, error }}>
      {children}
    </FacadeContext.Provider>
  );
};

export const useFacades = () => {
  const context = useContext(FacadeContext);
  if (!context) {
    throw new Error('useFacades debe ser usado dentro de FacadeProvider');
  }
  return context;
};

export const useQuestionnaireFacade = () => {
  const { facades } = useFacades();
  return facades?.questionnaire;
};

export const useDashboardFacade = () => {
  const { facades } = useFacades();
  return facades?.dashboard;
};

export const useConfigurationFacade = () => {
  const { facades } = useFacades();
  return facades?.configuration;
};

export {
  SystemFacade,
  QuestionnaireFacade,
  DashboardFacade,
  ConfigurationFacade,
  FacadeFactory
};

export default {
  SystemFacade,
  FacadeFactory,
  useFacades
};