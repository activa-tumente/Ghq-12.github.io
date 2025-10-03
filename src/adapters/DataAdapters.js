// Adapter Pattern para integración de diferentes fuentes de datos

// Interfaz común para adaptadores de datos
class DataAdapter {
  async connect() {
    throw new Error('El método connect debe ser implementado');
  }

  async disconnect() {
    throw new Error('El método disconnect debe ser implementado');
  }

  async create(data) {
    throw new Error('El método create debe ser implementado');
  }

  async read(id) {
    throw new Error('El método read debe ser implementado');
  }

  async update(id, data) {
    throw new Error('El método update debe ser implementado');
  }

  async delete(id) {
    throw new Error('El método delete debe ser implementado');
  }

  async list(filters = {}) {
    throw new Error('El método list debe ser implementado');
  }

  async count(filters = {}) {
    throw new Error('El método count debe ser implementado');
  }

  transformData(data) {
    return data;
  }

  validateData(data) {
    return { isValid: true, errors: [] };
  }
}

// Adapter para Supabase
class SupabaseAdapter extends DataAdapter {
  constructor(supabaseClient, tableName) {
    super();
    this.client = supabaseClient;
    this.tableName = tableName;
    this.isConnected = false;
  }

  async connect() {
    try {
      // Verificar conexión con una consulta simple
      const { error } = await this.client
        .from(this.tableName)
        .select('*')
        .limit(1);
      
      if (error) {
        throw new Error(`Error de conexión: ${error.message}`);
      }
      
      this.isConnected = true;
      return { success: true, message: 'Conectado a Supabase' };
    } catch (error) {
      this.isConnected = false;
      return { success: false, error: error.message };
    }
  }

  async disconnect() {
    this.isConnected = false;
    return { success: true, message: 'Desconectado de Supabase' };
  }

