import { useState, useMemo, useCallback } from 'react';

/**
 * Custom hook para manejar filtros de usuarios
 * Separa la lógica de filtrado de la presentación
 */
export const useUserFilters = (usuarios = []) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterArea, setFilterArea] = useState('todas');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [filterGenero, setFilterGenero] = useState('todos');

  // Filtrar usuarios basado en los criterios actuales
  const filteredUsers = useMemo(() => {
    if (!usuarios.length) return [];

    return usuarios.filter(usuario => {
      const matchesSearch = 
        (usuario.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        usuario.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesArea = filterArea === 'todas' || usuario.area === filterArea;
      const matchesEstado = filterEstado === 'todos' || usuario.estadoEvaluacion === filterEstado;
      const matchesGenero = filterGenero === 'todos' || usuario.genero === filterGenero;

      return matchesSearch && matchesArea && matchesEstado && matchesGenero;
    });
  }, [usuarios, searchTerm, filterArea, filterEstado, filterGenero]);

  // Obtener valores únicos para los filtros
  const filterOptions = useMemo(() => {
    if (!usuarios.length) return { areas: [], generos: [] };
    
    const areas = [...new Set(usuarios.map(u => u.area))].filter(a => a && a !== 'Sin especificar');
    const generos = [...new Set(usuarios.map(u => u.genero))].filter(g => g && g !== 'Sin especificar');
    
    return { areas, generos };
  }, [usuarios]);

  // Funciones para actualizar filtros
  const updateSearchTerm = useCallback((term) => {
    setSearchTerm(term);
  }, []);

  const updateAreaFilter = useCallback((area) => {
    setFilterArea(area);
  }, []);

  const updateEstadoFilter = useCallback((estado) => {
    setFilterEstado(estado);
  }, []);

  const updateGeneroFilter = useCallback((genero) => {
    setFilterGenero(genero);
  }, []);

  // Limpiar todos los filtros
  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setFilterArea('todas');
    setFilterEstado('todos');
    setFilterGenero('todos');
  }, []);

  // Verificar si hay filtros activos
  const hasActiveFilters = useMemo(() => {
    return searchTerm !== '' || 
           filterArea !== 'todas' || 
           filterEstado !== 'todos' || 
           filterGenero !== 'todos';
  }, [searchTerm, filterArea, filterEstado, filterGenero]);

  return {
    // Estado de filtros
    searchTerm,
    filterArea,
    filterEstado,
    filterGenero,
    
    // Datos filtrados
    filteredUsers,
    filterOptions,
    
    // Funciones de actualización
    updateSearchTerm,
    updateAreaFilter,
    updateEstadoFilter,
    updateGeneroFilter,
    clearFilters,
    
    // Estado
    hasActiveFilters,
    totalFiltered: filteredUsers.length,
    totalOriginal: usuarios.length
  };
};

export default useUserFilters;