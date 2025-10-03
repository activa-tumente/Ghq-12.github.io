import { useEffect, useCallback, useRef } from 'react';

/**
 * Hook para manejar la navegación por teclado en cuestionarios
 * Proporciona navegación con flechas, tab, y manejo de foco
 */
export const useKeyboardNavigation = ({
  items = [],
  onSelect,
  onNext,
  onPrevious,
  enabled = true,
  containerRef,
  focusOnMount = false,
  orientation = 'vertical' // 'vertical' | 'horizontal' | 'both'
}) => {
  const currentIndexRef = useRef(-1);
  const itemRefs = useRef([]);

  // Inicializar refs para los elementos
  const setItemRef = useCallback((index) => (el) => {
    if (el) {
      itemRefs.current[index] = el;
    }
  }, []);

  // Enfocar un elemento específico
  const focusItem = useCallback((index) => {
    if (index >= 0 && index < items.length && itemRefs.current[index]) {
      currentIndexRef.current = index;
      itemRefs.current[index].focus();
      
      // Scroll al elemento si está fuera de vista
      itemRefs.current[index].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest'
      });
    }
  }, [items.length]);

  // Navegar al siguiente elemento
  const navigateNext = useCallback(() => {
    const nextIndex = Math.min(currentIndexRef.current + 1, items.length - 1);
    if (nextIndex !== currentIndexRef.current) {
      focusItem(nextIndex);
    } else if (onNext) {
      onNext();
    }
  }, [items.length, focusItem, onNext]);

  // Navegar al elemento anterior
  const navigatePrevious = useCallback(() => {
    const prevIndex = Math.max(currentIndexRef.current - 1, 0);
    if (prevIndex !== currentIndexRef.current) {
      focusItem(prevIndex);
    } else if (onPrevious) {
      onPrevious();
    }
  }, [focusItem, onPrevious]);

  // Navegar al primer elemento
  const navigateFirst = useCallback(() => {
    focusItem(0);
  }, [focusItem]);

  // Navegar al último elemento
  const navigateLast = useCallback(() => {
    focusItem(items.length - 1);
  }, [items.length, focusItem]);

  // Seleccionar elemento actual
  const selectCurrent = useCallback(() => {
    if (currentIndexRef.current >= 0 && onSelect) {
      onSelect(currentIndexRef.current, items[currentIndexRef.current]);
    }
  }, [items, onSelect]);

  // Manejador de eventos de teclado
  const handleKeyDown = useCallback((event) => {
    if (!enabled) return;

    const { key, ctrlKey, metaKey, shiftKey } = event;
    let handled = false;

    switch (key) {
      case 'ArrowDown':
        if (orientation === 'vertical' || orientation === 'both') {
          event.preventDefault();
          navigateNext();
          handled = true;
        }
        break;

      case 'ArrowUp':
        if (orientation === 'vertical' || orientation === 'both') {
          event.preventDefault();
          navigatePrevious();
          handled = true;
        }
        break;

      case 'ArrowRight':
        if (orientation === 'horizontal' || orientation === 'both') {
          event.preventDefault();
          navigateNext();
          handled = true;
        }
        break;

      case 'ArrowLeft':
        if (orientation === 'horizontal' || orientation === 'both') {
          event.preventDefault();
          navigatePrevious();
          handled = true;
        }
        break;

      case 'Home':
        if (ctrlKey || metaKey) {
          event.preventDefault();
          navigateFirst();
          handled = true;
        }
        break;

      case 'End':
        if (ctrlKey || metaKey) {
          event.preventDefault();
          navigateLast();
          handled = true;
        }
        break;

      case 'Enter':
      case ' ': // Spacebar
        event.preventDefault();
        selectCurrent();
        handled = true;
        break;

      case 'Tab':
        // Permitir navegación normal con Tab, pero actualizar índice actual
        if (!shiftKey && currentIndexRef.current < items.length - 1) {
          currentIndexRef.current++;
        } else if (shiftKey && currentIndexRef.current > 0) {
          currentIndexRef.current--;
        }
        break;

      case 'Escape':
        // Salir del modo de navegación
        if (containerRef?.current) {
          containerRef.current.blur();
          currentIndexRef.current = -1;
        }
        handled = true;
        break;

      default:
        break;
    }

    return handled;
  }, [enabled, orientation, navigateNext, navigatePrevious, navigateFirst, navigateLast, selectCurrent, items.length, containerRef]);

  // Configurar event listeners
  useEffect(() => {
    const container = containerRef?.current;
    if (!container || !enabled) return;

    container.addEventListener('keydown', handleKeyDown);
    
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled, containerRef]);

  // Enfocar al montar si está habilitado
  useEffect(() => {
    if (focusOnMount && items.length > 0) {
      focusItem(0);
    }
  }, [focusOnMount, items.length, focusItem]);

  // Resetear índice cuando cambian los elementos
  useEffect(() => {
    currentIndexRef.current = -1;
    itemRefs.current = itemRefs.current.slice(0, items.length);
  }, [items.length]);

  return {
    // Refs y funciones para los elementos
    setItemRef,
    focusItem,
    
    // Funciones de navegación
    navigateNext,
    navigatePrevious,
    navigateFirst,
    navigateLast,
    selectCurrent,
    
    // Estado actual
    currentIndex: currentIndexRef.current,
    
    // Manejador de eventos (para uso manual)
    handleKeyDown
  };
};

/**
 * Hook específico para navegación en cuestionarios
 * Maneja la navegación entre preguntas y opciones de respuesta
 */
export const useQuestionnaireNavigation = ({
  questions = [],
  currentQuestionIndex = 0,
  onQuestionChange,
  onAnswerSelect,
  enabled = true
}) => {
  const questionContainerRef = useRef(null);
  const answerContainerRef = useRef(null);
  const currentQuestion = questions[currentQuestionIndex];
  const answers = currentQuestion?.answers || [];

  // Navegación entre preguntas
  const questionNavigation = useKeyboardNavigation({
    items: questions,
    onSelect: (index) => onQuestionChange?.(index),
    enabled,
    containerRef: questionContainerRef,
    orientation: 'vertical'
  });

  // Navegación entre respuestas
  const answerNavigation = useKeyboardNavigation({
    items: answers,
    onSelect: (index, answer) => onAnswerSelect?.(currentQuestionIndex, index, answer),
    enabled,
    containerRef: answerContainerRef,
    orientation: 'vertical'
  });

  // Navegación global del cuestionario
  const handleGlobalKeyDown = useCallback((event) => {
    if (!enabled) return;

    const { key, ctrlKey, metaKey } = event;

    // Navegación rápida entre grupos de preguntas
    if (ctrlKey || metaKey) {
      switch (key) {
        case 'ArrowLeft':
          if (currentQuestionIndex > 0) {
            event.preventDefault();
            onQuestionChange?.(currentQuestionIndex - 1);
          }
          break;

        case 'ArrowRight':
          if (currentQuestionIndex < questions.length - 1) {
            event.preventDefault();
            onQuestionChange?.(currentQuestionIndex + 1);
          }
          break;

        default:
          break;
      }
    }
  }, [enabled, currentQuestionIndex, questions.length, onQuestionChange]);

  // Configurar navegación global
  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleGlobalKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [handleGlobalKeyDown, enabled]);

  return {
    questionContainerRef,
    answerContainerRef,
    questionNavigation,
    answerNavigation,
    handleGlobalKeyDown
  };
};

export default useKeyboardNavigation;