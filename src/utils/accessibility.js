/**
 * Accessibility Utilities and Helpers
 * Provides comprehensive accessibility features and WCAG compliance tools
 */

/**
 * ARIA attributes and roles constants
 */
export const ARIA_ROLES = {
  // Landmark roles
  BANNER: 'banner',
  MAIN: 'main',
  NAVIGATION: 'navigation',
  COMPLEMENTARY: 'complementary',
  CONTENTINFO: 'contentinfo',
  SEARCH: 'search',
  FORM: 'form',
  REGION: 'region',
  
  // Widget roles
  BUTTON: 'button',
  CHECKBOX: 'checkbox',
  RADIO: 'radio',
  TEXTBOX: 'textbox',
  COMBOBOX: 'combobox',
  LISTBOX: 'listbox',
  OPTION: 'option',
  TAB: 'tab',
  TABPANEL: 'tabpanel',
  TABLIST: 'tablist',
  DIALOG: 'dialog',
  ALERTDIALOG: 'alertdialog',
  TOOLTIP: 'tooltip',
  MENU: 'menu',
  MENUITEM: 'menuitem',
  MENUBAR: 'menubar',
  
  // Document structure roles
  ARTICLE: 'article',
  SECTION: 'section',
  LIST: 'list',
  LISTITEM: 'listitem',
  TABLE: 'table',
  ROW: 'row',
  CELL: 'cell',
  COLUMNHEADER: 'columnheader',
  ROWHEADER: 'rowheader',
  
  // Live region roles
  ALERT: 'alert',
  LOG: 'log',
  STATUS: 'status',
  PROGRESSBAR: 'progressbar'
};

export const ARIA_STATES = {
  EXPANDED: 'aria-expanded',
  SELECTED: 'aria-selected',
  CHECKED: 'aria-checked',
  DISABLED: 'aria-disabled',
  HIDDEN: 'aria-hidden',
  PRESSED: 'aria-pressed',
  CURRENT: 'aria-current',
  INVALID: 'aria-invalid',
  REQUIRED: 'aria-required',
  READONLY: 'aria-readonly'
};

export const ARIA_PROPERTIES = {
  LABEL: 'aria-label',
  LABELLEDBY: 'aria-labelledby',
  DESCRIBEDBY: 'aria-describedby',
  CONTROLS: 'aria-controls',
  OWNS: 'aria-owns',
  ACTIVEDESCENDANT: 'aria-activedescendant',
  LIVE: 'aria-live',
  ATOMIC: 'aria-atomic',
  RELEVANT: 'aria-relevant',
  BUSY: 'aria-busy',
  DROPEFFECT: 'aria-dropeffect',
  GRABBED: 'aria-grabbed',
  HASPOPUP: 'aria-haspopup',
  LEVEL: 'aria-level',
  MULTILINE: 'aria-multiline',
  MULTISELECTABLE: 'aria-multiselectable',
  ORIENTATION: 'aria-orientation',
  PLACEHOLDER: 'aria-placeholder',
  POSINSET: 'aria-posinset',
  SETSIZE: 'aria-setsize',
  SORT: 'aria-sort',
  VALUEMAX: 'aria-valuemax',
  VALUEMIN: 'aria-valuemin',
  VALUENOW: 'aria-valuenow',
  VALUETEXT: 'aria-valuetext'
};

/**
 * Keyboard navigation constants
 */
export const KEYBOARD_KEYS = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
  DELETE: 'Delete',
  BACKSPACE: 'Backspace'
};

/**
 * Focus management utilities
 */
export class FocusManager {
  constructor() {
    this.focusStack = [];
    this.trapStack = [];
  }
  
  /**
   * Save current focus and set new focus
   */
  saveFocus(newFocusElement = null) {
    const currentFocus = document.activeElement;
    this.focusStack.push(currentFocus);
    
    if (newFocusElement) {
      this.setFocus(newFocusElement);
    }
    
    return currentFocus;
  }
  
  /**
   * Restore previously saved focus
   */
  restoreFocus() {
    const previousFocus = this.focusStack.pop();
    if (previousFocus && this.isFocusable(previousFocus)) {
      this.setFocus(previousFocus);
    }
    return previousFocus;
  }
  
  /**
   * Set focus to element with error handling
   */
  setFocus(element, options = {}) {
    if (!element || !this.isFocusable(element)) {
      return false;
    }
    
    try {
      element.focus(options);
      return true;
    } catch (error) {
      console.warn('Failed to set focus:', error);
      return false;
    }
  }
  
  /**
   * Check if element is focusable
   */
  isFocusable(element) {
    if (!element || element.disabled || element.hidden) {
      return false;
    }
    
    const tabIndex = element.tabIndex;
    if (tabIndex < 0) {
      return false;
    }
    
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') {
      return false;
    }
    
