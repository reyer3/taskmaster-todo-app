import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useLayout } from '../../context/LayoutContext';
import { useTheme } from '../../hooks/useTheme';
import ThemeToggle from '../common/ThemeToggle';

/**
 * Componente de encabezado principal de la aplicación
 * Contiene el logo, navegación y opciones de usuario
 */
const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { isPublicRoute } = useLayout();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  // Cerrar menú al cambiar de ruta
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuOpen && !event.target.closest('.mobile-menu-container')) {
        setMobileMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileMenuOpen]);

  // Detectar scroll para cambiar apariencia del header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(prev => !prev);
  };

  return (
    <header 
      className={`
        fixed top-0 left-0 right-0 z-50 transition-all duration-300
        ${scrolled ? 'bg-white dark:bg-dark-bg-secondary shadow-md' : isPublicRoute ? 'bg-transparent' : 'bg-primary dark:bg-primary-dark'}
        ${scrolled ? 'text-gray-800 dark:text-dark-text-primary' : isPublicRoute ? 'text-gray-800 dark:text-dark-text-primary' : 'text-white'}
      `}
    >
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo y título */}
        <Link to="/" className="flex items-center gap-2 z-10">
          <svg className={`w-8 h-8 ${scrolled ? 'text-primary' : isPublicRoute ? 'text-primary' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <span className="text-xl font-bold">TaskMaster</span>
        </Link>

        {/* Navegación - Desktop */}
        <nav className="hidden md:flex items-center space-x-6">
          {isAuthenticated && (
            <>
              <Link 
                to="/dashboard" 
                className={`font-medium hover:text-accent transition-colors ${
                  location.pathname === '/dashboard' ? 'text-accent' : ''
                }`}
              >
                Dashboard
              </Link>
              <Link 
                to="/tasks" 
                className={`font-medium hover:text-accent transition-colors ${
                  location.pathname === '/tasks' ? 'text-accent' : ''
                }`}
              >
                Tareas
              </Link>
              <Link 
                to="/calendar" 
                className={`font-medium hover:text-accent transition-colors ${
                  location.pathname === '/calendar' ? 'text-accent' : ''
                }`}
              >
                Calendario
              </Link>
            </>
          )}
        </nav>

        {/* Botón de menú móvil */}
        <button 
          className="md:hidden focus:outline-none z-10"
          onClick={toggleMobileMenu}
          aria-label="Menú principal"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        {/* Opciones de usuario - Desktop */}
        <div className="hidden md:flex items-center space-x-4">
          {/* Botón de tema */}
          <ThemeToggle />

          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <div className="hidden md:block">
                <span className="text-sm font-medium">{user?.name}</span>
              </div>
              <div className="relative group">
                <button 
                  className={`
                    w-9 h-9 rounded-full flex items-center justify-center
                    ${scrolled ? 'bg-gray-200 dark:bg-dark-bg-tertiary' : 'bg-white/20 dark:bg-dark-bg-tertiary'}
                    transition-all duration-300
                  `}
                >
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user?.name} className="w-8 h-8 rounded-full" />
                  ) : (
                    <span className="text-lg">{user?.name?.[0]?.toUpperCase()}</span>
                  )}
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-bg-secondary text-gray-800 dark:text-dark-text-primary rounded-md shadow-lg py-1 z-10 hidden group-hover:block animate-fade-in">
                  <Link to="/profile" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary">
                    Perfil
                  </Link>
                  <Link to="/settings" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary">
                    Configuración
                  </Link>
                  <button 
                    onClick={logout}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary"
                  >
                    Cerrar sesión
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex space-x-2">
              <Link to="/login" className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 dark:bg-dark-bg-tertiary dark:hover:bg-opacity-80 transition-colors">
                Iniciar sesión
              </Link>
              <Link to="/register" className="px-4 py-2 rounded-md bg-accent hover:bg-accent-dark transition-colors">
                Registrarse
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Menú móvil */}
      <div 
        className={`fixed inset-0 bg-white dark:bg-dark-bg-primary z-40 transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } md:hidden`}
      >
        <div className="flex flex-col h-full pt-20 px-6">
          <nav className="flex-1">
            {isAuthenticated ? (
              <ul className="space-y-4">
                <li>
                  <Link 
                    to="/dashboard" 
                    className={`block py-2 text-lg font-medium ${
                      location.pathname === '/dashboard' ? 'text-primary' : 'text-gray-800 dark:text-dark-text-primary'
                    }`}
                    onClick={toggleMobileMenu}
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/tasks" 
                    className={`block py-2 text-lg font-medium ${
                      location.pathname === '/tasks' ? 'text-primary' : 'text-gray-800 dark:text-dark-text-primary'
                    }`}
                    onClick={toggleMobileMenu}
                  >
                    Tareas
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/calendar" 
                    className={`block py-2 text-lg font-medium ${
                      location.pathname === '/calendar' ? 'text-primary' : 'text-gray-800 dark:text-dark-text-primary'
                    }`}
                    onClick={toggleMobileMenu}
                  >
                    Calendario
                  </Link>
                </li>
              </ul>
            ) : (
              <ul className="space-y-4">
                <li>
                  <Link 
                    to="/login" 
                    className="block py-2 text-lg font-medium text-gray-800 dark:text-dark-text-primary"
                    onClick={toggleMobileMenu}
                  >
                    Iniciar sesión
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/register" 
                    className="block py-2 text-lg font-medium text-gray-800 dark:text-dark-text-primary"
                    onClick={toggleMobileMenu}
                  >
                    Registrarse
                  </Link>
                </li>
              </ul>
            )}
          </nav>
          
          {/* Selector de tema en móvil */}
          <div className="border-t border-gray-200 dark:border-dark-border pt-4 mt-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">Tema</h3>
            <ThemeToggle />
          </div>
          
          {isAuthenticated && (
            <div className="border-t border-gray-200 dark:border-dark-border pt-4 mt-4">
              <Link 
                to="/profile" 
                className="block py-2 text-gray-800 dark:text-dark-text-primary"
                onClick={toggleMobileMenu}
              >
                Perfil
              </Link>
              <Link 
                to="/settings" 
                className="block py-2 text-gray-800 dark:text-dark-text-primary"
                onClick={toggleMobileMenu}
              >
                Configuración
              </Link>
              <button 
                onClick={() => {
                  logout();
                  toggleMobileMenu();
                }}
                className="block w-full text-left py-2 text-gray-800 dark:text-dark-text-primary"
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header; 