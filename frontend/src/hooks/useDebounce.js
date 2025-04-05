import { useState, useEffect } from 'react';

/**
 * Hook personalizado para aplicar debounce a un valor
 * @param {*} value - El valor al que aplicar debounce
 * @param {number} delay - El tiempo en milisegundos que debe transcurrir para actualizar el valor
 * @param {number} minLength - Longitud mínima que debe tener el valor para activar el debounce (solo para strings)
 * @returns {*} - El valor después de aplicar debounce
 */
function useDebounce(value, delay = 500, minLength = 0) {
  const [debouncedValue, setDebouncedValue] = useState('');

  useEffect(() => {
    // Para valores string, verificar la longitud mínima
    if (typeof value === 'string' && minLength > 0) {
      // Si no cumple la longitud mínima, establecer valor vacío
      if (value.length < minLength) {
        setDebouncedValue('');
        return;
      }
    }

    // Configurar el timer para actualizar el valor después del delay
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Limpiar el timer si el valor cambia antes del delay
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay, minLength]);

  return debouncedValue;
}

export default useDebounce; 