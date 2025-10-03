// Hook personalizado optimizado para gestión de estado con mejores prácticas

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useNotifications } from '../patterns/ObserverPattern.js';

/**
 * Hook optimizado para gestión de estado con debouncing, validación y persistencia
 * @param {*} initialValue - Valor inicial del estado
 * @param {Object} options - Opciones de configuración
 * @param {Function} options.validator - Función de validación
 * @param {number} options.debounceMs - Tiempo de debounce en milisegundos
 * @param {string} options.persistKey - Clave para persistencia en localStorage
 * @param {Function} options.onChange - Callback cuando el valor cambia
 * @param {Function} options.onError - Callback cuando hay errores de validación
 * @returns {Array} [value, setValue, { isValid, errors, isLoading, reset }]
 */
export const useOptimizedState = (
  initialValue,
  {
    validator = null,
    debounceMs = 0,
    persistKey = null,
    onChange = null,
    onError = null,
    serialize = JSON.stringify,
    deserialize = JSON.parse
  } = {}
) => {
  // Cargar valor inicial desde localStorage si está configurado
  const getInitialValue = useCallback(() => {
    if (persistKey && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(persistKey);
        if (stored !== null) {
          return deserialize(stored);
        }
      } catch (error) {
        console.warn(`Error loading persisted state for key "${persistKey}":`, error);
      }
    }
    return initialValue;
  }, [initialValue, persistKey, deserialize]);

  const [value, setValueInternal] = useState(getInitialValue);
  const [isValid, setIsValid] = useState(true);
  const [errors, setErrors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const debounceTimeoutRef = useRef(null);
  const validationTimeoutRef = useRef(null);
  const { notify } = useNotifications();

  // Función de validación optimizada
  const validateValue = useCallback(async (newValue) => {
    if (!validator) {
      setIsValid(true);
      setErrors([]);
      return { isValid: true, errors: [] };
    }

    try {
      setIsLoading(true);
      const result = await validator(newValue);
      
      const validationResult = {
        isValid: result === true || (result && result.isValid !== false),
        errors: result === true ? [] : (result.errors || result.messages || [])
      };

      setIsValid(validationResult.isValid);
      setErrors(validationResult.errors);
      
      if (!validationResult.isValid && onError) {
        onError(validationResult.errors, newValue);
      }

      return validationResult;
    } catch (error) {
      const errorResult = {
        isValid: false,
        errors: [`Error de validación: ${error.message}`]
      };
      
      setIsValid(false);
      setErrors(errorResult.errors);
      
      if (onError) {
        onError(errorResult.errors, newValue);
      }
      
      return errorResult;
    } finally {
      setIsLoading(false);
    }
  }, [validator, onError]);

  // Función para persistir en localStorage
  const persistValue = useCallback((newValue) => {
    if (persistKey && typeof window !== 'undefined') {
      try {
        localStorage.setItem(persistKey, serialize(newValue));
      } catch (error) {
        console.warn(`Error persisting state for key "${persistKey}":`, error);
      }
    }
  }, [persistKey, serialize]);

  // Función principal para actualizar el valor
  const setValue = useCallback((newValue) => {
    // Limpiar timeouts anteriores
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    // Resolver el nuevo valor si es una función
    const resolvedValue = typeof newValue === 'function' ? newValue(value) : newValue;
    
    // Actualizar el estado inmediatamente
    setValueInternal(resolvedValue);
    
    // Persistir el valor
    persistValue(resolvedValue);

    // Ejecutar onChange con debounce si está configurado
    if (onChange) {
      if (debounceMs > 0) {
        debounceTimeoutRef.current = setTimeout(() => {
          onChange(resolvedValue);
        }, debounceMs);
      } else {
        onChange(resolvedValue);
      }
    }

    // Validar con debounce si está configurado
    if (validator) {
      const validationDelay = debounceMs > 0 ? debounceMs : 100; // Mínimo 100ms para validación
      validationTimeoutRef.current = setTimeout(() => {
        validateValue(resolvedValue);
      }, validationDelay);
    }
  }, [value, onChange, debounceMs, validator, validateValue, persistValue]);

  // Función para resetear el estado
  const reset = useCallback(() => {
    const resetValue = typeof initialValue === 'function' ? initialValue() : initialValue;
    setValueInternal(resetValue);
    setIsValid(true);
    setErrors([]);
    setIsLoading(false);
    
    // Limpiar persistencia
    if (persistKey && typeof window !== 'undefined') {
      localStorage.removeItem(persistKey);
    }
    
    // Limpiar timeouts
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }
  }, [initialValue, persistKey]);

  // Limpiar timeouts al desmontar
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, []);

  // Validación inicial
  useEffect(() => {
    if (validator && value !== undefined) {
      validateValue(value);
    }
  }, []); // Solo en el montaje inicial

  return [
    value,
    setValue,
    {
      isValid,
      errors,
      isLoading,
      reset,
      validate: () => validateValue(value)
    }
  ];
};

