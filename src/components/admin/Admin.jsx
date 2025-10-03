import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Users, 
  Plus, 
  Download, 
  Upload, 
  Link, 
  Trash2, 
  Edit, 
  Eye,
  LogOut,
  FileText,
  Mail
} from 'lucide-react'
import { dbHelpers } from '../../api/supabase'
import AccessibleModal, { useModal } from '../ui/AccessibleModal'
import AccessibleDropdown from '../ui/AccessibleDropdown'
import { useScreenReaderAnnouncer } from '../ui/ScreenReaderAnnouncer'

const Admin = () => {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const { isOpen: showModal, openModal, closeModal: closeModalHandler } = useModal()
  const [modalType, setModalType] = useState('create') // 'create', 'edit', 'view'
  const [selectedUsuario, setSelectedUsuario] = useState(null)
  const { announce, AnnouncerComponent } = useScreenReaderAnnouncer()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    area_macro: '',
    cargo: '',
    departamento: '',
    genero: '',
    edad: '',
    fecha_ingreso: ''
  })

  useEffect(() => {
    // Verificar autenticación
    const isAuth = localStorage.getItem('adminAuth')
    if (!isAuth) {
      navigate('/login')
      return
    }
    
    cargarUsuarios()
  }, [navigate])

  const cargarUsuarios = async () => {
    setLoading(true)
    try {
      const { data, error } = await dbHelpers.getUsuarios()
      if (error) {
        // Handle case when tables don't exist (no data scenario)
        const errorMessage = error.message || String(error);
        if (errorMessage.includes('Could not find the table')) {
          console.log('⚠️ Tabla de usuarios no encontrada, mostrando lista vacía');
          setUsuarios([]);
          return;
        }
        throw error;
      }
      setUsuarios(data || [])
    } catch (err) {
      console.error('Error cargando usuarios:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminAuth')
    localStorage.removeItem('adminUser')
    navigate('/login')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (modalType === 'create') {
        // Generar email único si no se proporciona
        const email = formData.email || `usuario_${Date.now()}@empresa.com`
        
        const usuarioData = {
          ...formData,
          edad: parseInt(formData.edad) || null,
          email: email,
          activo: true,
          fecha_creacion: new Date().toISOString()
        }

        const { error } = await dbHelpers.createUsuario(usuarioData)
        if (error) throw error
        
        announce('Usuario creado exitosamente', 'assertive')
        
      } else if (modalType === 'edit') {
        const usuarioData = {
          ...formData,
          edad: parseInt(formData.edad) || null
        }

        const { error } = await dbHelpers.updateUsuario(selectedUsuario.id, usuarioData)
        if (error) throw error
        
        announce('Usuario actualizado exitosamente', 'assertive')
      }

      await cargarUsuarios()
      closeModalHandler()
      resetForm()
      
    } catch (err) {
      console.error('Error guardando usuario:', err)
      announce('Error al guardar el usuario. Verifique los datos.', 'assertive')
      alert('Error al guardar el usuario. Verifique los datos.')
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      nombre: '',
      apellido: '',
      email: '',
      area_macro: '',
      cargo: '',
      departamento: '',
      genero: '',
      edad: '',
      fecha_ingreso: ''
    })
    setSelectedUsuario(null)
  }

  const handleOpenModal = (type, usuario = null) => {
    setModalType(type)
    setSelectedUsuario(usuario)
    
    if (usuario && (type === 'edit' || type === 'view')) {
      setFormData({
        nombre: usuario.nombre || '',
        apellido: usuario.apellido || '',
        email: usuario.email || '',
        area_macro: usuario.area_macro || '',
        cargo: usuario.cargo || '',
        departamento: usuario.departamento || '',
        genero: usuario.genero || '',
        edad: usuario.edad?.toString() || '',
        fecha_ingreso: usuario.fecha_ingreso || ''
      })
    } else {
      resetForm()
    }
    
    openModal()
  }



  const exportarDatos = () => {
    const csv = [
      ['Nombre', 'Apellido', 'Documento', 'Email', 'Cargo', 'Departamento', 'Área Macro', 'Edad', 'Género', 'Turno', 'Antigüedad (años)', 'Tipo de Contrato', 'Nivel Educativo', 'Fecha Ingreso', 'Activo'].join(','),
      ...usuarios.map(u => [
        u.nombre || '',
        u.apellido || '',
        u.documento || '',
        u.email || '',
        u.cargo || '',
        u.departamento || '',
        u.area_macro || '',
        u.edad || '',
        u.genero || '',
        u.turno || '',
        u.antiguedad_empresa || '',
        u.tipo_contrato || '',
        u.nivel_educativo || '',
        u.fecha_ingreso || '',
        u.activo ? 'Sí' : 'No'
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `usuarios_cuestionario_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading && usuarios.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando panel de administración...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Panel de Administración
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Gestión de personas y enlaces del cuestionario CSBC
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => navigate('/')}
                className="btn-secondary"
              >
                <Eye className="w-4 h-4 mr-2" />
                Ver Análisis
              </button>
              <button
                onClick={handleLogout}
                className="btn-secondary"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Usuarios</p>
                <p className="text-2xl font-bold text-gray-900">{usuarios.length}</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <Check className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Activos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {usuarios.filter(u => u.activo).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Inactivos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {usuarios.filter(u => !u.activo).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <Link className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">% Activos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {usuarios.length > 0 ? Math.round((usuarios.filter(u => u.activo).length / usuarios.length) * 100) : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Gestión de Usuarios
          </h2>
          <div className="flex space-x-3">
            <button
              onClick={exportarDatos}
              className="btn-secondary"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </button>
            <button
              onClick={() => handleOpenModal('create')}
              className="btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Usuario
            </button>
          </div>
        </div>

        {/* Tabla de usuarios */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cargo/Área
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usuarios.map((usuario) => (
                  <tr key={usuario.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {usuario.nombre} {usuario.apellido}
                        </div>
                        <div className="text-sm text-gray-500">
                          {usuario.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{usuario.cargo}</div>
                      <div className="text-sm text-gray-500">{usuario.area_macro}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        usuario.activo 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {usuario.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {usuario.email}
                      </div>
                      <div className="text-sm text-gray-500">
                        {usuario.departamento}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleOpenModal('view', usuario)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenModal('edit', usuario)}
                          className="text-yellow-600 hover:text-yellow-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      <AccessibleModal
        isOpen={showModal}
        onClose={closeModalHandler}
        title={
          modalType === 'create' ? 'Agregar Nuevo Usuario' :
          modalType === 'edit' ? 'Editar Usuario' :
          'Detalles del Usuario'
        }
        className="w-11/12 md:w-3/4 lg:w-1/2"
      >
        <div className="space-y-4">
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nombre</label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                      className="input-field"
                      required
                      disabled={modalType === 'view'}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Apellido</label>
                    <input
                      type="text"
                      value={formData.apellido}
                      onChange={(e) => setFormData({...formData, apellido: e.target.value})}
                      className="input-field"
                      required
                      disabled={modalType === 'view'}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="input-field"
                      required
                      disabled={modalType === 'view'}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Cargo</label>
                    <input
                      type="text"
                      value={formData.cargo}
                      onChange={(e) => setFormData({...formData, cargo: e.target.value})}
                      className="input-field"
                      required
                      disabled={modalType === 'view'}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Edad</label>
                    <input
                      type="number"
                      value={formData.edad}
                      onChange={(e) => setFormData({...formData, edad: e.target.value})}
                      className="input-field"
                      required
                      disabled={modalType === 'view'}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Género</label>
                    <select
                      value={formData.genero}
                      onChange={(e) => setFormData({...formData, genero: e.target.value})}
                      className="input-field"
                      disabled={modalType === 'view'}
                    >
                      <option value="masculino">Masculino</option>
                      <option value="femenino">Femenino</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Departamento</label>
                    <input
                      type="text"
                      value={formData.departamento}
                      onChange={(e) => setFormData({...formData, departamento: e.target.value})}
                      className="input-field"
                      required
                      disabled={modalType === 'view'}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Área Macro</label>
                    <select
                      value={formData.area_macro}
                      onChange={(e) => setFormData({...formData, area_macro: e.target.value})}
                      className="input-field"
                      disabled={modalType === 'view'}
                    >
                      <option value="Producción">Producción</option>
                      <option value="Mantenimiento">Mantenimiento</option>
                      <option value="Logística">Logística</option>
                      <option value="Administrativo">Administrativo</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha de Ingreso</label>
                    <input
                      type="date"
                      value={formData.fecha_ingreso}
                      onChange={(e) => setFormData({...formData, fecha_ingreso: e.target.value})}
                      className="input-field"
                      disabled={modalType === 'view'}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Estado</label>
                    <select
                      value={formData.activo}
                      onChange={(e) => setFormData({...formData, activo: e.target.value === 'true'})}
                      className="input-field"
                      disabled={modalType === 'view'}
                    >
                      <option value="true">Activo</option>
                      <option value="false">Inactivo</option>
                    </select>
                  </div>
                </div>

                {modalType === 'view' && selectedUsuario && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Información del Usuario:</h4>
                    <div className="text-sm text-gray-600">
                      <p><strong>Email:</strong> {selectedUsuario.email}</p>
                      <p><strong>Fecha de creación:</strong> {new Date(selectedUsuario.fecha_creacion).toLocaleDateString()}</p>
                      <p><strong>Estado:</strong> {selectedUsuario.activo ? 'Activo' : 'Inactivo'}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModalHandler}
                    className="btn-secondary"
                  >
                    {modalType === 'view' ? 'Cerrar' : 'Cancelar'}
                  </button>
                  {modalType !== 'view' && (
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary"
                    >
                      {loading ? 'Guardando...' : modalType === 'create' ? 'Crear' : 'Actualizar'}
                    </button>
                  )}
                </div>
              </form>
        </div>
      </AccessibleModal>
      <AnnouncerComponent />
    </div>
  )
}

export default Admin