    return true;
  }
  
  /**
   * Get all focusable elements within a container
   */
  getFocusableElements(container = document) {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');
    
    const elements = Array.from(container.querySelectorAll(focusableSelectors));
    return elements.filter(el => this.isFocusable(el));
  }
  
  /**
   * Trap focus within a container
   */
  trapFocus(container) {
    const focusableElements = this.getFocusableElements(container);
    
    if (focusableElements.length === 0) {
      return null;
    }
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    const handleKeyDown = (event) => {
      if (event.key === KEYBOARD_KEYS.TAB) {
        if (event.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            event.preventDefault();
            this.setFocus(lastElement);
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            event.preventDefault();
            this.setFocus(firstElement);
          }
        }
      }
    };
    
    container.addEventListener('keydown', handleKeyDown);
    this.trapStack.push({ container, handleKeyDown });
    
    // Set initial focus
    this.setFocus(firstElement);
    
    return () => this.releaseFocusTrap();
  }
  
  /**
   * Release focus trap
   */
  releaseFocusTrap() {
    const trap = this.trapStack.pop();
    if (trap) {
      trap.container.removeEventListener('keydown', trap.handleKeyDown);
    }
  }
  
  /**
   * Move focus to next/previous element
   */
  moveFocus(direction = 'next', container = document) {
    const focusableElements = this.getFocusableElements(container);
    const currentIndex = focusableElements.indexOf(document.activeElement);
    
    let nextIndex;
    if (direction === 'next') {
      nextIndex = currentIndex + 1;
      if (nextIndex >= focusableElements.length) {
        nextIndex = 0;
      }
    } else {
      nextIndex = currentIndex - 1;
      if (nextIndex < 0) {
        nextIndex = focusableElements.length - 1;
      }
    }
    
    this.setFocus(focusableElements[nextIndex]);
  }
}

// Global focus manager instance
export const focusManager = new FocusManager();

/**
 * Screen reader utilities
 */
export class ScreenReaderUtils {
  constructor() {
    this.liveRegion = null;
    this.createLiveRegion();
  }
  
  /**
   * Create live region for announcements
   */
  createLiveRegion() {
    if (this.liveRegion) {
      return;
    }
    
    this.liveRegion = document.createElement('div');
    this.liveRegion.setAttribute('aria-live', 'polite');
    this.liveRegion.setAttribute('aria-atomic', 'true');
    this.liveRegion.style.position = 'absolute';
    this.liveRegion.style.left = '-10000px';
    this.liveRegion.style.width = '1px';
    this.liveRegion.style.height = '1px';
    this.liveRegion.style.overflow = 'hidden';
    
    document.body.appendChild(this.liveRegion);
  }
  
  /**
   * Announce message to screen readers
   */
  announce(message, priority = 'polite') {
    if (!this.liveRegion) {
      this.createLiveRegion();
    }
    
    this.liveRegion.setAttribute('aria-live', priority);
    this.liveRegion.textContent = message;
    
    // Clear after announcement
    setTimeout(() => {
      if (this.liveRegion) {
        this.liveRegion.textContent = '';
      }
    }, 1000);
  }
  
  /**
   * Announce urgent message
   */
  announceUrgent(message) {
    this.announce(message, 'assertive');
  }
  
  /**
   * Announce status change
   */
  announceStatus(message) {
    this.announce(message, 'status');
  }
}

// Global screen reader utils instance
export const screenReader = new ScreenReaderUtils();

/**
 * Keyboard navigation helpers
 */
