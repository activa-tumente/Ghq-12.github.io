/**
 * TypeScript type definitions for Questionnaire data structures
 */

import { BaseEntity } from './dashboard';

// Questionnaire types
export interface Cuestionario extends BaseEntity {
  titulo: string;
  descripcion?: string;
  estado: 'borrador' | 'activo' | 'pausado' | 'finalizado';
  fecha_inicio?: string;
  fecha_fin?: string;
  configuracion?: CuestionarioConfiguracion;
  estadisticas?: EstadisticasCuestionario;
  preguntas?: Pregunta[];
  total_preguntas?: number;
  total_respuestas?: number;
  promedio_tiempo?: number;
  promedio_puntuacion?: number;
}

export interface CuestionarioConfiguracion {
  tiempo_limite?: number; // en minutos
  permitir_pausa?: boolean;
  mostrar_progreso?: boolean;
  aleatorizar_preguntas?: boolean;
  requiere_todas_respuestas?: boolean;
  enviar_recordatorios?: boolean;
  frecuencia_recordatorios?: number; // en días
  mensaje_bienvenida?: string;
  mensaje_finalizacion?: string;
}

export interface EstadisticasCuestionario {
  total_invitados: number;
  total_iniciados: number;
  total_completados: number;
  tasa_participacion: number;
  tasa_completado: number;
  tiempo_promedio: number;
  puntuacion_promedio: number;
  ultima_actualizacion: string;
}

// Question types
export interface Pregunta extends BaseEntity {
  cuestionario_id: string;
  texto: string;
  tipo: TipoPregunta;
  categoria: string;
  subcategoria?: string;
  factor_riesgo?: string;
  orden: number;
  requerida: boolean;
  opciones?: OpcionRespuesta[];
  configuracion?: ConfiguracionPregunta;
  estadisticas?: EstadisticasPregunta;
}

export type TipoPregunta = 
  | 'escala_likert' 
  | 'multiple_choice' 
  | 'single_choice' 
  | 'text' 
  | 'number' 
  | 'boolean' 
  | 'rating';

export interface OpcionRespuesta {
  id: string;
  texto: string;
  valor: number;
  orden: number;
  color?: string;
}

export interface ConfiguracionPregunta {
  escala_minima?: number;
  escala_maxima?: number;
  etiqueta_minima?: string;
  etiqueta_maxima?: string;
  permitir_comentarios?: boolean;
  longitud_maxima_texto?: number;
  validacion_personalizada?: string;
}

export interface EstadisticasPregunta {
  total_respuestas: number;
  promedio: number;
  mediana: number;
  moda: number;
  desviacion_estandar: number;
  distribucion: Record<string, number>;
  tiempo_promedio_respuesta: number;
}

// Response types
export interface RespuestaCuestionario extends BaseEntity {
  persona_id: string;
  cuestionario_id: string;
  pregunta_id: string;
  valor: number | string | boolean;
  texto_adicional?: string;
  tiempo_respuesta?: number; // en segundos
  orden_respuesta?: number;
  ip_address?: string;
  user_agent?: string;
}

export interface SesionCuestionario extends BaseEntity {
  persona_id: string;
  cuestionario_id: string;
  token: string;
  estado: 'iniciado' | 'en_progreso' | 'pausado' | 'completado' | 'abandonado';
  fecha_inicio: string;
  fecha_ultima_actividad: string;
  fecha_completado?: string;
  progreso: number; // 0-100
  tiempo_total?: number; // en segundos
  pregunta_actual?: number;
  respuestas_guardadas: number;
  ip_address?: string;
  user_agent?: string;
}

// Form and validation types
export interface FormularioCuestionario {
  titulo: string;
  descripcion: string;
  estado: Cuestionario['estado'];
  fecha_inicio?: string;
  fecha_fin?: string;
  configuracion: CuestionarioConfiguracion;
}

export interface ErrorValidacion {
  campo: string;
  mensaje: string;
  tipo: 'required' | 'invalid' | 'min' | 'max' | 'pattern';
}

export interface ResultadoValidacion {
  valido: boolean;
  errores: ErrorValidacion[];
}

