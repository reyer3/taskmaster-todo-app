import { useState, useEffect } from 'react';

/**
 * Hook personalizado para aplicar debounce a un valor
 * Se asegura de no realizar actualizaciones automáticas en la carga inicial
 * 
 * @param {*} value - El valor al que aplicar debounce
 * @param {number} delay - El tiempo en milisegundos para el debounce
 * @param {number} minLength - Longitud mínima que debe tener el valor (para strings)
 * @returns {*} - El valor después de aplicar debounce
 */
function useDebounce(value, delay = 500, minLength = 0) {
  // Iniciamos con string vacío para evitar actualizaciones automáticas iniciales
  const [debouncedValue, setDebouncedValue] = useState('');
  
  // Flag para detectar si ha habido un cambio real en el valor
  const [hasChanged, setHasChanged] = useState(false);

  useEffect(() => {
    // Primer cambio: marcar que el valor ha cambiado si es diferente del valor inicial
    if (value !== '' && !hasChanged) {
      setHasChanged(true);
    }
    
    // Ignorar el procesamiento si no ha habido un cambio real (carga inicial)
    if (!hasChanged && value === '') {
      return;
    }
    
    // Para strings, verificar longitud mínima
    if (typeof value === 'string' && minLength > 0) {
      if (value.length < minLength) {
        // Si no cumple la longitud mínima, establecer valor vacío
        setDebouncedValue('');
        return;
      }
    }

    // Aplicar debounce mediante setTimeout
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Función de limpieza para cancelar el timer si el valor cambia antes del delay
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay, minLength, hasChanged]);

  return debouncedValue;
}

export default useDebounce; 