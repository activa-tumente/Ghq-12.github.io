import { memo } from 'react';

const RankingHorizontal = ({ datos, titulo, tipo }) => {
  const dataToShow = tipo === 'fortalezas' ? datos.fortalezas : datos.oportunidades;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold mb-4">{titulo}</h3>
      <div className="space-y-4">
        {dataToShow.map((item, index) => (
          <div key={index} className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600 mr-4">
              {index + 1}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">{item.pregunta}</p>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                <div
                  className={`h-2.5 rounded-full ${tipo === 'fortalezas' ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ width: `${(item.promedio / 3) * 100}%` }}
                ></div>
              </div>
            </div>
            <div className="ml-4 text-sm font-bold text-gray-800">
              {item.promedio.toFixed(2)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default memo(RankingHorizontal);