export const keyboardNavigation = {
  /**
   * Handle arrow key navigation for lists
   */
  handleListNavigation(event, items, currentIndex, onSelect) {
    let newIndex = currentIndex;
    
    switch (event.key) {
      case KEYBOARD_KEYS.ARROW_DOWN:
        event.preventDefault();
        newIndex = currentIndex + 1;
        if (newIndex >= items.length) {
          newIndex = 0;
        }
        break;
        
      case KEYBOARD_KEYS.ARROW_UP:
        event.preventDefault();
        newIndex = currentIndex - 1;
        if (newIndex < 0) {
          newIndex = items.length - 1;
        }
        break;
        
      case KEYBOARD_KEYS.HOME:
        event.preventDefault();
        newIndex = 0;
        break;
        
      case KEYBOARD_KEYS.END:
        event.preventDefault();
        newIndex = items.length - 1;
        break;
        
      case KEYBOARD_KEYS.ENTER:
      case KEYBOARD_KEYS.SPACE:
        event.preventDefault();
        if (onSelect) {
          onSelect(items[currentIndex], currentIndex);
        }
        return currentIndex;
        
      default:
        return currentIndex;
    }
    
    return newIndex;
  },
  
  /**
   * Handle tab navigation for tab panels
   */
  handleTabNavigation(event, tabs, currentIndex, onTabChange) {
    let newIndex = currentIndex;
    
    switch (event.key) {
      case KEYBOARD_KEYS.ARROW_LEFT:
        event.preventDefault();
        newIndex = currentIndex - 1;
        if (newIndex < 0) {
          newIndex = tabs.length - 1;
        }
        break;
        
      case KEYBOARD_KEYS.ARROW_RIGHT:
        event.preventDefault();
        newIndex = currentIndex + 1;
        if (newIndex >= tabs.length) {
          newIndex = 0;
        }
        break;
        
      case KEYBOARD_KEYS.HOME:
        event.preventDefault();
        newIndex = 0;
        break;
        
      case KEYBOARD_KEYS.END:
        event.preventDefault();
        newIndex = tabs.length - 1;
        break;
        
      default:
        return currentIndex;
    }
    
    if (onTabChange) {
      onTabChange(newIndex);
    }
    
    return newIndex;
  },
  
  /**
   * Handle escape key for modals and dropdowns
   */
  handleEscapeKey(event, onEscape) {
    if (event.key === KEYBOARD_KEYS.ESCAPE) {
      event.preventDefault();
      event.stopPropagation();
      if (onEscape) {
        onEscape();
      }
    }
  }
};

/**
 * Color contrast utilities
 */
export const colorContrast = {
  /**
   * Calculate relative luminance
   */
  getLuminance(r, g, b) {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  },
  
  /**
   * Calculate contrast ratio between two colors
   */
  getContrastRatio(color1, color2) {
    const lum1 = this.getLuminance(...color1);
    const lum2 = this.getLuminance(...color2);
    
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    
    return (brightest + 0.05) / (darkest + 0.05);
  },
  
  /**
   * Check if contrast ratio meets WCAG standards
   */
  meetsWCAG(contrastRatio, level = 'AA', size = 'normal') {
    const requirements = {
      AA: {
        normal: 4.5,
        large: 3
      },
      AAA: {
        normal: 7,
        large: 4.5
      }
    };
    
    return contrastRatio >= requirements[level][size];
  },
  
  /**
   * Parse hex color to RGB
   */
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : null;
  }
};

/**
 * Accessibility testing utilities
 */
export const a11yTesting = {
  /**
   * Check for missing alt text on images
   */
  checkImageAltText(container = document) {
    const images = container.querySelectorAll('img');
    const issues = [];
    
    images.forEach((img, index) => {
      if (!img.alt && !img.getAttribute('aria-label') && !img.getAttribute('aria-labelledby')) {
        issues.push({
          element: img,
          issue: 'Missing alt text',
          severity: 'error',
          suggestion: 'Add alt attribute or aria-label'
        });
      }
    });
    
    return issues;
  },
  
  /**
   * Check for proper heading hierarchy
   */
  checkHeadingHierarchy(container = document) {
    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const issues = [];
    let previousLevel = 0;
    
    headings.forEach((heading, index) => {
      const currentLevel = parseInt(heading.tagName.charAt(1));
      
      if (index === 0 && currentLevel !== 1) {
        issues.push({
          element: heading,
          issue: 'First heading should be h1',
          severity: 'warning',
          suggestion: 'Use h1 for the main page heading'
        });
      }
      
      if (currentLevel > previousLevel + 1) {
        issues.push({
          element: heading,
          issue: `Heading level skipped from h${previousLevel} to h${currentLevel}`,
          severity: 'warning',
          suggestion: 'Use sequential heading levels'
        });
      }
      
      previousLevel = currentLevel;
    });
    
    return issues;
  },
  
  /**
   * Check for form labels
   */
  checkFormLabels(container = document) {
    const inputs = container.querySelectorAll('input, select, textarea');
    const issues = [];
    
    inputs.forEach(input => {
      const hasLabel = input.labels && input.labels.length > 0;
      const hasAriaLabel = input.getAttribute('aria-label');
      const hasAriaLabelledby = input.getAttribute('aria-labelledby');
      
      if (!hasLabel && !hasAriaLabel && !hasAriaLabelledby) {
        issues.push({
          element: input,
          issue: 'Form control missing label',
          severity: 'error',
          suggestion: 'Add label element or aria-label attribute'
        });
      }
    });
    
    return issues;
  },
  
  /**
   * Check for keyboard accessibility
   */
  checkKeyboardAccessibility(container = document) {
    const interactiveElements = container.querySelectorAll(
      'button, a, input, select, textarea, [tabindex], [role="button"], [role="link"]'
    );
    const issues = [];
    
    interactiveElements.forEach(element => {
      const tabIndex = element.tabIndex;
      const role = element.getAttribute('role');
      
      if (tabIndex === -1 && !element.disabled) {
        issues.push({
          element,
          issue: 'Interactive element not keyboard accessible',
          severity: 'error',
          suggestion: 'Remove tabindex="-1" or add keyboard event handlers'
        });
      }
      
      if ((role === 'button' || role === 'link') && element.tagName !== 'BUTTON' && element.tagName !== 'A') {
        const hasKeyboardHandler = element.onkeydown || element.onkeyup || element.onkeypress;
        if (!hasKeyboardHandler) {
          issues.push({
            element,
            issue: 'Custom interactive element missing keyboard handlers',
            severity: 'warning',
            suggestion: 'Add keyboard event handlers for Enter and Space keys'
          });
        }
      }
    });
    
    return issues;
  },
  
  /**
   * Run all accessibility checks
   */
  runAllChecks(container = document) {
    return {
      imageAltText: this.checkImageAltText(container),
      headingHierarchy: this.checkHeadingHierarchy(container),
      formLabels: this.checkFormLabels(container),
      keyboardAccessibility: this.checkKeyboardAccessibility(container)
    };
  }
};

