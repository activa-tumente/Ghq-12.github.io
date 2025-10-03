import Sidebar from './Sidebar'
import SkipNavigation from './SkipNavigation'

const Layout = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-50">
      <SkipNavigation />
      
      {/* Sidebar Navigation */}
      <nav id="navigation" role="navigation" aria-label="Navegación principal">
        <Sidebar />
      </nav>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Content area */}
        <main 
          id="main-content" 
          role="main" 
          aria-label="Contenido principal"
          className="flex-1 overflow-y-auto p-4 lg:p-6"
          tabIndex="-1"
        >
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout