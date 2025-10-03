/**
 * Common data processing utilities
 */

/**
 * Process consolidated questionnaire responses into individual question format
 * @param {Object} consolidatedResponse - Response with answers in JSONB format
 * @returns {Array} Array of individual question responses
 */
export const processConsolidatedResponses = (consolidatedResponse) => {
  if (!consolidatedResponse?.respuestas || typeof consolidatedResponse.respuestas !== 'object') {
    return [];
  }

  return Object.entries(consolidatedResponse.respuestas).map(([questionId, answer]) => ({
    pregunta_id: parseInt(questionId),
    respuesta: answer,
    created_at: consolidatedResponse.created_at
  }));
};

/**
 * Calculate completion percentage
 * @param {Object} answers - Current answers object
 * @param {number} totalQuestions - Total number of questions
 * @returns {Object} Completion statistics
 */
export const calculateCompletionStats = (answers, totalQuestions) => {
  const answeredCount = Object.keys(answers || {}).length;
  return {
    answeredCount,
    totalQuestions,
    progressPercentage: (answeredCount / totalQuestions) * 100,
    isComplete: answeredCount === totalQuestions
  };
};

/**
 * Filter and sort responses based on criteria
 * @param {Array} responses - Array of responses
 * @param {Object} filters - Filter criteria
 * @returns {Array} Filtered and sorted responses
 */
export const filterAndSortResponses = (responses, filters = {}) => {
  const { searchTerm, filterLevel, sortBy } = filters;
  
  return responses
    .filter(resp => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const searchableFields = [
          resp.nombres,
          resp.apellidos,
          resp.email,
          resp.area
        ];
        
        const matchesSearch = searchableFields.some(field => 
          field && field.toLowerCase().includes(searchLower)
        );
        
        if (!matchesSearch) return false;
      }
      
      // Level filter
      if (filterLevel && filterLevel !== 'todos') {
        return resp.nivel === filterLevel;
      }
      
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'fecha_asc':
          return new Date(a.fecha_completado || 0) - new Date(b.fecha_completado || 0);
        case 'fecha_desc':
          return new Date(b.fecha_completado || 0) - new Date(a.fecha_completado || 0);
        case 'nombre_asc':
          return (a.nombres || '').localeCompare(b.nombres || '');
        case 'nombre_desc':
          return (b.nombres || '').localeCompare(a.nombres || '');
        case 'nivel_asc':
          return (a.puntuacionTotal || 0) - (b.puntuacionTotal || 0);
        case 'nivel_desc':
          return (b.puntuacionTotal || 0) - (a.puntuacionTotal || 0);
        default:
          return 0;
      }
    });
};

/**
 * Generate CSV content from data array
 * @param {Array} data - Data to export
 * @param {Array} headers - Column headers
 * @param {Function} rowMapper - Function to map data rows
 * @returns {string} CSV content
 */
export const generateCSVContent = (data, headers, rowMapper) => {
  const rows = data.map(rowMapper);
  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
};

/**
 * Enhanced debounce function with immediate execution option and cleanup
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @param {boolean} immediate - Execute immediately on first call
 * @returns {Function} Debounced function with cancel method
 */
export const debounce = (func, delay, immediate = false) => {
  let timeoutId;
  let lastArgs;
  
  const debounced = (...args) => {
    lastArgs = args;
    
    const callNow = immediate && !timeoutId;
    
    clearTimeout(timeoutId);
    
    timeoutId = setTimeout(() => {
      timeoutId = null;
      if (!immediate) func.apply(null, lastArgs);
    }, delay);
    
    if (callNow) func.apply(null, args);
  };
  
  // Add cancel method for cleanup
  debounced.cancel = () => {
    clearTimeout(timeoutId);
    timeoutId = null;
  };
  
  // Add flush method to execute immediately
  debounced.flush = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      func.apply(null, lastArgs);
      timeoutId = null;
    }
  };
  
  return debounced;
};

/**
 * Throttle function for rate limiting
 * @param {Function} func - Function to throttle
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Throttled function
 */
export const throttle = (func, delay) => {
  let lastCall = 0;
  let timeoutId;
  
  return (...args) => {
    const now = Date.now();
    
    if (now - lastCall >= delay) {
      lastCall = now;
      func.apply(null, args);
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        func.apply(null, args);
      }, delay - (now - lastCall));
    }
  };
};

/**
 * Create a lookup map from array for O(1) access
 * @param {Array} array - Source array
 * @param {string} keyField - Field to use as key
 * @returns {Map} Lookup map
 */
export const createLookupMap = (array, keyField) => {
  return new Map(array.map(item => [item[keyField], item]));
};