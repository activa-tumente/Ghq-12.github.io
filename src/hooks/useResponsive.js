/**
 * Responsive Design Hook
 * Provides utilities for responsive behavior and mobile optimization
 */
import { useState, useEffect, useCallback, useMemo } from 'react';

// Breakpoint definitions (matching Tailwind CSS)
const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
};

// Device type detection
const getDeviceType = (width) => {
  if (width < BREAKPOINTS.sm) return 'mobile';
  if (width < BREAKPOINTS.lg) return 'tablet';
  return 'desktop';
};

// Orientation detection
const getOrientation = () => {
  if (typeof window === 'undefined') return 'landscape';
  return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
};

// Touch device detection
const isTouchDevice = () => {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

// Reduced motion preference
const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export const useResponsive = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  });

  const [orientation, setOrientation] = useState(getOrientation());
  const [isTouch, setIsTouch] = useState(isTouchDevice());
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion());

  // Update window size
  const updateSize = useCallback(() => {
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight
    });
    setOrientation(getOrientation());
  }, []);

  // Update motion preference
  const updateMotionPreference = useCallback((e) => {
    setReducedMotion(e.matches);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Set initial touch detection
    setIsTouch(isTouchDevice());

    // Window resize listener
    window.addEventListener('resize', updateSize);
    window.addEventListener('orientationchange', updateSize);

    // Motion preference listener
    const motionMediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    motionMediaQuery.addEventListener('change', updateMotionPreference);
    setReducedMotion(motionMediaQuery.matches);

    return () => {
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('orientationchange', updateSize);
      motionMediaQuery.removeEventListener('change', updateMotionPreference);
    };
  }, [updateSize, updateMotionPreference]);

  // Computed values
  const deviceType = useMemo(() => getDeviceType(windowSize.width), [windowSize.width]);
  
  const breakpoint = useMemo(() => {
    const width = windowSize.width;
    if (width >= BREAKPOINTS['2xl']) return '2xl';
    if (width >= BREAKPOINTS.xl) return 'xl';
    if (width >= BREAKPOINTS.lg) return 'lg';
    if (width >= BREAKPOINTS.md) return 'md';
    if (width >= BREAKPOINTS.sm) return 'sm';
    return 'xs';
  }, [windowSize.width]);

  // Responsive utilities
  const isBreakpoint = useCallback((bp) => {
    return windowSize.width >= BREAKPOINTS[bp];
  }, [windowSize.width]);

  const isBetweenBreakpoints = useCallback((min, max) => {
    return windowSize.width >= BREAKPOINTS[min] && windowSize.width < BREAKPOINTS[max];
  }, [windowSize.width]);

  // Device-specific checks
  const isMobile = deviceType === 'mobile';
  const isTablet = deviceType === 'tablet';
  const isDesktop = deviceType === 'desktop';
  const isMobileOrTablet = isMobile || isTablet;

  // Responsive grid columns calculator
  const getGridColumns = useCallback((config) => {
    const {
      xs = 1,
      sm = xs,
      md = sm,
      lg = md,
      xl = lg,
      '2xl': xxl = xl
    } = config;

    switch (breakpoint) {
      case '2xl': return xxl;
      case 'xl': return xl;
      case 'lg': return lg;
      case 'md': return md;
      case 'sm': return sm;
      default: return xs;
    }
  }, [breakpoint]);

  // Responsive spacing calculator
  const getSpacing = useCallback((config) => {
    if (typeof config === 'string' || typeof config === 'number') {
      return config;
    }

    const {
      xs = '1rem',
      sm = xs,
      md = sm,
      lg = md,
      xl = lg,
      '2xl': xxl = xl
    } = config;

    switch (breakpoint) {
      case '2xl': return xxl;
      case 'xl': return xl;
      case 'lg': return lg;
      case 'md': return md;
      case 'sm': return sm;
      default: return xs;
    }
  }, [breakpoint]);

  // Container max width calculator
  const getContainerMaxWidth = useCallback(() => {
    switch (breakpoint) {
      case '2xl': return '1536px';
      case 'xl': return '1280px';
      case 'lg': return '1024px';
      case 'md': return '768px';
      case 'sm': return '640px';
      default: return '100%';
    }
  }, [breakpoint]);

  // Responsive font size calculator
  const getFontSize = useCallback((config) => {
    if (typeof config === 'string') return config;

    const {
      xs = '0.875rem',
      sm = xs,
      md = sm,
      lg = md,
      xl = lg,
      '2xl': xxl = xl
    } = config;

    switch (breakpoint) {
      case '2xl': return xxl;
      case 'xl': return xl;
      case 'lg': return lg;
      case 'md': return md;
      case 'sm': return sm;
      default: return xs;
    }
  }, [breakpoint]);

  // Safe area utilities for mobile devices
  const getSafeAreaInsets = useCallback(() => {
    if (typeof window === 'undefined' || !isMobile) {
      return { top: 0, right: 0, bottom: 0, left: 0 };
    }

    const style = getComputedStyle(document.documentElement);
    return {
      top: parseInt(style.getPropertyValue('env(safe-area-inset-top)') || '0'),
      right: parseInt(style.getPropertyValue('env(safe-area-inset-right)') || '0'),
      bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
      left: parseInt(style.getPropertyValue('env(safe-area-inset-left)') || '0')
    };
  }, [isMobile]);

  // Responsive table configuration
  const getTableConfig = useCallback(() => {
    if (isMobile) {
      return {
        layout: 'stacked',
        showColumns: 2,
        enableHorizontalScroll: true,
        compactMode: true
      };
    }
    
    if (isTablet) {
      return {
        layout: 'grid',
        showColumns: 4,
        enableHorizontalScroll: true,
        compactMode: false
      };
    }

    return {
      layout: 'table',
      showColumns: 'all',
      enableHorizontalScroll: false,
      compactMode: false
    };
  }, [isMobile, isTablet]);

  // Chart responsive configuration
  const getChartConfig = useCallback(() => {
    const baseConfig = {
      responsive: true,
      maintainAspectRatio: false
    };

    if (isMobile) {
      return {
        ...baseConfig,
        height: 250,
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 12,
            fontSize: 10
          }
        },
        scales: {
          x: {
            ticks: {
              maxRotation: 45,
              fontSize: 10
            }
          },
          y: {
            ticks: {
              fontSize: 10
            }
          }
        }
      };
    }

    if (isTablet) {
      return {
        ...baseConfig,
        height: 300,
        legend: {
          position: 'top',
          labels: {
            boxWidth: 15,
            fontSize: 12
          }
        }
      };
    }

    return {
      ...baseConfig,
      height: 400,
      legend: {
        position: 'top',
        labels: {
          boxWidth: 20,
          fontSize: 14
        }
      }
    };
  }, [isMobile, isTablet]);

  // Navigation configuration
  const getNavigationConfig = useCallback(() => {
    if (isMobile) {
      return {
        type: 'bottom-tabs',
        collapsible: true,
        showLabels: false,
        maxItems: 5
      };
    }

    if (isTablet) {
      return {
        type: 'sidebar',
        collapsible: true,
        showLabels: true,
        maxItems: 8
      };
    }

    return {
      type: 'sidebar',
      collapsible: false,
      showLabels: true,
      maxItems: 'unlimited'
    };
  }, [isMobile, isTablet]);

  return {
    // Window dimensions
    windowSize,
    width: windowSize.width,
    height: windowSize.height,
    
    // Device information
    deviceType,
    breakpoint,
    orientation,
    isTouch,
    reducedMotion,
    
    // Device type checks
    isMobile,
    isTablet,
    isDesktop,
    isMobileOrTablet,
    
    // Breakpoint utilities
    isBreakpoint,
    isBetweenBreakpoints,
    
    // Responsive calculators
    getGridColumns,
    getSpacing,
    getContainerMaxWidth,
    getFontSize,
    getSafeAreaInsets,
    
    // Component configurations
    getTableConfig,
    getChartConfig,
    getNavigationConfig,
    
    // Constants
    BREAKPOINTS
  };
};

export default useResponsive;