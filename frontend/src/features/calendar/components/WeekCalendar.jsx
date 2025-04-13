import React from 'react';
import { isSameDay } from '../services/calendar.service';
import CalendarTask from './CalendarTask';
import { PlusCircle } from 'lucide-react';

/**
 * Componente para mostrar un calendario semanal
 * 
 * @param {Object} props
 * @param {Date} props.currentDate - Fecha actual seleccionada
 * @param {Object} props.tasks - Tareas organizadas por fecha
 * @param {Function} props.onDateSelect - Función para manejar la selección de fecha
 * @param {Function} props.onTaskSelect - Función para manejar la selección de tarea
 * @param {Function} props.onCreateTask - Función para crear una tarea en una fecha específica
 */
const WeekCalendar = ({ currentDate, tasks, onDateSelect, onTaskSelect, onCreateTask }) => {
  // Obtener los días de la semana actual
  const getWeekDays = () => {
    const date = new Date(currentDate);
    const day = date.getDay(); // 0-6, Domingo-Sábado
    const diff = date.getDate() - day;
    
    // Comenzar desde el domingo
    date.setDate(diff);
    
    const result = [];
    for (let i = 0; i < 7; i++) {
      const newDate = new Date(date);
      result.push({
        date: newDate,
        isToday: isSameDay(newDate, new Date())
      });
      date.setDate(date.getDate() + 1);
    }
    
    return result;
  };
  
  const weekDays = getWeekDays();
  
  // Días de la semana
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  
  // Obtener las tareas para un día específico
  const getTasksForDay = (date) => {
    if (!tasks) return [];
    
    const dateString = date.toISOString().split('T')[0];
    return tasks[dateString] || [];
  };
  
  // Formatear fecha
  const formatDate = (date) => {
    return date.getDate();
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="grid grid-cols-7 min-h-[750px]">
        {/* Columnas de días */}
        {weekDays.map((dayInfo, index) => {
          const { date, isToday } = dayInfo;
          const dayTasks = getTasksForDay(date);
          
          return (
            <div 
              key={index} 
              className={`border-r border-gray-200 dark:border-gray-700 last:border-r-0 ${
                isToday ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
              }`}
            >
              {/* Cabecera del día */}
              <div 
                className={`text-center p-2 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 ${
                  isToday ? 'font-bold text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className="text-sm">{dayNames[date.getDay()]}</div>
                <div className={`mt-1 inline-flex items-center justify-center h-8 w-8 rounded-full ${
                  isToday ? 'bg-indigo-600 text-white' : ''
                }`}>
                  {formatDate(date)}
                </div>
              </div>
              
              {/* Contenido del día */}
              <div 
                className="p-3 h-full relative"
                onClick={() => onDateSelect(date)}
              >
                {/* Botón para añadir tarea */}
                <button
                  className="absolute top-2 right-2 p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateTask(date);
                  }}
                  aria-label="Crear tarea"
                >
                  <PlusCircle className="h-4 w-4" />
                </button>
                
                {/* Lista de tareas del día */}
                <div className="mt-6 space-y-2">
                  {dayTasks.length === 0 ? (
                    <div className="text-center text-sm text-gray-500 p-2">
                      Sin tareas
                    </div>
                  ) : (
                    dayTasks.map((task) => (
                      <CalendarTask
                        key={task.id}
                        task={task}
                        onClick={(e) => {
                          e.stopPropagation();
                          onTaskSelect(task);
                        }}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeekCalendar; 