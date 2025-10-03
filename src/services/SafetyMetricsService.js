import { supabase } from '../api/supabase.js';
import DepartmentSegmentationService from './DepartmentSegmentationService.js';

/**
 * Servicio especializado para métricas de seguridad por departamento
 * Incluye uso de EPP, capacitaciones, reportes de incidentes
 */
export class SafetyMetricsService {
  
  static CACHE_TTL = 15 * 60 * 1000; // 15 minutos
  static cache = new Map();

  // Mapeo de preguntas relacionadas con seguridad en el cuestionario GHQ-12
  static SAFETY_QUESTION_MAPPING = {
    // Preguntas que pueden relacionarse con comportamiento seguro
    stress_indicators: [1, 2, 3, 7], // Preguntas sobre estrés que afectan seguridad
    concentration_issues: [6, 8, 9], // Problemas de concentración que afectan seguridad
    decision_making: [4, 5, 10, 11, 12], // Capacidad de toma de decisiones seguras
  };

  // Configuración de métricas de seguridad
  static SAFETY_METRICS_CONFIG = {
    EPP_USAGE: {
      excellent: 95,
      good: 85,
      acceptable: 70,
      poor: 50
    },
    TRAINING_COMPLETION: {
      excellent: 90,
      good: 80,
      acceptable: 65,
      poor: 40
    },
    INCIDENT_RATE: {
      excellent: 0.5, // incidentes por 100 empleados por mes
      good: 1.0,
      acceptable: 2.0,
      poor: 5.0
    }
  };

