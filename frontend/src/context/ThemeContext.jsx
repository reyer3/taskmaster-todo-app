// ESTE ARCHIVO ESTÁ DESACTIVADO
// Ahora estamos usando el hook useTheme.js en su lugar
// Mantener solo por compatibilidad con versiones anteriores

/*
import React, { createContext, useContext, useEffect, useState } from 'react';

// Crear el contexto para el tema
export const ThemeContext = createContext();

// Provider para gestionar el tema de la aplicación
export const ThemeProvider = ({ children }) => {
  // Temas disponibles
  const themes = ['light', 'dark', 'system'];
  
  // Obtener tema guardado o usar el del sistema por defecto
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme && themes.includes(savedTheme) ? savedTheme : 'system';
  });
  
  // Estado para almacenar el tema que está actualmente aplicado
  // (puede ser diferente a theme si theme='system')
  const [resolvedTheme, setResolvedTheme] = useState('light');

  // Función para actualizar el tema
  const updateTheme = (newTheme) => {
    if (!themes.includes(newTheme)) return;
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };
  
  // Listener para cambios en preferencia del sistema
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Función para resolver el tema actual
    const resolveTheme = () => {
      if (theme === 'system') {
        return mediaQuery.matches ? 'dark' : 'light';
      }
      return theme;
    };
    
    // Actualizar tema resuelto
    const updateResolvedTheme = () => {
      const resolved = resolveTheme();
      setResolvedTheme(resolved);
      
      // Aplicar clase dark al html
      if (resolved === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };
    
    // Actualizar inmediatamente y configurar listener
    updateResolvedTheme();
    
    // Escuchar cambios en la preferencia del sistema
    const handleChange = () => {
      if (theme === 'system') {
        updateResolvedTheme();
      }
    };
    
    // Suscribirse a cambios en preferencia del sistema
    mediaQuery.addEventListener('change', handleChange);
    
    // Limpiar listener al desmontar
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [theme]);

  // Valores expuestos por el contexto
  const value = {
    theme,
    setTheme: updateTheme,
    resolvedTheme,
    themes,
    isDark: resolvedTheme === 'dark'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook para usar el contexto de tema
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme debe ser usado dentro de un ThemeProvider');
  }
  return context;
};

export default useTheme;
*/