  async create(data) {
    try {
      const validation = this.validateData(data);
      if (!validation.isValid) {
        return { success: false, errors: validation.errors };
      }

      const transformedData = this.transformData(data);
      const { data: result, error } = await this.client
        .from(this.tableName)
        .insert(transformedData)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async read(id) {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async update(id, data) {
    try {
      const validation = this.validateData(data);
      if (!validation.isValid) {
        return { success: false, errors: validation.errors };
      }

      const transformedData = this.transformData(data);
      const { data: result, error } = await this.client
        .from(this.tableName)
        .update(transformedData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async delete(id) {
    try {
      const { error } = await this.client
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, message: 'Registro eliminado' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async list(filters = {}) {
    try {
      let query = this.client.from(this.tableName).select('*');

      // Aplicar filtros
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else if (typeof value === 'object' && value.operator) {
            switch (value.operator) {
              case 'gte':
                query = query.gte(key, value.value);
                break;
              case 'lte':
                query = query.lte(key, value.value);
                break;
              case 'like':
                query = query.ilike(key, `%${value.value}%`);
                break;
              default:
                query = query.eq(key, value.value);
            }
          } else {
            query = query.eq(key, value);
          }
        }
      });

      // Ordenamiento
      if (filters.orderBy) {
        query = query.order(filters.orderBy, { 
          ascending: filters.ascending !== false 
        });
      }

      // Paginación
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data: data || [] };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async count(filters = {}) {
    try {
      let query = this.client
        .from(this.tableName)
        .select('*', { count: 'exact', head: true });

      // Aplicar filtros
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          query = query.eq(key, value);
        }
      });

      const { count, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, count };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Adapter para API REST genérica
class RestApiAdapter extends DataAdapter {
  constructor(baseUrl, apiKey = null, headers = {}) {
    super();
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remover slash final
    this.apiKey = apiKey;
    this.headers = {
      'Content-Type': 'application/json',
      ...headers
    };
    
    if (apiKey) {
      this.headers['Authorization'] = `Bearer ${apiKey}`;
    }
  }

  async connect() {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: this.headers
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return { success: true, message: 'Conectado a API REST' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async disconnect() {
    return { success: true, message: 'Desconectado de API REST' };
  }

  async create(data) {
    try {
      const validation = this.validateData(data);
      if (!validation.isValid) {
        return { success: false, errors: validation.errors };
      }

      const transformedData = this.transformData(data);
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(transformedData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async read(id) {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'GET',
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async update(id, data) {
    try {
      const validation = this.validateData(data);
      if (!validation.isValid) {
        return { success: false, errors: validation.errors };
      }

      const transformedData = this.transformData(data);
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: this.headers,
        body: JSON.stringify(transformedData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async delete(id) {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return { success: true, message: 'Registro eliminado' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async list(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          queryParams.append(key, value);
        }
      });

      const url = `${this.baseUrl}?${queryParams.toString()}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, data: data.items || data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async count(filters = {}) {
    try {
      const queryParams = new URLSearchParams({ ...filters, count_only: 'true' });
      const url = `${this.baseUrl}/count?${queryParams.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return { success: true, count: result.count };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Adapter para LocalStorage (para desarrollo/testing)
class LocalStorageAdapter extends DataAdapter {
  constructor(storageKey) {
    super();
    this.storageKey = storageKey;
    this.data = this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error al cargar desde localStorage:', error);
      return [];
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    } catch (error) {
      console.error('Error al guardar en localStorage:', error);
    }
  }

  async connect() {
    return { success: true, message: 'Conectado a LocalStorage' };
  }

  async disconnect() {
    return { success: true, message: 'Desconectado de LocalStorage' };
  }

  async create(data) {
    try {
      const validation = this.validateData(data);
      if (!validation.isValid) {
        return { success: false, errors: validation.errors };
      }

      const transformedData = this.transformData(data);
      const newItem = {
        id: Date.now().toString(),
        ...transformedData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      this.data.push(newItem);
      this.saveToStorage();

      return { success: true, data: newItem };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async read(id) {
    try {
      const item = this.data.find(item => item.id === id);
      
      if (!item) {
        throw new Error('Registro no encontrado');
      }

      return { success: true, data: item };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async update(id, data) {
    try {
      const validation = this.validateData(data);
      if (!validation.isValid) {
        return { success: false, errors: validation.errors };
      }

      const index = this.data.findIndex(item => item.id === id);
      
      if (index === -1) {
        throw new Error('Registro no encontrado');
      }

      const transformedData = this.transformData(data);
      this.data[index] = {
        ...this.data[index],
        ...transformedData,
        updated_at: new Date().toISOString()
      };

      this.saveToStorage();

      return { success: true, data: this.data[index] };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async delete(id) {
    try {
      const index = this.data.findIndex(item => item.id === id);
      
      if (index === -1) {
        throw new Error('Registro no encontrado');
      }

      this.data.splice(index, 1);
      this.saveToStorage();

      return { success: true, message: 'Registro eliminado' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async list(filters = {}) {
    try {
      let filteredData = [...this.data];

      // Aplicar filtros
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          filteredData = filteredData.filter(item => {
            if (Array.isArray(value)) {
              return value.includes(item[key]);
            }
            return item[key] === value;
          });
        }
      });

      // Ordenamiento
      if (filters.orderBy) {
        filteredData.sort((a, b) => {
          const aVal = a[filters.orderBy];
          const bVal = b[filters.orderBy];
          
          if (filters.ascending === false) {
            return bVal > aVal ? 1 : -1;
          }
          return aVal > bVal ? 1 : -1;
        });
      }

      // Paginación
      if (filters.offset || filters.limit) {
        const start = filters.offset || 0;
        const end = start + (filters.limit || filteredData.length);
        filteredData = filteredData.slice(start, end);
      }

      return { success: true, data: filteredData };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async count(filters = {}) {
    try {
      let filteredData = [...this.data];

      // Aplicar filtros
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          filteredData = filteredData.filter(item => item[key] === value);
        }
      });

      return { success: true, count: filteredData.length };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Adapter específico para cuestionarios
class QuestionnaireAdapter extends SupabaseAdapter {
  constructor(supabaseClient) {
    super(supabaseClient, 'cuestionarios');
  }

  transformData(data) {
    // Transformar datos específicos del cuestionario
    return {
      ...data,
      respuestas: typeof data.respuestas === 'string' 
        ? data.respuestas 
        : JSON.stringify(data.respuestas),
      fecha_creacion: data.fecha_creacion || new Date().toISOString()
    };
  }

  validateData(data) {
    const errors = [];

    if (!data.nombre || data.nombre.trim() === '') {
      errors.push('El nombre es requerido');
    }

    if (!data.apellido || data.apellido.trim() === '') {
      errors.push('El apellido es requerido');
    }

    if (!data.documento || data.documento.trim() === '') {
      errors.push('El documento es requerido');
    }

    if (!data.respuestas) {
      errors.push('Las respuestas son requeridas');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  async getByDocument(documento) {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('documento', documento)
        .order('fecha_creacion', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data: data || [] };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getStatistics(filters = {}) {
    try {
      const { data } = await this.list(filters);
      
      if (!data.success) {
        throw new Error(data.error);
      }

      const questionnaires = data.data;
      const stats = {
        total: questionnaires.length,
        byArea: {},
        byGender: {},
        byShift: {},
        averageScores: {}
      };

      questionnaires.forEach(q => {
        // Estadísticas por área
        stats.byArea[q.area] = (stats.byArea[q.area] || 0) + 1;
        
        // Estadísticas por género
        stats.byGender[q.genero] = (stats.byGender[q.genero] || 0) + 1;
        
        // Estadísticas por turno
        stats.byShift[q.turno] = (stats.byShift[q.turno] || 0) + 1;
      });

      return { success: true, data: stats };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Factory para crear adaptadores
class AdapterFactory {
  static createSupabaseAdapter(supabaseClient, tableName) {
    return new SupabaseAdapter(supabaseClient, tableName);
  }

  static createRestApiAdapter(baseUrl, apiKey, headers) {
    return new RestApiAdapter(baseUrl, apiKey, headers);
  }

  static createLocalStorageAdapter(storageKey) {
    return new LocalStorageAdapter(storageKey);
  }

  static createQuestionnaireAdapter(supabaseClient) {
    return new QuestionnaireAdapter(supabaseClient);
  }

  // Crear adapter basado en configuración
  static createFromConfig(config) {
    switch (config.type) {
      case 'supabase':
        return new SupabaseAdapter(config.client, config.tableName);
      case 'rest':
        return new RestApiAdapter(config.baseUrl, config.apiKey, config.headers);
      case 'localStorage':
        return new LocalStorageAdapter(config.storageKey);
      case 'questionnaire':
        return new QuestionnaireAdapter(config.client);
      default:
        throw new Error(`Tipo de adapter no soportado: ${config.type}`);
    }
  }
}

// Hook de React para usar adaptadores
import { useState, useEffect, useCallback } from 'react';

export const useDataAdapter = (adapter) => {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const connect = async () => {
      setLoading(true);
      try {
        const result = await adapter.connect();
        setIsConnected(result.success);
        if (!result.success) {
          setError(result.error);
        }
      } catch (err) {
        setError(err.message);
        setIsConnected(false);
      } finally {
        setLoading(false);
      }
    };

    connect();

    return () => {
      adapter.disconnect();
    };
  }, [adapter]);

  const executeOperation = useCallback(async (operation, ...args) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await adapter[operation](...args);
      
      if (!result.success) {
        setError(result.error || 'Error en la operación');
      }
      
      return result;
    } catch (err) {
      const errorMessage = err.message || 'Error inesperado';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [adapter]);

  return {
    isConnected,
    loading,
    error,
    create: (data) => executeOperation('create', data),
    read: (id) => executeOperation('read', id),
    update: (id, data) => executeOperation('update', id, data),
    delete: (id) => executeOperation('delete', id),
    list: (filters) => executeOperation('list', filters),
    count: (filters) => executeOperation('count', filters)
  };
};

export {
  DataAdapter,
  SupabaseAdapter,
  RestApiAdapter,
  LocalStorageAdapter,
  QuestionnaireAdapter,
  AdapterFactory
};

export default {
  DataAdapter,
  AdapterFactory,
  useDataAdapter
};