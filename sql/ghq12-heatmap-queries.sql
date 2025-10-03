-- =====================================================
-- CONSULTAS SQL PARA MAPA DE CALOR GHQ-12
-- Sistema de Evaluación Psicológica BAT-7
-- =====================================================
-- 
-- Estas consultas extraen la distribución de respuestas
-- para crear un mapa de calor 12x4 (preguntas × opciones)
-- con análisis de riesgo diferenciado por tipo de pregunta
--
-- =====================================================

-- -----------------------------------------------------
-- 1. VISTA MATERIALIZADA: DISTRIBUCIÓN COMPLETA GHQ-12
-- -----------------------------------------------------

CREATE OR REPLACE VIEW v_ghq12_response_distribution AS
WITH question_responses AS (
  -- Extraer todas las respuestas individuales con metadata
  SELECT 
    rc.user_id,
    rc.fecha_respuesta,
    u.email,
    COALESCE(u.metadata->>'departamento', u.metadata->>'area', 'Sin especificar') as departamento,
    COALESCE(u.metadata->>'turno', u.metadata->>'horario', 'Sin especificar') as turno,
    COALESCE(u.metadata->>'genero', u.metadata->>'sexo', 'Sin especificar') as genero,
    COALESCE(u.metadata->>'tipo_contrato', u.metadata->>'tipoContrato', 'Sin especificar') as tipo_contrato,
    
    -- Extraer respuestas individuales (q1-q12)
    COALESCE((rc.respuestas->>'q1')::integer, 0) as q1,
    COALESCE((rc.respuestas->>'q2')::integer, 0) as q2,
    COALESCE((rc.respuestas->>'q3')::integer, 0) as q3,
    COALESCE((rc.respuestas->>'q4')::integer, 0) as q4,
    COALESCE((rc.respuestas->>'q5')::integer, 0) as q5,
    COALESCE((rc.respuestas->>'q6')::integer, 0) as q6,
    COALESCE((rc.respuestas->>'q7')::integer, 0) as q7,
    COALESCE((rc.respuestas->>'q8')::integer, 0) as q8,
    COALESCE((rc.respuestas->>'q9')::integer, 0) as q9,
    COALESCE((rc.respuestas->>'q10')::integer, 0) as q10,
    COALESCE((rc.respuestas->>'q11')::integer, 0) as q11,
    COALESCE((rc.respuestas->>'q12')::integer, 0) as q12
  FROM respuestas_cuestionario rc
  INNER JOIN usuarios u ON rc.user_id = u.id
  WHERE rc.respuestas IS NOT NULL
),

-- Transformar a formato largo (una fila por pregunta-respuesta)
responses_long AS (
  SELECT 
    user_id, fecha_respuesta, email, departamento, turno, genero, tipo_contrato,
    1 as pregunta_id, 'P1: ¿Ha podido concentrarse bien en lo que hace?' as pregunta_texto, 
    'Concentración' as dimension, 'positive' as tipo_pregunta, q1 as valor_respuesta
  FROM question_responses
  UNION ALL
  SELECT 
    user_id, fecha_respuesta, email, departamento, turno, genero, tipo_contrato,
    2, 'P2: ¿Sus preocupaciones le han hecho perder mucho sueño?', 
    'Sueño', 'negative', q2
  FROM question_responses
  UNION ALL
  SELECT 
    user_id, fecha_respuesta, email, departamento, turno, genero, tipo_contrato,
    3, 'P3: ¿Ha sentido que está jugando un papel útil en la vida?', 
    'Autoestima', 'positive', q3
  FROM question_responses
  UNION ALL
  SELECT 
    user_id, fecha_respuesta, email, departamento, turno, genero, tipo_contrato,
    4, 'P4: ¿Se ha sentido capaz de tomar decisiones?', 
    'Decisiones', 'positive', q4
  FROM question_responses
  UNION ALL
  SELECT 
    user_id, fecha_respuesta, email, departamento, turno, genero, tipo_contrato,
    5, 'P5: ¿Se ha sentido constantemente agobiado y en tensión?', 
    'Estrés', 'negative', q5
  FROM question_responses
  UNION ALL
  SELECT 
    user_id, fecha_respuesta, email, departamento, turno, genero, tipo_contrato,
    6, 'P6: ¿Ha sentido que no puede superar sus dificultades?', 
    'Afrontamiento', 'negative', q6
  FROM question_responses
  UNION ALL
  SELECT 
    user_id, fecha_respuesta, email, departamento, turno, genero, tipo_contrato,
    7, 'P7: ¿Ha sido capaz de disfrutar sus actividades normales de cada día?', 
    'Disfrute', 'positive', q7
  FROM question_responses
  UNION ALL
  SELECT 
    user_id, fecha_respuesta, email, departamento, turno, genero, tipo_contrato,
    8, 'P8: ¿Ha sido capaz de hacer frente a sus problemas?', 
    'Problemas', 'positive', q8
  FROM question_responses
  UNION ALL
  SELECT 
    user_id, fecha_respuesta, email, departamento, turno, genero, tipo_contrato,
    9, 'P9: ¿Se ha sentido poco feliz y deprimido?', 
    'Estado de ánimo', 'negative', q9
  FROM question_responses
  UNION ALL
  SELECT 
    user_id, fecha_respuesta, email, departamento, turno, genero, tipo_contrato,
    10, 'P10: ¿Ha perdido confianza en sí mismo?', 
    'Confianza', 'negative', q10
  FROM question_responses
  UNION ALL
  SELECT 
    user_id, fecha_respuesta, email, departamento, turno, genero, tipo_contrato,
    11, 'P11: ¿Ha pensado que usted es una persona que no vale para nada?', 
    'Autoestima', 'negative', q11
  FROM question_responses
  UNION ALL
  SELECT 
    user_id, fecha_respuesta, email, departamento, turno, genero, tipo_contrato,
    12, 'P12: ¿Se siente razonablemente feliz considerando todas las circunstancias?', 
    'Felicidad', 'positive', q12
  FROM question_responses
)

