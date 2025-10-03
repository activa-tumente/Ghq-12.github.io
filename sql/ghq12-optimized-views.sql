-- =====================================================
-- VISTAS OPTIMIZADAS GHQ-12 CON CÁLCULO CORRECTO
-- Sistema BAT-7 - Evaluación Psicológica
-- =====================================================

-- Vista materializada principal con cálculo correcto de GHQ-12
DROP MATERIALIZED VIEW IF EXISTS mv_ghq12_metrics_corrected CASCADE;

CREATE MATERIALIZED VIEW mv_ghq12_metrics_corrected AS
WITH ghq12_scores_corrected AS (
  SELECT 
    r.id,
    r.participante_id,
    r.created_at,
    r.departamento,
    r.turno,
    r.genero,
    r.edad,
    r.nivel_educativo,
    r.tipo_contrato,
    
    -- CÁLCULO CORRECTO CON INVERSIÓN DE PREGUNTAS NEGATIVAS
    -- Preguntas positivas (mantener valor original): P1, P3, P4, P7, P8, P12
    -- Preguntas negativas (invertir 3-valor): P2, P5, P6, P9, P10, P11
    (
      -- Preguntas positivas (indican bienestar)
      COALESCE((r.respuestas->>'q1')::int, 0) +   -- P1: Concentración
      COALESCE((r.respuestas->>'q3')::int, 0) +   -- P3: Utilidad
      COALESCE((r.respuestas->>'q4')::int, 0) +   -- P4: Decisiones
      COALESCE((r.respuestas->>'q7')::int, 0) +   -- P7: Disfrute
      COALESCE((r.respuestas->>'q8')::int, 0) +   -- P8: Afrontamiento
      COALESCE((r.respuestas->>'q12')::int, 0) +  -- P12: Felicidad
      
      -- Preguntas negativas (invertir: 3 - valor_original)
      (3 - COALESCE((r.respuestas->>'q2')::int, 0)) +   -- P2: Sueño
      (3 - COALESCE((r.respuestas->>'q5')::int, 0)) +   -- P5: Nerviosismo
      (3 - COALESCE((r.respuestas->>'q6')::int, 0)) +   -- P6: Dificultades
      (3 - COALESCE((r.respuestas->>'q9')::int, 0)) +   -- P9: Triste/Deprimido
      (3 - COALESCE((r.respuestas->>'q10')::int, 0)) +  -- P10: Confianza
      (3 - COALESCE((r.respuestas->>'q11')::int, 0))    -- P11: No valgo
    ) AS puntaje_total_bienestar,
    
    -- Dimensiones para análisis (manteniendo compatibilidad)
    (
      COALESCE((r.respuestas->>'q1')::int, 0) +
      (3 - COALESCE((r.respuestas->>'q2')::int, 0)) +
      COALESCE((r.respuestas->>'q3')::int, 0) +
      COALESCE((r.respuestas->>'q4')::int, 0) +
      (3 - COALESCE((r.respuestas->>'q5')::int, 0)) +
      (3 - COALESCE((r.respuestas->>'q6')::int, 0))
    ) AS dimension_ansiedad_depresion,
    
    (
      COALESCE((r.respuestas->>'q7')::int, 0) +
      COALESCE((r.respuestas->>'q8')::int, 0) +
      (3 - COALESCE((r.respuestas->>'q9')::int, 0)) +
      (3 - COALESCE((r.respuestas->>'q10')::int, 0)) +
      (3 - COALESCE((r.respuestas->>'q11')::int, 0)) +
      COALESCE((r.respuestas->>'q12')::int, 0)
    ) AS dimension_disfuncion_social
    
  FROM respuestas_cuestionario r
  WHERE r.respuestas IS NOT NULL
    AND r.respuestas ? 'q1' AND r.respuestas ? 'q2' AND r.respuestas ? 'q3'
    AND r.respuestas ? 'q4' AND r.respuestas ? 'q5' AND r.respuestas ? 'q6'
    AND r.respuestas ? 'q7' AND r.respuestas ? 'q8' AND r.respuestas ? 'q9'
    AND r.respuestas ? 'q10' AND r.respuestas ? 'q11' AND r.respuestas ? 'q12'
),
ghq12_classified AS (
  SELECT 
    *,
    -- CLASIFICACIÓN CORRECTA SEGÚN ESPECIFICACIÓN
    CASE 
      WHEN puntaje_total_bienestar >= 28 THEN 'Bajo (Aceptable)'
      WHEN puntaje_total_bienestar >= 18 THEN 'Moderado (Alerta)'
      WHEN puntaje_total_bienestar >= 9 THEN 'Alto (Alterado)'
      ELSE 'Muy Alto (Restringido)'
    END AS nivel_riesgo_general,
    
    -- Indicadores binarios para KPIs
    CASE 
      WHEN puntaje_total_bienestar <= 17 THEN 1 
      ELSE 0 
    END AS es_alto_riesgo,
    
    CASE 
      WHEN puntaje_total_bienestar >= 28 THEN 1 
      ELSE 0 
    END AS es_saludable,
    
    -- Prioridad para ordenamiento
    CASE 
      WHEN puntaje_total_bienestar >= 28 THEN 1  -- Bajo
      WHEN puntaje_total_bienestar >= 18 THEN 2  -- Moderado
      WHEN puntaje_total_bienestar >= 9 THEN 3   -- Alto
      ELSE 4                                      -- Muy Alto
    END AS prioridad_riesgo,
    
    -- Porcentaje de bienestar (0-100%)
    ROUND((puntaje_total_bienestar::numeric / 36.0) * 100, 2) AS porcentaje_bienestar
    
  FROM ghq12_scores_corrected
)
SELECT * FROM ghq12_classified;

