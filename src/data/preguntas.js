export const CATEGORIAS = {
  SALUD_GENERAL: 'SALUD_GENERAL'
}

export const ESCALA_GHQ = [
  { valor: 0, texto: 'Nunca' },
  { valor: 1, texto: 'Casi nunca' },
  { valor: 2, texto: 'Casi siempre' },
  { valor: 3, texto: 'Siempre' }
]

export const PREGUNTAS = [
  {
    id: 1,
    texto_pregunta: "He podido concentrarme bien en mi trabajo y en mis tareas diarias.",
    categoria: CATEGORIAS.SALUD_GENERAL
  },
  {
    id: 2,
    texto_pregunta: "Mis preocupaciones me han quitado el sueño.",
    categoria: CATEGORIAS.SALUD_GENERAL
  },
  {
    id: 3,
    texto_pregunta: "Me siento útil en mi vida y en el trabajo.",
    categoria: CATEGORIAS.SALUD_GENERAL
  },
  {
    id: 4,
    texto_pregunta: "Me he sentido capaz de tomar decisiones con claridad.",
    categoria: CATEGORIAS.SALUD_GENERAL
  },
  {
    id: 5,
    texto_pregunta: "Me he sentido nervioso(a) o muy tenso(a) con frecuencia.",
    categoria: CATEGORIAS.SALUD_GENERAL
  },
  {
    id: 6,
    texto_pregunta: "He sentido que no puedo superar las dificultades que tengo.",
    categoria: CATEGORIAS.SALUD_GENERAL
  },
  {
    id: 7,
    texto_pregunta: "He disfrutado de mis actividades habituales del día a día.",
    categoria: CATEGORIAS.SALUD_GENERAL
  },
  {
    id: 8,
    texto_pregunta: "He sido capaz de afrontar mis problemas de forma adecuada.",
    categoria: CATEGORIAS.SALUD_GENERAL
  },
  {
    id: 9,
    texto_pregunta: "Me he sentido triste o deprimido(a).",
    categoria: CATEGORIAS.SALUD_GENERAL
  },
  {
    id: 10,
    texto_pregunta: "He perdido confianza en mí mismo(a).",
    categoria: CATEGORIAS.SALUD_GENERAL
  },
  {
    id: 11,
    texto_pregunta: "He pensado que no valgo para nada.",
    categoria: CATEGORIAS.SALUD_GENERAL
  },
  {
    id: 12,
    texto_pregunta: "Me he sentido razonablemente feliz considerando mi situación.",
    categoria: CATEGORIAS.SALUD_GENERAL
  }
]

export const NOMBRES_CATEGORIAS = {
  [CATEGORIAS.SALUD_GENERAL]: 'Salud General'
}