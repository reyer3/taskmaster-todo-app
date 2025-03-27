/**
 * Hook personalizado para acceder al contexto de autenticación
 * 
 * Este hook proporciona acceso a los valores y funciones del contexto de autenticación
 */
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * Hook para usar el contexto de autenticación
 * @returns {Object} Valores y funciones del contexto de autenticación
 * @property {Object|null} user - Datos del usuario autenticado o null
 * @property {boolean} isAuthenticated - Indica si hay un usuario autenticado
 * @property {boolean} isLoading - Indica si se está verificando la autenticación
 * @property {string|null} error - Mensaje de error si hay alguno
 * @property {Function} login - Función para iniciar sesión
 * @property {Function} register - Función para registrar un nuevo usuario
 * @property {Function} logout - Función para cerrar sesión
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  
  return context;
};
