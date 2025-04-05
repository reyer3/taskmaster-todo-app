import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

/**
 * Componente de encabezado principal de la aplicación
 * Contiene el logo, navegación y opciones de usuario
 */
const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <header className="bg-primary text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo y título */}
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold">TaskMaster</span>
        </Link>

        {/* Navegación */}
        <nav className="hidden md:flex items-center space-x-6">
          {isAuthenticated && (
            <>
              <Link to="/dashboard" className="hover:text-accent transition-colors">
                Dashboard
              </Link>
              <Link to="/tasks" className="hover:text-accent transition-colors">
                Tareas
              </Link>
              <Link to="/calendar" className="hover:text-accent transition-colors">
                Calendario
              </Link>
            </>
          )}
        </nav>

        {/* Opciones de usuario */}
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <div className="hidden md:block">
                <span className="text-sm">{user?.name}</span>
              </div>
              <div className="relative group">
                <button className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user?.name} className="w-8 h-8 rounded-full" />
                  ) : (
                    <span className="text-lg">{user?.name?.[0]?.toUpperCase()}</span>
                  )}
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
                  <Link to="/profile" className="block px-4 py-2 hover:bg-gray-100">
                    Perfil
                  </Link>
                  <Link to="/settings" className="block px-4 py-2 hover:bg-gray-100">
                    Configuración
                  </Link>
                  <button 
                    onClick={logout}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    Cerrar sesión
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex space-x-2">
              <Link to="/login" className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 transition-colors">
                Iniciar sesión
              </Link>
              <Link to="/register" className="px-4 py-2 rounded-md bg-accent hover:bg-accent-dark transition-colors">
                Registrarse
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header; 