/**
 * Redux Store Mock Implementations for Testing
 * Provides comprehensive mocking for Redux store and slices
 */

import { configureStore } from '@reduxjs/toolkit';
import { createTestData } from '../testUtils';

/**
 * Mock initial states for different slices
 */
export const mockInitialStates = {
  auth: {
    user: null,
    session: null,
    isLoading: false,
    isAuthenticated: false,
    error: null,
    lastActivity: null
  },
  
  personas: {
    items: [],
    currentPersona: null,
    isLoading: false,
    error: null,
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0
    },
    filters: {
      search: '',
      edad: null,
      genero: null,
      ocupacion: null
    }
  },
  
  preguntas: {
    items: [],
    currentPregunta: null,
    isLoading: false,
    error: null,
    categories: [],
    activeCategory: null
  },
  
  respuestas: {
    items: [],
    currentSession: null,
    isLoading: false,
    error: null,
    progress: {
      current: 0,
      total: 0,
      percentage: 0
    },
    timeTracking: {
      sessionStart: null,
      questionStart: null,
      totalTime: 0
    }
  },
  
  ui: {
    theme: 'light',
    sidebarOpen: false,
    notifications: [],
    modals: {
      confirmDialog: { open: false, data: null },
      errorDialog: { open: false, data: null }
    },
    loading: {
      global: false,
      components: {}
    },
    errors: {
      global: null,
      components: {}
    }
  },
  
  analytics: {
    dashboard: {
      totalPersonas: 0,
      totalRespuestas: 0,
      avgCompletionTime: 0,
      completionRate: 0,
      isLoading: false,
      error: null,
      lastUpdated: null
    },
    reports: {
      items: [],
      isLoading: false,
      error: null
    }
  }
};

/**
 * Mock action creators
 */
export const mockActions = {
  auth: {
    login: jest.fn((credentials) => ({
      type: 'auth/login',
      payload: credentials
    })),
    logout: jest.fn(() => ({
      type: 'auth/logout'
    })),
    setUser: jest.fn((user) => ({
      type: 'auth/setUser',
      payload: user
    })),
    setLoading: jest.fn((loading) => ({
      type: 'auth/setLoading',
      payload: loading
    })),
    setError: jest.fn((error) => ({
      type: 'auth/setError',
      payload: error
    }))
  },
  
  personas: {
    fetchPersonas: jest.fn(() => ({
      type: 'personas/fetchPersonas'
    })),
    createPersona: jest.fn((persona) => ({
      type: 'personas/createPersona',
      payload: persona
    })),
    updatePersona: jest.fn((persona) => ({
      type: 'personas/updatePersona',
      payload: persona
    })),
    deletePersona: jest.fn((id) => ({
      type: 'personas/deletePersona',
      payload: id
    })),
    setCurrentPersona: jest.fn((persona) => ({
      type: 'personas/setCurrentPersona',
      payload: persona
    })),
    setFilters: jest.fn((filters) => ({
      type: 'personas/setFilters',
      payload: filters
    }))
  },
  
  preguntas: {
    fetchPreguntas: jest.fn(() => ({
      type: 'preguntas/fetchPreguntas'
    })),
    setCurrentPregunta: jest.fn((pregunta) => ({
      type: 'preguntas/setCurrentPregunta',
      payload: pregunta
    })),
    setActiveCategory: jest.fn((category) => ({
      type: 'preguntas/setActiveCategory',
      payload: category
    }))
  },
  
  respuestas: {
    submitRespuesta: jest.fn((respuesta) => ({
      type: 'respuestas/submitRespuesta',
      payload: respuesta
    })),
    startSession: jest.fn((personaId) => ({
      type: 'respuestas/startSession',
      payload: personaId
    })),
    endSession: jest.fn(() => ({
      type: 'respuestas/endSession'
    })),
    updateProgress: jest.fn((progress) => ({
      type: 'respuestas/updateProgress',
      payload: progress
    }))
  },
  
  ui: {
    setTheme: jest.fn((theme) => ({
      type: 'ui/setTheme',
      payload: theme
    })),
    toggleSidebar: jest.fn(() => ({
      type: 'ui/toggleSidebar'
    })),
    addNotification: jest.fn((notification) => ({
      type: 'ui/addNotification',
      payload: notification
    })),
    removeNotification: jest.fn((id) => ({
      type: 'ui/removeNotification',
      payload: id
    })),
    openModal: jest.fn((modal, data) => ({
      type: 'ui/openModal',
      payload: { modal, data }
    })),
    closeModal: jest.fn((modal) => ({
      type: 'ui/closeModal',
      payload: modal
    })),
    setGlobalLoading: jest.fn((loading) => ({
      type: 'ui/setGlobalLoading',
      payload: loading
    })),
    setComponentLoading: jest.fn((component, loading) => ({
      type: 'ui/setComponentLoading',
      payload: { component, loading }
    }))
  }
};

