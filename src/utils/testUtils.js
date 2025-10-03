/**
 * Testing Utilities and Helpers
 * Provides comprehensive testing infrastructure for React components and hooks
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { configureStore } from '@reduxjs/toolkit';

// Mock implementations
import { createMockSupabaseClient } from './mocks/supabaseMocks';
import { createMockStore } from './mocks/storeMocks';
import { ErrorSubject } from '../observers/ErrorObserver';

/**
 * Test Configuration
 */
export const TEST_CONFIG = {
  timeout: {
    default: 5000,
    async: 10000,
    integration: 15000
  },
  retries: {
    flaky: 3,
    network: 2
  },
  viewport: {
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1920, height: 1080 }
  }
};

/**
 * Custom render function with providers
 */
export function renderWithProviders(
  ui,
  {
    preloadedState = {},
    store = createMockStore(preloadedState),
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    }),
    route = '/',
    ...renderOptions
  } = {}
) {
  function Wrapper({ children }) {
    return (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            {children}
          </BrowserRouter>
        </QueryClientProvider>
      </Provider>
    );
  }

  // Navigate to route if specified
  if (route !== '/') {
    window.history.pushState({}, 'Test page', route);
  }

  return {
    store,
    queryClient,
    ...render(ui, { wrapper: Wrapper, ...renderOptions })
  };
}

/**
 * Custom hook testing wrapper
 */
export function renderHookWithProviders(
  hook,
  {
    preloadedState = {},
    store = createMockStore(preloadedState),
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    }),
    ...options
  } = {}
) {
  function wrapper({ children }) {
    return (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </Provider>
    );
  }

  return {
    store,
    queryClient,
    ...renderHook(hook, { wrapper, ...options })
  };
}

/**
 * Wait for loading states to complete
 */
export async function waitForLoadingToFinish() {
  await waitFor(
    () => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument();
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    },
    { timeout: TEST_CONFIG.timeout.async }
  );
}

/**
 * Wait for error states to appear
 */
export async function waitForError(errorMessage) {
  await waitFor(
    () => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    },
    { timeout: TEST_CONFIG.timeout.default }
  );
}

/**
 * Simulate network delay
 */
export function delay(ms = 100) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Mock intersection observer for testing
 */
export function mockIntersectionObserver() {
  const mockIntersectionObserver = jest.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null
  });
  window.IntersectionObserver = mockIntersectionObserver;
  return mockIntersectionObserver;
}

/**
 * Mock resize observer for testing
 */
export function mockResizeObserver() {
  const mockResizeObserver = jest.fn();
  mockResizeObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null
  });
  window.ResizeObserver = mockResizeObserver;
  return mockResizeObserver;
}

/**
 * Mock window.matchMedia for responsive testing
 */
export function mockMatchMedia(matches = false) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn()
    }))
  });
}

/**
 * Set viewport size for responsive testing
 */
export function setViewportSize(size) {
  const { width, height } = TEST_CONFIG.viewport[size] || size;
  
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width
  });
  
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height
  });
  
  // Trigger resize event
  window.dispatchEvent(new Event('resize'));
}

/**
 * Test data generators
 */
export const createTestData = {
  persona: (overrides = {}) => ({
    id: 1,
    nombre: 'Test Persona',
    edad: 25,
    genero: 'masculino',
    ocupacion: 'estudiante',
    created_at: new Date().toISOString(),
    ...overrides
  }),

  pregunta: (overrides = {}) => ({
    id: 1,
    texto: '¿Test question?',
    categoria: 'test',
    orden: 1,
    activa: true,
    created_at: new Date().toISOString(),
    ...overrides
  }),

  respuesta: (overrides = {}) => ({
    id: 1,
    persona_id: 1,
    pregunta_id: 1,
    valor: 3,
    tiempo_respuesta: 2500,
    created_at: new Date().toISOString(),
    ...overrides
  }),

  user: (overrides = {}) => ({
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    created_at: new Date().toISOString(),
    ...overrides
  }),

  error: (overrides = {}) => ({
    id: 'error-123',
    type: 'VALIDATION_ERROR',
    message: 'Test error message',
    severity: 'medium',
    category: 'user_input',
    timestamp: Date.now(),
    ...overrides
  })
};

/**
 * Form testing utilities
 */
export const formUtils = {
  /**
   * Fill form field by label
   */
  async fillField(labelText, value) {
    const field = screen.getByLabelText(labelText);
    await userEvent.clear(field);
    await userEvent.type(field, value);
    return field;
  },

  /**
   * Select option from dropdown
   */
  async selectOption(labelText, optionText) {
    const select = screen.getByLabelText(labelText);
    await userEvent.selectOptions(select, optionText);
    return select;
  },

  /**
   * Submit form
   */
  async submitForm(formTestId = 'form') {
    const form = screen.getByTestId(formTestId);
    fireEvent.submit(form);
    return form;
  },

  /**
   * Check form validation
   */
  async expectValidationError(message) {
    await waitFor(() => {
      expect(screen.getByText(message)).toBeInTheDocument();
    });
  }
};

