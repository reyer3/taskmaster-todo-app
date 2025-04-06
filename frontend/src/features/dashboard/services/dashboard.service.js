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
 * Obtiene tareas que están próximas a vencer
 * @param {number} days - Número de días para considerar como "próximas"
 * @returns {Promise} - Promesa con las tareas próximas a vencer
 */
export const getUpcomingTasks = async (days = 7) => {
  try {
    const tasks = await api.get('/tasks');
    
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return [];
    }
    
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);
    
    // Filtramos tareas que no estén completadas y venzan en los próximos días
    return tasks.filter(task => {
      if (task.status === 'completed' || task.completed) {
        return false;
      }
      
      // Si no tiene fecha de vencimiento, no la consideramos
      if (!task.dueDate) {
        return false;
      }
      
      const dueDate = new Date(task.dueDate);
      return dueDate >= now && dueDate <= futureDate;
    });
  } catch (error) {
    console.error('Error obteniendo tareas próximas:', error);
    throw error;
  }
};

/**
 * Obtiene las tareas más recientes
 * @param {number} limit - Número máximo de tareas a devolver
 * @returns {Promise} - Promesa con las tareas más recientes
 */
export const getRecentTasks = async (limit = 5) => {
  try {
    const tasks = await api.get('/tasks');
    
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return [];
    }
    
    // Ordenamos por fecha de creación, las más recientes primero
    return [...tasks]
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || a.updatedAt || 0);
        const dateB = new Date(b.createdAt || b.updatedAt || 0);
        return dateB - dateA;
      })
      .slice(0, limit);
  } catch (error) {
    console.error('Error obteniendo tareas recientes:', error);
    throw error;
  }
};

/**
 * Cache para almacenar resultados de búsquedas recientes
 * Estructura: { [queryKey]: { timestamp, results } }
 */
const searchCache = {
  tasks: null,
  lastFetch: 0,
  results: {},
  cacheDuration: 60000 // 1 minuto
};

/**
 * Genera una clave única para los filtros de búsqueda
 * @param {Object} filters - Filtros aplicados
 * @returns {string} - Clave única
 */
const generateFilterKey = (filters) => {
  return JSON.stringify(filters);
};

/**
 * Verifica si los resultados en caché son válidos
 * @param {string} key - Clave de búsqueda
 * @returns {boolean} - True si la caché es válida
 */
const isCacheValid = (key) => {
  const now = Date.now();
  
  // Si no hay caché de tareas o expiró, no es válido
  if (!searchCache.tasks || now - searchCache.lastFetch > searchCache.cacheDuration) {
    return false;
  }
  
  // Si no hay resultados para esta clave, no es válido
  if (!searchCache.results[key]) {
    return false;
  }
  
  return true;
};

/**
 * Busca y filtra tareas según criterios
 * Implementa caché para mejorar rendimiento y reducir llamadas al API
 * 
 * @param {Object} filters - Criterios de búsqueda y filtrado
 * @returns {Promise} - Promesa con las tareas encontradas
 */
export const searchTasks = async (filters = {}) => {
  try {
    // Generar clave única para estos filtros
    const filterKey = generateFilterKey(filters);
    
    // Verificar caché
    if (isCacheValid(filterKey)) {
      console.log('Usando resultados en caché para:', filters);
      return searchCache.results[filterKey];
    }
    
    // Refrescar caché de tareas si es necesario
    const now = Date.now();
    if (!searchCache.tasks || now - searchCache.lastFetch > searchCache.cacheDuration) {
      console.log('Actualizando caché de tareas');
      const tasks = await api.get('/tasks');
      searchCache.tasks = Array.isArray(tasks) ? tasks : [];
      searchCache.lastFetch = now;
    }
    
    // Si no hay tareas, devolver array vacío
    if (!searchCache.tasks.length) {
      return [];
    }
    
    // Filtramos según los criterios proporcionados
    let filteredTasks = [...searchCache.tasks];
    
    // Filtrar por texto (búsqueda en título y descripción)
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase().trim();
      if (query.length > 0) {
        filteredTasks = filteredTasks.filter(task => 
          (task.title && task.title.toLowerCase().includes(query)) ||
          (task.description && task.description.toLowerCase().includes(query))
        );
      }
    }
    
    // Filtrar por estado
    if (filters.status) {
      filteredTasks = filteredTasks.filter(task => {
        if (filters.status === 'completed') {
          return task.status === 'completed' || task.completed;
        } else if (filters.status === 'pending') {
          return task.status !== 'completed' && !task.completed;
        } else if (filters.status === 'inProgress') {
          return task.status === 'inProgress';
        } else if (filters.status === 'cancelled') {
          return task.status === 'cancelled';
        }
        return true;
      });
    }
    
    // Filtrar por prioridad
    if (filters.priority) {
      filteredTasks = filteredTasks.filter(task => 
        task.priority === filters.priority
      );
    }
    
    // Filtrar por rango de fechas
    if (filters.dateRange && filters.dateRange !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let startDate = new Date(today);
      
      // Configuramos la fecha de inicio según el rango especificado
      switch (filters.dateRange) {
        case 'today':
          // startDate ya está en el inicio del día actual
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
        case 'overdue':
          // Para tareas vencidas, filtramos de manera diferente
          filteredTasks = filteredTasks.filter(task => {
            if (!task.dueDate || task.status === 'completed' || task.completed) {
              return false;
            }
            const dueDate = new Date(task.dueDate);
            return dueDate < today;
          });
          // Como ya aplicamos un filtro específico, salimos del switch
          break;
        default:
          startDate.setDate(today.getDate() - 30); // Por defecto, último mes
      }
      
      // Si no es 'overdue', aplicamos el filtro de rango de fechas
      if (filters.dateRange !== 'overdue') {
        const endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
        
        filteredTasks = filteredTasks.filter(task => {
          // Para búsqueda por fecha de creación
          const taskDate = new Date(task.createdAt || task.updatedAt || 0);
          return taskDate >= startDate && taskDate <= endDate;
        });
      }
    }
    
    // Ordenamos los resultados (más recientes primero)
    filteredTasks.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.updatedAt || 0);
      const dateB = new Date(b.createdAt || b.updatedAt || 0);
      return dateB - dateA;
    });
    
    // Guardar en caché
    searchCache.results[filterKey] = filteredTasks;
    
    return filteredTasks;
  } catch (error) {
    console.error('Error buscando tareas:', error);
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