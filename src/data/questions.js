// Cuestionario de Salud General (GHQ-12) - 12 preguntas
// Dividido en 5 dimensiones según especificaciones

export const questions = [
  {
    id: 1,
    category: 'salud_general',
    text: 'He podido concentrarme bien en mi trabajo y en mis tareas diarias.',
    dimension: 'Salud General'
  },
  {
    id: 2,
    category: 'salud_general',
    text: 'Mis preocupaciones me han quitado el sueño.',
    dimension: 'Salud General'
  },
  {
    id: 3,
    category: 'salud_general',
    text: 'Me siento útil en mi vida y en el trabajo.',
    dimension: 'Salud General'
  },
  {
    id: 4,
    category: 'salud_general',
    text: 'Me he sentido capaz de tomar decisiones con claridad.',
    dimension: 'Salud General'
  },
  {
    id: 5,
    category: 'salud_general',
    text: 'Me he sentido nervioso(a) o muy tenso(a) con frecuencia.',
    dimension: 'Salud General'
  },
  {
    id: 6,
    category: 'salud_general',
    text: 'He sentido que no puedo superar las dificultades que tengo.',
    dimension: 'Salud General'
  },
  {
    id: 7,
    category: 'salud_general',
    text: 'He disfrutado de mis actividades habituales del día a día.',
    dimension: 'Salud General'
  },
  {
    id: 8,
    category: 'salud_general',
    text: 'He sido capaz de afrontar mis problemas de forma adecuada.',
    dimension: 'Salud General'
  },
  {
    id: 9,
    category: 'salud_general',
    text: 'Me he sentido triste o deprimido(a).',
    dimension: 'Salud General'
  },
  {
    id: 10,
    category: 'salud_general',
    text: 'He perdido confianza en mí mismo(a).',
    dimension: 'Salud General'
  },
  {
    id: 11,
    category: 'salud_general',
    text: 'He pensado que no valgo para nada.',
    dimension: 'Salud General'
  },
  {
    id: 12,
    category: 'salud_general',
    text: 'Me he sentido razonablemente feliz considerando mi situación.',
    dimension: 'Salud General'
  }
];

// Definición de categorías con rangos de preguntas
export const questionCategories = [
  {
    name: 'Salud General',
    range: [1, 12],
    questions: 12,
    color: 'blue'
  }
];

// Opciones de respuesta Likert
export const likertOptions = [
  { value: 0, label: 'Nunca' },
  { value: 1, label: 'Casi nunca' },
  { value: 2, label: 'Casi siempre' },
  { value: 3, label: 'Siempre' }
];

// Categorías del cuestionario (legacy)
export const categories = {
  salud_general: {
    name: 'Salud General',
    description: 'Evalúa el estado general de salud mental y bienestar psicológico',
    questions: 12
  }
};

export default questions;