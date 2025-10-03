/**
 * Servicio para cálculos y transformaciones de métricas
 * Contiene la lógica de negocio pura sin dependencias externas
 */
export class MetricsCalculator {
  
  static WELLNESS_THRESHOLDS = {
    EXCELLENT: 1,
    GOOD: 1.5,
    REGULAR: 2
  };

  /**
   * Calcula métricas de bienestar a partir de respuestas
   */
  static calculateWellnessMetrics(respuestas) {
    if (!respuestas || respuestas.length === 0) {
      return {
        promedioSalud: 0,
        indiceBienestar: 0,
        usuariosConRespuestas: 0
      };
    }

    let totalPuntuacion = 0;
    let totalPreguntas = 0;
    const usuariosUnicos = new Set();

    respuestas.forEach(respuesta => {
      usuariosUnicos.add(respuesta.user_id);
      
      if (respuesta.respuestas && typeof respuesta.respuestas === 'object') {
        Object.values(respuesta.respuestas).forEach(valor => {
          if (typeof valor === 'number') {
            totalPuntuacion += valor;
            totalPreguntas++;
          }
        });
      }
    });

    const promedioSalud = totalPreguntas > 0 ? totalPuntuacion / totalPreguntas : 0;
    const indiceBienestar = Math.max(0, Math.min(100, ((3 - promedioSalud) / 3) * 100));

    return {
      promedioSalud: parseFloat(promedioSalud.toFixed(2)),
      indiceBienestar: Math.round(indiceBienestar),
      usuariosConRespuestas: usuariosUnicos.size
    };
  }

  /**
   * Calcula tendencia mensual
   */
  static calculateMonthlyTrend(datos) {
    const fechaActual = new Date();
    const mesAnterior = new Date(fechaActual.getFullYear(), fechaActual.getMonth() - 1, 1);
    
    const datosMesActual = datos.filter(d => 
      new Date(d.created_at) >= new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1)
    );
    
    const datosMesAnterior = datos.filter(d => {
      const fecha = new Date(d.created_at);
      return fecha >= mesAnterior && fecha < new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
    });

    const cambio = datosMesAnterior.length > 0 
      ? ((datosMesActual.length - datosMesAnterior.length) / datosMesAnterior.length) * 100
      : datosMesActual.length > 0 ? 100 : 0;

    return {
      cambioMensual: parseFloat(cambio.toFixed(1)),
      tendencia: cambio > 5 ? 'creciente' : cambio < -5 ? 'decreciente' : 'estable',
      formatted: `${cambio >= 0 ? '+' : ''}${Math.round(cambio)}%`
    };
  }

  /**
   * Calcula estadísticas por segmento
   */
  static calculateSegmentStats(usuarios, campo) {
    const segmentos = {};
    
    usuarios.forEach(usuario => {
      const valor = usuario[campo] || 'Sin especificar';
      
      if (!segmentos[valor]) {
        segmentos[valor] = {
          total: 0,
          completados: 0,
          pendientes: 0,
          porcentajeCompletado: 0
        };
      }
      
      segmentos[valor].total++;
      if (usuario.estadoEvaluacion === 'completado') {
        segmentos[valor].completados++;
      } else {
        segmentos[valor].pendientes++;
      }
    });

    // Calcular porcentajes
    Object.values(segmentos).forEach(segmento => {
      segmento.porcentajeCompletado = segmento.total > 0 
        ? Math.round((segmento.completados / segmento.total) * 100)
        : 0;
    });

    return segmentos;
  }

  /**
   * Calcula la edad a partir de la fecha de nacimiento
   */
  static calculateAge(fechaNacimiento) {
    if (!fechaNacimiento) return null;
    
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    
    if (isNaN(nacimiento.getTime())) return null;
    
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    
    return edad >= 0 ? edad : null;
  }

  /**
   * Valida y sanitiza filtros de entrada
   */
  static validateFilters(filtros = {}) {
    const filtrosValidos = {};
    
    // Validar fechas
    if (filtros.fechaInicio && Date.parse(filtros.fechaInicio)) {
      filtrosValidos.fechaInicio = filtros.fechaInicio;
    }
    
    if (filtros.fechaFin && Date.parse(filtros.fechaFin)) {
      filtrosValidos.fechaFin = filtros.fechaFin;
    }
    
    // Validar campos de texto
    const camposTexto = ['departamento', 'turno', 'genero', 'area'];
    camposTexto.forEach(campo => {
      if (filtros[campo] && typeof filtros[campo] === 'string') {
        filtrosValidos[campo] = filtros[campo].trim();
      }
    });
    
    return filtrosValidos;
  }
}