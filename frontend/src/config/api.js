/**
 * Configuración de la API para la aplicación TaskMaster
 * Define las URLs base y los endpoints para cada recurso
 */

// URL base de la API (cambiará según el entorno)
export const API_BASE_URL = import.meta.env.MODE === 'production'
  ? 'https://api.taskmaster-app.com/api'
  : 'http://localhost:3001/api';

// Para obtener directamente de variables de entorno de Vite si están definidas
export const API_URL_ENV = import.meta.env.VITE_API_URL;

// Versión de la API
export const API_VERSION = 'v1';

// URL completa base - usando variables de entorno de Vite si están disponibles
export const API_URL = import.meta.env.VITE_API_URL || `${API_BASE_URL}/${API_VERSION}`;

// Timeout para las peticiones (en milisegundos)
export const API_TIMEOUT = 15000;

// Endpoints por recurso
export const ENDPOINTS = {
  // Autenticación
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH_TOKEN: '/auth/refresh-token',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
  },
  
  // Usuarios
  USERS: {
    BASE: '/users',
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    CHANGE_PASSWORD: '/users/change-password',
    PREFERENCES: '/users/preferences',
  },
  
  // Tareas
  TASKS: {
    BASE: '/tasks',
    BY_ID: (id) => `/tasks/${id}`,
    COMPLETE: (id) => `/tasks/${id}/complete`,
    UNCOMPLETE: (id) => `/tasks/${id}/uncomplete`,
    IMPORTANT: (id) => `/tasks/${id}/important`,
    COMMENTS: (id) => `/tasks/${id}/comments`,
    ATTACHMENTS: (id) => `/tasks/${id}/attachments`,
    SUBTASKS: (id) => `/tasks/${id}/subtasks`,
  },
  
  // Categorías
  CATEGORIES: {
    BASE: '/categories',
    BY_ID: (id) => `/categories/${id}`,
    TASKS: (id) => `/categories/${id}/tasks`,
  },
  
  // Etiquetas
  TAGS: {
    BASE: '/tags',
    BY_ID: (id) => `/tags/${id}`,
    TASKS: (id) => `/tags/${id}/tasks`,
  },
  
  // Notificaciones
  NOTIFICATIONS: {
    BASE: '/notifications',
    BY_ID: (id) => `/notifications/${id}`,
    MARK_READ: (id) => `/notifications/${id}/read`,
    MARK_ALL_READ: '/notifications/read-all',
    PREFERENCES: '/notifications/preferences',
  },
  
  // Dashboard y estadísticas
  DASHBOARD: {
    SUMMARY: '/dashboard/summary',
    RECENT_TASKS: '/dashboard/recent-tasks',
    STATISTICS: '/dashboard/statistics',
    ACTIVITY: '/dashboard/activity',
  },
};

// Errores comunes de la API
export const API_ERRORS = {
  UNAUTHORIZED: 'No autorizado. Por favor inicie sesión nuevamente.',
  FORBIDDEN: 'No tiene permisos para realizar esta acción.',
  NOT_FOUND: 'El recurso solicitado no existe.',
  SERVER_ERROR: 'Error en el servidor. Por favor intente más tarde.',
  NETWORK_ERROR: 'Error de conexión. Verifique su conexión a internet.',
  TIMEOUT: 'La solicitud ha excedido el tiempo máximo. Intente nuevamente.',
  VALIDATION: 'Error de validación. Verifique los datos ingresados.',
}; 