/**
 * API testing utilities
 */
export const apiUtils = {
  /**
   * Mock successful API response
   */
  mockSuccess(data, delay = 0) {
    return jest.fn().mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({ data, error: null }), delay)
      )
    );
  },

  /**
   * Mock API error response
   */
  mockError(error, delay = 0) {
    return jest.fn().mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({ data: null, error }), delay)
      )
    );
  },

  /**
   * Mock network failure
   */
  mockNetworkError(delay = 0) {
    return jest.fn().mockImplementation(() => 
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Network Error')), delay)
      )
    );
  }
};

/**
 * Accessibility testing utilities
 */
export const a11yUtils = {
  /**
   * Check for proper heading hierarchy
   */
  checkHeadingHierarchy() {
    const headings = screen.getAllByRole('heading');
    const levels = headings.map(h => parseInt(h.tagName.charAt(1)));
    
    for (let i = 1; i < levels.length; i++) {
      const diff = levels[i] - levels[i - 1];
      if (diff > 1) {
        throw new Error(`Heading hierarchy violation: h${levels[i - 1]} followed by h${levels[i]}`);
      }
    }
  },

  /**
   * Check for proper form labels
   */
  checkFormLabels() {
    const inputs = screen.getAllByRole('textbox');
    const selects = screen.getAllByRole('combobox');
    const checkboxes = screen.getAllByRole('checkbox');
    const radios = screen.getAllByRole('radio');
    
    [...inputs, ...selects, ...checkboxes, ...radios].forEach(element => {
      const label = element.getAttribute('aria-label') || 
                   element.getAttribute('aria-labelledby') ||
                   screen.queryByLabelText(element.value || element.textContent);
      
      if (!label) {
        throw new Error(`Form element missing label: ${element.outerHTML}`);
      }
    });
  },

  /**
   * Check for proper ARIA attributes
   */
  checkAriaAttributes() {
    const elementsWithAria = document.querySelectorAll('[aria-expanded], [aria-selected], [aria-checked]');
    
    elementsWithAria.forEach(element => {
      const ariaExpanded = element.getAttribute('aria-expanded');
      const ariaSelected = element.getAttribute('aria-selected');
      const ariaChecked = element.getAttribute('aria-checked');
      
      if (ariaExpanded && !['true', 'false'].includes(ariaExpanded)) {
        throw new Error(`Invalid aria-expanded value: ${ariaExpanded}`);
      }
      
      if (ariaSelected && !['true', 'false'].includes(ariaSelected)) {
        throw new Error(`Invalid aria-selected value: ${ariaSelected}`);
      }
      
      if (ariaChecked && !['true', 'false', 'mixed'].includes(ariaChecked)) {
        throw new Error(`Invalid aria-checked value: ${ariaChecked}`);
      }
    });
  }
};

/**
 * Performance testing utilities
 */
export const performanceUtils = {
  /**
   * Measure component render time
   */
  async measureRenderTime(component, iterations = 10) {
    const times = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      render(component);
      const end = performance.now();
      times.push(end - start);
    }
    
    return {
      average: times.reduce((a, b) => a + b, 0) / times.length,
      min: Math.min(...times),
      max: Math.max(...times),
      times
    };
  },

  /**
   * Check for memory leaks
   */
  checkMemoryLeaks(component, iterations = 5) {
    const initialMemory = performance.memory?.usedJSHeapSize || 0;
    
    for (let i = 0; i < iterations; i++) {
      const { unmount } = render(component);
      unmount();
    }
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    const finalMemory = performance.memory?.usedJSHeapSize || 0;
    const memoryIncrease = finalMemory - initialMemory;
    
    return {
      initialMemory,
      finalMemory,
      memoryIncrease,
      hasLeak: memoryIncrease > 1024 * 1024 // 1MB threshold
    };
  }
};

/**
 * Error testing utilities
 */
export const errorUtils = {
  /**
   * Capture error boundary errors
   */
  captureErrorBoundaryError(component) {
    const errors = [];
    const originalError = console.error;
    
    console.error = (...args) => {
      errors.push(args);
      originalError(...args);
    };
    
    try {
      render(component);
    } catch (error) {
      errors.push(error);
    } finally {
      console.error = originalError;
    }
    
    return errors;
  },

  /**
   * Test error observer notifications
   */
  async testErrorObserver(errorType, expectedObservers = []) {
    const notifiedObservers = [];
    
    // Mock observers
    const originalObservers = ErrorSubject.getObservers();
    ErrorSubject.clearObservers();
    
    expectedObservers.forEach(observerType => {
      const mockObserver = {
        id: observerType,
        priority: 50,
        notify: jest.fn((eventType, data) => {
          notifiedObservers.push({ observerType, eventType, data });
        }),
        shouldHandle: jest.fn(() => true)
      };
      ErrorSubject.addObserver(mockObserver);
    });
    
    // Trigger error
    const testError = createTestData.error({ type: errorType });
    ErrorSubject.reportError(testError);
    
    // Wait for async operations
    await act(async () => {
      await delay(100);
    });
    
    // Restore original observers
    ErrorSubject.clearObservers();
    originalObservers.forEach(observer => {
      ErrorSubject.addObserver(observer);
    });
    
    return notifiedObservers;
  }
};

