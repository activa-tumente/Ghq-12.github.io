CREATE OR REPLACE FUNCTION get_risk_level_name(score NUMERIC)
RETURNS TEXT AS $$
BEGIN
    RETURN CASE
        WHEN score >= 0.8 THEN 'Muy Alto'
        WHEN score >= 0.6 THEN 'Alto'
        WHEN score >= 0.4 THEN 'Moderado'
        WHEN score >= 0.2 THEN 'Bajo'
        ELSE 'Muy Bajo'
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_risk_heatmap_data(
    p_start_date TIMESTAMPTZ DEFAULT NULL,
    p_end_date TIMESTAMPTZ DEFAULT NULL,
    p_department_ids UUID[] DEFAULT NULL,
    p_position_ids UUID[] DEFAULT NULL
)
RETURNS TABLE (
    department_id UUID,
    department_name TEXT,
    total_users INT,
    risk_distribution JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH user_avg_scores AS (
        SELECT
            u.id AS user_id,
            u.departamento_id,
            d.nombre AS department_name,
            AVG(r.normalized_score) AS avg_score
        FROM
            usuarios u
        JOIN
            respuestas r ON u.id = r.user_id
        JOIN
            departamentos d ON u.departamento_id = d.id
        WHERE
            (p_start_date IS NULL OR r.created_at >= p_start_date) AND
            (p_end_date IS NULL OR r.created_at <= p_end_date) AND
            (p_department_ids IS NULL OR u.departamento_id = ANY(p_department_ids)) AND
            (p_position_ids IS NULL OR u.puesto_id = ANY(p_position_ids))
        GROUP BY
            u.id, d.nombre, u.departamento_id
    ),
    department_risk_levels AS (
        SELECT
            uas.departamento_id,
            uas.department_name,
            get_risk_level_name(uas.avg_score) AS risk_level
        FROM
            user_avg_scores uas
    ),
    department_risk_counts AS (
        SELECT
            drl.departamento_id,
            drl.department_name,
            drl.risk_level,
            COUNT(*) AS user_count
        FROM
            department_risk_levels drl
        GROUP BY
            drl.departamento_id, drl.department_name, drl.risk_level
    ),
    department_total_users AS (
        SELECT
            drc.departamento_id,
            SUM(drc.user_count) AS total_users
        FROM
            department_risk_counts drc
        GROUP BY
            drc.departamento_id
    ),
    risk_levels AS (
        SELECT unnest(ARRAY['Muy Bajo', 'Bajo', 'Moderado', 'Alto', 'Muy Alto']) AS risk_level
    ),
    all_department_risks AS (
        SELECT
            d.id AS departamento_id,
            d.nombre AS department_name,
            rl.risk_level
        FROM departamentos d
        CROSS JOIN risk_levels rl
    )
    SELECT
        adr.departamento_id,
        adr.department_name,
        COALESCE(dtu.total_users, 0)::INT AS total_users,
        jsonb_object_agg(
            adr.risk_level,
            COALESCE((drc.user_count::NUMERIC / dtu.total_users * 100.0), 0)
        ) AS risk_distribution
    FROM
        all_department_risks adr
    LEFT JOIN
        department_risk_counts drc ON adr.departamento_id = drc.departamento_id AND adr.risk_level = drc.risk_level
    LEFT JOIN
        department_total_users dtu ON adr.departamento_id = dtu.departamento_id
    GROUP BY
        adr.departamento_id, adr.department_name, dtu.total_users
    ORDER BY
        adr.department_name;
END;
$$ LANGUAGE plpgsql;


-- Function to get critical points
CREATE OR REPLACE FUNCTION get_critical_points_data(
    p_start_date TIMESTAMPTZ DEFAULT NULL,
    p_end_date TIMESTAMPTZ DEFAULT NULL,
    p_department_ids UUID[] DEFAULT NULL,
    p_position_ids UUID[] DEFAULT NULL
)
RETURNS TABLE (
    department_name TEXT,
    risk_level TEXT,
    risk_percentage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH heatmap_data AS (
        SELECT
            h.department_name,
            (jsonb_each_text(h.risk_distribution)).*
        FROM
            get_risk_heatmap_data(p_start_date, p_end_date, p_department_ids, p_position_ids) h
    )
    SELECT
        hd.department_name,
        hd.key AS risk_level,
        hd.value::NUMERIC AS risk_percentage
    FROM
        heatmap_data hd
    WHERE
        (hd.key = 'Muy Alto' AND hd.value::NUMERIC > 0) OR
        (hd.key = 'Alto' AND hd.value::NUMERIC > 0)
    ORDER BY
        hd.value::NUMERIC DESC,
        CASE hd.key
            WHEN 'Muy Alto' THEN 1
            WHEN 'Alto' THEN 2
            ELSE 3
        END
    LIMIT 5;
END;
$$ LANGUAGE plpgsql;