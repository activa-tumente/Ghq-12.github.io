import { useCallback } from 'react';
import { utils, writeFile } from 'xlsx';

const useDataExport = () => {
  const exportData = useCallback((format, data, filters, fileName = 'dashboard_data', headers) => {
    if (!data || data.length === 0) {
      alert('No hay datos para exportar.');
      return;
    }

    const activeFilters = Object.entries(filters)
      .filter(([, value]) => value !== 'all' && value !== '' && value.length > 0)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');

    const worksheetData = [
      ['Filtros Activos', activeFilters],
      [],
    ];

    const finalHeaders = headers || (data.length > 0 ? Object.keys(data[0]) : []);
    
    const worksheet = utils.json_to_sheet(data, { header: finalHeaders, skipHeader: true, origin: 'A4' });
    utils.sheet_add_aoa(worksheet, worksheetData, { origin: 'A1' });

    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Datos del Dashboard');

    const finalFileName = `${fileName}.${format}`;

    if (format === 'csv' || format === 'xlsx') {
      writeFile(workbook, finalFileName);
    } else if (format === 'json') {
      const jsonData = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = finalFileName;
      link.click();
      URL.revokeObjectURL(link.href);
    }
  }, []);

  return { exportData };
};

export default useDataExport;