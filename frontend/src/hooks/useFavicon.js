import { useEffect } from 'react';
import { THEMES } from './useTheme';

/**
 * Hook personalizado para gestionar el favicon basado en el tema
 * Cambia dinámicamente entre favicons claro y oscuro
 * @param {string} resolvedTheme - El tema actualmente aplicado (light/dark)
 */
const useFavicon = (resolvedTheme) => {
  useEffect(() => {
    // Solo ejecutar en cliente
    if (typeof document === 'undefined') return;

    // Obtener elementos de favicon
    const faviconElement = document.querySelector('link[rel="icon"][type="image/svg+xml"]');
    
    if (faviconElement) {
      if (resolvedTheme === THEMES.DARK) {
        // Aplicar favicon para modo oscuro
        faviconElement.href = '/icons/favicon-dark.svg';
      } else {
        // Aplicar favicon para modo claro
        faviconElement.href = '/icons/favicon.svg';
      }
    }
  }, [resolvedTheme]);
};

export default useFavicon; 