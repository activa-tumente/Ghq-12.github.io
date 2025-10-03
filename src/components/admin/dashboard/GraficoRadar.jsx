import { memo } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

const GraficoRadar = ({ datos, titulo }) => {
  const dataForChart = Object.values(datos).map(categoria => ({
    subject: categoria.nombre,
    A: categoria.promedio,
    fullMark: 3,
  }));

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold mb-4">{titulo}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={dataForChart}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" />
          <PolarRadiusAxis angle={30} domain={[0, 3]} />
          <Radar
            name="Promedio"
            dataKey="A"
            stroke="#3B82F6"
            fill="#3B82F6"
            fillOpacity={0.6}
          />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default memo(GraficoRadar);