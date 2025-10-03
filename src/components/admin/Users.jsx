import { useState, useEffect } from 'react'
import {
  Users as UsersIcon,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Mail,
  Phone,
  Calendar,
  Shield,
  User,
  X,
  Save,
  AlertTriangle,
  RefreshCw,
  Download
} from 'lucide-react'
import { supabase } from '../../api/supabase'

const UsersComponent = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('todos')
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('create') // 'create' o 'edit'
  const [selectedUser, setSelectedUser] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    rol: 'operador',
    estado: 'activo'
  })
  const [formErrors, setFormErrors] = useState({})
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Cargar usuarios desde la base de datos
  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('fecha_creacion', { ascending: false })

      if (error) throw error

      // Transformar datos para el formato del componente
      const transformedUsers = (data || []).map(user => ({
        id: user.id,
        nombre: user.nombre || 'Sin nombre',
        apellidos: user.apellidos || '',
        documento: user.documento || '',
        email: user.email || '',
        telefono: user.metadata?.telefono || '',
        cargo: user.cargo || '',
        departamento: user.departamento || '',
        area_macro: user.area_macro || '',
        edad: user.edad || '',
        genero: user.genero || '',
        turno: user.turno || '',
        antiguedad_empresa: user.antiguedad_empresa || '',
        tipo_contrato: user.tipo_contrato || '',
        nivel_educativo: user.nivel_educativo || '',
        activo: user.activo || true,
        fechaRegistro: new Date(user.fecha_creacion).toISOString().split('T')[0],
        ultimoAcceso: user.fecha_actualizacion?.split('T')[0] || user.fecha_creacion?.split('T')[0] || '',
        avatar: generateAvatar(user.nombre || 'Usuario')
      }))

      setUsuarios(transformedUsers)
    } catch (err) {
      console.error('Error loading users:', err)
      setError('Error al cargar usuarios: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Función para generar avatar basado en el nombre
  const generateAvatar = (nombre) => {
    if (!nombre) return 'U'
    const words = nombre.split(' ')
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase()
    }
    return nombre.substring(0, 2).toUpperCase()
  }

  // Función para exportar a CSV
  const exportToCSV = () => {
    const headers = [
      'Nombre', 
      'Apellidos',
      'Documento',
      'Email', 
      'Teléfono', 
      'Cargo',
      'Departamento',
      'Área Macro',
      'Edad',
      'Género',
      'Turno',
      'Antigüedad (años)',
      'Tipo de Contrato',
      'Nivel Educativo',
      'Rol', 
      'Estado', 
      'Fecha Registro', 
      'Último Acceso',
      'Activo'
    ]
    const csvData = usuarios.map(user => [
      user.nombre,
      user.apellidos,
      user.documento,
      user.email,
      user.telefono,
      user.cargo,
      user.departamento,
      user.area_macro,
      user.edad,
      user.genero,
      user.turno,
      user.antiguedad_empresa,
      user.tipo_contrato,
      user.nivel_educativo,
      user.rol,
      user.estado,
      user.fechaRegistro,
      user.ultimoAcceso,
      user.activo ? 'Sí' : 'No'
    ])

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `usuarios-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Validaciones del formulario
  const validateForm = () => {
    const errors = {}
    
    if (!formData.nombre.trim()) {
      errors.nombre = 'El nombre es requerido'
    }
    
    if (!formData.email.trim()) {
      errors.email = 'El email es requerido'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'El email no es válido'
    } else {
      // Verificar email único (excepto al editar el mismo usuario)
      const emailExists = usuarios.some(u => 
        u.email === formData.email && 
        (modalType === 'create' || u.id !== selectedUser?.id)
      )
      if (emailExists) {
        errors.email = 'Este email ya está en uso'
      }
    }
    
    if (!formData.telefono.trim()) {
      errors.telefono = 'El teléfono es requerido'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Función para abrir modal de nuevo usuario
  const handleNewUser = () => {
    setModalType('create')
    setSelectedUser(null)
    setFormData({
      nombre: '',
      email: '',
      telefono: '',
      rol: 'operador',
      estado: 'activo'
    })
    setFormErrors({})
    setShowModal(true)
  }

  // Función para abrir modal de edición
  const handleEditUser = (usuario) => {
    setModalType('edit')
    setSelectedUser(usuario)
    setFormData({
      nombre: usuario.nombre,
      email: usuario.email,
      telefono: usuario.telefono || '',
      rol: usuario.rol || 'operador',
      estado: usuario.estado || 'activo'
    })
    setFormErrors({})
    setShowModal(true)
  }

  // Función para guardar usuario (crear o editar)
  const handleSaveUser = async () => {
    if (!validateForm()) return

    try {
      if (modalType === 'create') {
        const userData = {
          email: formData.email,
          nombre: formData.nombre,
          metadata: {
            telefono: formData.telefono,
            rol: formData.rol,
            estado: formData.estado,
            ultimo_acceso: new Date().toISOString().split('T')[0]
          }
        }

        const { data, error } = await supabase
          .from('usuarios')
          .insert([userData])
          .select()
          .single()

        if (error) throw error

        console.log('Usuario creado:', data)
      } else {
        const updateData = {
          nombre: formData.nombre,
          metadata: {
            ...selectedUser.metadata,
            telefono: formData.telefono,
            rol: formData.rol,
            estado: formData.estado,
            ultimo_acceso: new Date().toISOString().split('T')[0]
          }
        }

        const { error } = await supabase
          .from('usuarios')
          .update(updateData)
          .eq('id', selectedUser.id)

        if (error) throw error

        console.log('Usuario actualizado:', selectedUser.id)
      }

      setShowModal(false)
      loadUsers() // Recargar lista
    } catch (error) {
      console.error('Error saving user:', error)
      alert('Error al guardar usuario: ' + error.message)
    }
  }

  // Función para confirmar eliminación
  const handleDeleteUser = (usuario) => {
    setUserToDelete(usuario)
    setShowDeleteConfirm(true)
  }

  // Función para eliminar usuario
  const confirmDeleteUser = async () => {
    try {
      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', userToDelete.id)

      if (error) throw error

      console.log('Usuario eliminado:', userToDelete.id)
      setShowDeleteConfirm(false)
      setUserToDelete(null)
      loadUsers() // Recargar lista
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Error al eliminar usuario: ' + error.message)
    }
  }

  // Función para manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const getRoleColor = (rol) => {
    switch (rol) {
      case 'administrador':
        return 'bg-red-100 text-red-800'
      case 'supervisor':
        return 'bg-blue-100 text-blue-800'
      case 'evaluador':
        return 'bg-purple-100 text-purple-800'
      case 'operador':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (estado) => {
    return estado === 'activo' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-gray-100 text-gray-800'
  }

  const filteredUsuarios = usuarios.filter(usuario => {
    const matchesSearch = usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         usuario.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterRole === 'todos' || usuario.rol === filterRole
    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Cargando usuarios...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error al cargar usuarios</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={loadUsers}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Reintentar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-gray-600 mt-2">Gestiona los usuarios del sistema y sus permisos</p>
        </div>
        <div className="flex gap-3 mt-4 sm:mt-0">
          <button
            onClick={loadUsers}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
            title="Actualizar lista"
          >
            <RefreshCw size={20} />
            <span>Actualizar</span>
          </button>
          <button
            onClick={exportToCSV}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            title="Exportar a CSV"
          >
            <Download size={20} />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={handleNewUser}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Nuevo Usuario</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{usuarios.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50">
              <UsersIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Usuarios Activos</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{usuarios.filter(u => u.estado === 'activo').length}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-50">
              <User className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Administradores</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{usuarios.filter(u => u.rol === 'administrador').length}</p>
            </div>
            <div className="p-3 rounded-lg bg-red-50">
              <Shield className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Nuevos (Este mes)</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {usuarios.filter(u => {
                  const registro = new Date(u.fechaRegistro);
                  const now = new Date();
                  return registro.getMonth() === now.getMonth() && registro.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-purple-50">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6" role="region" aria-labelledby="filters-heading">
        <h3 id="filters-heading" className="sr-only">Filtros de búsqueda</h3>
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <label htmlFor="search-users" className="sr-only">Buscar usuarios por nombre o email</label>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} aria-hidden="true" />
            <input
              id="search-users"
              type="text"
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-describedby="search-help"
            />
            <span id="search-help" className="sr-only">Busca usuarios por nombre o dirección de email</span>
          </div>

          {/* Role Filter */}
          <div className="flex items-center space-x-2">
            <label htmlFor="role-filter" className="sr-only">Filtrar por rol</label>
            <Filter size={20} className="text-gray-400" aria-hidden="true" />
            <select
              id="role-filter"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-describedby="role-filter-help"
            >
              <option value="todos">Todos los roles</option>
              <option value="administrador">Administrador</option>
              <option value="supervisor">Supervisor</option>
              <option value="evaluador">Evaluador</option>
              <option value="operador">Operador</option>
            </select>
            <span id="role-filter-help" className="sr-only">Filtra la lista de usuarios por su rol en el sistema</span>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden" role="region" aria-labelledby="users-table-heading">
        <h3 id="users-table-heading" className="sr-only">Lista de usuarios</h3>
        <div className="overflow-x-auto">
          <table className="w-full" role="table" aria-label="Tabla de usuarios del sistema">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr role="row">
                <th scope="col" className="text-left py-3 px-6 font-medium text-gray-900" role="columnheader">Usuario</th>
                <th scope="col" className="text-left py-3 px-6 font-medium text-gray-900" role="columnheader">Contacto</th>
                <th scope="col" className="text-left py-3 px-6 font-medium text-gray-900" role="columnheader">Rol</th>
                <th scope="col" className="text-left py-3 px-6 font-medium text-gray-900" role="columnheader">Estado</th>
                <th scope="col" className="text-left py-3 px-6 font-medium text-gray-900" role="columnheader">Último Acceso</th>
                <th scope="col" className="text-left py-3 px-6 font-medium text-gray-900" role="columnheader">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsuarios.map((usuario) => (
                <tr key={usuario.id} className="hover:bg-gray-50" role="row">
                  <td className="py-4 px-6" role="cell">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold" aria-hidden="true">
                        {usuario.avatar}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{usuario.nombre}</div>
                        <div className="text-sm text-gray-500">ID: {usuario.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6" role="cell">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Mail size={14} aria-hidden="true" />
                        <span>{usuario.email}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Phone size={14} aria-hidden="true" />
                        <span>{usuario.telefono}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6" role="cell">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(usuario.rol)}`}>
                      {usuario.rol}
                    </span>
                  </td>
                  <td className="py-4 px-6" role="cell">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(usuario.estado)}`}>
                      {usuario.estado}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600" role="cell">
                    {new Date(usuario.ultimoAcceso).toLocaleDateString('es-ES')}
                  </td>
                  <td className="py-4 px-6" role="cell">
                    <div className="flex items-center space-x-2" role="group" aria-label={`Acciones para ${usuario.nombre}`}>
                      <button
                        onClick={() => handleEditUser(usuario)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar usuario"
                        aria-label={`Editar usuario ${usuario.nombre}`}
                      >
                        <Edit size={16} aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(usuario)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar usuario"
                        aria-label={`Eliminar usuario ${usuario.nombre}`}
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                      <button
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        title="Más opciones"
                        aria-label={`Más opciones para ${usuario.nombre}`}
                      >
                        <MoreVertical size={16} aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {filteredUsuarios.length === 0 && (
        <div className="text-center py-12">
          <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron usuarios</h3>
          <p className="text-gray-500">Intenta ajustar los filtros o agregar un nuevo usuario.</p>
        </div>
      )}

      {/* Modal para crear/editar usuario */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {modalType === 'create' ? 'Nuevo Usuario' : 'Editar Usuario'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formErrors.nombre ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ingrese el nombre completo"
                />
                {formErrors.nombre && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.nombre}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formErrors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="usuario@ejemplo.com"
                />
                {formErrors.email && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formErrors.telefono ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="+1 234 567 8900"
                />
                {formErrors.telefono && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.telefono}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol
                </label>
                <select
                  name="rol"
                  value={formData.rol}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="administrador">Administrador</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="operador">Operador</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  name="estado"
                  value={formData.estado}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveUser}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Save size={16} />
                {modalType === 'create' ? 'Crear Usuario' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Confirmar eliminación
                  </h3>
                  <p className="text-gray-600">
                    ¿Estás seguro de que deseas eliminar al usuario{' '}
                    <span className="font-semibold">{userToDelete?.nombre}</span>?
                    Esta acción no se puede deshacer.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteUser}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <Trash2 size={16} />
                Eliminar Usuario
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UsersComponent