-- Add 'completado' column to track completion status
ALTER TABLE public.respuestas_cuestionario
ADD COLUMN IF NOT EXISTS completado BOOLEAN DEFAULT FALSE;

-- Add 'fecha_respuesta' for explicit response timestamp
ALTER TABLE public.respuestas_cuestionario
ADD COLUMN IF NOT EXISTS fecha_respuesta TIMESTAMP WITH TIME ZONE;

-- Rename 'usuario_id' to 'user_id' for consistency if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'respuestas_cuestionario' AND column_name = 'usuario_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'respuestas_cuestionario' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.respuestas_cuestionario RENAME COLUMN usuario_id TO user_id;
  END IF;
END $$;

-- Backfill 'fecha_respuesta' from 'created_at' for existing records
UPDATE public.respuestas_cuestionario
SET fecha_respuesta = created_at
WHERE fecha_respuesta IS NULL;

-- Set a default for 'fecha_respuesta' for new records
ALTER TABLE public.respuestas_cuestionario
ALTER COLUMN fecha_respuesta SET DEFAULT NOW();
