import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Layout from './components/ui/Layout'
import Home from './components/ui/Home'

import Questionnaires from './components/admin/Questionnaires'
import QuestionnaireDetail from './components/admin/QuestionnaireDetail'
import QuestionnaireResults from './components/admin/QuestionnaireResults'
import QuestionnaireEdit from './components/admin/QuestionnaireEdit'
import UsersComponent from './components/admin/Users'
import RealTimeUsers from './components/admin/RealTimeUsers'
import Respuestas from './components/admin/Respuestas'
import RealTimeResponses from './components/admin/RealTimeResponses'
import QuestionnaireFlow from './components/questionnaire/QuestionnaireFlow'
import Admin from './components/admin/Admin'
import Login from './components/auth/Login'
import ThankYou from './components/questionnaire/ThankYou'
import NotFound from './components/ui/NotFound'
import Dashboard from './components/dashboard/Dashboard'


import ChartConfigTest from './components/debug/ChartConfigTest'

import ErrorBoundary from './components/ui/ErrorBoundary'
import MainApp from './components/MainApp'
import { supabase } from './api/supabase'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/auth/ProtectedRoute'

function App() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar conexión con Supabase
    const checkConnection = async () => {
      try {
        // Verificar conexión usando el endpoint de estado de Supabase
        await supabase.auth.getSession();
        console.log('✅ Conexión con Supabase establecida');
      } catch (error) {
        console.error('❌ Error conectando con Supabase:', error);
      } finally {
        setLoading(false)
      }
    }

    checkConnection()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando aplicación...</p>
        </div>
      </div>
    )
  }

  // Setup is bypassed for now - can be re-enabled later if needed

  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
          {/* Rutas con Layout (menú lateral) */}
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />


  
        <Route path="/chart-config-test" element={<ProtectedRoute><Layout><ChartConfigTest /></Layout></ProtectedRoute>} />


          {/* Cuestionarios */}
          <Route path="/cuestionarios" element={<ProtectedRoute><Layout><Questionnaires /></Layout></ProtectedRoute>} />
          <Route path="/cuestionarios/:id/resultados" element={<ProtectedRoute><Layout><QuestionnaireResults /></Layout></ProtectedRoute>} />
          <Route path="/cuestionarios/:id/editar" element={<ProtectedRoute><Layout><QuestionnaireEdit /></Layout></ProtectedRoute>} />
          <Route path="/cuestionario-detalle/:id" element={<ProtectedRoute><Layout><QuestionnaireDetail /></Layout></ProtectedRoute>} />

          {/* Usuarios - Versiones clásica y tiempo real */}
          <Route path="/usuarios" element={<ProtectedRoute><Layout><RealTimeUsers /></Layout></ProtectedRoute>} />
          <Route path="/usuarios-clasico" element={<ProtectedRoute><Layout><UsersComponent /></Layout></ProtectedRoute>} />

          {/* Respuestas - Versiones clásica y tiempo real */}
          <Route path="/respuestas" element={<ProtectedRoute><Layout><RealTimeResponses /></Layout></ProtectedRoute>} />
          <Route path="/respuestas-clasico" element={<ProtectedRoute><Layout><Respuestas /></Layout></ProtectedRoute>} />

          {/* Rutas sin Layout (páginas independientes) */}
          <Route path="/cuestionario/:token" element={<ErrorBoundary><QuestionnaireFlow /></ErrorBoundary>} />
          <Route path="/cuestionario-directo" element={<ErrorBoundary><QuestionnaireFlow /></ErrorBoundary>} />
          <Route path="/app" element={<ErrorBoundary><MainApp /></ErrorBoundary>} />
          <Route path="/admin" element={<ProtectedRoute><ErrorBoundary><Admin /></ErrorBoundary></ProtectedRoute>} />
          <Route path="/login" element={<ErrorBoundary><Login /></ErrorBoundary>} />
          <Route path="/gracias" element={<ErrorBoundary><ThankYou /></ErrorBoundary>} />
          <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
