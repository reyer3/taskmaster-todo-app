import api from '../../../services/api';

/**
 * Obtiene las estadísticas del dashboard
 * @returns {Promise} - Promesa con los datos de estadísticas
 */
export const getDashboardStats = async () => {
  try {
    const response = await api.get('/dashboard/summary');
    return response;
  } catch (error) {
    console.error('Error obteniendo estadísticas del dashboard:', error);
    throw error;
  }
};

/**
 * Obtiene las tareas recientes
 * @param {number} limit - Cantidad máxima de tareas a retornar
 * @returns {Promise} - Promesa con las tareas recientes
 */
export const getRecentTasks = async (limit = 5) => {
  try {
    const response = await api.get(`/dashboard/recent-tasks?limit=${limit}`);
    return response;
  } catch (error) {
    console.error('Error obteniendo tareas recientes:', error);
    throw error;
  }
};

/**
 * Obtiene los datos de actividad para el calendario de calor
 * @param {number} days - Cantidad de días a retornar
 * @returns {Promise} - Promesa con los datos de actividad
 */
export const getActivityData = async (days = 30) => {
  try {
    const response = await api.get(`/dashboard/activity?days=${days}`);
    return response;
  } catch (error) {
    console.error('Error obteniendo datos de actividad:', error);
    throw error;
  }
};

/**
 * Busca tareas según los filtros aplicados
 * @param {Object} filters - Criterios de búsqueda y filtrado
 * @returns {Promise} - Promesa con las tareas encontradas
 */
export const searchTasks = async (filters) => {
  try {
    const response = await api.post('/tasks/search', filters);
    return response;
  } catch (error) {
    console.error('Error buscando tareas:', error);
    throw error;
  }
}; 