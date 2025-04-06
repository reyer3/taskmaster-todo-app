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
  try {
    console.log('Enviando solicitud de login al servidor...', { email });
    const response = await api.post('/auth/login', { email, password });
    console.log('Respuesta completa del servidor:', response);
    
    // Asegurar que la respuesta tenga la estructura esperada
    if (!response) {
      console.error('Respuesta vacía del servidor');
      throw new Error('Respuesta vacía del servidor');
    }
    
    // Formato detectado: {status: 'success', data: {accessToken, user}, message: '...'}
    if (response.status === 'success' && response.data) {
      console.log('Detectada respuesta con formato {status, data, message}:', response);
      
      const { accessToken, user } = response.data;
      
      if (!accessToken) {
        console.error('No se encontró accessToken en data:', response.data);
        throw new Error('Token de acceso no encontrado en la respuesta');
      }
      
      if (!user) {
        console.error('No se encontró user en data:', response.data);
        throw new Error('Información de usuario no encontrada en la respuesta');
      }
      
      // Restructurar para que coincida con lo que espera AuthContext
      return {
        token: accessToken,  // Renombrar accessToken a token
        user: user
      };
    }
    
    // Si la respuesta no tiene un token o un usuario, pero tiene datos, intenta extraerlos
    if (!response.token && !response.data && response.user) {
      console.log('Respuesta no contiene token directamente, pero tiene otros datos:', response);
      // Estructura alternativa que podría estar enviando el servidor
      return {
        token: response.token || response.accessToken || response.access_token,
        user: response.user || response.userData || response
      };
    }
    
    return response;
  } catch (error) {
    console.error('Error en servicio loginUser:', error);
    throw error;
  }
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
  try {
    const response = await api.post('/auth/register', userData);
    console.log('Respuesta de registro:', response);
    
    // Formato detectado: {status: 'success', data: {accessToken, user}, message: '...'}
    if (response.status === 'success' && response.data) {
      console.log('Detectada respuesta con formato {status, data, message}:', response);
      
      const { accessToken, user } = response.data;
      
      if (!accessToken) {
        console.error('No se encontró accessToken en data:', response.data);
        throw new Error('Token de acceso no encontrado en la respuesta');
      }
      
      if (!user) {
        console.error('No se encontró user en data:', response.data);
        throw new Error('Información de usuario no encontrada en la respuesta');
      }
      
      // Restructurar para que coincida con lo que espera AuthContext
      return {
        token: accessToken,
        user: user
      };
    }
    
    return response;
  } catch (error) {
    console.error('Error en servicio registerUser:', error);
    throw error;
  }
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
    
    // Formato detectado: {status: 'success', data: {user}, message: '...'}
    if (response.status === 'success' && response.data) {
      console.log('Detectada respuesta con formato {status, data, message}:', response);
      
      // Si user está directamente en data o data.user
      const user = response.data.user || response.data;
      
      return user;
    }
    
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
