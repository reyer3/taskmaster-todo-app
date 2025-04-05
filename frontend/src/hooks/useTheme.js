import { useState, useEffect } from 'react';

// Valores posibles de tema
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
};

/**
 * Hook personalizado para gestionar el tema de la aplicación
 * Soporta temas claro, oscuro y sistema
 * @returns {Object} - Funciones y estado del tema
 */
export const useTheme = () => {
  // Detectar si el sistema prefiere modo oscuro
  const getSystemTheme = () => {
    if (typeof window === 'undefined') return THEMES.LIGHT;
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? THEMES.DARK
      : THEMES.LIGHT;
  };
  
  // Resolver el tema actual (considerando system)
  const resolveTheme = (themeSetting) => {
    return themeSetting === THEMES.SYSTEM ? getSystemTheme() : themeSetting;
  };
  
  // Estado para el tema seleccionado por el usuario
  const [theme, setThemeState] = useState(() => {
    // Intentar recuperar del localStorage
    if (typeof window === 'undefined') return THEMES.SYSTEM;
    
    try {
      // Verificar si hay un valor antiguo en localStorage con la clave 'darkMode'
      const oldTheme = localStorage.getItem('darkMode');
      if (oldTheme !== null) {
        // Convertir el antiguo formato (true/false) al nuevo formato (dark/light)
        const newTheme = oldTheme === 'true' ? THEMES.DARK : THEMES.LIGHT;
        // Sobrescribir con el nuevo formato
        localStorage.setItem('theme', newTheme);
        return newTheme;
      }
      
      // Usar el nuevo formato si existe
      const savedTheme = localStorage.getItem('theme');
      return savedTheme || THEMES.SYSTEM;
    } catch (e) {
      console.error('Error accediendo a localStorage:', e);
      return THEMES.SYSTEM;
    }
  });
  
  // Estado para el tema resuelto (siempre light o dark)
  const [resolvedTheme, setResolvedTheme] = useState(() => resolveTheme(theme));
  
  // Aplicar tema al DOM de forma imperativa e inmediata
  const applyThemeToDOM = (resolvedValue) => {
    if (typeof document === 'undefined') return;
    
    // Forzar aplicación inmediata en el HTML
    if (resolvedValue === THEMES.DARK) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // También aplicar como data-attribute para mejor compatibilidad
    document.documentElement.setAttribute('data-theme', resolvedValue);
    
    console.log(`Tema aplicado al DOM: ${resolvedValue}`);
  };
  
  // Función para cambiar el tema con aplicación inmediata
  const setTheme = (newTheme) => {
    if (typeof window === 'undefined') return;
    
    try {
      // Validar tema
      if (!Object.values(THEMES).includes(newTheme)) {
        console.error(`Tema inválido: ${newTheme}`);
        return;
      }
      
      // Guardar en localStorage
      localStorage.setItem('theme', newTheme);
      
      // Actualizar estado
      setThemeState(newTheme);
      
      // Resolver y aplicar tema inmediatamente
      const newResolvedTheme = resolveTheme(newTheme);
      setResolvedTheme(newResolvedTheme);
      applyThemeToDOM(newResolvedTheme);
      
      console.log(`Tema cambiado a: ${newTheme} (resuelto: ${newResolvedTheme})`);
    } catch (e) {
      console.error('Error configurando tema:', e);
    }
  };
  
  // Función para alternar entre claro y oscuro
  const toggleTheme = () => {
    const newTheme = resolvedTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
    setTheme(newTheme);
  };
  
  // Inicialización inmediata al montar el componente
  useEffect(() => {
    // Forzar aplicación del tema al DOM inmediatamente en primera renderización
    const initialResolved = resolveTheme(theme);
    applyThemeToDOM(initialResolved);
    setResolvedTheme(initialResolved);
  }, []);
  
  // Efecto para cambios en el tema seleccionado
  useEffect(() => {
    // Aplicar el tema cuando cambie la selección
    const currentResolved = resolveTheme(theme);
    setResolvedTheme(currentResolved);
    applyThemeToDOM(currentResolved);
    
    // Gestionar cambios en preferencia del sistema si theme=system
    if (theme === THEMES.SYSTEM) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleSystemThemeChange = () => {
        const newSystemTheme = getSystemTheme();
        setResolvedTheme(newSystemTheme);
        applyThemeToDOM(newSystemTheme);
        console.log(`Preferencia de sistema cambiada a: ${newSystemTheme}`);
      };
      
      // Configurar listener para cambios en preferencia del sistema
      mediaQuery.addEventListener('change', handleSystemThemeChange);
      
      // Limpiar listener al desmontar
      return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
    }
  }, [theme]);

  // Compatibilidad con la API anterior
  const darkMode = resolvedTheme === THEMES.DARK;
  const toggleDarkMode = toggleTheme;

  return { 
    theme, 
    resolvedTheme, 
    setTheme, 
    toggleTheme,
    // Compatibilidad con la API anterior
    darkMode,
    toggleDarkMode
  };
};

export default useTheme;