-- Índices para optimización de consultas
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mv_ghq12_departamento 
ON mv_ghq12_metrics_corrected (departamento);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mv_ghq12_turno 
ON mv_ghq12_metrics_corrected (turno);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mv_ghq12_nivel_riesgo 
ON mv_ghq12_metrics_corrected (nivel_riesgo_general);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mv_ghq12_created_at 
ON mv_ghq12_metrics_corrected (created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mv_ghq12_alto_riesgo 
ON mv_ghq12_metrics_corrected (es_alto_riesgo) WHERE es_alto_riesgo = 1;

-- =====================================================
-- VISTA AGREGADA PARA DASHBOARD PRINCIPAL
-- =====================================================

DROP VIEW IF EXISTS v_dashboard_ghq12_summary CASCADE;

CREATE VIEW v_dashboard_ghq12_summary AS
SELECT 
  -- Métricas generales
  COUNT(*) as total_participantes,
  ROUND(AVG(puntaje_total_bienestar), 2) as promedio_bienestar,
  ROUND(STDDEV(puntaje_total_bienestar), 2) as desviacion_estandar,
  MIN(puntaje_total_bienestar) as min_puntaje,
  MAX(puntaje_total_bienestar) as max_puntaje,
  
  -- KPI PRINCIPAL: Porcentaje en riesgo Alto/Muy Alto
  ROUND(
    (SUM(es_alto_riesgo)::numeric / COUNT(*)) * 100, 
    2
  ) as kpi_porcentaje_alto_riesgo,
  
  SUM(es_alto_riesgo) as total_alto_riesgo,
  
  -- Distribución por niveles
  SUM(CASE WHEN nivel_riesgo_general = 'Bajo (Aceptable)' THEN 1 ELSE 0 END) as count_bajo,
  SUM(CASE WHEN nivel_riesgo_general = 'Moderado (Alerta)' THEN 1 ELSE 0 END) as count_moderado,
  SUM(CASE WHEN nivel_riesgo_general = 'Alto (Alterado)' THEN 1 ELSE 0 END) as count_alto,
  SUM(CASE WHEN nivel_riesgo_general = 'Muy Alto (Restringido)' THEN 1 ELSE 0 END) as count_muy_alto,
  
  -- Porcentajes por nivel
  ROUND((SUM(CASE WHEN nivel_riesgo_general = 'Bajo (Aceptable)' THEN 1 ELSE 0 END)::numeric / COUNT(*)) * 100, 2) as pct_bajo,
  ROUND((SUM(CASE WHEN nivel_riesgo_general = 'Moderado (Alerta)' THEN 1 ELSE 0 END)::numeric / COUNT(*)) * 100, 2) as pct_moderado,
  ROUND((SUM(CASE WHEN nivel_riesgo_general = 'Alto (Alterado)' THEN 1 ELSE 0 END)::numeric / COUNT(*)) * 100, 2) as pct_alto,
  ROUND((SUM(CASE WHEN nivel_riesgo_general = 'Muy Alto (Restringido)' THEN 1 ELSE 0 END)::numeric / COUNT(*)) * 100, 2) as pct_muy_alto,
  
  -- Dimensiones promedio
  ROUND(AVG(dimension_ansiedad_depresion), 2) as promedio_ansiedad_depresion,
  ROUND(AVG(dimension_disfuncion_social), 2) as promedio_disfuncion_social,
  
  -- Metadatos
  NOW() as calculado_en,
  'v2.0_corrected' as version_calculo
  
FROM mv_ghq12_metrics_corrected;

-- =====================================================
-- VISTA POR DEPARTAMENTO
-- =====================================================

DROP VIEW IF EXISTS v_dashboard_ghq12_by_department CASCADE;

CREATE VIEW v_dashboard_ghq12_by_department AS
SELECT 
  departamento,
  COUNT(*) as total_participantes,
  ROUND(AVG(puntaje_total_bienestar), 2) as promedio_bienestar,
  
  -- KPI por departamento
  ROUND(
    (SUM(es_alto_riesgo)::numeric / COUNT(*)) * 100, 
    2
  ) as kpi_porcentaje_alto_riesgo,
  
  SUM(es_alto_riesgo) as total_alto_riesgo,
  
  -- Distribución
  SUM(CASE WHEN nivel_riesgo_general = 'Bajo (Aceptable)' THEN 1 ELSE 0 END) as count_bajo,
  SUM(CASE WHEN nivel_riesgo_general = 'Moderado (Alerta)' THEN 1 ELSE 0 END) as count_moderado,
  SUM(CASE WHEN nivel_riesgo_general = 'Alto (Alterado)' THEN 1 ELSE 0 END) as count_alto,
  SUM(CASE WHEN nivel_riesgo_general = 'Muy Alto (Restringido)' THEN 1 ELSE 0 END) as count_muy_alto,
  
  -- Ranking de riesgo
  RANK() OVER (ORDER BY (SUM(es_alto_riesgo)::numeric / COUNT(*)) DESC) as ranking_riesgo
  
FROM mv_ghq12_metrics_corrected
GROUP BY departamento
HAVING COUNT(*) >= 3  -- Mínimo 3 participantes para estadística válida
ORDER BY kpi_porcentaje_alto_riesgo DESC;

-- =====================================================
-- FUNCIÓN PARA REFRESCAR VISTAS MATERIALIZADAS
-- =====================================================

CREATE OR REPLACE FUNCTION refresh_ghq12_materialized_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_ghq12_metrics_corrected;
  
  -- Log del refresh
  INSERT INTO dashboard_refresh_log (view_name, refreshed_at, status)
  VALUES ('mv_ghq12_metrics_corrected', NOW(), 'success');
  
EXCEPTION WHEN OTHERS THEN
  -- Log del error
  INSERT INTO dashboard_refresh_log (view_name, refreshed_at, status, error_message)
  VALUES ('mv_ghq12_metrics_corrected', NOW(), 'error', SQLERRM);
  
  RAISE;
END;
$$ LANGUAGE plpgsql;

-- Tabla para log de refreshes (crear si no existe)
CREATE TABLE IF NOT EXISTS dashboard_refresh_log (
  id SERIAL PRIMARY KEY,
  view_name VARCHAR(100) NOT NULL,
  refreshed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'error')),
  error_message TEXT,
  duration_ms INTEGER
);

-- =====================================================
-- CONSULTAS OPTIMIZADAS PARA EL DASHBOARD
-- =====================================================

-- Consulta principal para métricas del dashboard
COMMENT ON VIEW v_dashboard_ghq12_summary IS 
'Vista principal para métricas GHQ-12 del dashboard. 
Implementa el cálculo CORRECTO con inversión de preguntas negativas.
KPI principal: Porcentaje de trabajadores en riesgo Alto/Muy Alto.';

-- Consulta para heatmap por departamento
COMMENT ON VIEW v_dashboard_ghq12_by_department IS 
'Vista para análisis por departamento con ranking de riesgo.
Útil para identificar departamentos que requieren intervención prioritaria.';

-- Grants para acceso desde la aplicación
GRANT SELECT ON mv_ghq12_metrics_corrected TO dashboard_user;
GRANT SELECT ON v_dashboard_ghq12_summary TO dashboard_user;
GRANT SELECT ON v_dashboard_ghq12_by_department TO dashboard_user;