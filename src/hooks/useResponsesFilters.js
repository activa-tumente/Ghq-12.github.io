import { useState, useMemo } from 'react';

/**
 * Hook for managing response filters and search
 */
export const useResponsesFilters = (respuestas) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('todos');
  const [sortBy, setSortBy] = useState('fecha_desc');

  // Filtrar respuestas según criterios de búsqueda y filtros con memoización
  const respuestasFiltradas = useMemo(() => {
    return respuestas
      .filter(resp => {
        // Filtrar por término de búsqueda (optimizado)
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = !searchTerm || [
          resp.nombres,
          resp.apellidos,
          resp.email,
          resp.area
        ].some(field => field && field.toLowerCase().includes(searchLower));
        
        // Filtrar por nivel de salud (optimizado)
        let matchesLevel = filterLevel === 'todos';
        if (!matchesLevel) {
          matchesLevel = resp.nivel === filterLevel;
        }
        
        return matchesSearch && matchesLevel;
      })
      .sort((a, b) => {
        // Ordenar según criterio seleccionado
        switch (sortBy) {
          case 'fecha_asc':
            return new Date(a.fecha_completado || 0) - new Date(b.fecha_completado || 0);
          case 'fecha_desc':
            return new Date(b.fecha_completado || 0) - new Date(a.fecha_completado || 0);
          case 'nombre_asc':
            return (a.nombres || '').localeCompare(b.nombres || '');
          case 'nombre_desc':
            return (b.nombres || '').localeCompare(a.nombres || '');
          case 'nivel_asc':
            return (a.puntuacionTotal || 0) - (b.puntuacionTotal || 0);
          case 'nivel_desc':
            return (b.puntuacionTotal || 0) - (a.puntuacionTotal || 0);
          default:
            return 0;
        }
      });
  }, [respuestas, searchTerm, filterLevel, sortBy]);

  return {
    searchTerm,
    setSearchTerm,
    filterLevel,
    setFilterLevel,
    sortBy,
    setSortBy,
    respuestasFiltradas
  };
};