  /**
   * Obtiene métricas de seguridad completas por departamento
   */
  static async getSafetyMetricsByDepartment(filters = {}) {
    const cacheKey = `safety-metrics-${JSON.stringify(filters)}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      // Obtener datos base de segmentación
      const segmentationData = await DepartmentSegmentationService.getSegmentedDepartmentData(filters);
      
      // Obtener datos específicos de seguridad
      const safetyData = await this.getSafetySpecificData(filters);
      
      // Combinar y calcular métricas
      const combinedMetrics = this.combineSafetyMetrics(segmentationData, safetyData);
      
      // Calcular índices de seguridad
      const safetyIndices = this.calculateSafetyIndices(combinedMetrics);
      
      const result = {
        departments: safetyIndices,
        summary: this.generateSafetySummary(safetyIndices),
        recommendations: this.generateSafetyRecommendations(safetyIndices),
        timestamp: new Date().toISOString()
      };

      this.setCachedData(cacheKey, result);
      return result;

    } catch (error) {
      console.error('Error en getSafetyMetricsByDepartment:', error);
      throw new Error(`Error al obtener métricas de seguridad: ${error.message}`);
    }
  }

  /**
   * Obtiene datos específicos de seguridad (simulados por ahora)
   * En una implementación real, estos vendrían de tablas específicas
   */
  static async getSafetySpecificData(filters = {}) {
    // Por ahora simulamos datos de seguridad
    // En el futuro, estos datos vendrían de tablas como:
    // - uso_epp, capacitaciones_seguridad, reportes_incidentes, etc.
    
    const departments = [
      'Producción', 'Mantenimiento', 'Calidad', 'Logística', 
      'Administración', 'Recursos Humanos', 'Seguridad Industrial'
    ];

    return departments.map(dept => ({
      departamento: dept,
      epp_usage: {
        total_checks: Math.floor(Math.random() * 100) + 50,
        compliant_checks: Math.floor(Math.random() * 80) + 40,
        percentage: Math.floor(Math.random() * 40) + 60
      },
      training: {
        total_required: Math.floor(Math.random() * 20) + 10,
        completed: Math.floor(Math.random() * 15) + 8,
        percentage: Math.floor(Math.random() * 30) + 70
      },
      incidents: {
        total_incidents: Math.floor(Math.random() * 5),
        near_misses: Math.floor(Math.random() * 10),
        safety_observations: Math.floor(Math.random() * 20) + 5,
        rate_per_100_employees: Math.random() * 3
      },
      safety_behaviors: {
        proactive_reports: Math.floor(Math.random() * 15) + 5,
        safety_suggestions: Math.floor(Math.random() * 10) + 2,
        participation_meetings: Math.floor(Math.random() * 30) + 70
      }
    }));
  }

  /**
   * Combina métricas de segmentación con datos específicos de seguridad
   */
  static combineSafetyMetrics(segmentationData, safetyData) {
    return segmentationData.departments.map(dept => {
      const safetyInfo = safetyData.find(s => s.departamento === dept.departamento) || {};
      
      // Calcular métricas de comportamiento seguro basadas en GHQ-12
      const behaviorMetrics = this.calculateSafetyBehaviorMetrics(dept);
      
      return {
        ...dept,
        safety: {
          ...safetyInfo,
          behavior_metrics: behaviorMetrics,
          risk_correlation: this.calculateRiskCorrelation(dept, safetyInfo)
        }
      };
    });
  }

  /**
   * Calcula métricas de comportamiento seguro basadas en respuestas GHQ-12
   */
  static calculateSafetyBehaviorMetrics(departmentData) {
    // Simular análisis de respuestas para comportamiento seguro
    // En implementación real, analizaríamos las respuestas específicas
    
    const riskLevel = departmentData.porcentaje_riesgo_alto;
    
    return {
      stress_impact_on_safety: this.calculateStressImpact(riskLevel),
      concentration_for_safety: this.calculateConcentrationImpact(riskLevel),
      decision_making_quality: this.calculateDecisionMakingQuality(riskLevel),
      overall_behavior_score: this.calculateOverallBehaviorScore(riskLevel)
    };
  }

  /**
   * Calcula impacto del estrés en la seguridad
   */
  static calculateStressImpact(riskLevel) {
    const impact = Math.min(riskLevel * 1.2, 100);
    return {
      score: Math.round((100 - impact) * 100) / 100,
      level: impact > 70 ? 'Alto' : impact > 40 ? 'Medio' : 'Bajo',
      description: impact > 70 ? 
        'El estrés puede afectar significativamente el comportamiento seguro' :
        impact > 40 ?
        'El estrés tiene un impacto moderado en la seguridad' :
        'El nivel de estrés es manejable para mantener comportamientos seguros'
    };
  }

  /**
   * Calcula impacto de la concentración en la seguridad
   */
  static calculateConcentrationImpact(riskLevel) {
    const impact = Math.min(riskLevel * 1.1, 100);
    return {
      score: Math.round((100 - impact) * 100) / 100,
      level: impact > 65 ? 'Preocupante' : impact > 35 ? 'Moderado' : 'Bueno',
      description: impact > 65 ?
        'Problemas de concentración pueden aumentar riesgo de accidentes' :
        impact > 35 ?
        'Concentración adecuada con algunas áreas de mejora' :
        'Buena capacidad de concentración para tareas seguras'
    };
  }

  /**
   * Calcula calidad de toma de decisiones
   */
  static calculateDecisionMakingQuality(riskLevel) {
    const impact = Math.min(riskLevel * 0.9, 100);
    return {
      score: Math.round((100 - impact) * 100) / 100,
      level: impact > 60 ? 'Comprometida' : impact > 30 ? 'Aceptable' : 'Buena',
      description: impact > 60 ?
        'La toma de decisiones puede estar comprometida' :
        impact > 30 ?
        'Capacidad de decisión aceptable con supervisión' :
        'Buena capacidad para tomar decisiones seguras'
    };
  }

  /**
   * Calcula score general de comportamiento
   */
  static calculateOverallBehaviorScore(riskLevel) {
    const score = Math.max(100 - (riskLevel * 0.8), 0);
    return {
      score: Math.round(score * 100) / 100,
      grade: score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : 'D',
      status: score >= 85 ? 'Excelente' : score >= 70 ? 'Bueno' : score >= 55 ? 'Aceptable' : 'Requiere atención'
    };
  }

  /**
   * Calcula correlación entre riesgo psicológico y métricas de seguridad
   */
  static calculateRiskCorrelation(deptData, safetyInfo) {
    const psychRisk = deptData.porcentaje_riesgo_alto;
    const eppUsage = safetyInfo.epp_usage?.percentage || 0;
    const trainingCompletion = safetyInfo.training?.percentage || 0;
    const incidentRate = safetyInfo.incidents?.rate_per_100_employees || 0;

    return {
      epp_correlation: this.calculateCorrelation(psychRisk, 100 - eppUsage),
      training_correlation: this.calculateCorrelation(psychRisk, 100 - trainingCompletion),
      incident_correlation: this.calculateCorrelation(psychRisk, incidentRate * 20),
      overall_correlation: this.calculateOverallCorrelation(psychRisk, eppUsage, trainingCompletion, incidentRate)
    };
  }

  /**
   * Calcula correlación simple entre dos variables
   */
  static calculateCorrelation(x, y) {
    // Simulación de correlación (en implementación real usaríamos datos históricos)
    const correlation = Math.random() * 0.6 + 0.2; // Entre 0.2 y 0.8
    return {
      coefficient: Math.round(correlation * 100) / 100,
      strength: correlation > 0.7 ? 'Fuerte' : correlation > 0.4 ? 'Moderada' : 'Débil',
      direction: 'Positiva' // Asumimos correlación positiva entre riesgo psicológico y problemas de seguridad
    };
  }

  /**
   * Calcula correlación general
   */
  static calculateOverallCorrelation(psychRisk, eppUsage, trainingCompletion, incidentRate) {
    const safetyScore = (eppUsage + trainingCompletion) / 2 - (incidentRate * 10);
    const correlation = (100 - psychRisk - safetyScore) / 100;
    
    return {
      coefficient: Math.round(Math.abs(correlation) * 100) / 100,
      interpretation: Math.abs(correlation) > 0.6 ?
        'Fuerte relación entre bienestar psicológico y seguridad' :
        Math.abs(correlation) > 0.3 ?
        'Relación moderada entre bienestar psicológico y seguridad' :
        'Relación débil entre bienestar psicológico y seguridad'
    };
  }

  /**
   * Calcula índices de seguridad por departamento
   */
  static calculateSafetyIndices(combinedMetrics) {
    return combinedMetrics.map(dept => {
      const safetyIndex = this.calculateDepartmentSafetyIndex(dept);
      const riskCategory = this.categorizeSafetyRisk(safetyIndex);
      const priorities = this.identifyPriorities(dept);

      return {
        ...dept,
        safety_index: safetyIndex,
        risk_category: riskCategory,
        priorities: priorities,
        action_plan: this.generateActionPlan(dept, riskCategory, priorities)
      };
    }).sort((a, b) => b.safety_index.overall_score - a.safety_index.overall_score);
  }

  /**
   * Calcula índice de seguridad del departamento
   */
  static calculateDepartmentSafetyIndex(dept) {
    const weights = {
      psychological: 0.3,
      epp_usage: 0.25,
      training: 0.25,
      incidents: 0.2
    };

    const scores = {
      psychological: 100 - dept.porcentaje_riesgo_alto,
      epp_usage: dept.safety?.epp_usage?.percentage || 0,
      training: dept.safety?.training?.percentage || 0,
      incidents: Math.max(0, 100 - (dept.safety?.incidents?.rate_per_100_employees || 0) * 20)
    };

    const overallScore = Object.keys(weights).reduce((sum, key) => {
      return sum + (scores[key] * weights[key]);
    }, 0);

    return {
      overall_score: Math.round(overallScore * 100) / 100,
      component_scores: scores,
      weights: weights,
      grade: overallScore >= 85 ? 'A' : overallScore >= 70 ? 'B' : overallScore >= 55 ? 'C' : 'D'
    };
  }

  /**
   * Categoriza el riesgo de seguridad
   */
  static categorizeSafetyRisk(safetyIndex) {
    const score = safetyIndex.overall_score;
    
    if (score >= 85) {
      return {
        level: 'Bajo',
        color: 'green',
        description: 'Excelente desempeño en seguridad',
        action_required: 'Mantener estándares actuales'
      };
    } else if (score >= 70) {
      return {
        level: 'Moderado',
        color: 'yellow',
        description: 'Buen desempeño con oportunidades de mejora',
        action_required: 'Implementar mejoras específicas'
      };
    } else if (score >= 55) {
      return {
        level: 'Alto',
        color: 'orange',
        description: 'Requiere atención inmediata',
        action_required: 'Plan de acción urgente'
      };
    } else {
      return {
        level: 'Crítico',
        color: 'red',
        description: 'Riesgo crítico de seguridad',
        action_required: 'Intervención inmediata requerida'
      };
    }
  }

  /**
   * Identifica prioridades de mejora
   */
  static identifyPriorities(dept) {
    const priorities = [];
    const scores = dept.safety_index?.component_scores || {};

    if (scores.psychological < 70) {
      priorities.push({
        area: 'Bienestar Psicológico',
        urgency: 'Alta',
        description: 'Alto nivel de riesgo psicológico afecta comportamiento seguro'
      });
    }

    if (scores.epp_usage < 80) {
      priorities.push({
        area: 'Uso de EPP',
        urgency: scores.epp_usage < 60 ? 'Alta' : 'Media',
        description: 'Mejorar cumplimiento en uso de equipos de protección personal'
      });
    }

    if (scores.training < 75) {
      priorities.push({
        area: 'Capacitación',
        urgency: scores.training < 50 ? 'Alta' : 'Media',
        description: 'Incrementar participación en programas de capacitación'
      });
    }

    if (scores.incidents < 80) {
      priorities.push({
        area: 'Prevención de Incidentes',
        urgency: 'Alta',
        description: 'Reducir tasa de incidentes y near misses'
      });
    }

    return priorities.sort((a, b) => {
      const urgencyOrder = { 'Alta': 3, 'Media': 2, 'Baja': 1 };
      return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
    });
  }

  /**
   * Genera plan de acción
   */
  static generateActionPlan(dept, riskCategory, priorities) {
    const actions = [];

    priorities.forEach(priority => {
      switch (priority.area) {
        case 'Bienestar Psicológico':
          actions.push({
            action: 'Implementar programa de apoyo psicológico',
            timeline: '1-2 meses',
            responsible: 'Recursos Humanos + Seguridad Industrial',
            kpi: 'Reducir riesgo psicológico en 20%'
          });
          break;
        case 'Uso de EPP':
          actions.push({
            action: 'Reforzar supervisión y entrenamiento en EPP',
            timeline: '2-4 semanas',
            responsible: 'Supervisores + Seguridad Industrial',
            kpi: 'Alcanzar 95% de cumplimiento'
          });
          break;
        case 'Capacitación':
          actions.push({
            action: 'Programa intensivo de capacitación en seguridad',
            timeline: '1-3 meses',
            responsible: 'Seguridad Industrial + Jefes de área',
            kpi: 'Completar 90% de capacitaciones requeridas'
          });
          break;
        case 'Prevención de Incidentes':
          actions.push({
            action: 'Análisis de causas raíz y medidas preventivas',
            timeline: '2-6 semanas',
            responsible: 'Comité de Seguridad',
            kpi: 'Reducir incidentes en 50%'
          });
          break;
      }
    });

    return {
      immediate_actions: actions.filter(a => a.timeline.includes('semana')),
      medium_term_actions: actions.filter(a => a.timeline.includes('mes')),
      review_frequency: riskCategory.level === 'Crítico' ? 'Semanal' : 
                       riskCategory.level === 'Alto' ? 'Quincenal' : 'Mensual'
    };
  }

  /**
   * Genera resumen de seguridad
   */
  static generateSafetySummary(safetyIndices) {
    const totalDepts = safetyIndices.length;
    const avgSafetyScore = safetyIndices.reduce((sum, dept) => sum + dept.safety_index.overall_score, 0) / totalDepts;
    
    const riskDistribution = safetyIndices.reduce((dist, dept) => {
      const level = dept.risk_category.level;
      dist[level] = (dist[level] || 0) + 1;
      return dist;
    }, {});

    return {
      total_departments: totalDepts,
      average_safety_score: Math.round(avgSafetyScore * 100) / 100,
      risk_distribution: riskDistribution,
      best_performer: safetyIndices[0]?.departamento || 'N/A',
      needs_attention: safetyIndices.filter(d => d.risk_category.level === 'Alto' || d.risk_category.level === 'Crítico').length,
      overall_status: avgSafetyScore >= 80 ? 'Bueno' : avgSafetyScore >= 65 ? 'Aceptable' : 'Requiere mejora'
    };
  }

  /**
   * Genera recomendaciones generales de seguridad
   */
  static generateSafetyRecommendations(safetyIndices) {
    const recommendations = [];
    
    // Análisis de patrones comunes
    const commonIssues = this.identifyCommonIssues(safetyIndices);
    
    commonIssues.forEach(issue => {
      recommendations.push({
        type: 'Organizacional',
        priority: issue.severity,
        title: issue.title,
        description: issue.description,
        affected_departments: issue.departments,
        estimated_impact: issue.impact
      });
    });

    return recommendations;
  }

  /**
   * Identifica problemas comunes entre departamentos
   */
  static identifyCommonIssues(safetyIndices) {
    const issues = [];
    
    // Verificar si múltiples departamentos tienen problemas similares
    const depsWithPsychRisk = safetyIndices.filter(d => d.safety_index.component_scores.psychological < 70);
    if (depsWithPsychRisk.length >= 3) {
      issues.push({
        title: 'Riesgo psicológico generalizado',
        description: 'Múltiples departamentos presentan alto riesgo psicológico',
        departments: depsWithPsychRisk.map(d => d.departamento),
        severity: 'Alta',
        impact: 'Programa organizacional de bienestar'
      });
    }

    const depsWithEPPIssues = safetyIndices.filter(d => d.safety_index.component_scores.epp_usage < 80);
    if (depsWithEPPIssues.length >= 2) {
      issues.push({
        title: 'Problemas de cumplimiento EPP',
        description: 'Bajo cumplimiento en uso de equipos de protección personal',
        departments: depsWithEPPIssues.map(d => d.departamento),
        severity: 'Media',
        impact: 'Refuerzo en supervisión y entrenamiento'
      });
    }

    return issues;
  }

  // Métodos de cache (similares a DepartmentSegmentationService)
  static getCachedData(key) {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
      return cached.data;
    }
    return null;
  }

  static setCachedData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  static clearCache() {
    this.cache.clear();
  }
}

export default SafetyMetricsService;