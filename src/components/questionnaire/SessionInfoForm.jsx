import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { startQuestionnaire } from '../../store/slices/questionnaireSlice';
import { User, Building, Clock, Calendar, Users } from 'lucide-react';

const SessionInfoForm = ({ onComplete }) => {
  const dispatch = useDispatch();
  const [sessionInfo, setSessionInfo] = useState({
    empleadoId: '',
    nombre: '',
    area: '',
    turno: '',
    genero: '',
    edad: '',
    experiencia: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field, value) => {
    setSessionInfo(prev => ({ ...prev, [field]: value }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!sessionInfo.empleadoId.trim()) {
      newErrors.empleadoId = 'El ID de empleado es requerido';
    }
    
    if (!sessionInfo.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }
    
    if (!sessionInfo.area) {
      newErrors.area = 'Debe seleccionar un área';
    }
    
    if (!sessionInfo.turno) {
      newErrors.turno = 'Debe seleccionar un turno';
    }
    
    if (!sessionInfo.genero) {
      newErrors.genero = 'Debe seleccionar un género';
    }
    
    if (!sessionInfo.edad) {
      newErrors.edad = 'Debe seleccionar un rango de edad';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Simular validación del servidor
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Iniciar el cuestionario
      dispatch(startQuestionnaire());
      
      // Notificar al componente padre que se completó el formulario
      onComplete();
    } catch (error) {
      console.error('Error al validar información de sesión:', error);
      setErrors({ general: 'Error al validar la información. Intente nuevamente.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const areas = [
    { value: 'administracion', label: 'Administración' },
    { value: 'produccion', label: 'Producción' },
    { value: 'calidad', label: 'Control de Calidad' },
    { value: 'operaciones', label: 'Operaciones' },
    { value: 'mantenimiento', label: 'Mantenimiento' },
    { value: 'seguridad', label: 'Seguridad Industrial' },
    { value: 'recursos_humanos', label: 'Recursos Humanos' },
    { value: 'logistica', label: 'Logística' },
    { value: 'otro', label: 'Otro' }
  ];

  const turnos = [
    { value: 'mañana', label: 'Mañana (6:00 - 14:00)' },
    { value: 'tarde', label: 'Tarde (14:00 - 22:00)' },
    { value: 'noche', label: 'Noche (22:00 - 6:00)' },
    { value: 'rotativo', label: 'Rotativo' },
    { value: 'administrativo', label: 'Administrativo (8:00 - 17:00)' }
  ];

  const generos = [
    { value: 'masculino', label: 'Masculino' },
    { value: 'femenino', label: 'Femenino' },
    { value: 'otro', label: 'Otro' },
    { value: 'prefiero_no_decir', label: 'Prefiero no decir' }
  ];

  const edades = [
    { value: '18-25', label: '18-25 años' },
    { value: '26-35', label: '26-35 años' },
    { value: '36-45', label: '36-45 años' },
    { value: '46-55', label: '46-55 años' },
    { value: '56-65', label: '56-65 años' },
    { value: '65+', label: 'Más de 65 años' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Información de Sesión
          </h1>
          <p className="text-gray-600">
            Por favor complete la siguiente información antes de comenzar la evaluación CSBC Cuestionario de Seguridad Basada en el Comportamiento
          </p>
        </div>

        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600 text-sm">{errors.general}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ID de Empleado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              ID de Empleado *
            </label>
            <input
              type="text"
              value={sessionInfo.empleadoId}
              onChange={(e) => handleInputChange('empleadoId', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.empleadoId ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Ingrese su ID de empleado"
            />
            {errors.empleadoId && (
              <p className="text-red-500 text-sm mt-1">{errors.empleadoId}</p>
            )}
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Nombre Completo *
            </label>
            <input
              type="text"
              value={sessionInfo.nombre}
              onChange={(e) => handleInputChange('nombre', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.nombre ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Ingrese su nombre completo"
            />
            {errors.nombre && (
              <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>
            )}
          </div>

          {/* Área */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Building className="w-4 h-4 inline mr-2" />
              Área de Trabajo *
            </label>
            <select
              value={sessionInfo.area}
              onChange={(e) => handleInputChange('area', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.area ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            >
              <option value="">Seleccione su área</option>
              {areas.map(area => (
                <option key={area.value} value={area.value}>
                  {area.label}
                </option>
              ))}
            </select>
            {errors.area && (
              <p className="text-red-500 text-sm mt-1">{errors.area}</p>
            )}
          </div>

          {/* Turno */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 inline mr-2" />
              Turno de Trabajo *
            </label>
            <select
              value={sessionInfo.turno}
              onChange={(e) => handleInputChange('turno', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.turno ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            >
              <option value="">Seleccione su turno</option>
              {turnos.map(turno => (
                <option key={turno.value} value={turno.value}>
                  {turno.label}
                </option>
              ))}
            </select>
            {errors.turno && (
              <p className="text-red-500 text-sm mt-1">{errors.turno}</p>
            )}
          </div>

          {/* Género */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="w-4 h-4 inline mr-2" />
              Género *
            </label>
            <select
              value={sessionInfo.genero}
              onChange={(e) => handleInputChange('genero', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.genero ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            >
              <option value="">Seleccione su género</option>
              {generos.map(genero => (
                <option key={genero.value} value={genero.value}>
                  {genero.label}
                </option>
              ))}
            </select>
            {errors.genero && (
              <p className="text-red-500 text-sm mt-1">{errors.genero}</p>
            )}
          </div>

          {/* Edad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Rango de Edad *
            </label>
            <select
              value={sessionInfo.edad}
              onChange={(e) => handleInputChange('edad', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.edad ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            >
              <option value="">Seleccione su rango de edad</option>
              {edades.map(edad => (
                <option key={edad.value} value={edad.value}>
                  {edad.label}
                </option>
              ))}
            </select>
            {errors.edad && (
              <p className="text-red-500 text-sm mt-1">{errors.edad}</p>
            )}
          </div>

          {/* Botón de envío */}
          <div className="pt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Validando información...
                </>
              ) : (
                <>
                  <Clock className="w-5 h-5" />
                  Comenzar Evaluación
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            * Campos obligatorios. Esta información es confidencial y se utiliza únicamente para fines estadísticos.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SessionInfoForm;