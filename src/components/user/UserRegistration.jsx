import React, { useState } from 'react';
import { userHelpers } from '../../lib/userDatabase.js';
import { useNavigate } from 'react-router-dom';

const UserRegistration = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Datos del formulario
  const [formData, setFormData] = useState({
    // Datos básicos
    nombre: '', // Cambiado de nombres + apellidos a nombre completo
    documento: '',
    fecha_nacimiento: '', // Agregado fecha de nacimiento
    
    // Datos demográficos
    genero: '',
    
    // Datos laborales
    cargo: '',
    area: '',
    turno: '',
    antiguedad: '',
    tipo_contrato: '',
    nivel_educativo: '',
    
    // Datos de seguridad
    capacitaciones_seguridad: '',
    accidentes_previos: '',
    reporta_casi_accidentes: '',
    uso_epp: '',
    
    // Datos de percepción
    satisfaccion_laboral: '',
    motivacion_seguridad: '',
    confianza_gerencia: ''
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const nextStep = () => {
    setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Verificar si el usuario ya existe por documento
      const existingUser = await userHelpers.getUserByDocument(formData.documento);
      
      if (existingUser.success && existingUser.data) {
        // Usuario existe, redirigir al cuestionario
        navigate(`/questionnaire/${existingUser.data.id}`);
        return;
      }

      // Crear nuevo usuario con campos directos
      const newUser = await userHelpers.createUser({
        nombre: formData.nombres,
        apellidos: formData.apellidos,
        documento: formData.documento,
        edad: parseInt(formData.edad),
        genero: formData.genero,
        cargo: formData.cargo,
        area: formData.area,
        turno: formData.turno,
        antiguedad_empresa: parseInt(formData.antiguedad),
        tipo_contrato: formData.tipo_contrato,
        nivel_educativo: formData.nivel_educativo,
        metadata: {
          // Datos de seguridad
          capacitaciones_seguridad: formData.capacitaciones_seguridad,
          accidentes_previos: formData.accidentes_previos,
          reporta_casi_accidentes: formData.reporta_casi_accidentes,
          uso_epp: formData.uso_epp,
          
          // Datos de percepción
          satisfaccion_laboral: parseInt(formData.satisfaccion_laboral),
          motivacion_seguridad: parseInt(formData.motivacion_seguridad),
          confianza_gerencia: parseInt(formData.confianza_gerencia),
          
          // Metadata adicional
          fecha_registro_completo: new Date().toISOString()
        }
      });

      if (newUser.success) {
        navigate(`/questionnaire/${newUser.data.id}`);
      } else {
        setError(newUser.error || 'Error al crear usuario');
      }
    } catch (err) {
      setError(err.message || 'Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  // Renderizar paso actual
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Datos Básicos</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombres *</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.nombres}
                  onChange={(e) => handleInputChange('nombres', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Apellidos *</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.apellidos}
                  onChange={(e) => handleInputChange('apellidos', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Documento de Identidad *</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.documento}
                  onChange={(e) => handleInputChange('documento', e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={nextStep}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                disabled={!formData.nombres || !formData.apellidos || !formData.documento}
              >
                Siguiente
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Datos Demográficos</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Edad *</label>
                <input
                  type="number"
                  required
                  min="18"
                  max="70"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.edad}
                  onChange={(e) => handleInputChange('edad', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Género *</label>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.genero}
                  onChange={(e) => handleInputChange('genero', e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  <option value="masculino">Masculino</option>
                  <option value="femenino">Femenino</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={nextStep}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                disabled={!formData.edad || !formData.genero}
              >
                Siguiente
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Datos Laborales</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Cargo *</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.cargo}
                  onChange={(e) => handleInputChange('cargo', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Área/Departamento *</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.area}
                  onChange={(e) => handleInputChange('area', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Turno *</label>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.turno}
                  onChange={(e) => handleInputChange('turno', e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  <option value="diurno">Diurno</option>
                  <option value="nocturno">Nocturno</option>
                  <option value="mixto">Mixto</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Antigüedad en la empresa (años) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  max="50"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.antiguedad}
                  onChange={(e) => handleInputChange('antiguedad', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Tipo de Contrato *</label>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.tipo_contrato}
                  onChange={(e) => handleInputChange('tipo_contrato', e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  <option value="indefinido">Indefinido</option>
                  <option value="temporal">Temporal</option>
                  <option value="obra">Por obra/labor</option>
                  <option value="aprendizaje">Contrato de aprendizaje</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Nivel Educativo *</label>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.nivel_educativo}
                  onChange={(e) => handleInputChange('nivel_educativo', e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  <option value="primaria">Primaria</option>
                  <option value="secundaria">Secundaria</option>
                  <option value="tecnico">Técnico/Tecnólogo</option>
                  <option value="universitario">Universitario</option>
                  <option value="postgrado">Postgrado</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={nextStep}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                disabled={!formData.cargo || !formData.area || !formData.turno || !formData.antiguedad || !formData.tipo_contrato || !formData.nivel_educativo}
              >
                Siguiente
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Datos de Seguridad</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Capacitaciones en Seguridad (último año) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  max="20"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.capacitaciones_seguridad}
                  onChange={(e) => handleInputChange('capacitaciones_seguridad', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Accidentes Previos *</label>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.accidentes_previos}
                  onChange={(e) => handleInputChange('accidentes_previos', e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  <option value="ninguno">Ninguno</option>
                  <option value="uno">1 accidente</option>
                  <option value="dos">2 accidentes</option>
                  <option value="tres_o_mas">3 o más accidentes</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Reporta Casi-Accidentes *</label>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.reporta_casi_accidentes}
                  onChange={(e) => handleInputChange('reporta_casi_accidentes', e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  <option value="siempre">Siempre</option>
                  <option value="a_veces">A veces</option>
                  <option value="nunca">Nunca</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Uso de EPP *</label>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.uso_epp}
                  onChange={(e) => handleInputChange('uso_epp', e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  <option value="siempre">Siempre</option>
                  <option value="casi_siempre">Casi siempre</option>
                  <option value="a_veces">A veces</option>
                  <option value="nunca">Nunca</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={nextStep}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                disabled={!formData.capacitaciones_seguridad || !formData.accidentes_previos || !formData.reporta_casi_accidentes || !formData.uso_epp}
              >
                Siguiente
              </button>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Percepción Laboral</h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Satisfacción Laboral (1-10) *</label>
                <input
                  type="range"
                  required
                  min="1"
                  max="10"
                  className="w-full"
                  value={formData.satisfaccion_laboral}
                  onChange={(e) => handleInputChange('satisfaccion_laboral', e.target.value)}
                />
                <div className="flex justify-between text-xs text-gray-600">
                  <span>1 (Muy baja)</span>
                  <span>{formData.satisfaccion_laboral || '5'}</span>
                  <span>10 (Muy alta)</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Motivación en Seguridad (1-10) *</label>
                <input
                  type="range"
                  required
                  min="1"
                  max="10"
                  className="w-full"
                  value={formData.motivacion_seguridad}
                  onChange={(e) => handleInputChange('motivacion_seguridad', e.target.value)}
                />
                <div className="flex justify-between text-xs text-gray-600">
                  <span>1 (Muy baja)</span>
                  <span>{formData.motivacion_seguridad || '5'}</span>
                  <span>10 (Muy alta)</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Confianza en la Gerencia (1-10) *</label>
                <input
                  type="range"
                  required
                  min="1"
                  max="10"
                  className="w-full"
                  value={formData.confianza_gerencia}
                  onChange={(e) => handleInputChange('confianza_gerencia', e.target.value)}
                />
                <div className="flex justify-between text-xs text-gray-600">
                  <span>1 (Muy baja)</span>
                  <span>{formData.confianza_gerencia || '5'}</span>
                  <span>10 (Muy alta)</span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Anterior
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                disabled={loading || !formData.satisfaccion_laboral || !formData.motivacion_seguridad || !formData.confianza_gerencia}
              >
                {loading ? 'Registrando...' : 'Completar Registro'}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-2xl">
        <h2 className="text-2xl font-bold text-center mb-6">Registro de Usuario</h2>
        
        {/* Indicador de progreso */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Paso {currentStep} de 5</span>
            <span className="text-sm font-medium">
              {['Datos Básicos', 'Datos Demográficos', 'Datos Laborales', 'Seguridad', 'Percepción'][currentStep - 1]}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 5) * 100}%` }}
            ></div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {renderStep()}
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {typeof error === 'string' ? error : error?.message || 'Error en el registro'}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default UserRegistration;