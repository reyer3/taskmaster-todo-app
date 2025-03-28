/**
 * Servicios para autenticación
 * 
 * Este módulo proporciona funciones para interactuar con los endpoints
 * de autenticación de la API.
 */
import apiClient from '../../../services/api';

/**
 * Inicia sesión con credenciales
 * 
 * @param {string} email - Email del usuario
 * @param {string} password - Contraseña del usuario
 * @returns {Promise<Object>} Datos del usuario y token
 */
export const loginUser = async (email, password) => {
  return await apiClient.post('/auth/login', { email, password });
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
  return await apiClient.post('/auth/register', userData);
};

/**
 * Obtiene los datos del usuario actual
 * 
 * @returns {Promise<Object>} Datos del usuario
 */
export const getCurrentUser = async () => {
  return await apiClient.get('/auth/me');
};

/**
 * Actualiza los datos del usuario
 * 
 * @param {Object} userData - Datos actualizados del usuario
 * @returns {Promise<Object>} Datos actualizados del usuario
 */
export const updateUser = async (userData) => {
  return await apiClient.put('/auth/me', userData);
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
  return await apiClient.put('/auth/password', passwordData);
};
