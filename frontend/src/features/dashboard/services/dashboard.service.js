import { apiClient } from '../../../services/api';

/**
 * Obtiene las estadísticas del dashboard
 * @returns {Promise} - Promesa con los datos de estadísticas
 */
export const getDashboardStats = async () => {
  try {
    // Intentar primero con la API real
    try {
      const response = await apiClient.get('/dashboard/summary');
      return response;
    } catch (error) {
      console.warn('API no disponible, usando datos simulados:', error);
      
      // Si falla, usar datos simulados
      return {
        totalTasks: 12,
        completedTasks: 5,
        pendingTasks: 7,
        dueSoonTasks: 3,
        categories: [
          { name: 'Trabajo', count: 5 },
          { name: 'Personal', count: 4 },
          { name: 'Estudio', count: 3 },
        ]
      };
    }
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
    // Intentar primero con la API real
    try {
      const response = await apiClient.get(`/dashboard/recent-tasks?limit=${limit}`);
      return response;
    } catch (error) {
      console.warn('API no disponible, usando datos simulados:', error);
      
      // Si falla, usar datos simulados
      return [
        { id: 1, title: 'Completar informe mensual', status: 'pending', createdAt: '2023-04-02T10:30:00Z', priority: 'high' },
        { id: 2, title: 'Reunión con equipo de diseño', status: 'completed', createdAt: '2023-04-01T14:00:00Z', priority: 'medium' },
        { id: 3, title: 'Revisar propuesta de cliente', status: 'pending', createdAt: '2023-03-31T09:15:00Z', priority: 'high' },
        { id: 4, title: 'Actualizar documentación', status: 'pending', createdAt: '2023-03-30T16:45:00Z', priority: 'low' },
        { id: 5, title: 'Preparar presentación', status: 'completed', createdAt: '2023-03-29T11:20:00Z', priority: 'medium' },
      ].slice(0, limit);
    }
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
    // Intentar primero con la API real
    try {
      const response = await apiClient.get(`/dashboard/activity?days=${days}`);
      return response;
    } catch (error) {
      console.warn('API no disponible, usando datos simulados:', error);
      
      // Si falla, simular datos
      const data = [];
      const today = new Date();
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        
        // Generar un número aleatorio de actividades (0-5)
        const count = Math.floor(Math.random() * 6);
        
        data.push({
          date: date.toISOString().split('T')[0],
          count: count
        });
      }
      
      return data;
    }
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
    // Intentar primero con la API real
    try {
      const response = await apiClient.post('/tasks/search', filters);
      return response;
    } catch (error) {
      console.warn('API no disponible, usando datos simulados:', error);
      
      // Si falla, simular con datos y filtrado local
      const mockTasks = [
        { id: 1, title: 'Completar informe mensual', status: 'pending', dueDate: '2023-04-10', priority: 'high' },
        { id: 2, title: 'Reunión con equipo de diseño', status: 'completed', dueDate: '2023-04-05', priority: 'medium' },
        { id: 3, title: 'Revisar propuesta de cliente', status: 'pending', dueDate: '2023-04-12', priority: 'high' },
        { id: 4, title: 'Actualizar documentación', status: 'pending', dueDate: '2023-04-15', priority: 'low' },
        { id: 5, title: 'Preparar presentación', status: 'completed', dueDate: '2023-04-02', priority: 'medium' },
      ];
      
      // Lógica simple de filtrado para simular comportamiento de API
      let results = [...mockTasks];
      
      // Filtrar por búsqueda
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        results = results.filter(task => 
          task.title.toLowerCase().includes(query)
        );
      }
      
      // Filtrar por estado
      if (filters.status) {
        results = results.filter(task => task.status === filters.status);
      }
      
      // Filtrar por prioridad
      if (filters.priority) {
        results = results.filter(task => task.priority === filters.priority);
      }
      
      // Filtrar por fecha
      if (filters.dateRange && filters.dateRange !== 'all') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        
        const monthStart = new Date(today);
        monthStart.setDate(1);
        
        results = results.filter(task => {
          const taskDate = new Date(task.dueDate);
          
          switch (filters.dateRange) {
            case 'today':
              return taskDate.toDateString() === today.toDateString();
            case 'week':
              return taskDate >= weekStart && taskDate < new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
            case 'month':
              return taskDate.getMonth() === today.getMonth() && taskDate.getFullYear() === today.getFullYear();
            case 'overdue':
              return taskDate < today;
            default:
              return true;
          }
        });
      }
      
      return results;
    }
  } catch (error) {
    console.error('Error buscando tareas:', error);
    throw error;
  }
}; 