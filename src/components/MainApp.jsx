/**
 * Componente principal que integra todo el flujo del cuestionario
 * Incluye registro de usuarios, cuestionario y dashboard
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from '../store';
import { supabase } from '../api/supabase';

// Componentes
import UserRegistration from './user/UserRegistration';
import IntegratedQuestionnaireFlow from './questionnaire/IntegratedQuestionnaireFlow';
import QuestionnaireSubmission from './questionnaire/QuestionnaireSubmission';
import Dashboard from './dashboard/Dashboard';

// Iconos
import { 
  Home, 
  Users, 
  FileText, 
  BarChart3, 
  Settings, 
  LogOut,
  Menu,
  X
} from 'lucide-react';

const MainApp = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState('home'); // 'home', 'register', 'questionnaire'

  /**
   * Verificar autenticación al cargar
   */
  useEffect(() => {
    checkAuthentication();
  }, []);

  /**
   * Verificar si hay un usuario autenticado
   */
  const checkAuthentication = async () => {
    try {
      // Verificar si hay datos de usuario en localStorage
      const userData = localStorage.getItem('currentUser');
      if (userData) {
        const user = JSON.parse(userData);
        setCurrentUser(user);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error verificando autenticación:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Manejar login exitoso
   */
  const handleLoginSuccess = (userData) => {
    setCurrentUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('currentUser', JSON.stringify(userData));
  };

  /**
   * Manejar logout
   */
  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('questionnaireProgress');
    setCurrentView('home');
  };

  /**
   * Navegación
   */
  const navigate = (view) => {
    setCurrentView(view);
    setSidebarOpen(false);
  };

  /**
   * Componente de navegación
   */
  const Navigation = () => {
    const menuItems = [
      { id: 'home', label: 'Inicio', icon: Home },
      { id: 'register', label: 'Registro', icon: Users },
      { id: 'questionnaire', label: 'Cuestionario', icon: FileText },
      { id: 'dashboard', label: 'Dashboard', icon: BarChart3 }
    ];

    return (
      <>
        {/* Sidebar para móvil */}
        <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
          <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl">
            <div className="flex h-16 items-center justify-between px-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Cuestionario BAT-7</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="flex-1 px-4 py-6">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.id)}
                    className={`w-full flex items-center px-4 py-3 text-left rounded-lg mb-2 transition-colors ${
                      currentView === item.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
            {isAuthenticated && (
              <div className="border-t px-4 py-4">
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-900">{currentUser?.nombre || currentUser?.email}</p>
                  <p className="text-xs text-gray-500">{currentUser?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar para desktop */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
          <div className="flex flex-col flex-grow bg-white border-r border-gray-200 shadow-sm">
            <div className="flex h-16 items-center px-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Cuestionario BAT-7</h2>
            </div>
            <nav className="flex-1 px-6 py-6">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.id)}
                    className={`w-full flex items-center px-4 py-3 text-left rounded-lg mb-2 transition-colors ${
                      currentView === item.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
            {isAuthenticated && (
              <div className="border-t px-6 py-4">
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-900">{currentUser?.nombre || currentUser?.email}</p>
                  <p className="text-xs text-gray-500">{currentUser?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </>
    );
  };

  /**
   * Header móvil
   */
  const MobileHeader = () => (
    <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(true)}
          className="text-gray-500 hover:text-gray-700"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Cuestionario BAT-7</h1>
        <div className="w-6"></div>
      </div>
    </div>
  );

  /**
   * Página de inicio
   */
  const HomePage = () => (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Cuestionario de Comportamiento Seguro BAT-7
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Sistema de evaluación psicológica para medir comportamientos de seguridad
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Registro</h3>
          <p className="text-gray-600 mb-4">Registra tus datos para comenzar el cuestionario</p>
          <button
            onClick={() => navigate('register')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Comenzar
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Cuestionario</h3>
          <p className="text-gray-600 mb-4">Responde las 12 preguntas del cuestionario BAT-7</p>
          <button
            onClick={() => navigate('questionnaire')}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Responder
          </button>
        </div>


      </div>

      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Acerca del Cuestionario BAT-7</h2>
        <div className="prose max-w-none text-gray-600">
          <p className="mb-4">
            El cuestionario BAT-7 (Behavioral Assessment Tool) es una herramienta de evaluación 
            psicológica diseñada para medir comportamientos de seguridad en diferentes contextos.
          </p>
          <p className="mb-4">
            Consta de 12 preguntas que evalúan diferentes aspectos del comportamiento seguro, 
            con una escala de respuesta de 0 a 3 puntos:
          </p>
          <ul className="list-disc list-inside mb-4">
            <li><strong>0 - Nunca:</strong> El comportamiento nunca ocurre</li>
            <li><strong>1 - Casi nunca:</strong> El comportamiento ocurre raramente</li>
            <li><strong>2 - Algunas veces:</strong> El comportamiento ocurre ocasionalmente</li>
            <li><strong>3 - Frecuentemente:</strong> El comportamiento ocurre regularmente</li>
          </ul>
          <p>
            Los resultados se interpretan en tres niveles de riesgo: Bajo (0-12), 
            Moderado (13-24) y Alto (25-36).
          </p>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando aplicación...</p>
        </div>
      </div>
    );
  }

  return (
    <Provider store={store}>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <MobileHeader />
        
        {/* Contenido principal */}
        <div className="lg:pl-64">
          <main className="p-6">
            {currentView === 'home' && <HomePage />}
            {currentView === 'register' && (
              <UserRegistration 
                onRegistrationSuccess={handleLoginSuccess}
              />
            )}
            {currentView === 'questionnaire' && (
              <IntegratedQuestionnaireFlow 
                currentUser={currentUser}
                onUserUpdate={setCurrentUser}
              />
            )}
            {currentView === 'dashboard' && (
              <Dashboard />
            )}

          </main>
        </div>
      </div>
    </Provider>
  );
};

export default MainApp;