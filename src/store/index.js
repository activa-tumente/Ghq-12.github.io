import { configureStore, createSlice } from '@reduxjs/toolkit'


// Slice para el cuestionario
const questionnaireSlice = createSlice({
  name: 'questionnaire',
  initialState: {
    currentQuestion: 0,
    answers: {},
    timeSpent: 0,
    isCompleted: false
  },
  reducers: {
    setCurrentQuestion: (state, action) => {
      state.currentQuestion = action.payload
    },
    setAnswer: (state, action) => {
      const { questionId, answer } = action.payload
      state.answers[questionId] = answer
    },
    setTimeSpent: (state, action) => {
      state.timeSpent = action.payload
    },
    setCompleted: (state, action) => {
      state.isCompleted = action.payload
    },
    resetQuestionnaire: (state) => {
      state.currentQuestion = 0
      state.answers = {}
      state.timeSpent = 0
      state.isCompleted = false
    }
  }
})

// Configurar el store
export const store = configureStore({
  reducer: {
    questionnaire: questionnaireSlice.reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],

      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
})

// Exportar acciones
export const {
  setCurrentQuestion,
  setAnswer,
  setTimeSpent,
  setCompleted,
  resetQuestionnaire
} = questionnaireSlice.actions

export default store