// Patrón Strategy para validaciones

// Estrategias de validación base
class ValidationStrategy {
  validate(value, options = {}) {
    throw new Error('El método validate debe ser implementado');
  }

  getErrorMessage(field, options = {}) {
    return `Error de validación en ${field}`;
  }
}

// Estrategia para campos requeridos
class RequiredValidation extends ValidationStrategy {
  validate(value) {
    return value !== null && value !== undefined && value !== '';
  }

  getErrorMessage(field) {
    return `${field} es requerido`;
  }
}

// Estrategia para email
class EmailValidation extends ValidationStrategy {
  validate(value) {
    if (!value) return true; // Solo valida si hay valor
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }

  getErrorMessage(field) {
    return `${field} debe tener un formato de email válido`;
  }
}

// Estrategia para longitud mínima
class MinLengthValidation extends ValidationStrategy {
  validate(value, options = {}) {
    if (!value) return true;
    const { minLength = 1 } = options;
    return value.length >= minLength;
  }

  getErrorMessage(field, options = {}) {
    const { minLength = 1 } = options;
    return `${field} debe tener al menos ${minLength} caracteres`;
  }
}

// Estrategia para longitud máxima
class MaxLengthValidation extends ValidationStrategy {
  validate(value, options = {}) {
    if (!value) return true;
    const { maxLength = 255 } = options;
    return value.length <= maxLength;
  }

  getErrorMessage(field, options = {}) {
    const { maxLength = 255 } = options;
    return `${field} no puede exceder ${maxLength} caracteres`;
  }
}

// Estrategia para números
class NumberValidation extends ValidationStrategy {
  validate(value, options = {}) {
    if (!value) return true;
    const { min, max, integer = false } = options;
    
    const num = Number(value);
    if (isNaN(num)) return false;
    
    if (integer && !Number.isInteger(num)) return false;
    if (min !== undefined && num < min) return false;
    if (max !== undefined && num > max) return false;
    
    return true;
  }

  getErrorMessage(field, options = {}) {
    const { min, max, integer = false } = options;
    let message = `${field} debe ser un número`;
    
    if (integer) message += ' entero';
    if (min !== undefined && max !== undefined) {
      message += ` entre ${min} y ${max}`;
    } else if (min !== undefined) {
      message += ` mayor o igual a ${min}`;
    } else if (max !== undefined) {
      message += ` menor o igual a ${max}`;
    }
    
    return message;
  }
}

// Estrategia para fechas
class DateValidation extends ValidationStrategy {
  validate(value, options = {}) {
    if (!value) return true;
    
    const date = new Date(value);
    if (isNaN(date.getTime())) return false;
    
    const { minDate, maxDate } = options;
    
    if (minDate && date < new Date(minDate)) return false;
    if (maxDate && date > new Date(maxDate)) return false;
    
    return true;
  }

  getErrorMessage(field, options = {}) {
    const { minDate, maxDate } = options;
    let message = `${field} debe ser una fecha válida`;
    
    if (minDate && maxDate) {
      message += ` entre ${minDate} y ${maxDate}`;
    } else if (minDate) {
      message += ` posterior a ${minDate}`;
    } else if (maxDate) {
      message += ` anterior a ${maxDate}`;
    }
    
    return message;
  }
}

// Estrategia para patrones personalizados
class PatternValidation extends ValidationStrategy {
  validate(value, options = {}) {
    if (!value) return true;
    const { pattern } = options;
    if (!pattern) return true;
    
    const regex = new RegExp(pattern);
    return regex.test(value);
  }

  getErrorMessage(field, options = {}) {
    const { message } = options;
    return message || `${field} no cumple con el formato requerido`;
  }
}

// Estrategia para validación personalizada
class CustomValidation extends ValidationStrategy {
  constructor(validatorFn, errorMessage) {
    super();
    this.validatorFn = validatorFn;
    this.errorMessage = errorMessage;
  }