// Filter and search types
export interface FiltrosCuestionario {
  estado?: Cuestionario['estado'][];
  fecha_inicio?: string;
  fecha_fin?: string;
  busqueda?: string;
  categoria?: string;
  orden?: 'asc' | 'desc';
  campo_orden?: 'titulo' | 'fecha_inicio' | 'fecha_fin' | 'total_respuestas';
}

export interface OpcionesPaginacion {
  pagina: number;
  limite: number;
  total?: number;
}

export interface ResultadoBusqueda<T> {
  datos: T[];
  total: number;
  pagina: number;
  limite: number;
  total_paginas: number;
}

// Action types for questionnaire management
export interface AccionCuestionario {
  tipo: 'crear' | 'editar' | 'eliminar' | 'duplicar' | 'activar' | 'pausar' | 'finalizar';
  cuestionario_id?: string;
  datos?: Partial<Cuestionario>;
  confirmacion_requerida?: boolean;
}

export interface ResultadoAccion {
  exito: boolean;
  mensaje: string;
  datos?: Cuestionario;
  errores?: ErrorValidacion[];
}

// Hook return types
export interface UseQuestionnaireReturn {
  // State
  cuestionarios: Cuestionario[];
  loading: boolean;
  error: string | null;
  
  // Filtered data
  cuestionariosFiltrados: Cuestionario[];
  totalCuestionarios: number;
  
  // Actions
  cargarCuestionarios: () => Promise<void>;
  crearCuestionario: (datos: FormularioCuestionario) => Promise<ResultadoAccion>;
  editarCuestionario: (id: string, datos: Partial<FormularioCuestionario>) => Promise<ResultadoAccion>;
  eliminarCuestionario: (id: string) => Promise<ResultadoAccion>;
  duplicarCuestionario: (id: string) => Promise<ResultadoAccion>;
  cambiarEstado: (id: string, estado: Cuestionario['estado']) => Promise<ResultadoAccion>;
  
  // Filters
  filtros: FiltrosCuestionario;
  aplicarFiltros: (filtros: Partial<FiltrosCuestionario>) => void;
  limpiarFiltros: () => void;
  
  // Pagination
  paginacion: OpcionesPaginacion;
  cambiarPagina: (pagina: number) => void;
  cambiarLimite: (limite: number) => void;
}

export interface UseQuestionnaireFormReturn {
  // Form state
  formulario: FormularioCuestionario;
  errores: ErrorValidacion[];
  guardando: boolean;
  
  // Form actions
  actualizarCampo: <K extends keyof FormularioCuestionario>(
    campo: K, 
    valor: FormularioCuestionario[K]
  ) => void;
  validarFormulario: () => ResultadoValidacion;
  guardarCuestionario: () => Promise<ResultadoAccion>;
  resetearFormulario: () => void;
  
  // Validation helpers
  obtenerErrorCampo: (campo: string) => string | null;
  esCampoValido: (campo: string) => boolean;
}

// Component prop types
export interface QuestionnaireCardProps {
  cuestionario: Cuestionario;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onChangeStatus?: (id: string, estado: Cuestionario['estado']) => void;
  onViewDetails?: (id: string) => void;
  className?: string;
}

export interface QuestionnaireFiltersProps {
  filtros: FiltrosCuestionario;
  onFiltrosChange: (filtros: Partial<FiltrosCuestionario>) => void;
  onLimpiarFiltros: () => void;
  loading?: boolean;
  className?: string;
}

export interface QuestionnaireFormProps {
  cuestionario?: Cuestionario;
  onSubmit: (datos: FormularioCuestionario) => Promise<ResultadoAccion>;
  onCancel: () => void;
  loading?: boolean;
  className?: string;
}

// Export utility types
export type CuestionarioEstado = Cuestionario['estado'];
export type CuestionarioSinId = Omit<Cuestionario, 'id' | 'created_at' | 'updated_at'>;
export type CuestionarioActualizable = Partial<Pick<Cuestionario, 'titulo' | 'descripcion' | 'estado' | 'fecha_inicio' | 'fecha_fin' | 'configuracion'>>;