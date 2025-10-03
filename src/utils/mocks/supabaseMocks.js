/**
 * Supabase Mock Implementations for Testing
 * Provides comprehensive mocking for Supabase client and operations
 */

import { createTestData } from '../testUtils';

/**
 * Mock Supabase Client
 */
export function createMockSupabaseClient(options = {}) {
  const {
    shouldFail = false,
    delay = 0,
    customResponses = {},
    enableRealtime = false
  } = options;

  // Mock data storage
  const mockData = {
    personas: [],
    preguntas: [],
    respuestas: [],
    users: []
  };

  // Helper to simulate async operations
  const simulateAsync = (result, shouldError = shouldFail) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (shouldError) {
          reject(new Error('Mock Supabase Error'));
        } else {
          resolve(result);
        }
      }, delay);
    });
  };

  // Mock query builder
  const createQueryBuilder = (table) => {
    let query = {
      table,
      filters: [],
      orderBy: null,
      limit: null,
      offset: null,
      select: '*'
    };

    const builder = {
      select: jest.fn((columns = '*') => {
        query.select = columns;
        return builder;
      }),

      insert: jest.fn((data) => {
        const insertData = Array.isArray(data) ? data : [data];
        const newRecords = insertData.map((item, index) => ({
          id: mockData[table].length + index + 1,
          created_at: new Date().toISOString(),
          ...item
        }));
        
        mockData[table].push(...newRecords);
        
        return {
          select: jest.fn(() => ({
            then: (callback) => simulateAsync({ data: newRecords, error: null }).then(callback)
          })),
          then: (callback) => simulateAsync({ data: newRecords, error: null }).then(callback)
        };
      }),

      update: jest.fn((data) => {
        const filteredData = applyFilters(mockData[table], query.filters);
        const updatedRecords = filteredData.map(record => ({
          ...record,
          ...data,
          updated_at: new Date().toISOString()
        }));
        
        // Update in mock data
        updatedRecords.forEach(updated => {
          const index = mockData[table].findIndex(item => item.id === updated.id);
          if (index !== -1) {
            mockData[table][index] = updated;
          }
        });
        
        return {
          select: jest.fn(() => ({
            then: (callback) => simulateAsync({ data: updatedRecords, error: null }).then(callback)
          })),
          then: (callback) => simulateAsync({ data: updatedRecords, error: null }).then(callback)
        };
      }),

      delete: jest.fn(() => {
        const filteredData = applyFilters(mockData[table], query.filters);
        const deletedRecords = [...filteredData];
        
        // Remove from mock data
        filteredData.forEach(record => {
          const index = mockData[table].findIndex(item => item.id === record.id);
          if (index !== -1) {
            mockData[table].splice(index, 1);
          }
        });
        
        return {
          then: (callback) => simulateAsync({ data: deletedRecords, error: null }).then(callback)
        };
      }),

      eq: jest.fn((column, value) => {
        query.filters.push({ type: 'eq', column, value });
        return builder;
      }),

      neq: jest.fn((column, value) => {
        query.filters.push({ type: 'neq', column, value });
        return builder;
      }),

      gt: jest.fn((column, value) => {
        query.filters.push({ type: 'gt', column, value });
        return builder;
      }),

      gte: jest.fn((column, value) => {
        query.filters.push({ type: 'gte', column, value });
        return builder;
      }),

      lt: jest.fn((column, value) => {
        query.filters.push({ type: 'lt', column, value });
        return builder;
      }),

      lte: jest.fn((column, value) => {
        query.filters.push({ type: 'lte', column, value });
        return builder;
      }),

      like: jest.fn((column, pattern) => {
        query.filters.push({ type: 'like', column, value: pattern });
        return builder;
      }),

      ilike: jest.fn((column, pattern) => {
        query.filters.push({ type: 'ilike', column, value: pattern });
        return builder;
      }),

      in: jest.fn((column, values) => {
        query.filters.push({ type: 'in', column, value: values });
        return builder;
      }),

      is: jest.fn((column, value) => {
        query.filters.push({ type: 'is', column, value });
        return builder;
      }),

      order: jest.fn((column, options = {}) => {
        query.orderBy = { column, ...options };
        return builder;
      }),

      limit: jest.fn((count) => {
        query.limit = count;
        return builder;
      }),

      range: jest.fn((from, to) => {
        query.offset = from;
        query.limit = to - from + 1;
        return builder;
      }),

      single: jest.fn(() => {
        query.single = true;
        return builder;
      }),

      maybeSingle: jest.fn(() => {
        query.maybeSingle = true;
        return builder;
      }),

      then: jest.fn((callback) => {
        const result = executeQuery(mockData[table], query);
        return simulateAsync(result).then(callback);
      })
    };

    return builder;
  };

  // Helper to apply filters
  const applyFilters = (data, filters) => {
    return data.filter(record => {
      return filters.every(filter => {
        const { type, column, value } = filter;
        const recordValue = record[column];
        
        switch (type) {
          case 'eq':
            return recordValue === value;
          case 'neq':
            return recordValue !== value;
          case 'gt':
            return recordValue > value;
          case 'gte':
            return recordValue >= value;
          case 'lt':
            return recordValue < value;
          case 'lte':
            return recordValue <= value;
          case 'like':
            return String(recordValue).includes(value.replace(/%/g, ''));
          case 'ilike':
            return String(recordValue).toLowerCase().includes(value.replace(/%/g, '').toLowerCase());
          case 'in':
            return value.includes(recordValue);
          case 'is':
            return recordValue === value;
          default:
            return true;
        }
      });
    });
  };

  // Helper to execute query
  const executeQuery = (data, query) => {
    let result = [...data];
    
    // Apply filters
    if (query.filters.length > 0) {
      result = applyFilters(result, query.filters);
    }
    
    // Apply ordering
    if (query.orderBy) {
      const { column, ascending = true } = query.orderBy;
      result.sort((a, b) => {
        const aVal = a[column];
        const bVal = b[column];
        
        if (aVal < bVal) return ascending ? -1 : 1;
        if (aVal > bVal) return ascending ? 1 : -1;
        return 0;
      });
    }
    
    // Apply pagination
    if (query.offset !== null || query.limit !== null) {
      const start = query.offset || 0;
      const end = query.limit ? start + query.limit : undefined;
      result = result.slice(start, end);
    }
    
    // Handle single/maybeSingle
    if (query.single || query.maybeSingle) {
      if (result.length === 0) {
        return query.maybeSingle 
          ? { data: null, error: null }
          : { data: null, error: new Error('No rows found') };
      }
      if (result.length > 1 && query.single) {
        return { data: null, error: new Error('Multiple rows found') };
      }
      return { data: result[0], error: null };
    }
    
    return { data: result, error: null };
  };

  // Mock realtime functionality
  const createRealtimeChannel = (channelName) => {
    const subscribers = new Map();
    
    return {
      on: jest.fn((event, filter, callback) => {
        const key = `${event}_${JSON.stringify(filter)}`;
        if (!subscribers.has(key)) {
          subscribers.set(key, []);
        }
        subscribers.get(key).push(callback);
        return channel;
      }),
      
      subscribe: jest.fn((callback) => {
        if (callback) callback('SUBSCRIBED');
        return channel;
      }),
      
      unsubscribe: jest.fn(() => {
        subscribers.clear();
        return Promise.resolve({ error: null });
      }),
      
      // Helper to simulate realtime events
      _simulateEvent: (event, payload) => {
        subscribers.forEach((callbacks, key) => {
          if (key.startsWith(event)) {
            callbacks.forEach(callback => callback(payload));
          }
        });
      }
    };
  };

  const channel = enableRealtime ? createRealtimeChannel('test-channel') : null;

  // Mock auth
  const mockAuth = {
    getSession: jest.fn(() => 
      simulateAsync({ 
        data: { 
          session: {
            user: createTestData.user(),
            access_token: 'mock-token'
          }
        }, 
        error: null 
      })
    ),
    
    getUser: jest.fn(() => 
      simulateAsync({ 
        data: { user: createTestData.user() }, 
        error: null 
      })
    ),
    
    signIn: jest.fn((credentials) => 
      simulateAsync({ 
        data: { 
          user: createTestData.user({ email: credentials.email }),
          session: { access_token: 'mock-token' }
        }, 
        error: null 
      })
    ),
    
    signUp: jest.fn((credentials) => 
      simulateAsync({ 
        data: { 
          user: createTestData.user({ email: credentials.email }),
          session: { access_token: 'mock-token' }
        }, 
        error: null 
      })
    ),
    
    signOut: jest.fn(() => 
      simulateAsync({ error: null })
    ),
    
    onAuthStateChange: jest.fn((callback) => {
      // Simulate initial auth state
      setTimeout(() => {
        callback('SIGNED_IN', { user: createTestData.user() });
      }, 10);
      
      return {
        data: { subscription: { unsubscribe: jest.fn() } }
      };
    })
  };

  // Mock storage
  const mockStorage = {
    from: jest.fn((bucket) => ({
      upload: jest.fn((path, file) => 
        simulateAsync({ 
          data: { path, fullPath: `${bucket}/${path}` }, 
          error: null 
        })
      ),
      
      download: jest.fn((path) => 
        simulateAsync({ 
          data: new Blob(['mock file content']), 
          error: null 
        })
      ),
      
      remove: jest.fn((paths) => 
        simulateAsync({ 
          data: paths.map(path => ({ name: path })), 
          error: null 
        })
      ),
      
      list: jest.fn((path) => 
        simulateAsync({ 
          data: [
            { name: 'file1.jpg', id: '1' },
            { name: 'file2.png', id: '2' }
          ], 
          error: null 
        })
      ),
      
      getPublicUrl: jest.fn((path) => ({
        data: { publicUrl: `https://mock-storage.com/${bucket}/${path}` }
      }))
    }))
  };

  // Main client object
  const client = {
    from: jest.fn((table) => {
      if (customResponses[table]) {
        return customResponses[table];
      }
      return createQueryBuilder(table);
    }),
    
    auth: mockAuth,
    storage: mockStorage,
    
    channel: jest.fn((channelName) => 
      enableRealtime ? createRealtimeChannel(channelName) : null
    ),
    
    removeChannel: jest.fn(() => Promise.resolve({ error: null })),
    
    rpc: jest.fn((functionName, params) => {
      // Mock RPC calls
      const mockRpcResponses = {
        get_dashboard_analytics: () => ({
          total_personas: mockData.personas.length,
          total_respuestas: mockData.respuestas.length,
          avg_completion_time: 120000,
          completion_rate: 0.85
        }),
        
        calculate_bat7_score: (params) => ({
          score: Math.floor(Math.random() * 100),
          category: 'medium_risk',
          recommendations: ['Recommendation 1', 'Recommendation 2']
        })
      };
      
      const response = mockRpcResponses[functionName] 
        ? mockRpcResponses[functionName](params)
        : { result: 'mock_result' };
      
      return {
        then: (callback) => simulateAsync({ data: response, error: null }).then(callback)
      };
    }),
    
    // Helper methods for testing
    _getMockData: () => mockData,
    _setMockData: (table, data) => {
      mockData[table] = data;
    },
    _addMockData: (table, data) => {
      const newData = Array.isArray(data) ? data : [data];
      mockData[table].push(...newData);
    },
    _clearMockData: (table) => {
      if (table) {
        mockData[table] = [];
      } else {
        Object.keys(mockData).forEach(key => {
          mockData[key] = [];
        });
      }
    },
    _simulateRealtimeEvent: (event, payload) => {
      if (channel && channel._simulateEvent) {
        channel._simulateEvent(event, payload);
      }
    }
  };

  return client;
}