/**
 * Mock reducers
 */
export const mockReducers = {
  auth: jest.fn((state = mockInitialStates.auth, action) => {
    switch (action.type) {
      case 'auth/login':
        return {
          ...state,
          isLoading: true,
          error: null
        };
      case 'auth/login/fulfilled':
        return {
          ...state,
          user: action.payload.user,
          session: action.payload.session,
          isAuthenticated: true,
          isLoading: false,
          error: null
        };
      case 'auth/login/rejected':
        return {
          ...state,
          isLoading: false,
          error: action.payload
        };
      case 'auth/logout':
        return {
          ...mockInitialStates.auth
        };
      case 'auth/setUser':
        return {
          ...state,
          user: action.payload,
          isAuthenticated: !!action.payload
        };
      case 'auth/setLoading':
        return {
          ...state,
          isLoading: action.payload
        };
      case 'auth/setError':
        return {
          ...state,
          error: action.payload
        };
      default:
        return state;
    }
  }),
  
  personas: jest.fn((state = mockInitialStates.personas, action) => {
    switch (action.type) {
      case 'personas/fetchPersonas':
        return {
          ...state,
          isLoading: true,
          error: null
        };
      case 'personas/fetchPersonas/fulfilled':
        return {
          ...state,
          items: action.payload.data,
          pagination: action.payload.pagination,
          isLoading: false,
          error: null
        };
      case 'personas/fetchPersonas/rejected':
        return {
          ...state,
          isLoading: false,
          error: action.payload
        };
      case 'personas/createPersona/fulfilled':
        return {
          ...state,
          items: [...state.items, action.payload]
        };
      case 'personas/updatePersona/fulfilled':
        return {
          ...state,
          items: state.items.map(item => 
            item.id === action.payload.id ? action.payload : item
          ),
          currentPersona: state.currentPersona?.id === action.payload.id 
            ? action.payload 
            : state.currentPersona
        };
      case 'personas/deletePersona/fulfilled':
        return {
          ...state,
          items: state.items.filter(item => item.id !== action.payload),
          currentPersona: state.currentPersona?.id === action.payload 
            ? null 
            : state.currentPersona
        };
      case 'personas/setCurrentPersona':
        return {
          ...state,
          currentPersona: action.payload
        };
      case 'personas/setFilters':
        return {
          ...state,
          filters: { ...state.filters, ...action.payload }
        };
      default:
        return state;
    }
  }),
  
  ui: jest.fn((state = mockInitialStates.ui, action) => {
    switch (action.type) {
      case 'ui/setTheme':
        return {
          ...state,
          theme: action.payload
        };
      case 'ui/toggleSidebar':
        return {
          ...state,
          sidebarOpen: !state.sidebarOpen
        };
      case 'ui/addNotification':
        return {
          ...state,
          notifications: [...state.notifications, {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            ...action.payload
          }]
        };
      case 'ui/removeNotification':
        return {
          ...state,
          notifications: state.notifications.filter(n => n.id !== action.payload)
        };
      case 'ui/openModal':
        return {
          ...state,
          modals: {
            ...state.modals,
            [action.payload.modal]: {
              open: true,
              data: action.payload.data
            }
          }
        };
      case 'ui/closeModal':
        return {
          ...state,
          modals: {
            ...state.modals,
            [action.payload]: {
              open: false,
              data: null
            }
          }
        };
      case 'ui/setGlobalLoading':
        return {
          ...state,
          loading: {
            ...state.loading,
            global: action.payload
          }
        };
      case 'ui/setComponentLoading':
        return {
          ...state,
          loading: {
            ...state.loading,
            components: {
              ...state.loading.components,
              [action.payload.component]: action.payload.loading
            }
          }
        };
      default:
        return state;
    }
  })
};

