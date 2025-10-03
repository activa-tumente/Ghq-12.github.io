import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * Accessible Dropdown Component with keyboard navigation and ARIA support
 * 
 * Features:
 * - Full keyboard navigation (Arrow keys, Enter, Escape, Home, End)
 * - Proper ARIA attributes and roles
 * - Screen reader support
 * - Focus management
 * - Type-ahead search
 * - Multi-select support (optional)
 */
const AccessibleDropdown = ({
  options = [],
  value = null,
  onChange,
  placeholder = 'Seleccionar opción',
  disabled = false,
  error = null,
  label = null,
  helperText = null,
  required = false,
  multiSelect = false,
  searchable = false,
  className = '',
  dropdownClassName = '',
  optionClassName = '',
  id = null,
  name = null,
  'aria-describedby': ariaDescribedBy = null
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeAheadBuffer, setTypeAheadBuffer] = useState('');
  
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);
  const listRef = useRef(null);
  const searchInputRef = useRef(null);
  const optionRefs = useRef([]);
  const typeAheadTimeoutRef = useRef(null);
  
  const dropdownId = id || `dropdown-${Math.random().toString(36).substr(2, 9)}`;
  const listboxId = `${dropdownId}-listbox`;
  const errorId = error ? `${dropdownId}-error` : null;
  const helperId = helperText ? `${dropdownId}-helper` : null;
  
  // Filter options based on search term
  const filteredOptions = searchable && searchTerm
    ? options.filter(option => 
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;
  
  // Get selected option(s) for display
  const getSelectedDisplay = () => {
    if (multiSelect) {
      if (!value || value.length === 0) return placeholder;
      if (value.length === 1) {
        const option = options.find(opt => opt.value === value[0]);
        return option ? option.label : placeholder;
      }
      return `${value.length} opciones seleccionadas`;
    } else {
      const option = options.find(opt => opt.value === value);
      return option ? option.label : placeholder;
    }
  };
  
  // Check if option is selected
  const isOptionSelected = (optionValue) => {
    if (multiSelect) {
      return value && value.includes(optionValue);
    }
    return value === optionValue;
  };
  
  // Handle option selection
  const handleOptionSelect = (optionValue) => {
    if (multiSelect) {
      const newValue = value || [];
      const isSelected = newValue.includes(optionValue);
      const updatedValue = isSelected
        ? newValue.filter(v => v !== optionValue)
        : [...newValue, optionValue];
      onChange(updatedValue);
    } else {
      onChange(optionValue);
      setIsOpen(false);
      triggerRef.current?.focus();
    }
  };
  
  // Handle keyboard navigation
  const handleKeyDown = useCallback((event) => {
    if (disabled) return;
    
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setFocusedIndex(0);
        } else if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
          handleOptionSelect(filteredOptions[focusedIndex].value);
        }
        break;
        
      case 'Escape':
        event.preventDefault();
        setIsOpen(false);
        setFocusedIndex(-1);
        triggerRef.current?.focus();
        break;
        
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setFocusedIndex(0);
        } else {
          setFocusedIndex(prev => 
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          );
        }
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setFocusedIndex(filteredOptions.length - 1);
        } else {
          setFocusedIndex(prev => 
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          );
        }
        break;
        
      case 'Home':
        if (isOpen) {
          event.preventDefault();
          setFocusedIndex(0);
        }
        break;
        
      case 'End':
        if (isOpen) {
          event.preventDefault();
          setFocusedIndex(filteredOptions.length - 1);
        }
        break;
        
      case 'Tab':
        if (isOpen) {
          setIsOpen(false);
          setFocusedIndex(-1);
        }
        break;
        
      default:
        // Type-ahead functionality
        if (isOpen && event.key.length === 1) {
          event.preventDefault();
          
          // Clear previous timeout
          if (typeAheadTimeoutRef.current) {
            clearTimeout(typeAheadTimeoutRef.current);
          }
          
          // Update buffer
          const newBuffer = typeAheadBuffer + event.key.toLowerCase();
          setTypeAheadBuffer(newBuffer);
          
          // Find matching option
          const matchingIndex = filteredOptions.findIndex(option =>
            option.label.toLowerCase().startsWith(newBuffer)
          );
          
          if (matchingIndex >= 0) {
            setFocusedIndex(matchingIndex);
          }
          
          // Clear buffer after delay
          typeAheadTimeoutRef.current = setTimeout(() => {
            setTypeAheadBuffer('');
          }, 1000);
        }
        break;
    }
  }, [disabled, isOpen, focusedIndex, filteredOptions, typeAheadBuffer, handleOptionSelect]);
  
  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);
  
  // Scroll focused option into view
  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && optionRefs.current[focusedIndex]) {
      optionRefs.current[focusedIndex].scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [focusedIndex, isOpen]);
  
  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, searchable]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typeAheadTimeoutRef.current) {
        clearTimeout(typeAheadTimeoutRef.current);
      }
    };
  }, []);
  
  const baseClasses = `
    relative w-full bg-white border rounded-lg shadow-sm
    transition-colors duration-200
    ${disabled 
      ? 'bg-gray-100 border-gray-200 cursor-not-allowed' 
      : error
        ? 'border-red-300 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500'
        : 'border-gray-300 hover:border-gray-400 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500'
    }
    ${className}
  `;
  
  const triggerClasses = `
    w-full px-3 py-2 text-left bg-transparent
    focus:outline-none
    ${disabled ? 'cursor-not-allowed text-gray-500' : 'cursor-pointer'}
    flex items-center justify-between
  `;
  
  const dropdownClasses = `
    absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg
    max-h-60 overflow-auto
    ${dropdownClassName}
  `;
  
  return (
    <div className="space-y-1">
      {/* Label */}
      {label && (
        <label 
          htmlFor={dropdownId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {required && (
            <span className="text-red-500 ml-1" aria-label="obligatorio">*</span>
          )}
        </label>
      )}
      
      {/* Dropdown */}
      <div ref={dropdownRef} className={baseClasses}>
        <button
          ref={triggerRef}
          id={dropdownId}
          name={name}
          type="button"
          className={triggerClasses}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-labelledby={label ? `${dropdownId}-label` : undefined}
          aria-describedby={[
            ariaDescribedBy,
            errorId,
            helperId
          ].filter(Boolean).join(' ') || undefined}
          aria-invalid={error ? 'true' : 'false'}
          aria-required={required}
        >
          <span className={value ? 'text-gray-900' : 'text-gray-500'}>
            {getSelectedDisplay()}
          </span>
          <ChevronDown 
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
              isOpen ? 'transform rotate-180' : ''
            }`}
            aria-hidden="true"
          />
        </button>
        
        {/* Dropdown Menu */}
        {isOpen && (
          <div className={dropdownClasses}>
            {/* Search Input */}
            {searchable && (
              <div className="p-2 border-b border-gray-200">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  aria-label="Buscar opciones"
                />
              </div>
            )}
            
            {/* Options List */}
            <ul
              ref={listRef}
              id={listboxId}
              role="listbox"
              aria-multiselectable={multiSelect}
              aria-label={label || 'Opciones disponibles'}
              className="py-1"
            >
              {filteredOptions.length === 0 ? (
                <li 
                  role="option"
                  aria-selected="false"
                  className="px-3 py-2 text-sm text-gray-500"
                >
                  No se encontraron opciones
                </li>
              ) : (
                filteredOptions.map((option, index) => {
                  const isSelected = isOptionSelected(option.value);
                  const isFocused = index === focusedIndex;
                  
                  return (
                    <li
                      key={option.value}
                      ref={el => optionRefs.current[index] = el}
                      role="option"
                      aria-selected={isSelected}
                      className={`
                        px-3 py-2 text-sm cursor-pointer flex items-center justify-between
                        transition-colors duration-150
                        ${isFocused 
                          ? 'bg-blue-100 text-blue-900' 
                          : isSelected
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-900 hover:bg-gray-100'
                        }
                        ${optionClassName}
                      `}
                      onClick={() => handleOptionSelect(option.value)}
                      onMouseEnter={() => setFocusedIndex(index)}
                    >
                      <span>{option.label}</span>
                      {isSelected && (
                        <Check 
                          className="w-4 h-4 text-blue-600" 
                          aria-hidden="true"
                        />
                      )}
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        )}
      </div>
      
      {/* Helper Text */}
      {helperText && !error && (
        <p id={helperId} className="text-xs text-gray-600">
          {helperText}
        </p>
      )}
      
      {/* Error Message */}
      {error && (
        <div id={errorId} className="flex items-center gap-1 text-xs text-red-600" role="alert">
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default AccessibleDropdown;