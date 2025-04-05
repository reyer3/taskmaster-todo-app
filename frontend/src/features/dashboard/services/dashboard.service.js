import api from '../../../services/api';





/**
 * Obtiene las estadísticas del dashboard procesando las tareas existentes
 * @returns {Promise} - Promesa con los datos de estadísticas
 */
export const getDashboardStats = async () => {
  try {
    // Obtenemos todas las tareas del usuario
    const tasks = await api.get('/tasks');
    
    // Obtenemos las tareas próximas a vencer usando el endpoint específico
    const upcomingTasks = await getUpcomingTasks(3); // Tareas que vencen en 3 días
    
    // Calculamos las métricas basadas en las tareas
    // Si no hay tareas, devolvemos valores por defecto
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return {
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        dueSoonTasks: upcomingTasks.length
      };
    }
    
    // Procesamos las tareas para obtener las estadísticas
    const completedTasks = tasks.filter(task => task.status === 'completed' || task.completed).length;
    const pendingTasks = tasks.filter(task => task.status !== 'completed' && !task.completed).length;
    
    return {
      totalTasks: tasks.length,
      completedTasks,
      pendingTasks,
      dueSoonTasks: upcomingTasks.length
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas del dashboard:', error);
    throw error;
  }
};

/**
 * Obtiene las tareas próximas a vencer usando el endpoint específico
 * @param {number} days - Número de días para considerar una tarea próxima
 * @returns {Promise} - Promesa con las tareas próximas
 */
export const getUpcomingTasks = async (days = 7) => {
  try {
    // Usamos el endpoint específico del backend para tareas próximas
    const upcomingTasks = await api.get(`/tasks/upcoming?days=${days}`);
    
    // Si la respuesta no es un array, devolvemos array vacío
    if (!Array.isArray(upcomingTasks)) {
      return [];
    }
    
    return upcomingTasks;
  } catch (error) {
    console.error(`Error obteniendo tareas próximas a vencer (${days} días):`, error);
    // Si hay error, intentamos calcular manualmente desde todas las tareas
    try {
      const allTasks = await api.get('/tasks');
      if (!Array.isArray(allTasks)) return [];
      
      const today = new Date();
      return allTasks.filter(task => {
        if (task.status === 'completed' || task.completed) return false;
        if (!task.dueDate) return false;
        
        const dueDate = new Date(task.dueDate);
        const diffTime = dueDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays >= 0 && diffDays <= days;
      });
    } catch (fallbackError) {
      console.error('Error en fallback para tareas próximas:', fallbackError);
      return [];
    }
  }
};

/**
 * Obtiene las tareas recientes usando el endpoint de tareas
 * @param {number} limit - Cantidad máxima de tareas a retornar
 * @returns {Promise} - Promesa con las tareas recientes
 */
export const getRecentTasks = async (limit = 5) => {
  try {
    // Obtenemos todas las tareas y las ordenamos manualmente
    const tasks = await api.get('/tasks');
    
    // Si no hay tareas o no es un array, devolvemos array vacío
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return [];
    }
    
    // Ordenamos por fecha de creación descendente (más recientes primero)
    const sortedTasks = [...tasks].sort((a, b) => {
      const dateA = new Date(a.createdAt || a.updatedAt || 0);
      const dateB = new Date(b.createdAt || b.updatedAt || 0);
      return dateB - dateA;
    });
    
    // Devolvemos solo la cantidad solicitada
    return sortedTasks.slice(0, limit);
  } catch (error) {
    console.error('Error obteniendo tareas recientes:', error);
    throw error;
  }
};

/**
 * Obtiene los datos de actividad para el calendario de calor
 * basados en las tareas completadas
 * @param {number} days - Cantidad de días a retornar
 * @returns {Promise} - Promesa con los datos de actividad
 */
export const getActivityData = async (days = 30) => {
  try {
    // Obtenemos todas las tareas
    const tasks = await api.get('/tasks');
    
    // Si no hay tareas o no es un array, devolvemos array vacío
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return [];
    }
    
    // Fecha actual y fecha límite (hace N días)
    const today = new Date();
    const limitDate = new Date();
    limitDate.setDate(today.getDate() - days);
    
    // Inicializamos un mapa para contar actividades por día
    const activityMap = {};
    
    // Para cada día en el rango, inicializamos el contador en 0
    for (let d = new Date(limitDate); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      activityMap[dateStr] = 0;
    }
    
    // Contamos las tareas completadas por día
    tasks.forEach(task => {
      // Si la tarea está completada y tiene fecha de actualización
      if ((task.status === 'completed' || task.completed) && task.updatedAt) {
        const completedDate = new Date(task.updatedAt);
        
        // Si la fecha está dentro del rango que nos interesa
        if (completedDate >= limitDate && completedDate <= today) {
          const dateStr = completedDate.toISOString().split('T')[0];
          
          // Incrementamos el contador para ese día
          if (activityMap[dateStr] !== undefined) {
            activityMap[dateStr]++;
          }
        }
      }
    });
    
    // Convertimos el mapa a un array de objetos {date, count}
    const activityData = Object.keys(activityMap).map(date => ({
      date,
      count: activityMap[date]
    }));
    
    return activityData;
  } catch (error) {
    console.error('Error obteniendo datos de actividad:', error);
    throw error;
  }
};

/**
 * Busca y filtra tareas según criterios
 * @param {Object} filters - Criterios de búsqueda y filtrado
 * @returns {Promise} - Promesa con las tareas encontradas
 */
export const searchTasks = async (filters = {}) => {
  try {
    // Obtenemos todas las tareas y filtramos manualmente
    const tasks = await api.get('/tasks');
    
    // Si no hay tareas o no es un array, devolvemos array vacío
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return [];
    }
    
    // Filtramos según los criterios proporcionados
    let filteredTasks = [...tasks];
    
    // Filtrar por texto (búsqueda en título y descripción)
    if (filters.query) {
      const query = filters.query.toLowerCase();
      filteredTasks = filteredTasks.filter(task => 
        (task.title && task.title.toLowerCase().includes(query)) ||
        (task.description && task.description.toLowerCase().includes(query))
      );
    }
    
    // Filtrar por estado
    if (filters.status) {
      filteredTasks = filteredTasks.filter(task => {
        if (filters.status === 'completed') {
          return task.status === 'completed' || task.completed;
        } else if (filters.status === 'pending') {
          return task.status !== 'completed' && !task.completed;
        }
        return true;
      });
    }
    
    // Filtrar por rango de fechas
    if (filters.dateRange) {
      const today = new Date();
      let startDate = new Date();
      
      // Configuramos la fecha de inicio según el rango especificado
      switch (filters.dateRange) {
        case 'today':
          startDate = new Date(today.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate.setDate(today.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(today.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(today.getFullYear() - 1);
          break;
        default:
          startDate.setDate(today.getDate() - 30); // Por defecto, último mes
      }
      
      filteredTasks = filteredTasks.filter(task => {
        const taskDate = new Date(task.createdAt || task.updatedAt || 0);
        return taskDate >= startDate && taskDate <= today;
      });
    }
    
    // Ordenamos los resultados (más recientes primero)
    filteredTasks.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.updatedAt || 0);
      const dateB = new Date(b.createdAt || b.updatedAt || 0);
      return dateB - dateA;
    });
    
    return filteredTasks;
  } catch (error) {
    console.error('Error buscando tareas:', error);
    throw error;
  }
}; 