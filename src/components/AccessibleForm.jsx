import React, { forwardRef, useId, useState, useCallback } from 'react';
import { AlertCircle, Eye, EyeOff, Check, X } from 'lucide-react';

// Componente de input accesible
const AccessibleInput = forwardRef(({
  label,
  error,
  helperText,
  required = false,
  type = 'text',
  className = '',
  showPasswordToggle = false,
  validationRules = {},
  onValidation,
  ...props
}, ref) => {
  const id = useId();
  const [showPassword, setShowPassword] = useState(false);
  const [isValid, setIsValid] = useState(null);
  const [touched, setTouched] = useState(false);

  const inputType = type === 'password' && showPassword ? 'text' : type;

  // Validación en tiempo real
  const validateInput = useCallback((value) => {
    if (!validationRules || Object.keys(validationRules).length === 0) {
      return { isValid: true, errors: [] };
    }

    const errors = [];
    
    // Validación requerido
    if (validationRules.required && (!value || value.trim() === '')) {
      errors.push('Este campo es obligatorio');
    }

    // Validación longitud mínima
    if (validationRules.minLength && value && value.length < validationRules.minLength) {
      errors.push(`Debe tener al menos ${validationRules.minLength} caracteres`);
    }

    // Validación longitud máxima
    if (validationRules.maxLength && value && value.length > validationRules.maxLength) {
      errors.push(`No puede tener más de ${validationRules.maxLength} caracteres`);
    }

    // Validación email
    if (validationRules.email && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        errors.push('Debe ser un email válido');
      }
    }

    // Validación patrón personalizado
    if (validationRules.pattern && value) {
      const regex = new RegExp(validationRules.pattern);
      if (!regex.test(value)) {
        errors.push(validationRules.patternMessage || 'Formato inválido');
      }
    }

    const result = { isValid: errors.length === 0, errors };
    setIsValid(result.isValid);
    
    if (onValidation) {
      onValidation(result);
    }
    
    return result;
  }, [validationRules, onValidation]);

  const handleChange = useCallback((e) => {
    const value = e.target.value;
    if (touched) {
      validateInput(value);
    }
    if (props.onChange) {
      props.onChange(e);
    }
  }, [touched, validateInput, props]);

  const handleBlur = useCallback((e) => {
    setTouched(true);
    validateInput(e.target.value);
    if (props.onBlur) {
      props.onBlur(e);
    }
  }, [validateInput, props]);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const baseInputClasses = `
    w-full px-3 py-2 border rounded-md transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
    disabled:bg-gray-100 disabled:cursor-not-allowed
    ${error || (touched && isValid === false) ? 
      'border-red-300 bg-red-50 focus:ring-red-500' : 
      touched && isValid === true ?
        'border-green-300 bg-green-50 focus:ring-green-500' :
        'border-gray-300 hover:border-gray-400'
    }
    ${showPasswordToggle ? 'pr-10' : ''}
    ${className}
  `;

  return (
    <div className="space-y-1">
      {/* Label */}
      {label && (
        <label 
          htmlFor={id} 
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {required && (
            <span className="text-red-500 ml-1" aria-label="obligatorio">*</span>
          )}
        </label>
      )}

      {/* Input container */}
      <div className="relative">
        <input
          ref={ref}
          id={id}
          type={inputType}
          className={baseInputClasses}
          aria-invalid={error || (touched && isValid === false) ? 'true' : 'false'}
          aria-describedby={`${id}-helper ${id}-error`}
          aria-required={required}
          onChange={handleChange}
          onBlur={handleBlur}
          {...props}
        />

        {/* Password toggle */}
        {showPasswordToggle && type === 'password' && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700"
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}

        {/* Validation icon */}
        {touched && isValid !== null && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {isValid ? (
              <Check className="w-4 h-4 text-green-500" aria-hidden="true" />
            ) : (
              <X className="w-4 h-4 text-red-500" aria-hidden="true" />
            )}
          </div>
        )}
      </div>

      {/* Helper text */}
      {helperText && !error && (
        <p id={`${id}-helper`} className="text-xs text-gray-600">
          {helperText}
        </p>
      )}

      {/* Error message */}
      {(error || (touched && isValid === false)) && (
        <div id={`${id}-error`} className="flex items-center gap-1 text-xs text-red-600" role="alert">
          <AlertCircle className="w-3 h-3" aria-hidden="true" />
          <span>{error || 'Campo inválido'}</span>
        </div>
      )}
    </div>
  );
});

