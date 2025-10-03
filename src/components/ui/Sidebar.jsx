import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  Home,
  BarChart3,
  FileText,
  Settings,
  Menu,
  X,
  Users,
  LogOut,
  MessageSquare,
  ClipboardList
} from 'lucide-react'

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const location = useLocation()
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const sidebarRef = useRef(null)
  const menuButtonRef = useRef(null)
  const navigationRef = useRef(null)

  const menuItems = [
    {
      name: 'Inicio',
      path: '/',
      icon: Home,
      description: 'Panel principal'
    },
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: BarChart3,
      description: 'Análisis y métricas'
    },
    {
      name: 'Cuestionarios',
      path: '/cuestionarios',
      icon: FileText,
      description: 'Gestión de evaluaciones'
    },
    {
      name: 'Respuestas',
      path: '/respuestas',
      icon: MessageSquare,
      description: 'Análisis de respuestas GHQ-12'
    },
    {
      name: 'Usuarios',
      path: '/usuarios',
      icon: Users,
      description: 'Administrar usuarios'
    },
    {
      name: 'Configuración',
      path: '/configuracion',
      icon: Settings,
      description: 'Ajustes del sistema'
    }
  ]

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true
    if (path !== '/' && location.pathname.startsWith(path)) return true
    return false
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return

      switch (e.key) {
        case 'Escape':
          setIsOpen(false)
          menuButtonRef.current?.focus()
          break
        case 'ArrowDown':
          e.preventDefault()
          setFocusedIndex(prev => 
            prev < menuItems.length - 1 ? prev + 1 : 0
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setFocusedIndex(prev => 
            prev > 0 ? prev - 1 : menuItems.length - 1
          )
          break
        case 'Home':
          e.preventDefault()
          setFocusedIndex(0)
          break
        case 'End':
          e.preventDefault()
          setFocusedIndex(menuItems.length - 1)
          break
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, menuItems.length])

  // Focus management
  useEffect(() => {
    if (isOpen && focusedIndex >= 0) {
      const links = navigationRef.current?.querySelectorAll('a')
      if (links && links[focusedIndex]) {
        links[focusedIndex].focus()
      }
    }
  }, [focusedIndex, isOpen])

  // Close sidebar and reset focus when route changes
  useEffect(() => {
    setIsOpen(false)
    setFocusedIndex(-1)
  }, [location.pathname])

  const handleLogout = async () => {
    console.log('Logout clicked')
    try {
      await signOut()
      console.log('✅ Sesión cerrada correctamente')
      navigate('/')
    } catch (error) {
      console.error('❌ Error al cerrar sesión:', error)
    }
  }

  return (
    <>
      {/* Botón hamburguesa para móvil */}
      <button
        ref={menuButtonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label={isOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
        aria-expanded={isOpen}
        aria-controls="sidebar-navigation"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay para móvil */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside 
        ref={sidebarRef}
        id="sidebar-navigation"
        className={`
          fixed top-0 left-0 h-full bg-white shadow-xl border-r border-gray-200 z-40 transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
          w-64
        `}
        aria-label="Navegación principal"
        role="navigation"
      >
        {/* Header */}
        <header className="p-6 border-b border-gray-200" role="banner">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <ClipboardList className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">GHQ-12</h1>
              <p className="text-sm text-gray-500">Gestiona las evaluaciones</p>
            </div>
          </div>
        </header>

        {/* Navigation */}
        <nav className="flex-1 p-4" ref={navigationRef} role="navigation" aria-label="Menú principal">
          <ul className="space-y-2" role="list">
            {menuItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.path)
              
              return (
                <li key={item.path} role="listitem">
                  <Link
                    to={item.path}
                    onClick={() => {
                      setIsOpen(false)
                      setFocusedIndex(-1)
                    }}
                    className={`
                      flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset
                      ${active 
                        ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }
                    `}
                    aria-current={active ? 'page' : undefined}
                    aria-describedby={`nav-desc-${item.path.replace('/', '')}`}
                  >
                    <Icon size={20} className={active ? 'text-blue-600' : 'text-gray-400'} aria-hidden="true" />
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div id={`nav-desc-${item.path.replace('/', '')}`} className="text-xs text-gray-500">{item.description}</div>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer */}
        <footer className="p-4 border-t border-gray-200" role="contentinfo">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-inset"
            aria-label="Cerrar sesión y salir del sistema"
          >
            <LogOut size={20} aria-hidden="true" />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </footer>
      </aside>
    </>
  )
}

export default Sidebar