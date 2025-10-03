/**
 * Configuración de tests para CorrelationAnalysis
 * 
 * @author Sistema de Evaluación Psicológica BAT-7
 * @version 2.0.0
 */

import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extender expect con matchers de testing-library
expect.extend(matchers);

// Limpiar después de cada test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock de IntersectionObserver para tests de componentes con lazy loading
global.IntersectionObserver = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn(),
}));

// Mock de ResizeObserver para tests de componentes responsive
global.ResizeObserver = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn(),
}));

// Mock de matchMedia para tests responsive
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock de requestAnimationFrame para animaciones
global.requestAnimationFrame = vi.fn(cb => setTimeout(cb, 0));
global.cancelAnimationFrame = vi.fn(id => clearTimeout(id));

// Configuración de console para tests
const originalError = console.error;
beforeEach(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is deprecated')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterEach(() => {
  console.error = originalError;
});

// Utilidades de testing personalizadas
export const createMockCorrelation = (overrides = {}) => ({
  variable1: 'Variable A',
  variable2: 'Variable B',
  value: 0.5,
  strength: 'Moderada',
  direction: 'Positiva',
  description: 'Correlación moderada positiva',
  ...overrides
});

export const createMockStatistics = (overrides = {}) => ({
  totalCorrelations: 10,
  validCorrelations: 8,
  strongCorrelations: 3,
  averageCorrelation: 0.45,
  distribution: {
    'Muy Fuerte': 1,
    'Fuerte': 2,
    'Moderada': 3,
    'Débil': 2,
    'Muy Débil': 0
  },
  ...overrides
});

export const createMockInsight = (overrides = {}) => ({
  type: 'neutral',
  title: 'Insight de prueba',
  description: 'Descripción del insight',
  priority: 'medium',
  ...overrides
});

export const createMockResponsesData = (count = 5) => {
  return Array.from({ length: count }, (_, index) => ({
    puntaje: 70 + (index * 5),
    confianza: 65 + (index * 6),
    satisfaccion: 60 + (index * 7),
    motivacion: 75 + (index * 4),
    genero: index % 2 === 0 ? 'M' : 'F',
    edad: 25 + index,
    usoEpp: ['Siempre', 'A veces', 'Nunca'][index % 3],
    accidentesPrevios: index % 2 === 0 ? 'No' : 'Sí'
  }));
};

// Helpers para testing de accesibilidad
export const expectAccessibleButton = (element) => {
  expect(element).toHaveAttribute('role', 'button');
  expect(element).toHaveAttribute('tabIndex', '0');
  expect(element).toHaveAttribute('aria-label');
};

export const expectAccessibleHeading = (element, level) => {
  expect(element).toHaveRole('heading');
  expect(element).toHaveAttribute('aria-level', level.toString());
};

export const expectAccessibleList = (element) => {
  expect(element).toHaveRole('list');
  const items = element.querySelectorAll('[role="listitem"]');
  expect(items.length).toBeGreaterThan(0);
};

// Helpers para testing de responsive design
export const mockViewport = (width, height = 768) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
  window.dispatchEvent(new Event('resize'));
};

// Helpers para testing de performance
export const measureRenderTime = async (renderFn) => {
  const start = performance.now();
  await renderFn();
  const end = performance.now();
  return end - start;
};

// Mock de datos para diferentes escenarios
export const testScenarios = {
  empty: {
    responsesData: [],
    expectedCorrelations: 0,
    expectedMessage: 'No hay datos suficientes'
  },
  
  minimal: {
    responsesData: createMockResponsesData(3),
    expectedCorrelations: 6, // Número esperado de correlaciones con 3 respuestas
    expectedMessage: null
  },
  
  normal: {
    responsesData: createMockResponsesData(10),
    expectedCorrelations: 21, // Número esperado de correlaciones con 10 respuestas
    expectedMessage: null
  },
  
  large: {
    responsesData: createMockResponsesData(100),
    expectedCorrelations: 21, // Mismo número de correlaciones configuradas
    expectedMessage: null
  },
  
  invalid: {
    responsesData: [
      { puntaje: null, confianza: undefined },
      { puntaje: 'invalid', confianza: 'invalid' }
    ],
    expectedCorrelations: 0,
    expectedMessage: 'No hay datos suficientes'
  }
};

// Configuración de timeouts para tests async
export const TEST_TIMEOUTS = {
  short: 1000,
  medium: 5000,
  long: 10000
};

// Configuración de umbrales para tests de performance
export const PERFORMANCE_THRESHOLDS = {
  renderTime: 100, // ms
  memoryUsage: 50, // MB
  bundleSize: 500 // KB
};