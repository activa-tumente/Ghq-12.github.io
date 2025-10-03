import { useState, useCallback } from 'react';

/**
 * Hook for managing pagination state and actions
 */
export const useResponsesPagination = (itemsPerPage = 20) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const updatePagination = useCallback((total) => {
    setTotalItems(total);
    setTotalPages(Math.ceil(total / itemsPerPage));
  }, [itemsPerPage]);

  const nextPage = useCallback(() => {
    setCurrentPage(prev => prev < totalPages - 1 ? prev + 1 : prev);
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setCurrentPage(prev => prev > 0 ? prev - 1 : prev);
  }, []);

  const goToPage = useCallback((page) => {
    if (page >= 0 && page < totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  const resetPagination = useCallback(() => {
    setCurrentPage(0);
  }, []);

  return {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    updatePagination,
    nextPage,
    prevPage,
    goToPage,
    resetPagination
  };
};