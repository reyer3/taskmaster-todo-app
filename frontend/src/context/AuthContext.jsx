import { createContext, useState, useEffect } from 'react';
import { loginUser, registerUser, getCurrentUser } from '../features/auth/services/auth.service';
import { setToken, removeToken, getToken } from '../services/token.service';
import { useToast } from '../hooks/useToast';

// Creación del contexto
export const AuthContext = createContext();

/**
 * Proveedor del contexto de autenticación
 * Maneja el estado de autenticación, login, registro y cierre de sesión
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  /**
   * Efecto para verificar el token al cargar la aplicación
   */
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = getToken();
        if (!token) {
          setIsLoading(false);
          return;
        }

        const userData = await getCurrentUser();
        if (userData) {
          setUser(userData);
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error('Error al verificar autenticación:', err);
        removeToken();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  /**
   * Función para iniciar sesión
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña del usuario
   * @returns {Promise<Object>} Datos del usuario
   */
  const login = async (email, password) => {
    setError(null);
    try {
      const { user, token } = await loginUser(email, password);
      setToken(token);
      setUser(user);
      setIsAuthenticated(true);
      showToast({
        type: 'success',
        message: '¡Bienvenido de nuevo!'
      });
      return user;
    } catch (err) {
      const message = err.response?.data?.message || 'Error al iniciar sesión';
      setError(message);
      showToast({
        type: 'error',
        message
      });
      throw err;
    }
  };

  /**
   * Función para registrar un nuevo usuario
   * @param {Object} userData - Datos del usuario
   * @returns {Promise<Object>} Datos del usuario registrado
   */
  const register = async (userData) => {
    setError(null);
    try {
      const { user, token } = await registerUser(userData);
      setToken(token);
      setUser(user);
      setIsAuthenticated(true);
      showToast({
        type: 'success',
        message: '¡Cuenta creada exitosamente!'
      });
      return user;
    } catch (err) {
      const message = err.response?.data?.message || 'Error al registrar usuario';
      setError(message);
      showToast({
        type: 'error',
        message
      });
      throw err;
    }
  };

  /**
   * Función para cerrar sesión
   */
  const logout = () => {
    removeToken();
    setUser(null);
    setIsAuthenticated(false);
    showToast({
      type: 'info',
      message: 'Has cerrado sesión'
    });
  };

  // Valores proporcionados por el contexto
  const value = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
