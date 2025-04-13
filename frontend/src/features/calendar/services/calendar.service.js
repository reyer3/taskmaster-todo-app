/**
 * Servicios para la gestión del calendario y tareas por fecha
 * 
 * Este módulo proporciona funciones para obtener tareas filtradas por fechas
 * o rangos de fechas para su visualización en el calendario.
 */
import apiClient from '../../../services/api';
import { getTasks } from '../../tasks/services/tasks.service';

/**
 * Obtiene tareas por rango de fecha
 * Incluye tareas para el día actual si está dentro del rango
 * 
 * @param {Date} startDate - Fecha de inicio del rango
 * @param {Date} endDate - Fecha de fin del rango
 * @param {Object} params - Parámetros adicionales de filtrado
 * @returns {Promise<Array>} Lista de tareas dentro del rango de fechas
 */
export const getTasksByDateRange = async (startDate, endDate, params = {}) => {
  return await apiClient.get('/tasks/by-date-range', { 
    params: {
      ...params,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    }
  });
};

/**
 * Obtiene tareas para un día específico
 * 
 * @param {Date} date - Fecha para la que se quieren obtener las tareas
 * @param {Object} params - Parámetros adicionales de filtrado
 * @returns {Promise<Array>} Lista de tareas para la fecha especificada
 */
export const getTasksByDate = async (date, params = {}) => {
  const dateString = date.toISOString().split('T')[0];
  return await apiClient.get('/tasks', { 
    params: {
      ...params,
      date: dateString
    }
  });
};

/**
 * Organiza las tareas por fecha para visualización en calendario
 * 
 * @param {Array} tasks - Lista de tareas
 * @returns {Object} Objeto con tareas agrupadas por fecha
 */
export const organizeTasksByDate = (tasks) => {
  const organized = {};
  
  tasks.forEach(task => {
    if (!task.dueDate) return;
    
    const dateKey = task.dueDate.split('T')[0];
    if (!organized[dateKey]) {
      organized[dateKey] = [];
    }
    
    organized[dateKey].push(task);
  });
  
  return organized;
};

/**
 * Genera un array de días para un mes y año específicos
 * 
 * @param {number} year - Año
 * @param {number} month - Mes (0-11)
 * @returns {Array} Array de objetos fecha para el mes completo
 */
export const getCalendarDays = (year, month) => {
  const result = [];
  const date = new Date(year, month, 1);
  
  // Obtener el primer día de la semana del mes
  const firstDayOfMonth = date.getDay();
  
  // Añadir días del mes anterior para completar la primera semana
  date.setDate(0); // Último día del mes anterior
  const daysInPrevMonth = date.getDate();
  
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const prevDate = new Date(year, month - 1, day);
    result.push({
      date: prevDate,
      isCurrentMonth: false,
      isToday: isSameDay(prevDate, new Date())
    });
  }
  
  // Añadir días del mes actual
  date.setMonth(month);
  date.setDate(1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  for (let i = 1; i <= daysInMonth; i++) {
    const currentDate = new Date(year, month, i);
    result.push({
      date: currentDate,
      isCurrentMonth: true,
      isToday: isSameDay(currentDate, new Date())
    });
  }
  
  // Añadir días del mes siguiente para completar la última semana
  const lastDayOfMonth = new Date(year, month, daysInMonth).getDay();
  const daysToAdd = 6 - lastDayOfMonth;
  
  for (let i = 1; i <= daysToAdd; i++) {
    const nextDate = new Date(year, month + 1, i);
    result.push({
      date: nextDate,
      isCurrentMonth: false,
      isToday: isSameDay(nextDate, new Date())
    });
  }
  
  return result;
};

/**
 * Comprueba si dos fechas son el mismo día
 * 
 * @param {Date} date1 - Primera fecha
 * @param {Date} date2 - Segunda fecha
 * @returns {boolean} true si ambas fechas son el mismo día
 */
export const isSameDay = (date1, date2) => {
  return date1.getDate() === date2.getDate() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getFullYear() === date2.getFullYear();
}; 