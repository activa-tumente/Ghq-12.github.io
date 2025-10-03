/**
 * Custom hook for managing responses data
 * Provides optimized data loading, caching, and state management
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { dbHelpers } from '../api/supabase'
import { calculateHealthLevel } from '../config/healthLevels'

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const AUTO_REFRESH_INTERVAL = 30 * 1000 // 30 seconds

export const useResponsesData = (options = {}) => {
  const {
    autoRefresh = true,
    cacheEnabled = true,
    refreshInterval = AUTO_REFRESH_INTERVAL
  } = options

  const [state, setState] = useState({
    data: [],
    loading: true,
    error: null,
    lastUpdate: null,
    isRefreshing: false
  })

  const cacheRef = useRef(new Map())
  const intervalRef = useRef(null)
  const abortControllerRef = useRef(null)

  /**
   * Check if cached data is still valid
   */
  const isCacheValid = useCallback((timestamp) => {
    if (!cacheEnabled || !timestamp) return false
    return Date.now() - timestamp < CACHE_DURATION
  }, [cacheEnabled])

  /**
   * Process raw usuario data into formatted response objects
   */
  const processUsuarioData = useCallback(async (usuarios) => {
    const processedData = await Promise.all(
      usuarios.map(async (usuario) => {
        try {
          // Check cache first
          const cacheKey = `responses_${usuario.id}`
          const cached = cacheRef.current.get(cacheKey)
          
          let respuestasUsuario
          if (cached && isCacheValid(cached.timestamp)) {
            respuestasUsuario = cached.data
          } else {
            const { data, error } = await dbHelpers.getRespuestasByUsuario(usuario.id)
            if (error) {
              console.warn(`Error loading responses for user ${usuario.id}:`, error)
              respuestasUsuario = []
            } else {
              respuestasUsuario = data || []
              // Cache the result
              if (cacheEnabled) {
                cacheRef.current.set(cacheKey, {
                  data: respuestasUsuario,
                  timestamp: Date.now()
                })
              }
            }
          }

          const evaluation = calculateHealthLevel(respuestasUsuario)

          return {
            id: usuario.id,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            email: usuario.email,
            area_macro: usuario.area_macro || 'No especificada',
            departamento: usuario.departamento || 'No especificado',
            fecha_creacion: usuario.fecha_creacion || usuario.created_at,
            activo: usuario.activo,
            respuestas: respuestasUsuario,
            nivel: evaluation.nivel,
            puntuacionTotal: evaluation.puntuacion,
            totalRespuestas: respuestasUsuario.length
          }
        } catch (error) {
          console.error(`Error processing user ${usuario.id}:`, error)
          return null
        }
      })
    )

    return processedData.filter(item => item !== null)
  }, [isCacheValid, cacheEnabled])

  /**
   * Load responses data from the database
   */
  const loadData = useCallback(async (forceRefresh = false) => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController()

    try {
      setState(prev => ({
        ...prev,
        loading: !prev.data.length, // Don't show loading if we have data
        isRefreshing: !!prev.data.length, // Show refreshing if we have data
        error: null
      }))

      // Check if we should use cached data
      if (!forceRefresh && state.data.length > 0 && isCacheValid(state.lastUpdate?.getTime())) {
        setState(prev => ({ ...prev, loading: false, isRefreshing: false }))
        return
      }

      const { data: usuarios, error: usuariosError } = await dbHelpers.getUsuarios()

      if (usuariosError) {
        // Handle case when tables don't exist (no data scenario)
        const errorMessage = usuariosError.message || String(usuariosError);
        if (errorMessage.includes('Could not find the table')) {
          console.log('⚠️ Tabla de usuarios no encontrada, mostrando datos vacíos');
          setState(prev => ({
            ...prev,
            data: [],
            loading: false,
            isRefreshing: false,
            error: null,
            lastUpdate: new Date()
          }));
          return;
        }
        throw new Error(`Error loading usuarios: ${errorMessage}`)
      }

      const processedData = await processUsuarioData(usuarios || [])

      setState(prev => ({
        ...prev,
        data: processedData,
        loading: false,
        isRefreshing: false,
        error: null,
        lastUpdate: new Date()
      }))

    } catch (error) {
      if (error.name === 'AbortError') {
        return // Request was cancelled
      }

      console.error('Error loading responses:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        isRefreshing: false,
        error: error.message
      }))
    }
  }, [state.data.length, state.lastUpdate, isCacheValid, processUsuarioData])

  /**
   * Refresh data manually
   */
  const refresh = useCallback(() => {
    loadData(true)
  }, [loadData])

  /**
   * Clear cache
   */
  const clearCache = useCallback(() => {
    cacheRef.current.clear()
  }, [])

  /**
   * Update a specific user's data in the cache and state
   */
  const updateUsuarioData = useCallback((usuarioId, updatedData) => {
    setState(prev => ({
      ...prev,
      data: prev.data.map(usuario => 
        usuario.id === usuarioId 
          ? { ...usuario, ...updatedData }
          : usuario
      )
    }))

    // Update cache
    if (cacheEnabled && updatedData.respuestas) {
      const cacheKey = `responses_${usuarioId}`
      cacheRef.current.set(cacheKey, {
        data: updatedData.respuestas,
        timestamp: Date.now()
      })
    }
  }, [cacheEnabled])

  // Initial load
  useEffect(() => {
    loadData()
  }, []) // Only run on mount

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh) return

    intervalRef.current = setInterval(() => {
      // Only refresh if data is stale
      const isStale = state.lastUpdate && 
        (Date.now() - state.lastUpdate.getTime()) > refreshInterval
      
      if (isStale && !state.loading && !state.isRefreshing) {
        loadData(false) // Don't force refresh, use cache if valid
      }
    }, refreshInterval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [autoRefresh, refreshInterval, state.lastUpdate, state.loading, state.isRefreshing, loadData])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    isRefreshing: state.isRefreshing,
    lastUpdate: state.lastUpdate,
    refresh,
    clearCache,
    updateUsuarioData
  }
}

export default useResponsesData