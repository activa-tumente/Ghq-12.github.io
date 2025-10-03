import { memo } from 'react';
import { Gauge } from '@mui/x-charts/Gauge';

const Velocimetro = ({ valor, titulo, max }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center">
    <h3 className="text-lg font-semibold mb-2 text-center">{titulo}</h3>
    <Gauge
      value={valor}
      valueMin={0}
      valueMax={max}
      startAngle={-110}
      endAngle={110}
      sx={{
        width: '100%',
        height: '150px',
        '& .MuiGauge-valueText': {
          fontSize: '2rem',
          fontWeight: 'bold',
        },
        '& .MuiGauge-valueArc': {
          fill: valor <= max * 0.33 ? '#10B981' : valor <= max * 0.66 ? '#F59E0B' : '#EF4444',
        },
      }}
      text={({ value, valueMax }) => `${value.toFixed(2)} / ${valueMax}`}
    />
  </div>
);

export default memo(Velocimetro);