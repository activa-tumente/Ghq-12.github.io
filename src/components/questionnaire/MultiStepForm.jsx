import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { startQuestionnaire } from '../../store/slices/questionnaireSlice';
import { supabase } from '../../api/supabase';
import AccessibleModal, { useModal } from '../ui/AccessibleModal'
import { useScreenReaderAnnouncer } from '../ui/ScreenReaderAnnouncer';
import { 
  User, 
  Building, 
  Clock, 
  Calendar, 
  Users, 
  Shield, 
  Heart, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle
} from 'lucide-react';

// Estructura de cargos por área
const cargosPorArea = {
  'Administración y Finanzas': [
    'Administrador',
    'Asistente Administrativo',
    'Asistente de Gerencia',
    'Coordinador(a) de área',
    'Gerente de área',
    'Gerente de Operaciones',
    'Asistente contable',
    'Facturador',
    'Almacenista',
    'Cajero(a)',
    'Company Man'
  ],
  'Operaciones y Producción': [
    'Vigilante',
    'Patrullero',
    'Patrón de Bote',
    'Pescador',
    'Oficial de Marina',
    'Operador(a)',
    'Operador de Equipo',
    'Operador de Maquinaria',
    'Perforador',
    'Ayudante de Perforador',
    'Soldador',
    'Maniobrista',
    'Pailero',
    'Electromecánico',
    'Electricista',
    'Mecánico(a)',
    'Ayudante de Mecánico',
    'Ayudante de Mantenimiento',
    'Ayudante de Maquinaria',
    'Ayudante de Soldadura',
    'Ayudante de Limpieza',
    'Ayudante de Obras',
    'Ayudante de Operación',
    'Ayudante de Torque',
    'Ayudante de Pintura',
    'Ayudante de Carga',
    'Ayudante de Logística',
    'Ayudante de Transporte',
    'Doblador de Tubería',
    'Refractarista',
    'Jardinero',
    'Andamiero',
    'Radiólogo',
    'Buzo',
    'Tubería',
    'Ayudante de Buque',
    'Ayudante de Campamento',
    'Ayudante de Cocina',
    'Taladrador'
  ],
  'Ingeniería y Mantenimiento': [
    'Ingeniero',
    'Ingeniero de Operaciones',
    'Ingeniero de Mantenimiento',
    'Ingeniero de Proyectos',
    'Supervisor de Mantenimiento',
    'Coordinador de Ingeniería',
    'Técnico de Mantenimiento',
    'Técnico de Instrumentos',
    'Ingeniero en Entrenamiento',
    'Electrónico',
    'Especialista en Equipos',
    'Inspector',
    'Topógrafo',
    'Instrumentista',
    'Motorista'
  ],
  'Salud, Seguridad y Medio Ambiente (HSE)': [
    'Coordinador HSE',
    'Inspector HSE',
    'Supervisor HSE',
    'Coordinador Ambiental',
    'Inspector Ambiental',
    'Técnico Ambiental',
    'Coordinador de Seguridad',
    'Oficial de Seguridad',
    'Ayudante de Seguridad Industrial',
    'Jefe de Seguridad',
    'Paramédico',
    'Socorrista',
    'Bombero',
    'Rescatista',
    'Brigadista',
    'Confinado',
    'Trabajo en Alturas'
  ],
  'Logística y Transporte': [
    'Conductor(a)',
    'Transportador(a)',
    'Operador de Grúa',
    'Ayudante de Logística',
    'Ayudante de Carga'
  ],
  'Servicios y Soporte': [
    'Aseador',
    'Oficios Varios',
    'Jardinero',
    'Mensajero',
    'Laboratorista',
    'Soldador',
    'Ayudante de Obra',
    'Mecánico de Mantenimiento'
  ]
};

// Función para obtener el área basada en el cargo
const obtenerAreaPorCargo = (cargo) => {
  for (const [area, cargos] of Object.entries(cargosPorArea)) {
    if (cargos.includes(cargo)) {
      return area;
    }
  }
  return '';
};