/**
 * Mock selectors
 */
export const mockSelectors = {
  auth: {
    selectUser: jest.fn((state) => state.auth.user),
    selectIsAuthenticated: jest.fn((state) => state.auth.isAuthenticated),
    selectIsLoading: jest.fn((state) => state.auth.isLoading),
    selectError: jest.fn((state) => state.auth.error)
  },
  
  personas: {
    selectPersonas: jest.fn((state) => state.personas.items),
    selectCurrentPersona: jest.fn((state) => state.personas.currentPersona),
    selectPersonasLoading: jest.fn((state) => state.personas.isLoading),
    selectPersonasError: jest.fn((state) => state.personas.error),
    selectPersonasPagination: jest.fn((state) => state.personas.pagination),
    selectPersonasFilters: jest.fn((state) => state.personas.filters),
    selectFilteredPersonas: jest.fn((state) => {
      const { items, filters } = state.personas;
      return items.filter(persona => {
        if (filters.search && !persona.nombre.toLowerCase().includes(filters.search.toLowerCase())) {
          return false;
        }
        if (filters.genero && persona.genero !== filters.genero) {
          return false;
        }
        if (filters.ocupacion && persona.ocupacion !== filters.ocupacion) {
          return false;
        }
        return true;
      });
    })
  },
  
  ui: {
    selectTheme: jest.fn((state) => state.ui.theme),
    selectSidebarOpen: jest.fn((state) => state.ui.sidebarOpen),
    selectNotifications: jest.fn((state) => state.ui.notifications),
    selectModals: jest.fn((state) => state.ui.modals),
    selectGlobalLoading: jest.fn((state) => state.ui.loading.global),
    selectComponentLoading: jest.fn((component) => (state) => 
      state.ui.loading.components[component] || false
    )
  }
};

/**
 * Create mock store with custom initial state
 */
export function createMockStore(preloadedState = {}) {
  const initialState = {
    ...mockInitialStates,
    ...preloadedState
  };
  
  const store = configureStore({
    reducer: {
      auth: mockReducers.auth,
      personas: mockReducers.personas,
      preguntas: (state = mockInitialStates.preguntas) => state,
      respuestas: (state = mockInitialStates.respuestas) => state,
      ui: mockReducers.ui,
      analytics: (state = mockInitialStates.analytics) => state
    },
    preloadedState: initialState,
    middleware: (getDefaultMiddleware) => 
      getDefaultMiddleware({
        serializableCheck: false,
        immutableCheck: false
      })
  });
  
  // Add mock dispatch tracking
  const originalDispatch = store.dispatch;
  store.dispatch = jest.fn((action) => {
    return originalDispatch(action);
  });
  
  return store;
}

/**
 * Preset store configurations
 */
