import { useState, useEffect } from 'react';

/**
 * Hook personalizado para implementar un valor con debounce
 * Útil para búsquedas y otros casos donde queremos evitar llamadas excesivas
 * 
 * @param {any} value - El valor que queremos aplicar debounce
 * @param {number} delay - Tiempo de retraso en milisegundos (por defecto: 500ms)
 * @returns {any} - El valor con debounce aplicado
 */
function useDebounce(value, delay = 500) {
  // Estado para almacenar el valor con debounce
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Configurar temporizador para actualizar el valor después del retraso
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Limpiar el temporizador si el valor cambia (o el componente se desmonta)
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]); // Solo se vuelve a ejecutar si value o delay cambian

  return debouncedValue;
}

export default useDebounce; 