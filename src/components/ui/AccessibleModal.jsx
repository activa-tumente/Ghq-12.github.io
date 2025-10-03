import React, { useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

/**
 * Accessible Modal Component with focus trapping and ARIA support
 * 
 * Features:
 * - Focus trapping within modal
 * - Escape key to close
 * - Click outside to close (optional)
 * - Proper ARIA attributes
 * - Screen reader announcements
 * - Keyboard navigation
 */
const AccessibleModal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md', // 'sm', 'md', 'lg', 'xl', 'full'
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className = '',
  overlayClassName = '',
  contentClassName = '',
  initialFocusRef = null,
  finalFocusRef = null,
  ariaDescribedBy = null,
  role = 'dialog'
}) => {
  const modalRef = useRef(null);
  const overlayRef = useRef(null);
  const closeButtonRef = useRef(null);
  const previousActiveElement = useRef(null);
  const focusableElements = useRef([]);
  const firstFocusableElement = useRef(null);
  const lastFocusableElement = useRef(null);

  // Size classes mapping
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    full: 'max-w-full mx-4'
  };

  // Get all focusable elements within the modal
  const getFocusableElements = useCallback(() => {
    if (!modalRef.current) return [];
    
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');
    
    return Array.from(modalRef.current.querySelectorAll(focusableSelectors))
      .filter(element => {
        return element.offsetWidth > 0 && element.offsetHeight > 0 && 
               getComputedStyle(element).visibility !== 'hidden';
      });
  }, []);

  // Handle focus trapping
  const handleKeyDown = useCallback((event) => {
    if (!isOpen) return;

    // Close on Escape
    if (event.key === 'Escape' && closeOnEscape) {
      event.preventDefault();
      onClose();
      return;
    }

    // Handle Tab navigation for focus trapping
    if (event.key === 'Tab') {
      const focusableEls = getFocusableElements();
      
      if (focusableEls.length === 0) {
        event.preventDefault();
        return;
      }

      const firstEl = focusableEls[0];
      const lastEl = focusableEls[focusableEls.length - 1];

      if (event.shiftKey) {
        // Shift + Tab: moving backwards
        if (document.activeElement === firstEl) {
          event.preventDefault();
          lastEl.focus();
        }
      } else {
        // Tab: moving forwards
        if (document.activeElement === lastEl) {
          event.preventDefault();
          firstEl.focus();
        }
      }
    }
  }, [isOpen, closeOnEscape, onClose, getFocusableElements]);

  // Handle overlay click
  const handleOverlayClick = useCallback((event) => {
    if (closeOnOverlayClick && event.target === overlayRef.current) {
      onClose();
    }
  }, [closeOnOverlayClick, onClose]);

  // Setup and cleanup effects
  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element
      previousActiveElement.current = document.activeElement;
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      
      // Add event listeners
      document.addEventListener('keydown', handleKeyDown);
      
      // Focus management
      const focusTarget = initialFocusRef?.current || 
                         closeButtonRef.current || 
                         modalRef.current;
      
      if (focusTarget) {
        // Small delay to ensure modal is rendered
        setTimeout(() => {
          focusTarget.focus();
        }, 100);
      }
      
      // Announce modal opening to screen readers
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = `Modal abierto: ${title}`;
      document.body.appendChild(announcement);
      
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
      
    } else {
      // Restore body scroll
      document.body.style.overflow = '';
      
      // Remove event listeners
      document.removeEventListener('keydown', handleKeyDown);
      
      // Restore focus to previous element
      const focusTarget = finalFocusRef?.current || previousActiveElement.current;
      if (focusTarget && typeof focusTarget.focus === 'function') {
        focusTarget.focus();
      }
    }

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, title, handleKeyDown, initialFocusRef, finalFocusRef]);

  // Don't render if not open
  if (!isOpen) return null;

  const modalContent = (
    <div 
      ref={overlayRef}
      className={`
        fixed inset-0 z-50 flex items-center justify-center p-4
        bg-black bg-opacity-50 backdrop-blur-sm
        transition-opacity duration-200
        ${overlayClassName}
      `}
      onClick={handleOverlayClick}
      aria-hidden="false"
    >
      <div
        ref={modalRef}
        className={`
          relative w-full ${sizeClasses[size]} 
          bg-white rounded-lg shadow-xl
          transform transition-all duration-200
          max-h-[90vh] overflow-y-auto
          ${contentClassName}
          ${className}
        `}
        role={role}
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={ariaDescribedBy}
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 
            id="modal-title" 
            className="text-lg font-semibold text-gray-900"
          >
            {title}
          </h2>
          
          {showCloseButton && (
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="
                p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                transition-colors duration-200
              "
              aria-label="Cerrar modal"
              type="button"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          )}
        </div>
        
        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );

  // Render modal in portal
  return createPortal(modalContent, document.body);
};

// Hook for managing modal state
export const useModal = (initialState = false) => {
  const [isOpen, setIsOpen] = React.useState(initialState);
  
  const openModal = useCallback(() => setIsOpen(true), []);
  const closeModal = useCallback(() => setIsOpen(false), []);
  const toggleModal = useCallback(() => setIsOpen(prev => !prev), []);
  
  return {
    isOpen,
    openModal,
    closeModal,
    toggleModal
  };
};

export default AccessibleModal;