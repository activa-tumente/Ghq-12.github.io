/**
 * Utilidades comunes para cálculos de métricas
 */

/**
 * Calcula estadísticas básicas de un array de números
 */
export const calculateBasicStats = (numbers) => {
  if (!numbers || numbers.length === 0) {
    return { sum: 0, average: 0, min: 0, max: 0, count: 0 };
  }

  const validNumbers = numbers.filter(n => typeof n === 'number' && !isNaN(n));
  
  if (validNumbers.length === 0) {
    return { sum: 0, average: 0, min: 0, max: 0, count: 0 };
  }

  const sum = validNumbers.reduce((acc, num) => acc + num, 0);
  const average = sum / validNumbers.length;
  const min = Math.min(...validNumbers);
  const max = Math.max(...validNumbers);

  return {
    sum: parseFloat(sum.toFixed(2)),
    average: parseFloat(average.toFixed(2)),
    min,
    max,
    count: validNumbers.length
  };
};

/**
 * Agrupa datos por un campo específico
 */
export const groupBy = (array, keyFn) => {
  return array.reduce((groups, item) => {
    const key = typeof keyFn === 'function' ? keyFn(item) : item[keyFn];
    const group = groups[key] || [];
    group.push(item);
    groups[key] = group;
    return groups;
  }, {});
};

/**
 * Calcula porcentajes de distribución
 */
export const calculateDistribution = (groups) => {
  const total = Object.values(groups).reduce((sum, group) => sum + group.length, 0);
  
  if (total === 0) return {};

  return Object.entries(groups).reduce((distribution, [key, group]) => {
    distribution[key] = {
      count: group.length,
      percentage: parseFloat(((group.length / total) * 100).toFixed(1))
    };
    return distribution;
  }, {});
};

/**
 * Filtra datos por rango de fechas de manera eficiente
 */
export const filterByDateRange = (data, startDate, endDate, dateField = 'created_at') => {
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  return data.filter(item => {
    const itemDate = new Date(item[dateField]);
    
    if (start && itemDate < start) return false;
    if (end && itemDate > end) return false;
    
    return true;
  });
};