-- Calcular distribución final con análisis de riesgo
SELECT 
  pregunta_id,
  pregunta_texto,
  dimension,
  tipo_pregunta,
  departamento,
  turno,
  genero,
  valor_respuesta,
  
  -- Etiquetas de respuesta
  CASE valor_respuesta
    WHEN 0 THEN 'Nunca'
    WHEN 1 THEN 'Casi Nunca'
    WHEN 2 THEN 'Casi Siempre'
    WHEN 3 THEN 'Siempre'
    ELSE 'Desconocido'
  END as etiqueta_respuesta,
  
  -- Conteos y porcentajes
  COUNT(*) as total_respuestas,
  ROUND(
    (COUNT(*)::numeric * 100.0 / 
     SUM(COUNT(*)) OVER (PARTITION BY pregunta_id, departamento, turno, genero)
    ), 2
  ) as porcentaje,
  
  -- Análisis de riesgo diferenciado
  CASE 
    WHEN tipo_pregunta = 'negative' AND valor_respuesta >= 2 THEN true
    WHEN tipo_pregunta = 'positive' AND valor_respuesta <= 1 THEN true
    ELSE false
  END as es_respuesta_riesgo,
  
  -- Intensidad de riesgo (0-1)
  CASE 
    WHEN tipo_pregunta = 'negative' THEN 
      CASE valor_respuesta
        WHEN 3 THEN 1.0
        WHEN 2 THEN 0.7
        WHEN 1 THEN 0.3
        WHEN 0 THEN 0.0
      END
    WHEN tipo_pregunta = 'positive' THEN 
      CASE valor_respuesta
        WHEN 0 THEN 1.0
        WHEN 1 THEN 0.7
        WHEN 2 THEN 0.3
        WHEN 3 THEN 0.0
      END
  END as intensidad_riesgo,
  
  -- Totales por grupo
  SUM(COUNT(*)) OVER (PARTITION BY pregunta_id, departamento, turno, genero) as total_grupo,
  COUNT(DISTINCT user_id) OVER (PARTITION BY pregunta_id, departamento, turno, genero) as participantes_grupo

FROM responses_long
GROUP BY 
  pregunta_id, pregunta_texto, dimension, tipo_pregunta,
  departamento, turno, genero, valor_respuesta
ORDER BY 
  pregunta_id, departamento, turno, genero, valor_respuesta;

-- -----------------------------------------------------
-- 2. CONSULTA SIMPLIFICADA POR DEPARTAMENTO
-- -----------------------------------------------------