/**
 * Preset mock configurations
 */
export const mockConfigurations = {
  /**
   * Success scenario with sample data
   */
  withSampleData: () => {
    const client = createMockSupabaseClient();
    
    // Add sample data
    client._addMockData('personas', [
      createTestData.persona({ id: 1, nombre: 'Juan Pérez' }),
      createTestData.persona({ id: 2, nombre: 'María García' })
    ]);
    
    client._addMockData('preguntas', [
      createTestData.pregunta({ id: 1, texto: '¿Pregunta 1?' }),
      createTestData.pregunta({ id: 2, texto: '¿Pregunta 2?' })
    ]);
    
    client._addMockData('respuestas', [
      createTestData.respuesta({ id: 1, persona_id: 1, pregunta_id: 1 }),
      createTestData.respuesta({ id: 2, persona_id: 1, pregunta_id: 2 })
    ]);
    
    return client;
  },
  
  /**
   * Error scenario
   */
  withErrors: () => {
    return createMockSupabaseClient({ shouldFail: true });
  },
  
  /**
   * Slow response scenario
   */
  withDelay: (delay = 2000) => {
    return createMockSupabaseClient({ delay });
  },
  
  /**
   * Realtime enabled scenario
   */
  withRealtime: () => {
    return createMockSupabaseClient({ enableRealtime: true });
  },
  
  /**
   * Custom responses scenario
   */
  withCustomResponses: (responses) => {
    return createMockSupabaseClient({ customResponses: responses });
  }
};

/**
 * Mock Supabase module
 */
export const mockSupabaseModule = {
  createClient: jest.fn(() => createMockSupabaseClient()),
  
  // Reset all mocks
  resetMocks: () => {
    jest.clearAllMocks();
  }
};

/**
 * Helper to setup Supabase mocks in tests
 */
export function setupSupabaseMocks(configuration = 'default') {
  let client;
  
  switch (configuration) {
    case 'withSampleData':
      client = mockConfigurations.withSampleData();
      break;
    case 'withErrors':
      client = mockConfigurations.withErrors();
      break;
    case 'withDelay':
      client = mockConfigurations.withDelay();
      break;
    case 'withRealtime':
      client = mockConfigurations.withRealtime();
      break;
    default:
      client = createMockSupabaseClient();
  }
  
  // Mock the Supabase module
  jest.doMock('@supabase/supabase-js', () => ({
    createClient: jest.fn(() => client)
  }));
  
  return client;
}

export default {
  createMockSupabaseClient,
  mockConfigurations,
  mockSupabaseModule,
  setupSupabaseMocks
};