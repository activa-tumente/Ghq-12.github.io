-- Script de migración para agregar columna documento y migrar datos existentes
-- Ejecutar este script en la base de datos Supabase

-- 1. Agregar columna documento a la tabla usuarios
ALTER TABLE public.usuarios 
ADD COLUMN IF NOT EXISTS documento VARCHAR(255) NULL;

-- 2. Crear índice único para documento
CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_documento 
ON public.usuarios(documento) 
TABLESPACE pg_default;

-- 3. Migrar datos existentes: extraer documento del campo email
UPDATE public.usuarios 
SET documento = REPLACE(email, '@temp.local', '')
WHERE email LIKE '%@temp.local' AND documento IS NULL;

-- 4. Hacer la columna documento NOT NULL después de migrar todos los datos
-- (Ejecutar esto después de verificar que todos los registros tienen documento)
-- ALTER TABLE public.usuarios ALTER COLUMN documento SET NOT NULL;

-- 5. Opcional: Eliminar la restricción única del email si ya no es necesaria
-- ALTER TABLE public.usuarios DROP CONSTRAINT IF EXISTS usuarios_email_key;

-- 6. Verificar la migración
SELECT 
    id,
    nombre,
    email,
    documento,
    CASE 
        WHEN documento IS NULL THEN 'PENDIENTE MIGRACIÓN'
        WHEN documento = REPLACE(email, '@temp.local', '') THEN 'MIGRADO CORRECTAMENTE'
        ELSE 'ERROR EN MIGRACIÓN'
    END as estado_migracion
FROM public.usuarios 
WHERE email LIKE '%@temp.local'
LIMIT 10;