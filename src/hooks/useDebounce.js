/**
 * Debounce Hook
 * Delays the execution of a value update until after a specified delay
 * Useful for search inputs, API calls, and performance optimization
 */

import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Basic debounce hook
 * @param {any} value - The value to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {any} - The debounced value
 */
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Advanced debounce hook with callback
 * @param {Function} callback - Function to call after debounce
 * @param {number} delay - Delay in milliseconds
 * @param {Array} deps - Dependencies array
 * @returns {Function} - Debounced callback function
 */
export const useDebouncedCallback = (callback, delay, deps = []) => {
  const timeoutRef = useRef(null)
  const callbackRef = useRef(callback)

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  const debouncedCallback = useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args)
    }, delay)
  }, [delay, ...deps])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Cancel function
  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  // Flush function (execute immediately)
  const flush = useCallback((...args) => {
    cancel()
    callbackRef.current(...args)
  }, [cancel])

  return [debouncedCallback, cancel, flush]
}

/**
 * Debounced search hook
 * Specifically designed for search functionality
 * @param {string} initialValue - Initial search value
 * @param {Function} onSearch - Search callback function
 * @param {number} delay - Debounce delay in milliseconds
 * @returns {Object} - Search state and handlers
 */
export const useDebouncedSearch = (initialValue = '', onSearch, delay = 300) => {
  const [searchTerm, setSearchTerm] = useState(initialValue)
  const [isSearching, setIsSearching] = useState(false)
  const debouncedSearchTerm = useDebounce(searchTerm, delay)
  const previousSearchTerm = useRef(initialValue)

  // Execute search when debounced term changes
  useEffect(() => {
    const executeSearch = async () => {
      // Don't search if term hasn't actually changed
      if (debouncedSearchTerm === previousSearchTerm.current) {
        return
      }

      previousSearchTerm.current = debouncedSearchTerm
      setIsSearching(true)

      try {
        await onSearch(debouncedSearchTerm)
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setIsSearching(false)
      }
    }

    if (onSearch && typeof onSearch === 'function') {
      executeSearch()
    }
  }, [debouncedSearchTerm, onSearch])

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchTerm('')
  }, [])

  // Set search term
  const updateSearchTerm = useCallback((value) => {
    setSearchTerm(value)
  }, [])

  return {
    searchTerm,
    debouncedSearchTerm,
    isSearching,
    setSearchTerm: updateSearchTerm,
    clearSearch
  }
}

/**
 * Debounced state hook
 * Combines useState with debouncing
 * @param {any} initialValue - Initial state value
 * @param {number} delay - Debounce delay in milliseconds
 * @returns {Array} - [debouncedValue, setValue, immediateValue]
 */
export const useDebouncedState = (initialValue, delay) => {
  const [immediateValue, setImmediateValue] = useState(initialValue)
  const debouncedValue = useDebounce(immediateValue, delay)

  return [debouncedValue, setImmediateValue, immediateValue]
}

/**
 * Throttle hook (alternative to debounce)
 * Limits the execution frequency of a function
 * @param {Function} callback - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} - Throttled function
 */
export const useThrottle = (callback, limit) => {
  const inThrottle = useRef(false)
  const lastFunc = useRef(null)
  const lastRan = useRef(null)

  const throttledCallback = useCallback((...args) => {
    if (!inThrottle.current) {
      callback(...args)
      lastRan.current = Date.now()
      inThrottle.current = true
    } else {
      clearTimeout(lastFunc.current)
      lastFunc.current = setTimeout(() => {
        if (Date.now() - lastRan.current >= limit) {
          callback(...args)
          lastRan.current = Date.now()
        }
      }, limit - (Date.now() - lastRan.current))
    }
  }, [callback, limit])

  useEffect(() => {
    return () => {
      clearTimeout(lastFunc.current)
    }
  }, [])

  return throttledCallback
}

export default useDebounce