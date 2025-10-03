import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Settings,
  Trash2,
  Plus,
  BarChart3
} from 'lucide-react';
import { SupabaseSetup } from '../../utils/SupabaseSetup';

const DatabaseSetup = ({ onComplete }) => {
  const [status, setStatus] = useState('checking'); // checking, ready, error, setup
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Verificar estado inicial de la base de datos
  useEffect(() => {
    checkDatabaseStatus();
  }, []);

  const checkDatabaseStatus = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await SupabaseSetup.verifyTables();
      
      if (result.success) {
        const statsResult = await SupabaseSetup.getDatabaseStats();
        
        if (statsResult.success) {
          setStats(statsResult.stats);
          
          // Si hay datos, marcar como listo
          if (statsResult.stats.totalUsuarios > 0) {
            setStatus('ready');
          } else {
            setStatus('setup');
          }
        } else {
          setStatus('error');
          setError(statsResult.error);
        }
      } else {
        setStatus('error');
        setError(result.error);
      }
    } catch (err) {
      setStatus('error');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const setupDatabase = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await SupabaseSetup.setupDatabase();
      
      if (result.success) {
        setStats(result.stats);
        setStatus('ready');
        
        // Notificar que la configuración está completa
        if (onComplete) {
          onComplete(result);
        }
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearDatabase = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await SupabaseSetup.clearAllData();
      
      if (result.success) {
        setStats({ totalUsuarios: 0, totalRespuestas: 0, usuariosConRespuestas: 0, tasaParticipacion: 0 });
        setStatus('setup');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const continueToApp = () => {
    if (onComplete) {
      onComplete({ success: true, message: 'Continuando con datos existentes' });
    }
  };

  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando configuración de base de datos...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Error de Configuración</h2>
            <p className="text-gray-600 mb-6">
              No se pudo conectar con la base de datos de Supabase.
            </p>
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm text-red-700 font-medium mb-2">Detalles del error:</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            
            <div className="space-y-3">
              <button
                onClick={checkDatabaseStatus}
                disabled={loading}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Reintentar Conexión
              </button>
              
              <div className="text-sm text-gray-500">
                <p className="mb-2">Verifica que:</p>
                <ul className="list-disc list-inside space-y-1 text-left">
                  <li>Las variables de entorno estén configuradas correctamente</li>
                  <li>Supabase esté funcionando</li>
                  <li>Las tablas 'usuarios' y 'respuestas_cuestionario' existan</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'ready') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Base de Datos Configurada</h2>
            <p className="text-gray-600">
              La conexión con Supabase está funcionando correctamente y hay datos disponibles.
            </p>
          </div>

          {/* Estadísticas */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.totalUsuarios}</div>
                <div className="text-sm text-blue-700">Usuarios</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{stats.totalRespuestas}</div>
                <div className="text-sm text-green-700">Respuestas</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.usuariosConRespuestas}</div>
                <div className="text-sm text-purple-700">Participantes</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.tasaParticipacion}%</div>
                <div className="text-sm text-yellow-700">Participación</div>
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="space-y-4">
            <button
              onClick={continueToApp}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-lg font-medium"
            >
              <BarChart3 className="w-5 h-5" />
              Continuar a la Aplicación
            </button>
            
            <div className="flex gap-4">
              <button
                onClick={checkDatabaseStatus}
                disabled={loading}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Actualizar Stats
              </button>
              
              <button
                onClick={clearDatabase}
                disabled={loading}
                className="flex-1 bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Limpiar Datos
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'setup') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <Database className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Configuración Inicial</h2>
            <p className="text-gray-600 mb-6">
              La base de datos está vacía. ¿Deseas crear datos de ejemplo para comenzar?
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-blue-700 font-medium mb-2">Los datos de ejemplo incluyen:</p>
              <ul className="text-sm text-blue-600 space-y-1">
                <li>• 5 usuarios con diferentes perfiles</li>
                <li>• Respuestas GHQ-12 de muestra</li>
                <li>• Datos de diferentes áreas y turnos</li>
                <li>• Métricas para probar el dashboard</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={setupDatabase}
                disabled={loading}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {loading ? 'Creando Datos...' : 'Crear Datos de Ejemplo'}
              </button>
              
              <button
                onClick={continueToApp}
                className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Continuar sin Datos
              </button>
            </div>
            
            {loading && (
              <div className="mt-4 text-sm text-gray-500">
                <div className="animate-pulse">Configurando base de datos...</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default DatabaseSetup;