AccessibleInput.displayName = 'AccessibleInput';

// Componente de select accesible
const AccessibleSelect = forwardRef(({
  label,
  error,
  helperText,
  required = false,
  options = [],
  placeholder = 'Seleccionar...',
  className = '',
  ...props
}, ref) => {
  const id = useId();

  const selectClasses = `
    w-full px-3 py-2 border rounded-md transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
    disabled:bg-gray-100 disabled:cursor-not-allowed
    ${error ? 
      'border-red-300 bg-red-50 focus:ring-red-500' : 
      'border-gray-300 hover:border-gray-400'
    }
    ${className}
  `;

  return (
    <div className="space-y-1">
      {/* Label */}
      {label && (
        <label 
          htmlFor={id} 
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {required && (
            <span className="text-red-500 ml-1" aria-label="obligatorio">*</span>
          )}
        </label>
      )}

      {/* Select */}
      <select
        ref={ref}
        id={id}
        className={selectClasses}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={`${id}-helper ${id}-error`}
        aria-required={required}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option, index) => (
          <option key={index} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {/* Helper text */}
      {helperText && !error && (
        <p id={`${id}-helper`} className="text-xs text-gray-600">
          {helperText}
        </p>
      )}

      {/* Error message */}
      {error && (
        <div id={`${id}-error`} className="flex items-center gap-1 text-xs text-red-600" role="alert">
          <AlertCircle className="w-3 h-3" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
});

AccessibleSelect.displayName = 'AccessibleSelect';

// Componente de textarea accesible
const AccessibleTextarea = forwardRef(({
  label,
  error,
  helperText,
  required = false,
  rows = 4,
  maxLength,
  showCharCount = false,
  className = '',
  ...props
}, ref) => {
  const id = useId();
  const [charCount, setCharCount] = useState(0);

  const handleChange = useCallback((e) => {
    setCharCount(e.target.value.length);
    if (props.onChange) {
      props.onChange(e);
    }
  }, [props]);

  const textareaClasses = `
    w-full px-3 py-2 border rounded-md transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
    disabled:bg-gray-100 disabled:cursor-not-allowed resize-vertical
    ${error ? 
      'border-red-300 bg-red-50 focus:ring-red-500' : 
      'border-gray-300 hover:border-gray-400'
    }
    ${className}
  `;

  return (
    <div className="space-y-1">
      {/* Label */}
      {label && (
        <label 
          htmlFor={id} 
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {required && (
            <span className="text-red-500 ml-1" aria-label="obligatorio">*</span>
          )}
        </label>
      )}

      {/* Textarea */}
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        maxLength={maxLength}
        className={textareaClasses}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={`${id}-helper ${id}-error ${id}-count`}
        aria-required={required}
        onChange={handleChange}
        {...props}
      />

      {/* Character count */}
      {(showCharCount || maxLength) && (
        <div id={`${id}-count`} className="flex justify-end">
          <span className={`text-xs ${
            maxLength && charCount > maxLength * 0.9 ? 'text-orange-600' :
            maxLength && charCount === maxLength ? 'text-red-600' :
            'text-gray-500'
          }`}>
            {charCount}{maxLength && `/${maxLength}`}
          </span>
        </div>
      )}

      {/* Helper text */}
      {helperText && !error && (
        <p id={`${id}-helper`} className="text-xs text-gray-600">
          {helperText}
        </p>
      )}

      {/* Error message */}
      {error && (
        <div id={`${id}-error`} className="flex items-center gap-1 text-xs text-red-600" role="alert">
          <AlertCircle className="w-3 h-3" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
});

AccessibleTextarea.displayName = 'AccessibleTextarea';

// Componente de checkbox accesible
const AccessibleCheckbox = forwardRef(({
  label,
  error,
  helperText,
  required = false,
  className = '',
  ...props
}, ref) => {
  const id = useId();

  return (
    <div className="space-y-1">
      <div className="flex items-start gap-3">
        <input
          ref={ref}
          id={id}
          type="checkbox"
          className={`
            mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded
            focus:ring-2 focus:ring-blue-500 focus:ring-offset-0
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-red-300' : ''}
            ${className}
          `}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={`${id}-helper ${id}-error`}
          aria-required={required}
          {...props}
        />
        
        {label && (
          <label 
            htmlFor={id} 
            className="text-sm text-gray-700 cursor-pointer select-none"
          >
            {label}
            {required && (
              <span className="text-red-500 ml-1" aria-label="obligatorio">*</span>
            )}
          </label>
        )}
      </div>

      {/* Helper text */}
      {helperText && !error && (
        <p id={`${id}-helper`} className="text-xs text-gray-600 ml-7">
          {helperText}
        </p>
      )}

      {/* Error message */}
      {error && (
        <div id={`${id}-error`} className="flex items-center gap-1 text-xs text-red-600 ml-7" role="alert">
          <AlertCircle className="w-3 h-3" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
});

AccessibleCheckbox.displayName = 'AccessibleCheckbox';

// Componente de radio group accesible
const AccessibleRadioGroup = ({ 
  label, 
  options = [], 
  name, 
  value, 
  onChange, 
  error, 
  helperText, 
  required = false,
  className = '' 
}) => {
  const groupId = useId();

  return (
    <fieldset className={`space-y-2 ${className}`}>
      {label && (
        <legend className="text-sm font-medium text-gray-700">
          {label}
          {required && (
            <span className="text-red-500 ml-1" aria-label="obligatorio">*</span>
          )}
        </legend>
      )}
      
      <div className="space-y-2" role="radiogroup" aria-describedby={`${groupId}-helper ${groupId}-error`}>
        {options.map((option, index) => {
          const optionId = `${groupId}-${index}`;
          return (
            <div key={index} className="flex items-center gap-3">
              <input
                id={optionId}
                type="radio"
                name={name}
                value={option.value}
                checked={value === option.value}
                onChange={onChange}
                className={`
                  h-4 w-4 text-blue-600 border-gray-300
                  focus:ring-2 focus:ring-blue-500 focus:ring-offset-0
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${error ? 'border-red-300' : ''}
                `}
                aria-invalid={error ? 'true' : 'false'}
                required={required}
              />
              <label 
                htmlFor={optionId} 
                className="text-sm text-gray-700 cursor-pointer select-none"
              >
                {option.label}
              </label>
            </div>
          );
        })}
      </div>

      {/* Helper text */}
      {helperText && !error && (
        <p id={`${groupId}-helper`} className="text-xs text-gray-600">
          {helperText}
        </p>
      )}

      {/* Error message */}
      {error && (
        <div id={`${groupId}-error`} className="flex items-center gap-1 text-xs text-red-600" role="alert">
          <AlertCircle className="w-3 h-3" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
    </fieldset>
  );
};

AccessibleRadioGroup.displayName = 'AccessibleRadioGroup';

export {
  AccessibleInput,
  AccessibleSelect,
  AccessibleTextarea,
  AccessibleCheckbox,
  AccessibleRadioGroup
};

export default {
  Input: AccessibleInput,
  Select: AccessibleSelect,
  Textarea: AccessibleTextarea,
  Checkbox: AccessibleCheckbox,
  RadioGroup: AccessibleRadioGroup
};