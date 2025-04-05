import api from '../../../services/api';

/**
 * Simula estadísticas del dashboard (datos de ejemplo)
 */
const generateMockStats = () => ({
  totalTasks: 28,
  completedTasks: 18,
  pendingTasks: 10,
  dueSoonTasks: 5
});

/**
 * Simula tareas recientes (datos de ejemplo)
 */
const generateMockRecentTasks = (limit = 5) => {
  const mockTasks = [
    {
      id: '1',
      title: 'Completar informe de ventas',
      status: 'pending',
      dueDate: new Date(Date.now() + 86400000).toISOString(), // mañana
      priority: 'high'
    },
    {
      id: '2',
      title: 'Revisar propuesta de marketing',
      status: 'completed',
      dueDate: new Date(Date.now() - 86400000).toISOString(), // ayer
      priority: 'medium'
    },
    {
      id: '3',
      title: 'Actualizar documentación técnica',
      status: 'pending',
      dueDate: new Date(Date.now() + 172800000).toISOString(), // pasado mañana
      priority: 'low'
    },
    {
      id: '4',
      title: 'Preparar presentación para cliente',
      status: 'pending',
      dueDate: new Date(Date.now() + 259200000).toISOString(), // en 3 días
      priority: 'high'
    },
    {
      id: '5',
      title: 'Revisar tickets de soporte',
      status: 'completed',
      dueDate: new Date(Date.now() - 172800000).toISOString(), // hace 2 días
      priority: 'medium'
    },
    {
      id: '6',
      title: 'Actualizar plan de proyecto',
      status: 'pending',
      dueDate: new Date(Date.now() + 432000000).toISOString(), // en 5 días
      priority: 'medium'
    },
    {
      id: '7',
      title: 'Enviar reporte mensual',
      status: 'completed',
      dueDate: new Date(Date.now() - 259200000).toISOString(), // hace 3 días
      priority: 'high'
    }
  ];
  
  return mockTasks.slice(0, limit);
};

/**
 * Simula datos de actividad para el calendario (datos de ejemplo)
 */
const generateMockActivityData = (days = 30) => {
  const data = [];
  const today = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    
    // Genera un valor de actividad aleatorio (0-10)
    const value = Math.floor(Math.random() * 8);
    
    data.push({
      date: date.toISOString().split('T')[0],
      value
    });
  }
  
  return data;
};

/**
 * Simula resultados de búsqueda (datos de ejemplo)
 */
const generateMockSearchResults = (filters) => {
  // Genera algunas tareas base
  const allTasks = [
    {
      id: '101',
      title: 'Crear wireframes para nueva funcionalidad',
      status: 'pending',
      dueDate: new Date(Date.now() + 3 * 86400000).toISOString(),
      priority: 'medium',
      category: 'design'
    },
    {
      id: '102',
      title: 'Implementar autenticación con OAuth',
      status: 'pending',
      dueDate: new Date(Date.now() + 5 * 86400000).toISOString(),
      priority: 'high',
      category: 'development'
    },
    {
      id: '103',
      title: 'Reunión con equipo de marketing',
      status: 'completed',
      dueDate: new Date(Date.now() - 1 * 86400000).toISOString(),
      priority: 'medium',
      category: 'meetings'
    },
    {
      id: '104',
      title: 'Revisar pull requests pendientes',
      status: 'pending',
      dueDate: new Date(Date.now() + 1 * 86400000).toISOString(),
      priority: 'high',
      category: 'development'
    },
    {
      id: '105',
      title: 'Preparar plan de lanzamiento',
      status: 'completed',
      dueDate: new Date(Date.now() - 3 * 86400000).toISOString(),
      priority: 'high',
      category: 'planning'
    }
  ];
  
  // Aplica filtros si existen
  let filteredTasks = [...allTasks];
  
  if (filters) {
    if (filters.status) {
      filteredTasks = filteredTasks.filter(task => task.status === filters.status);
    }
    
    if (filters.priority) {
      filteredTasks = filteredTasks.filter(task => task.priority === filters.priority);
    }
    
    if (filters.category) {
      filteredTasks = filteredTasks.filter(task => task.category === filters.category);
    }
    
    // Filtro por rango de fechas
    if (filters.dateRange) {
      const now = new Date();
      let dateLimit;
      
      switch (filters.dateRange) {
        case 'today':
          dateLimit = new Date(now.setHours(0, 0, 0, 0));
          filteredTasks = filteredTasks.filter(task => new Date(task.dueDate) >= dateLimit);
          break;
        case 'week':
          dateLimit = new Date(now);
          dateLimit.setDate(now.getDate() - 7);
          filteredTasks = filteredTasks.filter(task => new Date(task.dueDate) >= dateLimit);
          break;
        case 'month':
          dateLimit = new Date(now);
          dateLimit.setMonth(now.getMonth() - 1);
          filteredTasks = filteredTasks.filter(task => new Date(task.dueDate) >= dateLimit);
          break;
      }
    }
  }
  
  return filteredTasks;
};

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