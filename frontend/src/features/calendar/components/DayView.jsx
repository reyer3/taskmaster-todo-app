import React from 'react';
import CalendarTask from './CalendarTask';
import { PlusCircle, Clock } from 'lucide-react';

/**
 * Componente para mostrar la vista detallada de un día
 * 
 * @param {Object} props
 * @param {Date} props.currentDate - Fecha actual seleccionada
 * @param {Object} props.tasks - Tareas organizadas por fecha
 * @param {Function} props.onTaskSelect - Función para manejar la selección de tarea
 * @param {Function} props.onCreateTask - Función para crear una tarea en la fecha actual
 */
const DayView = ({ currentDate, tasks, onTaskSelect, onCreateTask }) => {
  // Formatear fecha
  const formatDate = (date) => {
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('es-ES', options);
  };
  
  // Obtener las tareas para el día actual
  const getTasksForDay = () => {
    if (!tasks) return [];
    
    const dateString = currentDate.toISOString().split('T')[0];
    return tasks[dateString] || [];
  };
  
  const dayTasks = getTasksForDay();
  
  // Agrupar tareas por estado de completitud
  const pendingTasks = dayTasks.filter(task => !task.completed);
  const completedTasks = dayTasks.filter(task => task.completed);
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-xl font-medium">
          {formatDate(currentDate)}
        </h2>
        
        <button
          className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
          onClick={onCreateTask}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          <span>Crear tarea</span>
        </button>
      </div>
      
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium mb-4 flex items-center text-gray-700 dark:text-gray-300">
            <Clock className="h-5 w-5 mr-2 text-indigo-500" />
            Tareas pendientes
          </h3>
          
          {pendingTasks.length === 0 ? (
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md text-center text-gray-500 border border-gray-200 dark:border-gray-700">
              No hay tareas pendientes para hoy
            </div>
          ) : (
            <div className="space-y-3">
              {pendingTasks.map(task => (
                <CalendarTask
                  key={task.id}
                  task={task}
                  onClick={() => onTaskSelect(task)}
                  detailed
                />
              ))}
            </div>
          )}
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-4 flex items-center text-gray-700 dark:text-gray-300">
            <span className="mr-2 text-green-500">✓</span>
            Tareas completadas
          </h3>
          
          {completedTasks.length === 0 ? (
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md text-center text-gray-500 border border-gray-200 dark:border-gray-700">
              No hay tareas completadas para hoy
            </div>
          ) : (
            <div className="space-y-3">
              {completedTasks.map(task => (
                <CalendarTask
                  key={task.id}
                  task={task}
                  onClick={() => onTaskSelect(task)}
                  detailed
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DayView; 