/**
 * Utility functions for common accessibility patterns
 */
export const a11yUtils = {
  /**
   * Generate unique ID for accessibility
   */
  generateId(prefix = 'a11y') {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  },
  
  /**
   * Create accessible button props
   */
  createButtonProps({
    label,
    describedBy,
    pressed,
    expanded,
    controls,
    disabled = false
  }) {
    const props = {
      role: 'button',
      'aria-label': label,
      'aria-disabled': disabled,
      tabIndex: disabled ? -1 : 0
    };
    
    if (describedBy) props['aria-describedby'] = describedBy;
    if (pressed !== undefined) props['aria-pressed'] = pressed;
    if (expanded !== undefined) props['aria-expanded'] = expanded;
    if (controls) props['aria-controls'] = controls;
    
    return props;
  },
  
  /**
   * Create accessible form field props
   */
  createFormFieldProps({
    label,
    describedBy,
    required = false,
    invalid = false,
    readonly = false
  }) {
    const id = this.generateId('field');
    const labelId = this.generateId('label');
    
    return {
      field: {
        id,
        'aria-labelledby': labelId,
        'aria-describedby': describedBy,
        'aria-required': required,
        'aria-invalid': invalid,
        'aria-readonly': readonly
      },
      label: {
        id: labelId,
        htmlFor: id
      }
    };
  },
  
  /**
   * Create accessible modal props
   */
  createModalProps({ title, describedBy }) {
    const titleId = this.generateId('modal-title');
    
    return {
      modal: {
        role: 'dialog',
        'aria-modal': true,
        'aria-labelledby': titleId,
        'aria-describedby': describedBy
      },
      title: {
        id: titleId
      }
    };
  },
  
  /**
   * Create accessible list props
   */
  createListProps({ label, multiselectable = false }) {
    const listId = this.generateId('list');
    const labelId = this.generateId('list-label');
    
    return {
      list: {
        id: listId,
        role: 'listbox',
        'aria-labelledby': labelId,
        'aria-multiselectable': multiselectable
      },
      label: {
        id: labelId
      }
    };
  }
};

/**
 * React hooks for accessibility
 */
export const useA11y = {
  /**
   * Hook for managing focus trap
   */
  useFocusTrap: (isActive, containerRef) => {
    React.useEffect(() => {
      if (!isActive || !containerRef.current) {
        return;
      }
      
      const releaseTrap = focusManager.trapFocus(containerRef.current);
      
      return () => {
        if (releaseTrap) {
          releaseTrap();
        }
      };
    }, [isActive, containerRef]);
  },
  
  /**
   * Hook for managing announcements
   */
  useAnnouncement: () => {
    return React.useCallback((message, priority = 'polite') => {
      screenReader.announce(message, priority);
    }, []);
  },
  
  /**
   * Hook for keyboard navigation
   */
  useKeyboardNavigation: (items, onSelect) => {
    const [currentIndex, setCurrentIndex] = React.useState(0);
    
    const handleKeyDown = React.useCallback((event) => {
      const newIndex = keyboardNavigation.handleListNavigation(
        event,
        items,
        currentIndex,
        onSelect
      );
      setCurrentIndex(newIndex);
    }, [items, currentIndex, onSelect]);
    
    return {
      currentIndex,
      setCurrentIndex,
      handleKeyDown
    };
  }
};

export default {
  ARIA_ROLES,
  ARIA_STATES,
  ARIA_PROPERTIES,
  KEYBOARD_KEYS,
  focusManager,
  screenReader,
  keyboardNavigation,
  colorContrast,
  a11yTesting,
  a11yUtils,
  useA11y
};