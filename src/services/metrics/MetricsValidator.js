/**
 * Validador para parámetros de métricas
 */
export class MetricsValidator {
  
  /**
   * Esquemas de validación para diferentes tipos de filtros
   */
  static schemas = {
    dashboardFilters: {
      departamento: { type: 'string', optional: true },
      turno: { type: 'string', optional: true },
      genero: { type: 'string', optional: true },
      fechaInicio: { type: 'date', optional: true },
      fechaFin: { type: 'date', optional: true }
    },
    userId: {
      type: 'string',
      pattern: /^[a-zA-Z0-9-_]+$/,
      minLength: 1
    }
  };

  /**
   * Valida filtros de dashboard con validación mejorada
   */
  static validateDashboardFilters(filters) {
    const errors = [];
    const validated = {};

    // Early return para casos edge
    if (!filters) {
      return { isValid: true, data: {}, errors: [] };
    }

    if (typeof filters !== 'object' || Array.isArray(filters)) {
      return { 
        isValid: false, 
        data: {}, 
        errors: ['Los filtros deben ser un objeto válido'] 
      };
    }

    // Validar cada campo
    Object.entries(this.schemas.dashboardFilters).forEach(([field, schema]) => {
      const value = filters[field];
      
      if (value === undefined || value === null) {
        if (!schema.optional) {
          errors.push(`${field} es requerido`);
        }
        return;
      }

      // Validar tipo
      if (schema.type === 'string' && typeof value !== 'string') {
        errors.push(`${field} debe ser una cadena de texto`);
        return;
      }

      if (schema.type === 'date') {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          errors.push(`${field} debe ser una fecha válida`);
          return;
        }
        validated[field] = date.toISOString().split('T')[0]; // YYYY-MM-DD
        return;
      }

      // Validar valores específicos
      if (field === 'departamento') {
        const validDepartments = ['todos', 'administracion', 'produccion', 'calidad', 'operaciones', 'mantenimiento', 'seguridad'];
        if (!validDepartments.includes(value)) {
          validated[field] = 'todos'; // Default seguro
        } else {
          validated[field] = value;
        }
      } else if (field === 'turno') {
        const validTurnos = ['todos', 'mañana', 'tarde', 'noche', 'rotativo'];
        if (!validTurnos.includes(value)) {
          validated[field] = 'todos';
        } else {
          validated[field] = value;
        }
      } else if (field === 'genero') {
        const validGeneros = ['todos', 'masculino', 'femenino', 'otro'];
        if (!validGeneros.includes(value)) {
          validated[field] = 'todos';
        } else {
          validated[field] = value;
        }
      } else {
        validated[field] = value;
      }
    });

    // Validar lógica de fechas
    if (validated.fechaInicio && validated.fechaFin) {
      if (new Date(validated.fechaInicio) > new Date(validated.fechaFin)) {
        errors.push('La fecha de inicio no puede ser posterior a la fecha de fin');
      }
    }

    return {
      isValid: errors.length === 0,
      data: validated,
      errors
    };
  }

  /**
   * Valida ID de usuario
   */
  static validateUserId(userId) {
    const schema = this.schemas.userId;
    
    if (!userId) {
      return { isValid: false, error: 'ID de usuario es requerido' };
    }

    if (typeof userId !== 'string') {
      return { isValid: false, error: 'ID de usuario debe ser una cadena de texto' };
    }

    if (userId.length < schema.minLength) {
      return { isValid: false, error: `ID de usuario debe tener al menos ${schema.minLength} caracteres` };
    }

    if (!schema.pattern.test(userId)) {
      return { isValid: false, error: 'ID de usuario contiene caracteres no válidos' };
    }

    return { isValid: true, data: userId };
  }

  /**
   * Sanitiza entrada de texto para prevenir inyecciones
   */
  static sanitizeString(input) {
    if (typeof input !== 'string') return '';
    
    return input
      .trim()
      .replace(/[<>\"']/g, '') // Remover caracteres peligrosos
      .substring(0, 100); // Limitar longitud
  }

  /**
   * Valida rango de fechas
   */
  static validateDateRange(startDate, endDate, maxRangeDays = 365) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return { isValid: false, error: 'Fechas no válidas' };
    }

    if (start > end) {
      return { isValid: false, error: 'Fecha de inicio posterior a fecha de fin' };
    }

    const diffDays = (end - start) / (1000 * 60 * 60 * 24);
    if (diffDays > maxRangeDays) {
      return { isValid: false, error: `Rango de fechas no puede exceder ${maxRangeDays} días` };
    }

    return { isValid: true, data: { startDate: start, endDate: end, rangeDays: diffDays } };
  }
}