/**
 * Hook para gestión de formularios con múltiples campos
 * @param {Object} initialValues - Valores iniciales del formulario
 * @param {Object} validationSchema - Esquema de validación por campo
 * @param {Object} options - Opciones adicionales
 * @returns {Object} Estado y funciones del formulario
 */
export const useOptimizedForm = (
  initialValues = {},
  validationSchema = {},
  {
    persistKey = null,
    debounceMs = 300,
    onSubmit = null,
    onFieldChange = null
  } = {}
) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  
  const validationTimeoutRef = useRef({});
  const { notify } = useNotifications();

  // Cargar valores persistidos
  useEffect(() => {
    if (persistKey && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(persistKey);
        if (stored) {
          const parsedValues = JSON.parse(stored);
          setValues(prev => ({ ...prev, ...parsedValues }));
        }
      } catch (error) {
        console.warn(`Error loading form data for key "${persistKey}":`, error);
      }
    }
  }, [persistKey]);

  // Persistir valores
  const persistValues = useCallback((newValues) => {
    if (persistKey && typeof window !== 'undefined') {
      try {
        localStorage.setItem(persistKey, JSON.stringify(newValues));
      } catch (error) {
        console.warn(`Error persisting form data for key "${persistKey}":`, error);
      }
    }
  }, [persistKey]);

  // Validar un campo específico
  const validateField = useCallback(async (fieldName, value) => {
    const validator = validationSchema[fieldName];
    if (!validator) return { isValid: true, errors: [] };

    try {
      const result = await validator(value, values);
      return {
        isValid: result === true || (result && result.isValid !== false),
        errors: result === true ? [] : (result.errors || result.messages || [])
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [`Error de validación: ${error.message}`]
      };
    }
  }, [validationSchema, values]);

  // Validar todo el formulario
  const validateForm = useCallback(async () => {
    setIsValidating(true);
    const newErrors = {};
    let isFormValid = true;

    for (const [fieldName, value] of Object.entries(values)) {
      const validation = await validateField(fieldName, value);
      if (!validation.isValid) {
        newErrors[fieldName] = validation.errors;
        isFormValid = false;
      }
    }

    setErrors(newErrors);
    setIsValidating(false);
    return { isValid: isFormValid, errors: newErrors };
  }, [values, validateField]);

  // Actualizar valor de un campo
  const setFieldValue = useCallback((fieldName, value) => {
    const newValues = { ...values, [fieldName]: value };
    setValues(newValues);
    persistValues(newValues);

    // Marcar como tocado
    setTouched(prev => ({ ...prev, [fieldName]: true }));

    // Callback de cambio de campo
    if (onFieldChange) {
      onFieldChange(fieldName, value, newValues);
    }

    // Validación con debounce
    if (validationTimeoutRef.current[fieldName]) {
      clearTimeout(validationTimeoutRef.current[fieldName]);
    }

    validationTimeoutRef.current[fieldName] = setTimeout(async () => {
      const validation = await validateField(fieldName, value);
      setErrors(prev => ({
        ...prev,
        [fieldName]: validation.isValid ? undefined : validation.errors
      }));
    }, debounceMs);
  }, [values, persistValues, onFieldChange, validateField, debounceMs]);

  // Marcar campo como tocado
  const setFieldTouched = useCallback((fieldName, isTouched = true) => {
    setTouched(prev => ({ ...prev, [fieldName]: isTouched }));
  }, []);

  // Enviar formulario
  const handleSubmit = useCallback(async (event) => {
    if (event) {
      event.preventDefault();
    }

    setIsSubmitting(true);
    
    try {
      // Marcar todos los campos como tocados
      const allTouched = Object.keys(values).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {});
      setTouched(allTouched);

      // Validar formulario
      const validation = await validateForm();
      
      if (!validation.isValid) {
        notify('Por favor corrige los errores en el formulario', 'warning');
        return { success: false, errors: validation.errors };
      }

      // Ejecutar callback de envío
      if (onSubmit) {
        const result = await onSubmit(values);
        if (result && result.success) {
          notify('Formulario enviado exitosamente', 'success');
          return result;
        } else {
          throw new Error(result?.error || 'Error al enviar formulario');
        }
      }

      return { success: true, data: values };
    } catch (error) {
      notify(`Error al enviar formulario: ${error.message}`, 'error');
      return { success: false, error: error.message };
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validateForm, onSubmit, notify]);

  // Resetear formulario
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
    setIsValidating(false);
    
    // Limpiar persistencia
    if (persistKey && typeof window !== 'undefined') {
      localStorage.removeItem(persistKey);
    }
    
    // Limpiar timeouts
    Object.values(validationTimeoutRef.current).forEach(timeout => {
      if (timeout) clearTimeout(timeout);
    });
    validationTimeoutRef.current = {};
  }, [initialValues, persistKey]);

  // Estado calculado
  const isValid = useMemo(() => {
    return Object.values(errors).every(error => !error || error.length === 0);
  }, [errors]);

  const isDirty = useMemo(() => {
    return JSON.stringify(values) !== JSON.stringify(initialValues);
  }, [values, initialValues]);

  const touchedFields = useMemo(() => {
    return Object.keys(touched).filter(key => touched[key]);
  }, [touched]);

  // Limpiar timeouts al desmontar
  useEffect(() => {
    return () => {
      Object.values(validationTimeoutRef.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, []);

  return {
    // Estado
    values,
    errors,
    touched,
    isSubmitting,
    isValidating,
    isValid,
    isDirty,
    touchedFields,
    
    // Funciones
    setFieldValue,
    setFieldTouched,
    validateField,
    validateForm,
    handleSubmit,
    resetForm,
    
    // Helpers
    getFieldProps: (fieldName) => ({
      value: values[fieldName] || '',
      onChange: (e) => setFieldValue(fieldName, e.target.value),
      onBlur: () => setFieldTouched(fieldName),
      error: touched[fieldName] && errors[fieldName],
      isValid: touched[fieldName] && !errors[fieldName]
    })
  };
};

/**
 * Hook para gestión de listas con operaciones optimizadas
 * @param {Array} initialItems - Items iniciales
 * @param {Object} options - Opciones de configuración
 * @returns {Object} Estado y funciones de la lista
 */
export const useOptimizedList = (
  initialItems = [],
  {
    keyExtractor = (item, index) => item.id || index,
    persistKey = null,
    maxItems = null,
    onItemAdd = null,
    onItemRemove = null,
    onItemUpdate = null
  } = {}
) => {
  const [items, setItems] = useState(initialItems);
  const [isLoading, setIsLoading] = useState(false);
  const { notify } = useNotifications();

  // Cargar items persistidos
  useEffect(() => {
    if (persistKey && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(persistKey);
        if (stored) {
          setItems(JSON.parse(stored));
        }
      } catch (error) {
        console.warn(`Error loading list data for key "${persistKey}":`, error);
      }
    }
  }, [persistKey]);

  // Persistir items
  const persistItems = useCallback((newItems) => {
    if (persistKey && typeof window !== 'undefined') {
      try {
        localStorage.setItem(persistKey, JSON.stringify(newItems));
      } catch (error) {
        console.warn(`Error persisting list data for key "${persistKey}":`, error);
      }
    }
  }, [persistKey]);

  // Agregar item
  const addItem = useCallback((item) => {
    setItems(prevItems => {
      let newItems = [...prevItems, item];
      
      // Aplicar límite máximo si está configurado
      if (maxItems && newItems.length > maxItems) {
        newItems = newItems.slice(-maxItems);
        notify(`Se mantienen solo los últimos ${maxItems} elementos`, 'info');
      }
      
      persistItems(newItems);
      
      if (onItemAdd) {
        onItemAdd(item, newItems);
      }
      
      return newItems;
    });
  }, [maxItems, persistItems, onItemAdd, notify]);

  // Remover item
  const removeItem = useCallback((key) => {
    setItems(prevItems => {
      const newItems = prevItems.filter((item, index) => {
        const itemKey = keyExtractor(item, index);
        return itemKey !== key;
      });
      
      persistItems(newItems);
      
      if (onItemRemove) {
        const removedItem = prevItems.find((item, index) => keyExtractor(item, index) === key);
        onItemRemove(removedItem, newItems);
      }
      
      return newItems;
    });
  }, [keyExtractor, persistItems, onItemRemove]);

  // Actualizar item
  const updateItem = useCallback((key, updater) => {
    setItems(prevItems => {
      const newItems = prevItems.map((item, index) => {
        const itemKey = keyExtractor(item, index);
        if (itemKey === key) {
          const updatedItem = typeof updater === 'function' ? updater(item) : updater;
          
          if (onItemUpdate) {
            onItemUpdate(updatedItem, item, newItems);
          }
          
          return updatedItem;
        }
        return item;
      });
      
      persistItems(newItems);
      return newItems;
    });
  }, [keyExtractor, persistItems, onItemUpdate]);

  // Limpiar lista
  const clearItems = useCallback(() => {
    setItems([]);
    if (persistKey && typeof window !== 'undefined') {
      localStorage.removeItem(persistKey);
    }
  }, [persistKey]);

  // Reordenar items
  const reorderItems = useCallback((fromIndex, toIndex) => {
    setItems(prevItems => {
      const newItems = [...prevItems];
      const [movedItem] = newItems.splice(fromIndex, 1);
      newItems.splice(toIndex, 0, movedItem);
      
      persistItems(newItems);
      return newItems;
    });
  }, [persistItems]);

  return {
    items,
    isLoading,
    addItem,
    removeItem,
    updateItem,
    clearItems,
    reorderItems,
    count: items.length,
    isEmpty: items.length === 0,
    isFull: maxItems ? items.length >= maxItems : false
  };
};

export default {
  useOptimizedState,
  useOptimizedForm,
  useOptimizedList
};