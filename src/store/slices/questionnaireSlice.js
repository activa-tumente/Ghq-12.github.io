import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Thunks asíncronos para operaciones del cuestionario
export const submitQuestionnaire = createAsyncThunk(
  'questionnaire/submit',
  async (questionnaireData, { rejectWithValue }) => {
    try {
      // Simular envío a API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Validar datos antes del envío
      if (!questionnaireData.answers || Object.keys(questionnaireData.answers).length === 0) {
        throw new Error('No hay respuestas para enviar');
      }
      
      // Simular respuesta exitosa
      return {
        id: Date.now().toString(),
        submittedAt: new Date().toISOString(),
        ...questionnaireData
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const loadQuestionnaire = createAsyncThunk(
  'questionnaire/load',
  async (questionnaireId, { rejectWithValue }) => {
    try {
      // Simular carga desde API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Datos simulados
      return {
        id: questionnaireId,
        answers: {},
        currentQuestion: 1,
        startTime: new Date().toISOString(),
        loadedAt: new Date().toISOString()
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Estado inicial
const initialState = {
  // Datos del cuestionario
  currentQuestion: 1,
  answers: {},
  totalQuestions: 40,
  
  // Metadatos
  startTime: null,
  endTime: null,
  timeSpent: 0,
  
  // Estado de la sesión
  isActive: false,
  isCompleted: false,
  isPaused: false,
  
  // Estado de carga
  loading: false,
  submitting: false,
  error: null,
  
  // Configuración
  settings: {
    autoSave: true,
    showProgress: true,
    allowBack: true,
    timeLimit: null
  },
  
  // Historial y navegación
  history: [],
  canGoBack: false,
  canGoForward: false,
  
  // Validación
  validation: {
    errors: {},
    isValid: true,
    requiredFields: []
  }
};

// Slice del cuestionario
const questionnaireSlice = createSlice({
  name: 'questionnaire',
  initialState,
  reducers: {
    // Navegación
    setCurrentQuestion: (state, action) => {
      const newQuestion = action.payload;
      
      // Validar rango de pregunta
      if (newQuestion >= 1 && newQuestion <= state.totalQuestions) {
        // Agregar al historial
        if (state.currentQuestion !== newQuestion) {
          state.history.push(state.currentQuestion);
        }
        
        state.currentQuestion = newQuestion;
        state.canGoBack = state.history.length > 0;
        state.canGoForward = newQuestion < state.totalQuestions;
      }
    },
    
    nextQuestion: (state) => {
      if (state.currentQuestion < state.totalQuestions) {
        state.history.push(state.currentQuestion);
        state.currentQuestion += 1;
        state.canGoBack = true;
        state.canGoForward = state.currentQuestion < state.totalQuestions;
      }
    },
    
    previousQuestion: (state) => {
      if (state.history.length > 0 && state.settings.allowBack) {
        state.currentQuestion = state.history.pop();
        state.canGoBack = state.history.length > 0;
        state.canGoForward = true;
      }
    },
    
    // Respuestas
    setAnswer: (state, action) => {
      const { questionId, answer, timestamp } = action.payload;
      
      state.answers[questionId] = {
        value: answer,
        timestamp: timestamp || new Date().toISOString(),
        questionNumber: questionId
      };
      
      // Limpiar errores de validación para esta pregunta
      if (state.validation.errors[questionId]) {
        delete state.validation.errors[questionId];
      }
      
      // Actualizar validación general
      state.validation.isValid = Object.keys(state.validation.errors).length === 0;
    },
    
    removeAnswer: (state, action) => {
      const questionId = action.payload;
      delete state.answers[questionId];
    },
    
    // Control de sesión
    startQuestionnaire: (state, action) => {
      state.isActive = true;
      state.startTime = new Date().toISOString();
      state.currentQuestion = 1;
      state.answers = {};
      state.history = [];
      state.error = null;
      
      // Aplicar configuración personalizada si se proporciona
      if (action.payload?.settings) {
        state.settings = { ...state.settings, ...action.payload.settings };
      }
    },
    
    pauseQuestionnaire: (state) => {
      state.isPaused = true;
    },
    
    resumeQuestionnaire: (state) => {
      state.isPaused = false;
    },
    
    completeQuestionnaire: (state) => {
      state.isCompleted = true;
      state.isActive = false;
      state.endTime = new Date().toISOString();
      
      // Calcular tiempo total
      if (state.startTime) {
        const start = new Date(state.startTime);
        const end = new Date(state.endTime);
        state.timeSpent = Math.floor((end - start) / 1000); // en segundos
      }
    },
    
    resetQuestionnaire: (state) => {
      return { ...initialState, settings: state.settings };
    },
    
    // Configuración
    updateSettings: (state, action) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    
    // Validación
    setValidationError: (state, action) => {
      const { questionId, error } = action.payload;
      state.validation.errors[questionId] = error;
      state.validation.isValid = false;
    },
    
    clearValidationErrors: (state) => {
      state.validation.errors = {};
      state.validation.isValid = true;
    },
    
    validateCurrentQuestion: (state) => {
      const currentAnswer = state.answers[state.currentQuestion];
      
      // Verificar si la pregunta actual es requerida y no tiene respuesta
      if (state.validation.requiredFields.includes(state.currentQuestion) && !currentAnswer) {
        state.validation.errors[state.currentQuestion] = 'Esta pregunta es obligatoria';
        state.validation.isValid = false;
      }
    },
    
    // Tiempo
    updateTimeSpent: (state) => {
      if (state.startTime && state.isActive && !state.isPaused) {
        const now = new Date();
        const start = new Date(state.startTime);
        state.timeSpent = Math.floor((now - start) / 1000);
      }
    },
    
    // Manejo de errores
    setError: (state, action) => {
      state.error = action.payload;
    },
    
    clearError: (state) => {
      state.error = null;
    }
  },
  
  extraReducers: (builder) => {
    // Submit questionnaire
    builder
      .addCase(submitQuestionnaire.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(submitQuestionnaire.fulfilled, (state, action) => {
        state.submitting = false;
        state.isCompleted = true;
        state.isActive = false;
        state.endTime = new Date().toISOString();
        
        // Calcular tiempo total
        if (state.startTime) {
          const start = new Date(state.startTime);
          const end = new Date(state.endTime);
          state.timeSpent = Math.floor((end - start) / 1000);
        }
      })
      .addCase(submitQuestionnaire.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload || 'Error al enviar el cuestionario';
      })
      
      // Load questionnaire
      .addCase(loadQuestionnaire.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadQuestionnaire.fulfilled, (state, action) => {
        state.loading = false;
        const { answers, currentQuestion, startTime } = action.payload;
        
        state.answers = answers || {};
        state.currentQuestion = currentQuestion || 1;
        state.startTime = startTime;
        state.isActive = true;
      })
      .addCase(loadQuestionnaire.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Error al cargar el cuestionario';
      });
  }
});

// Selectores
export const selectCurrentQuestion = (state) => state.questionnaire.currentQuestion;
export const selectAnswers = (state) => state.questionnaire.answers;
export const selectCurrentAnswer = (state) => state.questionnaire.answers[state.questionnaire.currentQuestion];
export const selectProgress = (state) => {
  const answered = Object.keys(state.questionnaire.answers).length;
  const total = state.questionnaire.totalQuestions;
  return { answered, total, percentage: Math.round((answered / total) * 100) };
};
export const selectIsCompleted = (state) => state.questionnaire.isCompleted;
export const selectIsActive = (state) => state.questionnaire.isActive;
export const selectTimeSpent = (state) => state.questionnaire.timeSpent;
export const selectCanNavigate = (state) => ({
  canGoBack: state.questionnaire.canGoBack && state.questionnaire.settings.allowBack,
  canGoForward: state.questionnaire.canGoForward
});
export const selectValidation = (state) => state.questionnaire.validation;
export const selectSettings = (state) => state.questionnaire.settings;
export const selectError = (state) => state.questionnaire.error;
export const selectLoading = (state) => state.questionnaire.loading;
export const selectSubmitting = (state) => state.questionnaire.submitting;

// Exportar acciones
export const {
  setCurrentQuestion,
  nextQuestion,
  previousQuestion,
  setAnswer,
  removeAnswer,
  startQuestionnaire,
  pauseQuestionnaire,
  resumeQuestionnaire,
  completeQuestionnaire,
  resetQuestionnaire,
  updateSettings,
  setValidationError,
  clearValidationErrors,
  validateCurrentQuestion,
  updateTimeSpent,
  setError,
  clearError
} = questionnaireSlice.actions;

export default questionnaireSlice.reducer;