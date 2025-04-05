import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { useAuth } from '../../hooks/useAuth';
import { LayoutContext } from '../../context/LayoutContext';
import useTheme from '../../hooks/useTheme';

/**
 * Componente de layout principal que organiza la estructura de la aplicación
 * Integra Header, Sidebar, contenido principal (Outlet) y Footer
 * 
 * @param {Object} props Propiedades del componente
 * @param {boolean} props.showHeader Mostrar el header (default: true)
 * @param {boolean} props.showSidebar Mostrar el sidebar (default: true si está autenticado)
 * @param {boolean} props.showFooter Mostrar el footer (default: true)
 * @param {string} props.contentClassName Clases adicionales para el contenido principal
 */
const Layout = ({
  showHeader = true,
  showSidebar = null, // null = automático basado en autenticación
  showFooter = true,
  contentClassName = ""
}) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const { darkMode } = useTheme();
  
  // Determinar si mostrar sidebar (si no se especifica, depende de la autenticación)
  const displaySidebar = showSidebar === null ? isAuthenticated : showSidebar;
  
  // Rutas públicas que pueden tener estilos diferentes
  const isPublicRoute = location.pathname === '/login' || location.pathname === '/register';

  return (
    <LayoutContext.Provider value={{ isAuthenticated, isPublicRoute }}>
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-dark-bg-primary font-sans text-gray-800 dark:text-dark-text-primary">
        {showHeader && <Header />}
        
        <div className="flex flex-1 relative">
          {displaySidebar && <Sidebar />}
          
          <main 
            className={`flex-1 transition-all duration-300 ease-in-out
              ${displaySidebar ? 'lg:ml-64' : ''}
              ${contentClassName}
              ${isPublicRoute ? 'bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-dark-bg-secondary dark:to-dark-bg-tertiary' : ''}
              pt-6`}
          >
            <div className={`
              mx-auto px-4 sm:px-6 
              ${isPublicRoute ? 'max-w-md' : 'max-w-7xl'}
              animate-fade-in
            `}>
              <Outlet />
            </div>
          </main>
        </div>
        
        {showFooter && (
          <Footer />
        )}
      </div>
    </LayoutContext.Provider>
  );
};

export default Layout; 