const MultiStepForm = ({ onComplete }) => {
  const dispatch = useDispatch();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const { isOpen: showExistingPersonModal, openModal: openExistingPersonModal, closeModal: closeExistingPersonModal } = useModal();
  const [existingPersonData, setExistingPersonData] = useState(null);
  const { announce, AnnouncerComponent } = useScreenReaderAnnouncer();
  
  const [formData, setFormData] = useState({
    // Datos personales
    nombres: '',
    apellidos: '',
    documento: '',
    edad: '',
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

  const steps = [
    { id: 1, title: 'Datos Personales', icon: User },
    { id: 2, title: 'Datos Laborales', icon: Building },
    { id: 3, title: 'Datos de Seguridad', icon: Shield },
    { id: 4, title: 'Percepción', icon: Heart }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Si se está cambiando el cargo, actualizar automáticamente el área
      if (field === 'cargo') {
        const areaCorrespondiente = obtenerAreaPorCargo(value);
        newData.area = areaCorrespondiente;
      }
      
      return newData;
    });
    
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
    
    // Si se cambió el cargo y se actualizó el área, limpiar también el error del área
    if (field === 'cargo' && errors.area) {
      setErrors(prev => ({ ...prev, area: null }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 1: // Datos personales
        if (!formData.nombres.trim()) newErrors.nombres = 'Los nombres son requeridos';
        if (!formData.apellidos.trim()) newErrors.apellidos = 'Los apellidos son requeridos';
        if (!formData.documento.trim()) newErrors.documento = 'El documento es requerido';
        if (!formData.edad) newErrors.edad = 'La edad es requerida';
        if (!formData.genero) newErrors.genero = 'El género es requerido';
        break;
        
      case 2: // Datos laborales
        if (!formData.cargo.trim()) newErrors.cargo = 'El cargo es requerido';
        if (!formData.area) newErrors.area = 'El área es requerida';
        if (!formData.turno) newErrors.turno = 'El turno es requerido';
        if (!formData.antiguedad) newErrors.antiguedad = 'La antigüedad es requerida';
        if (!formData.tipo_contrato) newErrors.tipo_contrato = 'El tipo de contrato es requerido';
        if (!formData.nivel_educativo) newErrors.nivel_educativo = 'El nivel educativo es requerido';
        break;
        
      case 3: // Datos de seguridad
        if (!formData.capacitaciones_seguridad) newErrors.capacitaciones_seguridad = 'Este campo es requerido';
        if (!formData.accidentes_previos) newErrors.accidentes_previos = 'Este campo es requerido';
        if (formData.reporta_casi_accidentes === '') newErrors.reporta_casi_accidentes = 'Este campo es requerido';
        if (!formData.uso_epp) newErrors.uso_epp = 'Este campo es requerido';
        break;
        
      case 4: // Datos de percepción
        if (!formData.satisfaccion_laboral) newErrors.satisfaccion_laboral = 'Este campo es requerido';
        if (!formData.motivacion_seguridad) newErrors.motivacion_seguridad = 'Este campo es requerido';
        if (!formData.confianza_gerencia) newErrors.confianza_gerencia = 'Este campo es requerido';
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      const newStep = Math.min(currentStep + 1, steps.length);
      setCurrentStep(newStep);
      announce(`Avanzando al paso ${newStep} de ${steps.length}`, 'polite');
    }
  };

  const prevStep = () => {
    const newStep = Math.max(currentStep - 1, 1);
    setCurrentStep(newStep);
    announce(`Retrocediendo al paso ${newStep} de ${steps.length}`, 'polite');
  };

  const handleContinueWithExisting = async () => {
    closeExistingPersonModal();
    setIsSubmitting(true);
    
    try {
      await continueWithExistingPerson(existingPersonData);
    } catch (error) {
      setErrors({ general: 'Error al procesar la evaluación. Intente nuevamente.' });
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelExisting = () => {
    closeExistingPersonModal();
    setExistingPersonData(null);
    setErrors({ 
      documento: `Evaluación cancelada. Use un documento diferente o contacte al administrador.`,
      general: 'Operación cancelada por el usuario'
    });
    setCurrentStep(1);
  };

  const continueWithExistingPerson = async (existingPerson) => {
    // Actualizar datos de la persona existente
    const { data: updatedPerson, error: updateError } = await supabase
      .from('usuarios')
      .update({
        nombre: `${formData.nombres} ${formData.apellidos}`,
        metadata: {
          nombres: formData.nombres,
          apellidos: formData.apellidos,
          documento: formData.documento,
          edad: parseInt(formData.edad),
          genero: formData.genero,
          cargo: formData.cargo,
          area: formData.area,
          turno: formData.turno,
          antiguedad: parseInt(formData.antiguedad),
          tipo_contrato: formData.tipo_contrato,
          nivel_educativo: formData.nivel_educativo,
          capacitaciones_seguridad: formData.capacitaciones_seguridad,
          accidentes_previos: formData.accidentes_previos,
          reporta_casi_accidentes: formData.reporta_casi_accidentes === 'si',
          uso_epp: formData.uso_epp,
          satisfaccion_laboral: parseInt(formData.satisfaccion_laboral),
          motivacion_seguridad: parseInt(formData.motivacion_seguridad),
          confianza_gerencia: parseInt(formData.confianza_gerencia),
          completado: false,
          fecha_completado: null
        }
      })
      .eq('id', existingPerson.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Eliminar respuestas previas
    const { error: deleteError } = await supabase
      .from('respuestas_cuestionario')
      .delete()
      .eq('usuario_id', existingPerson.id);

    if (deleteError) {
      console.warn('Error al eliminar respuestas previas:', deleteError);
    }

    // Guardar ID y continuar
    localStorage.setItem('personaId', existingPerson.id);
    dispatch(startQuestionnaire({ personaId: existingPerson.id }));
    onComplete(formData);
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;
    
    setIsSubmitting(true);
    
    try {
      // Verificar si ya existe una persona con este documento
      const { data: existingPerson, error: checkError } = await supabase
        .from('usuarios')
        .select('id, nombre, documento, cargo, departamento, area_macro, edad, genero')
        .eq('documento', formData.documento)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // Error diferente a "no encontrado"
        throw checkError;
      }

      let personaId;

      if (existingPerson) {
        // Verificar si la persona ya completó un cuestionario
        if (existingPerson.completado) {
          // Mostrar modal para confirmar nueva evaluación
          setExistingPersonData(existingPerson);
          openExistingPersonModal();
          setIsSubmitting(false);
          return;
        }
        
        // Si la persona existe pero no ha completado, usar su ID
         personaId = existingPerson.id;

      } else {
        // Crear nueva persona si no existe

        // Preparar datos para Supabase usando la estructura real de la tabla
        const userData = {
          documento: formData.documento, // Documento como identificador único
          nombre: `${formData.nombres} ${formData.apellidos}`,
          cargo: formData.cargo,
          departamento: formData.area,
          area_macro: formData.area,
          edad: parseInt(formData.edad),
          genero: formData.genero,
          fecha_ingreso: new Date().toISOString().split('T')[0], // Fecha actual
          activo: true,
          // Nuevos campos agregados
          turno: formData.turno,
          antiguedad_empresa: parseInt(formData.antiguedad),
          tipo_contrato: formData.tipo_contrato,
          nivel_educativo: formData.nivel_educativo,
          capacitaciones_seguridad: formData.capacitaciones_seguridad === 'si',
          accidentes_previos: formData.accidentes_previos === 'si',
          reporta_casi_accidentes: formData.reporta_casi_accidentes === 'si',
          uso_epp: formData.uso_epp === 'si',
          satisfaccion_laboral: parseInt(formData.satisfaccion_laboral),
          motivacion_seguridad: parseInt(formData.motivacion_seguridad),
          confianza_gerencia: parseInt(formData.confianza_gerencia)
        };

        // Insertar en Supabase
        const { data, error } = await supabase
          .from('usuarios')
          .insert([userData])
          .select();

        if (error) {
          throw error;
        }

        personaId = data[0].id;
      }

      // Guardar ID de usuario en localStorage para relacionar con respuestas
      localStorage.setItem('personaId', personaId);

      // Iniciar cuestionario
      dispatch(startQuestionnaire());
      announce('Datos guardados exitosamente. Iniciando cuestionario.', 'assertive');
      onComplete(formData);
      
    } catch (error) {
      console.error('Error al guardar datos:', error);
      
      // Manejo específico de errores
      setErrors({ general: 'Error al guardar la información. Intente nuevamente.' });
      announce('Error al guardar la información. Intente nuevamente.', 'assertive');
      console.error('Detalles del error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Datos Personales</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombres *</label>
                <input
                  type="text"
                  value={formData.nombres}
                  onChange={(e) => handleInputChange('nombres', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.nombres ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Ingrese sus nombres"
                />
                {errors.nombres && <p className="text-red-500 text-sm mt-1">{errors.nombres}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Apellidos *</label>
                <input
                  type="text"
                  value={formData.apellidos}
                  onChange={(e) => handleInputChange('apellidos', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.apellidos ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Ingrese sus apellidos"
                />
                {errors.apellidos && <p className="text-red-500 text-sm mt-1">{errors.apellidos}</p>}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Documento de Identidad *</label>
              <input
                type="text"
                value={formData.documento}
                onChange={(e) => handleInputChange('documento', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.documento ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Ingrese su cédula"
              />
              {errors.documento && <p className="text-red-500 text-sm mt-1">{errors.documento}</p>}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Edad *</label>
                <input
                  type="number"
                  min="18"
                  max="70"
                  value={formData.edad}
                  onChange={(e) => handleInputChange('edad', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.edad ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Edad"
                />
                {errors.edad && <p className="text-red-500 text-sm mt-1">{errors.edad}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Género *</label>
                <select
                  value={formData.genero}
                  onChange={(e) => handleInputChange('genero', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.genero ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                >
                  <option value="">Seleccione</option>
                  <option value="masculino">Masculino</option>
                  <option value="femenino">Femenino</option>
                  <option value="otro">Otro</option>
                </select>
                {errors.genero && <p className="text-red-500 text-sm mt-1">{errors.genero}</p>}
              </div>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Datos Laborales</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cargo / Puesto de Trabajo *</label>
              <select
                value={formData.cargo}
                onChange={(e) => handleInputChange('cargo', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.cargo ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              >
                <option value="">Seleccione un cargo</option>
                {Object.entries(cargosPorArea).map(([area, cargos]) => (
                  <optgroup key={area} label={area}>
                    {cargos.map(cargo => (
                      <option key={cargo} value={cargo}>{cargo}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {errors.cargo && <p className="text-red-500 text-sm mt-1">{errors.cargo}</p>}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Área o Departamento *</label>
                <input
                  type="text"
                  value={formData.area}
                  readOnly
                  className={`w-full px-4 py-3 border rounded-lg bg-gray-100 text-gray-700 ${
                    errors.area ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Se asignará automáticamente según el cargo seleccionado"
                />
                {errors.area && <p className="text-red-500 text-sm mt-1">{errors.area}</p>}
                {formData.area && (
                  <p className="text-sm text-green-600 mt-1">
                    ✓ Área asignada automáticamente: {formData.area}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Turno *</label>
                <select
                  value={formData.turno}
                  onChange={(e) => handleInputChange('turno', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.turno ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                >
                  <option value="">Seleccione</option>
                  <option value="Mañana">Mañana</option>
                  <option value="Tarde">Tarde</option>
                  <option value="Noche">Noche</option>
                  <option value="Rotativo">Rotativo</option>
                </select>
                {errors.turno && <p className="text-red-500 text-sm mt-1">{errors.turno}</p>}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Antigüedad en la empresa (años) *</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={formData.antiguedad}
                  onChange={(e) => handleInputChange('antiguedad', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.antiguedad ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Años"
                />
                {errors.antiguedad && <p className="text-red-500 text-sm mt-1">{errors.antiguedad}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Contrato *</label>
                <select
                  value={formData.tipo_contrato}
                  onChange={(e) => handleInputChange('tipo_contrato', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.tipo_contrato ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                >
                  <option value="">Seleccione</option>
                  <option value="Fijo">Fijo</option>
                  <option value="Indefinido">Indefinido</option>
                  <option value="Temporal">Temporal</option>
                  <option value="Contratista">Contratista</option>
                </select>
                {errors.tipo_contrato && <p className="text-red-500 text-sm mt-1">{errors.tipo_contrato}</p>}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nivel Educativo *</label>
              <select
                value={formData.nivel_educativo}
                onChange={(e) => handleInputChange('nivel_educativo', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.nivel_educativo ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              >
                <option value="">Seleccione</option>
                <option value="Básico">Básico</option>
                <option value="Medio">Medio</option>
                <option value="Técnico">Técnico</option>
                <option value="Profesional">Profesional</option>
              </select>
              {errors.nivel_educativo && <p className="text-red-500 text-sm mt-1">{errors.nivel_educativo}</p>}
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Datos de Seguridad</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">¿Ha recibido capacitaciones de seguridad? *</label>
              <select
                value={formData.capacitaciones_seguridad}
                onChange={(e) => handleInputChange('capacitaciones_seguridad', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.capacitaciones_seguridad ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              >
                <option value="">Seleccione</option>
                <option value="si">Sí</option>
                <option value="no">No</option>
                <option value="ultimo_año">En el último año</option>
              </select>
              {errors.capacitaciones_seguridad && <p className="text-red-500 text-sm mt-1">{errors.capacitaciones_seguridad}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">¿Accidentes laborales previos? *</label>
              <select
                value={formData.accidentes_previos}
                onChange={(e) => handleInputChange('accidentes_previos', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.accidentes_previos ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              >
                <option value="">Seleccione</option>
                <option value="nunca">Nunca</option>
                <option value="1_vez">1 vez</option>
                <option value="mas_de_1">Más de 1 vez</option>
              </select>
              {errors.accidentes_previos && <p className="text-red-500 text-sm mt-1">{errors.accidentes_previos}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">¿Ha reportado casi-accidentes? *</label>
              <select
                value={formData.reporta_casi_accidentes}
                onChange={(e) => handleInputChange('reporta_casi_accidentes', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.reporta_casi_accidentes ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              >
                <option value="">Seleccione</option>
                <option value="si">Sí</option>
                <option value="no">No</option>
              </select>
              {errors.reporta_casi_accidentes && <p className="text-red-500 text-sm mt-1">{errors.reporta_casi_accidentes}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">¿Uso de EPP entregado por la empresa? *</label>
              <select
                value={formData.uso_epp}
                onChange={(e) => handleInputChange('uso_epp', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.uso_epp ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              >
                <option value="">Seleccione</option>
                <option value="siempre_disponible">Siempre disponible</option>
                <option value="a_veces_falta">A veces falta</option>
                <option value="nunca_entregado">Nunca entregado</option>
              </select>
              {errors.uso_epp && <p className="text-red-500 text-sm mt-1">{errors.uso_epp}</p>}
            </div>
          </div>
        );
        
      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Datos de Percepción</h3>
            <p className="text-gray-600 mb-6">Califique del 1 al 5, donde 1 es muy bajo y 5 es muy alto</p>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nivel de satisfacción laboral *</label>
              <select
                value={formData.satisfaccion_laboral}
                onChange={(e) => handleInputChange('satisfaccion_laboral', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.satisfaccion_laboral ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              >
                <option value="">Seleccione</option>
                <option value="1">1 - Muy bajo</option>
                <option value="2">2 - Bajo</option>
                <option value="3">3 - Medio</option>
                <option value="4">4 - Alto</option>
                <option value="5">5 - Muy alto</option>
              </select>
              {errors.satisfaccion_laboral && <p className="text-red-500 text-sm mt-1">{errors.satisfaccion_laboral}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Motivación con respecto a la seguridad *</label>
              <select
                value={formData.motivacion_seguridad}
                onChange={(e) => handleInputChange('motivacion_seguridad', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.motivacion_seguridad ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              >
                <option value="">Seleccione</option>
                <option value="1">1 - Muy bajo</option>
                <option value="2">2 - Bajo</option>
                <option value="3">3 - Medio</option>
                <option value="4">4 - Alto</option>
                <option value="5">5 - Muy alto</option>
              </select>
              {errors.motivacion_seguridad && <p className="text-red-500 text-sm mt-1">{errors.motivacion_seguridad}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confianza en la gerencia/supervisor en seguridad *</label>
              <select
                value={formData.confianza_gerencia}
                onChange={(e) => handleInputChange('confianza_gerencia', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.confianza_gerencia ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              >
                <option value="">Seleccione</option>
                <option value="1">1 - Muy bajo</option>
                <option value="2">2 - Bajo</option>
                <option value="3">3 - Medio</option>
                <option value="4">4 - Alto</option>
                <option value="5">5 - Muy alto</option>
              </select>
              {errors.confianza_gerencia && <p className="text-red-500 text-sm mt-1">{errors.confianza_gerencia}</p>}
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Cuestionario de Salud General (GHQ-12)
          </h1>
          <p className="text-gray-600">
            Instrumento para la medición de la salud mental y el bienestar
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-between items-center mb-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                  isCompleted 
                    ? 'bg-green-500 border-green-500 text-white'
                    : isActive 
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'bg-gray-100 border-gray-300 text-gray-400'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <Icon className="w-6 h-6" />
                  )}
                </div>
                <div className="ml-3 hidden md:block">
                  <p className={`text-sm font-medium ${
                    isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`hidden md:block w-16 h-0.5 ml-4 ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Error general */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600 text-sm">{errors.general}</p>
          </div>
        )}

        {/* Step Content */}
        <div className="mb-8">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </button>
          
          {currentStep < steps.length ? (
            <button
              type="button"
              onClick={nextStep}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Siguiente
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Comenzar Cuestionario
                </>
              )}
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            * Campos obligatorios. Esta información es confidencial y se utiliza únicamente para fines estadísticos.
          </p>
        </div>
      </div>

      {/* Modal para persona existente */}
      <AccessibleModal
        isOpen={showExistingPersonModal}
        onClose={closeExistingPersonModal}
        title="Persona ya registrada"
        className="max-w-md w-full"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Ya existe una evaluación completada para {existingPersonData?.nombre}.
            ¿Desea realizar una nueva evaluación?
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={handleCancelExisting}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Cancelar
            </button>
            <button
              onClick={handleContinueWithExisting}
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {isSubmitting ? 'Procesando...' : 'Continuar'}
            </button>
          </div>
        </div>
      </AccessibleModal>
      <AnnouncerComponent />
    </div>
  );
};

export default MultiStepForm;