CREATE OR REPLACE FUNCTION get_ghq12_heatmap_by_department(
  p_departamento TEXT DEFAULT NULL,
  p_turno TEXT DEFAULT NULL,
  p_genero TEXT DEFAULT NULL
) 
RETURNS TABLE (
  pregunta_id INTEGER,
  pregunta_texto TEXT,
  dimension TEXT,
  tipo_pregunta TEXT,
  departamento TEXT,
  valor_respuesta INTEGER,
  etiqueta_respuesta TEXT,
  total_respuestas BIGINT,
  porcentaje NUMERIC,
  es_respuesta_riesgo BOOLEAN,
  intensidad_riesgo NUMERIC,
  total_participantes BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.pregunta_id,
    v.pregunta_texto,
    v.dimension,
    v.tipo_pregunta,
    v.departamento,
    v.valor_respuesta,
    v.etiqueta_respuesta,
    v.total_respuestas,
    v.porcentaje,
    v.es_respuesta_riesgo,
    v.intensidad_riesgo,
    v.participantes_grupo as total_participantes
  FROM v_ghq12_response_distribution v
  WHERE 
    (p_departamento IS NULL OR v.departamento = p_departamento) AND
    (p_turno IS NULL OR v.turno = p_turno) AND
    (p_genero IS NULL OR v.genero = p_genero)
  ORDER BY v.pregunta_id, v.departamento, v.valor_respuesta;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------
-- 3. CONSULTA PARA MATRIZ DE MAPA DE CALOR
-- -----------------------------------------------------

CREATE OR REPLACE FUNCTION get_ghq12_heatmap_matrix(
  p_group_by TEXT DEFAULT 'departamento',
  p_departamento TEXT DEFAULT NULL,
  p_turno TEXT DEFAULT NULL,
  p_genero TEXT DEFAULT NULL
) 
RETURNS TABLE (
  pregunta_id INTEGER,
  pregunta_texto TEXT,
  dimension TEXT,
  tipo_pregunta TEXT,
  grupo TEXT,
  opcion_0_count BIGINT,
  opcion_0_pct NUMERIC,
  opcion_1_count BIGINT,
  opcion_1_pct NUMERIC,
  opcion_2_count BIGINT,
  opcion_2_pct NUMERIC,
  opcion_3_count BIGINT,
  opcion_3_pct NUMERIC,
  total_respuestas BIGINT,
  porcentaje_riesgo NUMERIC,
  promedio_respuesta NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH filtered_data AS (
    SELECT *
    FROM v_ghq12_response_distribution v
    WHERE 
      (p_departamento IS NULL OR v.departamento = p_departamento) AND
      (p_turno IS NULL OR v.turno = p_turno) AND
      (p_genero IS NULL OR v.genero = p_genero)
  ),
  
  grouped_data AS (
    SELECT 
      pregunta_id,
      pregunta_texto,
      dimension,
      tipo_pregunta,
      CASE 
        WHEN p_group_by = 'departamento' THEN departamento
        WHEN p_group_by = 'turno' THEN turno
        WHEN p_group_by = 'genero' THEN genero
        ELSE departamento
      END as grupo,
      valor_respuesta,
      SUM(total_respuestas) as count_respuestas,
      AVG(porcentaje) as avg_porcentaje,
      AVG(intensidad_riesgo) as avg_intensidad_riesgo
    FROM filtered_data
    GROUP BY pregunta_id, pregunta_texto, dimension, tipo_pregunta, grupo, valor_respuesta
  )
  
  SELECT 
    gd.pregunta_id,
    gd.pregunta_texto,
    gd.dimension,
    gd.tipo_pregunta,
    gd.grupo,
    
    -- Conteos por opción
    COALESCE(SUM(CASE WHEN gd.valor_respuesta = 0 THEN gd.count_respuestas END), 0) as opcion_0_count,
    COALESCE(ROUND(AVG(CASE WHEN gd.valor_respuesta = 0 THEN gd.avg_porcentaje END), 2), 0) as opcion_0_pct,
    
    COALESCE(SUM(CASE WHEN gd.valor_respuesta = 1 THEN gd.count_respuestas END), 0) as opcion_1_count,
    COALESCE(ROUND(AVG(CASE WHEN gd.valor_respuesta = 1 THEN gd.avg_porcentaje END), 2), 0) as opcion_1_pct,
    
    COALESCE(SUM(CASE WHEN gd.valor_respuesta = 2 THEN gd.count_respuestas END), 0) as opcion_2_count,
    COALESCE(ROUND(AVG(CASE WHEN gd.valor_respuesta = 2 THEN gd.avg_porcentaje END), 2), 0) as opcion_2_pct,
    
    COALESCE(SUM(CASE WHEN gd.valor_respuesta = 3 THEN gd.count_respuestas END), 0) as opcion_3_count,
    COALESCE(ROUND(AVG(CASE WHEN gd.valor_respuesta = 3 THEN gd.avg_porcentaje END), 2), 0) as opcion_3_pct,
    
    -- Totales
    SUM(gd.count_respuestas) as total_respuestas,
    
    -- Porcentaje de riesgo (respuestas de riesgo / total)
    ROUND(
      (SUM(CASE 
        WHEN (gd.tipo_pregunta = 'negative' AND gd.valor_respuesta >= 2) OR 
             (gd.tipo_pregunta = 'positive' AND gd.valor_respuesta <= 1) 
        THEN gd.count_respuestas 
        ELSE 0 
      END)::numeric * 100.0 / NULLIF(SUM(gd.count_respuestas), 0)
      ), 2
    ) as porcentaje_riesgo,
    
    -- Promedio de respuesta
    ROUND(
      (SUM(gd.valor_respuesta * gd.count_respuestas)::numeric / NULLIF(SUM(gd.count_respuestas), 0)
      ), 2
    ) as promedio_respuesta
    
  FROM grouped_data gd
  GROUP BY gd.pregunta_id, gd.pregunta_texto, gd.dimension, gd.tipo_pregunta, gd.grupo
  ORDER BY gd.pregunta_id, gd.grupo;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------
-- 4. CONSULTA DE RESUMEN ESTADÍSTICO
-- -----------------------------------------------------

CREATE OR REPLACE FUNCTION get_ghq12_heatmap_summary(
  p_group_by TEXT DEFAULT 'departamento',
  p_departamento TEXT DEFAULT NULL,
  p_turno TEXT DEFAULT NULL,
  p_genero TEXT DEFAULT NULL
) 
RETURNS TABLE (
  total_respuestas BIGINT,
  total_participantes BIGINT,
  total_grupos BIGINT,
  promedio_riesgo_general NUMERIC,
  pregunta_mayor_riesgo INTEGER,
  pregunta_mayor_riesgo_texto TEXT,
  grupo_mayor_riesgo TEXT,
  porcentaje_mayor_riesgo NUMERIC,
  distribucion_por_dimension JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH summary_data AS (
    SELECT * FROM get_ghq12_heatmap_matrix(p_group_by, p_departamento, p_turno, p_genero)
  ),
  
  risk_analysis AS (
    SELECT 
      pregunta_id,
      pregunta_texto,
      grupo,
      porcentaje_riesgo,
      ROW_NUMBER() OVER (ORDER BY porcentaje_riesgo DESC) as risk_rank
    FROM summary_data
    WHERE porcentaje_riesgo IS NOT NULL
  ),
  
  dimension_summary AS (
    SELECT 
      dimension,
      AVG(porcentaje_riesgo) as avg_risk,
      COUNT(*) as count_questions
    FROM summary_data
    GROUP BY dimension
  )
  
  SELECT 
    (SELECT SUM(total_respuestas) FROM summary_data)::BIGINT as total_respuestas,
    (SELECT COUNT(DISTINCT grupo) FROM summary_data)::BIGINT as total_participantes,
    (SELECT COUNT(DISTINCT grupo) FROM summary_data)::BIGINT as total_grupos,
    (SELECT ROUND(AVG(porcentaje_riesgo), 2) FROM summary_data WHERE porcentaje_riesgo IS NOT NULL) as promedio_riesgo_general,
    (SELECT pregunta_id FROM risk_analysis WHERE risk_rank = 1) as pregunta_mayor_riesgo,
    (SELECT pregunta_texto FROM risk_analysis WHERE risk_rank = 1) as pregunta_mayor_riesgo_texto,
    (SELECT grupo FROM risk_analysis WHERE risk_rank = 1) as grupo_mayor_riesgo,
    (SELECT porcentaje_riesgo FROM risk_analysis WHERE risk_rank = 1) as porcentaje_mayor_riesgo,
    (SELECT jsonb_object_agg(dimension, jsonb_build_object('avg_risk', avg_risk, 'count_questions', count_questions))
     FROM dimension_summary) as distribucion_por_dimension;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------
-- 5. ÍNDICES PARA OPTIMIZACIÓN
-- -----------------------------------------------------

-- Índice para mejorar rendimiento de consultas de heatmap
CREATE INDEX IF NOT EXISTS idx_respuestas_cuestionario_heatmap 
ON respuestas_cuestionario USING GIN (respuestas);

-- Índice para metadata de usuarios
CREATE INDEX IF NOT EXISTS idx_usuarios_metadata_heatmap 
ON usuarios USING GIN (metadata);

-- Índice compuesto para filtros comunes
CREATE INDEX IF NOT EXISTS idx_usuarios_metadata_dept_turno 
ON usuarios ((metadata->>'departamento'), (metadata->>'turno'), (metadata->>'genero'));

-- -----------------------------------------------------
-- 6. COMENTARIOS Y DOCUMENTACIÓN
-- -----------------------------------------------------

COMMENT ON VIEW v_ghq12_response_distribution IS 
'Vista que proporciona distribución completa de respuestas GHQ-12 para mapa de calor. 
Incluye análisis de riesgo diferenciado por tipo de pregunta (positiva/negativa).';

COMMENT ON FUNCTION get_ghq12_heatmap_by_department IS 
'Función que retorna datos de heatmap filtrados por departamento, turno y/o género.
Útil para análisis segmentado de bienestar laboral.';

COMMENT ON FUNCTION get_ghq12_heatmap_matrix IS 
'Función que genera matriz 12x4 para visualización de mapa de calor.
Agrupa respuestas por pregunta y grupo seleccionado (departamento/turno/género).';

COMMENT ON FUNCTION get_ghq12_heatmap_summary IS 
'Función que proporciona resumen estadístico del análisis de heatmap.
Incluye identificación de áreas de mayor riesgo y distribución por dimensiones.';