/**
 * Custom matchers for Jest
 */
export const customMatchers = {
  /**
   * Check if element is visible in viewport
   */
  toBeInViewport(element) {
    const rect = element.getBoundingClientRect();
    const isVisible = (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= window.innerHeight &&
      rect.right <= window.innerWidth
    );
    
    return {
      pass: isVisible,
      message: () => `Expected element to ${isVisible ? 'not ' : ''}be in viewport`
    };
  },

  /**
   * Check if element has proper accessibility attributes
   */
  toBeAccessible(element) {
    const hasRole = element.getAttribute('role');
    const hasAriaLabel = element.getAttribute('aria-label') || element.getAttribute('aria-labelledby');
    const hasTabIndex = element.hasAttribute('tabindex');
    
    const isAccessible = hasRole || hasAriaLabel || hasTabIndex || 
                        ['button', 'input', 'select', 'textarea', 'a'].includes(element.tagName.toLowerCase());
    
    return {
      pass: isAccessible,
      message: () => `Expected element to ${isAccessible ? 'not ' : ''}be accessible`
    };
  }
};

/**
 * Test suite generators
 */
export const testSuites = {
  /**
   * Generate responsive design tests
   */
  generateResponsiveTests(component, breakpoints = ['mobile', 'tablet', 'desktop']) {
    return breakpoints.map(breakpoint => ({
      name: `renders correctly on ${breakpoint}`,
      test: () => {
        setViewportSize(breakpoint);
        const { container } = renderWithProviders(component);
        expect(container).toMatchSnapshot(`${breakpoint}-layout`);
      }
    }));
  },

  /**
   * Generate accessibility tests
   */
  generateA11yTests(component) {
    return [
      {
        name: 'has proper heading hierarchy',
        test: () => {
          renderWithProviders(component);
          a11yUtils.checkHeadingHierarchy();
        }
      },
      {
        name: 'has proper form labels',
        test: () => {
          renderWithProviders(component);
          a11yUtils.checkFormLabels();
        }
      },
      {
        name: 'has proper ARIA attributes',
        test: () => {
          renderWithProviders(component);
          a11yUtils.checkAriaAttributes();
        }
      }
    ];
  },

  /**
   * Generate error handling tests
   */
  generateErrorTests(component, errorScenarios = []) {
    return errorScenarios.map(scenario => ({
      name: `handles ${scenario.name} error`,
      test: async () => {
        const { rerender } = renderWithProviders(component);
        
        // Trigger error
        if (scenario.trigger) {
          await scenario.trigger();
        }
        
        // Check error display
        if (scenario.expectedError) {
          await waitForError(scenario.expectedError);
        }
        
        // Test recovery if provided
        if (scenario.recovery) {
          await scenario.recovery();
          await waitForLoadingToFinish();
        }
      }
    }));
  }
};

/**
 * Setup and teardown utilities
 */
export const setupUtils = {
  /**
   * Setup test environment
   */
  setupTestEnvironment() {
    // Mock console methods
    global.console = {
      ...console,
      warn: jest.fn(),
      error: jest.fn(),
      log: jest.fn()
    };
    
    // Mock window methods
    mockIntersectionObserver();
    mockResizeObserver();
    mockMatchMedia();
    
    // Setup fetch mock
    global.fetch = jest.fn();
    
    // Setup localStorage mock
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn()
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock
    });
    
    // Setup sessionStorage mock
    Object.defineProperty(window, 'sessionStorage', {
      value: localStorageMock
    });
  },

  /**
   * Cleanup test environment
   */
  cleanupTestEnvironment() {
    jest.clearAllMocks();
    jest.clearAllTimers();
    
    // Clear error observers
    ErrorSubject.clearObservers();
    ErrorSubject.initialize();
  }
};

// Export all utilities
export {
  render,
  screen,
  fireEvent,
  waitFor,
  userEvent,
  act,
  renderHook
};

export default {
  renderWithProviders,
  renderHookWithProviders,
  waitForLoadingToFinish,
  waitForError,
  delay,
  createTestData,
  formUtils,
  apiUtils,
  a11yUtils,
  performanceUtils,
  errorUtils,
  customMatchers,
  testSuites,
  setupUtils,
  TEST_CONFIG
};