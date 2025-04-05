/**
 * Configuración del cliente Axios para peticiones a la API
 * 
 * Este módulo configura un cliente Axios con interceptores para
 * gestión de tokens, manejo de errores y reintento de peticiones.
 */
import axios from 'axios';
import { API_URL, API_TIMEOUT, API_ERRORS } from '../config/api';

/**
 * Servicio para llamadas a la API con Axios
 * Incluye interceptores para manejar tokens y errores
 */

// Crear instancia de axios con configuración base
const api = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Función para obtener token del almacenamiento
const getAuthToken = () => {
  return localStorage.getItem('auth_token');
};

/**
 * Interceptor para añadir token a las peticiones
 */
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Interceptor para manejar respuestas y errores
 */
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Preparar mensaje de error amigable
    let errorMessage = API_ERRORS.SERVER_ERROR;
    
    if (error.response) {
      // El servidor respondió con un código de error
      const { status } = error.response;
      
      switch (status) {
        case 401:
          errorMessage = API_ERRORS.UNAUTHORIZED;
          // Se podría disparar un evento para redireccionar al login
          // o refrescar el token si es necesario
          break;
        case 403:
          errorMessage = API_ERRORS.FORBIDDEN;
          break;
        case 404:
          errorMessage = API_ERRORS.NOT_FOUND;
          break;
        case 422:
          errorMessage = API_ERRORS.VALIDATION;
          if (error.response.data && error.response.data.errors) {
            // Extraer mensajes específicos de validación si existen
            errorMessage = Object.values(error.response.data.errors)
              .flat()
              .join('. ');
          }
          break;
        default:
          errorMessage = error.response.data?.message || API_ERRORS.SERVER_ERROR;
      }
    } else if (error.request) {
      // La petición fue hecha pero no hubo respuesta
      if (error.code === 'ECONNABORTED') {
        errorMessage = API_ERRORS.TIMEOUT;
      } else {
        errorMessage = API_ERRORS.NETWORK_ERROR;
      }
    }
    
    // Aquí se podría integrar con un sistema de notificaciones
    console.error('API Error:', errorMessage);
    
    return Promise.reject({
      message: errorMessage,
      originalError: error
    });
  }
);

// Método para hacer peticiones GET
export const get = (url, params = {}) => {
  return api.get(url, { params });
};

// Método para hacer peticiones POST
export const post = (url, data = {}) => {
  return api.post(url, data);
};

// Método para hacer peticiones PUT
export const put = (url, data = {}) => {
  return api.put(url, data);
};

// Método para hacer peticiones PATCH
export const patch = (url, data = {}) => {
  return api.patch(url, data);
};

// Método para hacer peticiones DELETE
export const del = (url) => {
  return api.delete(url);
};

// Exportar la instancia completa para usos especiales
export default api;
