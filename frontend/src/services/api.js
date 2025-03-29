/**
 * Configuración del cliente Axios para peticiones a la API
 * 
 * Este módulo configura un cliente Axios con interceptores para
 * gestión de tokens, manejo de errores y reintento de peticiones.
 */
import axios from 'axios';
import { getToken } from './token.service';

// URL base de la API desde las variables de entorno
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

/**
 * Cliente Axios configurado para la API
 */
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Interceptor para añadir el token a las peticiones
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
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
apiClient.interceptors.response.use(
  // Respuestas exitosas
  (response) => {
    return response.data;
  },
  // Errores
  async (error) => {
    const originalRequest = error.config;

    // Si el error es 401 (No autorizado) y no hemos intentado ya renovar el token
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Aquí podríamos intentar renovar el token si tuviéramos un endpoint para ello

      // Por ahora, simplemente rechazamos la promesa
      return Promise.reject(error);
    }

    // Formatear mensaje de error para el cliente
    if (error.response) {
      // La petición fue hecha y el servidor respondió con un código de estado
      // que cae fuera del rango 2xx
      error.message = error.response.data.message || 'Error en la petición';
    } else if (error.request) {
      // La petición fue hecha, pero no se recibió respuesta
      error.message = 'No se pudo conectar con el servidor';
    } else {
      // Algo ocurrió al configurar la petición que desencadenó un error
      error.message = 'Error al realizar la petición';
    }

    return Promise.reject(error);
  }
);

export default apiClient;