  validate(value, options = {}) {
    return this.validatorFn(value, options);
  }

  getErrorMessage(field) {
    return this.errorMessage || `Error de validación en ${field}`;
  }
}

// Factory para crear validadores
class ValidationFactory {
  static strategies = {
    required: RequiredValidation,
    email: EmailValidation,
    minLength: MinLengthValidation,
    maxLength: MaxLengthValidation,
    number: NumberValidation,
    date: DateValidation,
    pattern: PatternValidation
  };

  static createValidator(type, options = {}) {
    const StrategyClass = this.strategies[type];
    if (!StrategyClass) {
      throw new Error(`Tipo de validación no soportado: ${type}`);
    }
    return new StrategyClass();
  }

  static createCustomValidator(validatorFn, errorMessage) {
    return new CustomValidation(validatorFn, errorMessage);
  }
}

// Contexto de validación que maneja múltiples estrategias
class ValidationContext {
  constructor() {
    this.validators = [];
  }

  addValidator(type, options = {}) {
    const validator = ValidationFactory.createValidator(type, options);
    this.validators.push({ validator, options });
    return this;
  }

  addCustomValidator(validatorFn, errorMessage) {
    const validator = ValidationFactory.createCustomValidator(validatorFn, errorMessage);
    this.validators.push({ validator, options: {} });
    return this;
  }

  validate(value, field = 'Campo') {
    const errors = [];

    for (const { validator, options } of this.validators) {
      if (!validator.validate(value, options)) {
        errors.push(validator.getErrorMessage(field, options));
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validateAsync(value, field = 'Campo') {
    return Promise.resolve(this.validate(value, field));
  }
}

// Hook personalizado para usar validaciones
export const useValidation = () => {
  const createValidator = (field) => {
    return new ValidationContext();
  };

  const validateForm = (formData, validationRules) => {
    const errors = {};
    let isValid = true;

    for (const [field, rules] of Object.entries(validationRules)) {
      const validator = new ValidationContext();
      
      // Agregar reglas de validación
      rules.forEach(rule => {
        if (typeof rule === 'string') {
          validator.addValidator(rule);
        } else if (typeof rule === 'object') {
          const { type, ...options } = rule;
          validator.addValidator(type, options);
        } else if (typeof rule === 'function') {
          validator.addCustomValidator(rule, `Error en ${field}`);
        }
      });

      const result = validator.validate(formData[field], field);
      if (!result.isValid) {
        errors[field] = result.errors;
        isValid = false;
      }
    }

    return { isValid, errors };
  };

  return {
    createValidator,
    validateForm,
    ValidationContext,
    ValidationFactory
  };
};

// Validaciones predefinidas para el cuestionario
export const questionnaireValidations = {
  nombre: [
    'required',
    { type: 'minLength', minLength: 2 },
    { type: 'maxLength', maxLength: 50 }
  ],
  apellido: [
    'required',
    { type: 'minLength', minLength: 2 },
    { type: 'maxLength', maxLength: 50 }
  ],
  documento: [
    'required',
    { type: 'pattern', pattern: '^[0-9]{7,10}$', message: 'El documento debe tener entre 7 y 10 dígitos' }
  ],
  email: [
    'email',
    { type: 'maxLength', maxLength: 100 }
  ],
  telefono: [
    { type: 'pattern', pattern: '^[0-9+\-\s()]{10,15}$', message: 'Formato de teléfono inválido' }
  ],
  edad: [
    'required',
    { type: 'number', min: 18, max: 70, integer: true }
  ],
  area: ['required'],
  cargo: ['required'],
  turno: ['required'],
  genero: ['required']
};

export {
  ValidationStrategy,
  ValidationFactory,
  ValidationContext,
  RequiredValidation,
  EmailValidation,
  MinLengthValidation,
  MaxLengthValidation,
  NumberValidation,
  DateValidation,
  PatternValidation,
  CustomValidation
};

export default ValidationContext;