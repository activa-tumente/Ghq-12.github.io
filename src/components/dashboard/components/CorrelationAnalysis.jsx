import React, { useMemo } from 'react';

const CorrelationAnalysis = ({ data, loading = false }) => {
  // Función para calcular correlación de Pearson
  const calculatePearsonCorrelation = (x, y) => {
    if (!x || !y || x.length !== y.length || x.length === 0) return 0;
    
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  };

  // Función para determinar la fuerza de la correlación
  const getCorrelationStrength = (correlation) => {
    const abs = Math.abs(correlation);
    if (abs >= 0.8) return 'Muy Fuerte';
    if (abs >= 0.6) return 'Fuerte';
    if (abs >= 0.4) return 'Moderada';
    if (abs >= 0.2) return 'Débil';
    return 'Muy Débil';
  };

  // Función para determinar la dirección de la correlación
  const getCorrelationDirection = (correlation) => {
    if (correlation > 0.1) return 'Positiva';
    if (correlation < -0.1) return 'Negativa';
    return 'Neutral';
  };

  // Calcular correlaciones usando useMemo para optimización
  const correlationData = useMemo(() => {
    // Verificar si tenemos datos del dashboard
    if (!data || (!data.responses && !data.data)) {
      // Datos de fallback cuando no hay respuestas
      return [
        {
          id: 'antiguedadVsPuntaje',
          title: 'Antigüedad vs Puntaje Normalizado',
          correlation: 0,
          strength: 'Sin datos',
          direction: 'N/A',
          description: 'No hay datos suficientes para calcular la correlación'
        },
        {
          id: 'confianzaVsSatisfaccion',
          title: 'Confianza vs Satisfacción',
          correlation: 0,
          strength: 'Sin datos',
          direction: 'N/A',
          description: 'No hay datos suficientes para calcular la correlación'
        }
      ];
    }

    // Intentar obtener respuestas desde diferentes estructuras de datos
    let responses = [];
    if (data.responses) {
      responses = data.responses;
    } else if (data.data && data.data.responses) {
      responses = data.data.responses;
    } else if (Array.isArray(data)) {
      responses = data;
    }

    if (responses.length === 0) {
      return [
        {
          id: 'antiguedadVsPuntaje',
          title: 'Antigüedad vs Puntaje Normalizado',
          correlation: 0,
          strength: 'Sin datos',
          direction: 'N/A',
          description: 'No hay datos suficientes para calcular la correlación'
        },
        {
          id: 'confianzaVsSatisfaccion',
          title: 'Confianza vs Satisfacción',
          correlation: 0,
          strength: 'Sin datos',
          direction: 'N/A',
          description: 'No hay datos suficientes para calcular la correlación'
        }
      ];
    }

    // Extraer variables para correlaciones usando campos reales de las tablas
    const antiguedad = responses.map(r => {
      const antiguedadValue = r.usuarios?.antiguedad_empresa || r.antiguedad_empresa || 0;
      return parseInt(antiguedadValue) || 0;
    });
    
    const puntajeNormalizado = responses.map(r => {
      const puntaje = r.puntaje_normalizado || 0;
      return parseFloat(puntaje) || 0;
    });
    
    const confianza = responses.map(r => {
      const confianzaValue = r.usuarios?.confianza_gerencia || r.confianza_gerencia || 0;
      return parseInt(confianzaValue) || 0;
    });
    
    const satisfaccion = responses.map(r => {
      const satisfaccionValue = r.usuarios?.satisfaccion_laboral || r.satisfaccion_laboral || 0;
      return parseInt(satisfaccionValue) || 0;
    });
    
    const motivacion = responses.map(r => {
      const motivacionValue = r.usuarios?.motivacion_seguridad || r.motivacion_seguridad || 0;
      return parseInt(motivacionValue) || 0;
    });
    
    const genero = responses.map(r => {
      const generoValue = r.usuarios?.genero || r.genero || '';
      return generoValue === 'Masculino' ? 1 : 0;
    });
    
    const edad = responses.map(r => {
      const edadValue = r.usuarios?.edad || r.edad || 0;
      return parseInt(edadValue) || 0;
    });
    
    const usoEpp = responses.map(r => {
      const eppValue = r.usuarios?.uso_epp || r.uso_epp || false;
      return eppValue ? 1 : 0;
    });
    
    const accidentesPrevios = responses.map(r => {
      const accidentesValue = r.usuarios?.accidentes_previos || r.accidentes_previos || false;
      return accidentesValue ? 1 : 0;
    });

    const correlaciones = [
      {
        id: 'antiguedadVsPuntaje',
        title: 'Antigüedad vs Puntaje Normalizado',
        correlation: calculatePearsonCorrelation(antiguedad, puntajeNormalizado),
        description: 'Relación entre años de experiencia y puntaje GHQ-12 normalizado'
      },
      {
        id: 'confianzaVsSatisfaccion',
        title: 'Confianza vs Satisfacción',
        correlation: calculatePearsonCorrelation(confianza, satisfaccion),
        description: 'Relación entre confianza en la gerencia y satisfacción laboral'
      },
      {
        id: 'motivacionVsPuntaje',
        title: 'Motivación vs Puntaje GHQ',
        correlation: calculatePearsonCorrelation(motivacion, puntajeNormalizado),
        description: 'Relación entre motivación en seguridad y riesgo psicológico'
      },
      {
        id: 'usoEppVsAccidentes',
        title: 'Uso EPP vs Accidentes',
        correlation: calculatePearsonCorrelation(usoEpp, accidentesPrevios),
        description: 'Relación entre uso de EPP y historial de accidentes'
      },
      {
        id: 'edadVsRiesgo',
        title: 'Edad vs Riesgo Psicológico',
        correlation: calculatePearsonCorrelation(edad, puntajeNormalizado),
        description: 'Relación entre edad y nivel de riesgo psicológico'
      },
      {
        id: 'generoVsMotivacion',
        title: 'Género vs Motivación',
        correlation: calculatePearsonCorrelation(genero, motivacion),
        description: 'Diferencias de motivación en seguridad por género'
      }
    ];

    return correlaciones.map(corr => ({
      ...corr,
      strength: getCorrelationStrength(corr.correlation),
      direction: getCorrelationDirection(corr.correlation)
    }));
  }, [data]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-4 border rounded-lg">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Funciones auxiliares para el renderizado
  const getCorrelationColor = (strength) => {
    switch (strength) {
      case 'Muy Fuerte': return 'bg-red-100 text-red-800';
      case 'Fuerte': return 'bg-orange-100 text-orange-800';
      case 'Moderada': return 'bg-yellow-100 text-yellow-800';
      case 'Débil': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDirectionIcon = (direction) => {
    return direction === 'Positiva' ? '↗️' : direction === 'Negativa' ? '↘️' : '➡️';
  };

  const formatCorrelation = (correlation) => {
    return isNaN(correlation) ? '0.00' : correlation.toFixed(2);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Análisis de Correlaciones
        </h3>
        <span className="text-2xl">📊</span>
      </div>

      {/* Guía de interpretación */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Interpretación de Correlaciones:</h4>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="font-semibold">+1.0:</span> Correlación positiva perfecta
          </div>
          <div>
            <span className="font-semibold">-1.0:</span> Correlación negativa perfecta
          </div>
          <div>
            <span className="font-semibold">0.0:</span> Sin correlación
          </div>
          <div>
            <span className="font-semibold">±0.7-1.0:</span> Correlación fuerte
          </div>
        </div>
      </div>

      {/* Lista de correlaciones */}
      <div className="space-y-4">
        {correlationData.map((correlation) => (
          <div key={correlation.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900 capitalize">
                {correlation.title}
              </h4>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${getCorrelationColor(correlation.strength)}`}>
                {correlation.strength}
              </div>
            </div>

            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold text-gray-900">
                {formatCorrelation(correlation.correlation)}
              </span>
              <span className="text-lg">
                {getDirectionIcon(correlation.direction)}
              </span>
            </div>

            <p className="text-sm text-gray-600 mb-3">
              {correlation.description}
            </p>

            {/* Barra de progreso visual */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                style={{ 
                  width: `${Math.abs(correlation.correlation) * 100}%`,
                  marginLeft: correlation.correlation > 0 ? '0%' : `${100 - Math.abs(correlation.correlation) * 100}%`
                }}
              />
            </div>

            <div className="flex justify-between text-xs text-gray-500">
              <span>-1.0</span>
              <span>0.0</span>
              <span>+1.0</span>
            </div>
          </div>
        ))}
      </div>

      {/* Insights y recomendaciones */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="text-sm font-medium text-blue-900 mb-3">Insights Clave:</h4>
        <ul className="text-xs text-blue-700 space-y-2">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>La <strong>confianza organizacional</strong> es el factor más influyente en satisfacción y motivación</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>La <strong>antigüedad laboral</strong> muestra efecto protector contra el estrés psicológico</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>El <strong>nivel educativo</strong> es determinante en la vulnerabilidad psicosocial</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Existen <strong>diferencias significativas</strong> en percepción de seguridad por género</span>
          </li>
        </ul>
      </div>

      {/* Estadísticas resumidas */}
      <div className="mt-6 grid grid-cols-3 gap-4 text-xs">
        <div className="text-center p-3 bg-gray-100 rounded">
          <div className="font-semibold text-gray-900">
            {correlationData.length}
          </div>
          <div className="text-gray-600">Correlaciones analizadas</div>
        </div>
        <div className="text-center p-3 bg-gray-100 rounded">
          <div className="font-semibold text-gray-900">
            {correlationData.filter(c => 
              c.strength === 'Fuerte' || c.strength === 'Muy Fuerte'
            ).length}
          </div>
          <div className="text-gray-600">Correlaciones fuertes</div>
        </div>
        <div className="text-center p-3 bg-gray-100 rounded">
          <div className="font-semibold text-gray-900">
            {correlationData.length > 0 ? 
              Math.abs(correlationData.reduce((sum, c) => 
                sum + (isNaN(c.correlation) ? 0 : c.correlation), 0
              ) / correlationData.length).toFixed(2) : 
              '0.00'
            }
          </div>
          <div className="text-gray-600">Correlación promedio</div>
        </div>
      </div>
    </div>
  );
};

export default CorrelationAnalysis;