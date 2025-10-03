import React, { useEffect, useState, useMemo } from 'react';
import { AtRiskEmployeesService } from '../../../services/AtRiskEmployeesService';
import { CHART_COLORS, getColorWithOpacity } from '../../../utils/chartColors';

const LEVELS = [
  { key: 'muy_alto', label: 'Muy alto', color: CHART_COLORS.risk.veryHigh },
  { key: 'alto', label: 'Alto', color: CHART_COLORS.risk.high },
  { key: 'moderado', label: 'Moderado', color: CHART_COLORS.risk.moderate },
  { key: 'bajo', label: 'Bajo', color: CHART_COLORS.risk.low }
];

const AtRiskEmployees = ({ filters = {} }) => {
  const [data, setData] = useState({ muy_alto: [], alto: [], moderado: [], bajo: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeLevel, setActiveLevel] = useState('muy_alto');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await AtRiskEmployeesService.getEmployeesByRiskLevel(filters);
        if (mounted) setData(result);
      } catch (e) {
        if (mounted) setError(e.message || 'Error al cargar empleados');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [JSON.stringify(filters)]);

  const list = useMemo(() => data[activeLevel] || [], [data, activeLevel]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: getColorWithOpacity(CHART_COLORS.metrics.primary, 0.1) }}>
            <span className="text-xl">🧑‍💼</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Empleados por Nivel de Riesgo</h3>
            <p className="text-sm text-gray-600">Última respuesta por empleado</p>
          </div>
        </div>

        <div className="flex gap-2">
          {LEVELS.map(l => (
            <button
              key={l.key}
              onClick={() => setActiveLevel(l.key)}
              className={`px-3 py-1 rounded-full text-sm border ${activeLevel === l.key ? 'text-white' : 'text-gray-700'}`}
              style={{
                backgroundColor: activeLevel === l.key ? l.color : 'transparent',
                borderColor: activeLevel === l.key ? l.color : '#E5E7EB'
              }}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="text-center py-12 text-gray-500">Cargando...</div>
      )}
      {error && (
        <div className="text-center py-12 text-red-600">{error}</div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.length === 0 && (
            <div className="col-span-full text-center text-gray-500 py-10">Sin empleados en este nivel</div>
          )}
          {list.map((emp) => (
            <div key={`${activeLevel}-${emp.id}`} className="rounded-lg border p-4" style={{ borderColor: getColorWithOpacity(LEVELS.find(l=>l.key===activeLevel).color, 0.4) }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{emp.nombre}</p>
                  <p className="text-sm text-gray-600">{emp.cargo} — {emp.departamento}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">% Riesgo</p>
                  <p className="text-lg font-bold" style={{ color: LEVELS.find(l=>l.key===activeLevel).color }}>{emp.porcentaje}%</p>
                </div>
              </div>
              <div className="mt-3 text-sm text-gray-600">GHQ-12: <span className="font-semibold">{emp.puntaje}</span></div>
              <div className="mt-1 text-xs text-gray-400">Fecha: {new Date(emp.fecha).toLocaleString('es-ES')}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AtRiskEmployees;