export const storeConfigurations = {
  /**
   * Authenticated user state
   */
  withAuthenticatedUser: () => {
    return createMockStore({
      auth: {
        ...mockInitialStates.auth,
        user: createTestData.user(),
        isAuthenticated: true,
        session: {
          access_token: 'mock-token',
          expires_at: Date.now() + 3600000
        }
      }
    });
  },
  
  /**
   * Loading state
   */
  withLoadingState: () => {
    return createMockStore({
      personas: {
        ...mockInitialStates.personas,
        isLoading: true
      },
      ui: {
        ...mockInitialStates.ui,
        loading: {
          global: true,
          components: {
            dashboard: true,
            personasList: true
          }
        }
      }
    });
  },
  
  /**
   * Error state
   */
  withErrorState: () => {
    return createMockStore({
      personas: {
        ...mockInitialStates.personas,
        error: 'Failed to fetch personas'
      },
      ui: {
        ...mockInitialStates.ui,
        errors: {
          global: 'Something went wrong',
          components: {
            dashboard: 'Dashboard error'
          }
        }
      }
    });
  },
  
  /**
   * With sample data
   */
  withSampleData: () => {
    return createMockStore({
      personas: {
        ...mockInitialStates.personas,
        items: [
          createTestData.persona({ id: 1, nombre: 'Juan Pérez' }),
          createTestData.persona({ id: 2, nombre: 'María García' }),
          createTestData.persona({ id: 3, nombre: 'Carlos López' })
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 3,
          totalPages: 1
        }
      },
      preguntas: {
        ...mockInitialStates.preguntas,
        items: [
          createTestData.pregunta({ id: 1, texto: '¿Pregunta 1?', categoria: 'categoria1' }),
          createTestData.pregunta({ id: 2, texto: '¿Pregunta 2?', categoria: 'categoria2' })
        ],
        categories: ['categoria1', 'categoria2']
      },
      respuestas: {
        ...mockInitialStates.respuestas,
        items: [
          createTestData.respuesta({ id: 1, persona_id: 1, pregunta_id: 1 }),
          createTestData.respuesta({ id: 2, persona_id: 1, pregunta_id: 2 })
        ]
      }
    });
  },
  
  /**
   * Dark theme
   */
  withDarkTheme: () => {
    return createMockStore({
      ui: {
        ...mockInitialStates.ui,
        theme: 'dark'
      }
    });
  },
  
  /**
   * With notifications
   */
  withNotifications: () => {
    return createMockStore({
      ui: {
        ...mockInitialStates.ui,
        notifications: [
          {
            id: 1,
            type: 'success',
            title: 'Success',
            message: 'Operation completed successfully',
            timestamp: new Date().toISOString()
          },
          {
            id: 2,
            type: 'error',
            title: 'Error',
            message: 'Something went wrong',
            timestamp: new Date().toISOString()
          }
        ]
      }
    });
  },
  
  /**
   * With open modals
   */
  withOpenModals: () => {
    return createMockStore({
      ui: {
        ...mockInitialStates.ui,
        modals: {
          confirmDialog: {
            open: true,
            data: {
              title: 'Confirm Action',
              message: 'Are you sure?',
              onConfirm: jest.fn(),
              onCancel: jest.fn()
            }
          },
          errorDialog: {
            open: false,
            data: null
          }
        }
      }
    });
  }
};

/**
 * Mock middleware
 */
export const mockMiddleware = {
  /**
   * Mock thunk middleware
   */
  thunk: (store) => (next) => (action) => {
    if (typeof action === 'function') {
      return action(store.dispatch, store.getState);
    }
    return next(action);
  },
  
  /**
   * Mock logger middleware
   */
  logger: (store) => (next) => (action) => {
    console.log('Mock Action:', action);
    const result = next(action);
    console.log('Mock State:', store.getState());
    return result;
  },
  
  /**
   * Mock error handling middleware
   */
  errorHandler: (store) => (next) => (action) => {
    try {
      return next(action);
    } catch (error) {
      console.error('Mock Middleware Error:', error);
      store.dispatch({
        type: 'ui/setGlobalError',
        payload: error.message
      });
      throw error;
    }
  }
};

/**
 * Helper to setup store mocks in tests
 */
export function setupStoreMocks(configuration = 'default') {
  let store;
  
  switch (configuration) {
    case 'withAuthenticatedUser':
      store = storeConfigurations.withAuthenticatedUser();
      break;
    case 'withLoadingState':
      store = storeConfigurations.withLoadingState();
      break;
    case 'withErrorState':
      store = storeConfigurations.withErrorState();
      break;
    case 'withSampleData':
      store = storeConfigurations.withSampleData();
      break;
    case 'withDarkTheme':
      store = storeConfigurations.withDarkTheme();
      break;
    case 'withNotifications':
      store = storeConfigurations.withNotifications();
      break;
    case 'withOpenModals':
      store = storeConfigurations.withOpenModals();
      break;
    default:
      store = createMockStore();
  }
  
  return store;
}

/**
 * Reset all store mocks
 */
export function resetStoreMocks() {
  Object.values(mockActions).forEach(actionGroup => {
    Object.values(actionGroup).forEach(action => {
      if (jest.isMockFunction(action)) {
        action.mockClear();
      }
    });
  });
  
  Object.values(mockReducers).forEach(reducer => {
    if (jest.isMockFunction(reducer)) {
      reducer.mockClear();
    }
  });
  
  Object.values(mockSelectors).forEach(selectorGroup => {
    Object.values(selectorGroup).forEach(selector => {
      if (jest.isMockFunction(selector)) {
        selector.mockClear();
      }
    });
  });
}

export default {
  mockInitialStates,
  mockActions,
  mockReducers,
  mockSelectors,
  createMockStore,
  storeConfigurations,
  mockMiddleware,
  setupStoreMocks,
  resetStoreMocks
};