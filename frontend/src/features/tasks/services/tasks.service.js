/**
 * Servicios para gestión de tareas
 * 
 * Este módulo proporciona funciones para interactuar con los endpoints
 * de tareas de la API.
 */
import apiClient from '../../../services/api';

/**
 * Obtiene todas las tareas del usuario
 * 
 * @param {Object} params - Parámetros de consulta
 * @param {string} params.status - Filtro por estado ('completed', 'pending', 'all')
 * @param {string} params.category - Filtro por categoría
 * @param {string} params.search - Término de búsqueda
 * @returns {Promise<Array>} Lista de tareas
 */
export const getTasks = async (params = {}) => {
  return await apiClient.get('/tasks', { params });
};

/**
 * Obtiene una tarea por su ID
 * 
 * @param {number} id - ID de la tarea
 * @returns {Promise<Object>} Datos de la tarea
 */
export const getTaskById = async (id) => {
  return await apiClient.get(`/tasks/${id}`);
};

/**
 * Crea una nueva tarea
 * 
 * @param {Object} taskData - Datos de la tarea
 * @param {string} taskData.title - Título de la tarea
 * @param {string} taskData.description - Descripción de la tarea (opcional)
 * @param {boolean} taskData.completed - Estado de completitud
 * @param {string} taskData.category - Categoría de la tarea
 * @param {Date} taskData.dueDate - Fecha de vencimiento (opcional)
 * @returns {Promise<Object>} Tarea creada
 */
export const createTask = async (taskData) => {
  return await apiClient.post('/tasks', taskData);
};

/**
 * Actualiza una tarea existente
 * 
 * @param {number} id - ID de la tarea
 * @param {Object} taskData - Datos actualizados de la tarea
 * @returns {Promise<Object>} Tarea actualizada
 */
export const updateTask = async (id, taskData) => {
  return await apiClient.put(`/tasks/${id}`, taskData);
};

/**
 * Elimina una tarea
 * 
 * @param {number} id - ID de la tarea
 * @returns {Promise<Object>} Resultado de la operación
 */
export const deleteTask = async (id) => {
  return await apiClient.delete(`/tasks/${id}`);
};

/**
 * Marca una tarea como completada
 * 
 * @param {number} id - ID de la tarea
 * @returns {Promise<Object>} Tarea actualizada
 */
export const markTaskAsCompleted = async (id) => {
  return await updateTask(id, { completed: true });
};

/**
 * Marca una tarea como pendiente
 * 
 * @param {number} id - ID de la tarea
 * @returns {Promise<Object>} Tarea actualizada
 */
export const markTaskAsPending = async (id) => {
  return await updateTask(id, { completed: false });
};

/**
 * Obtiene estadísticas de tareas
 * 
 * @returns {Promise<Object>} Estadísticas de tareas
 */
export const getTaskStats = async () => {
  return await apiClient.get('/tasks/stats');
};
