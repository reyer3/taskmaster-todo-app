/**
 * Servicios para autenticación
 * 
 * Este módulo proporciona funciones para interactuar con los endpoints
 * de autenticación de la API.
 */
import api from '../../../services/api';

/**
 * Inicia sesión con credenciales
 * 
 * @param {string} email - Email del usuario
 * @param {string} password - Contraseña del usuario
 * @returns {Promise<Object>} Datos del usuario y token
 */
export const loginUser = async (email, password) => {
  return await api.post('/auth/login', { email, password });
};

/**
 * Registra un nuevo usuario
 * 
 * @param {Object} userData - Datos del usuario
 * @param {string} userData.name - Nombre del usuario
 * @param {string} userData.email - Email del usuario
 * @param {string} userData.password - Contraseña del usuario
 * @returns {Promise<Object>} Datos del usuario y token
 */
export const registerUser = async (userData) => {
  return await api.post('/auth/register', userData);
};

/**
 * Obtiene los datos del usuario actual
 * 
 * @returns {Promise<Object>} Datos del usuario
 */
export const getCurrentUser = async () => {
  try {
    console.log('Llamando al endpoint /auth/me...');
    const response = await api.get('/auth/me');
    console.log('Respuesta de /auth/me:', response);
    return response;
  } catch (error) {
    console.error('Error en getCurrentUser:', error);
    // No re-lanzamos el error para que Auth context lo pueda manejar adecuadamente
    return null;
  }
};

/**
 * Actualiza los datos del usuario
 * 
 * @param {Object} userData - Datos actualizados del usuario
 * @returns {Promise<Object>} Datos actualizados del usuario
 */
export const updateUser = async (userData) => {
  return await api.put('/auth/me', userData);
};

/**
 * Cambia la contraseña del usuario
 * 
 * @param {Object} passwordData - Datos de contraseña
 * @param {string} passwordData.currentPassword - Contraseña actual
 * @param {string} passwordData.newPassword - Nueva contraseña
 * @returns {Promise<Object>} Resultado de la operación
 */
export const changePassword = async (passwordData) => {
  return await api.put('/auth/password', passwordData);
};
