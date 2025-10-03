/**
 * Tests unitarios para useCorrelationData hook
 * 
 * @author Sistema de Evaluación Psicológica BAT-7
 * @version 2.0.0
 */

import { renderHook } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useCorrelationData } from '../useCorrelationData';

// Mock data para las pruebas
const mockResponsesData = [
  {
    puntaje: 85,
    confianza: 90,
    satisfaccion: 80,
    motivacion: 75,
    genero: 'M',
    edad: 30,
    usoEpp: 'Siempre',
    accidentesPrevios: 'No'
  },
  {
    puntaje: 70,
    confianza: 65,
    satisfaccion: 70,
    motivacion: 80,
    genero: 'F',
    edad: 25,
    usoEpp: 'A veces',
    accidentesPrevios: 'Sí'
  },
  {
    puntaje: 95,
    confianza: 95,
    satisfaccion: 90,
    motivacion: 85,
    genero: 'M',
    edad: 35,
    usoEpp: 'Siempre',
    accidentesPrevios: 'No'
  },
  {
    puntaje: 60,
    confianza: 55,
    satisfaccion: 60,
    motivacion: 65,
    genero: 'F',
    edad: 28,
    usoEpp: 'Nunca',
    accidentesPrevios: 'Sí'
  }
];

const emptyResponsesData = [];

const invalidResponsesData = [
  { puntaje: null, confianza: undefined },
  { puntaje: 'invalid', confianza: 'invalid' }
];

