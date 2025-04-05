import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../hooks/useTheme';

/**
 * Componente para cambiar entre temas
 */
const ThemeToggle = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  
  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const selectTheme = (newTheme) => {
    setTheme(newTheme);
    setMenuOpen(false);
  };
  
  // Icono según el tema actual
  const getIcon = () => {
    if (resolvedTheme === 'dark') {
      return (
        <svg className="w-5 h-5 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      );
    } else {
      return (
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      );
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={toggleMenu}
        className="p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label="Cambiar tema"
      >
        {getIcon()}
      </button>
      
      {menuOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-dark-card rounded-md shadow-lg z-10 animate-fade-in">
          <button
            onClick={() => selectTheme('light')}
            className={`flex items-center w-full text-left px-4 py-2 text-sm ${
              resolvedTheme === 'light' 
                ? 'text-primary dark:text-primary-light' 
                : 'text-gray-700 dark:text-dark-text-primary'
            } hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary`}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Claro
          </button>
          
          <button
            onClick={() => selectTheme('dark')}
            className={`flex items-center w-full text-left px-4 py-2 text-sm ${
              resolvedTheme === 'dark' 
                ? 'text-primary dark:text-primary-light' 
                : 'text-gray-700 dark:text-dark-text-primary'
            } hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary`}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
            Oscuro
          </button>
          
          <button
            onClick={() => selectTheme('system')}
            className={`flex items-center w-full text-left px-4 py-2 text-sm ${
              resolvedTheme === 'system' 
                ? 'text-primary dark:text-primary-light' 
                : 'text-gray-700 dark:text-dark-text-primary'
            } hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary`}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Sistema
          </button>
        </div>
      )}
    </div>
  );
};

export default ThemeToggle;
