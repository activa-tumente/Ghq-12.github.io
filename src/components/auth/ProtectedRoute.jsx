import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Login from './Login';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  console.log('🛡️ ProtectedRoute - user:', user, 'loading:', loading, 'path:', location.pathname);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="mx-auto h-14 w-14 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl">🔒</div>
          <div className="bg-white p-6 rounded-xl shadow border">
            <h2 className="text-lg font-semibold text-gray-900">Comprobando acceso</h2>
            <p className="text-sm text-gray-600 mt-2">Estamos verificando tu sesión...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    // Mostrar Login directamente en la ruta protegida
    return <Login redirectTo={location.pathname} />;
  }

  return children;
};

export default ProtectedRoute;