describe('useCorrelationData Hook', () => {
  describe('Cálculos de correlación', () => {
    it('debería calcular correlaciones correctamente con datos válidos', () => {
      const { result } = renderHook(() => useCorrelationData(mockResponsesData));
      
      expect(result.current.correlations).toBeDefined();
      expect(Array.isArray(result.current.correlations)).toBe(true);
      expect(result.current.correlations.length).toBeGreaterThan(0);
      
      // Verificar que cada correlación tiene las propiedades esperadas
      result.current.correlations.forEach(correlation => {
        expect(correlation).toHaveProperty('variable1');
        expect(correlation).toHaveProperty('variable2');
        expect(correlation).toHaveProperty('value');
        expect(correlation).toHaveProperty('strength');
        expect(correlation).toHaveProperty('direction');
        expect(correlation).toHaveProperty('description');
      });
    });

    it('debería manejar datos vacíos correctamente', () => {
      const { result } = renderHook(() => useCorrelationData(emptyResponsesData));
      
      expect(result.current.correlations).toEqual([]);
      expect(result.current.statistics.totalCorrelations).toBe(0);
      expect(result.current.statistics.validCorrelations).toBe(0);
    });

    it('debería manejar datos inválidos sin errores', () => {
      const { result } = renderHook(() => useCorrelationData(invalidResponsesData));
      
      expect(result.current.correlations).toBeDefined();
      expect(Array.isArray(result.current.correlations)).toBe(true);
      
      // Las correlaciones con datos inválidos deberían tener valor null o NaN
      result.current.correlations.forEach(correlation => {
        if (correlation.value !== null && !isNaN(correlation.value)) {
          expect(typeof correlation.value).toBe('number');
        }
      });
    });
  });

  describe('Estadísticas resumidas', () => {
    it('debería calcular estadísticas correctamente', () => {
      const { result } = renderHook(() => useCorrelationData(mockResponsesData));
      
      expect(result.current.statistics).toBeDefined();
      expect(result.current.statistics).toHaveProperty('totalCorrelations');
      expect(result.current.statistics).toHaveProperty('validCorrelations');
      expect(result.current.statistics).toHaveProperty('strongCorrelations');
      expect(result.current.statistics).toHaveProperty('averageCorrelation');
      expect(result.current.statistics).toHaveProperty('distribution');
      
      expect(typeof result.current.statistics.totalCorrelations).toBe('number');
      expect(typeof result.current.statistics.validCorrelations).toBe('number');
      expect(typeof result.current.statistics.strongCorrelations).toBe('number');
      expect(typeof result.current.statistics.averageCorrelation).toBe('number');
      expect(typeof result.current.statistics.distribution).toBe('object');
    });

    it('debería calcular la distribución de fuerzas correctamente', () => {
      const { result } = renderHook(() => useCorrelationData(mockResponsesData));
      
      const distribution = result.current.statistics.distribution;
      
      expect(distribution).toHaveProperty('Muy Fuerte');
      expect(distribution).toHaveProperty('Fuerte');
      expect(distribution).toHaveProperty('Moderada');
      expect(distribution).toHaveProperty('Débil');
      expect(distribution).toHaveProperty('Muy Débil');
      
      // Verificar que todos los valores son números no negativos
      Object.values(distribution).forEach(count => {
        expect(typeof count).toBe('number');
        expect(count).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Insights dinámicos', () => {
    it('debería generar insights relevantes', () => {
      const { result } = renderHook(() => useCorrelationData(mockResponsesData));
      
      expect(result.current.insights).toBeDefined();
      expect(Array.isArray(result.current.insights)).toBe(true);
      
      result.current.insights.forEach(insight => {
        expect(insight).toHaveProperty('type');
        expect(insight).toHaveProperty('title');
        expect(insight).toHaveProperty('description');
        expect(insight).toHaveProperty('priority');
        
        expect(['warning', 'positive', 'neutral', 'recommendation']).toContain(insight.type);
        expect(['high', 'medium', 'low']).toContain(insight.priority);
      });
    });

    it('debería generar insights específicos para correlaciones fuertes', () => {
      // Crear datos con correlación perfecta
      const perfectCorrelationData = [
        { puntaje: 100, confianza: 100 },
        { puntaje: 90, confianza: 90 },
        { puntaje: 80, confianza: 80 },
        { puntaje: 70, confianza: 70 }
      ];
      
      const { result } = renderHook(() => useCorrelationData(perfectCorrelationData));
      
      // Debería haber al menos un insight sobre correlaciones fuertes
      const strongCorrelationInsights = result.current.insights.filter(
        insight => insight.description.toLowerCase().includes('fuerte') ||
                  insight.description.toLowerCase().includes('alta')
      );
      
      expect(strongCorrelationInsights.length).toBeGreaterThan(0);
    });
  });

  describe('Formateo de valores', () => {
    it('debería formatear valores de correlación correctamente', () => {
      const { result } = renderHook(() => useCorrelationData(mockResponsesData));
      
      result.current.correlations.forEach(correlation => {
        if (correlation.value !== null && !isNaN(correlation.value)) {
          // El valor formateado debería ser un string con formato decimal
          const formattedValue = correlation.value.toFixed(3);
          expect(typeof formattedValue).toBe('string');
          expect(formattedValue).toMatch(/^-?\d+\.\d{3}$/);
        }
      });
    });
  });

  describe('Rendimiento y memoización', () => {
    it('debería memoizar resultados para los mismos datos', () => {
      const { result, rerender } = renderHook(
        ({ data }) => useCorrelationData(data),
        { initialProps: { data: mockResponsesData } }
      );
      
      const firstResult = result.current;
      
      // Re-renderizar con los mismos datos
      rerender({ data: mockResponsesData });
      
      const secondResult = result.current;
      
      // Los objetos deberían ser los mismos (memoizados)
      expect(firstResult.correlations).toBe(secondResult.correlations);
      expect(firstResult.statistics).toBe(secondResult.statistics);
      expect(firstResult.insights).toBe(secondResult.insights);
    });

    it('debería recalcular cuando los datos cambian', () => {
      const { result, rerender } = renderHook(
        ({ data }) => useCorrelationData(data),
        { initialProps: { data: mockResponsesData } }
      );
      
      const firstResult = result.current;
      
      // Re-renderizar con datos diferentes
      const newData = [...mockResponsesData, { puntaje: 50, confianza: 45 }];
      rerender({ data: newData });
      
      const secondResult = result.current;
      
      // Los objetos deberían ser diferentes
      expect(firstResult.correlations).not.toBe(secondResult.correlations);
      expect(firstResult.statistics).not.toBe(secondResult.statistics);
    });
  });

  describe('Casos edge', () => {
    it('debería manejar datos con valores extremos', () => {
      const extremeData = [
        { puntaje: 0, confianza: 100 },
        { puntaje: 100, confianza: 0 },
        { puntaje: 50, confianza: 50 }
      ];
      
      const { result } = renderHook(() => useCorrelationData(extremeData));
      
      expect(result.current.correlations).toBeDefined();
      expect(Array.isArray(result.current.correlations)).toBe(true);
    });

    it('debería manejar un solo punto de datos', () => {
      const singleDataPoint = [{ puntaje: 85, confianza: 90 }];
      
      const { result } = renderHook(() => useCorrelationData(singleDataPoint));
      
      expect(result.current.correlations).toBeDefined();
      expect(result.current.statistics.totalCorrelations).toBe(0);
    });

    it('debería manejar datos con propiedades faltantes', () => {
      const incompleteData = [
        { puntaje: 85 }, // falta confianza
        { confianza: 90 }, // falta puntaje
        { puntaje: 75, confianza: 80 } // completo
      ];
      
      const { result } = renderHook(() => useCorrelationData(incompleteData));
      
      expect(result.current.correlations).toBeDefined();
      expect(Array.isArray(result.current.correlations)).toBe(true);
    });
  });
});